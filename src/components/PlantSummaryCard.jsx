import React from "react";
import { Droplets, AlertTriangle, Image as ImageIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function PlantSummaryCard({ plant }) {
  const navigate = useNavigate();
  if (!plant) return null;

  // 1. Configuración de Salud
  const score = plant?.health_score ?? 0;
  let healthColor = "text-emerald-500 border-emerald-500";
  let healthBg = "bg-emerald-500";
  if (score < 35) {
    healthColor = "text-red-500 border-red-500";
    healthBg = "bg-red-500";
  } else if (score < 75) {
    healthColor = "text-amber-500 border-amber-500";
    healthBg = "bg-amber-500";
  }

  // 2. Lógica de Imagen (Google Drive Preview)
  // Usamos el thumbnail de Google Drive. Nota: Requiere que la imagen sea accesible
  // o usar un proxy/token si son privadas.
  const googleDriveUrl = plant.image_id 
    ? `https://lh3.googleusercontent.com/u/0/d/${plant.image_id}=s800` 
    : null;

  const isCritical = plant?.forensic_analysis?.gravedad?.toLowerCase() === 'alta';

  return (
    <div
      className="group relative bg-white rounded-[2.5rem] shadow-sm hover:shadow-2xl transition-all duration-300 cursor-pointer flex flex-col overflow-hidden border border-slate-50"
      onClick={() => navigate(`/plants/${plant.id}`)}
    >
      {/* Contenedor de Imagen (Header) */}
      <div className="relative h-40 w-full bg-slate-100 overflow-hidden">
        {googleDriveUrl ? (
          <img 
            src={googleDriveUrl} 
            alt={plant.name}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            onError={(e) => {
              e.target.onerror = null; 
              e.target.src = 'https://images.unsplash.com/photo-1545239351-ef35f43d514b?q=80&w=500&auto=format&fit=crop'; // Fallback botánico
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300">
            <ImageIcon size={40} />
          </div>
        )}

        {/* Badge de Score (Flotante sobre la imagen) */}
        <div className={`absolute bottom-4 left-4 px-3 py-1.5 rounded-2xl bg-white/90 backdrop-blur-md shadow-lg flex items-center gap-2 border border-white`}>
          <div className={`w-2 h-2 rounded-full ${healthBg} animate-pulse`} />
          <span className={`text-sm font-black ${healthColor.split(' ')[0]}`}>{score}%</span>
        </div>

        {/* Alerta Crítica */}
        {isCritical && (
          <div className="absolute top-4 right-4 bg-red-500 text-white p-2 rounded-full shadow-lg animate-bounce">
            <AlertTriangle size={16} />
          </div>
        )}
      </div>

      {/* Contenido de la Card */}
      <div className="p-6 flex flex-col flex-1">
        <div className="mb-4">
          <h3 className="text-xl font-black text-slate-800 truncate leading-tight">
            {plant?.name ?? 'Especie Nueva'}
          </h3>
          <p className="text-xs italic text-slate-400 truncate">
            {plant?.scientific_name ?? 'Pendiente de identificación'}
          </p>
        </div>

        {/* Badges Técnicos */}
        <div className="flex flex-wrap gap-2 mb-4">
          {plant?.family && (
            <span className="bg-slate-50 text-slate-500 px-3 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider border border-slate-100">
              {plant.family}
            </span>
          )}
          <span className="flex items-center gap-1 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider border border-emerald-100">
            <Droplets className="w-3 h-3" />
            {plant?.technical_care?.riego?.split(' ')[0] || 'N/A'}
          </span>
        </div>

        {/* Resumen de Diagnóstico */}
        <div className="mt-auto">
          <p className="text-xs text-slate-500 line-clamp-2 font-medium bg-slate-50 p-3 rounded-2xl">
            {plant?.diagnosis_report ?? 'Iniciando primer análisis forense...'}
          </p>
        </div>
      </div>
    </div>
  );
}