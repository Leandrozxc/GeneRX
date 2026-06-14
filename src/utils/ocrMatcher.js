import Fuse from 'fuse.js';

// 1. THIS IS THE CRITICAL EXPORT
export const ConfidenceTier = {
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW',
  NONE: 'NONE'
};

export const getConfidenceLabel = (tier, lang) => {
  const labels = {
    en: { HIGH: 'High Match', MEDIUM: 'Average Match', LOW: 'Low Match', NONE: 'No Match' },
    fil: { HIGH: 'Sakto', MEDIUM: 'Medyo Sakto', LOW: 'Hindi Masyadong Sakto', NONE: 'Walang Tugma' },
    ceb: { HIGH: 'Sakto Gyud', MEDIUM: 'Medyo Sakto', LOW: 'Dili Kaayo Sakto', NONE: 'Walay Tugma' }
  };
  return labels[lang]?.[tier] || labels['en'][tier];
};

export const matchOCRTokens = (tokens, medicineDb) => {
  if (!tokens || tokens.length === 0) return [];

  const options = {
    // UPDATED: Strictly match your new JSON keys
    keys: ['generic_name', 'brand_name', 'aliases'], 
    threshold: 0.35, // Stricter threshold to avoid wrong guesses like Losartan
    includeScore: true
  };

  const fuse = new Fuse(medicineDb, options); 
  let results = [];

  tokens.forEach(token => {
    const searchRes = fuse.search(token); 
    
    searchRes.forEach(res => {
      // Use the generic_name from your new JSON
      const gName = res.item.generic_name;
      
      if (gName && !results.find(r => r.generic_name === gName)) {
        const score = 1 - res.score;
        let tier = ConfidenceTier.LOW;
        if (score >= 0.85) tier = ConfidenceTier.HIGH;
        else if (score >= 0.60) tier = ConfidenceTier.MEDIUM;

        results.push({
          ...res.item, // This spreads all your new fields (strength, form, etc.)
          confidence: score,
          tier: tier
        });
      }
    });
  });

  return results.sort((a, b) => b.confidence - a.confidence).slice(0, 3);
};
