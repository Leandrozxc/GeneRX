import { useState } from 'react';
import { Platform, Alert } from 'react-native';
import { DrugModel, isRecentlyVerified } from '../models/DrugModel';

export const useAppController = () => {
  const [currentScreen, setCurrentScreen] = useState('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDrug, setSelectedDrug] = useState(null);
  const [reportedPrices, setReportedPrices] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [refillDaysLeft, setRefillDaysLeft] = useState(4);
  const [logs, setLogs] = useState([
    { name: 'Lola Maria (Grandmother)', drug: 'Amlodipine 5mg', status: 'Taken', time: '8:00 AM' },
    { name: 'Papa (Father)', drug: 'Metformin 500mg', status: 'Missed', time: '12:30 PM' },
  ]);

  const [recentlyVerifiedOnly, setRecentlyVerifiedOnly] = useState(false);
  const [localPharmacyOverrides, setLocalPharmacyOverrides] = useState([]);
  const [partnerModalVisible, setPartnerModalVisible] = useState(false);

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
  
  // Adds or updates a substitute generic brand to the list (Cart)
  const handleAddToBasket = (drug, alternative) => {
    if (!drug || !alternative) return;

    setPrescriptionBasket(prev => {
      // Check if this drug already exists in our list; if so, replace/update it
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

    const alertMessage = `Naidagdag na si ${alternative.manufacturer} (${drug.generic_name}) sa iyong Alistahan.`;
    if (Platform.OS === 'web') alert(alertMessage);
    else Alert.alert("Naidagdag sa Listahan", alertMessage);
  };

  // Removes a drug substitution from the list
  const handleRemoveFromBasket = (drugId) => {
    setPrescriptionBasket(prev => prev.filter(item => item.drugId !== drugId));
  };

  // Calculates cumulative totals for all items in the prescription list
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

  const handleUpdatePharmacyStock = (pharmacyId, drugId, stockStatus) => {
    const currentPharmacies = DrugModel.getMergedPharmacies(localPharmacyOverrides);
    const pharmacy = currentPharmacies.find(p => p.id === pharmacyId);
    if (!pharmacy) return;

    const updatedStock = { ...pharmacy.stock };
    const drugPrice = drugId === '1' ? 2.00 : drugId === '2' ? 2.20 : drugId === '3' ? 4.00 : 9.50;

    updatedStock[drugId] = {
      available: stockStatus === 'in_stock' || stockStatus === 'low_stock',
      price: drugPrice,
      status: stockStatus,
      available_brands: pharmacy.stock[drugId]?.available_brands || []
    };

    const newOverride = {
      id: pharmacyId,
      last_verified: "2026-06-13",
      availability_status: "confirmed",
      stock: updatedStock
    };

    setLocalPharmacyOverrides(prev => {
      const filtered = prev.filter(p => p.id !== pharmacyId);
      return [...filtered, newOverride];
    });

    setPartnerModalVisible(false);
    const message = "Pharmacy stock successfully updated.";
    if (Platform.OS === 'web') alert(message);
    else Alert.alert("Registry Updated", message);
  };

  const getIsNearestPharmacyVerified = () => {
    if (!selectedDrug) return false;
    const carryingPharmacies = resolvedPharmacies.filter(p => p.stock[selectedDrug.id]?.available);
    if (carryingPharmacies.length === 0) return false;
    return carryingPharmacies[0].verified === true;
  };

  // ==========================================
  // MULTI-ITEM PHARMACY INTERSECTION FILTER
  // ==========================================
  const resolvedPharmacies = DrugModel.getMergedPharmacies(localPharmacyOverrides).filter(pharmacy => {
    if (recentlyVerifiedOnly && !isRecentlyVerified(pharmacy.last_verified)) {
      return false;
    }

    // MULTI-ITEM CHECK: A pharmacy is ONLY returned if it has stock of 
    // EVERY single specific generic brand checked in your active prescription basket list.
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

  return {
    currentScreen,
    setCurrentScreen,
    searchQuery,
    selectedDrug,
    setSelectedDrug,
    reportedPrices,
    isScanning,
    refillDaysLeft,
    logs,
    handleSearch,
    triggerMockOCR,
    handleReportPrice,
    
    pharmacies: resolvedPharmacies,
    recentlyVerifiedOnly,
    setRecentlyVerifiedOnly,
    partnerModalVisible,
    setPartnerModalVisible,
    handleUpdatePharmacyStock,
    allOriginalDrugs: DrugModel.getAllDrugs(),
    allOriginalPharmacies: DrugModel.getMergedPharmacies(localPharmacyOverrides),

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

    // Shopee-style exports
    selectedGenericBrand,
    setSelectedGenericBrand,
    prescriptionBasket,
    handleAddToBasket,
    handleRemoveFromBasket,
    basketSummary: getBasketSummary()
  };
};