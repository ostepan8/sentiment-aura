from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Sentiment Aura API")

# CORS for local dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"message": "Sentiment Aura API"}


@app.post("/api/process_text")
async def process_text(data: dict):
    text = data.get("text", "")

    # TODO: Call LLM API
    # For now, return dummy data
    return {"sentiment": 0.5, "keywords": ["placeholder"]}
