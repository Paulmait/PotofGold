import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Platform,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BrandTheme } from '../src/styles/BrandTheme';
import LegalAuditService from '../src/services/LegalAuditService';

interface LegalAgreementScreenProps {
  navigation?: any;
  route?: any;
  onAccept?: () => void;
  onDecline?: () => void;
}

const LegalAgreementScreen: React.FC<LegalAgreementScreenProps> = ({
  navigation,
  route,
}) => {
  // Get callbacks from route params
  const onAccept = route?.params?.onAccept;
  const onDecline = route?.params?.onDecline;
  const [loading, setLoading] = useState(false);
  const [startTime] = useState(Date.now());
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [acceptedEULA, setAcceptedEULA] = useState(false);

  const handleAccept = async () => {
    if (!acceptedTerms || !acceptedPrivacy || !acceptedEULA) {
      if (Platform.OS === 'web') {
        alert('You must accept all agreements to continue.');
      } else {
        Alert.alert('Required', 'You must accept all agreements to continue.');
      }
      return;
    }

    setLoading(true);
    console.log('Accepting legal agreements...');
    
    try {
      await AsyncStorage.setItem('legal_accepted', 'true');
      await AsyncStorage.setItem('legal_version_accepted', '2.0');
      
      const timeSpentReading = Math.floor((Date.now() - startTime) / 1000);
      
      await LegalAuditService.recordInitialAcceptance(
        {
          termsOfService: acceptedTerms,
          privacyPolicy: acceptedPrivacy,
          eula: acceptedEULA,
        },
        timeSpentReading
      );

      console.log('Legal agreements accepted, calling onAccept callback...');
      if (onAccept) {
        onAccept();
        // Navigate to Onboarding after accepting
        if (navigation) {
          setTimeout(() => {
            navigation.navigate('Onboarding');
          }, 100);
        }
      } else {
        console.warn('No onAccept callback provided');
        // Fallback navigation
        if (navigation) {
          navigation.navigate('Onboarding');
        }
      }
    } catch (error) {
      console.error('Error saving agreement:', error);
      if (Platform.OS === 'web') {
        alert('Failed to save agreement. Please try again.');
      } else {
        Alert.alert('Error', 'Failed to save agreement. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = () => {
    console.log('Legal agreements declined');
    if (onDecline) {
      onDecline();
    } else {
      console.warn('No onDecline callback provided');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>⚖️ Legal Agreements</Text>
          <Text style={styles.subtitle}>Please read and accept our legal agreements</Text>
        </View>

        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.checkbox, acceptedTerms && styles.checkboxActive]}
            onPress={() => setAcceptedTerms(!acceptedTerms)}
          >
            <Text style={styles.checkboxText}>
              {acceptedTerms ? '☑' : '☐'} I accept the Terms of Service
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.checkbox, acceptedPrivacy && styles.checkboxActive]}
            onPress={() => setAcceptedPrivacy(!acceptedPrivacy)}
          >
            <Text style={styles.checkboxText}>
              {acceptedPrivacy ? '☑' : '☐'} I accept the Privacy Policy
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.checkbox, acceptedEULA && styles.checkboxActive]}
            onPress={() => setAcceptedEULA(!acceptedEULA)}
          >
            <Text style={styles.checkboxText}>
              {acceptedEULA ? '☑' : '☐'} I accept the End User License Agreement
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.warningBox}>
          <Text style={styles.warningTitle}>⚠️ IMPORTANT</Text>
          <Text style={styles.warningText}>
            • Virtual items have NO real money value{'\n'}
            • This is NOT a gambling game{'\n'}
            • All purchases are FINAL{'\n'}
            • You must be 13+ years old
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.declineButton]}
            onPress={handleDecline}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Decline</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button, 
              styles.acceptButton,
              (!acceptedTerms || !acceptedPrivacy || !acceptedEULA) && styles.disabledButton
            ]}
            onPress={handleAccept}
            disabled={loading || !acceptedTerms || !acceptedPrivacy || !acceptedEULA}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.buttonText}>Accept All</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BrandTheme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: BrandTheme.colors.primary,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  section: {
    padding: 20,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    marginVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  checkboxActive: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderColor: BrandTheme.colors.primary,
  },
  checkboxText: {
    color: '#FFF',
    fontSize: 16,
  },
  warningBox: {
    margin: 20,
    padding: 15,
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FF4444',
  },
  warningTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF4444',
    marginBottom: 10,
  },
  warningText: {
    color: '#FFF',
    fontSize: 14,
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 10,
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  declineButton: {
    backgroundColor: '#666',
  },
  acceptButton: {
    backgroundColor: BrandTheme.colors.success,
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default LegalAgreementScreen;