import logging
import os
from uuid import UUID

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from .routers import pantry, recipes
from .services.auth import get_current_user

# Add logging configuration
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Get environment variables with defaults
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8000"))

# Store CORS origins in a variable
CORS_ORIGINS = [
    "http://localhost:3000",
    "https://kitchen-elf.com",
    "https://www.kitchen-elf.com",
    "https://app.kitchen-elf.com",
]

app = FastAPI(
    title="Smart Kitchen API",
    description="API for managing pantry items and recipes",
    version="1.0.0",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Include routers
app.include_router(pantry.router)
app.include_router(recipes.router)


@app.get("/health", tags=["health"])
async def health_check():
    return {
        "status": "healthy",
        "cors_origins": CORS_ORIGINS,
        "host": HOST,
        "port": PORT,
    }


@app.on_event("startup")
async def startup_event():
    # Log all environment variables (excluding sensitive ones)
    logger.info(f"PORT: {os.getenv('PORT')}")
    logger.info(f"HOST: {os.getenv('HOST')}")
    logger.info(f"SUPABASE_URL set: {bool(os.getenv('SUPABASE_URL'))}")
    logger.info(f"SUPABASE_KEY set: {bool(os.getenv('SUPABASE_KEY'))}")
    logger.info(
        f"GOOGLE_APPLICATION_CREDENTIALS set: {bool(os.getenv('GOOGLE_APPLICATION_CREDENTIALS'))}"
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host=HOST, port=PORT, reload=True, log_level="info")
