from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Potion Pantry API",
    description="Track 01: Inventory prediction for a sudden festival demand spike",
    version="0.1.0"
)

# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {
        "message": "Potion Pantry API is alive!",
        "role": "Person B - The Engine",
        "status": "ready"
    }

@app.get("/health")
def health_check():
    return {"status": "ok"}
