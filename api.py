from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import pandas as pd
import json

# Import Backend Logic
from recipe_service import RecipeService

app = FastAPI(title="Foodoscope API")

recipe_service = RecipeService()

# Allow CORS for React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load data into memory on startup
@app.on_event("startup")
def startup_event():
    print("🚀 App starting... Initializing sequential fetch (Local-First).")
    # Increased to 50 pages to build a larger original dataset
    recipe_service.fetch_recipes(max_new_pages=50) 
    print(f"✅ Active pool: {len(recipe_service.recipes)} recipes available.")

# Pydantic Models for the Diet Plan
class DietPlanRequest(BaseModel):
    daily_calories: float = 2000
    diet_type: Optional[str] = "any" # "vegan" or "any"
    max_cooking_time: Optional[float] = None
    min_calories: Optional[float] = None
    max_calories: Optional[float] = None
    region: Optional[str] = None
    servings: Optional[float] = None
    protein_goal: Optional[float] = None

class SearchRequest(BaseModel):
    query: str
    top_k: int = 20

@app.get("/")
def health_check():
    return {"status": "ok", "message": "Foodoscope API is running"}

@app.post("/search")
def search_recipes(request: SearchRequest):
    results = recipe_service.search_recipes(request.query, request.top_k)
    return {"recipes": results}

@app.post("/generate-diet-plan")
def generate_diet(request: DietPlanRequest):
    plan = recipe_service.generate_weekly_plan(
        daily_calories=request.daily_calories,
        diet_type=request.diet_type,
        max_time=request.max_cooking_time,
        region=request.region,
        protein_goal=request.protein_goal
    )
    
    if not plan:
        raise HTTPException(status_code=404, detail="No sufficient data in the database for now. Please try relaxing your filters or wait for more data to be fetched.")
        
    return plan

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
