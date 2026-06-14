import { createWorker } from 'tesseract.js';
import { Platform } from 'react-native';

export const processImageForOCR = async (imageUri) => {
  // 1. Initialize Worker with local-first configuration
  const worker = await createWorker('eng', 1, {
    logger: m => console.log(m), 
    // This allows it to work in the PWA environment without CDN issues
    workerPath: 'https://cdn.jsdelivr.net/npm/tesseract.js@v5.0.0/dist/worker.min.js',
    langPath: 'https://tessdata.projectnaptha.com/4.0.0',
    corePath: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@v5.0.0/tesseract-core.wasm.js',
  });

  try {
    // 2. Tesseract needs base64 on some mobile builds to avoid URI access errors
    const result = await worker.recognize(imageUri);
    await worker.terminate();
    
    return parseMedicineTokens(result.data.text);
  } catch (error) {
    console.error("OCR Engine Error:", error);
    await worker.terminate();
    return [];
  }
};

const parseMedicineTokens = (text) => {
  // Clean noisy words common in PH prescriptions
  const noise = [/tablet/gi, /capsule/gi, /mg/gi, /mcg/gi, /qty/gi, /signa/gi, /daily/gi, /[\d]/g];
  let cleaned = text;
  noise.forEach(reg => { cleaned = cleaned.replace(reg, ''); });
  
  // Return unique words longer than 3 chars
  return [...new Set(cleaned.split(/\s+/).filter(word => word.length > 3))];
};