import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import UploadButton from './components/UploadButton'
import PlantDetailCard from './components/PlantDetailCard'

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
      .order('created_at', { ascending: false })
    
    if (error) console.error('Error cargando plantas:', error)
    else setPlants(data)
    
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Header Estilo Laboratorio */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 backdrop-blur-md bg-opacity-80">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-600 p-2 rounded-xl shadow-lg shadow-emerald-200">
              <span className="text-2xl">🌱</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                PlantCare <span className="text-emerald-600">Lab</span>
              </h1>
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold">Botanic Intelligence System</p>
            </div>
          </div>
          <UploadButton onUploadSuccess={fetchPlants} />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {loading ? (
          <div className="flex flex-col justify-center items-center h-96 gap-4">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-600"></div>
            <p className="text-slate-400 text-sm animate-pulse">Sincronizando base de datos botánica...</p>
          </div>
        ) : plants.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-3xl shadow-sm border border-slate-100">
            <div className="text-7xl mb-6">🔬</div>
            <h3 className="text-2xl font-bold text-slate-800">Laboratorio listo para muestras</h3>
            <p className="mt-3 text-slate-500 max-w-xs mx-auto text-sm leading-relaxed">
              Sube una imagen de alta resolución para realizar un análisis forense visual y generar un roadmap técnico.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {plants.map(plant => (
              <PlantDetailCard key={plant.id} plant={plant} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default App

