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
  allOriginalPharmacies,
  
  // Group 5: Active prescription basket passed down
  basket
}) {

  const { t } = useLanguage();
  const [formPharmacyId, setFormPharmacyId] = useState(allOriginalPharmacies[0]?.id || '');
  const [formDrugId, setFormDrugId] = useState(allOriginalDrugs[0]?.id || '1');
  const [formStockStatus, setFormStockStatus] = useState('in_stock');

  // Helper: Calculates the exact register cost for your custom basket at this specific pharmacy
  const calculatePharmacyBasketTotal = (pharmacy) => {
    if (!basket || basket.length === 0) return 0;
    return basket.reduce((sum, item) => {
      const stockInfo = pharmacy.stock[item.drugId];
      // Use the pharmacy's specific generic price if available
      return sum + (stockInfo ? stockInfo.price : item.chosenAlternative.price);
    }, 0);
  };

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

      {/* Verification Filter Toggle Bar */}
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

      {/* Pharmacy Cards List */}
      {pharmacies.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle-outline" size={32} color="#9CA3AF" style={{ marginBottom: 8 }} />
          <Text style={styles.emptyText}>
            {basket && basket.length > 0 
              ? "Walang botika ang may kumpletong stock para sa iyong mga piling generic brands."
              : t.noResults}
          </Text>
        </View>
      ) : (
        pharmacies.map((pharmacy) => {
          const basketTotal = calculatePharmacyBasketTotal(pharmacy);

          return (
            /* Strict FIX 5 Layout Card constraints */
            <View key={pharmacy.id} style={styles.pharmacyCard}>
              
              {/* FIX 1: Line 1 Pharmacy name + Custom Basket Register Total */}
              <View style={styles.pharmacyHeaderRow}>
                <Text style={styles.pharmacyNameText}>{pharmacy.name}</Text>
                {basket && basket.length > 0 && (
                  <Text style={styles.pharmacyPriceText}>₱{basketTotal.toFixed(2)}</Text>
                )}
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

              {/* Row 5: Detailed stock items list selected by patient */}
              <View style={styles.stockStatusContainer}>
                {basket && basket.length > 0 ? (
                  <View style={styles.itemizedStockList}>
                    <Text style={styles.itemizedTitle}>STOCK STATUS AT PRICE:</Text>
                    {basket.map((item) => {
                      const stockInfo = pharmacy.stock[item.drugId];
                      const localPrice = stockInfo ? stockInfo.price : item.chosenAlternative.price;
                      return (
                        <View key={item.drugId} style={styles.itemizedRow}>
                          <Ionicons name="checkmark-circle" size={14} color="#10B981" style={{ marginRight: 6 }} />
                          <Text style={styles.itemizedText}>
                            {item.chosenAlternative.manufacturer} ({item.genericName}) — ₱{localPrice.toFixed(2)}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                ) : (
                  <View style={styles.stockIndicatorRow}>
                    <View style={[styles.statusDot, { backgroundColor: '#10B981' }]} />
                    <Text style={styles.stockLabel}>Generics Available</Text>
                  </View>
                )}
                
                <TouchableOpacity style={styles.routeButton}>
                  <Ionicons name="navigate" size={12} color="#0D9488" />
                  <Text style={styles.routeButtonText}>Directions</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })
      )}

      {/* Partner Update Modal */}
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
    fontSize: 12, // Button text (small): 12sp
    fontWeight: '700',
    color: '#0D9488',
    marginLeft: 4,
  },
  sectionTitle: {
    fontSize: 18, // Screen/page titles: 18sp
    fontWeight: '700',
    color: '#111827',
  },
  sectionSubtitle: {
    fontSize: 11, // Footer / disclaimer text: 11sp
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
    fontSize: 12, // Button text (small): 12sp
    fontWeight: '600',
    color: '#4B5563',
  },
  activeFilterButtonText: {
    color: '#ffffff',
  },
  // Strict FIX 5 Card Style rules
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
  // FIX 1: Exact layout constraints for title row
  pharmacyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 6, // FIX 5 spacing
  },
  pharmacyNameText: {
    fontSize: 14, // Card title: 14sp
    fontWeight: '600',
    flex: 1,
    flexShrink: 1,
    flexWrap: 'wrap',
    numberOfLines: 2,
    ellipsizeMode: 'tail',
    color: '#28251d',
  },
  pharmacyPriceText: {
    fontSize: 14, // Card price: 14sp
    fontWeight: '700',
    color: '#01696f',
    marginLeft: 8,
    flexShrink: 0,
  },
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
    fontSize: 11, // Badge / tag text: 11sp
    fontWeight: '700',
  },
  pharmacyAddress: {
    fontSize: 13, // Card secondary: 13sp
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
    fontSize: 11, // Badge / tag text: 11sp
    fontWeight: '800',
    color: '#065F46',
    marginLeft: 4,
  },
  cardVerificationText: {
    fontSize: 12, // Timestamp / date text: 12sp
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
    flexDirection: 'column', // Dynamic column breakdown for list items
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 6,
  },
  itemizedStockList: {
    width: '100%',
    marginBottom: 6,
  },
  itemizedTitle: {
    fontSize: 11, // Section headers: 11sp
    fontWeight: '800',
    color: '#4B5563',
    marginBottom: 4,
  },
  itemizedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  itemizedText: {
    fontSize: 13, // Body descriptions: 13sp
    color: '#1F2937',
    flex: 1,
    flexWrap: 'wrap',
  },
  stockIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  stockLabel: {
    fontSize: 13, // Card secondary: 13sp
    fontWeight: '600',
    color: '#374151',
  },
  routeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 38,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#0D9488',
    width: '100%',
    marginTop: 4,
  },
  routeButtonText: {
    fontSize: 12, // Button text (small): 12sp
    fontWeight: '600',
    color: '#0D9488',
    marginLeft: 4,
  },
  emptyContainer: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 13, // Body descriptions: 13sp
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
    fontSize: 14, // Section headers: 14sp
    fontWeight: '800',
    color: '#111827',
  },
  modalForm: {
    width: '100%',
  },
  formLabel: {
    fontSize: 14, // Section headers: 14sp
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
    fontSize: 13, // Card secondary: 13sp
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
    fontSize: 12, // Button text (small): 12sp
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
    fontSize: 13, // Button text (primary): 13sp
  },
});