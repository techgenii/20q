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

"""
Supabase Client Management Module

This module provides a centralized way to manage Supabase client connections
for the 20Q game application. It implements lazy initialization to avoid
creating connections until they're actually needed, and provides two different
client types for different use cases.

Key Features:
- Lazy initialization: Clients are only created when first accessed
- Two client types: Service role (admin) and Anonymous (auth)
- Environment variable validation
- Backward compatibility with property access
- Singleton pattern to prevent multiple client instances

Usage:
    # For database operations (server-side)
    client = get_supabase_client()
    result = client.table('games').select('*').execute()

    # For authentication operations
    auth_client = get_supabase_auth_client()
    user = auth_client.auth.get_user(token)

    # Backward compatibility (deprecated but supported)
    from supabase_client import supabase, supabase_auth
    result = supabase.table('games').select('*').execute()
"""

from supabase import create_client, Client
import os
from typing import Optional

# Optional: use dotenv only locally for development
# This allows loading environment variables from a .env file during local development
# but doesn't break in production where environment variables are set by the system
try:
    from dotenv import load_dotenv

    load_dotenv()
except ImportError:
    # dotenv is not required in production environments
    pass

# Global variables to store the client instances
# Using None as initial value allows us to check if clients have been initialized
# This implements a singleton pattern to ensure only one instance of each client type
_supabase_client: Optional[Client] = None  # Service role client for admin operations
_supabase_auth_client: Optional[Client] = None  # Anonymous client for auth operations


def get_supabase_client() -> Client:
    """
    Get the Supabase service role client with lazy initialization.

    This client has full database access and should be used for:
    - Server-side operations (game logic, database queries)
    - Administrative tasks
    - Operations that require elevated permissions

    The service role key bypasses Row Level Security (RLS) policies.

    Returns:
        Client: A configured Supabase client with service role permissions

    Raises:
        ValueError: If required environment variables are not set

    Example:
        client = get_supabase_client()
        games = client.table('games').select('*').execute()
    """
    global _supabase_client
    if _supabase_client is None:
        # Get environment variables for Supabase configuration
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

        # Validate that required environment variables are present
        if not supabase_url or not supabase_key:
            raise ValueError(
                "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required. "
                "Please check your environment configuration."
            )

        # Create the client instance (this is the expensive operation we're deferring)
        _supabase_client = create_client(supabase_url, supabase_key)

    return _supabase_client


def get_supabase_auth_client() -> Client:
    """
    Get the Supabase anonymous client with lazy initialization.

    This client is used for authentication operations and respects
    Row Level Security (RLS) policies. It should be used for:
    - User authentication (login, signup, logout)
    - Operations that should respect user permissions
    - Client-side operations that need to be secure

    The anonymous key respects RLS policies and user permissions.

    Returns:
        Client: A configured Supabase client with anonymous permissions

    Raises:
        ValueError: If required environment variables are not set

    Example:
        auth_client = get_supabase_auth_client()
        user = auth_client.auth.get_user(access_token)
    """
    global _supabase_auth_client
    if _supabase_auth_client is None:
        # Get environment variables for Supabase configuration
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_ANON_KEY")

        # Validate that required environment variables are present
        if not supabase_url or not supabase_key:
            raise ValueError(
                "SUPABASE_URL and SUPABASE_ANON_KEY environment variables are required. "
                "Please check your environment configuration."
            )

        # Create the client instance (this is the expensive operation we're deferring)
        _supabase_auth_client = create_client(supabase_url, supabase_key)

    return _supabase_auth_client


# Backward compatibility properties
# These properties provide the same interface as the old direct client access
# They're deprecated but maintained for compatibility with existing code


@property
def supabase() -> Client:
    """
    Service role client for server-side operations.

    DEPRECATED: Use get_supabase_client() instead for better error handling.

    This property provides access to the service role client for backward compatibility.
    It's equivalent to calling get_supabase_client() but with less explicit error handling.

    Returns:
        Client: The service role Supabase client

    Note:
        This property accessor doesn't provide the same level of error handling
        as the function version. Consider migrating to get_supabase_client().
    """
    return get_supabase_client()


@property
def supabase_auth() -> Client:
    """
    Anonymous client for authentication operations.

    DEPRECATED: Use get_supabase_auth_client() instead for better error handling.

    This property provides access to the anonymous client for backward compatibility.
    It's equivalent to calling get_supabase_auth_client() but with less explicit error handling.

    Returns:
        Client: The anonymous Supabase client

    Note:
        This property accessor doesn't provide the same level of error handling
        as the function version. Consider migrating to get_supabase_auth_client().
    """
    return get_supabase_auth_client()
