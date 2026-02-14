# 🍽️ RecipeDB Diet Planner (NER + Meal Plan Generator)

## 📌 Overview
This project is a **Clinical Nutritionist + Data Engineering pipeline** that generates a **7-day meal plan** from a natural language user request.

It parses user input (example: *"High-protein Keto Mexican + Indian food under 1800 calories/day, no fried food"*) and converts it into structured **RecipeDB query parameters**, fetches recipes, filters them, and generates a balanced weekly diet chart.

---

## 🎯 Goals
- Convert unstructured user text into structured dietary constraints.
- Query RecipeDB using extracted parameters.
- Generate a 7-day meal plan (Breakfast, Lunch, Dinner).
- Ensure diet rules are respected (Keto/Vegan/etc.).
- Enforce calorie limits and protein goals.
- Rotate cooking methods so meals are not repetitive.

---

## 🧠 Key Features
✅ NER pipeline (spaCy, Regex)  
✅ Entity consolidation using voting + rule boosting  
✅ Schema-aligned RecipeDB query param generation  
✅ Supports cuisine-based filtering (region)  
✅ Supports diet-based filtering (keto, vegan, paleo, etc.)  
✅ Supports protein filtering via `protein-range`  
✅ Supports calorie constraints  
✅ Supports flavor preferences (spicy, savory, etc.)  
✅ Avoids excluded cooking methods (example: fried foods)  
✅ Generates weekly meal plan output

---

## 🏗️ System Pipeline

### Input → Output Flow
```text
User Input Text
     ↓
NER Pipeline (5 models)
     ↓
Entity Consolidation + Normalization
     ↓
RecipeDB Query Parameter Builder
     ↓
Recipe Fetching via API
     ↓
Filtering (diet + calories + protein + method constraints)
     ↓
Meal Plan Generation (7 days)
     ↓
Final Weekly Meal Chart Output
