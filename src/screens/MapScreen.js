import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { isRecentlyVerified } from '../models/DrugModel';
import { useLanguage } from '../context/LanguageContext';

export default function MapScreen({ 
  pharmacies, 
  selectedDrug,
  recentlyVerifiedOnly,
  setRecentlyVerifiedOnly,
  basket
}) {

  const { t } = useLanguage();

  const calculatePharmacyBasketTotal = (pharmacy) => {
    if (!basket || basket.length === 0) return 0;
    return basket.reduce((sum, item) => {
      const stockInfo = pharmacy.stock[item.drugId];
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
      </View>
      <Text style={styles.sectionSubtitle}>{t.mapDisclaimer}</Text>

      {/* Verification Filter Toggle Bar */}
      <View style={styles.filterBar}>
        <TouchableOpacity 
          style={[styles.filterButton, !recentlyVerifiedOnly && styles.activeFilterButton]}
          onPress={() => setRecentlyVerifiedOnly(false)}
        >
          <Text style={[styles.filterButtonText, !recentlyVerifiedOnly && styles.activeFilterButtonText]}>
            {t.mapFilterAll}
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
            <View key={pharmacy.id} style={styles.pharmacyCard}>
              
              {/* Line 1 Pharmacy name + Custom Basket Register Total */}
              <View style={styles.pharmacyHeaderRow}>
                <Text style={styles.pharmacyNameText}>{pharmacy.name}</Text>
                {basket && basket.length > 0 && (
                  <Text style={styles.pharmacyPriceText}>₱{basketTotal.toFixed(2)}</Text>
                )}
              </View>

              {/* Line 2 Verified badge and availability indicators */}
              <View style={styles.pharmacyHeaderLine2}>
                {getVerificationBadge(pharmacy)}
                {pharmacy.verified && (
                  <View style={styles.partnerBadge}>
                    <Ionicons name="checkmark-circle-sharp" size={12} color="#065F46" />
                    <Text style={styles.partnerBadgeText}>{t.labelVerified}</Text>
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
                    {/* FIXED: Localized Itemized Table Header */}
                    <Text style={styles.itemizedTitle}>{t.labelStockStatusAtPrice}:</Text>
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
                    {/* FIXED: Localized generic available label */}
                    <Text style={styles.stockLabel}>{t.labelGeneric} {t.labelAvailable}</Text>
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
    height: 48, 
  },
  sectionTitle: {
    fontSize: 18, 
    fontWeight: '700',
    color: '#111827',
  },
  sectionSubtitle: {
    fontSize: 11, 
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
    fontSize: 12, 
    fontWeight: '600',
    color: '#4B5563',
  },
  activeFilterButtonText: {
    color: '#ffffff',
  },
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
  pharmacyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 6, 
  },
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
  pharmacyPriceText: {
    fontSize: 14, 
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
    marginBottom: 6, 
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 11, 
    fontWeight: '700',
    marginLeft: 2,
  },
  pharmacyAddress: {
    fontSize: 13, 
    color: '#6B7280',
    marginBottom: 6, 
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
    fontSize: 11, 
    fontWeight: '800',
    color: '#065F46',
    marginLeft: 4,
  },
  cardVerificationText: {
    fontSize: 12, 
    color: '#9CA3AF',
    marginBottom: 6, 
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
    flexDirection: 'column', 
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 6,
  },
  itemizedStockList: {
    width: '100%',
    marginBottom: 6,
  },
  itemizedTitle: {
    fontSize: 11, 
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
    fontSize: 13, 
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
    fontSize: 13, 
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
    fontSize: 12, 
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
    fontSize: 13, 
    color: '#6B7280',
    marginTop: 6,
    textAlign: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
});