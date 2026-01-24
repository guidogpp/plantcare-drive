
import { useRef, useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { supabase } from '../supabaseClient';
import { analyzePlant } from '../services/ai';

export default function UploadButton({ onUploadSuccess }) {
  const fileRef = useRef(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const folderId = import.meta.env.VITE_GOOGLE_FOLDER_ID;

  const login = useGoogleLogin({
    scope: 'https://www.googleapis.com/auth/drive.file',
    onSuccess: async (tokenResponse) => {
      if (fileRef.current) {
        setIsAnalyzing(true);
        try {
          // Ejecutar subida y análisis en paralelo
          const [driveData, aiData] = await Promise.all([
            uploadToDrive(fileRef.current, tokenResponse.access_token),
            analyzePlant(fileRef.current)
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
          fileRef.current = null;
        }
      }
    },
    onError: error => console.error('Login Failed:', error)
  });

  const handleFileSelect = () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        fileRef.current = file;
        // Hack para evitar bloqueador de popups en Chrome
        setTimeout(() => {
          login();
        }, 500);
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
      nombre_cientifico, 
      estado_salud, 
      analisis_forense, 
      detalles_tecnicos_cuidado,
      plan_crecimiento
    } = aiData;

    // Adaptamos el esquema de la IA al esquema de la base de datos
    const { error } = await supabase
      .from('plants')
      .insert([
        {
          name: nombre_comun || 'Planta Desconocida',
          scientific_name: nombre_cientifico || null,
          species: nombre_cientifico || nombre_comun || 'Desconocida',
          image_id: driveId,
          health_status: estado_salud || 'Desconocido',
          forensic_analysis: {
            leaf_condition: analisis_forense?.estado_hojas,
            stem_structure: analisis_forense?.estructura_tallo,
            detected_issues: analisis_forense?.problemas_detectados
          },
          growth_roadmap: (plan_crecimiento || []).map(p => ({
            stage: p.etapa,
            action: p.instruccion
          })),
          care_technical_details: {
            light_lux: detalles_tecnicos_cuidado?.luz_lux,
            ph_ideal: detalles_tecnicos_cuidado?.ph_suelo,
            humidity_target: detalles_tecnicos_cuidado?.humedad_ideal
          },
          diagnosis_report: analisis_forense?.estado_hojas || 'Sin diagnóstico detallado',
          water_frequency_days: 7 // Valor por defecto
        }
      ]);

    if (error) {
      console.error('Error Supabase:', error);
    } else {
      console.log('✅ Guardado en Supabase con estructura extendida (Localizada)');
      if (onUploadSuccess) onUploadSuccess();
    }
  };

  return (
    <button 
      onClick={handleFileSelect}
      disabled={isAnalyzing}
      className="bg-white text-emerald-700 px-4 py-2 rounded-lg font-semibold shadow hover:bg-gray-100 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
    >
      {isAnalyzing ? '🤖 Analizando con IA...' : '📸 Subir Nueva Planta'}
    </button>
  );
}
