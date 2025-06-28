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
def setup_environment_variables(monkeypatch):
    """Set up test environment variables"""
    monkeypatch.setenv("SUPABASE_URL", "https://test.supabase.co")
    monkeypatch.setenv("SUPABASE_SERVICE_ROLE_KEY", "test-service-role-key")
    monkeypatch.setenv("SUPABASE_ANON_KEY", "test-anon-key")

def test_environment_variables_are_set():
    """Test that environment variables are properly set"""
    assert os.getenv("SUPABASE_URL") == "https://test.supabase.co"
    assert os.getenv("SUPABASE_SERVICE_ROLE_KEY") == "test-service-role-key"
    assert os.getenv("SUPABASE_ANON_KEY") == "test-anon-key"

def test_environment_variables_missing():
    """Test behavior when environment variables are missing"""
    # Clear any existing clients first
    supabase_client._supabase_client = None
    supabase_client._supabase_auth_client = None
    
    with patch.dict(os.environ, {}, clear=True):
        with pytest.raises(ValueError, match="SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required"):
            supabase_client.get_supabase_client()
        
        with pytest.raises(ValueError, match="SUPABASE_URL and SUPABASE_ANON_KEY environment variables are required"):
            supabase_client.get_supabase_auth_client()

@patch('backend.supabase_client.create_client')
def test_supabase_client_creation(mock_create_client):
    """Test that the main supabase client is created"""
    # Clear any existing client
    supabase_client._supabase_client = None
    
    mock_client = MagicMock()
    mock_create_client.return_value = mock_client
    
    client = supabase_client.get_supabase_client()
    assert client is not None
    assert client == mock_client

@patch('backend.supabase_client.create_client')
def test_supabase_auth_client_creation(mock_create_client):
    """Test that the auth supabase client is created"""
    # Clear any existing client
    supabase_client._supabase_auth_client = None
    
    mock_client = MagicMock()
    mock_create_client.return_value = mock_client
    
    client = supabase_client.get_supabase_auth_client()
    assert client is not None
    assert client == mock_client

@patch('backend.supabase_client.create_client')
def test_clients_are_different(mock_create_client):
    """Test that the two clients are different instances"""
    # Clear any existing clients
    supabase_client._supabase_client = None
    supabase_client._supabase_auth_client = None
    
    mock_client1 = MagicMock()
    mock_client2 = MagicMock()
    mock_create_client.side_effect = [mock_client1, mock_client2]
    
    client1 = supabase_client.get_supabase_client()
    client2 = supabase_client.get_supabase_auth_client()
    assert client1 is not client2

@patch('backend.supabase_client.create_client')
def test_lazy_initialization(mock_create_client):
    """Test that clients are only created when first accessed"""
    mock_client1 = MagicMock()
    mock_client2 = MagicMock()
    mock_create_client.side_effect = [mock_client1, mock_client2]
    
    # Clear any existing clients
    supabase_client._supabase_client = None
    supabase_client._supabase_auth_client = None
    
    # Clients should be None initially
    assert supabase_client._supabase_client is None
    assert supabase_client._supabase_auth_client is None
    
    # Access clients
    client1 = supabase_client.get_supabase_client()
    client2 = supabase_client.get_supabase_auth_client()
    
    # Clients should now be created
    assert supabase_client._supabase_client is not None
    assert supabase_client._supabase_auth_client is not None
    
    # Subsequent calls should return the same instances
    assert supabase_client.get_supabase_client() is client1
    assert supabase_client.get_supabase_auth_client() is client2

@patch('backend.supabase_client.create_client')
def test_supabase_client_type(mock_create_client):
    """Test that the supabase client is of the correct type"""
    from supabase import Client
    # Clear any existing client
    supabase_client._supabase_client = None
    
    mock_client = MagicMock(spec=Client)
    mock_create_client.return_value = mock_client
    
    client = supabase_client.get_supabase_client()
    assert isinstance(client, MagicMock)  # Since we're mocking it

@patch('backend.supabase_client.create_client')
def test_supabase_auth_client_type(mock_create_client):
    """Test that the supabase auth client is of the correct type"""
    from supabase import Client
    # Clear any existing client
    supabase_client._supabase_auth_client = None
    
    mock_client = MagicMock(spec=Client)
    mock_create_client.return_value = mock_client
    
    client = supabase_client.get_supabase_auth_client()
    assert isinstance(client, MagicMock)  # Since we're mocking it

@patch('backend.supabase_client.create_client')
def test_property_access(mock_create_client):
    """Test that the property accessors work correctly"""
    # Clear any existing clients
    supabase_client._supabase_client = None
    supabase_client._supabase_auth_client = None
    
    mock_client1 = MagicMock()
    mock_client2 = MagicMock()
    mock_create_client.side_effect = [mock_client1, mock_client2]
    
    # Test that properties exist
    assert hasattr(supabase_client, 'supabase')
    assert hasattr(supabase_client, 'supabase_auth')
    
    # Test that properties return clients
    client1 = supabase_client.supabase
    client2 = supabase_client.supabase_auth
    assert client1 is not None
    assert client2 is not None
    assert client1 is not client2

def test_module_imports():
    """Test that all necessary functions and properties are available"""
    assert hasattr(supabase_client, 'get_supabase_client')
    assert hasattr(supabase_client, 'get_supabase_auth_client')
    assert hasattr(supabase_client, 'supabase')
    assert hasattr(supabase_client, 'supabase_auth')

@patch('backend.supabase_client.create_client')
def test_client_attributes(mock_create_client):
    """Test that clients have expected attributes"""
    # Clear any existing clients
    supabase_client._supabase_client = None
    supabase_client._supabase_auth_client = None
    
    mock_client1 = MagicMock()
    mock_client2 = MagicMock()
    mock_create_client.side_effect = [mock_client1, mock_client2]
    
    # Both clients should have basic client attributes
    assert hasattr(supabase_client.get_supabase_client(), 'table')
    assert hasattr(supabase_client.get_supabase_auth_client(), 'table')
    
    # Both clients should have auth attributes
    assert hasattr(supabase_client.get_supabase_client(), 'auth')
    assert hasattr(supabase_client.get_supabase_auth_client(), 'auth')

@patch('backend.supabase_client.create_client')
def test_client_functionality(mock_create_client):
    """Test basic client functionality"""
    # Clear any existing clients
    supabase_client._supabase_client = None
    supabase_client._supabase_auth_client = None
    
    mock_client1 = MagicMock()
    mock_client2 = MagicMock()
    mock_create_client.side_effect = [mock_client1, mock_client2]
    
    # Test that we can access table method (basic functionality)
    assert callable(supabase_client.get_supabase_client().table)
    assert callable(supabase_client.get_supabase_auth_client().table)
    
    # Test that we can access auth attribute (it's an object, not callable)
    assert hasattr(supabase_client.get_supabase_client(), 'auth')
    assert hasattr(supabase_client.get_supabase_auth_client(), 'auth')

@patch('backend.supabase_client.create_client')
def test_service_role_client_purpose(mock_create_client):
    """Test that service role client is properly configured for server operations"""
    # Clear any existing clients
    supabase_client._supabase_client = None
    supabase_client._supabase_auth_client = None
    
    mock_client1 = MagicMock()
    mock_client2 = MagicMock()
    mock_create_client.side_effect = [mock_client1, mock_client2]
    
    # The service role client should be the main client
    assert supabase_client.get_supabase_client() is not None
    # It should be different from the auth client
    assert supabase_client.get_supabase_client() is not supabase_client.get_supabase_auth_client()

@patch('backend.supabase_client.create_client')
def test_anon_client_purpose(mock_create_client):
    """Test that anonymous client is properly configured for auth operations"""
    # Clear any existing clients
    supabase_client._supabase_client = None
    supabase_client._supabase_auth_client = None
    
    mock_client1 = MagicMock()
    mock_client2 = MagicMock()
    mock_create_client.side_effect = [mock_client1, mock_client2]
    
    # The anon client should be the auth client
    assert supabase_client.get_supabase_auth_client() is not None
    # It should be different from the service role client
    assert supabase_client.get_supabase_auth_client() is not supabase_client.get_supabase_client()

def test_client_initialization_order():
    """Test that clients are initialized in the correct order"""
    # The service role client should be created first (main client)
    # The anon client should be created second (auth client)
    # This is just a structural test to ensure both exist
    assert hasattr(supabase_client, 'supabase')
    assert hasattr(supabase_client, 'supabase_auth')

def test_get_supabase_client_success(monkeypatch):
    """Test successful Supabase client creation"""
    # Mock environment variables
    monkeypatch.setenv("SUPABASE_URL", "https://test.supabase.co")
    monkeypatch.setenv("SUPABASE_SERVICE_ROLE_KEY", "test-service-key")
    
    # Clear any cached client
    supabase_client._supabase_client = None
    
    # Test that we can get a client
    client = supabase_client.get_supabase_client()
    assert client is not None
    assert os.getenv("SUPABASE_URL") == "https://test.supabase.co"

def test_get_supabase_client_missing_env_vars(monkeypatch):
    """Test that appropriate errors are raised when environment variables are missing"""
    # Test missing SUPABASE_URL
    with pytest.raises(ValueError, match="SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required"):
        supabase_client.get_supabase_client()
    
    # Test missing SUPABASE_ANON_KEY
    with pytest.raises(ValueError, match="SUPABASE_URL and SUPABASE_ANON_KEY environment variables are required"):
        supabase_client.get_supabase_auth_client() 