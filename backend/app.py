from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from .game_logic import start_game, join_game, ask_openai_question, record_question, increment_questions_asked, make_guess, get_game

app = FastAPI()

class StartGameRequest(BaseModel):
    host_player_id: str
    difficulty: int = None

class JoinGameRequest(BaseModel):
    game_id: str
    player_id: str

class AskQuestionRequest(BaseModel):
    game_id: str
    player_id: str
    question: str

class MakeGuessRequest(BaseModel):
    game_id: str
    player_id: str
    guess: str


@app.post("/start_game")
def api_start_game(req: StartGameRequest):
    try:
        game = start_game(req.host_player_id, req.difficulty)
        return {"game_id": game["id"], "secret_word": "hidden_for_players"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/join_game")
def api_join_game(req: JoinGameRequest):
    try:
        participant = join_game(req.game_id, req.player_id)
        return participant
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/ask_question")
def api_ask_question(req: AskQuestionRequest):
    try:
        game = get_game(req.game_id)
        if game["status"] != "playing":
            return {"error": "Game is not active"}

        answer = ask_openai_question(game["secret_word"], req.question)
        question_number = increment_questions_asked(req.game_id)
        record_question(req.game_id, req.player_id, req.question, answer, question_number)

        return {"answer": answer}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/make_guess")
def api_make_guess(req: MakeGuessRequest):
    try:
        game = get_game(req.game_id)
        if game["status"] != "playing":
            return {"error": "Game is not active"}

        correct = make_guess(req.game_id, req.player_id, req.guess)
        return {"correct": correct}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
