import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  StatusBar,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useGameContext } from '../context/GameContext';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { privacyManager, PrivacySettings } from '../utils/privacy';
import { adManager } from '../utils/adManager';

const SettingsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { gameState, updateGameState } = useGameContext();
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    analyticsEnabled: true,
    personalizedAds: true,
    dataCollection: true,
    crashReporting: true,
    marketingEmails: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      await privacyManager.initialize();
      const settings = privacyManager.getSettings();
      setPrivacySettings(settings);
    } catch (error) {
      console.log('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrivacySettingChange = async (key: keyof PrivacySettings, value: boolean) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      const newSettings = { ...privacySettings, [key]: value };
      setPrivacySettings(newSettings);
      
      await privacyManager.updateSettings(newSettings);
      
      // Show explanation for important changes
      if (key === 'personalizedAds' && !value) {
        Alert.alert(
          'Privacy Mode Enabled',
          'You\'ll see fewer personalized ads, but you can still earn rewards through non-personalized ads.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.log('Error updating privacy settings:', error);
    }
  };

  const handleExportData = async () => {
    try {
      const userData = await privacyManager.exportUserData(gameState.userId || 'anonymous');
      Alert.alert(
        'Data Export',
        'Your data has been prepared for export. Contact support to receive your data.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Unable to export data. Please try again.');
    }
  };

  const handleDeleteData = async () => {
    Alert.alert(
      'Delete All Data',
      'This will permanently delete all your game data, including coins, scores, and progress. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await privacyManager.deleteUserData(gameState.userId || 'anonymous');
              updateGameState({
                coins: 0,
                highScore: 0,
                gamesPlayed: 0,
                currentScore: 0,
              });
              Alert.alert('Data Deleted', 'All your data has been permanently deleted.');
            } catch (error) {
              Alert.alert('Error', 'Unable to delete data. Please try again.');
            }
          },
        },
      ]
    );
  };

  const openPrivacyPolicy = () => {
    Linking.openURL('https://yourgame.com/privacy');
  };

  const openTermsOfService = () => {
    Linking.openURL('https://yourgame.com/terms');
  };

  const openSupport = () => {
    Linking.openURL('mailto:support@yourgame.com');
  };

  const renderSettingItem = (
    title: string,
    description: string,
    value: boolean,
    onValueChange: (value: boolean) => void,
    icon: string,
    type: 'switch' | 'button' = 'switch'
  ) => (
    <View style={styles.settingItem}>
      <View style={styles.settingHeader}>
        <Ionicons name={icon as any} size={24} color="#FFD700" />
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{title}</Text>
          <Text style={styles.settingDescription}>{description}</Text>
        </View>
      </View>
      
      {type === 'switch' ? (
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: '#666', true: '#4CAF50' }}
          thumbColor={value ? '#fff' : '#f4f3f4'}
        />
      ) : (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onValueChange(!value)}
        >
          <Text style={styles.actionButtonText}>Manage</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderSectionHeader = (title: string) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );

  return (
    <LinearGradient colors={['#FFD700', '#FFA500', '#FF8C00']} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        
        <Text style={styles.title}>Settings</Text>
        
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Game Settings */}
        {renderSectionHeader('Game Settings')}
        
        {renderSettingItem(
          'Sound Effects',
          'Enable game sounds and music',
          gameState.soundEnabled,
          (value) => updateGameState({ soundEnabled: value }),
          'volume-high'
        )}
        
        {renderSettingItem(
          'Haptic Feedback',
          'Enable vibration feedback',
          gameState.hapticEnabled,
          (value) => updateGameState({ hapticEnabled: value }),
          'phone-portrait'
        )}

        {/* Privacy & Data */}
        {renderSectionHeader('Privacy & Data')}
        
        {renderSettingItem(
          'Analytics',
          'Help improve the game with anonymous usage data',
          privacySettings.analyticsEnabled,
          (value) => handlePrivacySettingChange('analyticsEnabled', value),
          'analytics'
        )}
        
        {renderSettingItem(
          'Personalized Ads',
          'Show ads based on your interests',
          privacySettings.personalizedAds,
          (value) => handlePrivacySettingChange('personalizedAds', value),
          'eye'
        )}
        
        {renderSettingItem(
          'Data Collection',
          'Allow collection of game data for improvements',
          privacySettings.dataCollection,
          (value) => handlePrivacySettingChange('dataCollection', value),
          'cloud-upload'
        )}
        
        {renderSettingItem(
          'Crash Reporting',
          'Send crash reports to help fix issues',
          privacySettings.crashReporting,
          (value) => handlePrivacySettingChange('crashReporting', value),
          'bug'
        )}

        {/* Ad Preferences */}
        {renderSectionHeader('Ad Preferences')}
        
        <View style={styles.adInfoContainer}>
          <Ionicons name="information-circle" size={20} color="#FFD700" />
          <Text style={styles.adInfoText}>
            Watch ads to earn coins and rewards. No purchase required.
          </Text>
        </View>

        {/* Legal & Support */}
        {renderSectionHeader('Legal & Support')}
        
        <TouchableOpacity
          style={styles.legalItem}
          onPress={openPrivacyPolicy}
        >
          <Ionicons name="shield-checkmark" size={24} color="#FFD700" />
          <Text style={styles.legalText}>Privacy Policy</Text>
          <Ionicons name="chevron-forward" size={20} color="white" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.legalItem}
          onPress={openTermsOfService}
        >
          <Ionicons name="document-text" size={24} color="#FFD700" />
          <Text style={styles.legalText}>Terms of Service</Text>
          <Ionicons name="chevron-forward" size={20} color="white" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.legalItem}
          onPress={openSupport}
        >
          <Ionicons name="help-circle" size={24} color="#FFD700" />
          <Text style={styles.legalText}>Contact Support</Text>
          <Ionicons name="chevron-forward" size={20} color="white" />
        </TouchableOpacity>

        {/* Data Management */}
        {renderSectionHeader('Data Management')}
        
        <TouchableOpacity
          style={styles.dataItem}
          onPress={handleExportData}
        >
          <Ionicons name="download" size={24} color="#4CAF50" />
          <Text style={styles.dataText}>Export My Data</Text>
          <Ionicons name="chevron-forward" size={20} color="white" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.dataItem}
          onPress={handleDeleteData}
        >
          <Ionicons name="trash" size={24} color="#FF6B6B" />
          <Text style={[styles.dataText, { color: '#FF6B6B' }]}>Delete All Data</Text>
          <Ionicons name="chevron-forward" size={20} color="white" />
        </TouchableOpacity>

        {/* App Info */}
        {renderSectionHeader('App Information')}
        
        <View style={styles.appInfoContainer}>
          <Text style={styles.appInfoText}>Version 1.0.0</Text>
          <Text style={styles.appInfoText}>Build 2024.1</Text>
          <Text style={styles.appInfoText}>© 2024 Your Game Studio</Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    marginTop: 30,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  settingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 12,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 12,
    color: 'white',
    opacity: 0.8,
  },
  actionButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
  },
  adInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  adInfoText: {
    fontSize: 12,
    color: 'white',
    marginLeft: 8,
    flex: 1,
  },
  legalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  legalText: {
    fontSize: 16,
    color: 'white',
    marginLeft: 12,
    flex: 1,
  },
  dataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  dataText: {
    fontSize: 16,
    color: 'white',
    marginLeft: 12,
    flex: 1,
  },
  appInfoContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
  },
  appInfoText: {
    fontSize: 12,
    color: 'white',
    opacity: 0.7,
    marginBottom: 4,
  },
});

export default SettingsScreen; 