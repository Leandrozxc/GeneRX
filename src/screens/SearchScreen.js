import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, Platform, Modal, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../context/LanguageContext';
import { DrugModel } from '../models/DrugModel';

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
  isNearestPharmacyVerified
}) {
  
  const { t, currentLanguage } = useLanguage();
  const [expandedRow, setExpandedRow] = useState(null);

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
        return (
          <View style={[styles.confidenceBadge, { backgroundColor: '#FEF3C7' }]}>
            <Text style={[styles.confidenceText, { color: '#92400E' }]}>{t.labelVerified}</Text>
          </View>
        );
      case 'community':
      default:
        return (
          <View style={[styles.confidenceBadge, { backgroundColor: '#E5E7EB' }]}>
            <Text style={[styles.confidenceText, { color: '#374151' }]}>{t.learnMore}</Text>
          </View>
        );
    }
  };

  return (
    <View style={styles.screenWrapper}>
      <Text style={styles.sectionTitle}>{t.searchTitle}</Text>
      <Text style={styles.sectionSubtitle}>{t.searchPlaceholder}</Text>
      
      {/* Search Input Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={16} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={t.searchPlaceholder}
          value={searchQuery}
          onChangeText={onSearch}
        />
        <TouchableOpacity style={styles.ocrButton} onPress={triggerMockOCR}>
          <Ionicons name="camera" size={16} color="#fff" />
          <Text style={styles.ocrText}>{t.scanButton}</Text>
        </TouchableOpacity>
      </View>

      {/* OCR Loading Animation */}
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

          <View style={styles.resultCard}>
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

            {/* Description Localization Resolver */}
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

            <View style={styles.savingsBanner}>
              <Text style={styles.savingsLabel}>{t.moreDetails}</Text>
              <Text style={styles.savingsValue}>₱{(selectedDrug.branded_avg_price - selectedDrug.generic_avg_price).toFixed(2)} ({selectedDrug.savings_percentage}%)</Text>
            </View>

            <View style={styles.mdrpBox}>
              <Text style={styles.mdrpLabel}>{t.labelMaxPrice}</Text>
              <Text style={styles.mdrpValue}>₱{selectedDrug.mdrp_price.toFixed(2)} / {t.labelPerTablet}</Text>
              <Text style={styles.mdrpSource}>{t.labelSource}: DOH MDRP</Text>
            </View>

            <Text style={styles.tableTitle}>{t.moreDetails}</Text>
            {selectedDrug.alternatives.map((alt, index) => (
              <View key={index} style={styles.altBlock}>
                <View style={styles.altRowGroup1}>
                  <View style={{ flex: 1, paddingRight: 10 }}>
                    <View style={styles.altRowHeader}>
                      <Text style={styles.altManufacturer}>{alt.manufacturer}</Text>
                      {renderConfidenceBadge(alt.source_type)}
                    </View>
                    
                    {/* FIX 2: FDA Reference Text horizontal wrap mapping */}
                    <View style={styles.fdaReferenceWrapper}>
                      <Text style={styles.altFdaText}>
                        FDA Ref: {alt.fda_id}
                      </Text>
                    </View>
                    
                    {/* FIX 3: Date formatting layout constraints */}
                    <View style={styles.timestampContainer}>
                      <Ionicons name="time-outline" size={12} color="#7a7974" />
                      <Text style={styles.timestampText}>
                        {t.labelLastUpdated}: {alt.last_updated}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={{ alignItems: 'flex-end', justifyContent: 'center' }}>
                    <Text style={styles.altPrice}>₱{alt.price.toFixed(2)}</Text>
                    
                    {/* Tappable ⓘ info icon aligned with row price */}
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
                </View>

                {/* FIX 2: Applied horizontal text wrapper constraints forexpanded details */}
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

                {/* FIX 4: Show Pharmacist and Report side by side on exactly one row */}
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
            ))}

            {selectedDrug.rx_required && !rxConfirmed ? (
              <View style={styles.rxGateContainer}>
                <Ionicons name="document-text" size={24} color="#DC2626" />
                <View style={styles.rxGateTextWrapper}>
                  <Text style={styles.rxGateTitle}>{t.labelNeedsRx}</Text>
                  <Text style={styles.rxGateSub}>{t.rxGateMessage}</Text>
                </View>
                <TouchableOpacity 
                  style={styles.rxConfirmButton} 
                  onPress={() => setRxConfirmed(true)}
                >
                  <Text style={styles.rxConfirmButtonText}>{t.rxGateConfirm}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.primaryActionButton}
                onPress={onNavigateToMap}
              >
                <Ionicons name="map" size={16} color="#fff" />
                <Text style={styles.primaryActionText}>{t.findPharmacy}</Text>
              </TouchableOpacity>
            )}
          </View>

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
                    <Ionicons name="checkmark-circle" size={12} color="#065F46" />
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
              <Ionicons name="hand-right" size={24} color="#0D9488" style={{ marginBottom: 10 }} />
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
    fontSize: 18, // FIX 6: Screen/page titles: 18
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13, // FIX 6: Card secondary label: 13
    color: '#6B7280',
    marginBottom: 16,
    lineHeight: 16,
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
    fontSize: 13, // FIX 6: Body descriptions: 13
    color: '#1F2937',
    ...Platform.select({
      web: {
        outlineStyle: 'none'
      }
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
    fontSize: 12, // FIX 6: Button text (small): 12
    marginLeft: 4,
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
    fontSize: 13, // FIX 6: Body descriptions: 13
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
    fontSize: 15, // FIX 6: Card primary label: 15
    fontWeight: '900',
    color: '#111827',
  },
  genericSubtitle: {
    fontSize: 13, // FIX 6: Card secondary label: 13
    color: '#6B7280',
    marginTop: 1,
  },
  rxBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  rxText: {
    fontSize: 11, // FIX 6: Badge / tag text: 11
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
    fontSize: 14, // FIX 6: Section headers: 14
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
  },
  descriptionText: {
    fontSize: 13, // FIX 6: Body descriptions: 13
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
    fontSize: 12, // FIX 6: Timestamp / date text: 12
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
    fontSize: 14, // FIX 6: Section headers: 14
    fontWeight: '700',
    color: '#B45309',
    textTransform: 'uppercase',
  },
  savingsValue: {
    fontSize: 15, // FIX 6: Card primary label: 15
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
    fontSize: 14, // FIX 6: Section headers: 14
    fontWeight: '700',
    color: '#1E40AF',
    textTransform: 'uppercase',
  },
  mdrpValue: {
    fontSize: 15, // FIX 6: Card primary label: 15
    fontWeight: '800',
    color: '#1E3A8A',
    marginTop: 2,
  },
  mdrpSource: {
    fontSize: 11, // FIX 6: Footer / disclaimer text: 11
    color: '#2563EB',
    marginTop: 2,
    fontWeight: '600',
  },
  tableTitle: {
    fontSize: 14, // FIX 6: Section headers: 14
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
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  altRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  altManufacturer: {
    fontSize: 15, // FIX 6: Card primary label: 15
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
    fontSize: 11, // FIX 6: Badge / tag text: 11
    fontWeight: '700',
  },
  // FIX 2: Container style matching
  fdaReferenceWrapper: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'flex-start',
    overflow: 'hidden',
    marginTop: 4,
  },
  // FIX 2: Text style matching
  altFdaText: {
    fontSize: 12,
    color: '#7a7974',
    flexShrink: 1,
    flexWrap: 'wrap',
    flex: 1,
    lineHeight: 16,
  },
  // FIX 3: Timestamp row wrapper mapping
  timestampContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 4,
    marginTop: 4,
  },
  // FIX 3: Timestamp text mapping
  timestampText: {
    fontSize: 12,
    color: '#7a7974',
    flexShrink: 1,
    flexWrap: 'nowrap',
    numberOfLines: 1,
    ellipsizeMode: 'tail',
  },
  altPrice: {
    fontSize: 15, // FIX 6: Card primary label: 15
    fontWeight: '800',
    color: '#0D9488',
  },
  // FIX 4: Unified single-row wrapper constraints
  altActionButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    gap: 8,
    marginTop: 8,
    width: '100%',
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
  },
  // FIX 2 parent view mapping
  expandedPanelItemRow: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'flex-start',
    overflow: 'hidden',
    marginVertical: 2,
  },
  // FIX 2 text view mapping
  expandedPanelItemText: {
    fontSize: 12,
    color: '#7a7974',
    flexShrink: 1,
    flexWrap: 'wrap',
    flex: 1,
    lineHeight: 16,
  },
  // FIX 4: Exact colors/borders for Show Pharmacist button
  showPharmacistRowButton: {
    flex: 1,
    height: 36,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    backgroundColor: '#e8f4f5',
    borderWidth: 1,
    borderColor: '#01696f',
  },
  // FIX 4: Exact Show Pharmacist text style rules
  showPharmacistRowText: {
    fontSize: 12,
    fontWeight: '600',
    numberOfLines: 1,
    color: '#01696f',
  },
  // FIX 4: Exact colors/borders for Report button
  reportButton: {
    flex: 1,
    height: 36,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    backgroundColor: '#fdecea',
    borderWidth: 1,
    borderColor: '#f44336',
  },
  // FIX 4: Exact Report text style rules
  reportButtonText: {
    fontSize: 12,
    fontWeight: '600',
    numberOfLines: 1,
    color: '#b71c1c',
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
    fontSize: 14, // FIX 6: Section headers: 14
    fontWeight: '800',
    color: '#991B1B',
  },
  rxGateSub: {
    fontSize: 13, // FIX 6: Body descriptions: 13
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
    fontSize: 13, // FIX 6: Button text (primary): 13
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
    fontSize: 13, // FIX 6: Button text (primary): 13
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
    fontSize: 13, // FIX 6: Body descriptions: 13
    fontWeight: '600',
    color: '#92400E',
    flex: 1,
    lineHeight: 18,
  },
  regulatoryFooterText: {
    fontSize: 11, // FIX 6: Footer / disclaimer text: 11
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
    fontSize: 13, // FIX 6: Body descriptions: 13
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
    fontSize: 13, // FIX 6: Button text (primary): 13
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
    fontSize: 11, // FIX 6: Badge / tag text: 11
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
    fontSize: 11, // FIX 6: Badge / tag text: 11
    fontWeight: '800',
    color: '#065F46',
    marginLeft: 4,
  },
  pharmacistGenericName: {
    fontSize: 18, // FIX 6: Screen/page titles: 18 (limited to <=18)
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
    fontSize: 14, // FIX 6: Section headers: 14
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.5,
  },
  pharmacistValue: {
    fontSize: 15, // FIX 6: Card primary label: 15
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
    fontSize: 14, // FIX 6: Section headers: 14
    fontWeight: '900',
    color: '#0F766E',
    textAlign: 'center',
    lineHeight: 22,
  },
  pharmacistSubtext: {
    fontSize: 11, // FIX 6: Footer / disclaimer text: 11
    color: '#4D7C0F',
    marginTop: 4,
    fontStyle: 'italic',
  },
});