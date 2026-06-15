import Fuse from 'fuse.js';

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

// Regex to capture all standard dosage configurations (mg, mcg, g, ml, tab, caps)
const DOSAGE_REGEX = /(\d+(?:\.\d+)?\s*(?:mg|mcg|g|ml|mcg\/tab|mg\/ml|tab|capsule|\d+\/\d+))/i;

export const matchOCRTokens = (lines, medicineDb) => {
  if (!lines || lines.length === 0) return [];

  const options = {
    keys: ['generic_name', 'brand_name', 'aliases'], 
    threshold: 0.55, // FIXED: Upgraded threshold to support high-noise tabular grid prescriptions
    includeScore: true
  };

  const fuse = new Fuse(medicineDb, options); 
  let matchedGroups = [];

  // Deduplicate raw lines
  const uniqueLines = [...new Set(lines)];

  uniqueLines.forEach(line => {
    const cleanLine = line.trim();
    if (!cleanLine) return;

    // 1. DOSAGE EXTRACTION
    const dosageMatch = cleanLine.match(DOSAGE_REGEX);
    const detectedDosage = dosageMatch ? dosageMatch[1].trim() : null;

    let searchStr = cleanLine;
    if (dosageMatch) {
      searchStr = cleanLine.replace(DOSAGE_REGEX, '').trim();
    }

    // Clean out vertical dividers '|' and parentheses
    searchStr = searchStr.replace(/[|()]/g, '').trim();

    if (!searchStr) return;

    // 2. FUZZY MATCH
    const searchRes = fuse.search(searchStr);
    if (searchRes.length === 0) return;

    // 3. BRAND vs GENERIC RESOLVER
    const candidates = searchRes.map(res => {
      const score = 1 - res.score;
      let tier = ConfidenceTier.LOW;
      if (score >= 0.80) tier = ConfidenceTier.HIGH;
      else if (score >= 0.55) tier = ConfidenceTier.MEDIUM;

      const isBrandMatch = res.item.brand_name.toLowerCase().includes(searchStr.toLowerCase()) || 
                           res.item.aliases.some(alias => alias.toLowerCase() === searchStr.toLowerCase());

      return {
        ...res.item,
        confidence: score,
        tier: tier,
        detected_dosage: detectedDosage || res.item.strength, 
        match_type: isBrandMatch ? 'brand' : 'generic' 
      };
    }).sort((a, b) => b.confidence - a.confidence);

    if (candidates.length > 0) {
      const bestMatch = candidates[0];

      // 4. ENTITY DE-DUPLICATION
      const existingGroupIndex = matchedGroups.findIndex(g => g.bestMatch.id === bestMatch.id);

      if (existingGroupIndex > -1) {
        const existingGroup = matchedGroups[existingGroupIndex];
        if (bestMatch.confidence > existingGroup.bestMatch.confidence) {
          matchedGroups[existingGroupIndex].bestMatch = bestMatch;
        }
        if (detectedDosage && !existingGroup.bestMatch.detected_dosage) {
          matchedGroups[existingGroupIndex].bestMatch.detected_dosage = detectedDosage;
        }
      } else {
        matchedGroups.push({
          token: searchStr,
          bestMatch: bestMatch,
          alternatives: candidates
        });
      }
    }
  });

  return matchedGroups.slice(0, 6);
};