from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from .data_adapter import DataAdapter
import uvicorn
import os

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

adapter = DataAdapter()

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.post("/analyze")
async def analyze_file(file: UploadFile = File(...)):
    try:
        content = await file.read()
        df = adapter.clean_data(content, file.filename)
        analysis = adapter.analyze_financials(df)
        return analysis
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
