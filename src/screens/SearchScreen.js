import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, Platform, Modal, SafeAreaView, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../context/LanguageContext';
import { DrugModel } from '../models/DrugModel';

// ── OCR imports ───────────────────────────────────────────────────────────────
import { useOCRController } from '../controllers/useOCRController';
import OCRScanModal from '../components/OCRScanModal';
import medicineDatabase from '../data/medicine_database.json';

export default function SearchScreen({ 
  searchQuery, 
  onSearch, 
  isScanning, 
  triggerMockOCR,   
  selectedDrug, 
  handleReportPrice, 
  onNavigateToMap,
  isNarrowTherapeutic,
  rxConfirmed,
  setRxConfirmed,
  pharmacistModeVisible,
  setPharmacistModeVisible,
  pharmacistSelectedAlt,
  handleOpenPharmacistMode,
  isNearestPharmacyVerified,
  
  // Shopee-style Props
  selectedGenericBrand,
  setSelectedGenericBrand,
  savingsSummary,
  handleAddToBasket,

  // Autocomplete Props
  searchSuggestions,
  onSelectSuggestion
}) {
  
  const { t, currentLanguage } = useLanguage();
  const [expandedRow, setExpandedRow] = useState(null);

  // Toggles between Simplified View & Detailed Product View for manual search
  const [showDetailedView, setShowDetailedView] = useState(false);

  // ── Step 4 OCR Sequence States ───────────────────────────────────────────────
  const [ocrModalVisible, setOCRModalVisible] = useState(false);
  const [ocrDetailsModalVisible, setOcrDetailsModalVisible] = useState(false);
  
  // Multi-item scanning states (Step 4 Upgrade)
  const [ocrSelectedDrugs, setOcrSelectedDrugs] = useState([]); // Array of drug objects
  const [ocrSelectedBrands, setOcrSelectedBrands] = useState({}); // Mapping of { [drugId]: alternativeObject }

  // FIXED: Declared the calculator function at the top of the component scope to avoid initialization errors
  const calculateOcrSavings = () => {
    let brandedCost = 0;
    let genericCost = 0;
    ocrSelectedDrugs.forEach(drug => {
      brandedCost += drug.branded_avg_price;
      const chosen = ocrSelectedBrands[drug.id];
      if (chosen) {
        genericCost += chosen.price;
      }
    });
    const savings = brandedCost - genericCost;
    const percentage = brandedCost > 0 ? Math.round((savings / brandedCost) * 100) : 0;
    return { brandedCost, genericCost, savings, percentage };
  };

  const getSavingsLabel = () => {
    if (currentLanguage === 'cebuano') return 'Tipid';
    if (currentLanguage === 'english') return 'Save';
    return 'Tipid';
  };

  const handleSelectOcrBrand = (drugId, alt) => {
    setOcrSelectedBrands(prev => ({
      ...prev,
      [drugId]: alt
    }));
  };

  // FIXED: Re-declared the missing batch add dispatcher clearly inside the component scope
  const handleAddAllOcrToBasket = () => {
    ocrSelectedDrugs.forEach(drug => {
      const chosen = ocrSelectedBrands[drug.id];
      if (chosen) {
        // Pass "true" to run silent updates with no individual popup alerts
        handleAddToBasket(drug, chosen, true);
      }
    });

    // Formulate a unified trilingual batch notification
    const count = ocrSelectedDrugs.length;
    let alertMessage = "";
    if (currentLanguage === 'cebuano') {
      alertMessage = count === 1 
        ? "Naapil na ang tambal sa imong Listahan." 
        : `Naapil na ang ${count} ka tambal sa imong Listahan.`;
    } else if (currentLanguage === 'english') {
      alertMessage = count === 1 
        ? "Medicine successfully added to your List." 
        : `${count} medicines successfully added to your List.`;
    } else {
      alertMessage = count === 1 
        ? "Naidagdag na ang gamot sa iyong Alistahan." 
        : `Naidagdag na ang ${count} na gamot sa iyong Alistahan.`;
    }

    if (Platform.OS === 'web') alert(alertMessage);
    else Alert.alert("Naidagdag sa Listahan", alertMessage);

    setOcrDetailsModalVisible(false);
    setOcrSelectedDrugs([]);
    onSearch('');
  };

  // Safe destructuring of summary costs
  const summary = savingsSummary || { brandedCost: 0, genericCost: 0, savings: 0, percentage: 0 };
  const ocrSummary = calculateOcrSavings();

  const ocrController = useOCRController({
    medicineDatabase,
    language: currentLanguage,
    onConfirmed: (approvedCandidates) => {
      console.log("[GeneRX OCR] onConfirmed triggered with approved batch:", approvedCandidates);
      
      if (!approvedCandidates || approvedCandidates.length === 0) {
        setOCRModalVisible(false);
        return;
      }

      const resolvedDrugs = approvedCandidates.map(cand => {
        const name = cand.generic_name || cand.brand_name || '';
        let found = DrugModel.findDrugByName(name);
        
        if (!found && name) {
          const matchedLocal = medicineDatabase.find(med => 
            med.generic_name.toLowerCase().trim() === name.toLowerCase().trim() ||
            med.brand_name.toLowerCase().trim() === name.toLowerCase().trim()
          );
          if (matchedLocal) {
            found = {
              id: matchedLocal.id,
              brand_name: matchedLocal.brand_name,
              generic_name: matchedLocal.generic_name,
              dosage: matchedLocal.strength || "100mcg",
              rx_required: true,
              fda_registration: matchedLocal.fda_id || "DR-NTI555",
              mdrp_price: 12.00,
              branded_avg_price: 12.00,
              generic_avg_price: 4.50,
              savings_percentage: 62,
              mdrpSource: "June 12, 2026",
              useDescription_fil: "Gamot para sa thyroid gland upang mapanatili ang tamang antas ng hormone.",
              useDescription_en: "Medicine for thyroid hormone replacement therapy.",
              useDescription_ceb: "Tambal alang sa taas nga hormone sa thyroid gland.",
              alternatives: [
                { "manufacturer": "RiteMed", "price": 4.50, "fda_id": "DRP-501", "last_updated": "2026-06-11", "source_type": "mdrp" },
                { "manufacturer": "Generika", "price": 4.20, "fda_id": "DRP-502", "last_updated": "2026-06-13", "source_type": "pharmacy" }
              ]
            };
          }
        }
        return found;
      }).filter(Boolean); 

      setOCRModalVisible(false);

      if (resolvedDrugs.length > 0) {
        setTimeout(() => {
          setOcrSelectedDrugs(resolvedDrugs);
          
          const initialSelections = {};
          resolvedDrugs.forEach(drug => {
            if (drug.alternatives && drug.alternatives.length > 0) {
              const cheapest = drug.alternatives.reduce((prev, curr) => prev.price < curr.price ? prev : curr);
              initialSelections[drug.id] = cheapest;
            }
          });
          setOcrSelectedBrands(initialSelections);
          setOcrDetailsModalVisible(true);
        }, 350);
      } else {
        // Fallback
        onSearch(approvedCandidates[0]?.generic_name || '');
      }
    },
  });

  const handleScanPress = () => {
    setOCRModalVisible(true); 
    ocrController.startScan(); 
  };

  const toggleRowExpander = (index) => {
    setExpandedRow(expandedRow === index ? null : index);
  };

  const renderConfidenceBadge = (sourceType) => {
    switch (sourceType) {
      case 'mdrp':
        return (
          <View style={[styles.confidenceBadge, { backgroundColor: '#D1FAE5' }]}>
            <Text style={[styles.confidenceText, { color: '#065F46' }]}>{t.labelSource}</Text>
          </View>
        );
      case 'pharmacy':
      default:
        return (
          <View style={[styles.confidenceBadge, { backgroundColor: '#FEF3C7' }]}>
            <Text style={[styles.confidenceText, { color: '#92400E' }]}>{t.labelVerified}</Text>
          </View>
        );
    }
  };

  const suggestionsList = searchSuggestions || [];
  const handleSelect = onSelectSuggestion || (() => {});

  return (
    <View style={styles.screenWrapper}>
      <Text style={styles.sectionTitle}>{t.searchTitle}</Text>
      <Text style={styles.sectionSubtitle}>{t.searchPlaceholder}</Text>
      
      {/* Search Input Bar */}
      <View style={styles.searchContainerContainer}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={t.searchPlaceholder}
            value={searchQuery || ''} 
            onChangeText={onSearch}
          />
          <TouchableOpacity style={styles.ocrButton} onPress={handleScanPress}>
            <Ionicons name="camera" size={16} color="#fff" />
            <Text style={styles.ocrText}>{t.scanButton}</Text>
          </TouchableOpacity>
        </View>

        {/* Floating Google-style autocomplete suggestions dropdown */}
        {searchQuery && !selectedDrug && suggestionsList.length > 0 && (
          <View style={styles.suggestionsContainer}>
            {suggestionsList.map((drug) => (
              <TouchableOpacity
                key={drug.id}
                style={styles.suggestionRow}
                onPress={() => handleSelect(drug)}
              >
                <Ionicons name="search-outline" size={14} color="#6B7280" style={{ marginRight: 10 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.suggestionBrandText}>{drug.brand_name}</Text>
                  <Text style={styles.suggestionGenericText}>{drug.generic_name} ({drug.dosage})</Text>
                </View>
                <Ionicons name="arrow-up-sharp" size={14} color="#D1D5DB" style={{ transform: [{ rotate: '-45deg' }] }} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* OCR Scan Modal */}
      <OCRScanModal
        visible={ocrModalVisible}
        ocrController={ocrController}
        language={currentLanguage}
        onClose={() => {
          setOCRModalVisible(false);
          ocrController.reset();
        }}
      />

      {isScanning && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#0D9488" />
          <Text style={styles.loadingText}>Analyzing...</Text>
        </View>
      )}

      {/* Selected Drug Results */}
      {selectedDrug && !isScanning && (
        <View>
          
          {isNarrowTherapeutic && (
            <View style={styles.ntiWarningBanner}>
              <Ionicons name="warning" size={18} color="#ffffff" style={{ marginRight: 8 }} />
              <Text style={styles.ntiWarningText}>{t.ntiWarning}</Text>
            </View>
          )}

          {/* MANUAL RENDER BRANCH (SIMPLIFIED VS DETAILED) */}
          {!showDetailedView ? (
            /* 1. SIMPLIFIED LOOKUP CARD */
            <TouchableOpacity 
              style={styles.resultCard}
              onPress={() => setShowDetailedView(true)}
            >
              <View style={styles.resultHeader}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={styles.brandTitle}>{selectedDrug.brand_name}</Text>
                  <Text style={styles.genericSubtitle}>{t.labelGeneric}: {selectedDrug.generic_name} ({selectedDrug.dosage})</Text>
                </View>
                <View style={[styles.rxBadge, { backgroundColor: selectedDrug.rx_required ? '#FEE2E2' : '#D1FAE5' }]}>
                  <Text style={[styles.rxText, { color: selectedDrug.rx_required ? '#EF4444' : '#10B981' }]}>
                    {selectedDrug.rx_required ? t.labelNeedsRx : t.labelNoRx}
                  </Text>
                </View>
              </View>

              <TouchableOpacity 
                style={styles.primaryActionButton}
                onPress={() => setShowDetailedView(true)}
              >
                <Ionicons name="information-circle-outline" size={18} color="#fff" />
                <Text style={styles.primaryActionText}>{t.learnMore}</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ) : (
            /* 2. DETAILED CARD: Shows explanations, Shopee checkbox choices & dynamic savings */
            <View style={styles.resultCard}>
              <View style={styles.resultHeader}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={styles.brandTitle}>{selectedDrug.brand_name}</Text>
                  <Text style={styles.genericSubtitle}>{t.labelGeneric}: {selectedDrug.generic_name} ({selectedDrug.dosage})</Text>
                </View>
                <TouchableOpacity onPress={() => {
                  setShowDetailedView(false);
                  onSearch(''); // Reset state back to clean search bar
                }}>
                  <Ionicons name="close-circle-outline" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <View style={styles.descriptionBox}>
                <Text style={styles.descriptionLabel}>{t.labelWhatFor}</Text>
                <Text style={styles.descriptionText}>
                  {DrugModel.getDescription(selectedDrug, currentLanguage)}
                </Text>
              </View>

              <View style={styles.fdaBox}>
                <Ionicons name="shield-checkmark" size={14} color="#0D9488" />
                <Text style={styles.fdaText}>FDA: {selectedDrug.fda_registration}</Text>
              </View>

              <View style={styles.mdrpBox}>
                <Text style={styles.mdrpLabel}>{t.labelMaxPrice}</Text>
                <Text style={styles.mdrpValue}>₱{selectedDrug.mdrp_price.toFixed(2)} / {t.labelPerTablet}</Text>
              </View>

              {/* Shopee-style checkboxes list */}
              <Text style={styles.tableTitle}>{t.moreDetails}</Text>
              {selectedDrug.alternatives.map((alt, index) => {
                const isChecked = selectedGenericBrand && selectedGenericBrand.manufacturer === alt.manufacturer;
                
                return (
                  <View key={index} style={styles.altBlock}>
                    <TouchableOpacity 
                      style={styles.altRowGroup1}
                      onPress={() => setSelectedGenericBrand(alt)}
                    >
                      <View style={[styles.shopeeCheckbox, isChecked && styles.shopeeCheckboxActive]}>
                        {isChecked && <Ionicons name="checkmark" size={12} color="#ffffff" />}
                      </View>

                      <View style={{ flex: 1, paddingRight: 10 }}>
                        <View style={styles.altRowHeader}>
                          <Text style={styles.altManufacturer}>{alt.manufacturer}</Text>
                          {renderConfidenceBadge(alt.source_type)}
                        </View>
                        
                        <View style={styles.fdaReferenceWrapper}>
                          <Text style={styles.altFdaText}>
                            FDA Ref: {alt.fda_id}
                          </Text>
                        </View>
                        
                        <View style={styles.timestampContainer}>
                          <Ionicons name="time-outline" size={12} color="#7a7974" style={{ marginRight: 4 }} />
                          <Text style={styles.timestampText}>
                            {t.labelLastUpdated}: {alt.last_updated}
                          </Text>
                        </View>
                      </View>
                      
                      <View style={{ alignItems: 'flex-end', justifyContent: 'center' }}>
                        <Text style={styles.altPrice}>₱{alt.price.toFixed(2)}</Text>
                        <TouchableOpacity 
                          style={styles.infoIconButton}
                          onPress={() => toggleRowExpander(index)}
                        >
                          <Ionicons 
                            name={expandedRow === index ? "information-circle" : "information-circle-outline"} 
                            size={20} 
                            color="#01696f" 
                          />
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>

                    {expandedRow === index && (
                      <View style={styles.expandedPanel}>
                        <View style={styles.expandedPanelItemRow}>
                          <Text style={styles.expandedPanelItemText}>
                            • {t.labelSource}: PFDA Drug Registry
                          </Text>
                        </View>
                        <View style={styles.expandedPanelItemRow}>
                          <Text style={styles.expandedPanelItemText}>
                            • {t.labelMaxPrice}: DOH MDRP Administrative Order 2021-0035
                          </Text>
                        </View>
                        <View style={styles.expandedPanelItemRow}>
                          <Text style={styles.expandedPanelItemText}>
                            • {t.labelLastUpdated}: {selectedDrug.mdrpSource}
                          </Text>
                        </View>
                      </View>
                    )}

                    <View style={styles.altActionButtonsRow}>
                      <TouchableOpacity 
                        style={styles.showPharmacistRowButton}
                        onPress={() => handleOpenPharmacistMode(alt)}
                      >
                        <Text style={styles.showPharmacistRowText}>{t.showPharmacist}</Text>
                      </TouchableOpacity>

                      <TouchableOpacity 
                        style={styles.reportButton} 
                        onPress={() => handleReportPrice(alt)}
                      >
                        <Text style={styles.reportButtonText}>{t.reportPrice}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}

              {/* Add to List (Cart) Button */}
              {selectedGenericBrand && (
                <TouchableOpacity 
                  style={[styles.primaryActionButton, { marginTop: 20 }]}
                  onPress={() => {
                    handleAddToBasket(selectedDrug, selectedGenericBrand);
                    onSearch('');
                    setShowDetailedView(false);
                  }}
                >
                  <Ionicons name="add-circle-outline" size={18} color="#fff" />
                  <Text style={styles.primaryActionText}>
                    {t.addToList} (Tipid: ₱{(selectedDrug.branded_avg_price - selectedGenericBrand.price).toFixed(2)})
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          <View style={styles.softAdvisoryBar}>
            <Ionicons name="chatbox-ellipses-outline" size={14} color="#92400E" style={{ marginRight: 6 }} />
            <Text style={styles.softAdvisoryText}>{t.advisoryBar}</Text>
          </View>

          <Text style={styles.regulatoryFooterText}>{t.footerSource}</Text>
        </View>
      )}

      {!selectedDrug && !isScanning && (
        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={24} color="#0D9488" />
          <Text style={styles.infoBoxText}>
            Try scanning a box or typing **"Coumadin"** (Warfarin - NTI) or **"Norvasc"** to test language profiles.
          </Text>
        </View>
      )}

      {/* ==========================================
          STEP 4: UNCONDITIONAL BATCH SELECTOR MODAL (Shopee Checkout)
          ========================================== */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={ocrDetailsModalVisible}
        onRequestClose={() => setOcrDetailsModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          {ocrSelectedDrugs && ocrSelectedDrugs.length > 0 ? (
            <View style={styles.modalContainerLarge}>
              <View style={styles.modalHeader}>
                <Ionicons name="cube-outline" size={20} color="#0D9488" style={{ marginRight: 6 }} />
                <Text style={styles.modalTitle}>{t.tabList}</Text>
                <TouchableOpacity onPress={() => setOcrDetailsModalVisible(false)}>
                  <Ionicons name="close" size={20} color="#1F2937" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false}>
                <Text style={styles.sectionSubtitle}>{t.ocrProductHeaderSubtitle}</Text>
                
                {ocrSelectedDrugs.map((drug) => {
                  const activeBrand = ocrSelectedBrands[drug.id];
                  
                  return (
                    <View key={drug.id} style={styles.shopeeOcrGroupCard}>
                      <View style={styles.ocrProductHeader}>
                        <Text style={styles.ocrProductBrandTitle}>{drug.brand_name} ({drug.generic_name})</Text>
                        <Text style={styles.ocrProductGenericSubtitle}>{t.labelActive}: {drug.strength || drug.dosage}</Text>
                      </View>

                      {drug.alternatives.map((alt, idx) => {
                        const isChecked = activeBrand && activeBrand.manufacturer === alt.manufacturer;
                        
                        return (
                          <TouchableOpacity 
                            key={idx} 
                            style={styles.ocrRadioRow}
                            onPress={() => handleSelectOcrBrand(drug.id, alt)}
                          >
                            <View style={[styles.shopeeCheckbox, isChecked && styles.shopeeCheckboxActive]}>
                              {isChecked && <Ionicons name="checkmark" size={12} color="#ffffff" />}
                            </View>
                            
                            <View style={{ flex: 1, paddingRight: 10 }}>
                              <Text style={styles.ocrRadioManufacturer}>{alt.manufacturer}</Text>
                              <Text style={styles.altFda}>FDA: {alt.fda_id}</Text>
                            </View>
                            
                            <Text style={styles.ocrRadioPrice}>₱{alt.price.toFixed(2)}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  );
                })}

                <View style={styles.shopeeSummaryCard}>
                  <Text style={styles.summaryTitle}>{t.labelSummaryTitle}</Text>
                  
                  <View style={styles.summaryItemRow}>
                    <Text style={styles.summaryItemLabel}>{t.labelBrandedTotal}:</Text>
                    <Text style={styles.summaryItemValue}>₱{ocrSummary.brandedCost.toFixed(2)}</Text>
                  </View>

                  <View style={styles.summaryItemRow}>
                    <Text style={styles.summaryItemLabel}>{t.labelGenericTotal}:</Text>
                    <Text style={styles.summaryItemValue}>₱{ocrSummary.genericCost.toFixed(2)}</Text>
                  </View>

                  <View style={styles.summarySavingsRow}>
                    <Text style={styles.savingsLabel}>{t.labelTotalSavings}:</Text>
                    <Text style={styles.savingsValue}>₱{ocrSummary.savings.toFixed(2)} ({ocrSummary.percentage}% {getSavingsLabel()})</Text>
                  </View>
                </View>

                {/* Batch Add CTA (56dp height) */}
                <TouchableOpacity 
                  style={[styles.primaryActionButton, { marginTop: 20, marginBottom: 20 }]}
                  onPress={handleAddAllOcrToBasket}
                >
                  <Ionicons name="add-circle-outline" size={18} color="#fff" />
                  <Text style={styles.primaryActionText}>
                    {t.addToList} ({getSavingsLabel()}: ₱{ocrSummary.savings.toFixed(2)})
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          ) : (
            <View style={styles.modalContainerLarge}>
              <ActivityIndicator size="large" color="#0D9488" />
            </View>
          )}
        </View>
      </Modal>

      {pharmacistSelectedAlt && (
        <Modal
          animationType="fade"
          transparent={false}
          visible={pharmacistModeVisible}
          onRequestClose={() => setPharmacistModeVisible(false)}
        >
          <SafeAreaView style={styles.pharmacistContainer}>
            <View style={styles.pharmacistHeader}>
              <TouchableOpacity 
                style={styles.pharmacistCloseButton} 
                onPress={() => setPharmacistModeVisible(false)}
              >
                <Ionicons name="arrow-back" size={20} color="#374151" />
                <Text style={styles.pharmacistCloseText}>{t.pharmacistBack}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.pharmacistMainCard}>
              <View style={styles.badgeRow}>
                <Text style={styles.pharmacistBadge}>{t.pharmacistTitle.toUpperCase()}</Text>
                
                {isNearestPharmacyVerified && (
                  <View style={styles.overlayVerifiedBadge}>
                    <Ionicons name="checkmark-circle" size={14} color="#065F46" />
                    <Text style={styles.overlayVerifiedBadgeText}>{t.labelVerified}</Text>
                  </View>
                )}
              </View>
              
              <Text style={styles.pharmacistGenericName}>{selectedDrug.generic_name.toUpperCase()}</Text>
              
              <View style={styles.pharmacistDetailRow}>
                <Text style={styles.pharmacistLabel}>DOSAGE / STRENGTH:</Text>
                <Text style={styles.pharmacistValue}>{selectedDrug.dosage}</Text>
              </View>

              <View style={styles.pharmacistDetailRow}>
                <Text style={styles.pharmacistLabel}>PREFERRED MANUFACTURER:</Text>
                <Text style={styles.pharmacistValue}>{pharmacistSelectedAlt.manufacturer}</Text>
              </View>

              <View style={styles.pharmacistDetailRow}>
                <Text style={styles.pharmacistLabel}>FDA REGISTRATION NUMBER:</Text>
                <Text style={styles.pharmacistValue}>{pharmacistSelectedAlt.fda_id}</Text>
              </View>

              <View style={styles.pharmacistDetailRow}>
                <Text style={styles.pharmacistLabel}>MAXIMUM REGULATED PRICE:</Text>
                <Text style={styles.pharmacistValue}>₱{selectedDrug.mdrp_price.toFixed(2)}/{t.labelPerTablet}</Text>
              </View>
            </View>

            <View style={styles.pharmacistFilipinoPromptBox}>
              <Ionicons name="hand-right" size={28} color="#0D9488" style={{ marginBottom: 10 }} />
              <Text style={styles.pharmacistFilipinoText}>
                "{t.pharmacistPhrase}"
              </Text>
            </View>
          </SafeAreaView>
        </Modal>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  screenWrapper: {
    width: '100%', 
  },
  sectionTitle: {
    fontSize: 18, 
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13, 
    color: '#6B7280',
    marginBottom: 16,
    lineHeight: 16,
  },
  searchContainerContainer: {
    position: 'relative',
    width: '100%',
    zIndex: 50,
  },
  searchContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    alignItems: 'center',
    paddingLeft: 12,
    marginBottom: 12,
    height: 56,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 13, 
    color: '#1F2937',
    ...Platform.select({
      web: { outlineStyle: 'none' }
    })
  },
  ocrButton: {
    backgroundColor: '#0D9488',
    height: 56,
    paddingHorizontal: 14,
    borderTopRightRadius: 7,
    borderBottomRightRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  ocrText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12, 
    marginLeft: 4,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 58,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    zIndex: 999,
    maxHeight: 220,
    overflow: 'scroll',
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  suggestionBrandText: {
    fontSize: 15, 
    fontWeight: '700',
    color: '#1F2937',
  },
  suggestionGenericText: {
    fontSize: 13, 
    color: '#6B7280',
    marginTop: 2,
  },
  loadingContainer: {
    padding: 16,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: '#0D9488',
    fontSize: 12,
    fontWeight: '600',
  },
  ntiWarningBanner: {
    backgroundColor: '#DC2626',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  ntiWarningText: {
    color: '#ffffff',
    fontSize: 13, 
    fontWeight: '700',
    flex: 1,
    lineHeight: 18,
  },
  resultCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  brandTitle: {
    fontSize: 15, 
    fontWeight: '900',
    color: '#111827',
  },
  genericSubtitle: {
    fontSize: 13, 
    color: '#6B7280',
    marginTop: 1,
  },
  rxBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  rxText: {
    fontSize: 11, 
    fontWeight: '800',
  },
  descriptionBox: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginVertical: 10,
  },
  descriptionLabel: {
    fontSize: 14, 
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
  },
  descriptionText: {
    fontSize: 13, 
    color: '#1E293B',
    marginTop: 4,
    lineHeight: 18,
  },
  fdaBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDFA',
    padding: 8,
    borderRadius: 6,
    marginBottom: 12,
  },
  fdaText: {
    fontSize: 12, 
    fontWeight: '600',
    color: '#0F766E',
    marginLeft: 4,
  },
  savingsBanner: {
    backgroundColor: '#FEF3C7',
    padding: 10,
    borderRadius: 6,
    marginBottom: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  savingsLabel: {
    fontSize: 14, 
    fontWeight: '700',
    color: '#B45309',
    textTransform: 'uppercase',
  },
  savingsValue: {
    fontSize: 15, 
    fontWeight: '800',
    color: '#92400E',
    marginTop: 1,
  },
  mdrpBox: {
    backgroundColor: '#EFF6FF',
    padding: 10,
    borderRadius: 8,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  mdrpLabel: {
    fontSize: 14, 
    fontWeight: '700',
    color: '#1E40AF',
    textTransform: 'uppercase',
  },
  mdrpValue: {
    fontSize: 15, 
    fontWeight: '800',
    color: '#1E3A8A',
    marginTop: 2,
  },
  mdrpSource: {
    fontSize: 11, 
    color: '#2563EB',
    marginTop: 2,
    fontWeight: '600',
  },
  tableTitle: {
    fontSize: 14, 
    fontWeight: '700',
    color: '#374151',
    marginBottom: 6,
  },
  altBlock: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingVertical: 10,
  },
  altRowGroup1: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  shopeeCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#01696f',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    backgroundColor: 'transparent',
  },
  shopeeCheckboxActive: {
    backgroundColor: '#01696f',
    borderColor: '#01696f',
  },
  altRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  altManufacturer: {
    fontSize: 15, 
    fontWeight: '800',
    color: '#1F2937',
    marginRight: 6,
  },
  confidenceBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  confidenceText: {
    fontSize: 11, 
    fontWeight: '700',
  },
  fdaReferenceWrapper: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'flex-start',
    overflow: 'hidden',
    marginTop: 4,
  },
  altFdaText: {
    fontSize: 12,
    color: '#7a7974',
    flexShrink: 1,
    flexWrap: 'wrap',
    flex: 1,
    lineHeight: 16,
  },
  timestampContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 4,
    marginTop: 4,
  },
  timestampText: {
    fontSize: 12,
    color: '#7a7974',
    flexShrink: 1,
    flexWrap: 'nowrap',
    numberOfLines: 1,
    ellipsizeMode: 'tail',
  },
  altPrice: {
    fontSize: 15, 
    fontWeight: '800',
    color: '#0D9488',
  },
  altActionButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    gap: 8,
    marginTop: 8,
    width: '100%',
    paddingLeft: 30, 
  },
  infoIconButton: {
    padding: 6,
    height: 36,
    width: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandedPanel: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
    marginLeft: 30, 
  },
  expandedPanelItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 2,
  },
  expandedPanelItemText: {
    fontSize: 12,
    color: '#7a7974',
    flexShrink: 1,
    flexWrap: 'wrap',
    flex: 1,
    lineHeight: 16,
  },
  showPharmacistRowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    height: 38,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#99F6E4',
    backgroundColor: '#F0FDFA',
    marginRight: 4,
  },
  showPharmacistRowText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0D9488',
    marginLeft: 2,
  },
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    height: 38,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
  },
  reportButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EF4444',
    marginLeft: 3,
  },
  shopeeSummaryCard: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 10,
    padding: 12,
    marginTop: 14,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E40AF',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  summaryItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 2,
  },
  summaryItemLabel: {
    fontSize: 13,
    color: '#4B5563',
  },
  summaryItemValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },
  summarySavingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#DBEAFE',
    paddingTop: 6,
    marginTop: 6,
  },
  savingsLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E3A8A',
  },
  savingsValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1D4ED8',
  },
  rxGateContainer: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 14,
  },
  rxGateTextWrapper: {
    alignItems: 'center',
    marginVertical: 6,
  },
  rxGateTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#991B1B',
  },
  rxGateSub: {
    fontSize: 13,
    color: '#7F1D1D',
    textAlign: 'center',
    marginTop: 2,
  },
  rxConfirmButton: {
    backgroundColor: '#DC2626',
    width: '100%',
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  rxConfirmButtonText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 13,
  },
  primaryActionButton: {
    backgroundColor: '#0D9488',
    borderRadius: 14,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 14,
  },
  primaryActionText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 13,
    marginLeft: 6,
  },
  softAdvisoryBar: {
    flexDirection: 'row',
    backgroundColor: '#FEF3C7',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginTop: 8,
    alignItems: 'center',
  },
  softAdvisoryText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#92400E',
    flex: 1,
    lineHeight: 18,
  },
  regulatoryFooterText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 16,
    marginVertical: 18,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#F0FDFA',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CCFBF1',
    marginTop: 14,
    alignItems: 'flex-start',
  },
  infoBoxText: {
    flex: 1,
    fontSize: 13,
    color: '#0F766E',
    marginLeft: 8,
    lineHeight: 18,
  },
  pharmacistContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 20,
  },
  pharmacistHeader: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  pharmacistCloseButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pharmacistCloseText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginLeft: 8,
  },
  pharmacistMainCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  pharmacistBadge: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0D9488',
    backgroundColor: '#CCFBF1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    letterSpacing: 0.5,
  },
  overlayVerifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  overlayVerifiedBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#065F46',
    marginLeft: 4,
  },
  pharmacistGenericName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111827',
    marginBottom: 20,
  },
  pharmacistDetailRow: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingVertical: 12,
  },
  pharmacistLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.5,
  },
  pharmacistValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1F2937',
    marginTop: 2,
  },
  pharmacistFilipinoPromptBox: {
    backgroundColor: '#F0FDFA',
    borderWidth: 2,
    borderColor: '#99F6E4',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  pharmacistFilipinoText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F766E',
    textAlign: 'center',
    lineHeight: 22,
  },
  pharmacistSubtext: {
    fontSize: 11,
    color: '#4D7C0F',
    marginTop: 4,
    fontStyle: 'italic',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContainerLarge: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 2,
    borderBottomColor: '#F3F4F6',
    paddingBottom: 14,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 14, 
    fontWeight: '800',
    color: '#111827',
  },
  modalForm: {
    width: '100%',
  },
  ocrProductHeader: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  ocrProductBrandTitle: {
    fontSize: 15, 
    fontWeight: '900',
    color: '#111827',
  },
  ocrProductGenericSubtitle: {
    fontSize: 13, 
    color: '#475569',
    marginTop: 2,
    fontWeight: '600',
  },
  ocrRadioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  ocrRadioManufacturer: {
    fontSize: 15, 
    fontWeight: '800',
    color: '#1F2937',
  },
  ocrRadioPrice: {
    fontSize: 15, 
    fontWeight: '800',
    color: '#0D9488',
  },
  shopeeOcrGroupCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
  },
});