import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../context/LanguageContext';

export default function TabBar({ currentScreen, onNavigate }) {
  const { t } = useLanguage();

  return (
    <View style={styles.tabBar}>
      <TouchableOpacity 
        style={[styles.tabItem, currentScreen === 'search' && styles.activeTabItem]}
        onPress={() => onNavigate('search')}
      >
        <Ionicons name="search" size={18} color={currentScreen === 'search' ? '#0D9488' : '#888'} />
        <Text style={[styles.tabLabel, currentScreen === 'search' && styles.activeTabLabel]}>{t.tabSearch}</Text>
      </TouchableOpacity>

      {/* Step 3: Localized Alistahan Prescription Basket Tab */}
      <TouchableOpacity 
        style={[styles.tabItem, currentScreen === 'list' && styles.activeTabItem]}
        onPress={() => onNavigate('list')}
      >
        <Ionicons name="list" size={18} color={currentScreen === 'list' ? '#0D9488' : '#888'} />
        <Text style={[styles.tabLabel, currentScreen === 'list' && styles.activeTabLabel]}>{t.tabList}</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.tabItem, currentScreen === 'map' && styles.activeTabItem]}
        onPress={() => onNavigate('map')}
      >
        <Ionicons name="map" size={18} color={currentScreen === 'map' ? '#0D9488' : '#888'} />
        <Text style={[styles.tabLabel, currentScreen === 'map' && styles.activeTabLabel]}>{t.tabMap}</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.tabItem, currentScreen === 'adherence' && styles.activeTabItem]}
        onPress={() => onNavigate('adherence')}
      >
        <Ionicons name="heart" size={18} color={currentScreen === 'adherence' ? '#0D9488' : '#888'} />
        <Text style={[styles.tabLabel, currentScreen === 'adherence' && styles.activeTabLabel]}>{t.tabAdherence}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 64,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: Platform.OS === 'web' ? 12 : 10,
    zIndex: 10,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    height: '100%',
  },
  activeTabItem: {
    borderTopWidth: 2,
    borderTopColor: '#0D9488',
  },
  tabLabel: {
    fontSize: 11, // Tab bar labels: 11sp
    fontWeight: '600',
    color: '#888',
    marginTop: 2,
  },
  activeTabLabel: {
    color: '#0D9488',
    fontWeight: '700',
  },
});