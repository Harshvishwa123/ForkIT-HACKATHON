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
    print("Fetching recipes into memory...")
    recipe_service.fetch_recipes(max_pages=10)
    print(f"✅ Cached {len(recipe_service.recipes)} recipes")

# Pydantic Models for the Diet Plan
class DietPlanRequest(BaseModel):
    daily_calories: float = 2000
    is_vegetarian: bool = True
    max_cooking_time: Optional[float] = None
    region: Optional[str] = None

@app.get("/")
def health_check():
    return {"status": "ok", "message": "Foodoscope API is running"}

@app.post("/generate-diet-plan")
def generate_diet(request: DietPlanRequest):
    plan = recipe_service.generate_weekly_plan(
        daily_calories=request.daily_calories,
        is_veg_pref=request.is_vegetarian,
        max_time=request.max_cooking_time,
        region=request.region
    )
    
    if not plan:
        raise HTTPException(status_code=404, detail="Could not generate plan with given constraints.")
        
    return plan
