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

from pydantic import BaseModel, EmailStr
from typing import Optional

# Authentication Models
class UserSignUp(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: Optional[str] = None
    created_at: str
    avatar_url: Optional[str] = None
    last_login_at: Optional[str] = None
    bio: Optional[str] = None
    favorite_category: Optional[str] = None
    achievements: Optional[list] = []

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class ProfileUpdateRequest(BaseModel):
    full_name: str
    email: str
    bio: Optional[str] = None
    favorite_category: Optional[str] = None
    avatar_url: Optional[str] = None


# Add these models to your existing Pydantic models
class VoiceSettings(BaseModel):
    voice_id: Optional[str] = "pNInz6obpgDQGcFmaJgB"  # Default ElevenLabs voice
    stability: Optional[float] = 0.5
    similarity_boost: Optional[float] = 0.5
    use_speaker_boost: Optional[bool] = True


class TextToSpeechRequest(BaseModel):
    text: str
    voice_settings: Optional[VoiceSettings] = VoiceSettings()


class VoiceResponse(BaseModel):
    voice_id: str
    name: str
    category: str
    description: Optional[str] = None


# Game Models (existing)
class StartGameRequest(BaseModel):
    difficulty: int = None
    game_type: Optional[str] = None
    max_players: Optional[int] = None
    guessed_word: Optional[str] = None


class JoinGameRequest(BaseModel):
    game_id: str


class AskQuestionRequest(BaseModel):
    game_id: str
    question: str


class MakeGuessRequest(BaseModel):
    game_id: str
    guess: str