import mockData from '../data/data.json';
// Import the new inspired medicine database
import medicineDatabase from '../data/medicine_database.json';

const NTI_DRUGS = [
  'warfarin', 'phenytoin', 'digoxin', 'lithium', 'cyclosporine',
  'theophylline', 'carbamazepine', 'levothyroxine', 'methotrexate', 'tacrolimus'
];

export const isRecentlyVerified = (dateStr) => {
  const today = new Date("2026-06-13"); 
  const verifiedDate = new Date(dateStr);
  const diffTime = Math.abs(today - verifiedDate);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= 7;
};

export const DrugModel = {
  getAllDrugs: () => mockData.drugs,

  getMergedPharmacies: (localOverrides = []) => {
    return mockData.pharmacies.map(pharmacy => {
      const override = localOverrides.find(o => o.id === pharmacy.id);
      if (override) {
        return { ...pharmacy, ...override };
      }
      return pharmacy;
    });
  },
  
  findDrugByName: (query) => {
    if (!query.trim()) return null;
    return mockData.drugs.find(
      d => d.brand_name.toLowerCase().includes(query.toLowerCase()) || 
           d.generic_name.toLowerCase().includes(query.toLowerCase())
    );
  },

  isNarrowTherapeuticIndex: (genericName) => {
    if (!genericName) return false;
    return NTI_DRUGS.includes(genericName.toLowerCase().trim());
  },

  getDescription: (drug, langCode) => {
    if (langCode === 'ceb') return drug.useDescription_ceb;
    if (langCode === 'en') return drug.useDescription_en;
    return drug.useDescription_fil;
  },

  // ==========================================
  // PHASE 1: Medicine Database Methods
  // ==========================================
  
  // Load raw medicine database
  getMedicineDatabase: () => medicineDatabase,

  // Basic substring matching on name, generic, and aliases (Phase 1 Baseline)
  searchMedicineDatabase: (query) => {
    if (!query || !query.trim()) return [];
    const normalizedQuery = query.toLowerCase().trim();

    return medicineDatabase.filter(med => {
      const brandMatch = med.brand_name.toLowerCase().includes(normalizedQuery);
      const genericMatch = med.generic_name.toLowerCase().includes(normalizedQuery);
      const aliasMatch = med.aliases.some(alias => alias.toLowerCase().includes(normalizedQuery));
      
      return brandMatch || genericMatch || aliasMatch;
    });
  }
};