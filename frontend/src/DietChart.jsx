import { useState } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'

function DietChart() {
  const [formData, setFormData] = useState({
    age: '',
    weight: '',
    goal: 'Balanced',
    cuisine: '',
    diet: 'None',
    days: 7
  })
  
  const [dietPlan, setDietPlan] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleGenerate = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    // Simulate Plan Generation based on search results for now
    // In a real app, this would call a dedicated /generate-plan endpoint
    // We will reuse the search endpoint to find recipes matching the criteria first
    
    const query = `${formData.cuisine} ${formData.diet === 'None' ? '' : formData.diet} food for ${formData.goal}`
    
    try {
      const res = await axios.post('http://localhost:8000/search', {
        query: query,
        top_k: 30
      })
      const recipes = res.data.recipes
      
      if(recipes.length === 0) {
        alert("No recipes found for these criteria. Try broader terms!")
        setLoading(false)
        return
      }

      // Generate Plan Logic
      let sorted = [...recipes]
      if (formData.goal === 'High Protein') {
        sorted.sort((a, b) => b['Protein (g)'] - a['Protein (g)'])
      } else if (formData.goal === 'Low Calorie') {
        sorted.sort((a, b) => a['Calories'] - b['Calories'])
      } else {
        sorted.sort(() => Math.random() - 0.5)
      }

      const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
      const plan = {}
      let idx = 0
      
      for (let i = 0; i < formData.days; i++) {
        const dayName = days[i % 7]
        plan[dayName] = []
        for (let m = 0; m < 3; m++) {
          plan[dayName].push(sorted[idx % sorted.length])
          idx++
        }
      }
      setDietPlan(plan)
      
    } catch (err) {
      console.error(err)
      alert("Error generating plan.")
    }
    setLoading(false)
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <Link to="/" className="text-secondary font-bold hover:text-orange-700">← Back to Home</Link>
        <h2 className="text-4xl font-extrabold text-gray-900 mt-2">Smart Diet Generator 🥗</h2>
        <p className="text-gray-500">Tell us about yourself, and we'll curate the perfect weekly plan.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Input Form */}
        <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100 h-fit">
          <form onSubmit={handleGenerate} className="space-y-6">
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Age</label>
                <input 
                  type="number" 
                  name="age"
                  required
                  className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 focus:border-primary focus:outline-none"
                  value={formData.age}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Weight (kg)</label>
                <input 
                  type="number" 
                  name="weight"
                  required
                  className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 focus:border-primary focus:outline-none"
                  value={formData.weight}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
               <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Dietary Goal</label>
               <select 
                 name="goal"
                 className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 focus:border-primary focus:outline-none"
                 value={formData.goal}
                 onChange={handleChange}
               >
                 <option>Balanced</option>
                 <option>High Protein</option>
                 <option>Low Calorie</option>
                 <option>Weight Loss</option>
                 <option>Muscle Gain</option>
               </select>
            </div>

            <div>
               <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Preferred Cuisine</label>
               <input 
                  type="text" 
                  name="cuisine"
                  placeholder="e.g. Indian, Mexican, Italian"
                  className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 focus:border-primary focus:outline-none"
                  value={formData.cuisine}
                  onChange={handleChange}
                />
            </div>

            <div>
               <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Diet Restriction</label>
               <select 
                 name="diet"
                 className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 focus:border-primary focus:outline-none"
                 value={formData.diet}
                 onChange={handleChange}
               >
                 <option>None</option>
                 <option>Vegetarian</option>
                 <option>Vegan</option>
                 <option>Keto</option>
                 <option>Paleo</option>
               </select>
            </div>

            <div>
               <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Duration (Days)</label>
               <input 
                  type="number" 
                  name="days"
                  min="1" max="14"
                  className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 focus:border-primary focus:outline-none"
                  value={formData.days}
                  onChange={handleChange}
                />
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-secondary hover:bg-orange-600 text-white font-bold py-4 rounded-xl transition-all shadow-md transform hover:scale-105 disabled:opacity-50"
            >
              {loading ? "Generating Plan..." : "Create My Plan"}
            </button>
          </form>
        </div>

        {/* Output Grid */}
        <div className="lg:col-span-2">
          {!dietPlan ? (
             <div className="h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 p-10">
               <span className="text-6xl mb-4">📅</span>
               <p className="text-lg">Your personalized meal plan will appear here.</p>
             </div>
          ) : (
            <div className="space-y-6">
                <h3 className="text-2xl font-bold text-gray-800">Your {formData.days}-Day Plan</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.keys(dietPlan).map((day, dIdx) => (
                    <div key={dIdx} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                      <h5 className="font-bold text-lg mb-4 text-primary border-b pb-2 flex justify-between">
                        {day}
                      </h5>
                      <div className="space-y-4">
                        {dietPlan[day].map((meal, mIdx) => (
                          <div key={mIdx} className="flex gap-4 items-start">
                             <div className="w-16 text-xs font-bold text-gray-400 uppercase pt-1">
                               {['Breakfast', 'Lunch', 'Dinner'][mIdx]}
                             </div>
                             <div className="flex-1">
                               <div className="font-bold text-gray-800 text-sm">{meal.Recipe_title}</div>
                               <div className="text-xs text-gray-500 mt-1">
                                  🥩 {meal['Protein (g)']}g • 🔥 {meal.Calories} kcal
                               </div>
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

      </div>
    </div>
  )
}

export default DietChart
