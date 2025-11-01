import React, { useState } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, ScrollView, Switch } from 'react-native';

interface PrivacyConsentDialogProps {
  visible: boolean;
  onAccept: (consents: ConsentChoices) => void;
}

export interface ConsentChoices {
  analyticsEnabled: boolean;
  personalizedAds: boolean;
  locationTracking: boolean;
}

export default function PrivacyConsentDialog({ visible, onAccept }: PrivacyConsentDialogProps) {
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);
  const [personalizedAds, setPersonalizedAds] = useState(false);
  const [locationTracking, setLocationTracking] = useState(false);

  const handleAccept = () => {
    onAccept({
      analyticsEnabled,
      personalizedAds,
      locationTracking,
    });
  };

  const handleAcceptAll = () => {
    onAccept({
      analyticsEnabled: true,
      personalizedAds: true,
      locationTracking: true,
    });
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
    >
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>Privacy & Data</Text>
            <Text style={styles.subtitle}>
              We respect your privacy. Please choose how we can use your data.
            </Text>

            <View style={styles.section}>
              <View style={styles.optionRow}>
                <View style={styles.optionText}>
                  <Text style={styles.optionTitle}>Analytics</Text>
                  <Text style={styles.optionDescription}>
                    Help us improve the game by sharing anonymous usage data
                  </Text>
                </View>
                <Switch
                  value={analyticsEnabled}
                  onValueChange={setAnalyticsEnabled}
                  trackColor={{ false: '#ccc', true: '#FFD700' }}
                  thumbColor="#fff"
                />
              </View>

              <View style={styles.optionRow}>
                <View style={styles.optionText}>
                  <Text style={styles.optionTitle}>Personalized Experience</Text>
                  <Text style={styles.optionDescription}>
                    Receive personalized content and offers based on your preferences
                  </Text>
                </View>
                <Switch
                  value={personalizedAds}
                  onValueChange={setPersonalizedAds}
                  trackColor={{ false: '#ccc', true: '#FFD700' }}
                  thumbColor="#fff"
                />
              </View>

              <View style={styles.optionRow}>
                <View style={styles.optionText}>
                  <Text style={styles.optionTitle}>Location Data</Text>
                  <Text style={styles.optionDescription}>
                    Share your approximate location for region-specific features
                  </Text>
                </View>
                <Switch
                  value={locationTracking}
                  onValueChange={setLocationTracking}
                  trackColor={{ false: '#ccc', true: '#FFD700' }}
                  thumbColor="#fff"
                />
              </View>
            </View>

            <Text style={styles.footer}>
              You can change these settings anytime in the app's Privacy Settings.
            </Text>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.buttonPrimary}
                onPress={handleAccept}
              >
                <Text style={styles.buttonPrimaryText}>Continue</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.buttonSecondary}
                onPress={handleAcceptAll}
              >
                <Text style={styles.buttonSecondaryText}>Accept All</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialog: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 20,
  },
  section: {
    marginBottom: 20,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  optionText: {
    flex: 1,
    marginRight: 12,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  footer: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 16,
  },
  buttonContainer: {
    gap: 12,
  },
  buttonPrimary: {
    backgroundColor: '#FFD700',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonPrimaryText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  buttonSecondary: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonSecondaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
});
