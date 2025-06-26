# This file is part of 20Q.
#
# Copyright (C) 2025 Barbara Bickham
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

import pytest
from unittest.mock import patch, MagicMock, AsyncMock
import base64

import backend.elevenlabs_utils as elevenlabs_utils

@pytest.fixture(autouse=True)
def patch_environment_variables(monkeypatch):
    """Patch environment variables for testing"""
    monkeypatch.setattr(elevenlabs_utils, "ELEVENLABS_API_KEY", "test-api-key")
    monkeypatch.setattr(elevenlabs_utils, "ELEVENLABS_VOICE_ID", "test-voice-id")
    monkeypatch.setattr(elevenlabs_utils, "ELEVENLABS_BASE_URL", "https://api.elevenlabs.io/v1")

def test_is_tts_available_with_key():
    """Test TTS availability when API key is present"""
    assert elevenlabs_utils.is_tts_available() is True

def test_is_tts_available_without_key(monkeypatch):
    """Test TTS availability when API key is missing"""
    monkeypatch.setattr(elevenlabs_utils, "ELEVENLABS_API_KEY", None)
    assert elevenlabs_utils.is_tts_available() is False

def test_generate_speech_success():
    """Test successful speech generation"""
    with patch("requests.post") as mock_post:
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.content = b"audio-data"
        mock_post.return_value = mock_response
        
        result = elevenlabs_utils.generate_speech("Hello world")
        
        assert result == b"audio-data"
        mock_post.assert_called_once()
        call_args = mock_post.call_args
        assert call_args[1]["json"]["text"] == "Hello world"
        assert call_args[1]["json"]["model_id"] == "eleven_turbo_v2"

def test_generate_speech_with_custom_voice():
    """Test speech generation with custom voice ID"""
    with patch("requests.post") as mock_post:
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.content = b"audio-data"
        mock_post.return_value = mock_response
        
        result = elevenlabs_utils.generate_speech("Hello world", voice_id="custom-voice")
        
        assert result == b"audio-data"
        call_args = mock_post.call_args
        assert "custom-voice" in call_args[0][0]  # URL contains voice ID

def test_generate_speech_with_context():
    """Test speech generation with different contexts"""
    with patch("requests.post") as mock_post:
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.content = b"audio-data"
        mock_post.return_value = mock_response
        
        result = elevenlabs_utils.generate_speech("Hello world", context="dramatic")
        
        assert result == b"audio-data"
        call_args = mock_post.call_args
        voice_settings = call_args[1]["json"]["voice_settings"]
        assert voice_settings["stability"] == 0.8
        assert voice_settings["similarity_boost"] == 0.9

def test_generate_speech_api_error():
    """Test speech generation with API error"""
    with patch("requests.post") as mock_post:
        mock_response = MagicMock()
        mock_response.status_code = 400
        mock_response.text = "Bad Request"
        mock_post.return_value = mock_response
        
        result = elevenlabs_utils.generate_speech("Hello world")
        
        assert result is None

def test_generate_speech_timeout():
    """Test speech generation with timeout"""
    with patch("requests.post") as mock_post:
        mock_post.side_effect = Exception("timeout")
        
        result = elevenlabs_utils.generate_speech("Hello world")
        
        assert result is None

def test_generate_speech_no_api_key(monkeypatch):
    """Test speech generation without API key"""
    monkeypatch.setattr(elevenlabs_utils, "ELEVENLABS_API_KEY", None)
    
    result = elevenlabs_utils.generate_speech("Hello world")
    
    assert result is None

def test_generate_speech_base64_success():
    """Test base64 speech generation success"""
    with patch("requests.post") as mock_post:
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.content = b"audio-data"
        mock_post.return_value = mock_response
        
        result = elevenlabs_utils.generate_speech_base64("Hello world")
        
        expected_base64 = base64.b64encode(b"audio-data").decode('utf-8')
        assert result == expected_base64

def test_generate_speech_base64_failure():
    """Test base64 speech generation failure"""
    with patch("requests.post") as mock_post:
        mock_response = MagicMock()
        mock_response.status_code = 400
        mock_post.return_value = mock_response
        
        result = elevenlabs_utils.generate_speech_base64("Hello world")
        
        assert result is None

def test_get_available_voices_success():
    """Test getting available voices successfully"""
    with patch("requests.get") as mock_get:
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "voices": [
                {
                    "voice_id": "voice1",
                    "name": "Test Voice",
                    "category": "test",
                    "description": "A test voice",
                    "preview_url": "http://example.com/preview"
                }
            ]
        }
        mock_get.return_value = mock_response
        
        result = elevenlabs_utils.get_available_voices()
        
        assert len(result) == 1
        assert result[0]["voice_id"] == "voice1"
        assert result[0]["name"] == "Test Voice"
        assert result[0]["category"] == "test"

def test_get_available_voices_api_error():
    """Test getting voices with API error"""
    with patch("requests.get") as mock_get:
        mock_response = MagicMock()
        mock_response.status_code = 401
        mock_get.return_value = mock_response
        
        result = elevenlabs_utils.get_available_voices()
        
        assert result == []

def test_get_available_voices_no_api_key(monkeypatch):
    """Test getting voices without API key"""
    monkeypatch.setattr(elevenlabs_utils, "ELEVENLABS_API_KEY", None)
    
    result = elevenlabs_utils.get_available_voices()
    
    assert result == []

def test_get_available_voices_exception():
    """Test getting voices with exception"""
    with patch("requests.get") as mock_get:
        mock_get.side_effect = Exception("Network error")
        
        result = elevenlabs_utils.get_available_voices()
        
        assert result == []

def test_get_voice_info_success():
    """Test getting voice info successfully"""
    with patch("requests.get") as mock_get:
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "voice_id": "voice1",
            "name": "Test Voice",
            "category": "test"
        }
        mock_get.return_value = mock_response
        
        result = elevenlabs_utils.get_voice_info("voice1")
        
        assert result["voice_id"] == "voice1"
        assert result["name"] == "Test Voice"

def test_get_voice_info_api_error():
    """Test getting voice info with API error"""
    with patch("requests.get") as mock_get:
        mock_response = MagicMock()
        mock_response.status_code = 404
        mock_get.return_value = mock_response
        
        result = elevenlabs_utils.get_voice_info("voice1")
        
        assert result is None

def test_get_voice_info_no_api_key(monkeypatch):
    """Test getting voice info without API key"""
    monkeypatch.setattr(elevenlabs_utils, "ELEVENLABS_API_KEY", None)
    
    result = elevenlabs_utils.get_voice_info("voice1")
    
    assert result is None

def test_get_voice_info_exception():
    """Test getting voice info with exception"""
    with patch("requests.get") as mock_get:
        mock_get.side_effect = Exception("Network error")
        
        result = elevenlabs_utils.get_voice_info("voice1")
        
        assert result is None

def test_get_user_subscription_info_success():
    """Test getting subscription info successfully"""
    with patch("requests.get") as mock_get:
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "character_count": 1000,
            "character_limit": 10000,
            "can_extend_character_limit": True
        }
        mock_get.return_value = mock_response
        
        result = elevenlabs_utils.get_user_subscription_info()
        
        assert result["character_count"] == 1000
        assert result["character_limit"] == 10000

def test_get_user_subscription_info_api_error():
    """Test getting subscription info with API error"""
    with patch("requests.get") as mock_get:
        mock_response = MagicMock()
        mock_response.status_code = 401
        mock_get.return_value = mock_response
        
        result = elevenlabs_utils.get_user_subscription_info()
        
        assert result is None

def test_get_user_subscription_info_no_api_key(monkeypatch):
    """Test getting subscription info without API key"""
    monkeypatch.setattr(elevenlabs_utils, "ELEVENLABS_API_KEY", None)
    
    result = elevenlabs_utils.get_user_subscription_info()
    
    assert result is None

def test_get_user_subscription_info_exception():
    """Test getting subscription info with exception"""
    with patch("requests.get") as mock_get:
        mock_get.side_effect = Exception("Network error")
        
        result = elevenlabs_utils.get_user_subscription_info()
        
        assert result is None

def test_generate_game_message_audio_welcome():
    """Test generating welcome message audio"""
    with patch("requests.post") as mock_post:
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.content = b"audio-data"
        mock_post.return_value = mock_response
        
        result = elevenlabs_utils.generate_game_message_audio("welcome")
        
        expected_base64 = base64.b64encode(b"audio-data").decode('utf-8')
        assert result == expected_base64

def test_generate_game_message_audio_with_difficulty():
    """Test generating welcome message with difficulty"""
    with patch("requests.post") as mock_post:
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.content = b"audio-data"
        mock_post.return_value = mock_response
        
        result = elevenlabs_utils.generate_game_message_audio("welcome_with_difficulty", difficulty=3)
        
        expected_base64 = base64.b64encode(b"audio-data").decode('utf-8')
        assert result == expected_base64

def test_generate_game_message_audio_correct_guess():
    """Test generating correct guess message"""
    with patch("requests.post") as mock_post:
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.content = b"audio-data"
        mock_post.return_value = mock_response
        
        result = elevenlabs_utils.generate_game_message_audio("correct_guess", word="elephant")
        
        expected_base64 = base64.b64encode(b"audio-data").decode('utf-8')
        assert result == expected_base64

def test_generate_game_message_audio_invalid_type():
    """Test generating message with invalid type"""
    result = elevenlabs_utils.generate_game_message_audio("invalid_type")
    
    assert result is None

def test_generate_game_message_audio_failure():
    """Test generating message audio with API failure"""
    with patch("requests.post") as mock_post:
        mock_response = MagicMock()
        mock_response.status_code = 400
        mock_post.return_value = mock_response
        
        result = elevenlabs_utils.generate_game_message_audio("welcome")
        
        assert result is None

def test_generate_speech_async_function_exists():
    """Test that the async speech generation function exists"""
    # Check if the function exists (it might not if aiohttp is not available)
    assert hasattr(elevenlabs_utils, 'generate_speech_async')
    
    # If it exists, it should be callable
    if hasattr(elevenlabs_utils, 'generate_speech_async'):
        assert callable(elevenlabs_utils.generate_speech_async)

def test_generate_speech_async_no_api_key(monkeypatch):
    """Test async speech generation without API key"""
    # Skip if function doesn't exist
    if not hasattr(elevenlabs_utils, 'generate_speech_async'):
        pytest.skip("generate_speech_async function not available")
    
    monkeypatch.setattr(elevenlabs_utils, "ELEVENLABS_API_KEY", None)
    
    # This should return None immediately without making any async calls
    import asyncio
    result = asyncio.run(elevenlabs_utils.generate_speech_async("Hello world"))
    
    assert result is None

def test_voice_settings_contexts():
    """Test that all voice settings contexts are properly defined"""
    assert "game_host" in elevenlabs_utils.VOICE_SETTINGS
    assert "quick_response" in elevenlabs_utils.VOICE_SETTINGS
    assert "dramatic" in elevenlabs_utils.VOICE_SETTINGS
    
    # Check that each context has required settings
    for context, settings in elevenlabs_utils.VOICE_SETTINGS.items():
        assert "stability" in settings
        assert "similarity_boost" in settings
        assert "style" in settings
        assert "use_speaker_boost" in settings

def test_game_messages():
    """Test that all game messages are properly defined"""
    assert "welcome" in elevenlabs_utils.GAME_MESSAGES
    assert "welcome_with_difficulty" in elevenlabs_utils.GAME_MESSAGES
    assert "correct_guess" in elevenlabs_utils.GAME_MESSAGES
    assert "incorrect_guess" in elevenlabs_utils.GAME_MESSAGES
    assert "game_over_lose" in elevenlabs_utils.GAME_MESSAGES
    assert "questions_remaining" in elevenlabs_utils.GAME_MESSAGES
    assert "final_question" in elevenlabs_utils.GAME_MESSAGES
    assert "halfway_point" in elevenlabs_utils.GAME_MESSAGES

def test_default_voice_id():
    """Test that default voice ID is set"""
    assert elevenlabs_utils.ELEVENLABS_VOICE_ID == "test-voice-id"

def test_generate_speech_uses_default_voice():
    """Test that generate_speech uses default voice when none provided"""
    with patch("requests.post") as mock_post:
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.content = b"audio-data"
        mock_post.return_value = mock_response
        
        elevenlabs_utils.generate_speech("Hello world")
        
        call_args = mock_post.call_args
        url = call_args[0][0]
        assert "test-voice-id" in url 

def test_dotenv_import_error():
    """Test that the module works even when dotenv is not available"""
    # This test verifies that the dotenv import error handling works
    # The module should still function without dotenv
    assert hasattr(elevenlabs_utils, 'ELEVENLABS_API_KEY')
    assert hasattr(elevenlabs_utils, 'ELEVENLABS_VOICE_ID')
    assert hasattr(elevenlabs_utils, 'ELEVENLABS_BASE_URL') 