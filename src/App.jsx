import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import UploadButton from './components/UploadButton'

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

  const getStatusColor = (status) => {
    const s = status?.toLowerCase() || ''
    if (s.includes('healthy')) return 'bg-green-100 text-green-800 border-green-200'
    if (s.includes('water')) return 'bg-blue-100 text-blue-800 border-blue-200'
    if (s.includes('sick') || s.includes('pest')) return 'bg-red-100 text-red-800 border-red-200'
    return 'bg-gray-100 text-gray-800 border-gray-200'
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-emerald-600 shadow-lg sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-3xl">🌿</span>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              PlantCare Drive
            </h1>
          </div>
          <UploadButton onUploadSuccess={fetchPlants} />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
          </div>
        ) : plants.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-stone-100">
            <div className="text-6xl mb-4">🌵</div>
            <h3 className="text-xl font-medium text-stone-900">Tu jardín está vacío</h3>
            <p className="mt-2 text-stone-500">Sube tu primera foto para recibir un diagnóstico IA.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {plants.map(plant => (
              <div key={plant.id} className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition duration-300 overflow-hidden border border-stone-100 flex flex-col">
                
                <div className="relative h-64 bg-gray-100 overflow-hidden group">
                  {plant.image_id ? (
                    <img 
                      /* AQUÍ ESTÁ EL CAMBIO IMPORTANTE: URL Correcta y Segura */
                      src={`https://lh3.googleusercontent.com/d/${plant.image_id}=s800`}
                      alt={plant.name}
                      className="w-full h-full object-cover transition duration-500 group-hover:scale-105"
                      onError={(e) => {
                        // Fallback que no requiere internet (un cuadrado gris en base64)
                        e.target.onerror = null; 
                        e.target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxIDEiPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNlN2U1ZTQiLz48L3N2Zz4=';
                        // Forzamos a mostrar el texto de "Error" que hay debajo si la imagen falla
                        e.target.style.opacity = '0.5';
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400 bg-gray-100">Sin Imagen</div>
                  )}
                  
                  {/* Etiqueta de estado flotante */}
                  <div className="absolute top-4 right-4">
                    <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full border ${getStatusColor(plant.health_status)} shadow-sm bg-white bg-opacity-90 backdrop-blur-sm`}>
                      {plant.health_status}
                    </span>
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-gray-900 leading-tight">
                      {plant.species || plant.name}
                    </h3>
                  </div>
                  
                  <div className="flex-1">
                    <p className="text-gray-600 text-sm leading-relaxed italic bg-stone-50 p-3 rounded-lg border border-stone-100">
                      "{plant.diagnosis_report || 'Esperando diagnóstico...'}"
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center text-sm text-gray-500">
                    <div className="flex items-center gap-1.5 font-medium text-sky-600 bg-sky-50 px-2 py-1 rounded-md">
                      💧 Regar c/ {plant.water_frequency_days || 7} días
                    </div>
                    <div className="font-mono text-xs opacity-60">
                      {new Date(plant.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default App
