import requests
import json
import os

# ------------------------------
# CONFIGURATION
# ------------------------------

CACHE_FILE = "recipes_cache.json"

# ------------------------------
# RECIPE SERVICE
# ------------------------------

class RecipeService:
    def __init__(self):
        self.cache_file = CACHE_FILE
        self.recipes = []
        self.last_fetched_page = 0
        self.load_cache()

    # ------------------------------
    # Load cached recipes from single JSON
    # ------------------------------
    def load_cache(self):
        try:
            if os.path.exists(self.cache_file):
                with open(self.cache_file, "r", encoding="utf-8") as f:
                    data = json.load(f)

                    # Case 1: Proper dict format
                    if isinstance(data, dict):
                        self.recipes = data.get("recipes", [])
                        self.last_fetched_page = data.get("last_fetched_page", 0)

                    # Case 2: Old list-only format
                    elif isinstance(data, list):
                        print("⚠️ Old cache format detected. Converting...")
                        self.recipes = data
                        self.last_fetched_page = 0
                        self.save_cache()  # Save in correct format

                    print(f"📦 Loaded {len(self.recipes)} recipes from cache")
            else:
                print("🆕 No cache found. Starting fresh.")

        except Exception as e:
            print(f"⚠️ Error loading cache: {e}")
            self.recipes = []
            self.last_fetched_page = 0

    # ------------------------------
    # Save cache with structured keys
    # ------------------------------
    def save_cache(self):
        with open(self.cache_file, "w", encoding="utf-8") as f:
            json.dump({
                "last_fetched_page": self.last_fetched_page,
                "recipes": self.recipes
            }, f, indent=2)


    # ------------------------------
    # Fetch new pages sequentially
    # ------------------------------
    def fetch_recipes(self, max_new_pages=50, limit=20):
        print(f"📡 Current cache count: {len(self.recipes)} recipes")
        
        # API Config (Move to instance if needed, keeping here for simplicity)
        API_KEY = "SXUtue0kpjPJQpVbrUiibRM8J0dYB2SqwDzz9udpn9PTlk1n"
        API_URL = "http://cosylab.iiitd.edu.in:6969/recipe2-api/recipe/recipesinfo"
        HEADERS = {
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json"
        }

        start_page = self.last_fetched_page + 1
        end_page = start_page + max_new_pages
        
        print(f"🔄 Sequential fetch: Starting from Page {start_page}...")

        existing_ids = {r.get("_id") for r in self.recipes if r.get("_id")}
        new_count = 0

        for page in range(start_page, end_page):
            try:
                response = requests.get(
                    API_URL,
                    headers=HEADERS,
                    params={"page": page, "limit": limit},
                    timeout=15
                )

                if response.status_code == 200:
                    data = response.json()
                    page_data = data.get("payload", {}).get("data", [])

                    if not page_data:
                        print(f"   🛑 Page {page} is empty. Reached end of API.")
                        break

                    for r in page_data:
                        if r.get("_id") not in existing_ids:
                            self.recipes.append(r)
                            existing_ids.add(r.get("_id"))
                            new_count += 1
                    
                    self.last_fetched_page = page
                    self.save_cache() # Save progress after each page
                    print(f"   ✅ Fetched Page {page} ({len(page_data)} items)")
                else:
                    print(f"   ❌ Error on Page {page}: {response.status_code}")
                    break

            except Exception as e:
                print(f"   ⚠️ Request failed on Page {page}: {e}")
                break

        if new_count > 0:
            print(f"✨ Successfully added {new_count} new recipes to local cache.")
            self.save_cache()
        else:
            print("ℹ️ No new recipes were found.")

    # ------------------------------
    # Dataset-Driven Filtering Logic
    # ------------------------------
    def match_recipe(self, r, diet_type="any", max_time=None, region=None, protein_goal=None):
        try:
            # 1. Diet Type (vegan column: "1.0" or "0.0")
            if diet_type == "vegan":
                if str(r.get("vegan", "0.0")) != "1.0":
                    return False

            # 2. Max Time (total_time column)
            if max_time:
                t = float(r.get("total_time", 999))
                if t > max_time:
                    return False

            # 3. Protein Goal (Protein (g))
            if protein_goal:
                p = float(r.get("Protein (g)", 0))
                if p < protein_goal:
                    return False

            # 4. Region (Region or Sub_region)
            if region:
                r_reg = str(r.get("Region", "")).lower()
                r_sub = str(r.get("Sub_region", "")).lower()
                if region.lower() not in r_reg and region.lower() not in r_sub:
                    return False

            return True
        except:
            return False

    # ------------------------------
    # PROGRESSIVE RELAXED FILTERING
    # ------------------------------
    def get_filtered_pool(self, diet_type="any", max_time=None, region=None, protein_goal=None):
        
        # Level 1: Strict match
        pool = [r for r in self.recipes if self.match_recipe(r, diet_type, max_time, region, protein_goal)]
        if pool: return pool

        print("⚠️ Relaxing filters (protein)...")
        # Level 2: Relax Protein
        pool = [r for r in self.recipes if self.match_recipe(r, diet_type, max_time, region, None)]
        if pool: return pool

        print("⚠️ Relaxing filters (time)...")
        # Level 3: Relax Time
        pool = [r for r in self.recipes if self.match_recipe(r, diet_type, None, region, None)]
        if pool: return pool

        print("⚠️ Relaxing filters (region)...")
        # Level 4: Relax Region (Diet type is sacred)
        pool = [r for r in self.recipes if self.match_recipe(r, diet_type, None, None, None)]
        if pool: return pool

        # Final Fallback: Just diet type or all
        return self.recipes

    # ------------------------------
    # SIMPLE KEYWORD SEARCH
    # ------------------------------
    def search_recipes(self, query, top_k=20):
        if not self.recipes:
            return []
            
        q = query.lower()
        results = []
        for r in self.recipes:
            text = (str(r.get("Recipe_title", "")) + " " + str(r.get("ingredients", ""))).lower()
            if q in text:
                results.append(r)
        
        return results[:top_k]

    # ------------------------------
    # 7-DAY DIET PLAN GENERATOR
    # ------------------------------
    def generate_weekly_plan(self, daily_calories, diet_type="any", max_time=None, region=None, protein_goal=None):
        
        # Calculate split targets
        targets = {
            "Breakfast": daily_calories * 0.30,
            "Lunch": daily_calories * 0.40,
            "Dinner": daily_calories * 0.30
        }

        # Get the recipe pool based on constraints
        pool = self.get_filtered_pool(diet_type, max_time, region, protein_goal)
        print(f"📊 Filtering complete. Final pool size: {len(pool)}")

        days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        plan = {}
        used_ids = set()

        for day in days:
            plan[day] = {}
            for meal, target in targets.items():
                
                # Filter out used recipes to avoid repetition
                available = [r for r in pool if r.get("_id") not in used_ids]
                
                # If we ran out of recipes, reset the used set for diversity
                if not available:
                    used_ids.clear()
                    available = pool

                # Pick closest calorie match
                best_match = min(available, key=lambda x: abs(float(x.get("Calories", 0)) - target))
                
                # Store only required fields for the UI
                plan[day][meal] = {
                    "Recipe_title": best_match.get("Recipe_title"),
                    "Calories": float(best_match.get("Calories", 0)),
                    "total_time": best_match.get("total_time"),
                    "Protein (g)": best_match.get("Protein (g)"),
                    "Region": best_match.get("Region"),
                    "Sub_region": best_match.get("Sub_region"),
                    "ingredients": best_match.get("ingredients"),
                    "instructions": best_match.get("instructions"),
                    "_id": best_match.get("_id")
                }
                used_ids.add(best_match.get("_id"))

        return plan
