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

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum
from auth_routes import router as auth_router
from game_routes import router as game_router
from voice_routes import router as voice_router

import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

logger.info("Lambda cold start: app.py successfully loaded")

app = FastAPI(title="Whisper Chase: 20 Questions")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this properly for production
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(game_router)
app.include_router(voice_router)

# Root Check
@app.get("/")
async def root():
    logger.info("Root endpoint called")
    return {
        "message": "Hello from WhisperChase Game API with Auth on Lambda!",
        "status": "healthy",
        "version": "1.0.0"
    }

# Health checks
@app.get("/health")
def health_check():
    logger.info("Health endpoint called")
    return {"status": "healthy"}

# Lambda handler with enhanced logging
def handler(event, context):
    logger.info(f"Lambda invoked with event: {event}")
    
    try:
        # Use Mangum to handle the FastAPI app
        mangum_handler = Mangum(app)
        response = mangum_handler(event, context)
        logger.info(f"Lambda response: {response}")
        print(f"Lambda response: {response}")
        return response
    except Exception as e:
        logger.error(f"Lambda handler error: {str(e)}")
        print(f"Lambda handler error: {str(e)}")
        raise