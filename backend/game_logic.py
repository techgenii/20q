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
import json
import random
import os
from dotenv import load_dotenv
from .supabase_client import supabase
import openai

load_dotenv()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
data_path = os.path.join(BASE_DIR, "data", "secret_words.json")

# Load OpenAI API key from env
openai.api_key = os.getenv("OPENAI_API_KEY")

# Load secret words from JSON file
with open(data_path, "r") as f:
    SECRET_WORDS = json.load(f)


def choose_secret_word(difficulty=None):
    """Choose a random secret word, optionally filtering by difficulty"""
    if difficulty:
        filtered = [w for w in SECRET_WORDS if w.get("difficulty") == difficulty]
        if not filtered:
            filtered = SECRET_WORDS
    else:
        filtered = SECRET_WORDS
    return random.choice(filtered)["name"]


def start_game(host_player_id, difficulty=None):
    """Create a new game with a secret word and store difficulty."""
    try:
        secret_word_entry = None
        if difficulty:
            filtered = [w for w in SECRET_WORDS if w.get("difficulty") == difficulty]
            if not filtered:
                filtered = SECRET_WORDS
            secret_word_entry = random.choice(filtered)
        else:
            secret_word_entry = random.choice(SECRET_WORDS)

        secret_word = secret_word_entry["name"]
        difficulty_level = secret_word_entry.get("difficulty", 1)

        data = {
            "host_player_id": host_player_id,
            "secret_word": secret_word,
            "difficulty": difficulty_level,
            "status": "playing",
            "questions_asked": 0,
            "current_player_id": host_player_id
        }
        response = supabase.table("games").insert(data).execute()
        if not response.data:
            raise Exception("Failed to start game with the given host player ID.")
        return response.data[0]
    except Exception as e:
        print(f"Error in start_game: {e}")
        raise


def join_game(game_id, player_id):
    """Add a player to a game."""
    try:
        data = {
            "game_id": game_id,
            "player_id": player_id
        }
        response = supabase.table("game_participants").insert(data).execute()
        if not response.data:
            raise Exception("Failed to join game with the given game ID.")
        return response.data[0]
    except Exception as e:
        print(f"Error in join_game: {e}")
        raise


def ask_openai_question(secret_word, question):
    """Send player question + secret word to OpenAI, get Yes/No/Maybe answer."""
    try:
        instruction_prompt = f"""You are playing 20 Questions. The secret word is "{secret_word}"""
        prompt = f"""The player asked: "{question}" Answer with only one word: Yes, No, or Maybe."""
        response = openai.responses.create(
            model="gpt-4o-mini",
            instructions=instruction_prompt,
            input=prompt,
            temperature=0
        )
        answer = response.output_text.strip().rstrip('.')
        return answer
    except Exception as e:
        print(f"Error in ask_openai_question: {e}")
        raise


def record_question(game_id, player_id, question, answer, question_number):
    """Record a question and answer in Supabase."""
    try:
        data = {
            "game_id": game_id,
            "player_id": player_id,
            "question": question,
            "answer": True if answer.lower() == "yes" else False,
            "question_number": question_number
        }
        response = supabase.table("game_questions").insert(data).execute()
        if not response.data:
            raise Exception("Failed to record question with the given game ID.")
        return response.data[0]
    except Exception as e:
        print(f"Error in record_question: {e}")
        raise


def get_game(game_id):
    """Retrieve game data."""
    try:
        response = supabase.table("games").select("*").eq("id", game_id).single().execute()
        if not response.data:
            raise Exception("No game found with the given ID.")
        return response.data
    except Exception as e:
        # Optionally log the error here
        print(f"Error in get_game: {e}")
        raise


def increment_questions_asked(game_id):
    """Increment questions_asked count for the game."""
    try:
        game = get_game(game_id)
        new_count = (game["questions_asked"] or 0) + 1
        response = supabase.table("games").update({"questions_asked": new_count}).eq("id", game_id).execute()
        # If your supabase client raises exceptions on error, you may not need to check response.error
        # If not, uncomment the next lines:
        if not response.data:
            raise Exception("No question asked with the given game ID.")
        return new_count
    except Exception as e:
        print(f"Error in increment_questions_asked: {e}")
        raise


def make_guess(game_id, player_id, guess):
    """Check guess correctness with OpenAI, update game if correct."""
    try:
        game = get_game(game_id)
        secret_word = game["secret_word"]

        instruction_prompt = f"""You are playing 20 Questions. The secret word is "{secret_word}"."""
        prompt = f"""The player guessed: "{guess}"\nReply with exactly one word: Correct or Incorrect."""
        
        response = openai.responses.create(
            model="gpt-4o-mini",
            instructions=instruction_prompt,
            input=prompt,
            temperature=0
        )
        result = response.output_text.strip().rstrip('.').lower()

        if result == "correct":
            # Update game winner and status
            update_game_winner(game_id, player_id)
            return True
        return False
    except Exception as e:
        print(f"Error in make_guess: {e}")
        raise


def update_game_winner(game_id, winner_id):
    """Set winner and mark game as finished."""
    try:
        response = supabase.table("games").update({
            "winner_id": winner_id,
            "status": "finished",
            "completed_at": "now()"
        }).eq("id", game_id).execute()
        
        if not response.data:
            raise Exception(f"Failed to update game winner for game ID: {game_id}")
        
        # After finishing, update player stats
        update_player_stats(winner_id, game_id)
    except Exception as e:
        print(f"Error in update_game_winner: {e}")
        raise


def update_player_stats(winner_id, game_id):
    try:
        game = get_game(game_id)
        difficulty = game.get("difficulty", 1)

        participants_resp = supabase.table("game_participants").select("player_id").eq("game_id", game_id).execute()
        if not participants_resp.data:
            raise Exception(f"Failed to get participants for game ID: {game_id}")
        players = participants_resp.data

        for p in players:
            player_id = p["player_id"]
            is_winner = (player_id == winner_id)

            # Get current stats
            overall_stats = get_or_create_player_stats(player_id)
            diff_stats = get_or_create_player_stats_difficulty(player_id, difficulty)

            # Count questions asked by this player in this game
            questions_resp = supabase.table("game_questions").select("*").eq("game_id", game_id).eq("player_id", player_id).execute()
            questions_asked = len(questions_resp.data)

            # Update overall and difficulty stats
            updated_overall = update_stats_data(overall_stats, is_winner, questions_asked)
            updated_diff = update_stats_data(diff_stats, is_winner, questions_asked)

            # Upsert both stats
            upsert_player_stats(player_id, updated_overall)
            upsert_player_stats_difficulty(player_id, difficulty, updated_diff)
    except Exception as e:
        print(f"Error in update_player_stats: {e}")
        raise


def get_or_create_player_stats(player_id):
    try:
        resp = supabase.table("player_stats").select("*").eq("player_id", player_id).execute()
        if resp.data:
            return resp.data[0]
        # If none exists, create default stats object
        return {
            "player_id": player_id,
            "games_played": 0,
            "games_won": 0,
            "total_questions_asked": 0,
            "average_questions_to_win": 0,
            "win_rate": 0
        }
    except Exception as e:
        print(f"Error in get_or_create_player_stats: {e}")
        raise


def get_or_create_player_stats_difficulty(player_id, difficulty):
    try:
        resp = supabase.table("player_stats_difficulty").select("*").eq("player_id", player_id).eq("difficulty", difficulty).execute()
        if resp.data:
            return resp.data[0]
        # Create default stats if missing
        return {
            "player_id": player_id,
            "difficulty": difficulty,
            "games_played": 0,
            "games_won": 0,
            "total_questions_asked": 0,
            "average_questions_to_win": 0,
            "win_rate": 0
        }
    except Exception as e:
        print(f"Error in get_or_create_player_stats_difficulty: {e}")
        raise


def update_stats_data(current_stats, is_winner, questions_asked):
    games_played = current_stats.get("games_played", 0) + 1
    games_won = current_stats.get("games_won", 0) + (1 if is_winner else 0)
    total_questions_asked = current_stats.get("total_questions_asked", 0) + questions_asked

    # Update average questions to win only if player won
    avg_qtw = current_stats.get("average_questions_to_win", 0)
    if is_winner:
        total_win_q = avg_qtw * current_stats.get("games_won", 0)
        average_questions_to_win = (total_win_q + questions_asked) / games_won
    else:
        average_questions_to_win = avg_qtw

    win_rate = round((games_won / games_played) * 100, 2) if games_played > 0 else 0

    return {
        "player_id": current_stats["player_id"],
        "games_played": games_played,
        "games_won": games_won,
        "total_questions_asked": total_questions_asked,
        "average_questions_to_win": average_questions_to_win,
        "win_rate": win_rate
    }


def upsert_player_stats(player_id, stats):
    try:
        resp = supabase.table("player_stats").upsert(stats).execute()
        if not resp.data:
            raise Exception(f"Failed to upsert player_stats for player ID: {player_id}")
    except Exception as e:
        print(f"Error in upsert_player_stats: {e}")
        raise


def upsert_player_stats_difficulty(player_id, difficulty, stats):
    try:
        # Make sure difficulty field is present
        stats["difficulty"] = difficulty
        resp = supabase.table("player_stats_difficulty").upsert(stats).execute()
        if not resp.data:
            raise Exception(f"Failed to upsert player_stats_difficulty for player ID: {player_id}")
    except Exception as e:
        print(f"Error in upsert_player_stats_difficulty: {e}")
        raise
