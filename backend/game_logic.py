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
import os
import random
import base64
import requests

from openai import OpenAI

from supabase_client import get_supabase_client

# Optional: use dotenv only locally
try:
    from dotenv import load_dotenv

    load_dotenv()
except ImportError:
    pass

# ElevenLabs API configuration
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
ELEVENLABS_VOICE_ID = os.getenv(
    "ELEVENLABS_VOICE_ID", "9BWtsMINqrJLrRacOk9x"
)  # Default voice ID
ELEVENLABS_BASE_URL = os.getenv("ELEVENLABS_BASE_URL")


# Load secret words from supabase
def load_secret_words():
    response = get_supabase_client().table("secret_words").select("*").execute()
    if not response.data:
        raise Exception("Supabase error: No data returned from secret_words table.")
    return response.data


SECRET_WORDS = load_secret_words()


def generate_speech(text, voice_id=None, model_id="eleven_monolingual_v1"):
    """
    Generate speech using ElevenLabs API

    Args:
        text (str): Text to convert to speech
        voice_id (str): ElevenLabs voice ID (optional, uses default if not provided)
        model_id (str): ElevenLabs model ID

    Returns:
        bytes: Audio data as bytes, or None if failed
    """
    if not ELEVENLABS_API_KEY:
        print("ElevenLabs API key not found. Speech generation disabled.")
        return None

    if not voice_id:
        voice_id = ELEVENLABS_VOICE_ID

    url = f"{ELEVENLABS_BASE_URL}/text-to-speech/{voice_id}"

    headers = {
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": ELEVENLABS_API_KEY,
    }

    data = {
        "text": text,
        "model_id": model_id,
        "voice_settings": {"stability": 0.5, "similarity_boost": 0.5},
    }

    try:
        response = requests.post(url, json=data, headers=headers)
        if response.status_code == 200:
            return response.content
        else:
            print(f"ElevenLabs API error: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"Error generating speech: {e}")
        return None


def get_available_voices():
    """Get list of available voices from ElevenLabs"""
    if not ELEVENLABS_API_KEY:
        return []

    url = f"{ELEVENLABS_BASE_URL}/voices"
    headers = {"xi-api-key": ELEVENLABS_API_KEY}

    try:
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            return response.json().get("voices", [])
        else:
            print(f"Error fetching voices: {response.status_code}")
            return []
    except Exception as e:
        print(f"Error fetching voices: {e}")
        return []


def choose_secret_word(difficulty=None):
    """Choose a random secret word, optionally filtering by difficulty"""
    if difficulty:
        filtered = [w for w in SECRET_WORDS if w.get("difficulty") == difficulty]
        if not filtered:
            filtered = SECRET_WORDS
    else:
        filtered = SECRET_WORDS
    return random.choice(filtered)["name"]


def start_game(
    host_player_id,
    difficulty,
    enable_tts=False,
    voice_id=None,
    game_type=None,
    max_players=None,
    guessed_word=None,
):
    """Create a new game with a secret word, store difficulty, and support game_type, max_players, guessed_word."""
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
            "current_player_id": host_player_id,
            "enable_tts": enable_tts,
            "voice_id": voice_id or ELEVENLABS_VOICE_ID,
        }
        
        # Set defaults for optional fields
        if game_type is None or game_type.strip() == "":
            data["game_type"] = "solo"
        else:
            data["game_type"] = game_type
            
        if max_players is None or max_players <= 0:
            data["max_players"] = 1
        else:
            data["max_players"] = max_players
            
        if guessed_word is not None and guessed_word.strip() != "":
            data["guessed_word"] = guessed_word
            
        response = get_supabase_client().table("games").insert(data).execute()
        if not response.data:
            raise Exception("Failed to start game with the given host player ID.")
        game_data = response.data[0]
        
        # Add host player as participant in the game
        join_game(game_data["id"], host_player_id)
        # Generate welcome message with TTS if enabled
        if enable_tts:
            welcome_text = f"Welcome to 20 Questions! I'm thinking of something with difficulty level {difficulty_level}. You have 20 questions to guess what it is. Good luck!"
            audio_data = generate_speech(welcome_text, voice_id)
            if audio_data:
                game_data["welcome_audio"] = base64.b64encode(audio_data).decode(
                    "utf-8"
                )
        return game_data
    except Exception as e:
        print(f"Error in start_game: {e}")
        raise


def join_game(game_id, player_id):
    """Add a player to a game."""
    try:
        data = {"game_id": game_id, "player_id": player_id}
        response = (
            get_supabase_client().table("game_participants").insert(data).execute()
        )
        if not response.data:
            raise Exception("Failed to join game with the given game ID.")
        return response.data[0]
    except Exception as e:
        print(f"Error in join_game: {e}")
        raise


def ask_openai_question(secret_word, question, enable_tts=False, voice_id=None):
    """Send player question + secret word to OpenAI, get Yes/No/Maybe answer with optional TTS."""
    try:
        client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])

        instruction_prompt = f"""You are playing 20 Questions. The secret word is "{secret_word}"""
        prompt = f"""The player asked: "{question}" Answer with only one word: Yes, No, or Maybe."""

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": instruction_prompt},
                {"role": "user", "content": prompt}
            ],
            temperature=0
        )
        answer = response.choices[0].message.content.strip().rstrip('.')
        result = {"answer": answer}

        # Generate TTS if enabled
        if enable_tts and answer:
            audio_data = generate_speech(answer, voice_id)
            if audio_data:
                result["audio"] = base64.b64encode(audio_data).decode("utf-8")

        return result
    except Exception as e:
        print(f"Error in ask_openai_question: {e}")
        raise


def ask_question_with_tts(game_id, player_id, question):
    """
    Complete question flow with TTS support based on game settings.
    This function handles the entire question workflow.
    """
    try:
        # Get game data to check TTS settings
        game = get_game(game_id)
        secret_word = game["secret_word"]
        enable_tts = game.get("enable_tts", False)
        voice_id = game.get("voice_id")

        # Get the AI response
        ai_response = ask_openai_question(secret_word, question, enable_tts, voice_id)
        answer = ai_response["answer"]

        # Increment question count
        question_count = increment_questions_asked(game_id)

        # Record the question in database
        question_record = record_question(
            game_id, player_id, question, answer, question_count
        )

        # Prepare response
        result = {
            "answer": answer,
            "question_number": question_count,
            "questions_remaining": max(0, 20 - question_count),
            "game_over": question_count >= 20,
            "question_record": question_record,
        }

        # Add audio if available
        if "audio" in ai_response:
            result["audio"] = ai_response["audio"]

        # Check if game should end due to question limit
        if question_count >= 20:
            # Update game status to finished (no winner)
            get_supabase_client().table("games").update(
                {"status": "finished", "completed_at": "now()"}
            ).eq("id", game_id).execute()

            if enable_tts:
                game_over_text = f"Game over! You've used all 20 questions. The answer was {secret_word}."
                audio_data = generate_speech(game_over_text, voice_id)
                if audio_data:
                    result["game_over_audio"] = base64.b64encode(audio_data).decode(
                        "utf-8"
                    )

        return result

    except Exception as e:
        print(f"Error in ask_question_with_tts: {e}")
        raise


def record_question(game_id, player_id, question, answer, question_number):
    """Record a question and answer in Supabase."""
    try:
        answer_str = answer["answer"] if isinstance(answer, dict) else answer
        data = {
            "game_id": game_id,
            "player_id": player_id,
            "question": question,
            "answer": True if answer_str.lower() == "yes" else False,
            "question_number": question_number,
        }
        response = get_supabase_client().table("game_questions").insert(data).execute()
        if not response.data:
            raise Exception("Failed to record question with the given game ID.")
        return response.data[0]
    except Exception as e:
        print(f"Error in record_question: {e}")
        raise


def get_game(game_id):
    """Retrieve game data."""
    try:
        response = (
            get_supabase_client()
            .table("games")
            .select("*")
            .eq("id", game_id)
            .single()
            .execute()
        )
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
        response = (
            get_supabase_client()
            .table("games")
            .update({"questions_asked": new_count})
            .eq("id", game_id)
            .execute()
        )
        # If your supabase client raises exceptions on error, you may not need to check response.error
        # If not, uncomment the next lines:
        if not response.data:
            raise Exception("No question asked with the given game ID.")
        return new_count
    except Exception as e:
        print(f"Error in increment_questions_asked: {e}")
        raise


def make_guess_with_tts(game_id, player_id, guess):
    """
    Complete guess flow with TTS support based on game settings.
    This function handles the entire guess workflow.
    """
    try:
        # Get game data to check TTS settings
        game = get_game(game_id)
        enable_tts = game.get("enable_tts", False)
        voice_id = game.get("voice_id")

        # Make the guess
        guess_result = make_guess(game_id, player_id, guess, enable_tts, voice_id)

        return guess_result

    except Exception as e:
        print(f"Error in make_guess_with_tts: {e}")
        raise


def get_game_audio_settings(game_id):
    """Get TTS settings for a specific game"""
    try:
        game = get_game(game_id)
        return {
            "enable_tts": game.get("enable_tts", False),
            "voice_id": game.get("voice_id", ELEVENLABS_VOICE_ID),
        }
    except Exception as e:
        print(f"Error in get_game_audio_settings: {e}")
        raise


def update_game_tts_settings(game_id, enable_tts=None, voice_id=None):
    """Update TTS settings for an existing game"""
    try:
        update_data = {}
        if enable_tts is not None:
            update_data["enable_tts"] = enable_tts
        if voice_id is not None:
            update_data["voice_id"] = voice_id

        if update_data:
            response = (
                get_supabase_client()
                .table("games")
                .update(update_data)
                .eq("id", game_id)
                .execute()
            )
            if not response.data:
                raise Exception(f"Failed to update TTS settings for game ID: {game_id}")
            return response.data[0]

        return get_game(game_id)
    except Exception as e:
        print(f"Error in update_game_tts_settings: {e}")
        raise


"""Check guess correctness with OpenAI, update game if correct, with optional TTS."""
def make_guess(game_id, player_id, guess, enable_tts=False, voice_id=None):
    """
    Check if the guess is correct. If so, update the game winner.
    Returns True if correct, False otherwise.
    """
    try:
        client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])

        game = get_game(game_id)
        secret_word = game["secret_word"]

        instruction_prompt = f"""You are playing 20 Questions. The secret word is "{secret_word}"."""
        prompt = f"""The player guessed: "{guess}"\nReply with exactly one word: Correct or Incorrect."""

        aResponse = client.responses.create(
            model="gpt-4o-mini",
            instructions=instruction_prompt,
            input=prompt,
        )
        result_text = aResponse.output_text.strip().rstrip('.')
        result = {"correct": result_text == "correct", "message": result_text}

        if result_text == "correct":
            # Update game winner and status
            update_game_winner(game_id, player_id)
            success_message = (
                f"Congratulations! You guessed correctly! The answer was {secret_word}."
            )
            result["message"] = success_message

            # Generate TTS for success
            if enable_tts:
                audio_data = generate_speech(success_message, voice_id)
                if audio_data:
                    result["audio"] = base64.b64encode(audio_data).decode("utf-8")
        else:
            failure_message = f"Sorry, that's not correct. The answer was {secret_word}. Better luck next time!"
            result["message"] = failure_message

            # Generate TTS for failure
            if enable_tts:
                audio_data = generate_speech(failure_message, voice_id)
                if audio_data:
                    result["audio"] = base64.b64encode(audio_data).decode("utf-8")

        return result
    except Exception as e:
        print(f"Error in make_guess: {e}")
        raise


def update_game_winner(game_id, winner_id):
    """Set winner and mark game as finished."""
    try:
        response = (
            get_supabase_client()
            .table("games")
            .update(
                {"winner_id": winner_id, "status": "finished", "completed_at": "now()"}
            )
            .eq("id", game_id)
            .execute()
        )

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

        participants_resp = (
            get_supabase_client()
            .table("game_participants")
            .select("player_id")
            .eq("game_id", game_id)
            .execute()
        )
        if not participants_resp.data:
            raise Exception(f"Failed to get participants for game ID: {game_id}")
        players = participants_resp.data

        for p in players:
            player_id = p["player_id"]
            is_winner = player_id == winner_id

            # Get current stats
            overall_stats = get_or_create_player_stats(player_id)
            diff_stats = get_or_create_player_stats_difficulty(player_id, difficulty)

            # Count questions asked by this player in this game
            questions_resp = (
                get_supabase_client()
                .table("game_questions")
                .select("*")
                .eq("game_id", game_id)
                .eq("player_id", player_id)
                .execute()
            )
            questions_asked = len(questions_resp.data)

            # Update overall and difficulty stats
            updated_overall = update_stats_data(
                overall_stats, is_winner, questions_asked
            )
            updated_diff = update_stats_data(diff_stats, is_winner, questions_asked)

            # Upsert both stats
            upsert_player_stats(player_id, updated_overall)
            upsert_player_stats_difficulty(player_id, difficulty, updated_diff)
    except Exception as e:
        print(f"Error in update_player_stats: {e}")
        raise


def get_or_create_player_stats(player_id):
    try:
        resp = (
            get_supabase_client()
            .table("player_stats")
            .select("*")
            .eq("player_id", player_id)
            .execute()
        )
        if resp.data:
            return resp.data[0]
        # If none exists, create default stats object
        return {
            "player_id": player_id,
            "games_played": 0,
            "games_won": 0,
            "total_questions_asked": 0,
            "average_questions_to_win": 0,
            "win_rate": 0,
        }
    except Exception as e:
        print(f"Error in get_or_create_player_stats: {e}")
        raise


def get_or_create_player_stats_difficulty(player_id, difficulty):
    try:
        resp = (
            get_supabase_client()
            .table("player_stats_difficulty")
            .select("*")
            .eq("player_id", player_id)
            .eq("difficulty", difficulty)
            .execute()
        )
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
            "win_rate": 0,
        }
    except Exception as e:
        print(f"Error in get_or_create_player_stats_difficulty: {e}")
        raise


def update_stats_data(current_stats, is_winner, questions_asked):
    games_played = current_stats.get("games_played", 0) + 1
    games_won = current_stats.get("games_won", 0) + (1 if is_winner else 0)
    total_questions_asked = (
        current_stats.get("total_questions_asked", 0) + questions_asked
    )

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
        "win_rate": win_rate,
    }


def upsert_player_stats(player_id, stats):
    try:
        resp = get_supabase_client().table("player_stats").upsert(stats).execute()
        if not resp.data:
            raise Exception(f"Failed to upsert player_stats for player ID: {player_id}")
    except Exception as e:
        print(f"Error in upsert_player_stats: {e}")
        raise


def upsert_player_stats_difficulty(player_id, difficulty, stats):
    try:
        # Make sure difficulty field is present
        stats["difficulty"] = difficulty
        resp = (
            get_supabase_client()
            .table("player_stats_difficulty")
            .upsert(stats)
            .execute()
        )
        if not resp.data:
            raise Exception(
                f"Failed to upsert player_stats_difficulty for player ID: {player_id}"
            )
    except Exception as e:
        print(f"Error in upsert_player_stats_difficulty: {e}")
        raise


def get_remaining_slots(game_id):
    game = get_game(game_id)
    max_players = game.get("max_players")
    if max_players is None:
        max_players = 1
    participants_resp = (
        get_supabase_client()
        .table("game_participants")
        .select("player_id")
        .eq("game_id", game_id)
        .execute()
    )
    current_count = len(participants_resp.data) if participants_resp.data else 0
    return max_players - current_count
