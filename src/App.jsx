import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

function App() {
  const [plants, setPlants] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPlants()
  }, [])

  async function fetchPlants() {
    setLoading(true)
    const { data, error } = await supabase
      .from('plants')
      .select('*')
    
    if (error) console.error('Error cargando plantas:', error)
    else {
      setPlants(data)
      console.log('🌿 Conexión con Supabase correcta. Plantas:', data)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-green-50">
      {/* Header */}
      <header className="bg-emerald-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            🌱 PlantCare Drive
          </h1>
          <button className="bg-white text-emerald-700 px-4 py-2 rounded-lg font-semibold shadow hover:bg-gray-100 transition">
            + Nueva Planta
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        
        {/* Loading State */}
        {loading ? (
          <div className="text-center py-10">
            <p className="text-gray-500 text-lg">Cargando tu jungla...</p>
          </div>
        ) : plants.length === 0 ? (
          /* Empty State */
          <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="text-6xl mb-4">🌵</div>
            <h3 className="text-xl font-medium text-gray-900">Aún no hay plantas</h3>
            <p className="mt-1 text-gray-500">Sube tu primera foto para empezar el diagnóstico.</p>
          </div>
        ) : (
          /* Grid de Plantas (Futuro) */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plants.map(plant => (
              <div key={plant.id} className="bg-white p-6 rounded-lg shadow">
                {plant.name}
              </div>
            ))}
          </div>
        )}

      </main>
    </div>
  )
}

export default App