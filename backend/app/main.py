from fastapi import FastAPI

app = FastAPI(
    title="AssetFlow API",
    version="1.0.0",
    description="Enterprise Asset & Resource Management System"
)

@app.get("/")
def root():
    return {
        "message": "Welcome to AssetFlow Backend 🚀"
    }