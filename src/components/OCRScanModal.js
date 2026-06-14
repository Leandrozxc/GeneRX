/**
 * GeneRX OCRScanModal
 *
 * Full-screen modal overlay that drives the prescription scanning experience.
 * Renders a different view per OCR state:
 *
 *   IDLE        → not visible (parent controls visibility)
 *   SCANNING    → "Opening camera…" spinner
 *   PROCESSING  → animated progress bar with status text
 *   CONFIRMING  → "Did you mean?" card stack
 *   MANUAL      → "No match" prompt with manual search CTA
 *   ERROR       → error message with retry button
 *
 * Props:
 *   visible       {boolean}
 *   ocrController {ReturnType<useOCRController>}
 *   language      {'en'|'fil'|'ceb'}
 *   onClose       {() => void}
 */

import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  ScrollView, Animated, Easing, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { OCRState } from '../controllers/useOCRController';
import { ConfidenceTier, getConfidenceLabel } from '../utils/ocrMatcher';

// ─── Localisation strings ─────────────────────────────────────────────────────
const i18n = {
  en: {
    scanTitle:       'Scan Prescription',
    opening:         'Opening camera…',
    processing:      'Reading prescription…',
    extracting:      'Extracting medicine names…',
    didYouMean:      'Did you mean?',
    confirmBtn:      'Yes, that\'s it',
    notThisBtn:      'Not this one',
    searchManually:  'Search manually instead',
    noMatch:         'Could not read medicine name',
    noMatchSub:      'The scan didn\'t find a recognisable medicine. Try searching by name below.',
    retryBtn:        'Scan again',
    closeBtn:        'Close',
    errorTitle:      'Scan failed',
    retryLabel:      'Retry',
    dosage:          'Common dosage',
    ingredient:      'Active ingredient',
    brandAlso:       'Also sold as',
    confidence:      'Match confidence',
    rawTextLabel:    'Detected text (debug)',
  },
  fil: {
    scanTitle:       'I-scan ang Reseta',
    opening:         'Binubuksan ang camera…',
    processing:      'Binabasa ang reseta…',
    extracting:      'Kinukuha ang pangalan ng gamot…',
    didYouMean:      'Ito ba ang ibig mong sabihin?',
    confirmBtn:      'Oo, tama iyan',
    notThisBtn:      'Hindi ito',
    searchManually:  'Maghanap nang manu-mano',
    noMatch:         'Hindi nakilala ang pangalan ng gamot',
    noMatchSub:      'Hindi nakita ng scan ang gamot. Subukan ang manu-manong paghahanap.',
    retryBtn:        'I-scan muli',
    closeBtn:        'Isara',
    errorTitle:      'Nabigo ang pag-scan',
    retryLabel:      'Subukan muli',
    dosage:          'Karaniwang dosis',
    ingredient:      'Aktibong sangkap',
    brandAlso:       'Kilala rin bilang',
    confidence:      'Katumpakan',
    rawTextLabel:    'Nakitang teksto (debug)',
  },
  ceb: {
    scanTitle:       'I-scan ang Reseta',
    opening:         'Gibuksan ang camera…',
    processing:      'Gibabasa ang reseta…',
    extracting:      'Gikuha ang ngalan sa tambal…',
    didYouMean:      'Mao ba kini ang imong gipasabot?',
    confirmBtn:      'Oo, mao kana',
    notThisBtn:      'Dili kini',
    searchManually:  'Pangitaa og manual',
    noMatch:         'Wala makit-i ang ngalan sa tambal',
    noMatchSub:      'Wala makit-i sa scan ang tambal. Sulayi ang manual nga pagpangita.',
    retryBtn:        'I-scan pag-usab',
    closeBtn:        'Sirado',
    errorTitle:      'Napakyas ang pag-scan',
    retryLabel:      'Sulayi pag-usab',
    dosage:          'Kasagarang dosis',
    ingredient:      'Aktibong sangkap',
    brandAlso:       'Nailhan usab nga',
    confidence:      'Katukma',
    rawTextLabel:    'Nakitang teksto (debug)',
  },
};

// ─── Confidence colours ───────────────────────────────────────────────────────
const TIER_COLORS = {
  HIGH:   '#16a34a',   // green
  MEDIUM: '#d97706',   // amber
  LOW:    '#dc2626',   // red
};
// ─── Component ────────────────────────────────────────────────────────────────
export default function OCRScanModal({ visible, ocrController, language = 'en', onClose }) {
  const t = i18n[language] ?? i18n.en;
  const { ocrState, progress, matchResult, error, confirmCandidate, dismissConfirmation, reset, rescan } = ocrController;

  // Animated progress bar
  const progressAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 300,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const handleClose = () => {
    reset();
    onClose?.();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>

          {/* ── Header ── */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{t.scanTitle}</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn} accessibilityLabel={t.closeBtn}>
              <Ionicons name="close" size={22} color="#374151" />
            </TouchableOpacity>
          </View>

          {/* ── Content per state ── */}
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

            {/* SCANNING */}
            {ocrState === OCRState.SCANNING && (
              <StateView icon="camera-outline" label={t.opening} color="#2563eb" />
            )}

            {/* PROCESSING */}
            {ocrState === OCRState.PROCESSING && (
              <View style={styles.processingContainer}>
                <Ionicons name="document-text-outline" size={48} color="#2563eb" />
                <Text style={styles.processingLabel}>
                  {progress < 0.5 ? t.processing : t.extracting}
                </Text>
                {/* Progress bar */}
                <View style={styles.progressTrack}>
                  <Animated.View
                    style={[
                      styles.progressFill,
                      { width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) },
                    ]}
                  />
                </View>
                <Text style={styles.progressPct}>{Math.round(progress * 100)}%</Text>
              </View>
            )}

            {/* CONFIRMING — "Did you mean?" */}
            {ocrState === OCRState.CONFIRMING && matchResult?.candidates?.length > 0 && (
              <View>
                <View style={styles.didYouMeanHeader}>
                  <Ionicons name="search-circle-outline" size={32} color="#2563eb" />
                  <Text style={styles.didYouMeanTitle}>{t.didYouMean}</Text>
                </View>

                {matchResult.candidates.map((candidate, idx) => (
                  <CandidateCard
                    key={`${candidate.generic_name}-${idx}`} // Correct snake_case key
                    candidate={candidate}
                    language={language}
                    t={t}
                    isPrimary={idx === 0}
                    onConfirm={() => confirmCandidate(candidate)}
                    onReject={dismissConfirmation}
                  />
                ))}

                <TouchableOpacity style={styles.manualBtn} onPress={dismissConfirmation}>
                  <Ionicons name="pencil-outline" size={16} color="#6b7280" />
                  <Text style={styles.manualBtnText}>{t.searchManually}</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* MANUAL — No match */}
            {ocrState === OCRState.MANUAL && (
              <View style={styles.noMatchContainer}>
                <Ionicons name="alert-circle-outline" size={52} color="#d97706" />
                <Text style={styles.noMatchTitle}>{t.noMatch}</Text>
                <Text style={styles.noMatchSub}>{t.noMatchSub}</Text>
                <TouchableOpacity style={styles.rescanBtn} onPress={rescan}>
                  <Ionicons name="refresh-outline" size={18} color="#fff" />
                  <Text style={styles.rescanBtnText}>{t.retryBtn}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.manualFallbackBtn} onPress={handleClose}>
                  <Text style={styles.manualFallbackText}>{t.searchManually}</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ERROR */}
            {ocrState === OCRState.ERROR && (
              <View style={styles.noMatchContainer}>
                <Ionicons name="close-circle-outline" size={52} color="#dc2626" />
                <Text style={styles.noMatchTitle}>{t.errorTitle}</Text>
                <Text style={styles.noMatchSub}>{error ?? 'Unknown error'}</Text>
                <TouchableOpacity style={styles.rescanBtn} onPress={rescan}>
                  <Ionicons name="refresh-outline" size={18} color="#fff" />
                  <Text style={styles.rescanBtnText}>{t.retryLabel}</Text>
                </TouchableOpacity>
              </View>
            )}

          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ─── Candidate Card ───────────────────────────────────────────────────────────
// ─── Candidate Card ───────────────────────────────────────────────────────────
function CandidateCard({ candidate, language, t, isPrimary, onConfirm, onReject }) {
  const tierColor = TIER_COLORS[candidate.tier] || '#6b7280';
  const confidenceLabel = getConfidenceLabel(candidate.tier, language);
  const confidencePct = Math.round(candidate.confidence * 100);

  // Localized prefix for "Is this..." (12px secondary text)
  const prefix = language === 'fil' ? 'Ito ba ay' : language === 'ceb' ? 'Kini ba ang' : 'Is this';

  return (
    <View style={[styles.candidateCard, isPrimary && styles.candidateCardPrimary]}>
      {/* Visual Hierarchy: Prefix (12px) then Drug Name (15px) */}
      <View style={{ marginBottom: 4 }}>
        <Text style={styles.didYouMeanPrefix}>{prefix}...</Text>
        <Text style={styles.candidateName}>{candidate.generic_name}</Text>
      </View>

      <View style={[styles.confidenceBadge, { backgroundColor: tierColor + '1A', borderColor: tierColor }]}>
        <View style={[styles.confidenceDot, { backgroundColor: tierColor }]} />
        <Text style={[styles.confidenceText, { color: tierColor }]}>
          {confidenceLabel} — {confidencePct}%
        </Text>
      </View>

      {/* Metadata Section */}
      <View style={styles.metaContainer}>
        {candidate.brand_name && (
          <MetaRow icon="pricetag-outline" label={t.brandAlso} value={candidate.brand_name} />
        )}
        
        {candidate.strength && (
          <MetaRow icon="medical-outline" label={t.dosage} value={candidate.strength} />
        )}

        {candidate.active_ingredient && (
          <MetaRow icon="flask-outline" label={t.ingredient} value={candidate.active_ingredient} />
        )}
      </View>

      <View style={styles.candidateActions}>
        <TouchableOpacity style={styles.confirmBtn} onPress={onConfirm}>
          <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
          <Text style={styles.confirmBtnText}>{t.confirmBtn}</Text>
        </TouchableOpacity>
        {isPrimary && (
          <TouchableOpacity style={styles.rejectBtn} onPress={onReject}>
            <Text style={styles.rejectBtnText}>{t.notThisBtn}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function MetaRow({ icon, label, value }) {
  return (
    <View style={styles.metaRow}>
      <Ionicons name={icon} size={13} color="#6b7280" style={{ marginRight: 4 }} />
      <Text style={styles.metaLabel}>{label}: </Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

function StateView({ icon, label, color }) {
  return (
    <View style={styles.stateView}>
      <Ionicons name={icon} size={56} color={color} />
      <Text style={[styles.stateLabel, { color }]}>{label}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%', // Adjusted for 812px height chassis
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  headerTitle: {
    fontSize: 18, // Hierarchy: Screen titles
    fontWeight: '700',
    color: '#111827',
  },
  content: {
    padding: 20,
  },

  // Processing
  processingContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  processingLabel: {
    fontSize: 14, // Hierarchy: Section headers
    fontWeight: '600',
    color: '#374151',
    marginBottom: 15,
  },
  progressTrack: {
    width: '100%',
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2563eb',
  },
  progressPct: {
    fontSize: 12, // Hierarchy: Timestamp/minor text
    color: '#6b7280',
    marginTop: 8,
  },

  // Candidate card
  didYouMeanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  didYouMeanTitle: {
    fontSize: 15, // Hierarchy: Primary label
    fontWeight: '700',
    marginLeft: 8,
  },
  candidateCard: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  candidateCardPrimary: {
    borderColor: '#2563eb',
    backgroundColor: '#f8faff',
  },
  didYouMeanPrefix: {
    fontSize: 12, // Hierarchy: Timestamp size for secondary info
    color: '#6b7280',
    marginBottom: 2,
  },
  candidateName: {
    fontSize: 15, // Hierarchy: Card primary label
    fontWeight: '800',
    color: '#111827',
  },
  confidenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
    marginBottom: 12,
  },
  confidenceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  confidenceText: {
    fontSize: 11, // Hierarchy: Badge/tag text
    fontWeight: '700',
  },
  metaContainer: {
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  metaLabel: {
    fontSize: 12, // Hierarchy: Detailed meta
    color: '#6b7280',
  },
  metaValue: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  candidateActions: {
    flexDirection: 'row',
    marginTop: 4,
  },
  confirmBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 10,
    marginRight: 8,
  },
  confirmBtnText: {
    color: '#ffffff',
    fontSize: 13, // Hierarchy: Button text
    fontWeight: '700',
  },
  rejectBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  rejectBtnText: {
    fontSize: 12, // Hierarchy: Small button text
    color: '#6b7280',
  },
  manualBtnText: {
    fontSize: 13, // Hierarchy: Body descriptions
    color: '#2563eb',
    textAlign: 'center',
    marginTop: 10,
    textDecorationLine: 'underline',
  },
});
