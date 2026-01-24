import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

export async function analyzePlant(file) {
  try {
    console.log(`🤖 Iniciando análisis con Gemini 2.0 Flash...`);

    const base64Data = await fileToGenerativePart(file);

    // USAMOS EL MODELO CONFIRMADO (2.0 Flash)
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `Eres un botánico experto. Analiza esta imagen.
    
    Devuelve SOLAMENTE un objeto JSON válido (sin markdown) con esta estructura:
    {
      "species": "Nombre común (Nombre científico)",
      "health_status": "Healthy" | "Sick" | "Needs Water" | "Pest Warning",
      "diagnosis": "Diagnóstico breve y consejo en español.",
      "water_frequency": 7
    }
    
    Si no es una planta, devuelve: {"error": "No plant detected"}`;

    const result = await model.generateContent([prompt, base64Data]);
    const response = await result.response;
    const text = response.text();

    // Limpieza robusta del JSON
    const cleanText = text.replace(/```json|```/g, '').trim();
    
    return JSON.parse(cleanText);

  } catch (error) {
    console.error("❌ Error en análisis IA:", error);
    return {
      species: "Análisis fallido",
      health_status: "Unknown",
      diagnosis: "No se pudo conectar con la IA. Inténtalo de nuevo.",
      water_frequency: 7
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
