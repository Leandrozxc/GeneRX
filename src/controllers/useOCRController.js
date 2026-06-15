import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { matchOCRTokens } from '../utils/ocrMatcher';
import { processImageForOCR } from '../utils/ocrEngine';

export const OCRState = {
  IDLE: 'IDLE',
  SCANNING: 'SCANNING',
  PROCESSING: 'PROCESSING',
  CONFIRMING: 'CONFIRMING',
  MANUAL: 'MANUAL',
  ERROR: 'ERROR'
};

export const useOCRController = ({ medicineDatabase, language, onConfirmed }) => {
  const [ocrState, setOcrState] = useState(OCRState.IDLE);
  const [progress, setProgress] = useState(0);
  const [matchResult, setMatchResult] = useState({ candidates: [] });
  const [error, setError] = useState(null);

  const startScan = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      alert('Sorry, we need camera permissions to make this work!');
      return;
    }

    setOcrState(OCRState.SCANNING);

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: 'images', 
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        handleCapture(result.assets[0].uri);
      } else {
        setOcrState(OCRState.IDLE);
      }
    } catch (err) {
      console.error("Camera Error:", err);
      setError("Failed to open camera");
      setOcrState(OCRState.ERROR);
    }
  };

  const handleCapture = async (uri) => {
    setOcrState(OCRState.PROCESSING);
    setProgress(0.1);

    try {
      const interval = setInterval(() => {
        setProgress(prev => (prev < 0.9 ? prev + 0.1 : prev));
      }, 500);

      const tokens = await processImageForOCR(uri);
      const matches = matchOCRTokens(tokens, medicineDatabase);

      clearInterval(interval);
      setProgress(1);

      if (matches && matches.length > 0) {
        setMatchResult({ candidates: matches });
        setOcrState(OCRState.CONFIRMING);
      } else {
        setOcrState(OCRState.MANUAL);
      }
    } catch (err) {
      console.error("OCR Error:", err);
      setError(err.message);
      setOcrState(OCRState.ERROR);
    }
  };

  const confirmCandidate = (candidate) => {
    setOcrState(OCRState.IDLE);
    onConfirmed(candidate.genericName); 
  };

  // ADDED: Dispatch confirmed candidate array to the search view
  const confirmBatch = (approvedList) => {
    setOcrState(OCRState.IDLE);
    onConfirmed(approvedList); 
  };

  const dismissConfirmation = () => setOcrState(OCRState.MANUAL);
  const rescan = () => startScan(); 
  const reset = () => {
    setOcrState(OCRState.IDLE);
    setMatchResult({ candidates: [] });
    setProgress(0);
    setError(null);
  };

  return { 
    ocrState, 
    progress, 
    matchResult, 
    error, 
    startScan, 
    handleCapture, 
    confirmCandidate, 
    confirmBatch, // Exported
    dismissConfirmation, 
    rescan, 
    reset 
  };
};