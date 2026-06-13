import React from 'react';
import { StyleSheet, View, ScrollView, SafeAreaView, Platform } from 'react-native';

// Language Context Layer
import { LanguageProvider } from './src/context/LanguageContext';

// Controller (Hook)
import { useAppController } from './src/controllers/useAppController';

// Shared View Components
import Header from './src/components/Header';
import TabBar from './src/components/TabBar';
import AboutModal from './src/components/AboutModal';

// Screen Views
import SearchScreen from './src/screens/SearchScreen';
import MapScreen from './src/screens/MapScreen';
import AdherenceScreen from './src/screens/AdherenceScreen';

export default function App() {
  const controller = useAppController();
  const isWeb = Platform.OS === 'web';

  const renderAppContent = () => {
    return (
      <LanguageProvider>
        <SafeAreaView style={styles.appContainer}>
          {/* View Component: Top Header with About toggle binder */}
          <Header onAboutPress={() => controller.setAboutModalVisible(true)} />

          {/* Scrollable Core Screens */}
          <ScrollView 
            style={styles.scrollView} 
            contentContainerStyle={styles.scrollContent} 
            showsVerticalScrollIndicator={false}
          >
            {controller.currentScreen === 'search' && (
              <SearchScreen 
                searchQuery={controller.searchQuery}
                onSearch={controller.handleSearch}
                isScanning={controller.isScanning}
                triggerMockOCR={controller.triggerMockOCR}
                selectedDrug={controller.selectedDrug}
                handleReportPrice={controller.handleReportPrice}
                onNavigateToMap={() => {
                  controller.setCurrentScreen('map');
                }}
                isNarrowTherapeutic={controller.isNarrowTherapeutic}
                rxConfirmed={controller.rxConfirmed}
                setRxConfirmed={controller.setRxConfirmed}
                pharmacistModeVisible={controller.pharmacistModeVisible}
                setPharmacistModeVisible={controller.setPharmacistModeVisible}
                pharmacistSelectedAlt={controller.pharmacistSelectedAlt}
                handleOpenPharmacistMode={controller.handleOpenPharmacistMode}
                isNearestPharmacyVerified={controller.isNearestPharmacyVerified}
              />
            )}

            {controller.currentScreen === 'map' && (
              <MapScreen 
                pharmacies={controller.pharmacies}
                selectedDrug={controller.selectedDrug}
                recentlyVerifiedOnly={controller.recentlyVerifiedOnly}
                setRecentlyVerifiedOnly={controller.setRecentlyVerifiedOnly}
                partnerModalVisible={controller.partnerModalVisible}
                setPartnerModalVisible={controller.setPartnerModalVisible}
                handleUpdatePharmacyStock={controller.handleUpdatePharmacyStock}
                allOriginalDrugs={controller.allOriginalDrugs}
                allOriginalPharmacies={controller.allOriginalPharmacies}
              />
            )}

            {controller.currentScreen === 'adherence' && (
              <AdherenceScreen 
                refillDaysLeft={controller.refillDaysLeft}
                logs={controller.logs}
                onLocateRefillStock={() => {
                  controller.setCurrentScreen('map');
                  if (controller.pharmacies.length > 0) {
                    controller.handleSearch('Norvasc');
                  }
                }}
              />
            )}
          </ScrollView>

          {/* View Component: Bottom Navigation tab bar */}
          <TabBar 
            currentScreen={controller.currentScreen} 
            onNavigate={controller.setCurrentScreen} 
          />

          {/* About Modal Overlay */}
          <AboutModal 
            visible={controller.aboutModalVisible} 
            onClose={() => controller.setAboutModalVisible(false)} 
          />
        </SafeAreaView>
      </LanguageProvider>
    );
  };

  if (isWeb) {
    return (
      <View style={styles.webOuterContainer}>
        <View style={styles.webPhoneChassis}>
          <View style={styles.webDynamicIsland} />

          {renderAppContent()}

          <View style={styles.webHomeIndicator} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.nativeContainer}>
      {renderAppContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  webOuterContainer: {
    flex: 1,
    backgroundColor: '#0F172A', 
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    ...Platform.select({
      web: {
        height: '100vh',
      }
    })
  },
  webPhoneChassis: {
    width: 385, 
    height: 812, 
    backgroundColor: '#F9FAFB',
    borderRadius: 40,
    borderWidth: 12,
    borderColor: '#111827', 
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  webDynamicIsland: {
    position: 'absolute',
    top: 8,
    left: '50%',
    marginLeft: -55,
    width: 110,
    height: 18,
    backgroundColor: '#111827',
    borderRadius: 9,
    zIndex: 999,
  },
  webHomeIndicator: {
    position: 'absolute',
    bottom: 6,
    left: '50%',
    marginLeft: -60,
    width: 120,
    height: 4,
    backgroundColor: '#111827',
    borderRadius: 2,
    zIndex: 999,
  },
  nativeContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  appContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#F9FAFB',
    position: 'relative', 
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 110, 
  },
});