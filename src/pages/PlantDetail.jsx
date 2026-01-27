import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { ArrowLeft, RefreshCcw } from 'lucide-react';
import PlantDetailView from '../components/PlantDetailView';

export default function PlantPage() {
  const { id } = useParams();
  const [plant, setPlant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estados para el historial
  const [diagnoses, setDiagnoses] = useState([]);
  const [loadingDiagnoses, setLoadingDiagnoses] = useState(true);

  useEffect(() => {
    if (id) {
      fetchPlantData();
    }
  }, [id]);

  const fetchPlantData = async () => {
    try {
      setLoading(true);
      setLoadingDiagnoses(true);

      // 1. Traer datos de la planta
      const { data: plantData, error: plantError } = await supabase
        .from('plants')
        .select('*')
        .eq('id', id)
        .single();

      if (plantError) throw plantError;
      setPlant(plantData);

      // 2. Traer historial de diagnósticos
      const { data: diagData, error: diagError } = await supabase
        .from('plant_diagnoses')
        .select('*')
        .eq('plant_id', id)
        .order('created_at', { ascending: false });

      if (diagError) throw diagError;
      setDiagnoses(diagData || []);

    } catch (err) {
      console.error("Error:", err);
      setError("No se pudo cargar la información de la planta.");
    } finally {
      setLoading(false);
      setLoadingDiagnoses(false);
    }
  };

  // Renderizado de carga
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-emerald-600"></div>
      </div>
    );
  }

  // Renderizado de error
  if (error || !plant) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <h1 className="text-2xl font-bold text-slate-800 mb-4">{error || "Planta no encontrada"}</h1>
        <Link to="/" className="text-emerald-600 font-bold hover:underline flex items-center gap-2">
          <ArrowLeft size={20} /> Volver al Jardín
        </Link>
      </div>
    );
  }

  // RENDER PRINCIPAL (Todo dentro de la función)
  return (
    <div className="min-h-screen bg-slate-50 pb-10 px-4">
      <nav className="max-w-4xl mx-auto py-6">
        <Link to="/" className="flex items-center gap-2 text-slate-500 hover:text-emerald-600 transition-colors font-semibold">
          <ArrowLeft size={20} /> Volver
        </Link>
      </nav>

      <main className="max-w-4xl mx-auto space-y-8">
        {/* Componente que el Agente Junior creó con los medidores y el JSONB */}
        <PlantDetailView plant={plant} />

        {/* Sección de Historial */}
        <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <h2 className="text-xl font-bold mb-6 text-slate-800 flex items-center gap-2">
             <RefreshCcw size={20} className="text-emerald-500" />
             Historial de Diagnósticos
          </h2>
          
          {loadingDiagnoses ? (
            <p className="text-slate-400 animate-pulse">Cargando cronología...</p>
          ) : diagnoses.length === 0 ? (
            <p className="text-slate-400 italic">No hay registros previos.</p>
          ) : (
            <ul className="space-y-4">
              {diagnoses.map((diag) => (
                <li key={diag.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex justify-between items-center">
                  <div>
                    <span className="text-xs font-bold text-slate-400 block uppercase">
                      {new Date(diag.created_at).toLocaleDateString()}
                    </span>
                    <p className="text-slate-700 font-medium">{diag.diagnosis_report || "Sin reporte"}</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                      Score: {diag.health_score || diag.health_status || 'N/A'}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}