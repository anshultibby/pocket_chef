import logging
import os
import traceback
from uuid import UUID

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from .routers import pantry, recipes
from .services.auth import get_current_user

# Add logging configuration
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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


# Add a simple root endpoint for testing
@app.get("/")
async def root():
    logger.info("Root endpoint called")
    return {"status": "ok"}


@app.get("/health")
async def health_check():
    logger.info("Health check endpoint called")
    return {
        "status": "healthy",
        "port": os.getenv("PORT"),
    }


@app.on_event("startup")
async def startup_event():
    try:
        port = int(os.getenv("PORT", "8000"))  # Consistent default
        logger.info(f"Starting application on port {port}")
        logger.info(f"Current working directory: {os.getcwd()}")
        logger.info(f"Directory contents: {os.listdir()}")
    except Exception as e:
        logger.error(f"Startup error: {str(e)}")
        logger.error(traceback.format_exc())


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", "8000"))  # Consistent default

    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)
