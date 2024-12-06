import logging
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import pantry, recipes

# Add logging configuration
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Get environment variables with defaults
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8000"))

# Store CORS origins in a variable
CORS_ORIGINS = [
    "http://localhost:3000",
    "http://frontend:3000",
    "http://127.0.0.1:3000",
    # Add the Docker network URL
    f"http://frontend:{PORT}"
]

app = FastAPI(
    title="Smart Kitchen API",
    description="API for managing pantry items and recipes",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Include routers
app.include_router(pantry.router, prefix="/pantry", tags=["pantry"])
app.include_router(recipes.router, prefix="/recipes", tags=["recipes"])

@app.get("/health", tags=["health"])
async def health_check():
    return {
        "status": "healthy",
        "cors_origins": CORS_ORIGINS,
        "host": HOST,
        "port": PORT
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=HOST,
        port=PORT,
        reload=True,
        log_level="info"
    )
