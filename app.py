import streamlit as st
import pandas as pd
import json
import time
import random
import plotly.express as px

# ---------------------------------------------------
# Backend Imports (DO NOT MODIFY BACKEND)
# ---------------------------------------------------
from ner_foodoscope import run_full_ner_pipeline, process_recipe_dataset
from recipe_finder import find_matching_recipes

# ---------------------------------------------------
# Page Config & Styling
# ---------------------------------------------------
st.set_page_config(
    page_title="Foodoscope AI",
    page_icon="🥑",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom Styling (Light Theme / Paste Colors)
st.markdown("""
<style>
    /* Global Font & Body */
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap');
    
    html, body, [class*="css"] {
        font-family: 'Outfit', sans-serif;
        color: #2D3436;
        background-color: #F8F9FA; 
    }

    /* Hero Section */
    .hero-container {
        background: linear-gradient(120deg, #a1c4fd 0%, #c2e9fb 100%);
        padding: 3rem 2rem;
        border-radius: 1.5rem;
        color: #2D3436;
        text-align: center;
        margin-bottom: 2rem;
        box-shadow: 0 10px 25px rgba(161, 196, 253, 0.3);
    }
    .hero-title {
        font-size: 3.5rem;
        font-weight: 800;
        margin-bottom: 0.5rem;
        background: -webkit-linear-gradient(#2980b9, #2c3e50);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
    }
    .hero-subtitle {
        font-size: 1.3rem;
        font-weight: 400;
        color: #576574;
    }

    /* Input Area */
    .stTextInput > div > div > input {
        border-radius: 12px;
        padding: 12px 15px;
        border: 2px solid #dfe6e9;
        font-size: 1.1rem;
        transition: all 0.3s;
    }
    .stTextInput > div > div > input:focus {
        border-color: #74b9ff;
        box-shadow: 0 0 0 2px rgba(116, 185, 255, 0.2);
    }

    /* Success Buttons (Examples) */
    .stButton button {
        border-radius: 25px;
        background-color: #ffffff;
        color: #2D3436;
        border: 1px solid #dfe6e9;
        padding: 0.6rem 1.2rem;
        font-weight: 600;
        box-shadow: 0 2px 5px rgba(0,0,0,0.03);
        transition: all 0.2s ease;
    }
    .stButton button:hover {
        background-color: #00cec9;
        color: white;
        border-color: #00cec9;
        transform: translateY(-2px);
        box-shadow: 0 5px 15px rgba(0, 206, 201, 0.3);
    }

    /* Primary Search Button */
    button[kind="primary"] {
        background: linear-gradient(90deg, #0984e3, #74b9ff) !important;
        border: none !important;
        box-shadow: 0 4px 15px rgba(9, 132, 227, 0.4) !important;
        transition: transform 0.2s, box-shadow 0.2s !important;
    }
    button[kind="primary"]:hover {
        transform: scale(1.02) !important;
        box-shadow: 0 6px 20px rgba(9, 132, 227, 0.5) !important;
    }

    /* Entity Pills */
    .entity-container {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 5px;
    }
    .entity-pill {
        padding: 6px 14px;
        border-radius: 20px;
        font-size: 0.9rem;
        font-weight: 600;
        display: inline-flex;
        align-items: center;
        border: 1px solid transparent;
    }
    .pill-cuisine { background-color: #e3f2fd; color: #1976d2; border-color: #bbdefb; }
    .pill-diet { background-color: #e8f5e9; color: #2e7d32; border-color: #c8e6c9; }
    .pill-flavor { background-color: #fff3e0; color: #ef6c00; border-color: #ffe0b2; }
    .pill-method { background-color: #f3e5f5; color: #7b1fa2; border-color: #e1bee7; }
    .pill-avoid { background-color: #ffebee; color: #c62828; border-color: #ffcdd2; }

    /* Recipe Card */
    .recipe-card {
        background-color: white;
        border-radius: 16px;
        padding: 1.5rem;
        box-shadow: 0 4px 20px rgba(0,0,0,0.05);
        border: 1px solid #f1f2f6;
        height: 100%;
        transition: transform 0.2s, box-shadow 0.2s;
        margin-bottom: 1rem;
    }
    .recipe-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 15px 30px rgba(0,0,0,0.08);
        border-color: #74b9ff;
    }
    .card-title {
        font-size: 1.4rem;
        font-weight: 700;
        color: #2d3436;
        margin-bottom: 0.8rem;
        line-height: 1.3;
    }
    .card-badges {
        display: flex;
        gap: 0.8rem;
        margin-bottom: 1rem;
        flex-wrap: wrap;
    }
    .badge {
        font-size: 0.85rem;
        font-weight: 700;
        padding: 4px 10px;
        border-radius: 8px;
    }
    .badge-protein-high { background-color: #d1fae5; color: #059669; }
    .badge-protein-med { background-color: #fef3c7; color: #d97706; }
    .badge-cal-high { background-color: #fee2e2; color: #dc2626; }
    .badge-cal-ok { background-color: #e0f2fe; color: #0284c7; }

    /* Details Table Style */
    .details-row {
        display: flex;
        justify-content: space-between;
        padding: 4px 0;
        border-bottom: 1px solid #f1f2f6;
        font-size: 0.95rem;
    }
    .details-label { font-weight: 600; color: #636e72; }
    .details-val { color: #2d3436; font-weight: 500; text-align: right; }

    /* Diet Chart */
    .diet-day-card {
        background: white;
        border-radius: 12px;
        padding: 1rem;
        box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        border: 1px solid #f1f2f6;
        height: 100%;
    }
    .meal-slot {
        margin-bottom: 10px;
        padding: 8px;
        background: #f8f9fa;
        border-radius: 8px;
        border-left: 3px solid #74b9ff;
    }
    .meal-type {
        font-size: 0.75rem;
        text-transform: uppercase;
        color: #b2bec3;
        font-weight: 700;
        letter-spacing: 0.5px;
    }
    .meal-name {
        font-size: 0.9rem;
        font-weight: 600;
        color: #2d3436;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

</style>
""", unsafe_allow_html=True)

# ---------------------------------------------------
# Sidebar Controls
# ---------------------------------------------------
with st.sidebar:
    st.image("https://cdn-icons-png.flaticon.com/512/2921/2921822.png", width=60) # Placeholder Icon
    st.title("Settings")
    
    st.markdown("### 🔍 Search Filters")
    top_k_slider = st.slider("Results to Analyze", 5, 50, 20, 5)
    
    st.markdown("### 🥗 Preference Tweaks")
    st.info("These apply after AI search")
    min_prot = st.slider("Min Protein (g)", 0, 100, 0)
    max_cal = st.slider("Max Calories", 100, 2000, 2000)
    
    st.divider()
    if st.button("🧹 Clear Results"):
        st.session_state.clear()
        st.rerun()

    st.markdown("---")
    st.caption("v2.0 • Hackathon Edition")


# ---------------------------------------------------
# Helper Functions
# ---------------------------------------------------

def render_hero():
    st.markdown("""
        <div class="hero-container">
            <div class="hero-title">Foodoscope AI</div>
            <div class="hero-subtitle">Your Intelligent, Structured Diet Planner 🥗</div>
        </div>
    """, unsafe_allow_html=True)

@st.cache_data
def load_data():
    # Only load data once
    return process_recipe_dataset('Datasets/foodoscope_recipes.csv')

def animated_loading():
    with st.status("🧠 AI is thinking...", expanded=True) as status:
        st.write("🔍 Analyzing your request...")
        time.sleep(0.5)
        st.write("🥦 Extracting dietary constraints...")
        time.sleep(0.5)
        st.write("🍳 Matching recipes from database...")
        time.sleep(0.5)
        status.update(label="✅ Recipe plan ready!", state="complete", expanded=False)

def format_list(item_list):
    if not item_list:
        return "None"
    if isinstance(item_list, list):
        return ", ".join(item_list)
    return str(item_list)

def render_recipe_card(recipe, user_entities):
    # Nutrition Logic
    prot = float(recipe.get('Protein (g)', 0))
    cal = float(recipe.get('Calories', 0))
    region = recipe.get('Region', 'Unknown')
    score = recipe.get('Score', 0)
    
    # Badges
    prot_badge = ""
    if prot > 25:
        prot_badge = f'<span class="badge badge-protein-high">💪 {prot}g High Protein</span>'
    elif prot >= 15:
        prot_badge = f'<span class="badge badge-protein-med">🥩 {prot}g Protein</span>'
    else:
        prot_badge = f'<span class="badge" style="background:#f1f2f6; color:#636e72">{prot}g Protein</span>'
        
    cal_badge = ""
    if cal > 600:
        cal_badge = f'<span class="badge badge-cal-high">⚠️ {cal} kcal</span>'
    else:
        cal_badge = f'<span class="badge badge-cal-ok">🔥 {cal} kcal</span>'

    # Card HTML
    st.markdown(f"""
    <div class="recipe-card">
        <div class="card-title">{recipe['Recipe_title']}</div>
        <div style="color: #636e72; font-size: 0.9rem; margin-bottom: 0.5rem">
            📍 {region} &nbsp; • &nbsp; ⭐ Score: {score}
        </div>
        <div class="card-badges">
            {prot_badge}
            {cal_badge}
        </div>
    </div>
    """, unsafe_allow_html=True)

    # Clean Details View (NO JSON)
    with st.expander("🔎 View Details"):
        entities = recipe.get('Matched_Entities', {})
        if not entities:
            st.write("No detailed metadata available.")
        else:
            # Helper to render a row
            def detail_row(label, value):
                if value:
                    st.markdown(
                        f"""<div class="details-row">
                            <span class="details-label">{label}</span>
                            <span class="details-val">{value}</span>
                        </div>""", 
                        unsafe_allow_html=True
                    )
            
            detail_row("Cuisine", format_list(entities.get("CUISINE")))
            detail_row("Diet", entities.get("DIET", "Standard"))
            detail_row("Flavors", format_list(entities.get("FLAVOR")))
            detail_row("Cooking Methods", format_list(entities.get("METHOD_PREFERENCE")))
            detail_row("Methods Avoided", format_list(entities.get("METHOD_AVOID")))
            
            if entities.get("PROTEIN_GOAL"):
                detail_row("Protein Goal", entities.get("PROTEIN_GOAL"))
            
            if entities.get("CALORIE_LIMIT"):
                detail_row("Calorie Limit", f"<{entities.get('CALORIE_LIMIT')}")

def render_diet_chart_generator(recipes):
    st.markdown("---")
    st.markdown("### 🥗 Smart Diet Chart Generator")
    st.caption("Create a personalized plan from your search results.")
    
    c1, c2, c3 = st.columns(3)
    num_days = c1.slider("Number of Days", 3, 7, 5)
    meals_per_day = c2.radio("Meals per Day", [2, 3], horizontal=True)
    focus = c3.selectbox("Plan Focus", ["Balanced", "High Protein", "Low Calorie"])
    
    if st.button("📅 Generate My Plan", type="primary"):
        # Filter/Sort Logic
        plan_recipes = recipes.copy()
        
        if focus == "High Protein":
            plan_recipes = sorted(plan_recipes, key=lambda x: float(x.get('Protein (g)', 0)), reverse=True)
        elif focus == "Low Calorie":
            plan_recipes = sorted(plan_recipes, key=lambda x: float(x.get('Calories', 0)))
        else:
            random.shuffle(plan_recipes) # Balanced = Random mix
            
        # Ensure we have enough recipes to fill the slots (recycle if needed)
        total_slots = num_days * meals_per_day
        while len(plan_recipes) < total_slots:
            plan_recipes.extend(plan_recipes)
        
        # Grid Display
        days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        display_cols = st.columns(num_days)
        
        recipe_idx = 0
        names = ["Breakfast", "Lunch", "Dinner"] if meals_per_day == 3 else ["Lunch", "Dinner"]
        
        for i in range(num_days):
            with display_cols[i]:
                st.markdown(f"**{days[i]}**")
                
                content_html = f'<div class="diet-day-card">'
                for m in range(meals_per_day):
                    r = plan_recipes[recipe_idx]
                    content_html += f"""
                    <div class="meal-slot">
                        <div class="meal-type">{names[m]}</div>
                        <div class="meal-name" title="{r['Recipe_title']}">{r['Recipe_title']}</div>
                        <div style="font-size: 0.75rem; color: #636e72">
                            {r.get('Protein (g)')}g Pro • {r.get('Calories')} Cal
                        </div>
                    </div>
                    """
                    recipe_idx += 1
                content_html += "</div>"
                
                st.markdown(content_html, unsafe_allow_html=True)


# ---------------------------------------------------
# Main Application Flow
# ---------------------------------------------------

render_hero()

# Load Data
try:
    df = load_data()
except Exception as e:
    st.error(f"❌ Failed to load dataset: {e}")
    st.stop()

# Input Section
st.markdown("#### 💡 Try an example or type your own:")
col1, col2, col3 = st.columns(3)
start_text = ""
if col1.button("🥑 Keto Indian High Protein"):
    start_text = "Keto Indian High Protein"
if col2.button("🍅 Mediterranean under 500 kcal"):
    start_text = "Mediterranean diet under 500 kcal"
if col3.button("🍗 Grilled Chicken (No Fried)"):
    start_text = "Grilled Chicken dishes, no fried food"

query = st.text_input("Describe your dietary needs...", value=start_text, placeholder="e.g. I want spicy Asian food, high protein, low carb...")

# Search
if st.button("🚀 Find Matching Recipes", type="primary", use_container_width=True):
    if not query:
        st.warning("Please enter a query first!")
    else:
        animated_loading() # UX Spinners
        
        # 1. Run Pipeline
        res = run_full_ner_pipeline(query)
        final_entities = res["FINAL_ENTITIES"]
        
        # 2. Display Entities (Enhanced)
        st.markdown("### 🧩 Extracted Constraints")
        st.markdown('<div class="entity-container">', unsafe_allow_html=True)
        
        # Helper to render pills
        def render_pills_html(items, css_class):
            html = ""
            if items:
                if isinstance(items, str): items = [items]
                for item in items:
                    html += f'<span class="entity-pill {css_class}">{item}</span>'
            return html

        entity_html = ""
        entity_html += render_pills_html(final_entities.get("CUISINE"), "pill-cuisine")
        entity_html += render_pills_html(final_entities.get("DIET"), "pill-diet")
        entity_html += render_pills_html(final_entities.get("FLAVOR"), "pill-flavor")
        entity_html += render_pills_html(final_entities.get("METHOD_PREFERENCE"), "pill-method")
        entity_html += render_pills_html(final_entities.get("METHOD_AVOID"), "pill-avoid")
        
        st.markdown(entity_html + '</div>', unsafe_allow_html=True)
        
        # 3. Find Matches
        matches = find_matching_recipes(df, final_entities, query, top_k=top_k_slider)
        
        if not matches:
            st.error("No recipes found matching your exact criteria. Try valid constraints!")
        else:
            # 4. Filter & Display
            st.markdown("---")
            st.success(f"🎉 Found {len(matches)} generic matches based on AI analysis!")
            
            # Post-filtering for Sidebar
            filtered_matches = []
            for m in matches:
                p = float(m.get('Protein (g)', 0))
                c = float(m.get('Calories', 0))
                if p >= min_prot and c <= max_cal:
                    filtered_matches.append(m)
            
            if not filtered_matches:
                 st.warning("Matches found, but sidebar filters hid them all. Reset filters!")
            
            # Recipe Grid (3 cols)
            cols = st.columns(3)
            for i, recipe in enumerate(filtered_matches):
                with cols[i % 3]:
                    render_recipe_card(recipe, final_entities)
            
            # 5. Diet Chart Generator
            if filtered_matches:
                render_diet_chart_generator(filtered_matches)

# Footer
st.markdown("---")
st.markdown("<center style='color: #b2bec3; font-size: 0.8rem;'>Built for Hackathon Demo • Foodoscope Engine</center>", unsafe_allow_html=True)
