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

from fastapi import APIRouter, Depends, HTTPException, status, Request, Body
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import EmailStr
from datetime import datetime, timezone

# Import your models, Supabase utils, etc.
from models import UserSignUp, UserLogin, ProfileUpdateRequest, UserResponse, TokenResponse
from supabase_client import get_supabase_client, get_supabase_auth_client
from security import security

router = APIRouter()

# Authentication dependency
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    """
    Verify JWT token and get current user
    """
    token = credentials.credentials

    try:
        # Verify token with Supabase
        user = get_supabase_auth_client().auth.get_user(token)
        if not user.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return user.user
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication credentials, {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


# Optional authentication dependency (for endpoints that can work with or without auth)
async def get_current_user_optional(
    credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer(auto_error=False)),
):
    """
    Optional authentication - returns user if authenticated, None otherwise
    """
    if credentials is None:
        return None

    try:
        user = get_supabase_auth_client().auth.get_user(credentials.credentials)
        return user.user if user.user else None
    except:
        return None


# Authentication Routes
@router.post("/auth/signup", response_model=TokenResponse)
async def sign_up(user_data: UserSignUp):
    """
    Register a new user
    """
    try:
        # Sign up user with Supabase
        response = get_supabase_auth_client().auth.sign_up(
            {
                "email": user_data.email,
                "password": user_data.password,
                "options": {"data": {"full_name": user_data.full_name}},
            }
        )

        if response.user is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User registration failed",
            )

        # Insert user into players table for FK constraint
        get_supabase_client().table("players").insert(
            {
                "id": response.user.id,
                "email": response.user.email,
                "username": response.user.user_metadata.get("full_name"),
                "avatar_url": None,
                "last_login_at": response.user.created_at.isoformat(),
                "bio": None,
                "favorite_category": None,
                "achievements": [],
            }
        ).execute()

        # Fetch the player record to get all fields
        player = (
            get_supabase_client()
            .table("players")
            .select("avatar_url, last_login_at, bio, favorite_category, achievements")
            .eq("id", response.user.id)
            .single()
            .execute()
            .data
            or {}
        )
        user_response = UserResponse(
            id=response.user.id,
            email=response.user.email,
            full_name=response.user.user_metadata.get("full_name"),
            created_at=response.user.created_at.isoformat(),
            avatar_url=player.get("avatar_url"),
            last_login_at=player.get("last_login_at"),
            bio=player.get("bio"),
            favorite_category=player.get("favorite_category"),
            achievements=player.get("achievements", []),
        )

        return TokenResponse(
            access_token=response.session.access_token,
            token_type="bearer",
            user=user_response,
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"User Registration failed: {str(e)}",
        )


@router.post("/auth/login", response_model=TokenResponse)
async def login(user_credentials: UserLogin):
    """
    Login user and return access token
    """
    try:
        # Sign in user with Supabase
        response = get_supabase_auth_client().auth.sign_in_with_password(
            {"email": user_credentials.email, "password": user_credentials.password}
        )

        if response.user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )

        # Update last_login_at to now
        now_iso = datetime.now(timezone.utc).isoformat()
        get_supabase_client().table("players").update({"last_login_at": now_iso}).eq("id", response.user.id).execute()

        # Fetch the updated player record
        player = (
            get_supabase_client()
            .table("players")
            .select("avatar_url, last_login_at, bio, favorite_category, achievements")
            .eq("id", response.user.id)
            .single()
            .execute()
            .data
            or {}
        )
        user_response = UserResponse(
            id=response.user.id,
            email=response.user.email,
            full_name=response.user.user_metadata.get("full_name"),
            created_at=response.user.created_at.isoformat(),
            avatar_url=player.get("avatar_url"),
            last_login_at=player.get("last_login_at"),
            bio=player.get("bio"),
            favorite_category=player.get("favorite_category"),
            achievements=player.get("achievements", []),
        )

        return TokenResponse(
            access_token=response.session.access_token,
            token_type="bearer",
            user=user_response,
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail=f"Invalid email or password, {str(e)}"
        )


@router.post("/auth/logout")
async def logout(current_user=Depends(get_current_user)):
    """
    Logout current user
    """
    try:
        get_supabase_auth_client().auth.sign_out()
        return {"message": "Successfully logged out"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail=f"Logout failed: {str(e)}"
        )


@router.get("/auth/me", response_model=UserResponse)
async def get_current_user_info(current_user=Depends(get_current_user)):
    """
    Get current user information
    """
    try:
        # Fetch the complete player record from database
        player = (
            get_supabase_client()
            .table("players")
            .select("avatar_url, last_login_at, bio, favorite_category, achievements")
            .eq("id", current_user.id)
            .single()
            .execute()
            .data
            or {}
        )
        
        return UserResponse(
            id=current_user.id,
            email=current_user.email,
            full_name=current_user.user_metadata.get("full_name"),
            created_at=current_user.created_at.isoformat(),
            avatar_url=player.get("avatar_url"),
            last_login_at=player.get("last_login_at"),
            bio=player.get("bio"),
            favorite_category=player.get("favorite_category"),
            achievements=player.get("achievements", []),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch user information: {str(e)}"
        )


@router.post("/auth/reset-password")
async def reset_password(email: EmailStr):
    """
    Send password reset email
    """
    try:
        get_supabase_auth_client().auth.reset_password_email(email)
        return {"message": "Password reset email sent"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Password reset failed: {str(e)}",
        )

@router.post("/auth/refresh")
async def refresh_token(request: Request, refresh_token: str = Body(None, embed=True)):
    import os
    import requests
    SUPABASE_URL = os.getenv("SUPABASE_URL")
    SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        raise HTTPException(status_code=500, detail="Supabase config missing")

    # Prefer refresh_token from body, fallback to cookie
    if not refresh_token:
        refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(status_code=401, detail="No refresh token provided")

    url = f"{SUPABASE_URL}/auth/v1/token?grant_type=refresh_token"
    headers = {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json"
    }
    data = {"refresh_token": refresh_token}

    response = requests.post(url, headers=headers, json=data)
    if response.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Failed to refresh token: {response.text}"
        )
    return response.json()

@router.put("/profile", response_model=UserResponse)
async def update_profile(
    update: ProfileUpdateRequest,
    current_user=Depends(get_current_user)
):
    # Update the player in the database
    get_supabase_client().table("players").update({
        "username": update.full_name,
        "email": update.email,
        "bio": update.bio,
        "favorite_category": update.favorite_category,
        "avatar_url": update.avatar_url,
    }).eq("id", current_user.id).execute()

    # Fetch and return the updated user
    player = (
        get_supabase_client()
        .table("players")
        .select("avatar_url, last_login_at, bio, favorite_category, achievements")
        .eq("id", current_user.id)
        .single()
        .execute()
        .data
        or {}
    )
    return UserResponse(
        id=current_user.id,
        email=update.email,
        full_name=update.full_name,
        created_at=current_user.created_at.isoformat(),
        avatar_url=player.get("avatar_url"),
        last_login_at=player.get("last_login_at"),
        bio=player.get("bio"),
        favorite_category=player.get("favorite_category"),
        achievements=player.get("achievements", []),
    )

# Add other auth/profile endpoints as needed