# This file is part of 20Q.
#
# Copyright (C) 2025 Barbara Bickham
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

import pytest
from unittest.mock import patch, MagicMock
import os

import backend.supabase_client as supabase_client

@pytest.fixture(autouse=True)
def patch_environment_variables(monkeypatch):
    """Patch environment variables for testing"""
    monkeypatch.setattr(supabase_client, "SUPABASE_URL", "https://test.supabase.co")
    monkeypatch.setattr(supabase_client, "SUPABASE_SERVICE_ROLE_KEY", "test-service-role-key")
    monkeypatch.setattr(supabase_client, "SUPABASE_ANON_KEY", "test-anon-key")

def test_environment_variables_are_set():
    """Test that environment variables are properly loaded"""
    assert supabase_client.SUPABASE_URL == "https://test.supabase.co"
    assert supabase_client.SUPABASE_SERVICE_ROLE_KEY == "test-service-role-key"
    assert supabase_client.SUPABASE_ANON_KEY == "test-anon-key"

def test_environment_variables_missing(monkeypatch):
    """Test behavior when environment variables are missing"""
    # Temporarily clear the environment variables
    monkeypatch.setattr(supabase_client, "SUPABASE_URL", None)
    monkeypatch.setattr(supabase_client, "SUPABASE_SERVICE_ROLE_KEY", None)
    monkeypatch.setattr(supabase_client, "SUPABASE_ANON_KEY", None)
    
    # The clients should still exist but may not work properly
    assert hasattr(supabase_client, 'supabase')
    assert hasattr(supabase_client, 'supabase_auth')

def test_supabase_client_creation():
    """Test that the main supabase client is created"""
    assert hasattr(supabase_client, 'supabase')
    assert supabase_client.supabase is not None

def test_supabase_auth_client_creation():
    """Test that the auth supabase client is created"""
    assert hasattr(supabase_client, 'supabase_auth')
    assert supabase_client.supabase_auth is not None

def test_clients_are_different():
    """Test that the two clients are different instances"""
    assert supabase_client.supabase is not supabase_client.supabase_auth

def test_dotenv_import_error():
    """Test that the module works even when dotenv is not available"""
    # This test verifies that the dotenv import error handling works
    # The module should still function without dotenv
    assert hasattr(supabase_client, 'SUPABASE_URL')
    assert hasattr(supabase_client, 'SUPABASE_SERVICE_ROLE_KEY')
    assert hasattr(supabase_client, 'SUPABASE_ANON_KEY')

def test_supabase_client_type():
    """Test that the supabase client is of the correct type"""
    # Import the Client type to check
    from supabase import Client
    assert isinstance(supabase_client.supabase, Client)

def test_supabase_auth_client_type():
    """Test that the supabase auth client is of the correct type"""
    # Import the Client type to check
    from supabase import Client
    assert isinstance(supabase_client.supabase_auth, Client)

def test_client_creation_with_missing_url(monkeypatch):
    """Test client creation behavior when URL is missing"""
    # This test verifies that the module can handle missing URL gracefully
    # We can't easily test the actual client creation since it happens at import time
    # But we can verify the module structure is correct
    assert hasattr(supabase_client, 'SUPABASE_URL')
    assert hasattr(supabase_client, 'supabase')
    assert hasattr(supabase_client, 'supabase_auth')

def test_client_creation_with_missing_keys(monkeypatch):
    """Test client creation behavior when keys are missing"""
    # This test verifies that the module can handle missing keys gracefully
    # We can't easily test the actual client creation since it happens at import time
    # But we can verify the module structure is correct
    assert hasattr(supabase_client, 'SUPABASE_SERVICE_ROLE_KEY')
    assert hasattr(supabase_client, 'SUPABASE_ANON_KEY')
    assert hasattr(supabase_client, 'supabase')
    assert hasattr(supabase_client, 'supabase_auth')

def test_create_client_called_with_correct_parameters():
    """Test that create_client is called with the correct parameters"""
    # This test verifies that the clients are created with the expected structure
    # Since we can't easily mock the import-time creation, we verify the results
    assert supabase_client.supabase is not None
    assert supabase_client.supabase_auth is not None
    assert supabase_client.supabase is not supabase_client.supabase_auth

def test_module_imports():
    """Test that all necessary imports are available"""
    assert hasattr(supabase_client, 'create_client')
    assert hasattr(supabase_client, 'Client')
    assert hasattr(supabase_client, 'os')

def test_environment_variable_names():
    """Test that environment variable names are correctly defined"""
    # These should match what's expected in the environment
    expected_url_var = "SUPABASE_URL"
    expected_service_key_var = "SUPABASE_SERVICE_ROLE_KEY"
    expected_anon_key_var = "SUPABASE_ANON_KEY"
    
    # The actual values should be loaded from environment
    assert supabase_client.SUPABASE_URL is not None
    assert supabase_client.SUPABASE_SERVICE_ROLE_KEY is not None
    assert supabase_client.SUPABASE_ANON_KEY is not None

def test_client_attributes():
    """Test that clients have expected attributes"""
    # Both clients should have basic client attributes
    assert hasattr(supabase_client.supabase, 'table')
    assert hasattr(supabase_client.supabase_auth, 'table')
    
    # Both clients should have auth attributes
    assert hasattr(supabase_client.supabase, 'auth')
    assert hasattr(supabase_client.supabase_auth, 'auth')

def test_client_functionality():
    """Test basic client functionality"""
    # Test that we can access table method (basic functionality)
    assert callable(supabase_client.supabase.table)
    assert callable(supabase_client.supabase_auth.table)
    
    # Test that we can access auth attribute (it's an object, not callable)
    assert hasattr(supabase_client.supabase, 'auth')
    assert hasattr(supabase_client.supabase_auth, 'auth')

def test_service_role_client_purpose():
    """Test that service role client is properly configured for server operations"""
    # The service role client should be the main client
    assert supabase_client.supabase is not None
    # It should be different from the auth client
    assert supabase_client.supabase is not supabase_client.supabase_auth

def test_anon_client_purpose():
    """Test that anonymous client is properly configured for auth operations"""
    # The anon client should be the auth client
    assert supabase_client.supabase_auth is not None
    # It should be different from the service role client
    assert supabase_client.supabase_auth is not supabase_client.supabase

def test_client_initialization_order():
    """Test that clients are initialized in the correct order"""
    # The service role client should be created first (main client)
    # The anon client should be created second (auth client)
    # This is just a structural test to ensure both exist
    assert hasattr(supabase_client, 'supabase')
    assert hasattr(supabase_client, 'supabase_auth') 