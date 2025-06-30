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

from fastapi import APIRouter, Depends, HTTPException

# Import your models, Supabase utils, etc.
from models import StartGameRequest, JoinGameRequest, AskQuestionRequest, MakeGuessRequest
from game_logic import ask_openai_question, get_game, increment_questions_asked, join_game, make_guess, record_question, start_game, get_remaining_slots
from auth_routes import get_current_user, get_current_user_optional

router = APIRouter()

# Game Routes (Updated with Authentication, join a game immediately after you start a game)
@router.post("/start_game")
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
            "difficulty": game.get("difficulty"),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/join_game")
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


@router.post("/ask_question")
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


@router.post("/make_guess")
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
@router.get("/game/{game_id}")
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

# Add other game endpoints as needed