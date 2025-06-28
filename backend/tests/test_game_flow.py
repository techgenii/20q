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
from unittest.mock import patch, MagicMock

import backend.game_logic as game_logic

@pytest.fixture(autouse=True)
def patch_supabase_and_openai(monkeypatch):
    # Patch supabase client methods
    mock_supabase = MagicMock()
    monkeypatch.setattr(game_logic, "get_supabase_client", lambda: mock_supabase)
    # Patch OpenAI
    monkeypatch.setattr(game_logic.openai.ChatCompletion, "create", MagicMock(return_value=MagicMock(
        choices=[MagicMock(message=MagicMock(content="Yes"))]
    )))

def test_choose_secret_word_returns_word():
    # Should return a word from the loaded list
    word = game_logic.choose_secret_word()
    assert isinstance(word, str)
    assert word  # not empty

def test_choose_secret_word_with_difficulty():
    # Should return a word with the specified difficulty
    difficulty = 1
    word = game_logic.choose_secret_word(difficulty)
    # Find the word in the loaded list and check its difficulty
    found = next(w for w in game_logic.SECRET_WORDS if w["name"] == word)
    assert found["difficulty"] == difficulty

def test_start_game_inserts_game(monkeypatch):
    mock_response = MagicMock()
    mock_response.error = None
    mock_response.data = [{"id": "game-uuid", "host_player_id": "host", "secret_word": "test", "status": "playing", "questions_asked": 0, "current_player_id": "host"}]
    mock_supabase = MagicMock()
    mock_supabase.table.return_value.insert.return_value.execute.return_value = mock_response
    monkeypatch.setattr(game_logic, "get_supabase_client", lambda: mock_supabase)

    result = game_logic.start_game("host", 1)
    assert result["id"] == "game-uuid"
    assert result["status"] == "playing"

def test_ask_openai_question():
    answer = game_logic.ask_openai_question("elephant", "Is it big?")
    assert answer["answer"] in ["Yes", "No", "Maybe"]

def test_make_guess_correct(monkeypatch):
    # Patch get_game to return a known secret word
    monkeypatch.setattr(game_logic, "get_game", lambda game_id: {"secret_word": "elephant"})
    # Patch update_game_winner to do nothing
    monkeypatch.setattr(game_logic, "update_game_winner", lambda game_id, player_id: None)
    # Patch OpenAI to return "Correct"
    game_logic.openai.ChatCompletion.create.return_value.choices[0].message.content = "Correct"
    result = game_logic.make_guess("game-uuid", "player-uuid", "elephant")
    assert result["correct"] is True

def test_make_guess_incorrect(monkeypatch):
    monkeypatch.setattr(game_logic, "get_game", lambda game_id: {"secret_word": "elephant"})
    game_logic.openai.ChatCompletion.create.return_value.choices[0].message.content = "Incorrect"
    result = game_logic.make_guess("game-uuid", "player-uuid", "car")
    assert result["correct"] is False

def test_join_game_success(monkeypatch):
    mock_response = MagicMock()
    mock_response.data = [{"game_id": "game-uuid", "player_id": "player-uuid"}]
    mock_supabase = MagicMock()
    mock_supabase.table.return_value.insert.return_value.execute.return_value = mock_response
    monkeypatch.setattr(game_logic, "get_supabase_client", lambda: mock_supabase)
    result = game_logic.join_game("game-uuid", "player-uuid")
    assert result["game_id"] == "game-uuid"
    assert result["player_id"] == "player-uuid"

def test_join_game_failure(monkeypatch):
    mock_response = MagicMock()
    mock_response.data = None
    mock_supabase = MagicMock()
    mock_supabase.table.return_value.insert.return_value.execute.return_value = mock_response
    monkeypatch.setattr(game_logic, "get_supabase_client", lambda: mock_supabase)
    with pytest.raises(Exception):
        game_logic.join_game("game-uuid", "player-uuid")

def test_record_question_success(monkeypatch):
    mock_response = MagicMock()
    mock_response.data = [{"id": 1, "game_id": "game-uuid", "player_id": "player-uuid", "question": "Q", "answer": True, "question_number": 1}]
    mock_supabase = MagicMock()
    mock_supabase.table.return_value.insert.return_value.execute.return_value = mock_response
    monkeypatch.setattr(game_logic, "get_supabase_client", lambda: mock_supabase)
    result = game_logic.record_question("game-uuid", "player-uuid", "Q", "Yes", 1)
    assert result["game_id"] == "game-uuid"
    assert result["player_id"] == "player-uuid"

def test_record_question_failure(monkeypatch):
    mock_response = MagicMock()
    mock_response.data = None
    mock_supabase = MagicMock()
    mock_supabase.table.return_value.insert.return_value.execute.return_value = mock_response
    monkeypatch.setattr(game_logic, "get_supabase_client", lambda: mock_supabase)
    with pytest.raises(Exception):
        game_logic.record_question("game-uuid", "player-uuid", "Q", "Yes", 1)

def test_increment_questions_asked_success(monkeypatch):
    monkeypatch.setattr(game_logic, "get_game", lambda game_id: {"questions_asked": 1})
    mock_response = MagicMock()
    mock_response.data = [{"id": "game-uuid", "questions_asked": 2}]
    mock_supabase = MagicMock()
    mock_supabase.table.return_value.update.return_value.eq.return_value.execute.return_value = mock_response
    monkeypatch.setattr(game_logic, "get_supabase_client", lambda: mock_supabase)
    result = game_logic.increment_questions_asked("game-uuid")
    assert result == 2

def test_increment_questions_asked_failure(monkeypatch):
    monkeypatch.setattr(game_logic, "get_game", lambda game_id: {"questions_asked": 1})
    mock_response = MagicMock()
    mock_response.data = None
    mock_supabase = MagicMock()
    mock_supabase.table.return_value.update.return_value.eq.return_value.execute.return_value = mock_response
    monkeypatch.setattr(game_logic, "get_supabase_client", lambda: mock_supabase)
    with pytest.raises(Exception):
        game_logic.increment_questions_asked("game-uuid")

def test_get_game_audio_settings(monkeypatch):
    monkeypatch.setattr(game_logic, "get_game", lambda game_id: {"enable_tts": True, "voice_id": "voice-123"})
    result = game_logic.get_game_audio_settings("game-uuid")
    assert result["enable_tts"] is True
    assert result["voice_id"] == "voice-123"

def test_update_game_tts_settings(monkeypatch):
    mock_response = MagicMock()
    mock_response.data = [{"id": "game-uuid", "enable_tts": True, "voice_id": "voice-123"}]
    mock_supabase = MagicMock()
    mock_supabase.table.return_value.update.return_value.eq.return_value.execute.return_value = mock_response
    monkeypatch.setattr(game_logic, "get_supabase_client", lambda: mock_supabase)
    result = game_logic.update_game_tts_settings("game-uuid", enable_tts=True, voice_id="voice-123")
    assert result["enable_tts"] is True
    assert result["voice_id"] == "voice-123"

def test_get_or_create_player_stats(monkeypatch):
    mock_response = MagicMock()
    mock_response.data = [{"player_id": "player-uuid", "games_played": 1}]
    mock_supabase = MagicMock()
    mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_response
    monkeypatch.setattr(game_logic, "get_supabase_client", lambda: mock_supabase)
    result = game_logic.get_or_create_player_stats("player-uuid")
    assert result["player_id"] == "player-uuid"

def test_get_or_create_player_stats_default(monkeypatch):
    mock_response = MagicMock()
    mock_response.data = []
    mock_supabase = MagicMock()
    mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_response
    monkeypatch.setattr(game_logic, "get_supabase_client", lambda: mock_supabase)
    result = game_logic.get_or_create_player_stats("player-uuid")
    assert result["games_played"] == 0

def test_get_or_create_player_stats_difficulty(monkeypatch):
    mock_response = MagicMock()
    mock_response.data = [{"player_id": "player-uuid", "difficulty": 1, "games_played": 1}]
    mock_supabase = MagicMock()
    mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.execute.return_value = mock_response
    monkeypatch.setattr(game_logic, "get_supabase_client", lambda: mock_supabase)
    result = game_logic.get_or_create_player_stats_difficulty("player-uuid", 1)
    assert result["difficulty"] == 1

def test_get_or_create_player_stats_difficulty_default(monkeypatch):
    mock_response = MagicMock()
    mock_response.data = []
    mock_supabase = MagicMock()
    mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.execute.return_value = mock_response
    monkeypatch.setattr(game_logic, "get_supabase_client", lambda: mock_supabase)
    result = game_logic.get_or_create_player_stats_difficulty("player-uuid", 1)
    assert result["games_played"] == 0

def test_update_stats_data():
    stats = {"player_id": "player-uuid", "games_played": 1, "games_won": 1, "total_questions_asked": 5, "average_questions_to_win": 5, "win_rate": 100}
    updated = game_logic.update_stats_data(stats, True, 3)
    assert updated["games_played"] == 2
    assert updated["games_won"] == 2
    assert updated["total_questions_asked"] == 8
    assert updated["win_rate"] == 100.0

def test_upsert_player_stats(monkeypatch):
    mock_response = MagicMock()
    mock_response.data = [{"player_id": "player-uuid"}]
    mock_supabase = MagicMock()
    mock_supabase.table.return_value.upsert.return_value.execute.return_value = mock_response
    monkeypatch.setattr(game_logic, "get_supabase_client", lambda: mock_supabase)
    game_logic.upsert_player_stats("player-uuid", {"player_id": "player-uuid"})

def test_upsert_player_stats_difficulty(monkeypatch):
    mock_response = MagicMock()
    mock_response.data = [{"player_id": "player-uuid", "difficulty": 1}]
    mock_supabase = MagicMock()
    mock_supabase.table.return_value.upsert.return_value.execute.return_value = mock_response
    monkeypatch.setattr(game_logic, "get_supabase_client", lambda: mock_supabase)
    game_logic.upsert_player_stats_difficulty("player-uuid", 1, {"player_id": "player-uuid"})

def test_generate_speech(monkeypatch):
    monkeypatch.setattr(game_logic, "ELEVENLABS_API_KEY", "fake-key")
    monkeypatch.setattr(game_logic, "ELEVENLABS_BASE_URL", "http://fake-url")
    with patch("requests.post") as mock_post:
        mock_post.return_value.status_code = 200
        mock_post.return_value.content = b"audio-bytes"
        result = game_logic.generate_speech("hello")
        assert result == b"audio-bytes"

def test_get_available_voices(monkeypatch):
    monkeypatch.setattr(game_logic, "ELEVENLABS_API_KEY", "fake-key")
    monkeypatch.setattr(game_logic, "ELEVENLABS_BASE_URL", "http://fake-url")
    with patch("requests.get") as mock_get:
        mock_get.return_value.status_code = 200
        mock_get.return_value.json.return_value = {"voices": [{"voice_id": "v1"}]}
        result = game_logic.get_available_voices()
        assert result[0]["voice_id"] == "v1"

def test_ask_question_with_tts(monkeypatch):
    monkeypatch.setattr(game_logic, "get_game", lambda game_id: {"secret_word": "test", "enable_tts": True, "voice_id": "v1"})
    monkeypatch.setattr(game_logic, "ask_openai_question", lambda *a, **kw: {"answer": "Yes", "audio": "base64"})
    monkeypatch.setattr(game_logic, "increment_questions_asked", lambda game_id: 1)
    monkeypatch.setattr(game_logic, "record_question", lambda *a, **kw: {"id": 1})
    monkeypatch.setattr(game_logic, "generate_speech", lambda *a, **kw: b"audio-bytes")
    monkeypatch.setattr(game_logic, "get_supabase_client", lambda: MagicMock())
    result = game_logic.ask_question_with_tts("game-uuid", "player-uuid", "Q?")
    assert result["answer"] == "Yes"
    assert result["question_number"] == 1

def test_make_guess_with_tts(monkeypatch):
    monkeypatch.setattr(game_logic, "get_game", lambda game_id: {"enable_tts": True, "voice_id": "v1"})
    monkeypatch.setattr(game_logic, "make_guess", lambda *a, **kw: {"correct": True, "message": "Congrats!"})
    result = game_logic.make_guess_with_tts("game-uuid", "player-uuid", "guess")
    assert result["correct"] is True

def test_get_remaining_slots_with_max_players(monkeypatch):
    # Patch get_game to return max_players=4
    monkeypatch.setattr(game_logic, "get_game", lambda game_id: {"max_players": 4})
    # Patch supabase to return 2 participants
    mock_resp = MagicMock()
    mock_resp.data = [{"player_id": "p1"}, {"player_id": "p2"}]
    mock_supabase = MagicMock()
    mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_resp
    monkeypatch.setattr(game_logic, "get_supabase_client", lambda: mock_supabase)
    slots = game_logic.get_remaining_slots("game-uuid")
    assert slots == 2

def test_get_remaining_slots_no_max_players(monkeypatch):
    # Patch get_game to return no max_players
    monkeypatch.setattr(game_logic, "get_game", lambda game_id: {})
    # Patch supabase to return 0 participants
    mock_resp = MagicMock()
    mock_resp.data = []
    mock_supabase = MagicMock()
    mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_resp
    monkeypatch.setattr(game_logic, "get_supabase_client", lambda: mock_supabase)
    slots = game_logic.get_remaining_slots("game-uuid")
    assert slots == 1

def test_start_game_with_game_type_max_players_guessed_word(monkeypatch):
    mock_response = MagicMock()
    mock_response.error = None
    mock_response.data = [{
        "id": "game-uuid",
        "host_player_id": "host",
        "secret_word": "test",
        "status": "playing",
        "questions_asked": 0,
        "current_player_id": "host",
        "game_type": "solo",
        "max_players": 2,
        "guessed_word": "cat"
    }]
    mock_supabase = MagicMock()
    mock_supabase.table.return_value.insert.return_value.execute.return_value = mock_response
    monkeypatch.setattr(game_logic, "get_supabase_client", lambda: mock_supabase)
    # Patch join_game to do nothing
    monkeypatch.setattr(game_logic, "join_game", lambda game_id, player_id: None)
    result = game_logic.start_game("host", 1, game_type="solo", max_players=2, guessed_word="cat")
    assert result["game_type"] == "solo"
    assert result["max_players"] == 2
    assert result["guessed_word"] == "cat"



