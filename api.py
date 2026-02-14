from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import json

# Import Backend Logic
from ner_foodoscope import run_full_ner_pipeline, process_recipe_dataset
from recipe_finder import find_matching_recipes

app = FastAPI(title="Foodoscope API")

# Allow CORS for React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all for hackathon demo
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load Dataset Once
try:
    df = process_recipe_dataset('Datasets/foodoscope_recipes.csv')
    print("✅ Dataset Loaded")
except Exception as e:
    print(f"❌ Error Loading Dataset: {e}")
    df = pd.DataFrame()

# Pydantic Models
class SearchRequest(BaseModel):
    query: str
    top_k: int = 20

@app.get("/")
def health_check():
    return {"status": "ok", "message": "Foodoscope API is running"}

@app.post("/search")
def search_recipes(request: SearchRequest):
    if df.empty:
        raise HTTPException(status_code=500, detail="Dataset not loaded properly")
    
    # 1. Run NER
    ner_res = run_full_ner_pipeline(request.query)
    final_entities = ner_res["FINAL_ENTITIES"]
    
    # 2. Run Matcher (Hybrid)
    matches = find_matching_recipes(df, final_entities, request.query, top_k=request.top_k)
    
    # 3. Clean NaN for JSON Response
    clean_matches = []
    for m in matches:
        # Convert NaN to None/0 for JSON safety
        m["Score"] = float(m["Score"]) if pd.notna(m["Score"]) else 0.0
        m["Protein (g)"] = float(m["Protein (g)"]) if pd.notna(m["Protein (g)"]) else 0.0
        m["Calories"] = float(m["Calories"]) if pd.notna(m["Calories"]) else 0.0
        clean_matches.append(m)
        
    return {
        "entities": final_entities,
        "recipes": clean_matches
    }
