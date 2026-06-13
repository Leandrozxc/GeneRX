import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../context/LanguageContext';

export default function AdherenceScreen({ refillDaysLeft, logs, onLocateRefillStock }) {
  const { t } = useLanguage();

  return (
    <View style={styles.screenWrapper}>
      <Text style={styles.sectionTitle}>{t.tabAdherence}</Text>
      <View style={styles.refillCard}>
        <View style={styles.refillHeader}>
          <Ionicons name="alarm" size={24} color="#F59E0B" />
          <View style={styles.refillTextContainer}>
            <Text style={styles.refillAlertTitle}>Refill Due</Text>
            <Text style={styles.refillAlertSub}>{t.advisoryBar}</Text>
          </View>
        </View>
        
        <View style={styles.daysContainer}>
          <Text style={styles.daysNumber}>{refillDaysLeft}</Text>
          <Text style={styles.daysLabelText}>{t.labelLastUpdated}</Text>
        </View>

        <TouchableOpacity 
          style={styles.refillActionButton} 
          onPress={onLocateRefillStock}
        >
          <Text style={styles.refillActionText}>{t.findPharmacy}</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.sectionTitle, { marginTop: 24 }]}>{t.tabAdherence}</Text>
      <Text style={styles.sectionSubtitle}>{t.advisoryBar}</Text>
      
      {logs.map((log, index) => (
        <View key={index} style={styles.logCard}>
          <View style={styles.logLeft}>
            <Ionicons 
              name={log.status === 'Taken' ? "checkmark-circle" : "alert-circle"} 
              size={18} 
              color={log.status === 'Taken' ? "#10B981" : "#EF4444"} 
            />
            <View style={styles.logTextGroup}>
              <Text style={styles.logName}>{log.name}</Text>
              <Text style={styles.logDrug}>{log.drug} • {log.time}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: log.status === 'Taken' ? '#D1FAE5' : '#FEE2E2' }]}>
            <Text style={[styles.statusText, { color: log.status === 'Taken' ? '#10B981' : '#EF4444' }]}>
              {log.status === 'Taken' ? t.labelAvailable : t.labelOutOfStock}
            </Text>
          </View>
        </View>
      ))}

      <View style={styles.infoBox}>
        <Ionicons name="chatbubbles-outline" size={20} color="#0D9488" />
        <Text style={styles.infoBoxText}>
          {t.aboutSection4Body}
        </Text>
      </View>
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
  refillCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: 14,
  },
  refillHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  refillTextContainer: {
    marginLeft: 10,
    flex: 1,
  },
  refillAlertTitle: {
    fontSize: 14, // FIX 6: Section headers: 14
    fontWeight: '700',
    color: '#78350F',
  },
  refillAlertSub: {
    fontSize: 11, // FIX 6: Footer / disclaimer text: 11
    color: '#B45309',
  },
  daysContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#FEF3C7',
    marginBottom: 12,
  },
  daysNumber: {
    fontSize: 18, // FIX 6: Screen limit maximum: 18
    fontWeight: '900',
    color: '#D97706',
  },
  daysLabelText: {
    fontSize: 12, // FIX 6: Timestamp / date text: 12
    color: '#6B7280',
    fontWeight: '600',
  },
  refillActionButton: {
    backgroundColor: '#D97706',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  refillActionText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13, // FIX 6: Button text (primary): 13
  },
  logCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    width: '100%',
  },
  logLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logTextGroup: {
    marginLeft: 8,
  },
  logName: {
    fontSize: 15, // FIX 6: Card primary label: 15
    fontWeight: '700',
    color: '#1F2937',
  },
  logDrug: {
    fontSize: 13, // FIX 6: Card secondary label: 13
    color: '#6B7280',
    marginTop: 1,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 11, // FIX 6: Badge / tag text: 11
    fontWeight: '700',
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
});