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
      const worker = await createWorker('eng', 1, {
        workerPath: 'https://cdn.jsdelivr.net/npm/tesseract.js@v5.0.0/dist/worker.min.js',
        langPath: 'https://tessdata.projectnaptha.com/4.0.0',
        corePath: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@v5.0.0/tesseract-core.wasm.js',
      });

      const result = await worker.recognize(imageUri);
      await worker.terminate();

      // FIXED: Return raw line arrays to preserve physical layout structures
      return parseMedicineLines(result.data.text);
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
    
    // FIXED: Return simulated raw lines containing brand, generic, and strength to test our parser!
    return [
      "Levothyroxine 100mcg",
      "(Thydin)"
    ];
  }
};

/**
 * HELPER: parseMedicineLines
 * Splits extracted text by newlines to group layout structures into individual entities
 */
const parseMedicineLines = (text) => {
  if (!text) return [];
  return text.split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 2); // Ignore empty or single-character noise lines
};