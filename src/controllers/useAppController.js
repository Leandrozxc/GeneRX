import { useState } from 'react';
import { Platform, Alert } from 'react-native';
import { DrugModel, isRecentlyVerified } from '../models/DrugModel';

export const useAppController = () => {
  const [currentScreen, setCurrentScreen] = useState('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDrug, setSelectedDrug] = useState(null);
  const [reportedPrices, setReportedPrices] = useState([]);
  const [isScanning, setIsScanning] = useState(false);

  const [recentlyVerifiedOnly, setRecentlyVerifiedOnly] = useState(false);

  // Group 3: Prescription Gating & Pharmacist Screen States
  const [rxConfirmed, setRxConfirmed] = useState(false);
  const [pharmacistModeVisible, setPharmacistModeVisible] = useState(false);
  const [pharmacistSelectedAlt, setPharmacistSelectedAlt] = useState(null);

  // Group 4: About Modal Visibility
  const [aboutModalVisible, setAboutModalVisible] = useState(false);

  // ==========================================
  // SHOPEE CHECKOUT STATE: Multi-Item Basket State
  // ==========================================
  const [selectedGenericBrand, setSelectedGenericBrand] = useState(null);
  const [prescriptionBasket, setPrescriptionBasket] = useState([]); // Array of { drugId, brandName, genericName, chosenAlternative, brandedPrice }

  const handleSearch = (text) => {
    const safeText = text || '';
    setSearchQuery(safeText);
    
    const found = DrugModel.findDrugByName(safeText);
    setSelectedDrug(found);
    setRxConfirmed(false); 
    
    // Default select cheapest generic brand for single lookup fallback
    if (found && found.alternatives && found.alternatives.length > 0) {
      const cheapest = found.alternatives.reduce((prev, curr) => prev.price < curr.price ? prev : curr);
      setSelectedGenericBrand(cheapest);
    } else {
      setSelectedGenericBrand(null);
    }
  };

  // Trigger selection when an autocomplete suggestion is tapped
  const handleSelectSuggestion = (drug) => {
    if (!drug) return;
    
    setSearchQuery(drug.brand_name);
    setSelectedDrug(drug);
    setRxConfirmed(false);

    // Auto-select cheapest generic brand as default
    if (drug.alternatives && drug.alternatives.length > 0) {
      const cheapest = drug.alternatives.reduce((prev, curr) => prev.price < curr.price ? prev : curr);
      setSelectedGenericBrand(cheapest);
    } else {
      setSelectedGenericBrand(null);
    }
  };

  const triggerMockOCR = () => {
    setIsScanning(true);
    setSelectedDrug(null);
    setSearchQuery('');
    setRxConfirmed(false);
    
    setTimeout(() => {
      setIsScanning(false);
      setSearchQuery('Norvasc');
      const amlodipine = DrugModel.findDrugByName('Norvasc');
      setSelectedDrug(amlodipine);
      
      if (amlodipine && amlodipine.alternatives.length > 0) {
        const cheapest = amlodipine.alternatives.reduce((prev, curr) => prev.price < curr.price ? prev : curr);
        setSelectedGenericBrand(cheapest);
      }
    }, 1500);
  };

  // ==========================================
  // BASKET UTILITY ACTION HANDLERS (Controllers)
  // ==========================================
  
  const handleAddToBasket = (drug, alternative, silent = false) => {
    if (!drug || !alternative) return;

    setPrescriptionBasket(prev => {
      const filtered = prev.filter(item => item.drugId !== drug.id);
      const newItem = {
        drugId: drug.id,
        brandName: drug.brand_name,
        genericName: drug.generic_name,
        dosage: drug.dosage,
        chosenAlternative: alternative,
        brandedPrice: drug.branded_avg_price
      };
      return [...filtered, newItem];
    });

    if (!silent) {
      const alertMessage = `Naidagdag na si ${alternative.manufacturer} (${drug.generic_name}) sa iyong Alistahan.`;
      if (Platform.OS === 'web') alert(alertMessage);
      else Alert.alert("Naidagdag sa Listahan", alertMessage);
    }
  };

  const handleRemoveFromBasket = (drugId) => {
    setPrescriptionBasket(prev => prev.filter(item => item.drugId !== drugId));
  };

  const getBasketSummary = () => {
    const brandedCost = prescriptionBasket.reduce((sum, item) => sum + item.brandedPrice, 0);
    const genericCost = prescriptionBasket.reduce((sum, item) => sum + item.chosenAlternative.price, 0);
    const savings = brandedCost - genericCost;
    const percentage = brandedCost > 0 ? Math.round((savings / brandedCost) * 100) : 0;

    return { brandedCost, genericCost, savings, percentage };
  };

  const handleReportPrice = (alt) => {
    const report = {
      drug_id: selectedDrug.id,
      brand_name: selectedDrug.brand_name,
      generic_name: selectedDrug.generic_name,
      manufacturer: alt.manufacturer,
      reported_at: new Date().toISOString(),
    };
    setReportedPrices(prev => [...prev, report]);
    
    const message = `Report submitted for ${alt.manufacturer} ${selectedDrug.generic_name}.`;
    if (Platform.OS === 'web') alert(message);
    else Alert.alert("Report Submitted", message);
  };

  const resolvedPharmacies = DrugModel.getAllPharmacies().filter(pharmacy => {
    if (recentlyVerifiedOnly && !isRecentlyVerified(pharmacy.last_verified)) {
      return false;
    }

    if (prescriptionBasket.length > 0) {
      return prescriptionBasket.every(item => {
        const drugStock = pharmacy.stock[item.drugId];
        if (!drugStock || !drugStock.available) return false;
        
        const brands = drugStock.available_brands || [];
        return brands.includes(item.chosenAlternative.manufacturer);
      });
    }

    return true;
  });

  const isNarrowTherapeutic = selectedDrug ? DrugModel.isNarrowTherapeuticIndex(selectedDrug.generic_name) : false;

  const handleOpenPharmacistMode = (alt) => {
    setPharmacistSelectedAlt(alt);
    setPharmacistModeVisible(true);
  };

  const getIsNearestPharmacyVerified = () => {
    if (!selectedDrug) return false;
    const carryingPharmacies = resolvedPharmacies.filter(p => p.stock[selectedDrug.id]?.available);
    if (carryingPharmacies.length === 0) return false;
    return carryingPharmacies[0].verified === true;
  };

  // Autocomplete Suggestions Filter
  const getSearchSuggestions = () => {
    if (!searchQuery || !searchQuery.trim()) return [];
    const normalized = searchQuery.toLowerCase().trim();
    
    return DrugModel.getAllDrugs().filter(drug => 
      drug.brand_name.toLowerCase().includes(normalized) ||
      drug.generic_name.toLowerCase().includes(normalized)
    );
  };

  return {
    currentScreen,
    setCurrentScreen,
    searchQuery,
    selectedDrug,
    setSelectedDrug,
    reportedPrices,
    isScanning,
    handleSearch,
    triggerMockOCR,
    handleReportPrice,
    
    pharmacies: resolvedPharmacies,
    recentlyVerifiedOnly,
    setRecentlyVerifiedOnly,
    allOriginalDrugs: DrugModel.getAllDrugs(),

    isNarrowTherapeutic,
    rxConfirmed,
    setRxConfirmed,
    pharmacistModeVisible,
    setPharmacistModeVisible,
    pharmacistSelectedAlt,
    handleOpenPharmacistMode,

    aboutModalVisible,
    setAboutModalVisible,
    isNearestPharmacyVerified: getIsNearestPharmacyVerified(),

    selectedGenericBrand,
    setSelectedGenericBrand,
    prescriptionBasket,
    handleAddToBasket,
    handleRemoveFromBasket,
    basketSummary: getBasketSummary(),
    
    searchSuggestions: getSearchSuggestions(),
    handleSelectSuggestion
  };
};