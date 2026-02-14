import { useState } from 'react'
import axios from 'axios'

function App() {
  const [query, setQuery] = useState('')
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(false)
  
  // Diet Chart State
  const [dietDays, setDietDays] = useState(5)
  const [dietFocus, setDietFocus] = useState('Balanced')
  const [dietPlan, setDietPlan] = useState(null)

  const handleSearch = async () => {
    if (!query) return
    setLoading(true)
    try {
      // Connect to FastAPI Backend
      const res = await axios.post('http://localhost:8000/search', {
        query: query,
        top_k: 20
      })
      setRecipes(res.data.recipes)
      setDietPlan(null) // Reset plan on new search
    } catch (err) {
      console.error(err)
      alert("Failed to fetch recipes. Ensure backend is running!")
    }
    setLoading(false)
  }

  const generateDietPlan = () => {
    if (recipes.length === 0) {
      alert("Search for recipes first!")
      return
    }

    let sorted = [...recipes]
    if (dietFocus === 'High Protein') {
      sorted.sort((a, b) => b['Protein (g)'] - a['Protein (g)'])
    } else if (dietFocus === 'Low Calorie') {
      sorted.sort((a, b) => a['Calories'] - b['Calories'])
    } else {
      // Balanced - Shuffle
      sorted.sort(() => Math.random() - 0.5)
    }

    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    const plan = {}
    let idx = 0
    
    // Create 3 meals/day structure
    for (let i = 0; i < dietDays; i++) {
      const dayName = days[i % 7]
      plan[dayName] = []
      for (let m = 0; m < 3; m++) {
        // Recycle recipes if needed
        plan[dayName].push(sorted[idx % sorted.length])
        idx++
      }
    }
    setDietPlan(plan)
  }

  return (
    <div className="min-h-screen bg-background font-sans text-gray-800">
      
      {/* Navbar */}
      <nav className="bg-white shadow-sm p-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
            Foodoscope 🥑
          </h1>
          <span className="text-sm font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            Hackathon Build v2.0
          </span>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6 space-y-12">
        
        {/* Hero Section */}
        <div className="text-center space-y-4 py-10 bg-white rounded-3xl shadow-lg border border-gray-100">
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
            Smart Diet Planning, <span className="text-primary">Simpler.</span>
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            AI-powered recipe recommendations tailored to your goals. 
            Just type what you crave.
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto flex gap-2 p-2 mt-8">
            <input 
              type="text" 
              className="flex-1 p-4 rounded-xl border-2 border-gray-200 focus:border-primary focus:outline-none text-lg shadow-sm"
              placeholder="e.g. High protein spicy Indian food..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button 
              onClick={handleSearch}
              disabled={loading}
              className="bg-primary hover:bg-emerald-600 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-md transform hover:scale-105 disabled:opacity-50"
            >
              {loading ? "Thinking..." : "Search"}
            </button>
          </div>
        </div>

        {/* Results Section */}
        {recipes.length > 0 && (
          <section>
            <div className="flex justify-between items-end mb-6">
              <h3 className="text-2xl font-bold text-gray-800">
                Found {recipes.length} Recipes
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recipes.map((recipe, idx) => (
                <div key={idx} className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col h-full group">
                  <div className="p-6 flex-1">
                    <div className="flex justify-between items-start mb-2">
                       <span className="text-xs font-bold tracking-wider text-gray-400 uppercase">
                         {recipe.Region || "Global"}
                       </span>
                       <span className="text-xs font-bold text-yellow-500">
                         ⭐ {(recipe.Score || 0).toFixed(1)}
                       </span>
                    </div>
                    <h4 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary transition-colors">
                      {recipe.Recipe_title}
                    </h4>
                    
                    <div className="flex gap-2 mt-4">
                      {/* Protein Badge */}
                      <span className={`px-3 py-1 rounded-lg text-xs font-bold ${
                        recipe['Protein (g)'] > 25 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        🥩 {recipe['Protein (g)']}g Prot
                      </span>
                      {/* Calorie Badge */}
                      <span className="px-3 py-1 rounded-lg text-xs font-bold bg-gray-100 text-gray-600">
                        🔥 {recipe.Calories} kcal
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Smart Diet Chart Generator */}
        {recipes.length > 0 && (
          <section className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100">
            <h3 className="text-2xl font-bold mb-2">🥗 Smart Diet Chart Generator</h3>
            <p className="text-gray-500 mb-6">Generate a 7-day meal plan from your search results.</p>
            
            <div className="flex flex-wrap gap-4 mb-8">
              <div className="flex flex-col">
                <label className="text-xs font-bold text-gray-400 uppercase mb-1">Duration</label>
                <select 
                  className="p-3 rounded-xl border border-gray-200 bg-gray-50 focus:border-primary focus:outline-none"
                  value={dietDays}
                  onChange={(e) => setDietDays(parseInt(e.target.value))}
                >
                  {[3,4,5,6,7].map(d => <option key={d} value={d}>{d} Days</option>)}
                </select>
              </div>

              <div className="flex flex-col">
                <label className="text-xs font-bold text-gray-400 uppercase mb-1">Goal</label>
                <select 
                  className="p-3 rounded-xl border border-gray-200 bg-gray-50 focus:border-primary focus:outline-none"
                  value={dietFocus}
                  onChange={(e) => setDietFocus(e.target.value)}
                >
                  <option>Balanced</option>
                  <option>High Protein</option>
                  <option>Low Calorie</option>
                </select>
              </div>

              <div className="flex flex-col justify-end">
                <button 
                  onClick={generateDietPlan}
                  className="bg-secondary hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-md"
                >
                  Generate Plan
                </button>
              </div>
            </div>

            {/* Diet Plan Grid */}
            {dietPlan && (
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {Object.keys(dietPlan).map((day, dIdx) => (
                  <div key={dIdx} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <h5 className="font-bold text-lg mb-4 text-center text-primary">{day}</h5>
                    <div className="space-y-3">
                      {dietPlan[day].map((meal, mIdx) => (
                        <div key={mIdx} className="bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                          <div className="text-xs font-bold text-gray-400 uppercase mb-1">
                            {['Breakfast', 'Lunch', 'Dinner'][mIdx]}
                          </div>
                          <div className="font-semibold text-sm line-clamp-2" title={meal.Recipe_title}>
                            {meal.Recipe_title}
                          </div>
                          <div className="mt-2 text-xs text-gray-500">
                             {meal['Protein (g)']}g P • {meal.Calories} cal
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

      </main>
      
      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-8 text-center text-gray-400 text-sm">
        <p>Built for Hackathon 2026 • Powered by Foodoscope Engine</p>
      </footer>
    </div>
  )
}

export default App
