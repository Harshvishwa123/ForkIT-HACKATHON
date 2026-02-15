import { useState, useEffect } from 'react'
import axios from 'axios'

// --- Components ---

const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center py-20 space-y-4">
    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary"></div>
    <p className="text-primary font-black animate-pulse uppercase tracking-widest text-sm">Optimizing Nutrition...</p>
  </div>
);

const Modal = ({ isOpen, onClose, recipe }) => {
  if (!isOpen || !recipe) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-[2.5rem] max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-primary/5 to-secondary/5">
          <div>
            <span className="text-xs font-black text-primary uppercase tracking-widest mb-1 block">{recipe.Region || 'Global'}</span>
            <h3 className="text-3xl font-black text-gray-900 leading-tight">{recipe.Recipe_title}</h3>
          </div>
          <button onClick={onClose} className="w-12 h-12 rounded-2xl bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center text-xl">✕</button>
        </div>
        
        <div className="p-8 overflow-y-auto space-y-8">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-orange-50 p-4 rounded-2xl text-center">
              <p className="text-[10px] font-black text-secondary tracking-widest uppercase mb-1">Calories</p>
              <p className="text-xl font-black text-gray-900">{recipe.Calories || recipe.calories || '0'} kcal</p>
            </div>
            <div className="bg-green-50 p-4 rounded-2xl text-center">
              <p className="text-[10px] font-black text-primary tracking-widest uppercase mb-1">Time</p>
              <p className="text-xl font-black text-gray-900">{recipe.Total_time || recipe.total_time || '30'}m</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-2xl text-center">
              <p className="text-[10px] font-black text-blue-500 tracking-widest uppercase mb-1">Servings</p>
              <p className="text-xl font-black text-gray-900">{recipe.Servings || recipe.servings || '2'}</p>
            </div>
          </div>

          <div>
             <h4 className="text-xl font-black mb-4 flex items-center gap-2">
               <span className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white text-sm">🛒</span>
               Ingredients
             </h4>
             <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {String(recipe.ingredients || 'Consult recipe details').split(',').map((ing, i) => (
                  <li key={i} className="flex items-start gap-2 text-gray-600 font-medium text-sm bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <span className="text-primary">•</span> {ing.trim()}
                  </li>
                ))}
             </ul>
          </div>

          <div>
             <h4 className="text-xl font-black mb-4 flex items-center gap-2">
               <span className="w-8 h-8 bg-secondary rounded-lg flex items-center justify-center text-white text-sm">🍳</span>
               Instructions
             </h4>
             <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 text-gray-600 font-medium leading-relaxed whitespace-pre-line text-sm">
                {recipe.instructions || 'No instructions provided for this recipe.'}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function App() {
  const [view, setView] = useState('home')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  // Search State
  const [query, setQuery] = useState('')
  const [recipes, setRecipes] = useState([])

  // Diet Form State
  const [dietParams, setDietParams] = useState({
    daily_calories: 2000,
    diet_type: 'no_preference',
    max_cooking_time: '',
    min_calories: '',
    max_calories: '',
    region: '',
    servings: ''
  })
  const [dietPlan, setDietPlan] = useState(null)
  const [selectedRecipe, setSelectedRecipe] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const REGIONS = ["Indian", "Italian", "Mexican", "Chinese", "Thai", "American", "Middle Eastern", "Mediterranean", "Japanese"]

  const handleSearch = async () => {
    if (!query) return;
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post('http://localhost:8000/search', { query, top_k: 20 });
      setRecipes(res.data.recipes);
      if (res.data.recipes.length === 0) setError("No recipes found. Try a different search!");
    } catch (err) {
      setError("Backend Error: Could not fetch recipes.");
    } finally {
      setLoading(false);
    }
  }

  const generateDietPlan = async () => {
    setLoading(true)
    setDietPlan(null)
    setError(null)
    try {
      const res = await axios.post('http://localhost:8000/generate-diet-plan', {
        daily_calories: parseFloat(dietParams.daily_calories),
        diet_type: dietParams.diet_type,
        max_cooking_time: dietParams.max_cooking_time ? parseFloat(dietParams.max_cooking_time) : null,
        region: dietParams.region || null,
        min_calories: dietParams.min_calories ? parseFloat(dietParams.min_calories) : null,
        max_calories: dietParams.max_calories ? parseFloat(dietParams.max_calories) : null,
        servings: dietParams.servings ? parseFloat(dietParams.servings) : null
      })
      setDietPlan(res.data)
    } catch (err) {
      setError("No recipes match your strict diet criteria. Try increasing calories or removing filters.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FDFCFB] font-sans text-gray-800">
      
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        recipe={selectedRecipe} 
      />

      {/* Navbar */}
      <nav className="bg-white/80 backdrop-blur-xl shadow-sm p-4 sticky top-0 z-[60] border-b border-gray-100">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <button onClick={() => setView('home')} className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary tracking-tighter">
            DietCraft AI 🥑
          </button>
          <div className="flex gap-2">
             <button onClick={() => setView('recipes')} className={`px-4 py-2 rounded-xl text-sm font-black transition-all ${view === 'recipes' ? 'bg-primary text-white shadow-lg' : 'text-gray-400 hover:text-gray-900'}`}>RECOMMENDER</button>
             <button onClick={() => setView('diet')} className={`px-4 py-2 rounded-xl text-sm font-black transition-all ${view === 'diet' ? 'bg-secondary text-white shadow-lg' : 'text-gray-400 hover:text-gray-900'}`}>DIET PLANNER</button>
             <a href="https://obesity-detect-iiitd.streamlit.app/" target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded-xl text-sm font-black text-gray-400 hover:text-blue-500 transition-all flex items-center gap-1">OBESITY DETECTOR ↗</a>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6 pb-24">
        
        {/* VIEW: HOME */}
        {view === 'home' && (
          <div className="space-y-16 py-12">
            <div className="text-center space-y-6">
              
              <h2 className="text-6xl md:text-7xl font-black text-gray-900 leading-tight tracking-tighter">
                Smart Food. <br/>
                <span className="text-primary italic">Better Plan.</span>
              </h2>
              <p className="text-xl text-gray-500 max-w-2xl mx-auto font-medium leading-relaxed">
                Experience the first AI recipe engine with strict calorie-split balancing. Discover, plan, and optimize.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 max-w-7xl mx-auto px-4">
              <button 
                onClick={() => setView('recipes')}
                className="group relative bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100 text-left hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden"
              >
                <div className="w-20 h-20 bg-green-50 rounded-3xl flex items-center justify-center text-4xl shadow-inner mb-6 group-hover:bg-primary group-hover:text-white transition-all duration-500">🔍</div>
                <h3 className="text-4xl font-black text-gray-900 leading-[1.1] mb-4">Recipe<br/>Discovery</h3>
                <p className="text-gray-500 font-medium">Deep-search filtered recipes from our global database.</p>
                <div className="mt-8 flex items-center text-primary font-black uppercase text-xs tracking-widest">Explore Now <span className="ml-2 group-hover:translate-x-2 transition-transform">→</span></div>
              </button>

              <button 
                onClick={() => setView('diet')}
                className="group relative bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100 text-left hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden"
              >
                <div className="w-20 h-20 bg-orange-50 rounded-3xl flex items-center justify-center text-4xl shadow-inner mb-6 group-hover:bg-secondary group-hover:text-white transition-all duration-500">📊</div>
                <h3 className="text-4xl font-black text-gray-900 leading-[1.1] mb-4">Meal<br/>Optimizer</h3>
                <p className="text-gray-500 font-medium">Automatic 30/40/30 calorie-split meal planning for 7 days.</p>
                <div className="mt-8 flex items-center text-secondary font-black uppercase text-xs tracking-widest">Build Plan <span className="ml-2 group-hover:translate-x-2 transition-transform">→</span></div>
              </button>

              <a 
                href="https://obesity-detect-iiitd.streamlit.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100 text-left hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden block"
              >
                <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center text-4xl shadow-inner mb-6 group-hover:bg-blue-500 group-hover:text-white transition-all duration-500">⚖️</div>
                <h3 className="text-4xl font-black text-gray-900 leading-[1.1] mb-4">Obesity<br/>Detector</h3>
                <p className="text-gray-500 font-medium">Analyze health metrics with our advanced prediction tool.</p>
                <div className="mt-8 flex items-center text-blue-500 font-black uppercase text-xs tracking-widest">Check Now <span className="ml-2 group-hover:translate-x-2 transition-transform">→</span></div>
              </a>
            </div>
          </div>
        )}

        {/* VIEW: RECIPE RECOMMENDATION */}
        {view === 'recipes' && (
          <div className="space-y-12 animate-slide-up">
             <div className="max-w-4xl mx-auto bg-white p-10 rounded-[3rem] shadow-xl border border-gray-50 text-center space-y-8">
                <h3 className="text-4xl font-black tracking-tighter text-gray-900">Search Recipe Bank 🍽️</h3>
                <div className="flex flex-col md:flex-row gap-4 p-3 bg-gray-50 rounded-[2rem] border-2 border-transparent focus-within:border-primary/30 focus-within:bg-white transition-all">
                  <input 
                    type="text" 
                    className="flex-1 bg-transparent p-4 focus:outline-none text-xl font-bold placeholder:text-gray-300"
                    placeholder="e.g. Spicy Indian Chicken Curry..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <button 
                    onClick={handleSearch}
                    disabled={loading}
                    className="bg-primary hover:bg-emerald-600 text-white font-black py-4 px-12 rounded-2xl shadow-xl shadow-emerald-100 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {loading ? "PENDING..." : "SEARCH"}
                  </button>
                </div>
             </div>

             {loading && <LoadingSpinner />}
             {error && <div className="p-8 bg-red-50 text-red-500 rounded-3xl border border-red-100 text-center font-black animate-shake mx-auto max-w-xl">{error}</div>}

             {!loading && recipes.length > 0 && (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {recipes.map((recipe, idx) => (
                    <div key={idx} className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 hover:shadow-2xl transition-all duration-500 overflow-hidden flex flex-col h-full group">
                      <div className="p-8 flex-1 flex flex-col">
                        <div className="flex justify-between items-center mb-6 text-xs font-black uppercase tracking-[0.2em] text-gray-400">
                          <span className="bg-gray-50 px-3 py-1 rounded-lg">{recipe.Region || "Global"}</span>
                          <span className="text-yellow-500 bg-yellow-50 px-3 py-1 rounded-lg">⭐ {(recipe.Score || 0).toFixed(1)}</span>
                        </div>
                        <h4 className="text-2xl font-black text-gray-900 mb-6 group-hover:text-primary transition-colors line-clamp-2 leading-[1.2]">
                          {recipe.Recipe_title}
                        </h4>
                        <div className="flex flex-wrap gap-3 mt-auto mb-6">
                           <div className="px-4 py-2 bg-green-50 text-primary text-xs font-black rounded-xl border border-green-100 uppercase tracking-widest">
                             🥩 {recipe['Protein (g)'] || 0}G Protein
                           </div>
                           <div className="px-4 py-2 bg-gray-50 text-gray-600 text-xs font-black rounded-xl border border-gray-100 uppercase tracking-widest">
                             🔥 {recipe.Calories || 0} kcal
                           </div>
                        </div>
                        <button 
                          onClick={() => { setSelectedRecipe(recipe); setIsModalOpen(true); }}
                          className="w-full py-4 bg-gray-900 text-white font-black rounded-2xl hover:bg-primary transition-all uppercase text-[11px] tracking-[0.3em]"
                        >
                          View Full Recipe
                        </button>
                      </div>
                    </div>
                  ))}
               </div>
             )}
          </div>
        )}

        {/* VIEW: DIET CHART GENERATOR */}
        {view === 'diet' && (
          <div className="space-y-12 animate-slide-up">
             
             {/* DIET FORM CARD */}
             <div className="bg-white p-10 md:p-12 rounded-[3.5rem] shadow-2xl border border-gray-50/50 mb-12 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/5 rounded-full -mr-32 -mt-32 blur-3xl transition-all duration-700 group-hover:bg-primary/5"></div>
                
                <div className="relative z-10 grid lg:grid-cols-1 items-center gap-12">
                   <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-gray-100 pb-8">
                      <div className="space-y-2">
                        <h3 className="text-5xl font-black text-gray-900 tracking-tighter leading-tight">Diet Builder.</h3>
                        <p className="text-gray-500 font-medium">Configure your nutritional constraints and generate a weekly optimized plan.</p>
                      </div>
                      
                      <div className="space-y-2 w-full md:w-64">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Dietary Preference</label>
                        <select 
                          className={`w-full p-4 rounded-2xl font-black text-sm border-2 transition-all appearance-none cursor-pointer ${
                            dietParams.diet_type === 'vegan' ? 'bg-green-50 border-green-200 text-green-700' :
                            dietParams.diet_type === 'vegetarian' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                            dietParams.diet_type === 'pescetarian' ? 'bg-blue-50 border-blue-200 text-blue-700' :
                            dietParams.diet_type === 'non_veg' ? 'bg-red-50 border-red-200 text-red-700' :
                            'bg-gray-50 border-transparent text-gray-700'
                          }`}
                          value={dietParams.diet_type}
                          onChange={(e) => setDietParams({...dietParams, diet_type: e.target.value})}
                        >
                          <option value="no_preference">No Preference</option>
                          <option value="vegan">Vegan 🌱</option>
                          <option value="vegetarian">Vegetarian 🥗</option>
                          <option value="pescetarian">Pescetarian 🐟</option>
                          <option value="non_veg">Non-Veg 🍗</option>
                        </select>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Daily Calories Required</label>
                        <input 
                          type="number"
                          className="w-full p-5 rounded-[1.5rem] bg-gray-50 border-2 border-transparent focus:border-secondary focus:bg-white outline-none font-black text-lg transition-all"
                          value={dietParams.daily_calories}
                          onChange={(e) => setDietParams({...dietParams, daily_calories: e.target.value})}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Cuisine Region</label>
                        <select 
                          className="w-full p-5 rounded-[1.5rem] bg-gray-50 border-2 border-transparent focus:border-secondary focus:bg-white outline-none font-black text-lg transition-all appearance-none cursor-pointer"
                          value={dietParams.region}
                          onChange={(e) => setDietParams({...dietParams, region: e.target.value})}
                        >
                          <option value="">All Regions</option>
                          {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Min Cal / Meal</label>
                        <input 
                          type="number"
                          placeholder="Optional"
                          className="w-full p-5 rounded-[1.5rem] bg-gray-50 border-2 border-transparent focus:border-secondary focus:bg-white outline-none font-black text-lg transition-all"
                          value={dietParams.min_calories}
                          onChange={(e) => setDietParams({...dietParams, min_calories: e.target.value})}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Max Cal / Meal</label>
                        <input 
                          type="number"
                          placeholder="Optional"
                          className="w-full p-5 rounded-[1.5rem] bg-gray-50 border-2 border-transparent focus:border-secondary focus:bg-white outline-none font-black text-lg transition-all"
                          value={dietParams.max_calories}
                          onChange={(e) => setDietParams({...dietParams, max_calories: e.target.value})}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Max Prep Time (m)</label>
                        <input 
                          type="number"
                          placeholder="No limit"
                          className="w-full p-5 rounded-[1.5rem] bg-gray-50 border-2 border-transparent focus:border-secondary focus:bg-white outline-none font-black text-lg transition-all"
                          value={dietParams.max_cooking_time}
                          onChange={(e) => setDietParams({...dietParams, max_cooking_time: e.target.value})}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Goal Servings</label>
                        <input 
                          type="number"
                          placeholder="Optional"
                          className="w-full p-5 rounded-[1.5rem] bg-gray-50 border-2 border-transparent focus:border-secondary focus:bg-white outline-none font-black text-lg transition-all"
                          value={dietParams.servings}
                          onChange={(e) => setDietParams({...dietParams, servings: e.target.value})}
                        />
                      </div>

                      <div className="lg:col-span-2 flex items-end">
                        <button 
                          onClick={generateDietPlan}
                          disabled={loading}
                          className="w-full bg-gradient-to-r from-primary to-secondary text-white font-black py-5 rounded-[1.5rem] shadow-2xl shadow-orange-200 transition-all hover:scale-[1.03] active:scale-95 disabled:opacity-50 text-sm tracking-[0.2em]"
                        >
                          {loading ? "GENERATING..." : "BUILD WEEKLY PLAN"}
                        </button>
                      </div>
                   </div>
                </div>
             </div>

             {loading && <LoadingSpinner />}
             {error && <div className="p-8 bg-red-50 text-red-500 rounded-3xl border border-red-100 text-center font-black animate-shake mx-auto max-w-xl">{error}</div>}

             {dietPlan && !loading && (
               <div className="space-y-12 animate-fade-in">
                  <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl flex flex-col md:flex-row justify-between items-center gap-8">
                     <div className="space-y-1">
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Plan Intelligence Summary</h4>
                        <p className="text-2xl font-black text-gray-900 leading-tight">Optimized {dietParams.daily_calories} kcal / Daily</p>
                     </div>
                     <div className="flex-1 max-w-md w-full">
                        <div className="flex justify-between text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest">
                           <span>30% Breakfast</span>
                           <span>40% Lunch</span>
                           <span>30% Dinner</span>
                        </div>
                        <div className="flex h-3 w-full rounded-full overflow-hidden shadow-inner bg-gray-100">
                           <div className="h-full bg-green-400 w-[30%]"></div>
                           <div className="h-full bg-orange-400 w-[40%]"></div>
                           <div className="h-full bg-blue-400 w-[30%]"></div>
                        </div>
                     </div>
                     <div className="px-6 py-3 bg-gray-900 rounded-2xl text-[10px] font-black text-white tracking-[0.3em] uppercase">Status: Optimal</div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-6 items-start">
                    {Object.keys(dietPlan).map((day, dIdx) => (
                      <div key={dIdx} className="space-y-4">
                        <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm text-center">
                           <h5 className="font-black text-sm text-primary uppercase tracking-[0.2em]">{day}</h5>
                        </div>
                        
                        <div className="space-y-3">
                          {['Breakfast', 'Lunch', 'Dinner'].map((mealType, mIdx) => {
                            const meal = dietPlan[day][mealType];
                            return (
                              <button 
                                key={mIdx} 
                                onClick={() => { setSelectedRecipe(meal); setIsModalOpen(true); }}
                                className={`w-full text-left bg-white p-5 rounded-[2rem] border-2 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col h-48 ${
                                  dietParams.diet_type === 'vegan' ? 'border-green-100 hover:border-green-300' :
                                  dietParams.diet_type === 'vegetarian' ? 'border-emerald-100 hover:border-emerald-300' :
                                  dietParams.diet_type === 'pescetarian' ? 'border-blue-100 hover:border-blue-300' :
                                  dietParams.diet_type === 'non_veg' ? 'border-red-100 hover:border-red-300' :
                                  'border-gray-100 hover:border-primary/20'
                                }`}
                              >
                                <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 group-hover:text-secondary">{mealType}</div>
                                <div className="font-black text-[13px] leading-snug text-gray-900 line-clamp-2 mb-auto group-hover:text-primary transition-colors">
                                  {meal.Recipe_title}
                                </div>
                                <div className="space-y-1 mt-2">
                                  <div className="flex justify-between text-[10px] font-bold text-gray-400">
                                    <span>🔥 {meal.Calories} kcal</span>
                                    <span>⏱️ {meal.Total_time || meal.total_time || '30'}m</span>
                                  </div>
                                  <div className="flex justify-between text-[10px] font-bold text-gray-400">
                                    <span>🍽️ {meal.Servings || meal.servings || '2'} ser</span>
                                    <span>🌍 {meal.Region || 'Global'}</span>
                                  </div>
                                </div>
                                <div className="flex gap-2 pt-3">
                                  <span className="text-[9px] font-black py-1 px-3 bg-gray-50 text-gray-400 rounded-lg group-hover:bg-primary/5 group-hover:text-primary transition-colors w-full text-center">
                                    VIEW DETAILS
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
               </div>
             )}
          </div>
        )}

      </main>
      
      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 py-20 border-t border-gray-100 text-center space-y-6">
        <p className="font-black text-gray-200 text-6xl tracking-[ -0.05em] uppercase opacity-50">FOODOSCOPE.AI</p>
        <div className="text-xs font-black text-gray-400 tracking-widest uppercase">Built for Hackathon Final Demo • 2026 Prototype</div>
      </footer>
    </div>
  )
}

export default App
