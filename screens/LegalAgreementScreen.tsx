import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  TextInput,
  Platform,
  SafeAreaView,
  ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CheckBox from '@react-native-community/checkbox';
import DateTimePicker from '@react-native-community/datetimepicker';
import { BrandTheme } from '../src/styles/BrandTheme';
import Icon from 'react-native-vector-icons/Ionicons';
import LegalAuditService from '../src/services/LegalAuditService';

interface LegalAgreementScreenProps {
  navigation: any;
  route?: any;
  onComplete?: () => void;
}

export const LegalAgreementScreen: React.FC<LegalAgreementScreenProps> = ({
  navigation,
  onComplete,
}) => {
  const [step, setStep] = useState(1); // 1: Age, 2: Terms, 3: Privacy, 4: EULA, 5: Confirmation
  const [birthDate, setBirthDate] = useState(new Date(2010, 0, 1));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [age, setAge] = useState(0);
  const [loading, setLoading] = useState(false);
  const [startTime] = useState(Date.now()); // Track time spent reading
  
  // Agreement states
  const [readTerms, setReadTerms] = useState(false);
  const [readPrivacy, setReadPrivacy] = useState(false);
  const [readEULA, setReadEULA] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [acceptedEULA, setAcceptedEULA] = useState(false);
  const [acceptedArbitration, setAcceptedArbitration] = useState(false);
  const [acceptedNoRefunds, setAcceptedNoRefunds] = useState(false);
  const [parentalConsent, setParentalConsent] = useState(false);

  // Scroll tracking
  const [termsScrolledToEnd, setTermsScrolledToEnd] = useState(false);
  const [privacyScrolledToEnd, setPrivacyScrolledToEnd] = useState(false);
  const [eulaScrolledToEnd, setEulaScrolledToEnd] = useState(false);

  useEffect(() => {
    checkExistingAgreement();
  }, []);

  const checkExistingAgreement = async () => {
    try {
      const agreement = await AsyncStorage.getItem('legal_agreement_complete');
      const version = await AsyncStorage.getItem('legal_agreement_version');
      
      if (agreement && version === '2.0') {
        // Already agreed to current version
        if (onComplete) {
          onComplete();
        } else {
          navigation.replace('Home');
        }
      }
    } catch (error) {
      console.error('Error checking agreement:', error);
    }
  };

  const calculateAge = (date: Date) => {
    const today = new Date();
    let age = today.getFullYear() - date.getFullYear();
    const monthDiff = today.getMonth() - date.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
      age--;
    }
    
    return age;
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setBirthDate(selectedDate);
      const userAge = calculateAge(selectedDate);
      setAge(userAge);
    }
  };

  const handleAgeVerification = () => {
    const userAge = calculateAge(birthDate);
    
    if (userAge < 13) {
      Alert.alert(
        '❌ Age Restriction',
        'You must be at least 13 years old to use Pot of Gold.\n\nYour access has been denied.',
        [
          {
            text: 'Exit',
            onPress: () => {
              AsyncStorage.setItem('user_blocked', 'underage');
              Platform.OS === 'ios' ? undefined : Platform.OS === 'android' ? 
                (global as any).ExitApp?.exitApp() : undefined;
            },
          },
        ],
        { cancelable: false }
      );
      return;
    }
    
    if (userAge < 18) {
      Alert.alert(
        '⚠️ Parental Consent Required',
        'Users under 18 must have parental permission to play and make any purchases.\n\nBy continuing, you confirm that you have parental consent.',
        [
          {
            text: 'I Have Parental Consent',
            onPress: () => {
              setParentalConsent(true);
              setStep(2);
            },
          },
          {
            text: 'Exit',
            onPress: () => Platform.OS === 'android' ? (global as any).ExitApp?.exitApp() : undefined,
          },
        ],
        { cancelable: false }
      );
    } else {
      setStep(2);
    }
    
    AsyncStorage.setItem('user_age', userAge.toString());
    AsyncStorage.setItem('user_birthdate', birthDate.toISOString());
  };

  const handleFinalAcceptance = async () => {
    if (!acceptedTerms || !acceptedPrivacy || !acceptedEULA || 
        !acceptedArbitration || !acceptedNoRefunds) {
      Alert.alert('Required', 'You must accept all agreements to continue.');
      return;
    }

    setLoading(true);

    try {
      // Create comprehensive audit trail
      const acceptanceRecord = {
        timestamp: new Date().toISOString(),
        age: age,
        birthDate: birthDate.toISOString(),
        parentalConsent: parentalConsent,
        agreements: {
          termsOfService: {
            accepted: acceptedTerms,
            version: '2.0',
            readComplete: termsScrolledToEnd,
            timestamp: new Date().toISOString(),
          },
          privacyPolicy: {
            accepted: acceptedPrivacy,
            version: '2.0',
            readComplete: privacyScrolledToEnd,
            timestamp: new Date().toISOString(),
          },
          eula: {
            accepted: acceptedEULA,
            version: '2.0',
            readComplete: eulaScrolledToEnd,
            timestamp: new Date().toISOString(),
          },
          arbitration: {
            accepted: acceptedArbitration,
            timestamp: new Date().toISOString(),
          },
          noRefunds: {
            accepted: acceptedNoRefunds,
            timestamp: new Date().toISOString(),
          },
        },
        device: {
          platform: Platform.OS,
          version: Platform.Version,
        },
      };

      // Store acceptance record
      await AsyncStorage.setItem('legal_agreement_complete', 'true');
      await AsyncStorage.setItem('legal_agreement_version', '2.0');
      await AsyncStorage.setItem('legal_agreement_record', JSON.stringify(acceptanceRecord));
      await AsyncStorage.setItem('legal_agreement_timestamp', new Date().toISOString());

      // Calculate time spent reading
      const timeSpentReading = Math.floor((Date.now() - startTime) / 1000); // in seconds

      // Record to audit service
      await LegalAuditService.recordInitialAcceptance(
        {
          termsOfService: acceptedTerms,
          privacyPolicy: acceptedPrivacy,
          eula: acceptedEULA,
        },
        timeSpentReading
      );

      Alert.alert(
        '✅ Agreement Complete',
        'Thank you for accepting our terms. Enjoy playing Pot of Gold!',
        [
          {
            text: 'Start Playing',
            onPress: () => {
              if (onComplete) {
                onComplete();
              } else {
                navigation.replace('Home');
              }
            },
          },
        ],
        { cancelable: false }
      );
    } catch (error) {
      console.error('Error saving agreement:', error);
      Alert.alert('Error', 'Failed to save agreement. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[1, 2, 3, 4, 5].map((num) => (
        <View
          key={num}
          style={[
            styles.stepDot,
            step >= num && styles.stepDotActive,
            step === num && styles.stepDotCurrent,
          ]}
        >
          <Text style={styles.stepNumber}>{num}</Text>
        </View>
      ))}
    </View>
  );

  const renderAgeVerification = () => (
    <View style={styles.stepContent}>
      <Icon name="calendar-outline" size={50} color={BrandTheme.colors.primary} />
      <Text style={styles.stepTitle}>Age Verification Required</Text>
      <Text style={styles.stepDescription}>
        To comply with COPPA and international laws, we must verify your age.
      </Text>
      
      <TouchableOpacity
        style={styles.dateButton}
        onPress={() => setShowDatePicker(true)}
      >
        <Text style={styles.dateButtonText}>
          Birth Date: {birthDate.toLocaleDateString()}
        </Text>
      </TouchableOpacity>
      
      {showDatePicker && (
        <DateTimePicker
          value={birthDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
          maximumDate={new Date()}
        />
      )}
      
      <View style={styles.warningBox}>
        <Text style={styles.warningText}>
          ⚠️ You must be at least 13 years old to use this app
        </Text>
      </View>
      
      <TouchableOpacity
        style={styles.nextButton}
        onPress={handleAgeVerification}
      >
        <Text style={styles.nextButtonText}>Verify Age & Continue</Text>
      </TouchableOpacity>
    </View>
  );

  const renderTermsOfService = () => (
    <View style={styles.stepContent}>
      <Icon name="document-text-outline" size={50} color={BrandTheme.colors.primary} />
      <Text style={styles.stepTitle}>Terms of Service</Text>
      
      <ScrollView
        style={styles.legalTextContainer}
        onScroll={({ nativeEvent }) => {
          const isAtEnd = nativeEvent.layoutMeasurement.height + nativeEvent.contentOffset.y
            >= nativeEvent.contentSize.height - 20;
          if (isAtEnd && !termsScrolledToEnd) {
            setTermsScrolledToEnd(true);
            setReadTerms(true);
          }
        }}
        scrollEventThrottle={400}
      >
        <Text style={styles.legalText}>
          {`TERMS OF SERVICE - KEY POINTS

⚠️ IMPORTANT: PLEASE READ CAREFULLY

1. VIRTUAL ITEMS DISCLAIMER
• Virtual coins and items have NO REAL MONEY VALUE
• Cannot be exchanged for cash
• All purchases are FINAL - NO REFUNDS
• Items may be lost if account is terminated

2. BINDING ARBITRATION
• All disputes resolved through arbitration
• You waive right to jury trial
• You waive right to class action lawsuits

3. LIABILITY LIMITATION
• Our maximum liability is $100
• We are not liable for indirect damages

4. AGE REQUIREMENT
• Must be 13+ years old
• Under 18 requires parental consent

5. ACCOUNT TERMINATION
• We may terminate for violations
• No refund upon termination

6. GOVERNING LAW
• Florida law applies
• Miami-Dade County jurisdiction

[Full terms at https://pofgold.com/terms]`}
        </Text>
      </ScrollView>
      
      {!termsScrolledToEnd && (
        <Text style={styles.scrollHint}>↓ Scroll to read all terms ↓</Text>
      )}
      
      <TouchableOpacity
        style={[styles.checkbox, !readTerms && styles.disabled]}
        onPress={() => readTerms && setAcceptedTerms(!acceptedTerms)}
        disabled={!readTerms}
      >
        <View style={[styles.checkBox, acceptedTerms && styles.checkBoxChecked]}>
          {acceptedTerms && <Text style={styles.checkMark}>✓</Text>}
        </View>
        <Text style={styles.checkboxText}>
          I have read and accept the Terms of Service
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.nextButton, !acceptedTerms && styles.buttonDisabled]}
        onPress={() => acceptedTerms && setStep(3)}
        disabled={!acceptedTerms}
      >
        <Text style={styles.nextButtonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );

  const renderPrivacyPolicy = () => (
    <View style={styles.stepContent}>
      <Icon name="lock-closed-outline" size={50} color={BrandTheme.colors.primary} />
      <Text style={styles.stepTitle}>Privacy Policy</Text>
      
      <ScrollView
        style={styles.legalTextContainer}
        onScroll={({ nativeEvent }) => {
          const isAtEnd = nativeEvent.layoutMeasurement.height + nativeEvent.contentOffset.y
            >= nativeEvent.contentSize.height - 20;
          if (isAtEnd && !privacyScrolledToEnd) {
            setPrivacyScrolledToEnd(true);
            setReadPrivacy(true);
          }
        }}
        scrollEventThrottle={400}
      >
        <Text style={styles.legalText}>
          {`PRIVACY POLICY - KEY POINTS

🔒 YOUR PRIVACY MATTERS

1. INFORMATION WE COLLECT
• Email and username
• Game progress and scores
• Device information
• Purchase history

2. WE NEVER SELL YOUR DATA
• Your data is NEVER sold to third parties
• Used only to provide game services

3. YOUR RIGHTS
• Access your data anytime
• Delete your account and data
• Opt-out of marketing
• Data portability

4. DATA SECURITY
• Industry-standard encryption
• Secure payment processing
• Regular security audits

5. CHILDREN'S PRIVACY
• COPPA compliant
• Parental rights respected
• Under-13 users prohibited

6. INTERNATIONAL TRANSFERS
• Data may be processed in USA
• Standard contractual clauses

[Full policy at https://pofgold.com/privacy]`}
        </Text>
      </ScrollView>
      
      {!privacyScrolledToEnd && (
        <Text style={styles.scrollHint}>↓ Scroll to read all terms ↓</Text>
      )}
      
      <TouchableOpacity
        style={[styles.checkbox, !readPrivacy && styles.disabled]}
        onPress={() => readPrivacy && setAcceptedPrivacy(!acceptedPrivacy)}
        disabled={!readPrivacy}
      >
        <View style={[styles.checkBox, acceptedPrivacy && styles.checkBoxChecked]}>
          {acceptedPrivacy && <Text style={styles.checkMark}>✓</Text>}
        </View>
        <Text style={styles.checkboxText}>
          I have read and accept the Privacy Policy
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.nextButton, !acceptedPrivacy && styles.buttonDisabled]}
        onPress={() => acceptedPrivacy && setStep(4)}
        disabled={!acceptedPrivacy}
      >
        <Text style={styles.nextButtonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );

  const renderEULA = () => (
    <View style={styles.stepContent}>
      <Icon name="shield-checkmark-outline" size={50} color={BrandTheme.colors.primary} />
      <Text style={styles.stepTitle}>End User License Agreement</Text>
      
      <ScrollView
        style={styles.legalTextContainer}
        onScroll={({ nativeEvent }) => {
          const isAtEnd = nativeEvent.layoutMeasurement.height + nativeEvent.contentOffset.y
            >= nativeEvent.contentSize.height - 20;
          if (isAtEnd && !eulaScrolledToEnd) {
            setEulaScrolledToEnd(true);
            setReadEULA(true);
          }
        }}
        scrollEventThrottle={400}
      >
        <Text style={styles.legalText}>
          {`END USER LICENSE AGREEMENT

⛔ CRITICAL DISCLAIMERS ⛔

1. NOT GAMBLING
• This is NOT a gambling game
• You CANNOT win real money
• Virtual items have NO cash value
• Cannot be exchanged for money

2. VIRTUAL CURRENCY
• For entertainment ONLY
• NO real-world value
• Cannot be sold or traded
• May be lost at any time

3. PURCHASES
• ALL SALES ARE FINAL
• NO REFUNDS (except where legally required)
• You're buying a LICENSE, not ownership
• Prices may change

4. LICENSE GRANT
• Personal use only
• Non-transferable
• Revocable
• Non-commercial

5. PROHIBITED ACTIONS
• No cheating or hacks
• No account selling
• No exploitation of bugs
• No harassment

6. WARRANTY DISCLAIMER
• Provided "AS IS"
• No guarantees
• Use at your own risk

[Full EULA at https://pofgold.com/eula]`}
        </Text>
      </ScrollView>
      
      {!eulaScrolledToEnd && (
        <Text style={styles.scrollHint}>↓ Scroll to read all terms ↓</Text>
      )}
      
      <TouchableOpacity
        style={[styles.checkbox, !readEULA && styles.disabled]}
        onPress={() => readEULA && setAcceptedEULA(!acceptedEULA)}
        disabled={!readEULA}
      >
        <View style={[styles.checkBox, acceptedEULA && styles.checkBoxChecked]}>
          {acceptedEULA && <Text style={styles.checkMark}>✓</Text>}
        </View>
        <Text style={styles.checkboxText}>
          I have read and accept the EULA
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.nextButton, !acceptedEULA && styles.buttonDisabled]}
        onPress={() => acceptedEULA && setStep(5)}
        disabled={!acceptedEULA}
      >
        <Text style={styles.nextButtonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );

  const renderFinalConfirmation = () => (
    <View style={styles.stepContent}>
      <Icon name="checkmark-circle-outline" size={50} color={BrandTheme.colors.success} />
      <Text style={styles.stepTitle}>Final Confirmation</Text>
      <Text style={styles.stepDescription}>
        Please confirm your understanding of these critical points:
      </Text>
      
      <View style={styles.criticalPoints}>
        <TouchableOpacity
          style={styles.checkbox}
          onPress={() => setAcceptedArbitration(!acceptedArbitration)}
        >
          <View style={[styles.checkBox, acceptedArbitration && styles.checkBoxChecked]}>
            {acceptedArbitration && <Text style={styles.checkMark}>✓</Text>}
          </View>
          <Text style={styles.checkboxText}>
            I understand I'm waiving my right to sue in court and agreeing to binding arbitration
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.checkbox}
          onPress={() => setAcceptedNoRefunds(!acceptedNoRefunds)}
        >
          <View style={[styles.checkBox, acceptedNoRefunds && styles.checkBoxChecked]}>
            {acceptedNoRefunds && <Text style={styles.checkMark}>✓</Text>}
          </View>
          <Text style={styles.checkboxText}>
            I understand all purchases are FINAL with NO REFUNDS and virtual items have NO real money value
          </Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.finalWarning}>
        <Text style={styles.finalWarningText}>
          ⚠️ By clicking "I AGREE", you are entering a legally binding agreement
        </Text>
      </View>
      
      {loading ? (
        <ActivityIndicator size="large" color={BrandTheme.colors.primary} />
      ) : (
        <>
          <TouchableOpacity
            style={[
              styles.agreeButton,
              (!acceptedArbitration || !acceptedNoRefunds) && styles.buttonDisabled
            ]}
            onPress={handleFinalAcceptance}
            disabled={!acceptedArbitration || !acceptedNoRefunds}
          >
            <Text style={styles.agreeButtonText}>I AGREE TO ALL TERMS</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.declineButton}
            onPress={() => {
              Alert.alert(
                'Exit App',
                'You must accept the terms to use Pot of Gold. The app will now close.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { 
                    text: 'Exit', 
                    onPress: () => Platform.OS === 'android' ? 
                      (global as any).ExitApp?.exitApp() : undefined
                  },
                ]
              );
            }}
          >
            <Text style={styles.declineButtonText}>DECLINE & EXIT</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Legal Agreements</Text>
          <Text style={styles.headerSubtitle}>Step {step} of 5</Text>
        </View>
        
        {renderStepIndicator()}
        
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {step === 1 && renderAgeVerification()}
          {step === 2 && renderTermsOfService()}
          {step === 3 && renderPrivacyPolicy()}
          {step === 4 && renderEULA()}
          {step === 5 && renderFinalConfirmation()}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BrandTheme.colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: BrandTheme.colors.primary,
  },
  headerSubtitle: {
    fontSize: 14,
    color: BrandTheme.colors.text.secondary,
    marginTop: 5,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    gap: 10,
  },
  stepDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepDotActive: {
    backgroundColor: BrandTheme.colors.primary,
  },
  stepDotCurrent: {
    borderWidth: 2,
    borderColor: BrandTheme.colors.accent,
  },
  stepNumber: {
    color: '#fff',
    fontWeight: 'bold',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  stepContent: {
    alignItems: 'center',
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: BrandTheme.colors.primary,
    marginVertical: 15,
    textAlign: 'center',
  },
  stepDescription: {
    fontSize: 16,
    color: BrandTheme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  dateButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    marginVertical: 20,
  },
  dateButtonText: {
    color: '#fff',
    fontSize: 18,
  },
  warningBox: {
    backgroundColor: 'rgba(255, 165, 0, 0.1)',
    borderWidth: 1,
    borderColor: BrandTheme.colors.warning,
    borderRadius: 10,
    padding: 15,
    marginVertical: 20,
    width: '100%',
  },
  warningText: {
    color: BrandTheme.colors.warning,
    fontSize: 14,
    textAlign: 'center',
  },
  legalTextContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    padding: 15,
    maxHeight: 300,
    width: '100%',
    marginVertical: 20,
  },
  legalText: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
  },
  scrollHint: {
    color: BrandTheme.colors.warning,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 10,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
    width: '100%',
  },
  checkBox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: BrandTheme.colors.primary,
    borderRadius: 4,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkBoxChecked: {
    backgroundColor: BrandTheme.colors.primary,
  },
  checkMark: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },
  checkboxText: {
    color: '#fff',
    fontSize: 14,
    flex: 1,
  },
  disabled: {
    opacity: 0.5,
  },
  nextButton: {
    backgroundColor: BrandTheme.colors.primary,
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
    marginTop: 20,
    minWidth: 200,
  },
  nextButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  criticalPoints: {
    width: '100%',
    marginVertical: 20,
  },
  finalWarning: {
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    borderWidth: 2,
    borderColor: BrandTheme.colors.error,
    borderRadius: 10,
    padding: 15,
    marginVertical: 20,
    width: '100%',
  },
  finalWarningText: {
    color: BrandTheme.colors.error,
    fontSize: 14,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  agreeButton: {
    backgroundColor: BrandTheme.colors.success,
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
    marginTop: 10,
    minWidth: 250,
  },
  agreeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  declineButton: {
    backgroundColor: BrandTheme.colors.error,
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
    marginTop: 10,
    minWidth: 250,
  },
  declineButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default LegalAgreementScreen;