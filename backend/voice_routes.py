# This file is part of 20Q.
#
# Copyright (C) 2025  Trailyn Ventures, LLC
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program.  If not, see <https://www.gnu.org/licenses/>.

import io
import os
import requests
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from typing import Optional
from fastapi.responses import StreamingResponse

# Import your models, Supabase utils, etc.
from models import TextToSpeechRequest, VoiceSettings, AskQuestionRequest, VoiceResponse
from auth_routes import get_current_user
from game_logic import ask_openai_question, get_game, increment_questions_asked, record_question

router = APIRouter()

# Add these voice-related endpoints to your FastAPI app


@router.post("/voice/text-to-speech")
async def text_to_speech(
    request: TextToSpeechRequest, current_user=Depends(get_current_user)
):
    """
    Convert text to speech using ElevenLabs API
    """
    try:
        elevenlabs_api_key = os.getenv("ELEVENLABS_API_KEY")
        if not elevenlabs_api_key:
            raise HTTPException(
                status_code=500, detail="ElevenLabs API key not configured"
            )

        # Prepare the request to ElevenLabs
        url = f"https://api.elevenlabs.io/v1/text-to-speech/{request.voice_settings.voice_id}"

        headers = {
            "Accept": "audio/mpeg",
            "Content-Type": "application/json",
            "xi-api-key": elevenlabs_api_key,
        }

        data = {
            "text": request.text,
            "model_id": "eleven_monolingual_v1",
            "voice_settings": {
                "stability": request.voice_settings.stability,
                "similarity_boost": request.voice_settings.similarity_boost,
                "use_speaker_boost": request.voice_settings.use_speaker_boost,
            },
        }

        # Make request to ElevenLabs
        response = requests.post(url, json=data, headers=headers)

        if response.status_code != 200:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"ElevenLabs API error: {response.text}",
            )

        # Return the audio as a streaming response
        audio_stream = io.BytesIO(response.content)

        return StreamingResponse(
            io.BytesIO(response.content),
            media_type="audio/mpeg",
            headers={"Content-Disposition": "attachment; filename=speech.mp3"},
        )

    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Text-to-speech conversion failed: {str(e)}"
        )


@router.get("/voice/voices")
async def get_available_voices(current_user=Depends(get_current_user)):
    """
    Get available voices from ElevenLabs
    """
    try:
        elevenlabs_api_key = os.getenv("ELEVENLABS_API_KEY")
        if not elevenlabs_api_key:
            raise HTTPException(
                status_code=500, detail="ElevenLabs API key not configured"
            )

        url = "https://api.elevenlabs.io/v1/voices"
        headers = {"xi-api-key": elevenlabs_api_key}

        response = requests.get(url, headers=headers)

        if response.status_code != 200:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"ElevenLabs API error: {response.text}",
            )

        voices_data = response.json()

        # Format the response
        voices = []
        for voice in voices_data.get("voices", []):
            voices.append(
                VoiceResponse(
                    voice_id=voice["voice_id"],
                    name=voice["name"],
                    category=voice.get("category", "Unknown"),
                    description=voice.get("description"),
                )
            )

        return {"voices": voices}

    except Exception as e:
        raise HTTPException(status_code=500, 
                            detail=f"Failed to fetch voices: {str(e)}")


@router.post("/voice/speech-to-text")
async def speech_to_text(
    audio_file: UploadFile = File(...), current_user=Depends(get_current_user)
):
    """
    Convert speech to text using OpenAI Whisper API
    Note: You'll need OpenAI API key for this endpoint
    """
    try:
        openai_api_key = os.getenv("OPENAI_API_KEY")
        if not openai_api_key:
            raise HTTPException(status_code=500, detail="OpenAI API key not configured")

        # Read the uploaded audio file
        audio_content = await audio_file.read()

        # Prepare the request to OpenAI Whisper
        url = "https://api.openai.com/v1/audio/transcriptions"

        headers = {"Authorization": f"Bearer {openai_api_key}"}

        files = {
            "file": (audio_file.filename, audio_content, audio_file.content_type),
            "model": (None, "whisper-1"),
            "language": (None, "en"),
        }

        response = requests.post(url, headers=headers, files=files)

        if response.status_code != 200:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"OpenAI API error: {response.text}",
            )

        transcription = response.json()

        return {"transcription": transcription.get("text", "")}

    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Speech-to-text conversion failed: {str(e)}"
        )


# Enhanced game endpoints with voice responses
@router.post("/ask_question_voice")
async def api_ask_question_voice(
    req: AskQuestionRequest,
    voice_settings: Optional[VoiceSettings] = VoiceSettings(),
    current_user=Depends(get_current_user),
):
    """
    Ask a question and get both text and audio response
    """
    try:
        game = get_game(req.game_id)
        if game["status"] != "playing":
            return {"error": "Game is not active"}

        # Get the answer
        answer = ask_openai_question(game["secret_word"], req.question)
        question_number = increment_questions_asked(req.game_id)
        record_question(
            req.game_id, current_user.id, req.question, answer, question_number
        )

        # Generate audio response
        elevenlabs_api_key = os.getenv("ELEVENLABS_API_KEY")
        if elevenlabs_api_key:
            try:
                # Convert answer to speech
                url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_settings.voice_id}"

                headers = {
                    "Accept": "audio/mpeg",
                    "Content-Type": "application/json",
                    "xi-api-key": elevenlabs_api_key,
                }

                data = {
                    "text": answer,
                    "model_id": "eleven_monolingual_v1",
                    "voice_settings": {
                        "stability": voice_settings.stability,
                        "similarity_boost": voice_settings.similarity_boost,
                        "use_speaker_boost": voice_settings.use_speaker_boost,
                    },
                }

                audio_response = requests.post(url, json=data, headers=headers)

                if audio_response.status_code == 200:
                    # Encode audio as base64 for JSON response
                    import base64

                    audio_base64 = base64.b64encode(audio_response.content).decode(
                        "utf-8"
                    )

                    return {
                        "answer": answer,
                        "question_number": question_number,
                        "audio": audio_base64,
                        "audio_format": "mp3",
                    }

            except Exception as audio_error:
                print(f"Audio generation failed: {audio_error}")
                # Fall back to text-only response
                pass

        return {"answer": answer, "question_number": question_number, "audio": None}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Voice-enabled game settings
@router.post("/game/{game_id}/voice-settings")
async def update_game_voice_settings(
    game_id: str, voice_settings: VoiceSettings, current_user=Depends(get_current_user)
):
    """
    Update voice settings for a game
    """
    try:
        # You might want to store these settings in your database
        # For now, we'll just validate and return them
        return {
            "game_id": game_id,
            "voice_settings": voice_settings,
            "message": "Voice settings updated successfully",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Add other voice endpoints as needed