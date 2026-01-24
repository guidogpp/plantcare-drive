import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

export async function analyzePlant(file) {
  try {
    console.log(`🤖 Iniciando análisis con Gemini 2.0 Flash...`);

    const base64Data = await fileToGenerativePart(file);

    // USAMOS EL MODELO CONFIRMADO (2.0 Flash)
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `Actúa como un asistente botánico experto pero con lenguaje muy sencillo, visual y directo. Escribe en español.
    
    REGLAS DE ORO:
    1. Prohibido tecnicismos (no digas "clorosis", di "hojas amarillas").
    2. Usa Emojis en todas las descripciones.
    3. Párrafos de máximo 2 líneas. Frases directas.
    4. 'estado_hojas' debe ser un resumen ejecutivo (máx 150 caracteres).
    5. 'plan_crecimiento': una sola acción clara por etapa.
    6. 'detalles_tecnicos_cuidado': solo valores directos, sin explicaciones.

    Tu respuesta debe ser estrictamente un objeto JSON válido (sin markdown) con esta estructura:
    {
      "nombre_comun": "Nombre común",
      "nombre_cientifico": "Nombre científico",
      "estado_salud": "Saludable" | "Enferma" | "Necesita Agua" | "Alerta de Plaga",
      "analisis_forense": {
        "estado_hojas": "🍂 Ejemplo: Hojas bajas amarillas por falta de agua.",
        "estructura_tallo": "🌵 Ejemplo: Tallo firme y sano.",
        "problemas_detectados": ["Problema 1", "Problema 2"]
      },
      "detalles_tecnicos_cuidado": {
        "luz_lux": "☀️ Mucha luz directa (6h+)",
        "ph_suelo": "🧪 Neutro (6.0 - 7.0)",
        "humedad_ideal": "💧 50% - 60%"
      },
      "plan_crecimiento": [
        {"etapa": "Próximas 2 semanas", "instruccion": "Mover a un lugar con más sol"},
        {"etapa": "Mes 3", "instruccion": "Cambiar a una maceta más grande"},
        {"etapa": "Mes 6", "instruccion": "Podar las ramas secas"}
      ]
    }

    Si no es una planta, devuelve: {"error": "No se detectó ninguna planta"}`;

    const result = await model.generateContent([prompt, base64Data]);
    const response = await result.response;
    const text = response.text();

    // Limpieza robusta del JSON
    const cleanText = text.replace(/```json|```/g, '').trim();
    
    return JSON.parse(cleanText);

  } catch (error) {
    console.error("❌ Error en análisis IA:", error);
    return {
      nombre_comun: "Análisis fallido",
      nombre_cientifico: "N/A",
      estado_salud: "Desconocido",
      analisis_forense: {
        estado_hojas: "Error de conexión",
        estructura_tallo: "Error de conexión",
        problemas_detectados: ["No se pudo conectar con la IA"]
      },
      detalles_tecnicos_cuidado: {
        luz_lux: "N/A",
        ph_suelo: "N/A",
        humedad_ideal: "N/A"
      },
      plan_crecimiento: []
    };
  }
}

async function fileToGenerativePart(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      if (!result) {
        resolve(null);
        return;
      }
      const base64String = result.split(',')[1];
      const mimeType = file.type === 'image/heic' ? 'image/jpeg' : file.type;
      
      resolve({
        inlineData: {
          data: base64String,
          mimeType: mimeType
        }
      });
    };
    reader.readAsDataURL(file);
  });
}
