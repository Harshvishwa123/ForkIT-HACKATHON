import pandas as pd
import json
import re
from sentence_transformers import SentenceTransformer
import numpy as np
import ast

model = SentenceTransformer("all-MiniLM-L6-v2")


# -------------------------------
# Protein threshold extractor
# -------------------------------
def extract_protein_threshold(protein_goal: str):
    """
    Convert protein goal text into numeric threshold.
    Example: "35 g protein" -> 35
    """
    if not protein_goal:
        return None

    match = re.search(r"(\d+)\s*g", protein_goal.lower())
    if match:
        return int(match.group(1))

    if protein_goal.lower() == "high":
        return 25
    if protein_goal.lower() == "medium":
        return 15
    if protein_goal.lower() == "low":
        return 0

    return None


# -------------------------------
# Scoring function
# -------------------------------
def score_recipe(recipe_entities, user_entities):
    score = 0

    # cuisine match
    user_cuisines = set(user_entities.get("CUISINE", []))
    recipe_cuisines = set(recipe_entities.get("CUISINE", []))
    score += len(user_cuisines.intersection(recipe_cuisines)) * 5

    # flavor match
    user_flavors = set(user_entities.get("FLAVOR", []))
    recipe_flavors = set(recipe_entities.get("FLAVOR", []))
    score += len(user_flavors.intersection(recipe_flavors)) * 3

    # method preference match
    user_methods = set(user_entities.get("METHOD_PREFERENCE", []))
    recipe_methods = set(recipe_entities.get("METHOD_PREFERENCE", []))
    score += len(user_methods.intersection(recipe_methods)) * 2

    return score


# -------------------------------
# Main recipe finder
# -------------------------------
def find_matching_recipes(recipes_df: pd.DataFrame, user_entities: dict, query: str = None, top_k=20):
    results = []

    calorie_limit = user_entities.get("CALORIE_LIMIT")
    protein_goal = user_entities.get("PROTEIN_GOAL")
    protein_threshold = extract_protein_threshold(protein_goal)

    avoid_methods = set(user_entities.get("METHOD_AVOID", []))
    user_diet = user_entities.get("DIET")

    # Semantic boosting if query exists
    query_embedding = None
    if query:
        query_embedding = model.encode(query, convert_to_tensor=True)

    for _, row in recipes_df.iterrows():
        recipe_entities = row.get("NER_ENTITIES")

        # if stored as JSON string, decode it
        if isinstance(recipe_entities, str):
            recipe_entities = json.loads(recipe_entities)

        if not isinstance(recipe_entities, dict):
            continue

        # -------------------------
        # HARD FILTERS
        # -------------------------

        # avoid methods check
        recipe_methods = set(recipe_entities.get("METHOD_PREFERENCE", []))
        if avoid_methods.intersection(recipe_methods):
            continue

        # calorie filter
        if calorie_limit is not None and not pd.isna(row.get("Calories")):
            if float(row["Calories"]) > calorie_limit:
                continue

        # protein filter
        if protein_threshold is not None and not pd.isna(row.get("Protein (g)")):
            if float(row["Protein (g)"]) < protein_threshold:
                continue

        # diet filter
        recipe_diet = recipe_entities.get("DIET")
        if user_diet and recipe_diet and user_diet.lower() != recipe_diet.lower():
            continue

        # -------------------------
        # SCORE + SAVE
        # -------------------------
        score = score_recipe(recipe_entities, user_entities)

        # Basic Semantic Boost (Hybrid)
        if query_embedding is not None and row.get("Recipe_title"):
            title_embedding = model.encode(row["Recipe_title"], convert_to_tensor=True)
            # Cosine similarity roughly (using torch if available, or just simple dot product)
            from sentence_transformers import util
            cosine_score = util.cos_sim(query_embedding, title_embedding).item()
            score += cosine_score * 10 # Boost score by semantic similarity
            
        results.append({
            "Recipe_id": row.get("Recipe_id"),
            "Recipe_title": row.get("Recipe_title"),
            "Calories": row.get("Calories"),
            "Protein (g)": row.get("Protein (g)"),
            "Region": row.get("Region"),
            "Score": score,
            "Matched_Entities": recipe_entities
        })

    ranked = sorted(results, key=lambda x: x["Score"], reverse=True)
    return ranked[:top_k]
