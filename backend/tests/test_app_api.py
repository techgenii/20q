from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from backend.app import app

client = TestClient(app)

def test_start_game_success():
    with patch("backend.app.start_game") as mock_start_game:
        mock_start_game.return_value = {"id": "game-uuid", "secret_word": "test"}
        resp = client.post("/start_game", json={"host_player_id": "host-uuid", "difficulty": 1})
        assert resp.status_code == 200
        data = resp.json()
        assert data["game_id"] == "game-uuid"
        assert data["secret_word"] == "hidden_for_players"

def test_start_game_failure():
    with patch("backend.app.start_game", side_effect=Exception("fail")):
        resp = client.post("/start_game", json={"host_player_id": "host-uuid"})
        assert resp.status_code == 500
        assert "fail" in resp.json()["detail"]

def test_join_game_success():
    with patch("backend.app.join_game") as mock_join_game:
        mock_join_game.return_value = {"game_id": "game-uuid", "player_id": "player-uuid"}
        resp = client.post("/join_game", json={"game_id": "game-uuid", "player_id": "player-uuid"})
        assert resp.status_code == 200
        assert resp.json()["game_id"] == "game-uuid"

def test_join_game_failure():
    with patch("backend.app.join_game", side_effect=Exception("fail")):
        resp = client.post("/join_game", json={"game_id": "game-uuid", "player_id": "player-uuid"})
        assert resp.status_code == 500
        assert "fail" in resp.json()["detail"]

def test_ask_question_active():
    with patch("backend.app.get_game") as mock_get_game, \
         patch("backend.app.ask_openai_question") as mock_ask, \
         patch("backend.app.increment_questions_asked") as mock_inc, \
         patch("backend.app.record_question") as mock_record:
        mock_get_game.return_value = {"status": "playing", "secret_word": "test"}
        mock_ask.return_value = "Yes"
        mock_inc.return_value = 1
        resp = client.post("/ask_question", json={"game_id": "game-uuid", "player_id": "player-uuid", "question": "Is it big?"})
        assert resp.status_code == 200
        assert resp.json()["answer"] == "Yes"

def test_ask_question_inactive():
    with patch("backend.app.get_game") as mock_get_game:
        mock_get_game.return_value = {"status": "finished"}
        resp = client.post("/ask_question", json={"game_id": "game-uuid", "player_id": "player-uuid", "question": "Is it big?"})
        assert resp.status_code == 200
        assert resp.json()["error"] == "Game is not active"

def test_ask_question_failure():
    with patch("backend.app.get_game", side_effect=Exception("fail")):
        resp = client.post("/ask_question", json={"game_id": "game-uuid", "player_id": "player-uuid", "question": "Is it big?"})
        assert resp.status_code == 500
        assert "fail" in resp.json()["detail"]

def test_make_guess_active():
    with patch("backend.app.get_game") as mock_get_game, \
         patch("backend.app.make_guess") as mock_make_guess:
        mock_get_game.return_value = {"status": "playing"}
        mock_make_guess.return_value = True
        resp = client.post("/make_guess", json={"game_id": "game-uuid", "player_id": "player-uuid", "guess": "elephant"})
        assert resp.status_code == 200
        assert resp.json()["correct"] is True

def test_make_guess_inactive():
    with patch("backend.app.get_game") as mock_get_game:
        mock_get_game.return_value = {"status": "finished"}
        resp = client.post("/make_guess", json={"game_id": "game-uuid", "player_id": "player-uuid", "guess": "elephant"})
        assert resp.status_code == 200
        assert resp.json()["error"] == "Game is not active"

def test_make_guess_failure():
    with patch("backend.app.get_game", side_effect=Exception("fail")):
        resp = client.post("/make_guess", json={"game_id": "game-uuid", "player_id": "player-uuid", "guess": "elephant"})
        assert resp.status_code == 500
        assert "fail" in resp.json()["detail"]