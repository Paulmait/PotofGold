import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

interface LegalConsent {
  termsAccepted: boolean;
  privacyAccepted: boolean;
  ageVerified: boolean;
  marketingOptIn: boolean;
  dataProcessingConsent: boolean;
  acceptedDate?: string;
  acceptedVersion: string;
}

export const LegalScreen: React.FC<{ navigation: any; onAccept?: () => void }> = ({ 
  navigation, 
  onAccept 
}) => {
  const [consent, setConsent] = useState<LegalConsent>({
    termsAccepted: false,
    privacyAccepted: false,
    ageVerified: false,
    marketingOptIn: false,
    dataProcessingConsent: false,
    acceptedVersion: '1.0.0',
  });

  const [isFirstLaunch, setIsFirstLaunch] = useState(true);

  useEffect(() => {
    checkExistingConsent();
  }, []);

  const checkExistingConsent = async () => {
    const existing = await AsyncStorage.getItem('legal_consent');
    if (existing) {
      const parsed = JSON.parse(existing);
      setConsent(parsed);
      setIsFirstLaunch(false);
    }
  };

  const handleAccept = async () => {
    if (!consent.termsAccepted || !consent.privacyAccepted || !consent.ageVerified) {
      Alert.alert(
        'Required Agreements',
        'You must accept the Terms of Service, Privacy Policy, and verify your age to continue.'
      );
      return;
    }

    const finalConsent = {
      ...consent,
      acceptedDate: new Date().toISOString(),
    };

    await AsyncStorage.setItem('legal_consent', JSON.stringify(finalConsent));
    
    if (onAccept) {
      onAccept();
    } else {
      navigation.navigate('Home');
    }
  };

  const openLink = (url: string) => {
    Linking.openURL(url);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Legal & Privacy</Text>
        <Text style={styles.subtitle}>Please review and accept our policies</Text>
      </View>

      {/* TERMS OF SERVICE */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Terms of Service</Text>
        <ScrollView style={styles.legalTextContainer} nestedScrollEnabled>
          <Text style={styles.legalText}>
            {`TERMS OF SERVICE - POT OF GOLD

Last Updated: ${new Date().toLocaleDateString()}

1. ACCEPTANCE OF TERMS
By downloading, installing, or using Pot of Gold ("the Game"), you agree to be bound by these Terms of Service. If you do not agree, do not use the Game.

2. AGE REQUIREMENTS
You must be at least 4 years old to play. Users under 13 require parental consent. Users under 18 may have restricted features.

3. ACCOUNT RESPONSIBILITIES
- You are responsible for maintaining account security
- Do not share your account credentials
- Notify us immediately of unauthorized access

4. PURCHASES & REFUNDS
- All purchases are final unless required by law
- EU residents have 14-day cooling-off period
- Refunds processed per platform policies (Apple/Google)
- Subscriptions auto-renew unless cancelled
- Cancel anytime with immediate effect

5. VIRTUAL ITEMS
- Virtual items have no real-world value
- Cannot be exchanged for real money
- May be lost if account is terminated
- We may modify or remove items with notice

6. USER CONDUCT
Prohibited actions:
- Cheating, hacking, or exploiting bugs
- Harassment or abusive behavior
- Impersonation or false information
- Commercial use without permission
- Violation of any applicable laws

7. INTELLECTUAL PROPERTY
- All content is owned by Cien Rios LLC
- Limited license to use for personal entertainment
- No reproduction or distribution allowed
- User content grants us worldwide license

8. DISCLAIMERS
THE GAME IS PROVIDED "AS IS" WITHOUT WARRANTIES. WE ARE NOT LIABLE FOR:
- Service interruptions or data loss
- Third-party actions or content
- Indirect or consequential damages
- Amounts exceeding past 12 months of fees

9. INDEMNIFICATION
You agree to indemnify Cien Rios LLC from claims arising from your use of the Game or violation of these Terms.

10. DISPUTE RESOLUTION
- Governed by laws of [Your State/Country]
- Disputes resolved through binding arbitration
- Class action waiver applies
- Small claims court exception

11. CHANGES TO TERMS
We may update these Terms. Continued use constitutes acceptance of changes.

12. CONTACT
Email: support@cienrios.com
Address: [Your Business Address]`}
          </Text>
        </ScrollView>
        <View style={styles.consentRow}>
          <Switch
            value={consent.termsAccepted}
            onValueChange={(value) => setConsent({...consent, termsAccepted: value})}
          />
          <Text style={styles.consentText}>I accept the Terms of Service</Text>
        </View>
      </View>

      {/* PRIVACY POLICY */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Privacy Policy</Text>
        <ScrollView style={styles.legalTextContainer} nestedScrollEnabled>
          <Text style={styles.legalText}>
            {`PRIVACY POLICY - POT OF GOLD

Last Updated: ${new Date().toLocaleDateString()}

1. INFORMATION WE COLLECT
Personal Information:
- Email address (optional)
- Username (chosen by you)
- Age/birthdate (for compliance)

Automatic Collection:
- Device information (model, OS)
- Gameplay statistics
- IP address (anonymized)
- Crash reports

We do NOT collect:
- Real names (unless provided)
- Payment information (handled by platforms)
- Precise location
- Contacts or photos

2. HOW WE USE INFORMATION
- Provide and improve the Game
- Customer support
- Legal compliance (COPPA, GDPR)
- Analytics (aggregated only)
- Marketing (with consent only)

3. INFORMATION SHARING
We share data only with:
- Service providers (under contracts)
- Legal requirements
- Business transfers
- With your consent

We NEVER sell personal data.

4. CHILDREN'S PRIVACY (COPPA)
For users under 13:
- Parental consent required
- No behavioral advertising
- Limited data collection
- Parental access rights
- Deletion upon request

5. DATA SECURITY
- Encryption in transit and at rest
- Regular security audits
- Limited access controls
- Incident response procedures
- No 100% guarantee

6. YOUR RIGHTS (GDPR/CCPA)
You have the right to:
- Access your data
- Correct inaccuracies
- Delete your data
- Port your data
- Opt-out of marketing
- Lodge complaints

7. DATA RETENTION
- Active accounts: Duration of service
- Inactive accounts: 2 years
- Legal records: 7 years
- Marketing: Until opt-out

8. COOKIES & TRACKING
- Essential cookies only
- No third-party tracking
- Analytics with consent
- Disable in settings

9. INTERNATIONAL TRANSFERS
Data may be processed in:
- United States
- Countries where servers located
- Appropriate safeguards in place

10. CHANGES TO POLICY
- Notification of material changes
- 30-day notice period
- Continued use is acceptance

11. CONTACT PRIVACY TEAM
Email: privacy@cienrios.com
Data Protection Officer: [Name]
Address: [Your Business Address]

12. SUPERVISORY AUTHORITY
EU: Your local DPA
California: privacy.ca.gov`}
          </Text>
        </ScrollView>
        <View style={styles.consentRow}>
          <Switch
            value={consent.privacyAccepted}
            onValueChange={(value) => setConsent({...consent, privacyAccepted: value})}
          />
          <Text style={styles.consentText}>I accept the Privacy Policy</Text>
        </View>
      </View>

      {/* AGE VERIFICATION */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Age Verification</Text>
        <Text style={styles.ageText}>
          To comply with child protection laws (COPPA, GDPR-K), we must verify your age.
        </Text>
        <View style={styles.consentRow}>
          <Switch
            value={consent.ageVerified}
            onValueChange={(value) => setConsent({...consent, ageVerified: value})}
          />
          <Text style={styles.consentText}>I am 13 years or older</Text>
        </View>
        <Text style={styles.warningText}>
          If you are under 13, please ask a parent or guardian to help you.
        </Text>
      </View>

      {/* OPTIONAL CONSENTS */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Optional Permissions</Text>
        
        <View style={styles.consentRow}>
          <Switch
            value={consent.marketingOptIn}
            onValueChange={(value) => setConsent({...consent, marketingOptIn: value})}
          />
          <Text style={styles.consentText}>
            Send me news and special offers (you can unsubscribe anytime)
          </Text>
        </View>

        <View style={styles.consentRow}>
          <Switch
            value={consent.dataProcessingConsent}
            onValueChange={(value) => setConsent({...consent, dataProcessingConsent: value})}
          />
          <Text style={styles.consentText}>
            Use my gameplay data to improve the game experience
          </Text>
        </View>
      </View>

      {/* IMPORTANT DISCLAIMERS */}
      <View style={styles.disclaimerSection}>
        <Text style={styles.disclaimerTitle}>⚠️ Important Disclaimers</Text>
        
        <Text style={styles.disclaimerText}>
          • This game contains optional in-app purchases
        </Text>
        <Text style={styles.disclaimerText}>
          • Virtual items have no real money value
        </Text>
        <Text style={styles.disclaimerText}>
          • Game requires internet connection
        </Text>
        <Text style={styles.disclaimerText}>
          • Contains advertisements (can be removed via purchase)
        </Text>
        <Text style={styles.disclaimerText}>
          • Not intended as gambling - no real money prizes
        </Text>
        <Text style={styles.disclaimerText}>
          • Gameplay data may be used for analytics
        </Text>
        <Text style={styles.disclaimerText}>
          • Subject to platform terms (Apple/Google)
        </Text>
      </View>

      {/* MEDICAL DISCLAIMER */}
      <View style={styles.disclaimerSection}>
        <Text style={styles.disclaimerTitle}>Medical & Safety Warning</Text>
        <Text style={styles.warningText}>
          A small percentage of people may experience seizures when exposed to certain visual images, including flashing lights or patterns. If you or anyone in your family has an epileptic condition, consult your physician before playing.
        </Text>
        <Text style={styles.warningText}>
          Take regular breaks. Stop playing if you experience: dizziness, altered vision, eye or muscle twitches, loss of awareness, disorientation, or any involuntary movement.
        </Text>
      </View>

      {/* PLATFORM POLICIES */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Platform Policies</Text>
        <TouchableOpacity onPress={() => openLink('https://www.apple.com/legal/internet-services/itunes/dev/stdeula/')}>
          <Text style={styles.link}>Apple App Store EULA →</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => openLink('https://play.google.com/about/play-terms/')}>
          <Text style={styles.link}>Google Play Terms →</Text>
        </TouchableOpacity>
      </View>

      {/* YOUR RIGHTS */}
      <View style={styles.rightsSection}>
        <Text style={styles.sectionTitle}>Your Rights & Controls</Text>
        
        <TouchableOpacity style={styles.rightButton} onPress={() => navigation.navigate('DataRequest')}>
          <Ionicons name="download-outline" size={20} />
          <Text style={styles.rightButtonText}>Request My Data</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.rightButton} onPress={() => navigation.navigate('DeleteAccount')}>
          <Ionicons name="trash-outline" size={20} />
          <Text style={styles.rightButtonText}>Delete My Account</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.rightButton} onPress={() => navigation.navigate('ManageConsent')}>
          <Ionicons name="settings-outline" size={20} />
          <Text style={styles.rightButtonText}>Manage Privacy Settings</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.rightButton} onPress={() => openLink('mailto:privacy@cienrios.com')}>
          <Ionicons name="mail-outline" size={20} />
          <Text style={styles.rightButtonText}>Contact Privacy Team</Text>
        </TouchableOpacity>
      </View>

      {/* ACCEPT BUTTON */}
      <TouchableOpacity 
        style={[
          styles.acceptButton,
          (!consent.termsAccepted || !consent.privacyAccepted || !consent.ageVerified) && styles.acceptButtonDisabled
        ]}
        onPress={handleAccept}
        disabled={!consent.termsAccepted || !consent.privacyAccepted || !consent.ageVerified}
      >
        <Text style={styles.acceptButtonText}>
          {isFirstLaunch ? 'Accept and Continue' : 'Save Changes'}
        </Text>
      </TouchableOpacity>

      {/* FOOTER */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          © 2024 Cien Rios LLC. All rights reserved.
        </Text>
        <Text style={styles.footerText}>
          Version 1.0.0 | Last Updated: {new Date().toLocaleDateString()}
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#4CAF50',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  subtitle: {
    fontSize: 16,
    color: 'white',
    opacity: 0.9,
    marginTop: 5,
  },
  section: {
    backgroundColor: 'white',
    margin: 10,
    padding: 15,
    borderRadius: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  legalTextContainer: {
    maxHeight: 200,
    backgroundColor: '#f9f9f9',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  legalText: {
    fontSize: 12,
    lineHeight: 18,
    color: '#333',
  },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  consentText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
  },
  ageText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  warningText: {
    fontSize: 12,
    color: '#ff9800',
    marginTop: 5,
    fontStyle: 'italic',
  },
  disclaimerSection: {
    backgroundColor: '#fff3e0',
    margin: 10,
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ffb74d',
  },
  disclaimerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e65100',
    marginBottom: 10,
  },
  disclaimerText: {
    fontSize: 13,
    color: '#bf360c',
    marginBottom: 5,
  },
  link: {
    fontSize: 14,
    color: '#2196F3',
    textDecorationLine: 'underline',
    marginVertical: 5,
  },
  rightsSection: {
    backgroundColor: 'white',
    margin: 10,
    padding: 15,
    borderRadius: 10,
  },
  rightButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginVertical: 5,
  },
  rightButtonText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#333',
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
    margin: 20,
    padding: 18,
    borderRadius: 10,
    alignItems: 'center',
  },
  acceptButtonDisabled: {
    backgroundColor: '#ccc',
  },
  acceptButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 5,
  },
});

export default LegalScreen;