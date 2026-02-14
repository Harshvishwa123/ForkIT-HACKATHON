import pandas as pd
import json
import re
from sentence_transformers import SentenceTransformer
import numpy as np
import ast

# -------------------------------
# Load Model Globally (Once)
# -------------------------------
# Using a small, fast model for hackathon performance
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
# Scoring function (Rule Based)
# -------------------------------
def score_recipe_rules(recipe_entities, user_entities):
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
# Main recipe finder (Hybrid)
# -------------------------------
def find_matching_recipes(recipes_df: pd.DataFrame, user_entities: dict, user_query: str, top_k=20):
    results = []

    # 1. Compute Query Embedding
    if user_query:
        query_embedding = model.encode(user_query, normalize_embeddings=True)
    else:
        query_embedding = None

    calorie_limit = user_entities.get("CALORIE_LIMIT")
    protein_goal = user_entities.get("PROTEIN_GOAL")
    protein_threshold = extract_protein_threshold(protein_goal)

    avoid_methods = set(user_entities.get("METHOD_AVOID", []))
    user_diet = user_entities.get("DIET")

    for _, row in recipes_df.iterrows():
        recipe_entities = row.get("NER_ENTITIES")

        # if stored as JSON string, decode it
        if isinstance(recipe_entities, str):
            try:
                recipe_entities = json.loads(recipe_entities)
            except:
                recipe_entities = {}

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
        # HYBRID SCORING
        # -------------------------
        
        # A. Rule Score
        rule_score = score_recipe_rules(recipe_entities, user_entities)
        
        # B. Semantic Score (Embedding)
        embedding_score = 0.0
        if query_embedding is not None and "embedding" in row and pd.notna(row["embedding"]):
            try:
                # Parse embedding from string if necessary
                rec_emb_raw = row["embedding"]
                if isinstance(rec_emb_raw, str):
                   rec_emb = np.array(ast.literal_eval(rec_emb_raw))
                else:
                   rec_emb = np.array(rec_emb_raw)
                   
                # Cosine Similarity
                embedding_score = np.dot(query_embedding, rec_emb)
            except:
                embedding_score = 0.0
        
        # C. Final Weighted Score
        # Normalize rule score roughly to 0-1 range (assuming max rule score around 15-20)
        normalized_rule = min(rule_score / 15.0, 1.0) 
        
        # Hybrid formula: 70% Semantic, 30% Rules
        final_score = (0.7 * embedding_score) + (0.3 * normalized_rule)

        results.append({
            "Recipe_id": row.get("Recipe_id"),
            "Recipe_title": row.get("Recipe_title"),
            "Calories": row.get("Calories"),
            "Protein (g)": row.get("Protein (g)"),
            "Region": row.get("Region"),
            "Score": final_score, # Now a float
            "Matched_Entities": recipe_entities,
            "Debug_Rule_Score": rule_score,
            "Debug_Emb_Score": embedding_score
        })

    # Sort by Final Hybrid Score
    ranked = sorted(results, key=lambda x: x["Score"], reverse=True)
    return ranked[:top_k]
