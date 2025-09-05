import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import { RevenueCatManager } from '../src/lib/revenuecat';
import { useEntitlements } from '../src/features/subscriptions/useEntitlements';
import LegalAgreementScreen from './LegalAgreementScreen';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

export default function SettingsScreen() {
  const navigation = useNavigation<any>();
  const { isSubscribed, isLoading } = useEntitlements();
  const [soundEnabled, setSoundEnabled] = React.useState(true);
  const [hapticsEnabled, setHapticsEnabled] = React.useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [showLegalReview, setShowLegalReview] = useState(false);

  React.useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const sound = await AsyncStorage.getItem('soundEnabled');
      const haptics = await AsyncStorage.getItem('hapticsEnabled');
      const notifications = await AsyncStorage.getItem('notificationsEnabled');
      
      if (sound !== null) setSoundEnabled(sound === 'true');
      if (haptics !== null) setHapticsEnabled(haptics === 'true');
      if (notifications !== null) setNotificationsEnabled(notifications === 'true');
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleSoundToggle = async (value: boolean) => {
    setSoundEnabled(value);
    await AsyncStorage.setItem('soundEnabled', value.toString());
    if (hapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleHapticsToggle = async (value: boolean) => {
    setHapticsEnabled(value);
    await AsyncStorage.setItem('hapticsEnabled', value.toString());
    if (value) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const handleNotificationsToggle = async (value: boolean) => {
    setNotificationsEnabled(value);
    await AsyncStorage.setItem('notificationsEnabled', value.toString());
    if (hapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleRestorePurchases = async () => {
    try {
      Alert.alert(
        'Restoring Purchases',
        'Please wait while we restore your purchases...',
        [],
        { cancelable: false }
      );
      
      const restored = await RevenueCatManager.restorePurchases();
      
      if (restored) {
        Alert.alert(
          'Success',
          'Your purchases have been restored successfully!',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'No Purchases Found',
          'No previous purchases were found to restore.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert(
        'Restore Failed',
        'Failed to restore purchases. Please try again later.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleManageSubscription = async () => {
    try {
      await RevenueCatManager.openManageSubscriptions();
    } catch (error) {
      Alert.alert(
        'Error',
        'Unable to open subscription management. Please manage through your device settings.',
        [{ text: 'OK' }]
      );
    }
  };

  const handlePrivacyPolicy = () => {
    // In production, open a webview or external browser
    Alert.alert(
      'Privacy Policy',
      'View our privacy policy at https://cienrios.com/potofgold/privacy',
      [{ text: 'OK' }]
    );
  };

  const handleTermsOfService = () => {
    // In production, open a webview or external browser
    Alert.alert(
      'Terms of Service',
      'View our terms at https://cienrios.com/potofgold/terms',
      [{ text: 'OK' }]
    );
  };

  const handleReviewLegalAgreements = () => {
    setShowLegalReview(true);
  };

  const handleLegalReviewComplete = async () => {
    setShowLegalReview(false);
    Alert.alert(
      'Legal Agreements Updated',
      'Thank you for reviewing and accepting our updated legal agreements.',
      [{ text: 'OK' }]
    );
  };

  const handleLegalReviewDecline = () => {
    setShowLegalReview(false);
    Alert.alert(
      'Legal Review',
      'You can review and accept the legal agreements at any time from Settings.',
      [{ text: 'OK' }]
    );
  };

  const handleSupport = () => {
    Alert.alert(
      'Support',
      'Contact us at support@cienrios.com',
      [{ text: 'OK' }]
    );
  };

  return (
    <>
      {showLegalReview && (
        <LegalAgreementScreen
          onAccept={handleLegalReviewComplete}
          onDecline={handleLegalReviewDecline}
        />
      )}
      
      <ScrollView style={styles.container}>
        <View style={styles.content}>
        {/* Gold Vault Club Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Gold Vault Club</Text>
          
          {isSubscribed ? (
            <View style={styles.subscriptionActive}>
              <Text style={styles.vipBadge}>⭐ VIP Member</Text>
              <Text style={styles.subscriptionText}>Your membership is active</Text>
              <TouchableOpacity
                style={styles.button}
                onPress={handleManageSubscription}
              >
                <Text style={styles.buttonText}>Manage Subscription</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.goldButton}
              onPress={() => navigation.navigate('SubscriptionVault')}
            >
              <Text style={styles.goldButtonText}>🌟 Join Gold Vault Club</Text>
              <Text style={styles.goldButtonSubtext}>Get 2x rewards & exclusive perks</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Game Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Game Settings</Text>
          
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Sound Effects</Text>
            <Switch
              value={soundEnabled}
              onValueChange={handleSoundToggle}
              trackColor={{ false: '#767577', true: '#FFD700' }}
              thumbColor={soundEnabled ? '#f4f3f4' : '#f4f3f4'}
            />
          </View>
          
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Haptic Feedback</Text>
            <Switch
              value={hapticsEnabled}
              onValueChange={handleHapticsToggle}
              trackColor={{ false: '#767577', true: '#FFD700' }}
              thumbColor={hapticsEnabled ? '#f4f3f4' : '#f4f3f4'}
            />
          </View>
          
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Notifications</Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleNotificationsToggle}
              trackColor={{ false: '#767577', true: '#FFD700' }}
              thumbColor={notificationsEnabled ? '#f4f3f4' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Account */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <TouchableOpacity
            style={styles.button}
            onPress={handleRestorePurchases}
          >
            <Text style={styles.buttonText}>Restore Purchases</Text>
          </TouchableOpacity>
        </View>

        {/* Legal */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal</Text>
          
          <TouchableOpacity
            style={styles.button}
            onPress={handlePrivacyPolicy}
          >
            <Text style={styles.buttonText}>Privacy Policy</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.button}
            onPress={handleTermsOfService}
          >
            <Text style={styles.buttonText}>Terms of Service</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, styles.reviewButton]}
            onPress={handleReviewLegalAgreements}
          >
            <Text style={styles.buttonText}>📋 Review Legal Agreements</Text>
          </TouchableOpacity>
        </View>

        {/* Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          
          <TouchableOpacity
            style={styles.button}
            onPress={handleSupport}
          >
            <Text style={styles.buttonText}>Contact Support</Text>
          </TouchableOpacity>
        </View>

        {/* Version */}
        <View style={styles.footer}>
          <Text style={styles.versionText}>Pot of Gold v1.0.0</Text>
          <Text style={styles.copyrightText}>© 2024 Cien Rios</Text>
        </View>
      </View>
    </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  content: {
    padding: isTablet ? 40 : 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: isTablet ? 20 : 18,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 15,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  settingLabel: {
    fontSize: isTablet ? 18 : 16,
    color: '#fff',
  },
  button: {
    backgroundColor: '#333',
    paddingVertical: isTablet ? 15 : 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginVertical: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: isTablet ? 18 : 16,
    textAlign: 'center',
  },
  goldButton: {
    backgroundColor: '#FFD700',
    paddingVertical: isTablet ? 20 : 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  goldButtonText: {
    color: '#1a1a1a',
    fontSize: isTablet ? 20 : 18,
    fontWeight: 'bold',
  },
  goldButtonSubtext: {
    color: '#1a1a1a',
    fontSize: isTablet ? 16 : 14,
    marginTop: 5,
  },
  subscriptionActive: {
    backgroundColor: '#333',
    padding: 15,
    borderRadius: 12,
  },
  vipBadge: {
    color: '#FFD700',
    fontSize: isTablet ? 20 : 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subscriptionText: {
    color: '#fff',
    fontSize: isTablet ? 16 : 14,
    marginBottom: 10,
  },
  footer: {
    alignItems: 'center',
    marginTop: 40,
  },
  versionText: {
    color: '#999',
    fontSize: isTablet ? 14 : 12,
  },
  copyrightText: {
    color: '#999',
    fontSize: isTablet ? 14 : 12,
    marginTop: 5,
  },
  reviewButton: {
    backgroundColor: '#4A90E2',
    marginTop: 10,
  },
});