import React from 'react';
import { StyleSheet, View, ScrollView, SafeAreaView, Platform, ActivityIndicator, useWindowDimensions } from 'react-native'; // FIXED: Added useWindowDimensions
import { useFonts } from 'expo-font'; 
import { Ionicons } from '@expo/vector-icons';

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
import ListScreen from './src/screens/ListScreen';
import MapScreen from './src/screens/MapScreen';

// Dynamic, platform-aware global CDN font-face injector
if (Platform.OS === 'web') {
  const iconFontStyles = `
    @font-face {
      font-family: 'Ionicons';
      src: url('https://unpkg.com/react-native-vector-icons@10.0.0/Fonts/Ionicons.ttf') format('truetype');
    }
  `;

  const style = document.createElement('style');
  style.type = 'text/css';
  if (style.styleSheet) {
    style.styleSheet.cssText = iconFontStyles;
  } else {
    style.appendChild(document.createTextNode(iconFontStyles));
  }

  document.head.appendChild(style);
}

export default function App() {
  const controller = useAppController();
  const isWeb = Platform.OS === 'web';
  
  // FIXED: Detect the browser's viewport width to support responsive layouts
  const { width } = useWindowDimensions();
  
  // Only render the desktop laptop-style chassis if on a desktop/laptop web browser (>= 500px)
  const isDesktopWeb = isWeb && width >= 500;

  const [fontsLoaded, fontError] = useFonts({
    ...Ionicons.font,
  });

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
                  controller.setCurrentScreen('list');
                }}
                isNarrowTherapeutic={controller.isNarrowTherapeutic}
                rxConfirmed={controller.rxConfirmed}
                setRxConfirmed={controller.setRxConfirmed}
                pharmacistModeVisible={controller.pharmacistModeVisible}
                setPharmacistModeVisible={controller.setPharmacistModeVisible}
                pharmacistSelectedAlt={controller.pharmacistSelectedAlt}
                handleOpenPharmacistMode={controller.handleOpenPharmacistMode}
                isNearestPharmacyVerified={controller.isNearestPharmacyVerified}
                
                selectedGenericBrand={controller.selectedGenericBrand}
                setSelectedGenericBrand={controller.setSelectedGenericBrand}
                savingsSummary={controller.basketSummary}
                handleAddToBasket={controller.handleAddToBasket}

                searchSuggestions={controller.searchSuggestions}
                onSelectSuggestion={controller.handleSelectSuggestion}
              />
            )}

            {controller.currentScreen === 'list' && (
              <ListScreen
                basket={controller.prescriptionBasket}
                basketSummary={controller.basketSummary}
                onRemoveItem={controller.handleRemoveFromBasket}
                onNavigateToSearch={() => controller.setCurrentScreen('search')}
                onNavigateToMap={() => controller.setCurrentScreen('map')}
                rxConfirmed={controller.rxConfirmed}
                setRxConfirmed={controller.setRxConfirmed}
              />
            )}

            {controller.currentScreen === 'map' && (
              <MapScreen 
                pharmacies={controller.pharmacies}
                selectedDrug={controller.selectedDrug}
                recentlyVerifiedOnly={controller.recentlyVerifiedOnly}
                setRecentlyVerifiedOnly={controller.setRecentlyVerifiedOnly}
                basket={controller.prescriptionBasket}
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

  // If fonts are still loading, show a native spinner (prevents unrendered squares)
  if (!fontsLoaded && !fontError) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' }}>
        <ActivityIndicator size="large" color="#0d9488" />
      </View>
    );
  }

  // FIXED: Branch to standard mobile full-screen if on a real phone web browser
  if (isDesktopWeb) {
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
    width: '100%',
    height: '100%',
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