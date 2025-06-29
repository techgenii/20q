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
import logging
from typing import Optional
from datetime import datetime

import requests
from fastapi import Depends, FastAPI, File, HTTPException, UploadFile, status
from fastapi.responses import StreamingResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum
from pydantic import BaseModel, EmailStr

from game_logic import ask_openai_question, get_game, increment_questions_asked, join_game, make_guess, record_question, start_game, get_remaining_slots
from supabase_client import get_supabase_client, get_supabase_auth_client

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

logger.info("Lambda cold start: app.py successfully loaded")

# Initialize FastAPI app
app = FastAPI(title="Whisper Chase: 20 Questions")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this properly for production
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()


# Authentication Models
class UserSignUp(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: str
    email: str
    full_name: Optional[str] = None
    created_at: str
    avatar_url: Optional[str] = None
    last_login_at: Optional[str] = None
    bio: Optional[str] = None
    favorite_category: Optional[str] = None
    achievements: Optional[list] = []


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse


# Add these models to your existing Pydantic models
class VoiceSettings(BaseModel):
    voice_id: Optional[str] = "pNInz6obpgDQGcFmaJgB"  # Default ElevenLabs voice
    stability: Optional[float] = 0.5
    similarity_boost: Optional[float] = 0.5
    use_speaker_boost: Optional[bool] = True


class TextToSpeechRequest(BaseModel):
    text: str
    voice_settings: Optional[VoiceSettings] = VoiceSettings()


class VoiceResponse(BaseModel):
    voice_id: str
    name: str
    category: str
    description: Optional[str] = None


# Game Models (existing)
class StartGameRequest(BaseModel):
    difficulty: int = None
    game_type: Optional[str] = None
    max_players: Optional[int] = None
    guessed_word: Optional[str] = None


class JoinGameRequest(BaseModel):
    game_id: str


class AskQuestionRequest(BaseModel):
    game_id: str
    question: str


class MakeGuessRequest(BaseModel):
    game_id: str
    guess: str


# Authentication dependency
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    """
    Verify JWT token and get current user
    """
    token = credentials.credentials

    try:
        # Verify token with Supabase
        user = get_supabase_auth_client().auth.get_user(token)
        if not user.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return user.user
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication credentials, {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


# Optional authentication dependency (for endpoints that can work with or without auth)
async def get_current_user_optional(
    credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer(auto_error=False)),
):
    """
    Optional authentication - returns user if authenticated, None otherwise
    """
    if credentials is None:
        return None

    try:
        user = get_supabase_auth_client().auth.get_user(credentials.credentials)
        return user.user if user.user else None
    except:
        return None


# Authentication Routes
@app.post("/auth/signup", response_model=TokenResponse)
async def sign_up(user_data: UserSignUp):
    """
    Register a new user
    """
    try:
        # Sign up user with Supabase
        response = get_supabase_auth_client().auth.sign_up(
            {
                "email": user_data.email,
                "password": user_data.password,
                "options": {"data": {"full_name": user_data.full_name}},
            }
        )

        if response.user is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User registration failed",
            )

        # Insert user into players table for FK constraint
        get_supabase_client().table("players").insert(
            {
                "id": response.user.id,
                "email": response.user.email,
                "username": response.user.user_metadata.get("full_name"),
                "avatar_url": None,
                "last_login_at": response.user.created_at.isoformat(),
                "bio": None,
                "favorite_category": None,
                "achievements": [],
            }
        ).execute()

        # Fetch the player record to get all fields
        player = (
            get_supabase_client()
            .table("players")
            .select("avatar_url, last_login_at, bio, favorite_category, achievements")
            .eq("id", response.user.id)
            .single()
            .execute()
            .data
            or {}
        )
        user_response = UserResponse(
            id=response.user.id,
            email=response.user.email,
            full_name=response.user.user_metadata.get("full_name"),
            created_at=response.user.created_at.isoformat(),
            avatar_url=player.get("avatar_url"),
            last_login_at=player.get("last_login_at"),
            bio=player.get("bio"),
            favorite_category=player.get("favorite_category"),
            achievements=player.get("achievements", []),
        )

        return TokenResponse(
            access_token=response.session.access_token,
            token_type="bearer",
            user=user_response,
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"User Registration failed: {str(e)}",
        )


@app.post("/auth/login", response_model=TokenResponse)
async def login(user_credentials: UserLogin):
    """
    Login user and return access token
    """
    try:
        # Sign in user with Supabase
        response = get_supabase_auth_client().auth.sign_in_with_password(
            {"email": user_credentials.email, "password": user_credentials.password}
        )

        if response.user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )

        # Update last_login_at to now
        now_iso = datetime.now(datetime.UTC).isoformat()
        get_supabase_client().table("players").update({"last_login_at": now_iso}).eq("id", response.user.id).execute()

        # Fetch the updated player record
        player = (
            get_supabase_client()
            .table("players")
            .select("avatar_url, last_login_at, bio, favorite_category, achievements")
            .eq("id", response.user.id)
            .single()
            .execute()
            .data
            or {}
        )
        user_response = UserResponse(
            id=response.user.id,
            email=response.user.email,
            full_name=response.user.user_metadata.get("full_name"),
            created_at=response.user.created_at.isoformat(),
            avatar_url=player.get("avatar_url"),
            last_login_at=player.get("last_login_at"),
            bio=player.get("bio"),
            favorite_category=player.get("favorite_category"),
            achievements=player.get("achievements", []),
        )

        return TokenResponse(
            access_token=response.session.access_token,
            token_type="bearer",
            user=user_response,
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail=f"Invalid email or password, {str(e)}"
        )


@app.post("/auth/logout")
async def logout(current_user=Depends(get_current_user)):
    """
    Logout current user
    """
    try:
        get_supabase_auth_client().auth.sign_out()
        return {"message": "Successfully logged out"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail=f"Logout failed: {str(e)}"
        )


@app.get("/auth/me", response_model=UserResponse)
async def get_current_user_info(current_user=Depends(get_current_user)):
    """
    Get current user information
    """
    try:
        # Fetch the complete player record from database
        player = (
            get_supabase_client()
            .table("players")
            .select("avatar_url, last_login_at, bio, favorite_category, achievements")
            .eq("id", current_user.id)
            .single()
            .execute()
            .data
            or {}
        )
        
        return UserResponse(
            id=current_user.id,
            email=current_user.email,
            full_name=current_user.user_metadata.get("full_name"),
            created_at=current_user.created_at.isoformat(),
            avatar_url=player.get("avatar_url"),
            last_login_at=player.get("last_login_at"),
            bio=player.get("bio"),
            favorite_category=player.get("favorite_category"),
            achievements=player.get("achievements", []),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch user information: {str(e)}"
        )


@app.post("/auth/reset-password")
async def reset_password(email: EmailStr):
    """
    Send password reset email
    """
    try:
        get_supabase_auth_client().auth.reset_password_email(email)
        return {"message": "Password reset email sent"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Password reset failed: {str(e)}",
        )


# Game Routes (Updated with Authentication, join a game immediately after you start a game)
@app.post("/start_game")
def api_start_game(req: StartGameRequest, current_user=Depends(get_current_user)):
    """
    Start a new game (requires authentication)
    """
    try:
        # Use the authenticated user's ID as the host player ID
        game = start_game(
            current_user.id,
            req.difficulty,
            game_type=req.game_type,
            max_players=req.max_players,
            guessed_word=req.guessed_word,
        )
        return {
            "game_id": game["id"],
            "secret_word": "hidden_for_players",
            "host_player_id": current_user.id,
            "game_type": game.get("game_type"),
            "max_players": game.get("max_players"),
            "guessed_word": game.get("guessed_word"),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/join_game")
def api_join_game(req: JoinGameRequest, current_user=Depends(get_current_user)):
    """
    Join an existing game (requires authentication)
    """
    try:
        # Use the authenticated user's ID as the player ID
        participant = join_game(req.game_id, current_user.id)
        remaining_slots = get_remaining_slots(req.game_id)
        return {**participant, "remaining_slots": remaining_slots}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/ask_question")
def api_ask_question(req: AskQuestionRequest, current_user=Depends(get_current_user)):
    """
    Ask a question in the game (requires authentication)
    """
    try:
        game = get_game(req.game_id)
        if game["status"] != "playing":
            return {"error": "Game is not active"}

        # Use the authenticated user's ID as the player ID
        answer = ask_openai_question(game["secret_word"], req.question)
        question_number = increment_questions_asked(req.game_id)
        record_question(
            req.game_id, current_user.id, req.question, answer, question_number
        )

        return {"answer": answer, "question_number": question_number}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/make_guess")
def api_make_guess(req: MakeGuessRequest, current_user=Depends(get_current_user)):
    """
    Make a guess in the game (requires authentication)
    """
    try:
        game = get_game(req.game_id)
        if game["status"] != "playing":
            return {"error": "Game is not active"}

        # Use the authenticated user's ID as the player ID
        correct = make_guess(req.game_id, current_user.id, req.guess)
        return {"correct": correct, "player_id": current_user.id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Public game information endpoint (no auth required)
@app.get("/game/{game_id}")
def api_get_game(game_id: str, current_user=Depends(get_current_user_optional)):
    """
    Get game information (optional authentication for enhanced info)
    """
    try:
        game = get_game(game_id)
        # Remove sensitive information for non-authenticated users
        if current_user is None:
            game.pop("secret_word", None)
        return game
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Add these voice-related endpoints to your FastAPI app


@app.post("/voice/text-to-speech")
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


@app.get("/voice/voices")
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


@app.post("/voice/speech-to-text")
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
@app.post("/ask_question_voice")
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
@app.post("/game/{game_id}/voice-settings")
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


# Root Check
@app.get("/")
async def root():
    logger.info("Root endpoint called")
    return {
        "message": "Hello from WhisperChase Game API with Auth on Lambda!",
        "status": "healthy",
        "version": "1.0.0"
    }

# Health checks
@app.get("/health")
def health_check():
    logger.info("Health endpoint called")
    return {"status": "healthy"}

# Lambda handler with enhanced logging
def handler(event, context):
    logger.info(f"Lambda invoked with event: {event}")
    
    try:
        # Use Mangum to handle the FastAPI app
        mangum_handler = Mangum(app)
        response = mangum_handler(event, context)
        logger.info(f"Lambda response: {response}")
        print(f"Lambda response: {response}")
        return response
    except Exception as e:
        logger.error(f"Lambda handler error: {str(e)}")
        print(f"Lambda handler error: {str(e)}")
        raise
