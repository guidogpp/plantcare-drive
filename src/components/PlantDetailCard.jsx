import React, { useState } from 'react';

/**
 * PlantDetailCard - Componente refactorizado para máxima compatibilidad móvil
 * y visualización estilo "Bento Box".
 */
const PlantDetailCard = ({ plant }) => {
  const [imgLoaded, setImgLoaded] = useState(false);

  // 1. Gestión de Imágenes (Fix para Mobile)
  const getGoogleDriveUrl = (id) => {
    if (!id) return '';
    // Usando endpoint de googleusercontent para mayor velocidad y compatibilidad
    return `https://lh3.googleusercontent.com/u/0/d/${id}=s2000`;
  };

  // 2. Procesamiento de Datos (Safe JSON Parsing)
  // Supabase puede devolver jsonb como objeto o texto escapado dependiendo del driver/config
  const safeParse = (data) => {
    if (!data) return {};
    if (typeof data === 'object' && !Array.isArray(data)) return data;
    if (Array.isArray(data)) return data;
    try {
      return JSON.parse(data);
    } catch (e) {
      console.warn("Error parsing JSON field:", e);
      return {};
    }
  };

  const technicalDetails = safeParse(plant.care_technical_details);
  const forensicAnalysis = safeParse(plant.forensic_analysis);
  const growthRoadmap = safeParse(plant.growth_roadmap);

  // Mapeo de colores para el estado de salud
  const getStatusColor = (status) => {
    const s = status?.toLowerCase() || '';
    if (s.includes('saludable')) return 'bg-emerald-500/90 text-white';
    if (s.includes('agua') || s.includes('necesita') || s.includes('sed')) return 'bg-sky-500/90 text-white';
    if (s.includes('enferma') || s.includes('plaga') || s.includes('alerta') || s.includes('marchita')) return 'bg-amber-500/90 text-white';
    return 'bg-slate-500/90 text-white';
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-[2.5rem] shadow-xl overflow-hidden border border-slate-100 flex flex-col h-auto transition-all duration-300 hover:shadow-2xl font-sans">
      
      {/* Visual Scanner Area - Aspect Ratio Fijo para evitar CLS */}
      <div className="relative aspect-[4/5] overflow-hidden group bg-slate-100">
        {plant.image_id ? (
          <>
            {/* Skeleton Screen Loader */}
            {!imgLoaded && (
              <div className="absolute inset-0 z-0 bg-slate-200 animate-pulse flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-full border-4 border-slate-300 border-t-emerald-500 animate-spin"></div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse">Iniciando Scanner...</p>
                </div>
              </div>
            )}
            
            <img 
              src={getGoogleDriveUrl(plant.image_id)}
              alt={plant.name}
              // 1. Fix para Mobile: Evitar bloqueos de CORS
              referrerPolicy="no-referrer"
              onLoad={() => setImgLoaded(true)}
              className={`w-full h-full object-cover transition-all duration-1000 group-hover:scale-105 ${imgLoaded ? 'opacity-100 blur-0' : 'opacity-0 blur-xl'}`}
            />
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-slate-400 italic text-sm">
            Sin datos visuales
          </div>
        )}
        
        {/* Badge de Estado: Backdrop Blur + Floating */}
        <div className="absolute top-6 left-6 z-10">
          <span className={`px-5 py-2 text-[10px] font-black uppercase tracking-[0.2em] rounded-full backdrop-blur-md shadow-lg border border-white/20 ${getStatusColor(plant.health_status)}`}>
            {plant.health_status || 'DESCONOCIDO'}
          </span>
        </div>

        {/* Overlay Estético */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none"></div>
      </div>

      {/* Report Area - Estilo Bento Box */}
      <div className="p-8 -mt-12 relative bg-white rounded-t-[3rem] shadow-[0_-20px_50px_-15px_rgba(0,0,0,0.15)] flex flex-col gap-8">
        
        {/* Identidad de la Planta */}
        <div className="text-center md:text-left">
          <h2 className="text-3xl font-black text-slate-800 tracking-tighter leading-tight mb-1">
            {plant.name || 'Muestra S-01'}
          </h2>
          <p className="text-sm font-bold text-emerald-600 italic">
            {plant.scientific_name || plant.species || "Especie no identificada"}
          </p>
        </div>

        {/* 3. Grid Técnico (Bento Layout) */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 flex flex-col">
            <span className="text-[9px] uppercase font-black text-slate-400 tracking-widest mb-1 text-center">Nivel Lux</span>
            <p className="text-xs font-bold text-slate-700 text-center flex items-center justify-center gap-1.5">
              ☀️ {technicalDetails.light_lux || 'Estándar'}
            </p>
          </div>
          <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 flex flex-col">
            <span className="text-[9px] uppercase font-black text-slate-400 tracking-widest mb-1 text-center">PH Suelo</span>
            <p className="text-xs font-bold text-slate-700 text-center flex items-center justify-center gap-1.5">
              🧪 {technicalDetails.ph_ideal || 'Neutro'}
            </p>
          </div>
          <div className="bg-emerald-50/50 p-4 rounded-3xl border border-emerald-100/50 col-span-2 flex justify-between items-center px-6">
             <span className="text-[9px] uppercase font-black text-emerald-600/60 tracking-widest">Humedad Objetivo</span>
             <p className="text-xs font-black text-emerald-700">
               💧 {technicalDetails.humidity_target || '40-60%'}
             </p>
          </div>
        </div>

        {/* Forensic Analysis - Dark Mode Contrast */}
        <div className="bg-slate-900 text-white p-6 rounded-[2.5rem] shadow-xl relative overflow-hidden">
          {/* Luz de escaneo decorativa */}
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-pulse"></div>
          
          <p className="text-[10px] uppercase font-black text-emerald-400 tracking-[0.3em] mb-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
            Análisis Forense Visual
          </p>
          
          <div className="space-y-5">
            <div>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Estado Foliar</p>
              <p className="text-[13px] text-slate-300 leading-snug">
                {forensicAnalysis.leaf_condition || 'Sin anomalías detectadas en la superficie.'}
              </p>
            </div>
            {forensicAnalysis.detected_issues && forensicAnalysis.detected_issues.length > 0 && (
              <div>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2">Hallazgos Críticos</p>
                <div className="flex flex-wrap gap-2">
                  {forensicAnalysis.detected_issues.map((issue, i) => (
                    <span key={i} className="px-3 py-1 bg-red-500/20 text-red-300 text-[10px] font-black rounded-full border border-red-500/30">
                      ⚠️ {issue}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Growth Roadmap - Mobile Friendly Timeline */}
        {Array.isArray(growthRoadmap) && growthRoadmap.length > 0 && (
          <div className="px-2">
            <div className="flex items-center gap-3 mb-5">
              <div className="h-[1px] flex-1 bg-slate-100"></div>
              <p className="text-[10px] uppercase font-black text-slate-400 tracking-[0.2em]">Roadmap</p>
              <div className="h-[1px] flex-1 bg-slate-100"></div>
            </div>
            
            <div className="space-y-5 relative before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-[1px] before:bg-slate-100">
              {growthRoadmap.map((step, idx) => (
                <div key={idx} className="relative pl-8">
                  <div className="absolute left-0 top-1.5 w-[15px] h-[15px] rounded-full bg-white border-2 border-emerald-500 shadow-sm z-10"></div>
                  <p className="text-[11px] font-black text-slate-800 uppercase mb-0.5 tracking-tight">{step.stage}</p>
                  <p className="text-xs text-slate-500 leading-snug">{step.action}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Data */}
        <div className="flex justify-between items-center opacity-30 pt-4 border-t border-slate-50">
           <span className="text-[9px] font-mono font-bold">SAMPLE_ID_{plant.id?.split('-')[0] || 'N/A'}</span>
           <span className="text-[9px] font-bold uppercase">{new Date(plant.created_at).toLocaleDateString()}</span>
        </div>

      </div>
    </div>
  );
};

export default PlantDetailCard;
