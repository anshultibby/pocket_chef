import logging
import os
import traceback

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api import users
from .routers import feedback, pantry, profile, recipes

# Add logging configuration
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Store CORS origins in a variable
CORS_ORIGINS = [
    "http://localhost:3000",
    "https://kitchen-elf.vercel.app",
    "https://kitchen-elf.com",
    "https://www.kitchen-elf.com",
    "capacitor://localhost",
    "http://localhost",
    "capacitor://kitchen-elf.com",
    "http://127.0.0.1",
    "http://127.0.0.1:*",
    "http://localhost:*",
    "app://localhost",
]

app = FastAPI(
    title="Smart Kitchen API",
    description="API for managing pantry items and recipes",
    version="1.0.0",
)

# Configure CORS with settings for mobile
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_origin_regex=r"https://.*\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*", "Authorization", "Content-Type"],
    expose_headers=["*"],
    max_age=3600,
)

# Include routers
app.include_router(pantry.router)
app.include_router(recipes.router)
app.include_router(profile.router)
app.include_router(feedback.router)
app.include_router(users.router, prefix="/users", tags=["users"])


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
        # Railway sets PORT environment variable
        port = int(os.getenv("PORT", "8080"))  # Default to 8080 for Railway
        logger.info(f"Starting application on port {port}")
        logger.info(f"Current working directory: {os.getcwd()}")
        logger.info(f"Directory contents: {os.listdir()}")
    except Exception as e:
        logger.error(f"Startup error: {str(e)}")
        logger.error(traceback.format_exc())


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", "8080"))  # Keep consistent with startup event
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)
