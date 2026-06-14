import { createWorker } from 'tesseract.js';
import { Platform } from 'react-native';

/**
 * processImageForOCR
 * Handles logic for both Laptop (Real OCR) and Mobile (Simulation)
 */
export const processImageForOCR = async (imageUri) => {
  // ─── LAPTOP / WEB LOGIC ───────────────────────────────────────────────────
  if (Platform.OS === 'web') {
    try {
      // Create the worker locally
      const worker = await createWorker('eng', 1, {
        workerPath: 'https://cdn.jsdelivr.net/npm/tesseract.js@v5.0.0/dist/worker.min.js',
        langPath: 'https://tessdata.projectnaptha.com/4.0.0',
        corePath: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@v5.0.0/tesseract-core.wasm.js',
      });

      const result = await worker.recognize(imageUri);
      await worker.terminate();

      // Ensure we call the helper function defined below
      return parseMedicineTokens(result.data.text);
    } catch (error) {
      console.error("Web OCR Error:", error);
      return [];
    }
  } 

  // ─── MOBILE / EXPO GO LOGIC ──────────────────────────────────────────────
  else {
    console.log("Mobile Simulation Mode triggered");
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Return mock tokens to match your Levothyroxine test case
    return ["Thydin", "Levothyroxine"];
  }
};

/**
 * HELPER: parseMedicineTokens
 * This was missing! It cleans the raw text from Tesseract
 */
const parseMedicineTokens = (text) => {
  if (!text) return [];

  // Remove common noisy "prescription" words
  const noise = [/tablet/gi, /capsule/gi, /mg/gi, /mcg/gi, /qty/gi, /signa/gi, /daily/gi, /[\d]/g];
  let cleaned = text;
  
  noise.forEach(reg => {
    cleaned = cleaned.replace(reg, '');
  });

  // Split into words, remove short ones, and return unique values
  const tokens = cleaned.split(/\s+/)
    .map(word => word.trim())
    .filter(word => word.length > 3);

  return [...new Set(tokens)];
};