import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

export async function analyzeImageWithGemini(file) {
  try {
    console.log(`🤖 Iniciando análisis con Gemini (Prompt Simplificado)...`);

    const base64Data = await fileToGenerativePart(file);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `Analiza esta planta y devuelve estrictamente un JSON válido (sin markdown ni explicaciones):
    {
      "nombre_comun": "Nombre de la planta",
      "estado_salud": 8, // Escala del 1 al 10
      "diagnostico": "Breve resumen visual del estado (máx 150 caracteres)",
      "riego_recomendado": "Frecuencia y cantidad sugerida"
    }
    
    Si no es una planta o la imagen es clara, devuelve un JSON con el campo "error".`;

    const result = await model.generateContent([prompt, base64Data]);
    const response = await result.response;
    const text = response.text();

    const cleanText = text.replace(/```json|```/g, '').trim();
    return JSON.parse(cleanText);

  } catch (error) {
    console.error("❌ Error en análisis IA:", error);
    return { error: "Fallo en el servidor de IA" };
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
