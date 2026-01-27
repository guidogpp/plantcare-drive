import React from "react";
import { Droplets, Sun, Thermometer, Cloud, Check, AlertCircle } from "lucide-react";

export default function PlantDetailView({ plant }) {
  if (!plant) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] text-slate-400 text-lg font-semibold">
        Cargando datos botánicos...
      </div>
    );
  }

  // Health color
  const score = plant?.health_score ?? 0;
  let healthColor = "text-emerald-500 border-emerald-500";
  if (score < 35) healthColor = "text-red-500 border-red-500";
  else if (score < 75) healthColor = "text-amber-500 border-amber-500";

  // Technical care
  const care = plant?.technical_care || {};

  // Forensic
  const forense = plant?.forensic_analysis || {};
  const sintomas = forense.sintomas_detectados || [];
  const causas = forense.posibles_causas || [];

  // Roadmap
  const roadmap = plant?.growth_roadmap || [];

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-3xl shadow-sm gap-8 flex flex-col">
      {/* Encabezado */}
      <div className="text-center mb-2">
        <h1 className="text-4xl font-black mb-1">{plant?.name}</h1>
        {plant?.scientific_name && <div className="italic text-lg text-slate-500 mb-1">{plant.scientific_name}</div>}
        {plant?.family && <span className="inline-block bg-slate-100 text-slate-600 px-4 py-1 rounded-full text-xs font-bold">{plant.family}</span>}
      </div>

      {/* Health Score */}
      <div className="flex justify-center mb-2">
        <div className={`w-28 h-28 rounded-full border-t-4 ${healthColor} flex items-center justify-center bg-slate-50 shadow-sm`}>
          <span className={`text-3xl font-black ${healthColor}`}>{score}</span>
        </div>
      </div>

      {/* Grid de Cuidados */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-2">
        <div className="bg-white rounded-3xl shadow-sm p-4 flex flex-col items-center">
          <Droplets className="w-7 h-7 mb-2 text-emerald-500" />
          <div className="font-bold text-slate-700">Riego</div>
          <div className="text-sm text-slate-500">{care?.riego ?? '--'}</div>
        </div>
        <div className="bg-white rounded-3xl shadow-sm p-4 flex flex-col items-center">
          <Sun className="w-7 h-7 mb-2 text-yellow-500" />
          <div className="font-bold text-slate-700">Luz</div>
          <div className="text-sm text-slate-500">{care?.luz ?? '--'}</div>
        </div>
        <div className="bg-white rounded-3xl shadow-sm p-4 flex flex-col items-center">
          <Cloud className="w-7 h-7 mb-2 text-sky-500" />
          <div className="font-bold text-slate-700">Humedad</div>
          <div className="text-sm text-slate-500">{care?.humedad_ideal ?? '--'}</div>
        </div>
        <div className="bg-white rounded-3xl shadow-sm p-4 flex flex-col items-center">
          <Thermometer className="w-7 h-7 mb-2 text-red-400" />
          <div className="font-bold text-slate-700">Temperatura</div>
          <div className="text-sm text-slate-500">{care?.temperatura_optima ?? '--'}</div>
        </div>
      </div>

      {/* Panel Forense */}
      <div className="bg-slate-50 rounded-3xl shadow-sm p-6 mb-2">
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
          Análisis Forense
        </h2>
        <div className="mb-2">
          <div className="font-bold text-slate-700 mb-1">Síntomas detectados:</div>
          {sintomas.length === 0 ? (
            <div className="text-slate-400 italic">Sin síntomas detectados</div>
          ) : (
            <ul className="space-y-2">
              {sintomas.map((s, i) => (
                <li key={i} className="flex items-center gap-2">
                  {forense.gravedad === 'alta' ? (
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  ) : (
                    <Check className="w-4 h-4 text-emerald-500" />
                  )}
                  {s}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <div className="font-bold text-slate-700 mb-1">Posibles causas:</div>
          {causas.length === 0 ? (
            <div className="text-slate-400 italic">No se detectaron causas</div>
          ) : (
            <ul className="list-disc ml-6 text-slate-700">
              {causas.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Timeline de Recuperación */}
      <div className="bg-white rounded-3xl shadow-sm p-6">
        <h2 className="text-lg font-bold mb-4">Hoja de Ruta</h2>
        {Array.isArray(roadmap) && roadmap.length > 0 ? (
          <ol className="relative border-l-2 border-emerald-200 ml-4">
            {roadmap.map((step, i) => (
              <li key={i} className="mb-6 ml-4">
                <div className="absolute -left-3 w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center border-2 border-emerald-300">
                  <span className="text-emerald-700 font-bold">{i + 1}</span>
                </div>
                <div className="pl-8 text-slate-700 font-medium">{step}</div>
              </li>
            ))}
          </ol>
        ) : (
          <div className="text-slate-400 italic">No hay hoja de ruta disponible</div>
        )}
      </div>
    </div>
  );
}
