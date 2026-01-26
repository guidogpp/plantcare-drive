
import { useRef, useState } from 'react';
import { supabase } from '../supabaseClient';
import { analyzeImageWithGemini } from '../services/ai';

export default function UploadButton({ onUploadSuccess }) {
  const fileRef = useRef(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const folderId = import.meta.env.VITE_GOOGLE_FOLDER_ID;

  const handleFileSelect = () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.onchange = async (e) => {
      const file = e.target.files[0];
      if (file) {
        setIsAnalyzing(true);
        try {
          // 1. Obtener sesión de Supabase (y el provider_token)
          const { data: { session } } = await supabase.auth.getSession();
          
          if (!session || !session.provider_token) {
            console.error('No hay sesión activa o falta provider_token');
            // Opcional: Redirigir a login si el token expiró
            return;
          }

          // 2. Ejecutar subida a Drive y análisis con Gemini en paralelo
          const [driveData, aiData] = await Promise.all([
            uploadToDrive(file, session.provider_token),
            analyzeImageWithGemini(file)
          ]);

          if (driveData?.id && aiData) {
            await saveToSupabase(driveData.id, aiData);
          } else {
            console.error('Error en subida o análisis:', driveData, aiData);
          }
        } catch (err) {
          console.error('Error en proceso:', err);
        } finally {
          setIsAnalyzing(false);
        }
      }
    };
    fileInput.click();
  };

  const uploadToDrive = async (file, accessToken) => {
    const metadata = {
      name: file.name,
      mimeType: file.type,
      parents: folderId ? [folderId] : ['root']
    };

    const formData = new FormData();
    formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    formData.append('file', file);

    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: formData
    });
    return await response.json();
  };

  const saveToSupabase = async (driveId, aiData) => {
    const { 
      nombre_comun, 
      estado_salud, 
      diagnostico, 
      riego_recomendado 
    } = aiData;

    const { error } = await supabase
      .from('plants')
      .insert([
        {
          name: nombre_comun || 'Planta Analizada',
          image_id: driveId,
          health_status: `Puntuación: ${estado_salud || 'N/A'}/10`,
          diagnosis_report: diagnostico || 'Sin diagnóstico disponible',
          forensic_analysis: {
            leaf_condition: diagnostico,
            detected_issues: [diagnostico]
          },
          care_technical_details: {
            humidity_target: riego_recomendado
          }
        }
      ]);

    if (error) {
      console.error('Error Supabase:', error);
    } else {
      console.log('✅ Planta guardada con nueva arquitectura Auth/AI');
      if (onUploadSuccess) onUploadSuccess();
    }
  };

  return (
    <button 
      onClick={handleFileSelect}
      disabled={isAnalyzing}
      className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg hover:bg-emerald-700 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
    >
      <span className="text-xl">{isAnalyzing ? '🤖' : '📸'}</span>
      {isAnalyzing ? 'Analizando...' : 'Subir Planta'}
    </button>
  );
}
