import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

export async function analyzeImageWithGemini(file) {
  try {
    const base64Data = await fileToGenerativePart(file);
    
    // Usamos gemini-2.0-flash o gemini-2.0-flash
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash",
      // Forzamos la salida JSON a nivel de configuración de modelo
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const prompt = `Actúa como un experto en botánica y patología vegetal. Analiza la imagen y genera un reporte técnico detallado.
    
    Debes devolver estrictamente este esquema JSON:
    {
      "nombre_comun": "string",
      "scientific_name": "string",
      "family": "string",
      "estado_salud_score": "number (1-100)", 
      "diagnostico_corto": "string (máx 100 chars)",
      "analisis_forense": {
        "sintomas_detectados": ["lista de strings"],
        "posibles_causas": ["lista de strings"],
        "gravedad": "Baja|Media|Crítica"
      },
      "cuidados_tecnicos": {
        "riego": "frecuencia exacta y método",
        "luz": "exposición necesaria (ej: indirecta brillante)",
        "humedad_ideal": "porcentaje sugerido",
        "temperatura_optima": "rango en °C"
      },
      "growth_roadmap": ["paso 1 para recuperar/mantener", "paso 2...", "paso 3..."]
    }

    Consideraciones:
    - Si no es una planta, devuelve {"error": "No se detectó un espécimen botánico"}.
    - Sé muy específico con los síntomas (ej: "Clorosis intervintervenal" en lugar de "hojas amarillas").`;

    const result = await model.generateContent([prompt, base64Data]);
    return JSON.parse(result.response.text());

  } catch (error) {
    console.error("❌ AI Error:", error);
    return { error: "Error en el análisis técnico." };
  }
}

async function fileToGenerativePart(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve({
        inlineData: {
          data: reader.result.split(',')[1],
          mimeType: file.type
        }
      });
    };
    reader.readAsDataURL(file);
  });
}