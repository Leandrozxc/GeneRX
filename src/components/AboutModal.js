import React from 'react';
import { StyleSheet, Text, View, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../context/LanguageContext';

export default function AboutModal({ visible, onClose }) {
  const { t } = useLanguage();

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Ionicons name="information-circle-outline" size={20} color="#0D9488" />
            <Text style={styles.title}>{t.aboutTitle}</Text>
          </View>

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>{t.aboutSection1Title}</Text>
              <Text style={styles.bodyText}>
                {t.aboutSection1Body}
              </Text>
            </View>

            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>{t.aboutSection2Title}</Text>
              <Text style={styles.bodyText}>
                {t.aboutSection2Body}
              </Text>
            </View>

            <View style={styles.sectionCard}>
              <Text style={styles.warningTitle}>⚠️ {t.ntiWarning.split(':')[0]}:</Text>
              <View style={styles.listItem}>
                <Ionicons name="close-circle" size={16} color="#DC2626" style={{ marginRight: 6 }} />
                <Text style={styles.bodyText}>{t.aboutSection3Body.split('.')[0]}.</Text>
              </View>
              <View style={styles.listItem}>
                <Ionicons name="close-circle" size={16} color="#DC2626" style={{ marginRight: 6 }} />
                <Text style={styles.bodyText}>{t.aboutSection3Body.split('.')[1]}.</Text>
              </View>
              <View style={styles.listItem}>
                <Ionicons name="close-circle" size={16} color="#DC2626" style={{ marginRight: 6 }} />
                <Text style={styles.bodyText}>{t.aboutSection3Body.split('.')[2]}.</Text>
              </View>
            </View>

            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>{t.aboutSection4Title}</Text>
              <Text style={styles.bodyText}>
                {t.aboutSection4Body}
              </Text>
            </View>
          </ScrollView>

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>{t.aboutClose}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  container: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#F3F4F6',
    paddingBottom: 14,
    marginBottom: 16,
  },
  title: {
    fontSize: 18, // FIX 6: Screen/page titles: 18
    fontWeight: '900',
    color: '#111827',
    marginLeft: 10,
  },
  scrollArea: {
    marginBottom: 16,
  },
  sectionCard: {
    marginBottom: 20,
    backgroundColor: '#F9FAFB',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 14, // FIX 6: Section headers: 14
    fontWeight: '800',
    color: '#0D9488',
    marginBottom: 8,
  },
  warningTitle: {
    fontSize: 14, // FIX 6: Section headers: 14
    fontWeight: '800',
    color: '#B91C1C',
    marginBottom: 6,
  },
  bodyText: {
    fontSize: 13, // FIX 6: Body descriptions: 13
    color: '#374151',
    lineHeight: 18,
    flex: 1,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
  },
  closeButton: {
    backgroundColor: '#0D9488',
    height: 56, 
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 13, // FIX 6: Button text (primary): 13
    fontWeight: '800',
  },
});