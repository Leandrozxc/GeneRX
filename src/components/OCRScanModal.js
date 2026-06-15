import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  ScrollView, Animated, Easing, Platform, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { OCRState } from '../controllers/useOCRController';
import { ConfidenceTier, getConfidenceLabel } from '../utils/ocrMatcher';
import medicineDatabase from '../data/medicine_database.json';

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
    proceedBtn:      'Proceed to Brand Selection',
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
    proceedBtn:      'Magpatuloy sa Pili ng Brand',
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
    proceedBtn:      'Padayon sa pag-pili sa Brand',
  },
};

const TIER_COLORS = {
  HIGH:   '#16a34a',   
  MEDIUM: '#d97706',   
  LOW:    '#dc2626',   
};

export default function OCRScanModal({ visible, ocrController, language = 'en', onClose }) {
  const t = i18n[language] ?? i18n.en;
  const { ocrState, progress, matchResult, error, confirmBatch, dismissConfirmation, reset, rescan } = ocrController;

  const [selectedCandidates, setSelectedCandidates] = useState({}); // { [token]: candidateObject }
  const [approvedList, setApprovedList] = useState({}); // { [token]: candidateObject }
  const [isDropdownExpanded, setIsDropdownExpanded] = useState({}); // { [token]: boolean }

  const progressAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 300,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  }, [progress]);

  useEffect(() => {
    if (ocrState === OCRState.CONFIRMING && matchResult?.candidates?.length > 0) {
      const initialSelections = {};
      const initialApproved = {};
      const initialDropdowns = {};
      
      matchResult.candidates.forEach(group => {
        initialSelections[group.token] = group.bestMatch; // Default to best match
        initialApproved[group.token] = false; // Await explicit confirmation
        initialDropdowns[group.token] = false;
      });
      
      setSelectedCandidates(initialSelections);
      setApprovedList(initialApproved);
      setIsDropdownExpanded(initialDropdowns);
    }
  }, [ocrState, matchResult]);

  const handleClose = () => {
    reset();
    onClose?.();
  };

  const handleToggleApproval = (token, isApproved) => {
    setApprovedList(prev => ({
      ...prev,
      [token]: isApproved ? selectedCandidates[token] : null
    }));
  };

  const handleToggleDropdown = (token) => {
    setIsDropdownExpanded(prev => ({
      ...prev,
      [token]: !prev[token]
    }));
  };

  const handleSelectAlternative = (token, choice) => {
    setSelectedCandidates(prev => ({
      ...prev,
      [token]: choice
    }));
    
    setApprovedList(prev => ({
      ...prev,
      [token]: null 
    }));
    
    setIsDropdownExpanded(prev => ({
      ...prev,
      [token]: false
    }));
  };

  const handleBatchConfirm = () => {
    const verifiedList = Object.values(approvedList).filter(Boolean);
    confirmBatch(verifiedList);
  };

  const hasApproved = Object.values(approvedList).some(Boolean);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{t.scanTitle}</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn} accessibilityLabel={t.closeBtn}>
              <Ionicons name="close" size={22} color="#374151" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

            {ocrState === OCRState.SCANNING && (
              <StateView icon="camera-outline" label={t.opening} color="#2563eb" />
            )}

            {ocrState === OCRState.PROCESSING && (
              <View style={styles.processingContainer}>
                <Ionicons name="document-text-outline" size={48} color="#2563eb" />
                <Text style={styles.processingLabel}>
                  {progress < 0.5 ? t.processing : t.extracting}
                </Text>
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

            {/* CONFIRMING — Multi-Medicine Grouped Select */}
            {ocrState === OCRState.CONFIRMING && matchResult?.candidates?.length > 0 && (
              <View>
                <View style={styles.didYouMeanHeader}>
                  <Ionicons name="search-circle-outline" size={32} color="#2563eb" />
                  <Text style={styles.didYouMeanTitle}>{t.didYouMean}</Text>
                </View>

                {matchResult.candidates.map((group) => {
                  const activeCandidate = selectedCandidates[group.token];
                  const isApproved = !!approvedList[group.token];
                  const isExpanded = !!isDropdownExpanded[group.token];
                  
                  if (!activeCandidate) return null;

                  return (
                    <CandidateCard
                      key={group.token}
                      candidate={activeCandidate}
                      allCandidates={group.alternatives}
                      language={language}
                      t={t}
                      isApproved={isApproved}
                      isDropdownExpanded={isExpanded}
                      onApprove={() => handleToggleApproval(group.token, true)}
                      onReject={() => handleToggleApproval(group.token, false)}
                      onToggleDropdown={() => handleToggleDropdown(group.token)}
                      onSelectAlternative={(choice) => handleSelectAlternative(group.token, choice)}
                      onManualTrigger={dismissConfirmation}
                    />
                  );
                })}

                {/* Sticky Batch Proceed button */}
                <TouchableOpacity 
                  style={[styles.primaryActionButton, !hasApproved && styles.disabledButton]} 
                  onPress={handleBatchConfirm}
                  disabled={!hasApproved}
                >
                  <Ionicons name="arrow-forward-circle-outline" size={20} color="#fff" style={{ marginRight: 6 }} />
                  <Text style={styles.primaryActionText}>{t.proceedBtn}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.manualBtn} onPress={dismissConfirmation}>
                  <Text style={styles.manualBtnText}>{t.searchManually}</Text>
                </TouchableOpacity>
              </View>
            )}

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

// Rebuilt Candidate Card to act as an explicit toggle select container with custom accordion dropdown correction
function CandidateCard({ 
  candidate, 
  allCandidates, 
  language, 
  t, 
  isApproved, 
  isDropdownExpanded,
  onApprove,
  onReject,
  onToggleDropdown,
  onSelectAlternative,
  onManualTrigger
}) {
  const tierColor = TIER_COLORS[candidate.tier] || '#6b7280';
  const confidenceLabel = getConfidenceLabel(candidate.tier, language);
  const confidencePct = Math.round(candidate.confidence * 100);

  const prefix = language === 'fil' ? 'Ito ba ay' : language === 'ceb' ? 'Kini ba ang' : 'Is this';
  const changeText = language === 'fil' ? 'Baguhin' : language === 'ceb' ? 'Baguhon' : 'Change';

  // FIXED: Remaining choices list stays completely static (it does not shift or jump on click)
  let remainingChoices = allCandidates;
  if (remainingChoices.length === 0 && allCandidates.length > 0) {
    const fallbackMeds = medicineDatabase
      .map(med => ({
        ...med,
        confidence: 0.5,
        tier: 'LOW',
        scanned_token: candidate.scanned_token
      }));
    remainingChoices = fallbackMeds.slice(0, 3);
  }

  const displayDosage = candidate.detected_dosage || candidate.strength;

  return (
    <View style={[styles.candidateCard, isApproved && styles.candidateCardApproved]}>
      
      {/* Checkbox Header */}
      <View style={styles.shopeeRowHeader}>
        <View style={{ flex: 1, paddingRight: 8 }}>
          <Text style={styles.didYouMeanPrefix}>{prefix}...</Text>
          <Text style={styles.candidateName}>{candidate.brand_name}</Text>
          <Text style={styles.candidateGenericSubtitle}>
            ({candidate.generic_name} {displayDosage})
          </Text>
        </View>
        <TouchableOpacity 
          style={[styles.modalCheckbox, isApproved && styles.modalCheckboxActive]}
          onPress={() => {
            if (isApproved) {
              onReject();
            } else {
              onApprove();
            }
          }}
        >
          {isApproved && <Ionicons name="checkmark" size={12} color="#ffffff" />}
        </TouchableOpacity>
      </View>

      <View style={[styles.confidenceBadge, { backgroundColor: tierColor + '1A', borderColor: tierColor }]}>
        <View style={[styles.confidenceDot, { backgroundColor: tierColor }]} />
        <Text style={[styles.confidenceText, { color: tierColor }]}>
          {confidenceLabel} — {confidencePct}%
        </Text>
      </View>

      <View style={styles.metaContainer}>
        {candidate.strength && (
          <MetaRow icon="medical-outline" label={t.dosage} value={displayDosage} />
        )}
        {candidate.active_ingredient && (
          <MetaRow icon="flask-outline" label={t.ingredient} value={candidate.active_ingredient} />
        )}
      </View>

      {/* Approve vs Change Accordion Action Row */}
      <View style={styles.candidateActions}>
        <TouchableOpacity 
          style={[styles.confirmBtn, isApproved && { backgroundColor: '#16a34a', borderColor: '#16a34a' }]} 
          onPress={onApprove}
        >
          <Ionicons name="checkmark" size={14} color="#fff" style={{ marginRight: 4 }} />
          <Text style={styles.confirmBtnText}>{t.confirmBtn}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.rejectBtn, isDropdownExpanded && { backgroundColor: '#fef2f2', borderColor: '#fca5a5' }]} 
          onPress={onToggleDropdown}
        >
          <Ionicons name={isDropdownExpanded ? "chevron-up" : "chevron-down"} size={14} color={isDropdownExpanded ? "#b91c1c" : "#6b7280"} style={{ marginRight: 4 }} />
          <Text style={[styles.rejectBtnText, isDropdownExpanded && { color: '#b91c1c', fontWeight: '700' }]}>
            {changeText}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Collapsible Dropdown list of ranked alternative matches */}
      {isDropdownExpanded && remainingChoices.length > 0 && (
        <View style={styles.ocrDropdownMenu}>
          <Text style={styles.ocrDropdownHeader}>
            {language === 'fil' ? 'MGA POSIBLENG PILIIN (Naka-order):' : language === 'ceb' ? 'MGA POSIBLENG PILION:' : 'POSSIBLE MATCHES:'}
          </Text>
          
          {remainingChoices.map((choice, index) => {
            const choicePct = Math.round(choice.confidence * 100);
            return (
              <TouchableOpacity
                key={index}
                style={styles.ocrDropdownItemRow}
                onPress={() => onSelectAlternative(choice)}
              >
                <Ionicons name="ellipse-outline" size={12} color="#0d9488" style={{ marginRight: 8 }} />
                <Text style={styles.ocrDropdownItemText}>
                  {choice.generic_name} ({choice.brand_name || 'Generic'})
                </Text>
                <Text style={styles.ocrDropdownItemPct}>{choicePct}% Match</Text>
              </TouchableOpacity>
            );
          })}

          {/* Path A: "Wala rito ang aking gamot" dropdown item row that triggers the MANUAL fallback layout */}
          <TouchableOpacity
            style={[styles.ocrDropdownItemRow, { borderTopWidth: 1, borderTopColor: '#e5e7eb', marginTop: 4 }]}
            onPress={onManualTrigger}
          >
            <Ionicons name="pencil-outline" size={12} color="#dc2626" style={{ marginRight: 8 }} />
            <Text style={[styles.ocrDropdownItemText, { color: '#dc2626', fontWeight: '700' }]}>
              {language === 'fil' ? '✏️ Wala rito ang aking gamot...' : language === 'ceb' ? '✏️ Wala diri ang akong tambal...' : '✏️ My medicine is not here...'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
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

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%', 
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
    fontSize: 18, 
    fontWeight: '700',
    color: '#111827',
  },
  content: {
    padding: 20,
  },
  processingContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  processingLabel: {
    fontSize: 14, 
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
    fontSize: 12, 
    color: '#6b7280',
    marginTop: 8,
  },
  didYouMeanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  didYouMeanTitle: {
    fontSize: 15, 
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
  candidateCardApproved: {
    borderColor: '#16a34a',
    backgroundColor: '#f0fdf4', 
  },
  shopeeRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  modalCheckboxActive: {
    backgroundColor: '#16a34a',
    borderColor: '#16a34a',
  },
  didYouMeanPrefix: {
    fontSize: 12, 
    color: '#6b7280',
    marginBottom: 2,
  },
  candidateName: {
    fontSize: 15, 
    fontWeight: '800',
    color: '#111827',
  },
  candidateGenericSubtitle: {
    fontSize: 13, // Card secondary label: 13sp
    color: '#4b5563',
    marginTop: 2,
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
    fontSize: 11, 
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
    fontSize: 12, 
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
    gap: 8,
  },
  confirmBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#2563eb',
  },
  confirmBtnText: {
    color: '#ffffff',
    fontSize: 13, 
    fontWeight: '700',
  },
  rejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  rejectBtnText: {
    fontSize: 12, 
    color: '#6b7280',
  },
  manualBtn: {
    marginTop: 10,
    alignItems: 'center',
    justifyContent: 'center', 
  },
  manualBtnText: {
    fontSize: 13, 
    color: '#2563eb',
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  primaryActionButton: {
    backgroundColor: '#0d9488',
    borderRadius: 14,
    height: 56, 
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 18,
    width: '100%',
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
  },
  primaryActionText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 13,
  },
  stateView: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  stateLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 15,
    textAlign: 'center',
  },
  noMatchContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    width: '100%',
  },
  noMatchTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginTop: 12,
    marginBottom: 6,
    textAlign: 'center',
  },
  noMatchSub: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
  },
  rescanBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    height: 56, 
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center', 
    flexDirection: 'row',
    marginBottom: 10,
  },
  rescanBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
    marginLeft: 6,
  },
  manualFallbackBtn: {
    height: 48,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center', 
  },
  manualFallbackText: {
    fontSize: 13,
    color: '#2563eb',
    fontWeight: '600',
  },
  ocrDropdownMenu: {
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    width: '100%',
  },
  ocrDropdownHeader: {
    fontSize: 11, 
    fontWeight: '800',
    color: '#4b5563',
    marginBottom: 8,
  },
  ocrDropdownItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    width: '100%',
  },
  ocrDropdownItemText: {
    fontSize: 13, 
    color: '#1f2937',
    fontWeight: '600',
    flex: 1,
  },
  ocrDropdownItemPct: {
    fontSize: 11, 
    color: '#0d9488',
    fontWeight: '700',
  },
});