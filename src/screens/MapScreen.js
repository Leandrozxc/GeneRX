import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Modal, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { isRecentlyVerified } from '../models/DrugModel';
import { useLanguage } from '../context/LanguageContext';

export default function MapScreen({ 
  pharmacies, 
  selectedDrug,
  recentlyVerifiedOnly,
  setRecentlyVerifiedOnly,
  partnerModalVisible,
  setPartnerModalVisible,
  handleUpdatePharmacyStock,
  allOriginalDrugs,
  allOriginalPharmacies
}) {

  const { t } = useLanguage();
  const [formPharmacyId, setFormPharmacyId] = useState(allOriginalPharmacies[0]?.id || '');
  const [formDrugId, setFormDrugId] = useState(allOriginalDrugs[0]?.id || '1');
  const [formStockStatus, setFormStockStatus] = useState('in_stock');

  const getVerificationBadge = (pharmacy) => {
    const isRecent = isRecentlyVerified(pharmacy.last_verified);
    if (isRecent || pharmacy.availability_status === 'confirmed') {
      return (
        <View style={[styles.statusBadge, { backgroundColor: '#D1FAE5' }]}>
          <Ionicons name="checkmark-circle" size={12} color="#065F46" />
          <Text style={[styles.statusText, { color: '#065F46' }]}>{t.labelAvailable}</Text>
        </View>
      );
    } else {
      return (
        <View style={[styles.statusBadge, { backgroundColor: '#EFF6FF' }]}>
          <Ionicons name="help-circle" size={12} color="#1E40AF" />
          <Text style={[styles.statusText, { color: '#1E40AF' }]}>{t.learnMore}</Text>
        </View>
      );
    }
  };

  return (
    <View style={styles.screenWrapper}>
      
      <View style={styles.actionHeader}>
        <Text style={styles.sectionTitle}>{t.mapTitle}</Text>
        <TouchableOpacity 
          style={styles.portalLauncher} 
          onPress={() => setPartnerModalVisible(true)}
        >
          <Ionicons name="business" size={14} color="#0D9488" />
          <Text style={styles.portalLauncherText}>{t.partnerFormTitle}</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.sectionSubtitle}>{t.mapDisclaimer}</Text>

      <View style={styles.filterBar}>
        <TouchableOpacity 
          style={[styles.filterButton, !recentlyVerifiedOnly && styles.activeFilterButton]}
          onPress={() => setRecentlyVerifiedOnly(false)}
        >
          <Text style={[styles.filterButtonText, !recentlyVerifiedOnly && styles.activeFilterButtonText]}>
            {t.mapFilterAll} ({allOriginalPharmacies.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterButton, recentlyVerifiedOnly && styles.activeFilterButton]}
          onPress={() => setRecentlyVerifiedOnly(true)}
        >
          <Ionicons name="shield-checkmark" size={12} color={recentlyVerifiedOnly ? '#fff' : '#6B7280'} style={{ marginRight: 4 }} />
          <Text style={[styles.filterButtonText, recentlyVerifiedOnly && styles.activeFilterButtonText]}>
            {t.mapFilterVerified}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.mockMapContainer}>
        <View style={styles.mapGridLineH} />
        <View style={styles.mapGridLineV} />
        <Text style={styles.mapLabel}>SAN NICOLAS, CEBU CITY (DEMO RANGE)</Text>
        
        {pharmacies.map((pharmacy) => {
          let pinColor = '#3B82F6'; 
          if (pharmacy.id === 'p1') pinColor = '#0D9488'; 
          if (pharmacy.id === 'p2') pinColor = '#F59E0B'; 

          let pinTop = '35%';
          let pinLeft = '45%';
          if (pharmacy.id === 'p2') { pinTop = '65%'; pinLeft = '20%'; }
          if (pharmacy.id === 'p3') { pinTop = '15%'; pinLeft = '75%'; }

          return (
            <View key={pharmacy.id} style={[styles.mapPin, { top: pinTop, left: pinLeft }]}>
              <Ionicons name="location" size={24} color={pinColor} />
              <View style={styles.pinTooltip}>
                <Text style={styles.pinLabelText}>{pharmacy.name.split(' - ')[0]}</Text>
                <Text style={styles.pinVerifiedText}>{t.labelLastUpdated}: {pharmacy.last_verified}</Text>
              </View>
            </View>
          );
        })}
      </View>

      {pharmacies.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle-outline" size={32} color="#9CA3AF" />
          <Text style={styles.emptyText}>{t.noResults}</Text>
        </View>
      ) : (
        pharmacies.map((pharmacy) => {
          const drugId = selectedDrug ? selectedDrug.id : '1';
          const stockInfo = pharmacy.stock[drugId];
          const drugName = selectedDrug ? selectedDrug.generic_name : 'Amlodipine';

          return (
            /* FIX 5: Pharmacy Card specific paddings, borders, colors, and margins */
            <View key={pharmacy.id} style={styles.pharmacyCard}>
              
              {/* FIX 1: Line 1 Pharmacy name + Price in the same row wrapper */}
              <View style={styles.pharmacyHeaderRow}>
                <Text style={styles.pharmacyNameText}>{pharmacy.name}</Text>
                <Text style={styles.pharmacyPriceText}>₱{stockInfo.price.toFixed(2)}</Text>
              </View>

              {/* FIX 1: Line 2 Verified badge and availability indicators */}
              <View style={styles.pharmacyHeaderLine2}>
                {getVerificationBadge(pharmacy)}
                {pharmacy.verified && (
                  <View style={styles.partnerBadge}>
                    <Ionicons name="checkmark-circle-sharp" size={12} color="#065F46" />
                    <Text style={styles.partnerBadgeText}>Verified Partner</Text>
                  </View>
                )}
              </View>

              {/* Row 3: Address */}
              <Text style={styles.pharmacyAddress}>{pharmacy.address}</Text>

              {/* Row 4: Verification date display indicator */}
              <Text style={styles.cardVerificationText}>{t.labelLastUpdated}: {pharmacy.last_verified}</Text>

              {/* Row 5: Stock Status details footer */}
              <View style={styles.stockStatusContainer}>
                <View style={styles.stockIndicatorRow}>
                  <View style={[styles.statusDot, { backgroundColor: stockInfo.available ? '#10B981' : '#EF4444' }]} />
                  <Text style={styles.stockLabel}>
                    {drugName}: {stockInfo.available ? t.labelAvailable : t.labelOutOfStock}
                  </Text>
                </View>
                {stockInfo.available && (
                  <TouchableOpacity style={styles.routeButton}>
                    <Ionicons name="navigate" size={12} color="#0D9488" />
                    <Text style={styles.routeButtonText}>Directions</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={partnerModalVisible}
        onRequestClose={() => setPartnerModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t.partnerFormTitle}</Text>
              <TouchableOpacity onPress={() => setPartnerModalVisible(false)}>
                <Ionicons name="close" size={20} color="#1F2937" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalForm}>
              
              <Text style={styles.formLabel}>Select Pharmacy Outlet</Text>
              {allOriginalPharmacies.map((pharmacy) => (
                <TouchableOpacity 
                  key={pharmacy.id} 
                  style={[styles.radioItem, formPharmacyId === pharmacy.id && styles.radioItemActive]}
                  onPress={() => setFormPharmacyId(pharmacy.id)}
                >
                  <Ionicons 
                    name={formPharmacyId === pharmacy.id ? "radio-button-on" : "radio-button-off"} 
                    size={16} 
                    color={formPharmacyId === pharmacy.id ? "#0D9488" : "#4B5563"} 
                  />
                  <Text style={[styles.radioLabel, formPharmacyId === pharmacy.id && styles.radioLabelActive]}>
                    {pharmacy.name}
                  </Text>
                </TouchableOpacity>
              ))}

              <Text style={[styles.formLabel, { marginTop: 16 }]}>Select Medicine</Text>
              {allOriginalDrugs.map((drug) => (
                <TouchableOpacity 
                  key={drug.id} 
                  style={[styles.radioItem, formDrugId === drug.id && styles.radioItemActive]}
                  onPress={() => setFormDrugId(drug.id)}
                >
                  <Ionicons 
                    name={formDrugId === drug.id ? "radio-button-on" : "radio-button-off"} 
                    size={16} 
                    color={formDrugId === drug.id ? "#0D9488" : "#4B5563"} 
                  />
                  <Text style={[styles.radioLabel, formDrugId === drug.id && styles.radioLabelActive]}>
                    {drug.generic_name} ({drug.brand_name})
                  </Text>
                </TouchableOpacity>
              ))}

              <Text style={[styles.formLabel, { marginTop: 16 }]}>Stock Level Status</Text>
              <View style={styles.stockToggleContainer}>
                {['in_stock', 'low_stock', 'out_of_stock'].map((status) => {
                  let label = t.labelAvailable;
                  let color = "#10B981";
                  if (status === 'low_stock') { label = t.labelLowStock.split(' ')[0]; color = "#F59E0B"; }
                  if (status === 'out_of_stock') { label = t.labelOutOfStock; color = "#EF4444"; }

                  return (
                    <TouchableOpacity 
                      key={status} 
                      style={[
                        styles.stockToggleCard, 
                        formStockStatus === status && { borderColor: color, backgroundColor: color + "10" }
                      ]}
                      onPress={() => setFormStockStatus(status)}
                    >
                      <Ionicons 
                        name={formStockStatus === status ? "checkmark-circle" : "ellipse-outline"} 
                        size={14} 
                        color={color} 
                      />
                      <Text style={[styles.stockToggleText, { color: color }]}>{label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity 
                style={styles.modalSubmitButton}
                onPress={() => handleUpdatePharmacyStock(formPharmacyId, formDrugId, formStockStatus)}
              >
                <Text style={styles.modalSubmitText}>{t.partnerFormSubmit}</Text>
              </TouchableOpacity>

            </ScrollView>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  screenWrapper: {
    width: '100%', 
  },
  actionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  portalLauncher: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 48, 
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0D9488',
  },
  portalLauncherText: {
    fontSize: 12, // FIX 6: Button text (small): 12
    fontWeight: '700',
    color: '#0D9488',
    marginLeft: 4,
  },
  sectionTitle: {
    fontSize: 18, // FIX 6: Screen/page titles: 18
    fontWeight: '700',
    color: '#111827',
  },
  sectionSubtitle: {
    fontSize: 11, // FIX 6: Footer / disclaimer text: 11
    color: '#6B7280',
    marginBottom: 14,
    lineHeight: 16,
  },
  filterBar: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    padding: 3,
    borderRadius: 8,
    marginBottom: 12,
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 6,
  },
  activeFilterButton: {
    backgroundColor: '#0D9488',
  },
  filterButtonText: {
    fontSize: 12, // FIX 6: Button text (small): 12
    fontWeight: '600',
    color: '#4B5563',
  },
  activeFilterButtonText: {
    color: '#ffffff',
  },
  mockMapContainer: {
    height: 160,
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    marginBottom: 16,
    position: 'relative',
    overflow: 'visible', 
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  mapLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: '#94A3B8',
    position: 'absolute',
    bottom: 6,
    letterSpacing: 0.5,
  },
  mapGridLineH: {
    height: 1,
    width: '100%',
    backgroundColor: '#CBD5E1',
    position: 'absolute',
  },
  mapGridLineV: {
    width: 1,
    height: '100%',
    backgroundColor: '#CBD5E1',
    position: 'absolute',
  },
  mapPin: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 10,
  },
  pinTooltip: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    alignItems: 'center',
    position: 'absolute',
    bottom: 24, 
    width: 110,
  },
  pinLabelText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#ffffff',
  },
  pinVerifiedText: {
    fontSize: 7,
    color: '#94A3B8',
    marginTop: 1,
  },
  // FIX 5: Strict Card Style configuration rules
  pharmacyCard: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
    borderRadius: 10,
    backgroundColor: '#f9f8f5',
    borderWidth: 1,
    borderColor: '#d4d1ca',
    width: '100%',
  },
  // FIX 1: Exact layout constraints for Line 1 title row
  pharmacyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 6, // FIX 5 spacing
  },
  // FIX 1: Pharmacy Name text spec matching rules
  pharmacyNameText: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    flexShrink: 1,
    flexWrap: 'wrap',
    numberOfLines: 2,
    ellipsizeMode: 'tail',
    color: '#28251d',
  },
  // FIX 1: Header Price spec matching rules
  pharmacyPriceText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#01696f',
    marginLeft: 8,
    flexShrink: 0,
  },
  // FIX 1: Line 2 Verified badge layout wrapper
  pharmacyHeaderLine2: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 6, // FIX 5 spacing
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 11, // FIX 6: Badge / tag text: 11
    fontWeight: '700',
    marginLeft: 2,
  },
  pharmacyAddress: {
    fontSize: 13, // FIX 6: Card secondary label: 13
    color: '#6B7280',
    marginBottom: 6, // FIX 5 spacing
  },
  partnerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  partnerBadgeText: {
    fontSize: 11, // FIX 6: Badge / tag text: 11
    fontWeight: '800',
    color: '#065F46',
    marginLeft: 4,
  },
  cardVerificationText: {
    fontSize: 12, // FIX 6: Timestamp / date text: 12
    color: '#9CA3AF',
    marginBottom: 6, // FIX 5 spacing
    fontWeight: '500',
  },
  msmeBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  msmeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
  },
  stockStatusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 6,
  },
  stockIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  stockLabel: {
    fontSize: 13, // FIX 6: Card secondary label: 13
    fontWeight: '600',
    color: '#374151',
  },
  routeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    height: 38,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#0D9488',
  },
  routeButtonText: {
    fontSize: 12, // FIX 6: Button text (small): 12
    fontWeight: '600',
    color: '#0D9488',
    marginLeft: 2,
  },
  emptyContainer: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 13, // FIX 6: Body descriptions: 13
    color: '#6B7280',
    marginTop: 6,
    textAlign: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingBottom: 10,
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 14, // FIX 6: Section headers: 14
    fontWeight: '800',
    color: '#111827',
  },
  modalForm: {
    width: '100%',
  },
  formLabel: {
    fontSize: 14, // FIX 6: Section headers: 14
    fontWeight: '700',
    color: '#374151',
    marginBottom: 6,
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 6,
  },
  radioItemActive: {
    borderColor: '#0D9488',
    backgroundColor: '#F0FDFA',
  },
  radioLabel: {
    fontSize: 13, // FIX 6: Card secondary label: 13
    color: '#4B5563',
    marginLeft: 8,
  },
  radioLabelActive: {
    color: '#0D9488',
    fontWeight: '700',
  },
  stockToggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  stockToggleCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 6,
    marginHorizontal: 3,
  },
  stockToggleText: {
    fontSize: 12, // FIX 6: Button text (small): 12
    fontWeight: '700',
    marginTop: 3,
  },
  modalSubmitButton: {
    backgroundColor: '#0D9488',
    borderRadius: 8,
    height: 56, 
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  modalSubmitText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 13, // FIX 6: Button text (primary): 13
  },
});