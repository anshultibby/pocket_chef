from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import pantry, recipes

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(pantry.router, prefix="/pantry", tags=["pantry"])
app.include_router(recipes.router, prefix="/recipes", tags=["recipes"])

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
