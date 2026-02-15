🍽️ DietCraft AI
Smart Food Intelligence Platform(DietCraft AI)

AI-powered system for personalized recipe recommendation, intelligent meal planning, and obesity risk prediction.

📌 Overview

DietCraft AI is an end-to-end smart nutrition platform that combines:

🔎 AI-powered Recipe Recommendation

📅 7-Day Personalized Diet Chart Generator

🧬 ML-based Obesity Risk Prediction

The system converts unstructured user input into structured dietary intelligence, fetches real-time recipe data, optimizes meal plans, and predicts obesity risk using multiple lifestyle and body parameters.

🎯 Core Modules
1️⃣ AI Recipe Recommender

Personalized recipe discovery engine powered by Natural Language Processing.

🔹 What It Does

Converts user text like:

"High-protein Keto Mexican + Indian food under 1800 calories/day, no fried food"

Extracts structured dietary constraints

Fetches matching recipes from RecipeDB

Applies smart filtering rules

🔹 Data Source

Recipes are fetched from:

API_BASE_URL = "http://cosylab.iiitd.edu.in:6969"
API_ENDPOINT = "/recipe2-api/recipe/recipesinfo"

We dynamically query the RecipeDB API and process results in real-time.

2️⃣ 🥗 Smart 7-Day Diet Chart Generator

Clinical nutritionist-inspired meal planner with rule-based optimization.

🔹 Features

✅ NER pipeline (spaCy + Regex)

✅ Multi-model entity consolidation (voting + rule boosting)

✅ Schema-aligned RecipeDB query parameter generation

✅ Cuisine filtering (Indian, Mexican, etc.)

✅ Diet filtering (Keto, Vegan, Paleo, etc.)

✅ Protein range filtering

✅ Calorie limit enforcement

✅ Flavor preference filtering

✅ Cooking method exclusion (e.g., no fried food)

✅ Balanced 7-day meal rotation (Breakfast, Lunch, Dinner)

🔹 Live Data Fetching & Caching

Recipes are continuously fetched live from RecipeDB API.

Data is stored in a temporary cache.

The system keeps fetching until the API token expires.

Ensures fresh and dynamic meal plans.

3️⃣ 🧬 Obesity AI Detector

Machine Learning-based obesity category prediction tool.

🔹 Input Parameters

The model predicts obesity risk using:

Age

Gender

Height

Weight

BMI

Family history of overweight

Meal frequency

Water intake

Physical activity

Lifestyle patterns

Additional behavioral health parameters

🔹 Output

BMI Score

Obesity Category

Risk Status

Lifestyle Insights

Built using supervised ML techniques with structured health data.

🧠 System Architecture
User Input
     ↓
NER Pipeline (5 models)
     ↓
Entity Consolidation + Normalization
     ↓
RecipeDB Query Parameter Builder
     ↓
Live API Fetch
     ↓
Filtering Engine
     ↓
7-Day Meal Plan Generator

Parallel Module:

User Health Inputs
     ↓
Feature Processing
     ↓
ML Obesity Model
     ↓
Risk Category Prediction
