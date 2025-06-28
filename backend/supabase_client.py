# This file is part of 20Q.
#
# Copyright (C) 2025 Trailyn Ventures, LLC
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

from supabase import create_client, Client
import os
from typing import Optional

# Optional: use dotenv only locally
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# Global variables to store the clients
_supabase_client: Optional[Client] = None
_supabase_auth_client: Optional[Client] = None

def get_supabase_client() -> Client:
    """Get the Supabase service role client (lazy initialization)"""
    global _supabase_client
    if _supabase_client is None:
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        if not supabase_url or not supabase_key:
            raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required")
        _supabase_client = create_client(supabase_url, supabase_key)
    return _supabase_client

def get_supabase_auth_client() -> Client:
    """Get the Supabase anonymous client (lazy initialization)"""
    global _supabase_auth_client
    if _supabase_auth_client is None:
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_ANON_KEY")
        if not supabase_url or not supabase_key:
            raise ValueError("SUPABASE_URL and SUPABASE_ANON_KEY environment variables are required")
        _supabase_auth_client = create_client(supabase_url, supabase_key)
    return _supabase_auth_client

# Backward compatibility - create properties that access the lazy clients
@property
def supabase() -> Client:
    """Service role client for server-side operations (game logic, database operations)"""
    return get_supabase_client()

@property
def supabase_auth() -> Client:
    """Anonymous client for authentication operations"""
    return get_supabase_auth_client()