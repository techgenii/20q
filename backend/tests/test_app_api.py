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

import backend.auth_routes as auth_routes
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from backend.app import app
import pytest

# Create TestClient with base_url to handle root_path
client = TestClient(app, base_url="http://testserver")


@pytest.fixture(autouse=True, scope="module")
def override_auth_dependencies():
    fake_user = MagicMock()
    fake_user.id = "test-user-id"
    fake_user.email = "test@example.com"
    fake_user.user_metadata = {"full_name": "Test User"}
    fake_user.created_at.isoformat.return_value = "2025-01-01T00:00:00"

    app.dependency_overrides.clear()
    app.dependency_overrides[auth_routes.get_current_user] = lambda: fake_user
    app.dependency_overrides[auth_routes.get_current_user_optional] = lambda: fake_user
    yield
    app.dependency_overrides.clear()


def test_start_game_success():
    with patch("backend.game_routes.start_game") as mock_start_game:
        mock_start_game.return_value = {"id": "game-uuid", "secret_word": "test"}
        resp = client.post(
            "/start_game", json={"difficulty": 1}
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["game_id"] == "game-uuid" or data["id"] == "game-uuid"
        assert "secret_word" in data


def test_start_game_failure():
    with patch("backend.game_routes.start_game", side_effect=Exception("fail")):
        resp = client.post("/start_game", json={"difficulty": 1})
        assert resp.status_code == 500
        assert "fail" in resp.json().get("detail", "")


def test_join_game_success():
    with patch("backend.game_routes.join_game") as mock_join_game, patch(
        "backend.game_routes.get_remaining_slots"
    ) as mock_get_remaining_slots:
        mock_join_game.return_value = {
            "game_id": "game-uuid",
            "player_id": "player-uuid",
        }
        mock_get_remaining_slots.return_value = 2
        resp = client.post(
            "/join_game", json={"game_id": "game-uuid"}
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["game_id"] == "game-uuid"
        assert data["remaining_slots"] == 2


def test_join_game_no_max_players():
    with patch("backend.game_routes.join_game") as mock_join_game, patch(
        "backend.game_routes.get_remaining_slots"
    ) as mock_get_remaining_slots:
        mock_join_game.return_value = {
            "game_id": "game-uuid",
            "player_id": "player-uuid",
        }
        mock_get_remaining_slots.return_value = 1
        resp = client.post(
            "/join_game", json={"game_id": "game-uuid"}
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["remaining_slots"] == 1


def test_join_game_failure():
    with patch("backend.game_routes.join_game", side_effect=Exception("fail")):
        resp = client.post(
            "/join_game", json={"game_id": "game-uuid"}
        )
        assert resp.status_code == 500
        assert "fail" in resp.json().get("detail", "")


def test_ask_question_active():
    with patch("backend.game_routes.get_game") as mock_get_game, patch(
        "backend.game_routes.ask_openai_question"
    ) as mock_ask, patch("backend.game_routes.increment_questions_asked") as mock_inc, patch(
        "backend.game_routes.record_question"
    ) as mock_record:
        mock_get_game.return_value = {"status": "playing", "secret_word": "test"}
        mock_ask.return_value = "Yes"
        mock_inc.return_value = 1
        resp = client.post(
            "/ask_question",
            json={
                "game_id": "game-uuid",
                "question": "Is it big?",
            },
        )
        assert resp.status_code == 200
        assert resp.json()["answer"] == "Yes"


def test_ask_question_inactive():
    with patch("backend.game_routes.get_game") as mock_get_game:
        mock_get_game.return_value = {"status": "finished"}
        resp = client.post(
            "/ask_question",
            json={
                "game_id": "game-uuid",
                "question": "Is it big?",
            },
        )
        assert resp.status_code == 200
        assert resp.json()["error"] == "Game is not active"


def test_ask_question_failure():
    with patch("backend.game_routes.get_game", side_effect=Exception("fail")):
        resp = client.post(
            "/ask_question",
            json={
                "game_id": "game-uuid",
                "question": "Is it big?",
            },
        )
        assert resp.status_code == 500
        assert "fail" in resp.json().get("detail", "")


def test_make_guess_active():
    with patch("backend.game_routes.get_game") as mock_get_game, patch(
        "backend.game_routes.make_guess"
    ) as mock_make_guess:
        mock_get_game.return_value = {"status": "playing"}
        mock_make_guess.return_value = True
        resp = client.post(
            "/make_guess",
            json={
                "game_id": "game-uuid",
                "guess": "elephant",
            },
        )
        assert resp.status_code == 200
        assert resp.json()["correct"] is True


def test_make_guess_inactive():
    with patch("backend.game_routes.get_game") as mock_get_game:
        mock_get_game.return_value = {"status": "finished"}
        resp = client.post(
            "/make_guess",
            json={
                "game_id": "game-uuid",
                "guess": "elephant",
            },
        )
        assert resp.status_code == 200
        assert resp.json()["error"] == "Game is not active"


def test_make_guess_failure():
    with patch("backend.game_routes.get_game", side_effect=Exception("fail")):
        resp = client.post(
            "/make_guess",
            json={
                "game_id": "game-uuid",
                "guess": "elephant",
            },
        )
        assert resp.status_code == 500
        assert "fail" in resp.json().get("detail", "")


# Authentication Tests
def test_auth_signup_success():
    with patch("backend.auth_routes.get_supabase_auth_client") as mock_auth, \
         patch("backend.auth_routes.get_supabase_client") as mock_table:
        mock_user = MagicMock()
        mock_user.id = "test-user-id"
        mock_user.email = "test@example.com"
        mock_user.user_metadata = {"full_name": "Test User"}
        mock_user.created_at.isoformat.return_value = "2025-01-01T00:00:00"
        mock_session = MagicMock()
        mock_session.access_token = "test-token"
        mock_response = MagicMock()
        mock_response.user = mock_user
        mock_response.session = mock_session
        mock_auth.return_value.auth.sign_up.return_value = mock_response
        mock_table.return_value.table.return_value.insert.return_value.execute.return_value = MagicMock()
        mock_table.return_value.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value.data = {
            "avatar_url": None,
            "last_login_at": None,
            "bio": None,
            "favorite_category": None,
            "achievements": [],
        }
        resp = client.post(
            "/auth/signup",
            json={
                "email": "test@example.com",
                "password": "password123",
                "full_name": "Test User",
            },
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["user"]["email"] == "test@example.com"
        assert data["user"]["avatar_url"] is None
        assert data["user"]["last_login_at"] is None
        assert data["user"]["bio"] is None
        assert data["user"]["favorite_category"] is None
        assert data["user"]["achievements"] == []


def test_auth_signup_failure():
    with patch("backend.auth_routes.get_supabase_auth_client") as mock_auth:
        mock_response = MagicMock()
        mock_response.user = None
        mock_auth.return_value.auth.sign_up.return_value = mock_response
        resp = client.post(
            "/auth/signup",
            json={"email": "test@example.com", "password": "password123"},
        )
        assert resp.status_code == 400
        assert "User registration failed" in resp.json()["detail"]


def test_auth_login_success():
    with patch("backend.auth_routes.get_supabase_auth_client") as mock_auth, \
         patch("backend.auth_routes.get_supabase_client") as mock_table:
        mock_user = MagicMock()
        mock_user.id = "test-user-id"
        mock_user.email = "test@example.com"
        mock_user.user_metadata = {"full_name": "Test User"}
        mock_user.created_at.isoformat.return_value = "2025-01-01T00:00:00"
        mock_session = MagicMock()
        mock_session.access_token = "test-token"
        mock_response = MagicMock()
        mock_response.user = mock_user
        mock_response.session = mock_session
        mock_auth.return_value.auth.sign_in_with_password.return_value = mock_response
        mock_table.return_value.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value.data = {
            "avatar_url": None,
            "last_login_at": None,
            "bio": None,
            "favorite_category": None,
            "achievements": [],
        }
        resp = client.post(
            "/auth/login",
            json={"email": "test@example.com", "password": "password123"},
        )
        print("LOGIN RESPONSE:", resp.status_code, resp.json())
        assert resp.status_code == 200
        data = resp.json()
        assert data["user"]["email"] == "test@example.com"
        assert data["user"]["avatar_url"] is None
        assert data["user"]["last_login_at"] is None
        assert data["user"]["bio"] is None
        assert data["user"]["favorite_category"] is None
        assert data["user"]["achievements"] == []


def test_auth_login_failure():
    with patch("backend.auth_routes.get_supabase_auth_client") as mock_auth:
        mock_response = MagicMock()
        mock_response.user = None
        mock_auth.return_value.auth.sign_in_with_password.return_value = mock_response
        resp = client.post(
            "/auth/login",
            json={"email": "test@example.com", "password": "wrongpassword"},
        )
        assert resp.status_code == 401
        assert "Invalid email or password" in resp.json()["detail"]


def test_auth_logout_success():
    with patch("backend.auth_routes.get_supabase_auth_client") as mock_auth:
        resp = client.post("/auth/logout")
        assert resp.status_code == 200
        assert resp.json()["message"] == "Successfully logged out"


def test_auth_me_success():
    with patch("backend.auth_routes.get_supabase_client") as mock_table:
        mock_table.return_value.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value.data = {
            "avatar_url": None,
            "last_login_at": None,
            "bio": None,
            "favorite_category": None,
            "achievements": [],
        }
        resp = client.get("/auth/me")
        assert resp.status_code == 200
        data = resp.json()
        assert data["id"] == "test-user-id"


def test_auth_reset_password_success():
    with patch("backend.auth_routes.get_supabase_auth_client") as mock_auth:
        resp = client.post("/auth/reset-password", params={"email": "test@example.com"})
        assert resp.status_code == 200
        assert resp.json()["message"] == "Password reset email sent"


# Voice-related Tests
def test_voice_text_to_speech_success():
    with patch("os.getenv") as mock_getenv, patch("requests.post") as mock_post:
        mock_getenv.return_value = "test-api-key"
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.content = b"audio-data"
        mock_post.return_value = mock_response
        with patch("backend.voice_routes.get_current_user", return_value=MagicMock()):
            resp = client.post(
                "/voice/text-to-speech",
                json={
                    "text": "Hello world",
                    "voice_settings": {
                        "voice_id": "test-voice-id",
                        "stability": 0.5,
                        "similarity_boost": 0.5,
                        "use_speaker_boost": True,
                    },
                },
            )
            assert resp.status_code == 200
            assert resp.headers["content-type"] == "audio/mpeg"


def test_voice_text_to_speech_no_api_key():
    with patch("os.getenv") as mock_getenv:
        mock_getenv.return_value = None
        with patch("backend.voice_routes.get_current_user", return_value=MagicMock()):
            resp = client.post("/voice/text-to-speech", json={"text": "Hello world"})
            assert resp.status_code == 500
            assert "ElevenLabs API key not configured" in resp.json()["detail"]


def test_voice_get_voices_success():
    with patch("os.getenv") as mock_getenv, patch("requests.get") as mock_get:
        mock_getenv.return_value = "test-api-key"
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "voices": [
                {
                    "voice_id": "voice1",
                    "name": "Test Voice",
                    "category": "test",
                    "description": "A test voice",
                }
            ]
        }
        mock_get.return_value = mock_response
        with patch("backend.voice_routes.get_current_user", return_value=MagicMock()):
            resp = client.get("/voice/voices")
            assert resp.status_code == 200
            data = resp.json()
            assert len(data["voices"]) == 1
            assert data["voices"][0]["voice_id"] == "voice1"


def test_voice_speech_to_text_success():
    with patch("os.getenv") as mock_getenv, patch("requests.post") as mock_post:
        mock_getenv.return_value = "test-api-key"
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"text": "Hello world"}
        mock_post.return_value = mock_response
        from io import BytesIO
        audio_file = BytesIO(b"fake-audio-data")
        with patch("backend.voice_routes.get_current_user", return_value=MagicMock()):
            resp = client.post(
                "/voice/speech-to-text",
                files={"audio_file": ("test.mp3", audio_file, "audio/mpeg")},
            )
            assert resp.status_code == 200
            assert resp.json()["transcription"] == "Hello world"


# Enhanced Game Endpoints Tests
def test_ask_question_voice_success():
    with patch("backend.voice_routes.get_game") as mock_get_game, \
         patch("backend.voice_routes.ask_openai_question") as mock_ask, \
         patch("backend.voice_routes.increment_questions_asked") as mock_inc, \
         patch("backend.voice_routes.record_question") as mock_record, \
         patch("os.getenv") as mock_getenv, \
         patch("requests.post") as mock_post, \
         patch("backend.voice_routes.get_current_user", return_value=MagicMock()):
        mock_get_game.return_value = {"status": "playing", "secret_word": "test"}
        mock_ask.return_value = "Yes"
        mock_inc.return_value = 1
        mock_getenv.return_value = "test-api-key"
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.content = b"audio-data"
        mock_post.return_value = mock_response
        resp = client.post(
            "/ask_question_voice",
            json={"req": {"game_id": "game-uuid", "question": "Is it big?"}},
        )
        print("ASK_QUESTION_VOICE RESPONSE:", resp.status_code, resp.json())
        assert resp.status_code == 200
        data = resp.json()
        assert data["answer"] == "Yes"
        assert data["question_number"] == 1
        assert "audio" in data


def test_ask_question_voice_no_audio():
    with patch("backend.voice_routes.get_game") as mock_get_game, \
         patch("backend.voice_routes.ask_openai_question") as mock_ask, \
         patch("backend.voice_routes.increment_questions_asked") as mock_inc, \
         patch("backend.voice_routes.record_question") as mock_record, \
         patch("os.getenv") as mock_getenv, \
         patch("backend.voice_routes.get_current_user", return_value=MagicMock()):
        mock_get_game.return_value = {"status": "playing", "secret_word": "test"}
        mock_ask.return_value = "Yes"
        mock_inc.return_value = 1
        mock_getenv.return_value = None  # No API key
        resp = client.post(
            "/ask_question_voice",
            json={"req": {"game_id": "game-uuid", "question": "Is it big?"}},
        )
        print("ASK_QUESTION_VOICE_NO_AUDIO RESPONSE:", resp.status_code, resp.json())
        assert resp.status_code == 200
        data = resp.json()
        assert data["answer"] == "Yes"
        assert data["question_number"] == 1
        assert data["audio"] is None


def test_ask_question_voice_game_not_active():
    with patch("backend.voice_routes.get_game") as mock_get_game, \
         patch("backend.voice_routes.get_current_user", return_value=MagicMock()):
        mock_get_game.return_value = {"status": "finished"}
        resp = client.post(
            "/ask_question_voice",
            json={"req": {"game_id": "game-uuid", "question": "Is it big?"}},
        )
        print("ASK_QUESTION_VOICE_GAME_NOT_ACTIVE RESPONSE:", resp.status_code, resp.json())
        assert resp.status_code == 200
        assert resp.json()["error"] == "Game is not active"


def test_update_game_voice_settings():
    resp = client.post(
        "/game/test-game-id/voice-settings",
        json={
            "voice_id": "test-voice",
            "stability": 0.7,
            "similarity_boost": 0.8,
            "use_speaker_boost": False,
        },
    )

    assert resp.status_code == 200
    data = resp.json()
    assert data["game_id"] == "test-game-id"
    assert data["message"] == "Voice settings updated successfully"
    assert data["voice_settings"]["voice_id"] == "test-voice"


# Game Endpoint with Optional Auth Tests
def test_get_game_with_auth():
    with patch("backend.game_routes.get_game") as mock_get_game:
        mock_get_game.return_value = {
            "id": "game-uuid",
            "status": "playing",
            "secret_word": "elephant",
        }
        resp = client.get("/game/game-uuid")
        assert resp.status_code == 200
        data = resp.json()
        assert data["id"] == "game-uuid"
        assert data["status"] == "playing"
        assert "secret_word" in data


def test_get_game_without_auth():
    # Temporarily override the optional auth dependency to return None
    original_override = app.dependency_overrides.get(auth_routes.get_current_user_optional)
    app.dependency_overrides[auth_routes.get_current_user_optional] = lambda: None
    try:
        with patch("backend.game_routes.get_game") as mock_get_game:
            mock_get_game.return_value = {
                "id": "game-uuid",
                "status": "playing",
                "secret_word": "elephant",
            }
            resp = client.get("/game/game-uuid")
            assert resp.status_code == 200
            data = resp.json()
            assert data["id"] == "game-uuid"
            assert data["status"] == "playing"
            assert "secret_word" not in data
    finally:
        if original_override:
            app.dependency_overrides[auth_routes.get_current_user_optional] = original_override
        else:
            app.dependency_overrides.pop(auth_routes.get_current_user_optional, None)


# Health Check Test
def test_root_health_check():
    resp = client.get("/")
    assert resp.status_code == 200
    assert resp.json()["message"] == "Hello from WhisperChase Game API with Auth on Lambda!"


# Error Handling Tests
def test_voice_text_to_speech_api_error():
    with patch("os.getenv") as mock_getenv, patch("requests.post") as mock_post:
        mock_getenv.return_value = "test-api-key"
        mock_response = MagicMock()
        mock_response.status_code = 400
        mock_response.text = "Bad Request"
        mock_post.return_value = mock_response

        resp = client.post("/voice/text-to-speech", json={"text": "Hello world"})

        assert resp.status_code == 500
        assert "ElevenLabs API error" in resp.json()["detail"]


def test_voice_get_voices_api_error():
    with patch("os.getenv") as mock_getenv, patch("requests.get") as mock_get:
        mock_getenv.return_value = "test-api-key"
        mock_response = MagicMock()
        mock_response.status_code = 401
        mock_response.text = "Unauthorized"
        mock_get.return_value = mock_response

        resp = client.get("/voice/voices")

        assert resp.status_code == 500
        assert "ElevenLabs API error" in resp.json()["detail"]


def test_speech_to_text_no_api_key():
    with patch("os.getenv") as mock_getenv:
        mock_getenv.return_value = None

        from io import BytesIO

        audio_file = BytesIO(b"fake-audio-data")

        resp = client.post(
            "/voice/speech-to-text",
            files={"audio_file": ("test.mp3", audio_file, "audio/mpeg")},
        )

        assert resp.status_code == 500
        assert "OpenAI API key not configured" in resp.json()["detail"]


# Edge Cases
def test_auth_signup_exception():
    with patch("backend.supabase_client.get_supabase_auth_client") as mock_auth:
        mock_auth.side_effect = Exception("Database error")

        resp = client.post(
            "/auth/signup",
            json={"email": "test@example.com", "password": "password123"},
        )

        assert resp.status_code == 400
        assert "Registration failed" in resp.json()["detail"]


def test_auth_logout_exception():
    with patch("backend.auth_routes.get_supabase_auth_client") as mock_auth:
        mock_auth.return_value.auth.sign_out.side_effect = Exception("Logout error")
        resp = client.post("/auth/logout")
        assert resp.status_code == 400
        assert "Logout failed" in resp.json()["detail"]
