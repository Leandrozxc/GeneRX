import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../context/LanguageContext';

export default function ListScreen({ 
  basket, 
  basketSummary, 
  onRemoveItem, 
  onNavigateToSearch,
  onNavigateToMap,
  rxConfirmed,
  setRxConfirmed
}) {
  const { t, currentLanguage } = useLanguage();

  const getSavingsLabel = () => {
    if (currentLanguage === 'cebuano') return 'Tipid';
    if (currentLanguage === 'english') return 'Save';
    return 'Tipid';
  };

  return (
    <View style={styles.screenWrapper}>
      <Text style={styles.sectionTitle}>{t.tabList}</Text>
      
      {basket.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="cart-outline" size={48} color="#9CA3AF" style={{ marginBottom: 12 }} />
          <Text style={styles.emptyText}>{t.listEmpty}</Text>
          <TouchableOpacity 
            style={styles.primaryActionButton}
            onPress={onNavigateToSearch}
          >
            <Ionicons name="search" size={16} color="#fff" />
            <Text style={styles.primaryActionText}>{t.tabSearch}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={{ width: '100%' }}>
          <Text style={styles.sectionSubtitle}>
            {t.mapDisclaimer}
          </Text>

          {basket.map((item) => (
            <View key={item.drugId} style={styles.pharmacyCard}>
              <View style={styles.pharmacyHeaderRow}>
                <Text style={styles.pharmacyNameText}>{item.brandName} ({item.genericName})</Text>
                <Text style={styles.pharmacyPriceText}>₱{item.chosenAlternative.price.toFixed(2)}</Text>
              </View>

              <View style={styles.pharmacyHeaderLine2}>
                <View style={[styles.statusBadge, { backgroundColor: '#EFF6FF' }]}>
                  <Text style={[styles.statusText, { color: '#2563EB' }]}>{item.chosenAlternative.manufacturer}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: '#F3F4F6' }]}>
                  <Text style={[styles.statusText, { color: '#374151' }]}>FDA: {item.chosenAlternative.fda_id}</Text>
                </View>
              </View>

              {/* FIXED: Localized Branded Price label */}
              <Text style={styles.pharmacyAddress}>{t.labelBrandedPrice}: ₱{item.brandedPrice.toFixed(2)}</Text>

              <View style={{ marginBottom: 6 }} />

              <View style={styles.stockStatusContainer}>
                <TouchableOpacity 
                  style={styles.removeButton}
                  onPress={() => onRemoveItem(item.drugId)}
                >
                  <Ionicons name="trash-outline" size={14} color="#EF4444" />
                  <Text style={styles.removeButtonText}>{t.removeFromList}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {/* Cumulative Shopee Checkout Summary card */}
          <View style={styles.shopeeSummaryCard}>
            {/* FIXED: Localized Card Header */}
            <Text style={styles.summaryTitle}>{t.labelSummaryTitle}</Text>
            
            <View style={styles.summaryItemRow}>
              {/* FIXED: Localized Label */}
              <Text style={styles.summaryItemLabel}>{t.labelBrandedTotal}:</Text>
              <Text style={styles.summaryItemValue}>₱{basketSummary.brandedCost.toFixed(2)}</Text>
            </View>

            <View style={styles.summaryItemRow}>
              {/* FIXED: Localized Label */}
              <Text style={styles.summaryItemLabel}>{t.labelGenericTotal}:</Text>
              <Text style={styles.summaryItemValue}>₱{basketSummary.genericCost.toFixed(2)}</Text>
            </View>

            <View style={styles.summarySavingsRow}>
              {/* FIXED: Localized Label */}
              <Text style={styles.savingsLabel}>{t.labelTotalSavings}:</Text>
              <Text style={styles.savingsValue}>₱{basketSummary.savings.toFixed(2)} ({basketSummary.percentage}% {getSavingsLabel()})</Text>
            </View>
          </View>

          {/* Prescription safety gating step */}
          {!rxConfirmed ? (
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
              <Text style={styles.primaryActionText}>
                {t.findPharmacy} ({getSavingsLabel()}: ₱{basketSummary.savings.toFixed(2)})
              </Text>
            </TouchableOpacity>
          )}
        </View>
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
    marginBottom: 20,
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
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 11, 
    fontWeight: '700',
  },
  pharmacyAddress: {
    fontSize: 13, 
    color: '#6B7280',
    marginBottom: 6,
  },
  stockStatusContainer: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 6,
    alignItems: 'flex-end',
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    height: 36,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
  },
  removeButtonText: {
    fontSize: 12, 
    fontWeight: '700',
    color: '#EF4444',
    marginLeft: 4,
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
    width: '100%',
  },
  primaryActionText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 13,
    marginLeft: 6,
  },
});