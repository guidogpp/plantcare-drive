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
    if (s.includes('saludable')) return 'bg-emerald-100 text-emerald-800 border-emerald-200'
    if (s.includes('agua')) return 'bg-sky-100 text-sky-800 border-sky-200'
    if (s.includes('enferma') || s.includes('plaga') || s.includes('alerta')) return 'bg-amber-100 text-amber-800 border-amber-200'
    return 'bg-slate-100 text-slate-800 border-slate-200'
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
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
            {plants.map(plant => (
              <div key={plant.id} className="bg-white rounded-[2rem] shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden border border-slate-100 flex flex-col md:flex-row group">
                
                {/* Visual Scanner Area */}
                <div className="relative w-full md:w-2/5 h-80 md:h-auto bg-slate-100 overflow-hidden">
                  {plant.image_id ? (
                    <>
                      <img 
                        src={`https://lh3.googleusercontent.com/d/${plant.image_id}=s1000`}
                        alt={plant.name}
                        className="w-full h-full object-cover transition duration-700 group-hover:scale-110"
                      />
                      {/* Technical Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>
                      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px]"></div>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-300 italic text-sm">No visual data</div>
                  )}
                  
                  {/* Status Badge */}
                  <div className="absolute top-6 left-6">
                    <span className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-full border shadow-2xl backdrop-blur-md bg-white/90 ${getStatusColor(plant.health_status)}`}>
                      ESTADO: {plant.health_status}
                    </span>
                  </div>
                </div>

                {/* Technical Report Area */}
                <div className="p-8 flex-1 flex flex-col bg-white">
                  <div className="mb-6">
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-1">
                      {plant.name}
                    </h3>
                    <p className="text-sm italic text-emerald-600 font-medium">
                      {plant.scientific_name || 'Especie no identificada'}
                    </p>
                  </div>
                  
                  {/* Technical Care Pills */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    <span className="px-3 py-1 bg-slate-50 border border-slate-100 rounded-full text-[10px] font-bold text-slate-600 flex items-center gap-1.5 shadow-sm">
                      ☀️ {plant.care_technical_details?.light_lux || 'Luz N/A'}
                    </span>
                    <span className="px-3 py-1 bg-slate-50 border border-slate-100 rounded-full text-[10px] font-bold text-slate-600 flex items-center gap-1.5 shadow-sm">
                      🧪 pH {plant.care_technical_details?.ph_ideal || 'N/A'}
                    </span>
                    <span className="px-3 py-1 bg-slate-50 border border-slate-100 rounded-full text-[10px] font-bold text-slate-600 flex items-center gap-1.5 shadow-sm">
                      💧 {plant.care_technical_details?.humidity_target || 'Hum. N/A'}
                    </span>
                  </div>

                  {/* Forensic Visual Analysis */}
                  <div className="mb-6 p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                    <p className="text-[9px] uppercase font-black text-slate-400 tracking-widest mb-2.5 flex items-center gap-2">
                       <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                       Análisis Forense Visual
                    </p>
                    <div className="space-y-2">
                      <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase leading-none mb-1">Estado Foliar</p>
                        <p className="text-[11px] text-slate-600 leading-tight">{plant.forensic_analysis?.leaf_condition || 'Análisis no disponible'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase leading-none mb-1">Estructura del Tallo</p>
                        <p className="text-[11px] text-slate-600 leading-tight">{plant.forensic_analysis?.stem_structure || 'Evaluación pendiente'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Growth Roadmap Timeline */}
                  <div>
                    <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-4">Plan de Crecimiento</p>
                    <div className="relative pl-6 space-y-6 border-l-2 border-slate-100">
                      {(plant.growth_roadmap || []).map((step, idx) => (
                        <div key={idx} className="relative">
                          {/* Dot */}
                          <div className="absolute -left-[31px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white"></div>
                          <p className="text-[10px] font-black text-emerald-600 uppercase mb-0.5">{step.stage}</p>
                          <p className="text-[11px] text-slate-500 leading-snug">{step.action}</p>
                        </div>
                      ))}
                      {!plant.growth_roadmap?.length && <p className="text-[10px] text-slate-400 italic">No hay datos del plan disponibles.</p>}
                    </div>
                  </div>

                  {/* Meta Footer */}
                  <div className="mt-10 pt-6 border-t border-slate-100 flex justify-between items-center">
                    <div className="flex items-center gap-2 text-slate-400">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>
                      <span className="text-[10px] font-mono font-bold tracking-tighter">REF: {plant.id.split('-')[0]}</span>
                    </div>
                    <time className="text-[10px] font-bold text-slate-300 uppercase italic">
                      {new Date(plant.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                    </time>
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

