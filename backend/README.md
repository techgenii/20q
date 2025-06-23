# 20 Questions Multiplayer Backend

## Setup

1. Copy `.env.example` to `.env` and fill in your Supabase & OpenAI keys.

2. Install dependencies: 
pip install -r requirements.txt

3. Run the app:
uvicorn app:app --reload

4. API Endpoints:
- POST /start_game
- POST /join_game
- POST /ask_question
- POST /make_guess