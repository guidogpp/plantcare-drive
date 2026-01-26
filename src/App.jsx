import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import UploadButton from './components/UploadButton'
import PlantDetailCard from './components/PlantDetailCard'

function Dashboard({ session }) {
  const [plants, setPlants] = useState([])
  const [fetchingPlants, setFetchingPlants] = useState(false)

  useEffect(() => {
    fetchPlants()
  }, [])

  async function fetchPlants() {
    setFetchingPlants(true)
    const { data, error } = await supabase
      .from('plants')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) console.error('Error cargando plantas:', error)
    else setPlants(data)
    
    setFetchingPlants(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.reload()
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
          <div className="flex items-center gap-4">
            <UploadButton onUploadSuccess={fetchPlants} />
            <button 
              onClick={handleLogout}
              className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-red-500 transition-colors"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {fetchingPlants ? (
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

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 1. Obtener sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    // 2. Suscribirse a cambios
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('EVENTO AUTH:', event)
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
        scopes: 'email profile openid https://www.googleapis.com/auth/drive.file'
      }
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-emerald-600"></div>
      </div>
    )
  }

  // Si no hay sesión, mostramos el botón de login explícito
  if (!session) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-6 text-center">
        <div className="bg-emerald-600 p-4 rounded-3xl shadow-2xl mb-8">
          <span className="text-5xl">🌱</span>
        </div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-4">
          PlantCare <span className="text-emerald-600">Lab</span>
        </h1>
        <p className="text-slate-500 max-w-xs mb-10 leading-relaxed font-medium">
          Sistema de análisis forense botánico con Inteligencia Artificial.
        </p>
        
        <button 
          onClick={handleLogin}
          className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-3 hover:bg-slate-800 transition-all shadow-xl active:scale-95"
        >
          <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
          Entrar con Google
        </button>
        
        <p className="mt-8 text-[10px] uppercase font-bold text-slate-300 tracking-widest">
          Requiere acceso a Google Drive
        </p>
      </div>
    )
  }

  // Si hay sesión, mostramos el Dashboard
  return <Dashboard session={session} />
}

export default App


