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
    monkeypatch.setattr(game_logic, "supabase", MagicMock())
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
    game_logic.supabase.table.return_value.insert.return_value.execute.return_value = mock_response

    result = game_logic.start_game("host", 1)
    assert result["id"] == "game-uuid"
    assert result["status"] == "playing"

def test_ask_openai_question():
    answer = game_logic.ask_openai_question("elephant", "Is it big?")
    assert answer in ["Yes", "No", "Maybe"]

def test_make_guess_correct(monkeypatch):
    # Patch get_game to return a known secret word
    monkeypatch.setattr(game_logic, "get_game", lambda game_id: {"secret_word": "elephant"})
    # Patch update_game_winner to do nothing
    monkeypatch.setattr(game_logic, "update_game_winner", lambda game_id, player_id: None)
    # Patch OpenAI to return "Correct"
    game_logic.openai.ChatCompletion.create.return_value.choices[0].message.content = "Correct"
    result = game_logic.make_guess("game-uuid", "player-uuid", "elephant")
    assert result is True

def test_make_guess_incorrect(monkeypatch):
    monkeypatch.setattr(game_logic, "get_game", lambda game_id: {"secret_word": "elephant"})
    game_logic.openai.ChatCompletion.create.return_value.choices[0].message.content = "Incorrect"
    result = game_logic.make_guess("game-uuid", "player-uuid", "car")
    assert result is False



