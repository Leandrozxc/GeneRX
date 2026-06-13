export const simplifyText = (text, langCode) => {
  if (!text) return '';
  
  // Custom language map helpers
  if (langCode === 'en') {
    return text
      .replace(/Amlodipine/gi, 'Generic Amlodipine')
      .replace(/Metformin/gi, 'Generic Metformin')
      .replace(/Losartan/gi, 'Generic Losartan')
      .replace(/Warfarin/gi, 'Generic Warfarin');
  }
  
  // Filipino and Cebuano translations share maps for key drug indicators
  return text
    .replace(/Amlodipine/gi, 'Amlodipine (katumbas)')
    .replace(/Metformin/gi, 'Metformin (katumbas)')
    .replace(/Losartan/gi, 'Losartan (katumbas)')
    .replace(/Warfarin/gi, 'Warfarin (katumbas)');
};