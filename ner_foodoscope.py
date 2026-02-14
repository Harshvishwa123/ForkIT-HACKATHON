import re
import json
import pandas as pd
from collections import defaultdict, Counter
import warnings
warnings.filterwarnings('ignore')

# ---------------------------------------------------
# Supported DB/API vocab (IMPORTANT for normalization)
# ---------------------------------------------------
SUPPORTED_CUISINES = [
    "Mexican", "Indian", "Italian", "Chinese", "Thai",
    "Mediterranean", "American", "Japanese", "Middle Eastern",
    "African", "Egyptian", "Northern Africa", "Rest Africa"
]

SUPPORTED_DIETS = [
    "Keto", "Vegan", "Paleo", "Gluten-free", "Low-carb", "Vegetarian"
]

SUPPORTED_FLAVORS = [
    "Spicy", "Sweet", "Savory", "Tangy", "Smoky", "Garlic", "Peppery",
    "Salty", "Bitter", "Umami"
]

SUPPORTED_METHODS = [
    "Grilled", "Baked", "Roasted", "Steamed", "Boiled",
    "Stir-fry", "Sautéed", "Slow-cooked", "Simmered", "Air-fried",
    "Heat", "Cook", "Fry", "Blend", "Mix", "Poach", "Broil"
]

AVOID_METHODS_KEYWORDS = ["fried", "deep fried", "deep-fried"]


# ---------------------------------------------------
# Protein Range Mapper
# ---------------------------------------------------
def protein_range_mapper(goal: str):
    if not goal:
        return None

    goal = goal.lower().strip()

    if goal in ["high", "high-protein", "high protein"]:
        return ">25g"
    elif goal in ["medium", "moderate"]:
        return "15-25g"
    elif goal in ["low"]:
        return "<15g"

    # explicit grams: "40g protein"
    gram_match = re.search(r"(\d+)\s*g", goal)
    if gram_match:
        grams = int(gram_match.group(1))
        if grams > 25:
            return ">25g"
        elif 15 <= grams <= 25:
            return "15-25g"
        else:
            return "<15g"

    return None


# ---------------------------------------------------
# Regex extraction (Calories + protein)
# ---------------------------------------------------
def extract_calorie_limit(text: str):
    lower = text.lower()
    match = re.search(r"(?:under|below|less than|<=)\s*(\d+)\s*(?:kcal|cal|calories)?", lower)
    if match:
        return int(match.group(1))

    match2 = re.search(r"(\d+)\s*(?:kcal|cal|calories)\s*(?:per day|daily|a day)", lower)
    if match2:
        return int(match2.group(1))

    return None


def extract_protein_goal(text: str):
    lower = text.lower()

    if "high protein" in lower or "high-protein" in lower:
        return "High"
    if "low protein" in lower:
        return "Low"
    if "medium protein" in lower:
        return "Medium"

    # grams based protein goal
    gram_match = re.search(r"(\d+)\s*g\s*protein", lower)
    if gram_match:
        return gram_match.group(0)

    return None


# ---------------------------------------------------
# Rule-based keyword extraction
# ---------------------------------------------------
def rule_based_ner(text: str):
    if not text:
        return {
            "CUISINE": [],
            "DIET": None,
            "FLAVOR": [],
            "METHOD_PREFERENCE": [],
            "METHOD_AVOID": [],
            "PROTEIN_GOAL": None,
            "CALORIE_LIMIT": None
        }
    
    lower = text.lower()

    cuisines = [c for c in SUPPORTED_CUISINES if c.lower() in lower]
    diet = next((d for d in SUPPORTED_DIETS if d.lower() in lower), None)
    flavors = [f for f in SUPPORTED_FLAVORS if f.lower() in lower]
    methods_pref = [m for m in SUPPORTED_METHODS if m.lower() in lower]

    avoid_methods = []
    if "no fried" in lower or "avoid fried" in lower:
        avoid_methods.extend(["Fried", "Deep-fried"])

    protein_goal = extract_protein_goal(text)
    calorie_limit = extract_calorie_limit(text)

    return {
        "CUISINE": cuisines,
        "DIET": diet,
        "FLAVOR": flavors,
        "METHOD_PREFERENCE": methods_pref,
        "METHOD_AVOID": avoid_methods,
        "PROTEIN_GOAL": protein_goal,
        "CALORIE_LIMIT": calorie_limit
    }


# ---------------------------------------------------
# spaCy Transformer NER (optional - requires spacy)
# ---------------------------------------------------
def spacy_ner(text: str):
    try:
        import spacy
        nlp = spacy.load("en_core_web_sm")
        doc = nlp(text)
        return [(ent.text, ent.label_) for ent in doc.ents]
    except Exception as e:
        return []


# ---------------------------------------------------
# Helper: scan NER results for known vocab
# ---------------------------------------------------
def match_vocab_from_ner(ner_results):
    cuisines = set()
    diets = set()
    flavors = set()
    methods = set()

    for phrase, label in ner_results:
        phrase_lower = phrase.lower()

        for c in SUPPORTED_CUISINES:
            if c.lower() in phrase_lower:
                cuisines.add(c)

        for d in SUPPORTED_DIETS:
            if d.lower() in phrase_lower:
                diets.add(d)

        for f in SUPPORTED_FLAVORS:
            if f.lower() in phrase_lower:
                flavors.add(f)

        for m in SUPPORTED_METHODS:
            if m.lower() in phrase_lower:
                methods.add(m)

    return {
        "CUISINE": list(cuisines),
        "DIET": list(diets),
        "FLAVOR": list(flavors),
        "METHOD_PREFERENCE": list(methods)
    }


# ---------------------------------------------------
# Consolidation logic (Voting + Rule boosting)
# ---------------------------------------------------
def consolidate_entities(rule_out, spacy_out, raw_text):
    vote = defaultdict(list)

    # rule based is strongest for domain
    for k, v in rule_out.items():
        if v:
            vote[k].append(v)

    # vocab matching from spacy output
    matched = match_vocab_from_ner(spacy_out)
    for k, v in matched.items():
        if v:
            vote[k].append(v)

    final = {}

    # Merge list fields
    for field in ["CUISINE", "FLAVOR", "METHOD_PREFERENCE"]:
        merged = []
        for chunk in vote.get(field, []):
            merged.extend(chunk if isinstance(chunk, list) else [chunk])

        final[field] = sorted(list(set(merged)))

    # Diet should be single (take most common)
    diets = []
    for chunk in vote.get("DIET", []):
        diets.extend(chunk if isinstance(chunk, list) else [chunk])

    if diets:
        final["DIET"] = Counter(diets).most_common(1)[0][0]
    else:
        final["DIET"] = None

    # protein + calorie always regex/rule based
    final["PROTEIN_GOAL"] = extract_protein_goal(raw_text)
    final["CALORIE_LIMIT"] = extract_calorie_limit(raw_text)

    # avoid fried foods logic
    lower = raw_text.lower()
    avoid = []
    if "no fried" in lower or "avoid fried" in lower:
        avoid.extend(["Fried", "Deep-fried"])

    final["METHOD_AVOID"] = avoid

    return final


# ---------------------------------------------------
# Build recipedb query params based on YOUR endpoints
# ---------------------------------------------------
def build_recipedb_params(entities: dict):
    params = {
        "cuisine": entities.get("CUISINE", []),
        "diet": entities.get("DIET"),
        "flavor": entities.get("FLAVOR", []),
        "cooking_method": entities.get("METHOD_PREFERENCE", []),
        "exclude_methods": entities.get("METHOD_AVOID", []),
        "protein_goal": entities.get("PROTEIN_GOAL"),
        "calorie_limit": entities.get("CALORIE_LIMIT"),
    }

    return params


# ---------------------------------------------------
# MAIN PIPELINE
# ---------------------------------------------------
def run_full_ner_pipeline(user_text: str):
    rule_out = rule_based_ner(user_text)
    spacy_out = spacy_ner(user_text)

    final_entities = consolidate_entities(
        rule_out, spacy_out, user_text
    )

    recipedb_query_params = build_recipedb_params(final_entities)

    return {
        "NER_RULE_BASED": rule_out,
        "NER_SPACY": spacy_out,
        "FINAL_ENTITIES": final_entities,
        "QUERY_PARAMS": recipedb_query_params
    }


# ---------------------------------------------------
# Process CSV Dataset
# ---------------------------------------------------
def process_recipe_dataset(csv_path):
    """Process foodoscope recipes CSV and extract entities from recipe fields"""
    
    df = pd.read_csv(csv_path)
    results = []
    
    for idx, row in df.iterrows():
        # Combine relevant fields for NER
        recipe_text = f"{row.get('Recipe_title', '')} {row.get('Region', '')} {row.get('Processes', '')}"
        
        # Run NER pipeline
        ner_result = run_full_ner_pipeline(recipe_text)
        
        # Add to results
        results.append({
            'Recipe_id': row.get('Recipe_id'),
            'Recipe_title': row.get('Recipe_title'),
            'Region': row.get('Region'),
            'Continent': row.get('Continent'),
            'Calories': row.get('Calories'),
            'Protein (g)': row.get('Protein (g)'),
            'Processes': row.get('Processes'),
            'NER_ENTITIES': ner_result['FINAL_ENTITIES'],
            'QUERY_PARAMS': ner_result['QUERY_PARAMS']
        })
    
    return pd.DataFrame(results)


# ---------------------------------------------------
# Save results
# ---------------------------------------------------
def save_ner_results(results_df, output_csv, output_json):
    """Save NER results to CSV and JSON"""
    
    # For CSV, convert dict columns to JSON strings
    results_csv = results_df.copy()
    results_csv['NER_ENTITIES'] = results_csv['NER_ENTITIES'].apply(json.dumps)
    results_csv['QUERY_PARAMS'] = results_csv['QUERY_PARAMS'].apply(json.dumps)
    
    results_csv.to_csv(output_csv, index=False)
    print(f"✓ Results saved to {output_csv}")
    
    # Full JSON with all details
    results_df.to_json(output_json, orient='records', indent=2)
    print(f"✓ Full results saved to {output_json}")


# Module exposes NER functions only. Import and call `run_full_ner_pipeline(user_text)`
# Example:
# from ner_foodoscope import run_full_ner_pipeline
# res = run_full_ner_pipeline("High-protein Keto, spicy Indian, under 1800 kcal, no fried foods")
# print(res['FINAL_ENTITIES'])
