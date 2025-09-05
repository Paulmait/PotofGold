import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BrandTheme } from '../src/styles/BrandTheme';

interface LegalDisclaimerProps {
  onAccept: () => void;
  onDecline: () => void;
  type: 'initial' | 'purchase' | 'age' | 'update';
}

export const LegalDisclaimer: React.FC<LegalDisclaimerProps> = ({
  onAccept,
  onDecline,
  type,
}) => {
  const [visible, setVisible] = useState(false);
  const [ageVerified, setAgeVerified] = useState(false);
  const [birthYear, setBirthYear] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);

  useEffect(() => {
    checkLegalStatus();
  }, [type]);

  const checkLegalStatus = async () => {
    const hasAgreed = await AsyncStorage.getItem('legal_agreement_accepted');
    const userAge = await AsyncStorage.getItem('user_age_verified');
    
    if (type === 'initial' && !hasAgreed) {
      setVisible(true);
    } else if (type === 'purchase') {
      setVisible(true);
    } else if (type === 'age' && !userAge) {
      setVisible(true);
    } else if (type === 'update') {
      setVisible(true);
    }
  };

  const handleAgeVerification = () => {
    const year = parseInt(birthYear);
    const currentYear = new Date().getFullYear();
    const age = currentYear - year;

    if (age < 13) {
      Alert.alert(
        '⛔ Age Restriction',
        'You must be at least 13 years old to play Pot of Gold. Your account will now be closed.',
        [
          {
            text: 'Understood',
            onPress: () => {
              AsyncStorage.setItem('user_banned', 'underage');
              onDecline();
            },
          },
        ],
        { cancelable: false }
      );
      return false;
    }

    if (age < 18) {
      Alert.alert(
        '⚠️ Parental Consent Required',
        'Users under 18 must have parental permission to play and make purchases.',
        [
          { text: 'I Have Permission', onPress: () => setAgeVerified(true) },
          { text: 'Exit', onPress: onDecline },
        ]
      );
    } else {
      setAgeVerified(true);
    }

    AsyncStorage.setItem('user_age_verified', age.toString());
    return true;
  };

  const handleAccept = async () => {
    if (type === 'initial' || type === 'update') {
      if (!agreedToTerms || !agreedToPrivacy || !ageVerified) {
        Alert.alert('Required', 'You must agree to all terms and verify your age.');
        return;
      }
    }

    await AsyncStorage.setItem('legal_agreement_accepted', new Date().toISOString());
    await AsyncStorage.setItem('legal_version_accepted', '2.0');
    
    setVisible(false);
    onAccept();
  };

  const renderInitialAgreement = () => (
    <ScrollView style={styles.content}>
      <Text style={styles.title}>⚖️ LEGAL AGREEMENT REQUIRED</Text>
      
      <View style={styles.warningBox}>
        <Text style={styles.warningTitle}>⚠️ IMPORTANT DISCLAIMERS ⚠️</Text>
        <Text style={styles.warningText}>
          • This game is for ENTERTAINMENT ONLY{'\n'}
          • Virtual items have NO REAL MONEY VALUE{'\n'}
          • You CANNOT win real money{'\n'}
          • All purchases are FINAL - NO REFUNDS{'\n'}
          • You must be at least 13 years old{'\n'}
          • Virtual items can be LOST at any time
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Age Verification</Text>
        <Text style={styles.text}>Enter your birth year:</Text>
        <View style={styles.ageInput}>
          <Text style={styles.inputLabel}>Year: </Text>
          <View style={styles.yearPicker}>
            {/* In production, use proper date picker */}
            <Text style={styles.yearText}>{birthYear || 'YYYY'}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <TouchableOpacity
          style={styles.checkbox}
          onPress={() => setAgreedToTerms(!agreedToTerms)}
        >
          <View style={[styles.checkboxBox, agreedToTerms && styles.checked]}>
            {agreedToTerms && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.checkboxText}>
            I have read and agree to the{' '}
            <Text
              style={styles.link}
              onPress={() => Linking.openURL('https://pofgold.com/terms')}
            >
              Terms of Service
            </Text>{' '}
            and{' '}
            <Text
              style={styles.link}
              onPress={() => Linking.openURL('https://pofgold.com/eula')}
            >
              EULA
            </Text>
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.checkbox}
          onPress={() => setAgreedToPrivacy(!agreedToPrivacy)}
        >
          <View style={[styles.checkboxBox, agreedToPrivacy && styles.checked]}>
            {agreedToPrivacy && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.checkboxText}>
            I have read and agree to the{' '}
            <Text
              style={styles.link}
              onPress={() => Linking.openURL('https://pofgold.com/privacy')}
            >
              Privacy Policy
            </Text>
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Binding Arbitration & Class Action Waiver</Text>
        <Text style={styles.text}>
          By accepting, you agree to resolve disputes through binding arbitration and waive your right to class action lawsuits.
        </Text>
      </View>
    </ScrollView>
  );

  const renderPurchaseDisclaimer = () => (
    <View style={styles.content}>
      <Text style={styles.title}>💰 PURCHASE DISCLAIMER</Text>
      
      <View style={styles.criticalWarning}>
        <Text style={styles.criticalTitle}>⛔ BEFORE YOU PURCHASE ⛔</Text>
        <Text style={styles.criticalText}>
          YOU ARE ABOUT TO SPEND REAL MONEY{'\n\n'}
          
          ❌ Virtual items CANNOT be converted to real money{'\n'}
          ❌ Purchases are FINAL - NO REFUNDS{'\n'}
          ❌ Items have NO monetary value{'\n'}
          ❌ Items may be LOST if account is terminated{'\n'}
          ❌ This is NOT gambling - you CANNOT win money{'\n\n'}
          
          ✓ For entertainment purposes ONLY{'\n'}
          ✓ You are paying for a LICENSE to use virtual items{'\n'}
          ✓ You do NOT own the items
        </Text>
      </View>

      <Text style={styles.confirmText}>
        By proceeding, you confirm:{'\n'}
        • You are authorized to make this purchase{'\n'}
        • You understand items have no real value{'\n'}
        • You accept all purchases are final
      </Text>
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setVisible(false)}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {type === 'initial' && renderInitialAgreement()}
          {type === 'purchase' && renderPurchaseDisclaimer()}

          <View style={styles.buttons}>
            <TouchableOpacity
              style={[styles.button, styles.declineButton]}
              onPress={() => {
                setVisible(false);
                onDecline();
              }}
            >
              <Text style={styles.buttonText}>
                {type === 'purchase' ? 'CANCEL' : 'DECLINE & EXIT'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.acceptButton]}
              onPress={handleAccept}
            >
              <Text style={styles.buttonText}>
                {type === 'purchase' ? 'I UNDERSTAND' : 'ACCEPT & PLAY'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
    backgroundColor: BrandTheme.colors.surface,
    borderRadius: 15,
    padding: 20,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: BrandTheme.colors.primary,
    textAlign: 'center',
    marginBottom: 20,
  },
  warningBox: {
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    borderWidth: 2,
    borderColor: '#ff4444',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  warningTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ff4444',
    textAlign: 'center',
    marginBottom: 10,
  },
  warningText: {
    color: '#ffffff',
    fontSize: 14,
    lineHeight: 20,
  },
  criticalWarning: {
    backgroundColor: 'rgba(255, 0, 0, 0.2)',
    borderWidth: 3,
    borderColor: '#ff0000',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
  },
  criticalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ff0000',
    textAlign: 'center',
    marginBottom: 15,
  },
  criticalText: {
    color: '#ffffff',
    fontSize: 15,
    lineHeight: 24,
    fontWeight: '500',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: BrandTheme.colors.primary,
    marginBottom: 10,
  },
  text: {
    color: '#ffffff',
    fontSize: 14,
    lineHeight: 20,
  },
  confirmText: {
    color: '#ffffff',
    fontSize: 16,
    lineHeight: 24,
    marginTop: 10,
  },
  ageInput: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  inputLabel: {
    color: '#ffffff',
    fontSize: 16,
  },
  yearPicker: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    minWidth: 100,
  },
  yearText: {
    color: '#ffffff',
    fontSize: 16,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  checkboxBox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: BrandTheme.colors.primary,
    borderRadius: 4,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checked: {
    backgroundColor: BrandTheme.colors.primary,
  },
  checkmark: {
    color: '#000',
    fontWeight: 'bold',
  },
  checkboxText: {
    color: '#ffffff',
    fontSize: 14,
    flex: 1,
  },
  link: {
    color: BrandTheme.colors.primary,
    textDecorationLine: 'underline',
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  button: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 10,
    marginHorizontal: 5,
  },
  declineButton: {
    backgroundColor: '#666666',
  },
  acceptButton: {
    backgroundColor: BrandTheme.colors.success,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default LegalDisclaimer;