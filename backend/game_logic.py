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
    if response.error:
        raise Exception(f"Failed to start game: {response.error.message}")
    return response.data[0]


def join_game(game_id, player_id):
    """Add a player to a game."""
    data = {
        "game_id": game_id,
        "player_id": player_id
    }
    response = supabase.table("game_participants").insert(data).execute()
    if response.error:
        raise Exception(f"Failed to join game: {response.error.message}")
    return response.data[0]


def ask_openai_question(secret_word, question):
    """Send player question + secret word to OpenAI, get Yes/No/Maybe answer."""
    prompt = f"""You are playing 20 Questions. The secret word is "{secret_word}".
The player asked: "{question}"
Answer with only one word: Yes, No, or Maybe."""
    
    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}],
        temperature=0
    )
    answer = response.choices[0].message.content.strip()
    return answer


def record_question(game_id, player_id, question, answer, question_number):
    """Record a question and answer in Supabase."""
    data = {
        "game_id": game_id,
        "player_id": player_id,
        "question": question,
        "answer": True if answer.lower() == "yes" else False,
        "question_number": question_number
    }
    response = supabase.table("game_questions").insert(data).execute()
    if response.error:
        raise Exception(f"Failed to record question: {response.error.message}")
    return response.data[0]


def get_game(game_id):
    """Retrieve game data."""
    response = supabase.table("games").select("*").eq("id", game_id).single().execute()
    if response.error:
        raise Exception(f"Failed to fetch game: {response.error.message}")
    return response.data


def increment_questions_asked(game_id):
    """Increment questions_asked count for the game."""
    game = get_game(game_id)
    new_count = (game["questions_asked"] or 0) + 1
    response = supabase.table("games").update({"questions_asked": new_count}).eq("id", game_id).execute()
    if response.error:
        raise Exception(f"Failed to update questions asked: {response.error.message}")
    return new_count


def make_guess(game_id, player_id, guess):
    """Check guess correctness with OpenAI, update game if correct."""
    game = get_game(game_id)
    secret_word = game["secret_word"]

    prompt = f"""You are playing 20 Questions. The secret word is "{secret_word}".
The player guessed: "{guess}"
Reply with exactly one word: Correct or Incorrect."""
    
    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}],
        temperature=0
    )
    result = response.choices[0].message.content.strip().lower()

    if result == "correct":
        # Update game winner and status
        update_game_winner(game_id, player_id)
        return True
    return False


def update_game_winner(game_id, winner_id):
    """Set winner and mark game as finished."""
    response = supabase.table("games").update({
        "winner_id": winner_id,
        "status": "finished",
        "completed_at": "now()"
    }).eq("id", game_id).execute()
    if response.error:
        raise Exception(f"Failed to update game winner: {response.error.message}")
    
    # After finishing, update player stats
    update_player_stats(winner_id, game_id)


def update_player_stats(winner_id, game_id):
    game = get_game(game_id)
    difficulty = game.get("difficulty", 1)

    participants_resp = supabase.table("game_participants").select("player_id").eq("game_id", game_id).execute()
    if participants_resp.error:
        raise Exception(f"Failed to get participants: {participants_resp.error.message}")
    players = participants_resp.data

    for p in players:
        player_id = p["player_id"]
        is_winner = (player_id == winner_id)

        # Get current stats
        overall_stats = get_or_create_player_stats(player_id)
        diff_stats = get_or_create_player_stats_difficulty(player_id, difficulty)

        # Count questions asked by this player in this game
        questions_resp = supabase.table("game_questions").select("*").eq("game_id", game_id).eq("player_id", player_id).execute()
        if questions_resp.error:
            raise Exception(f"Failed to get questions: {questions_resp.error.message}")
        questions_asked = len(questions_resp.data)

        # Update overall and difficulty stats
        updated_overall = update_stats_data(overall_stats, is_winner, questions_asked)
        updated_diff = update_stats_data(diff_stats, is_winner, questions_asked)

        # Upsert both stats
        upsert_player_stats(player_id, updated_overall)
        upsert_player_stats_difficulty(player_id, difficulty, updated_diff)

def get_or_create_player_stats(player_id):
    resp = supabase.table("player_stats").select("*").eq("player_id", player_id).execute()
    if resp.error:
        raise Exception(f"Failed to get player_stats: {resp.error.message}")
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


def get_or_create_player_stats_difficulty(player_id, difficulty):
    resp = supabase.table("player_stats_difficulty").select("*").eq("player_id", player_id).eq("difficulty", difficulty).execute()
    if resp.error:
        raise Exception(f"Failed to get player_stats_difficulty: {resp.error.message}")
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
    resp = supabase.table("player_stats").upsert(stats).execute()
    if resp.error:
        raise Exception(f"Failed to upsert player_stats: {resp.error.message}")


def upsert_player_stats_difficulty(player_id, difficulty, stats):
    # Make sure difficulty field is present
    stats["difficulty"] = difficulty
    resp = supabase.table("player_stats_difficulty").upsert(stats).execute()
    if resp.error:
        raise Exception(f"Failed to upsert player_stats_difficulty: {resp.error.message}")
