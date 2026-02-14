import { useState } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'

function Home() {
  const [query, setQuery] = useState('')
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(false)

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
    } catch (err) {
      console.error(err)
      alert("Failed to fetch recipes. Ensure backend is running!")
    }
    setLoading(false)
  }

  return (
    <div className="space-y-12">
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
            <Link to="/diet-chart" className="bg-white text-secondary border-2 border-secondary hover:bg-orange-50 font-bold py-3 px-8 rounded-xl transition-all shadow-sm transform hover:scale-105 flex items-center">
              📅 Plan Diet
            </Link>
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
                         {recipe.Region}
                       </span>
                       <span className="text-xs font-bold text-yellow-500">
                         ⭐ {recipe.Score.toFixed(1)}
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
    </div>
  )
}

export default Home
