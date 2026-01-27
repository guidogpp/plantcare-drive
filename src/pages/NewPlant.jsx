import { useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { analyzeImageWithGemini } from '../services/ai';

export default function CreatePlant() { // <--- ERROR 1: Faltaba la declaración
  const isPickingRef = useRef(false);
  const fileInputRef = useRef(null); // <--- Mejora: Uso de Ref para el input
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  
  const folderId = import.meta.env.VITE_GOOGLE_FOLDER_ID;

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      // 1. Validar Sesión y Token de Google
      const { data: { session } } = await supabase.auth.getSession();
      
      // NOTA: Si provider_token es null, el usuario debe re-autenticarse con Google
      if (!session || !session.provider_token) {
        throw new Error('Sesión de Google expirada. Por favor, inicia sesión de nuevo.');
      }

      // 2. Subir a Google Drive
      const driveData = await uploadToDrive(file, session.provider_token);
      if (!driveData?.id) throw new Error('Error al obtener ID de Google Drive.');

      // 3. Análisis con Gemini 1.5
      // Tip: El prompt debe pedir un JSON estructurado (ver abajo)
      const aiData = await analyzeImageWithGemini(file);

      // 4. Guardado en Supabase
      const newId = await saveToSupabase(driveData.id, aiData);
      
      if (newId) {
        navigate(`/plants/${newId}`);
      }
    } catch (err) {
      console.error("Error en el flujo:", err);
      setError(err.message);
    } finally {
      setIsAnalyzing(false);
      if (fileInputRef.current) fileInputRef.current.value = ''; // Reset input
    }
  };

  const uploadToDrive = async (file, accessToken) => {
    const metadata = {
      name: `plant_${Date.now()}_${file.name}`,
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

    if (!response.ok) throw new Error('Fallo la comunicación con Google Drive');
    return await response.json();
  };

  const saveToSupabase = async (driveId, aiData) => {
    // Si la IA falla, crea un payload mínimo
    const isFallback = !aiData || aiData.error;
    const plantPayload = isFallback
      ? {
          name: 'Planta sin diagnóstico',
          image_id: driveId,
          health_score: 0,
          scientific_name: null,
          family: null,
          diagnosis_report: 'Diagnóstico pendiente',
          forensic_analysis: {},
          technical_care: {},
          growth_roadmap: []
        }
      : {
          name: aiData.nombre_comun,
          scientific_name: aiData.scientific_name,
          family: aiData.family,
          health_score: aiData.estado_salud_score,
          image_id: driveId,
          diagnosis_report: aiData.diagnostico_corto,
          forensic_analysis: aiData.analisis_forense,
          technical_care: aiData.cuidados_tecnicos,
          growth_roadmap: aiData.growth_roadmap
        };

    const { data, error: pgError } = await supabase
      .from('plants')
      .insert([plantPayload])
      .select()
      .single();

    if (pgError) throw pgError;
    return data.id;
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center">
        <h1 className="text-3xl font-extrabold text-slate-800 mb-2">PlantCare Drive</h1>
        <p className="text-slate-500 mb-8">Diagnóstico botánico con IA y backup en la nube.</p>
        
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/*"
          className="hidden"
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isAnalyzing}
          className="w-full bg-emerald-600 text-white px-6 py-4 rounded-2xl font-bold shadow-lg hover:bg-emerald-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
        >
          {isAnalyzing ? (
            <><span className="animate-spin">🔄</span> Analizando espécimen...</>
          ) : (
            <><span className="text-2xl">📸</span> Subir y Diagnosticar</>
          )}
        </button>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="mt-6">
          <Link to="/" className="text-emerald-600 font-semibold hover:underline">
            ← Ver mi jardín
          </Link>
        </div>
      </div>
    </div>
  );
}