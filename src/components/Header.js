import React from 'react';
import { StyleSheet, Text, View, Platform, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../context/LanguageContext';

export default function Header({ onAboutPress }) {
  const { t, currentLanguage, switchLanguage } = useLanguage();

  return (
    <View style={styles.header}>
      <View style={styles.headerTopRow}>
        <View>
          <Text style={styles.headerSubtitle}>Civic Technology Portal</Text>
          <Text style={styles.headerTitle}>GeneRX</Text>
        </View>
        <View style={styles.rightGroup}>
          <TouchableOpacity style={styles.aboutButton} onPress={onAboutPress}>
            <Ionicons name="information-circle" size={14} color="#0D9488" style={{ marginRight: 4 }} />
            <Text style={styles.aboutButtonText}>{t.learnMore}</Text>
          </TouchableOpacity>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>RA 6675</Text>
          </View>
        </View>
      </View>

      {/* Step 4: Three-option language pill switcher row */}
      <View style={styles.switcherContainer}>
        <TouchableOpacity 
          style={[styles.pill, currentLanguage === 'filipino' ? styles.pillSelected : styles.pillUnselected]}
          onPress={() => switchLanguage('filipino')}
        >
          <Text style={[styles.pillText, currentLanguage === 'filipino' ? styles.pillTextSelected : styles.pillTextUnselected]}>
            Filipino
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.pill, currentLanguage === 'english' ? styles.pillSelected : styles.pillUnselected]}
          onPress={() => switchLanguage('english')}
        >
          <Text style={[styles.pillText, currentLanguage === 'english' ? styles.pillTextSelected : styles.pillTextUnselected]}>
            English
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.pill, currentLanguage === 'cebuano' ? styles.pillSelected : styles.pillUnselected]}
          onPress={() => switchLanguage('cebuano')}
        >
          <Text style={[styles.pillText, currentLanguage === 'cebuano' ? styles.pillTextSelected : styles.pillTextUnselected]}>
            Cebuano
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'web' ? 38 : 45,
    paddingBottom: 12,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  headerSubtitle: {
    fontSize: 9,
    fontWeight: '700',
    color: '#0D9488',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 16, // FIX 6: Header app title: 16
    fontWeight: '800',
    color: '#1F2937',
    marginTop: 1,
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aboutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F0FDFA',
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  aboutButtonText: {
    fontSize: 12, // FIX 6: Button text (small): 12
    fontWeight: '700',
    color: '#0F766E',
  },
  badge: {
    backgroundColor: '#CCFBF1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11, // FIX 6: Badge / tag text: 11
    fontWeight: '700',
    color: '#0D9488',
  },
  switcherContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    width: '100%',
  },
  pill: {
    height: 28, // Strict height rules
    paddingHorizontal: 10,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 3,
  },
  pillSelected: {
    backgroundColor: '#01696f',
  },
  pillUnselected: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#01696f',
  },
  pillText: {
    fontSize: 12, // FIX 6: Button text (small): 12
  },
  pillTextSelected: {
    color: '#ffffff',
    fontWeight: '700',
  },
  pillTextUnselected: {
    color: '#01696f',
    fontWeight: '400',
  },
});