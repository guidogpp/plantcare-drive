import { useRef, useState } from 'react'
import { useGoogleLogin } from '@react-oauth/google'
import { supabase } from '../supabaseClient'
import { analyzePlant } from '../services/ai'

export default function UploadButton({ onUploadSuccess }) {
  const fileRef = useRef(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  
  // Cargamos el ID de tu carpeta desde el .env
  const folderId = import.meta.env.VITE_GOOGLE_FOLDER_ID

  const login = useGoogleLogin({
    // Añadimos scopes extra para poder cambiar permisos y que la foto sea visible
    scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.resource',
    onSuccess: (tokenResponse) => {
      if (fileRef.current) {
        processUpload(fileRef.current, tokenResponse.access_token)
      }
    },
    onError: error => console.error('Login Failed:', error)
  });

  const handleFileSelect = () => {
    const fileInput = document.createElement('input')
    fileInput.type = 'file'
    fileInput.accept = 'image/*'
    
    fileInput.onchange = (e) => {
      const file = e.target.files[0]
      if (file) {
        fileRef.current = file
        // El retraso de 500ms evita que el navegador bloquee el popup de Google
        setTimeout(() => login(), 500)
      }
    }
    fileInput.click()
  }

  // Función para que cualquier persona con el link vea la foto (necesario para la web)
  const makeFilePublic = async (fileId, accessToken) => {
    try {
      await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: 'reader',
          type: 'anyone',
        }),
      });
      console.log("🔓 Permisos actualizados: Imagen pública");
    } catch (error) {
      console.error("Error al dar permisos:", error);
    }
  }

  const processUpload = async (file, accessToken) => {
    setIsAnalyzing(true)
    
    try {
      console.log("🚀 Subiendo a Drive y consultando a Gemini...");
      
      // Ejecutamos Drive e IA al mismo tiempo
      const drivePromise = uploadToDriveOnly(file, accessToken);
      const aiPromise = analyzePlant(file);

      const [driveId, aiResult] = await Promise.all([drivePromise, aiPromise]);

      if (driveId) {
        // 1. Hacer pública la imagen para que el navegador la cargue
        await makeFilePublic(driveId, accessToken);
        // 2. Guardar todo en Supabase
        await saveToSupabase(driveId, file.name, aiResult);
      }

    } catch (error) {
      console.error("Error en el proceso:", error);
    } finally {
      setIsAnalyzing(false)
      fileRef.current = null
    }
  }

  const uploadToDriveOnly = async (file, accessToken) => {
    const metadata = {
      name: file.name,
      mimeType: file.type,
      parents: folderId ? [folderId] : ['root']
    }

    const formData = new FormData()
    formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }))
    formData.append('file', file)

    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: formData
    })
    const data = await response.json()
    return data.id
  }

  const saveToSupabase = async (driveId, fileName, aiData) => {
    const record = {
      name: aiData?.species || fileName,
      image_id: driveId,
      health_status: aiData?.health_status || 'Unknown',
      species: aiData?.species,
      diagnosis_report: aiData?.diagnosis,
      water_frequency_days: aiData?.water_frequency || 7
    }

    const { error } = await supabase.from('plants').insert([record])

    if (error) console.error('Error Supabase:', error)
    else {
      console.log('✅ Planta guardada con éxito');
      if (onUploadSuccess) onUploadSuccess();
    }
  }

  return (
    <button 
      onClick={handleFileSelect}
      disabled={isAnalyzing}
      className={`px-4 py-2 rounded-lg font-semibold shadow transition flex items-center gap-2 
        ${isAnalyzing ? 'bg-gray-100 text-gray-500 cursor-wait' : 'bg-white text-emerald-700 hover:bg-gray-100 cursor-pointer'}`}
    >
      {isAnalyzing ? '🤖 Analizando...' : '📸 Subir Nueva Planta'}
    </button>
  )
}
