
import { useEffect, useRef, useState } from 'react';
import { getDriveImageUrl } from '../helpers/getDriveImageUrl';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import PlantDetailView from '../components/PlantDetailView';
import { ArrowLeft, Sprout, Camera, RefreshCcw } from 'lucide-react';
import { analyzeImageWithGemini } from '../services/ai';

export default function PlantPage() {
  // Estado para el slider de diagnósticos
  const [slideIndex, setSlideIndex] = useState(0);
  const { id } = useParams();
  const [plant, setPlant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchPlantData();
    // eslint-disable-next-line
  }, [id]);

  const fetchPlantData = async () => {
    try {
      setLoading(true);
      const { data, error: supabaseError } = await supabase
        .from('plants')
        .select(`*, plant_diagnoses (*)`)
        .eq('id', id)
        .single();
      if (supabaseError) throw supabaseError;
      
      // Ordenar diagnósticos por fecha (descendente) manualmente si es necesario
      if (data.plant_diagnoses) {
        data.plant_diagnoses.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      }
      
      setPlant(data);
    } catch (err) {
      console.error('Error fetching plant:', err);
      setError('No pudimos encontrar este espécimen en tu jardín.');
    } finally {
      setLoading(false);
    }
  };

  // --- Lógica de Re-diagnóstico ---
    // --- Diagnóstico Slider ---
    // Construir slides según reglas del objetivo
    let slides = [];
    const diagnoses = plant?.plant_diagnoses || [];
    if (diagnoses.length > 0) {
      slides = diagnoses
        .filter(d => d && d.image_id)
        .map(d => ({
          id: d.id,
          image_id: d.image_id,
          created_at: d.created_at,
          health_status: d.health_status,
          diagnosis_report: d.diagnosis_report
        }));
    } else if (plant?.image_id) {
      slides = [{
        id: plant.id,
        image_id: plant.image_id,
        created_at: plant.created_at,
        health_status: plant.health_status,
        diagnosis_report: plant.diagnosis_report
      }];
    }

    // Resetear slideIndex cuando cambian slides o id
    useEffect(() => {
      setSlideIndex(0);
    }, [id, slides.length]);
  const handleUpdateClick = () => {
    setUpdateError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUpdating(true);
    setUpdateError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !session.provider_token) {
        throw new Error('Sesión de Google expirada. Por favor, vuelve a entrar.');
      }

      const driveData = await uploadToDrive(file, session.provider_token);
      if (!driveData?.id) throw new Error('Error al subir a Google Drive.');

      const aiData = await analyzeImageWithGemini(file);
      if (aiData.error) throw new Error(aiData.error);

      // 4A. Insertar en historial (Usando las nuevas columnas SQL)
      const diagPayload = {
        plant_id: id,
        image_id: driveData.id,
        health_score: aiData.estado_salud_score,
        health_status: `${aiData.estado_salud_score}/100`,
        diagnosis_report: aiData.diagnostico_corto,
        forensic_analysis: aiData.analisis_forense,
        technical_care: aiData.cuidados_tecnicos,
        growth_roadmap: aiData.growth_roadmap,
      };
      const { error: diagError } = await supabase.from('plant_diagnoses').insert([diagPayload]);
      if (diagError) throw diagError;

      // 4B. Actualizar planta (Estado actual)
      const updatePayload = {
        health_score: aiData.estado_salud_score,
        forensic_analysis: aiData.analisis_forense,
        technical_care: aiData.cuidados_tecnicos,
        growth_roadmap: aiData.growth_roadmap,
        image_id: driveData.id,
        diagnosis_report: aiData.diagnostico_corto,
        scientific_name: aiData.scientific_name,
        family: aiData.family,
        name: aiData.nombre_comun,
      };
      const { error: plantError } = await supabase.from('plants').update(updatePayload).eq('id', id);
      if (plantError) throw plantError;

      await fetchPlantData();
    } catch (err) {
      console.error('Error en re-diagnóstico:', err);
      setUpdateError(err.message || 'Error en el proceso.');
    } finally {
      setIsUpdating(false);
    }
  };

  const uploadToDrive = async (file, accessToken) => {
    const folderId = import.meta.env.VITE_GOOGLE_FOLDER_ID;
    const metadata = {
      name: `update_${Date.now()}_${file.name}`,
      mimeType: file.type,
      parents: folderId ? [folderId] : []
    };
    const formData = new FormData();
    formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    formData.append('file', file);
    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: formData
    });
    if (!response.ok) throw new Error('Error comunicación Drive');
    return await response.json();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <Sprout className="w-12 h-12 text-emerald-500 animate-bounce mb-4" />
        <p className="text-slate-500 font-medium animate-pulse">Consultando el herbario digital...</p>
      </div>
    );
  }

  if (error || !plant) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6 text-center">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">{error}</h2>
        <Link to="/" className="text-emerald-600 font-bold hover:underline flex items-center gap-2">
          <ArrowLeft size={20} /> Volver al Jardín
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20 relative">
      {isUpdating && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center">
          <div className="bg-white rounded-3xl shadow-2xl px-10 py-8 flex flex-col items-center border border-emerald-100">
            <RefreshCcw className="w-12 h-12 text-emerald-500 animate-spin mb-4" />
            <p className="text-slate-800 font-bold text-lg">Analizando evolución...</p>
            <p className="text-slate-400 text-sm">Gemini está examinando los cambios.</p>
          </div>
        </div>
      )}

      <nav className="p-6 max-w-5xl mx-auto flex items-center justify-between">
        <Link to="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-emerald-600 transition-colors font-bold">
          <ArrowLeft size={20} /> Jardín
        </Link>
        <button
          onClick={handleUpdateClick}
          disabled={isUpdating}
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-2xl shadow-lg transition-all active:scale-95 disabled:opacity-50"
        >
          <Camera className="w-5 h-5" />
          Actualizar Estado
        </button>
        <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handleFileChange} />
      </nav>

      <main className="max-w-5xl mx-auto px-4">
        {updateError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-2xl text-sm font-medium text-center">
            ⚠️ {updateError}
          </div>
        )}

        {/* Imagen/Slider SIEMPRE ARRIBA */}
        <section className="mb-10 max-w-md mx-auto w-full">
          {slides.length === 0 ? (
            <div className="aspect-[4/5] w-full max-w-xs mx-auto bg-slate-100 rounded-2xl flex items-center justify-center border border-slate-200 text-slate-400 text-center font-bold text-lg">
              Sin imagen disponible
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="aspect-[4/5] w-full max-w-xs bg-slate-100 rounded-2xl overflow-hidden flex items-center justify-center mb-4 border border-slate-200">
                <img
                  src={getDriveImageUrl(slides[slideIndex].image_id, 800)}
                  alt={`Imagen ${slideIndex + 1}`}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={e => { e.target.style.opacity = 0.3; }}
                />
              </div>
              {slides.length >= 2 && (
                <div className="flex items-center gap-4 mb-2">
                  <button
                    className="px-3 py-1 rounded-full bg-slate-200 text-slate-500 font-bold disabled:opacity-40"
                    onClick={() => setSlideIndex(i => Math.max(i - 1, 0))}
                    disabled={slideIndex === 0}
                    aria-label="Anterior"
                  >Anterior</button>
                  <span className="font-mono text-sm text-slate-500 select-none">
                    {slideIndex + 1} / {slides.length}
                  </span>
                  <button
                    className="px-3 py-1 rounded-full bg-slate-200 text-slate-500 font-bold disabled:opacity-40"
                    onClick={() => setSlideIndex(i => Math.min(i + 1, slides.length - 1))}
                    disabled={slideIndex === slides.length - 1}
                    aria-label="Siguiente"
                  >Siguiente</button>
                </div>
              )}
              {/* Metadatos debajo de la imagen */}
              <div className="text-center mt-2">
                <div className="text-xs text-slate-400 font-bold">
                  {slides[slideIndex].created_at ? new Date(slides[slideIndex].created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
                </div>
                {slides[slideIndex].health_status && (
                  <div className="inline-block mt-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-black">
                    {slides[slideIndex].health_status}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        <PlantDetailView plant={plant} />

        <section className="mt-12 bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
          <h3 className="text-2xl font-black text-slate-800 mb-8 flex items-center gap-3">
            <div className="w-2 h-8 bg-emerald-500 rounded-full"></div>
            Historial Clínico
          </h3>
          
          {plant.plant_diagnoses && plant.plant_diagnoses.length > 0 ? (
            <div className="space-y-6">
              {plant.plant_diagnoses.map((diag) => (
                <div key={diag.id} className="group relative pl-8 border-l-2 border-slate-100 pb-2 last:pb-0">
                  <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-4 border-emerald-500 group-hover:scale-125 transition-transform"></div>
                  <div className="bg-slate-50 p-5 rounded-2xl border border-transparent group-hover:border-emerald-100 group-hover:bg-white transition-all">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sm font-black text-slate-400 uppercase tracking-tighter">
                        {new Date(diag.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-black">
                        {diag.health_score || diag.health_status || 0}% Salud
                      </span>
                    </div>
                    <p className="text-slate-600 text-sm leading-relaxed">{diag.diagnosis_report}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-slate-400 font-medium italic">Aún no hay registros en la cronología.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}