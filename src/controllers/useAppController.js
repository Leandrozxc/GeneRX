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

  const handleSearch = (text) => {
  const safeText = text || ''; // If text is null/undefined, use empty string
  setSearchQuery(safeText);
  
  const found = DrugModel.findDrugByName(safeText);
  setSelectedDrug(found);
  setRxConfirmed(false); 
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
    }, 1500);
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
      status: stockStatus
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

  const resolvedPharmacies = DrugModel.getMergedPharmacies(localPharmacyOverrides).filter(pharmacy => {
    if (recentlyVerifiedOnly) return isRecentlyVerified(pharmacy.last_verified);
    return true;
  });

  const isNarrowTherapeutic = selectedDrug ? DrugModel.isNarrowTherapeuticIndex(selectedDrug.generic_name) : false;

  const handleOpenPharmacistMode = (alt) => {
    setPharmacistSelectedAlt(alt);
    setPharmacistModeVisible(true);
  };

  // Group 4 Task 4: Determine if nearest pharmacy carrying this drug is a verified partner
  const getIsNearestPharmacyVerified = () => {
    if (!selectedDrug) return false;
    const carryingPharmacies = resolvedPharmacies.filter(p => p.stock[selectedDrug.id]?.available);
    if (carryingPharmacies.length === 0) return false;
    return carryingPharmacies[0].verified === true;
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

    // Group 4 Exports
    aboutModalVisible,
    setAboutModalVisible,
    isNearestPharmacyVerified: getIsNearestPharmacyVerified()
  };
};