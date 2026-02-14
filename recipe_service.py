import requests

# =========================================================
# NON-VEG KEYWORDS
# =========================================================
NON_VEG_KEYWORDS = [
    "chicken","beef","mutton","pork","lamb","goat",
    "fish","salmon","tuna","shrimp","prawn","egg",
    "bacon","ham","sausage","kebab","meat","steak",
    "duck","turkey","crab","lobster","squid"
]

# =========================================================
# RECIPE SERVICE
# =========================================================
class RecipeService:

    def __init__(self):

        # 🔑 PUT YOUR API KEY HERE
        self.API_KEY = "funpjH9HxaR8tBQoCdq6J42kttnjlsT_yy2bN6QSJuAJUzzV"

        self.API_BASE_URL = "http://cosylab.iiitd.edu.in:6969"
        self.API_ENDPOINT = "/recipe2-api/recipe/recipesinfo"

        self.api_url = f"{self.API_BASE_URL}{self.API_ENDPOINT}"

        self.headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.API_KEY}"
        }

        self.recipes = []

    # =====================================================
    # FETCH RECIPES WITH PAGINATION
    # =====================================================
    def fetch_recipes(self, max_pages=10, limit=50):

        print("\n🚀 Fetching recipes into memory...\n")

        all_recipes = []

        for page in range(1, max_pages + 1):
            try:
                params = {"page": page, "limit": limit}

                print(f"📡 Fetching page {page}/{max_pages}...")

                response = requests.get(
                    self.api_url,
                    headers=self.headers,
                    params=params,
                    timeout=15
                )

                print("Status Code:", response.status_code)

                if response.status_code == 200:
                    data = response.json()

                    # Correct parsing for recipesinfo endpoint
                    page_recipes = data.get("payload", {}).get("data", [])

                    print(f"✅ Page {page}: {len(page_recipes)} recipes fetched")

                    if not page_recipes:
                        break

                    all_recipes.extend(page_recipes)

                else:
                    print("❌ API Error:", response.text)
                    break

            except Exception as e:
                print("⚠️ Error:", e)
                break

        self.recipes = all_recipes
        print(f"\n✨ Total Cached Recipes: {len(self.recipes)}\n")

        return self.recipes

    # =====================================================
    # VEG CHECK
    # =====================================================
    def is_veg(self, recipe):
        text = (
            str(recipe.get("Recipe_title", "")).lower() + " " +
            str(recipe.get("ingredients", "")).lower()
        )
        return not any(kw in text for kw in NON_VEG_KEYWORDS)

    # =====================================================
    # FILTER BASED ON USER INPUT
    # =====================================================
    def filter_recipes(self, is_veg_pref=True, max_time=None, region=None):

        filtered = []

        for r in self.recipes:

            # Veg filter
            if is_veg_pref and not self.is_veg(r):
                continue

            # Time filter
            if max_time:
                try:
                    if float(r.get("total_time", 0)) > max_time:
                        continue
                except:
                    continue

            # Region filter
            if region:
                r_region = str(r.get("Region", "")).lower()
                r_sub = str(r.get("Sub_region", "")).lower()
                if region.lower() not in r_region and region.lower() not in r_sub:
                    continue

            filtered.append(r)

        return filtered

    # =====================================================
    # PICK CLOSEST CALORIE MATCH
    # =====================================================
    def pick_closest_recipe(self, recipe_list, target_calories):

        if not recipe_list:
            return None

        def calorie_diff(recipe):
            try:
                return abs(float(recipe.get("Calories", 0)) - target_calories)
            except:
                return float("inf")

        return min(recipe_list, key=calorie_diff)

    # =====================================================
    # GENERATE WEEKLY DIET PLAN
    # =====================================================
    def generate_weekly_plan(self, daily_calories,
                             is_veg_pref=True,
                             max_time=None,
                             region=None):

        available = self.filter_recipes(
            is_veg_pref=is_veg_pref,
            max_time=max_time,
            region=region
        )

        if not available:
            print("❌ No recipes after filtering")
            return None

        targets = {
            "Breakfast": daily_calories * 0.30,
            "Lunch": daily_calories * 0.40,
            "Dinner": daily_calories * 0.30
        }

        days = ["Monday","Tuesday","Wednesday",
                "Thursday","Friday","Saturday","Sunday"]

        plan = {}

        for day in days:
            plan[day] = {}

            for meal, target in targets.items():
                best = self.pick_closest_recipe(available, target)
                plan[day][meal] = {
                    "Recipe_title": best.get("Recipe_title"),
                    "Calories": best.get("Calories"),
                    "Region": best.get("Region"),
                    "Total_time": best.get("total_time")
                }

        return plan


# =====================================================
# TEST RUN
# =====================================================
if __name__ == "__main__":

    service = RecipeService()

    service.fetch_recipes(max_pages=5)

    weekly_plan = service.generate_weekly_plan(
        daily_calories=1800,
        is_veg_pref=True,
        max_time=60,
        region="Indian"
    )

    print("\n📅 GENERATED WEEKLY PLAN:\n")
    print(weekly_plan)
