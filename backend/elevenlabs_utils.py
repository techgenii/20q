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

# ElevenLabs TTS Utilities for 20Q Game
import os
import requests
import base64

# Optional: use dotenv only locally
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# ElevenLabs configuration
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
ELEVENLABS_VOICE_ID = os.getenv("ELEVENLABS_VOICE_ID", "9BWtsMINqrJLrRacOk9x")

# ElevenLabs API configuration
ELEVENLABS_BASE_URL = os.getenv("ELEVENLABS_BASE_URL")

# Voice settings for different contexts
VOICE_SETTINGS = {
    "game_host": {
        "stability": 0.7,
        "similarity_boost": 0.8,
        "style": 0.2,
        "use_speaker_boost": True,
    },
    "quick_response": {
        "stability": 0.5,
        "similarity_boost": 0.5,
        "style": 0.0,
        "use_speaker_boost": False,
    },
    "dramatic": {
        "stability": 0.8,
        "similarity_boost": 0.9,
        "style": 0.5,
        "use_speaker_boost": True,
    },
}


def is_tts_available():
    """Check if ElevenLabs TTS is properly configured"""
    return bool(ELEVENLABS_API_KEY)


def generate_speech(
    text, voice_id=None, model_id="eleven_turbo_v2", context="quick_response"
):
    """
    Generate speech using ElevenLabs API with context-aware settings

    Args:
        text (str): Text to convert to speech
        voice_id (str): ElevenLabs voice ID (optional)
        model_id (str): ElevenLabs model ID
        context (str): Context for voice settings ("game_host", "quick_response", "dramatic")

    Returns:
        bytes: Audio data as bytes, or None if failed
    """
    if not is_tts_available():
        print("ElevenLabs API key not found. Speech generation disabled.")
        return None

    if not voice_id:
        voice_id = ELEVENLABS_VOICE_ID

    # Get voice settings based on context
    voice_settings = VOICE_SETTINGS.get(context, VOICE_SETTINGS["quick_response"])

    url = f"{ELEVENLABS_BASE_URL}/text-to-speech/{voice_id}"

    headers = {
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": ELEVENLABS_API_KEY,
    }

    data = {"text": text, "model_id": model_id, "voice_settings": voice_settings}

    try:
        response = requests.post(url, json=data, headers=headers, timeout=30)
        if response.status_code == 200:
            return response.content
        else:
            print(f"ElevenLabs API error: {response.status_code} - {response.text}")
            return None
    except requests.exceptions.Timeout:
        print("ElevenLabs API timeout")
        return None
    except Exception as e:
        print(f"Error generating speech: {e}")
        return None


def generate_speech_base64(
    text, voice_id=None, model_id="eleven_turbo_v2", context="quick_response"
):
    """
    Generate speech and return as base64 string

    Returns:
        str: Base64 encoded audio, or None if failed
    """
    audio_data = generate_speech(text, voice_id, model_id, context)
    if audio_data:
        return base64.b64encode(audio_data).decode("utf-8")
    return None


def get_available_voices():
    """Get list of available voices from ElevenLabs"""
    if not is_tts_available():
        return []

    url = f"{ELEVENLABS_BASE_URL}/voices"
    headers = {"xi-api-key": ELEVENLABS_API_KEY}

    try:
        response = requests.get(url, headers=headers, timeout=10)
        if response.status_code == 200:
            voices_data = response.json().get("voices", [])
            # Return simplified voice info
            return [
                {
                    "voice_id": voice["voice_id"],
                    "name": voice["name"],
                    "category": voice.get("category", "Unknown"),
                    "description": voice.get("description", ""),
                    "preview_url": voice.get("preview_url"),
                }
                for voice in voices_data
            ]
        else:
            print(f"Error fetching voices: {response.status_code}")
            return []
    except Exception as e:
        print(f"Error fetching voices: {e}")
        return []


def get_voice_info(voice_id):
    """Get information about a specific voice"""
    if not is_tts_available():
        return None

    url = f"{ELEVENLABS_BASE_URL}/voices/{voice_id}"
    headers = {"xi-api-key": ELEVENLABS_API_KEY}

    try:
        response = requests.get(url, headers=headers, timeout=10)
        if response.status_code == 200:
            return response.json()
        else:
            print(f"Error fetching voice info: {response.status_code}")
            return None
    except Exception as e:
        print(f"Error fetching voice info: {e}")
        return None


def get_user_subscription_info():
    """Get user's ElevenLabs subscription information"""
    if not is_tts_available():
        return None

    url = f"{ELEVENLABS_BASE_URL}/user/subscription"
    headers = {"xi-api-key": ELEVENLABS_API_KEY}

    try:
        response = requests.get(url, headers=headers, timeout=10)
        if response.status_code == 200:
            return response.json()
        else:
            print(f"Error fetching subscription info: {response.status_code}")
            return None
    except Exception as e:
        print(f"Error fetching subscription info: {e}")
        return None


# Game-specific TTS messages
GAME_MESSAGES = {
    "welcome": "Welcome to Whisper Chase: 20 Questions! I'm thinking of something. You have 20 questions to guess what it is. Good luck!",
    "welcome_with_difficulty": "Welcome to Whisper Chase: 20 Questions! I'm thinking of something with difficulty level {difficulty}. You have 20 questions to guess what it is. Good luck!",
    "correct_guess": "Congratulations! You guessed correctly! The answer was {word}.",
    "incorrect_guess": "Sorry, that's not correct. Keep trying!",
    "game_over_lose": "Game over! You've used all 20 questions. The answer was {word}. Better luck next time!",
    "questions_remaining": "You have {count} questions remaining.",
    "final_question": "This is your final question! Make it count!",
    "halfway_point": "You're halfway through! You have 10 questions left.",
}


def generate_game_message_audio(message_type, voice_id=None, **kwargs):
    """
    Generate audio for common game messages

    Args:
        message_type (str): Type of message from GAME_MESSAGES
        voice_id (str): Voice ID to use
        **kwargs: Variables to format into the message

    Returns:
        str: Base64 encoded audio, or None if failed
    """
    if message_type not in GAME_MESSAGES:
        return None

    message = GAME_MESSAGES[message_type].format(**kwargs)
    context = (
        "game_host"
        if message_type == "welcome" or message_type == "welcome_with_difficulty"
        else "quick_response"
    )

    return generate_speech_base64(message, voice_id, context=context)


# Async version for better performance (optional)
try:
    import asyncio
    import aiohttp

    async def generate_speech_async(
        text, voice_id=None, model_id="eleven_turbo_v2", context="quick_response"
    ):
        """Async version of generate_speech for better performance"""
        if not is_tts_available():
            return None

        if not voice_id:
            voice_id = ELEVENLABS_VOICE_ID

        voice_settings = VOICE_SETTINGS.get(context, VOICE_SETTINGS["quick_response"])
        url = f"{ELEVENLABS_BASE_URL}/text-to-speech/{voice_id}"

        headers = {
            "Accept": "audio/mpeg",
            "Content-Type": "application/json",
            "xi-api-key": ELEVENLABS_API_KEY,
        }

        data = {"text": text, "model_id": model_id, "voice_settings": voice_settings}

        try:
            async with aiohttp.ClientSession(
                timeout=aiohttp.ClientTimeout(total=30)
            ) as session:
                async with session.post(url, json=data, headers=headers) as response:
                    if response.status == 200:
                        return await response.read()
                    else:
                        error_text = await response.text()
                        print(f"ElevenLabs API error: {response.status} - {error_text}")
                        return None
        except asyncio.TimeoutError:
            print("ElevenLabs API timeout")
            return None
        except Exception as e:
            print(f"Error generating speech: {e}")
            return None

except ImportError:
    # aiohttp not available, async functions won't work
    pass
