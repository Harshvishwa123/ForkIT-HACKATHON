import { useState } from 'react'
import axios from 'axios'

function App() {
  const [view, setView] = useState('home') // 'home', 'recipes', 'diet'
  const [query, setQuery] = useState('')
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(false)
  
  // Diet Chart State
  const [dietDays, setDietDays] = useState(7)
  const [dietFocus, setDietFocus] = useState('Balanced')
  const [dietPlan, setDietPlan] = useState(null)
  const [dietQuery, setDietQuery] = useState('')

  const handleSearch = async (searchQuery = query) => {
    if (!searchQuery) return
    setLoading(true)
    try {
      const res = await axios.post('http://localhost:8000/search', {
        query: searchQuery,
        top_k: 30
      })
      setRecipes(res.data.recipes)
      return res.data.recipes
    } catch (err) {
      console.error(err)
      alert("Failed to fetch recipes. Ensure backend is running!")
    } finally {
      setLoading(false)
    }
  }

  const generateDietPlan = async () => {
    setLoading(true)
    try {
      const res = await axios.post('http://localhost:8000/generate-diet-plan', {
        daily_calories: 2000, // You can add a slider/input for this
        is_vegetarian: dietFocus === 'Veg',
        max_cooking_time: null,
        region: dietQuery || null
      })
      setDietPlan(res.data)
    } catch (err) {
      console.error(err)
      alert("Failed to generate plan. Ensure backend is running!")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FDFCF6] font-sans text-gray-800">
      
      {/* Navbar */}
      <nav className="bg-white/80 backdrop-blur-md shadow-sm p-4 sticky top-0 z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <button onClick={() => setView('home')} className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
            FOODOSCOPE 🥑
          </button>
          <div className="flex gap-4">
             <button onClick={() => setView('recipes')} className={`text-sm font-bold ${view === 'recipes' ? 'text-primary' : 'text-gray-400'}`}>Recipes</button>
             <button onClick={() => setView('diet')} className={`text-sm font-bold ${view === 'diet' ? 'text-secondary' : 'text-gray-400'}`}>Diet Plan</button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6 pb-20">
        
        {/* VIEW: HOME */}
        {view === 'home' && (
          <div className="space-y-12 py-10">
            <div className="text-center space-y-4">
              <h2 className="text-5xl md:text-6xl font-black text-gray-900 leading-tight">
                Fuel Your Body, <br/>
                <span className="text-primary italic">Intelligence included.</span>
              </h2>
              <p className="text-xl text-gray-500 max-w-2xl mx-auto font-medium">
                The ultimate AI kitchen companion for recipe discovery and personalized meal planning.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto px-4">
              {/* Option 1: Recipe Finder */}
              <button 
                onClick={() => setView('recipes')}
                className="group relative bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100 text-left hover:scale-[1.02] transition-all duration-300 overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-125 transition-transform duration-500">
                   <span className="text-8xl">🥘</span>
                </div>
                <div className="relative z-10 space-y-4">
                  <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center text-3xl shadow-inner">🔍</div>
                  <h3 className="text-3xl font-black text-gray-900 leading-tight">Recipe <br/> Recommendation</h3>
                  <p className="text-gray-500 font-medium">Find the perfect meal based on ingredients, cuisine, or mood using our Hybrid Search.</p>
                  <div className="pt-4 flex items-center text-primary font-bold">
                    Start Exploring <span className="ml-2 group-hover:translate-x-2 transition-transform">→</span>
                  </div>
                </div>
              </button>

              {/* Option 2: Diet Chart */}
              <button 
                onClick={() => setView('diet')}
                className="group relative bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100 text-left hover:scale-[1.02] transition-all duration-300 overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-125 transition-transform duration-500">
                   <span className="text-8xl">📊</span>
                </div>
                <div className="relative z-10 space-y-4">
                  <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center text-3xl shadow-inner">📅</div>
                  <h3 className="text-3xl font-black text-gray-900 leading-tight">Diet Chart <br/> Generator</h3>
                  <p className="text-gray-500 font-medium">Get a personalized weekly meal plan tailored to your health goals and preferences.</p>
                  <div className="pt-4 flex items-center text-secondary font-bold">
                    Create My Plan <span className="ml-2 group-hover:translate-x-2 transition-transform">→</span>
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* VIEW: RECIPE RECOMMENDATION */}
        {view === 'recipes' && (
          <div className="space-y-10 animate-fade-in">
             <div className="bg-white p-8 rounded-[2rem] shadow-lg border border-gray-100 text-center space-y-6">
                <h3 className="text-3xl font-black">Find Your Flavor 🔍</h3>
                <div className="max-w-3xl mx-auto flex gap-3 p-2 bg-gray-50 rounded-2xl border-2 border-transparent focus-within:border-primary transition-all">
                  <input 
                    type="text" 
                    className="flex-1 bg-transparent p-3 focus:outline-none text-lg font-medium"
                    placeholder="e.g. Italian pasta with olives and high protein..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <button 
                    onClick={() => handleSearch()}
                    disabled={loading}
                    className="bg-primary hover:bg-emerald-600 text-white font-black py-3 px-10 rounded-xl shadow-lg shadow-emerald-200 transition-all disabled:opacity-50"
                  >
                    {loading ? "Searching..." : "Search"}
                  </button>
                </div>
             </div>

             {recipes.length > 0 && (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {recipes.map((recipe, idx) => (
                    <div key={idx} className="bg-white rounded-3xl shadow-sm border border-gray-100 hover:shadow-2xl transition-all duration-500 overflow-hidden flex flex-col h-full group">
                      <div className="p-8 flex-1">
                        <div className="flex justify-between items-center mb-4 text-xs font-black uppercase tracking-widest text-gray-400">
                          <span>{recipe.Region || "Global"}</span>
                          <span className="text-yellow-500 bg-yellow-50 px-2 py-1 rounded-md">⭐ {(recipe.Score || 0).toFixed(1)}</span>
                        </div>
                        <h4 className="text-2xl font-black text-gray-900 mb-4 group-hover:text-primary transition-colors line-clamp-2">
                          {recipe.Recipe_title || "Unknown Recipe"}
                        </h4>
                        <div className="flex flex-wrap gap-2">
                           <div className="px-4 py-2 bg-green-50 rounded-xl text-green-700 text-sm font-bold border border-green-100">
                             🥩 {(recipe['Protein (g)'] || 0)}g Prot
                           </div>
                           <div className="px-4 py-2 bg-gray-50 rounded-xl text-gray-600 text-sm font-bold border border-gray-100">
                             🔥 {(recipe.Calories || 0)} kcal
                           </div>
                        </div>
                      </div>
                    </div>
                  ))}
               </div>
             )}
          </div>
        )}

        {/* VIEW: DIET CHART GENERATOR */}
        {view === 'diet' && (
          <div className="space-y-10 animate-fade-in">
             <div className="bg-white p-10 rounded-[2rem] shadow-lg border border-gray-100 space-y-8">
                <div className="text-center">
                  <h3 className="text-4xl font-black mb-2 text-gray-900">Weekly Goal Planner 📅</h3>
                  <p className="text-gray-500 font-medium text-lg">Tell us your goal and we'll handle the kitchen math.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Daily Preferences</label>
                    <input 
                      type="text"
                      className="w-full p-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-secondary outline-none font-bold"
                      placeholder="e.g. Vegetarian, North Indian..."
                      value={dietQuery}
                      onChange={(e) => setDietQuery(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Diet Type</label>
                    <select 
                      className="w-full p-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-secondary outline-none font-bold appearance-none cursor-pointer"
                      value={dietFocus}
                      onChange={(e) => setDietFocus(e.target.value)}
                    >
                      <option value="Veg">Vegetarian</option>
                      <option value="Non-Veg">Non-Vegetarian</option>
                    </select>
                  </div>
                  <div className="space-y-2 text-center flex flex-col justify-end">
                    <button 
                      onClick={generateDietPlan}
                      disabled={loading}
                      className="bg-secondary hover:bg-orange-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-orange-200 transition-all text-lg hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                    >
                      {loading ? "Optimizing..." : "Generate Magic ✨"}
                    </button>
                  </div>
                </div>
             </div>

             {dietPlan && (
               <div className="space-y-8">
                  <div className="flex items-center gap-4">
                    <div className="h-[2px] flex-1 bg-gray-100"></div>
                    <h4 className="text-xl font-black text-gray-400 uppercase tracking-widest">Your Personalized Plan</h4>
                    <div className="h-[2px] flex-1 bg-gray-100"></div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
                    {Object.keys(dietPlan).map((day, dIdx) => (
                      <div key={dIdx} className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                        <h5 className="font-black text-xl mb-6 text-center text-secondary uppercase tracking-tighter">{day}</h5>
                        <div className="space-y-4">
                          {dietPlan[day].map((meal, mIdx) => (
                            <div key={mIdx} className="bg-gray-50/50 p-4 rounded-2xl space-y-2 border border-white">
                              <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                                {['Breakfast', 'Lunch', 'Dinner'][mIdx]}
                              </div>
                              <div className="font-bold text-sm leading-tight text-gray-800 line-clamp-3">
                                {meal.Recipe_title}
                              </div>
                              <div className="flex gap-2 pt-1">
                                <span className="text-[10px] font-black py-1 px-2 bg-orange-100 text-orange-700 rounded-md">
                                  {meal['Protein (g)']}g P
                                </span>
                                <span className="text-[10px] font-black py-1 px-2 bg-gray-200 text-gray-700 rounded-md">
                                  {meal.Calories} C
                                </span>
                              </div>
                            </div>
                          ))}
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
      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-gray-100 text-center space-y-4">
        <p className="font-black text-gray-200 text-xl tracking-tighter uppercase">Foodoscope Hybrid Engine v2.0</p>
        <div className="text-xs font-bold text-gray-400">© 2026 Hackathon Prototype • Created for Smart Kitchen Systems</div>
      </footer>
    </div>
  )
}

export default App
