import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BrandTheme } from '../src/styles/BrandTheme';

interface LegalDisclaimerProps {
  visible: boolean;
  onAccept: () => void;
  onDecline: () => void;
  type: 'purchase' | 'reminder';
  purchaseAmount?: string;
}

const LegalDisclaimer: React.FC<LegalDisclaimerProps> = ({
  visible,
  onAccept,
  onDecline,
  type,
  purchaseAmount,
}) => {
  const [hasScrolledToEnd, setHasScrolledToEnd] = useState(false);

  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 20;
    const isCloseToBottom =
      layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;

    if (isCloseToBottom && !hasScrolledToEnd) {
      setHasScrolledToEnd(true);
    }
  };

  const handleAccept = async () => {
    // Log acceptance for audit trail
    const timestamp = new Date().toISOString();
    const disclaimerLog = {
      type,
      timestamp,
      accepted: true,
      purchaseAmount,
    };

    try {
      const existingLogs = await AsyncStorage.getItem('disclaimer_logs');
      const logs = existingLogs ? JSON.parse(existingLogs) : [];
      logs.push(disclaimerLog);

      // Keep only last 100 logs
      if (logs.length > 100) {
        logs.splice(0, logs.length - 100);
      }

      await AsyncStorage.setItem('disclaimer_logs', JSON.stringify(logs));
    } catch (error) {
      console.error('Failed to log disclaimer acceptance:', error);
    }

    onAccept();
  };

  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onDecline}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>⚠️ IMPORTANT DISCLAIMER</Text>

          {type === 'purchase' && (
            <>
              <Text style={styles.warningTitle}>BEFORE YOU PURCHASE</Text>
              {purchaseAmount && (
                <Text style={styles.purchaseAmount}>You are about to spend: ${purchaseAmount}</Text>
              )}
            </>
          )}

          <ScrollView style={styles.scrollView} onScroll={handleScroll} scrollEventThrottle={16}>
            <Text style={styles.disclaimerText}>
              {`PLEASE READ AND UNDERSTAND:

NO REAL MONEY VALUE
Virtual coins, items, and currency in Pot of Gold have ZERO real-world monetary value and CANNOT be:
• Exchanged for real money
• Sold or traded
• Transferred to other accounts
• Redeemed for cash or prizes

NOT GAMBLING
This is NOT a gambling game. You CANNOT win real money. This is purely for entertainment.

ALL SALES FINAL
All purchases are FINAL and NON-REFUNDABLE. By proceeding, you acknowledge that:
• You are spending real money on virtual items
• These items have no monetary value
• You cannot get your money back
• Items may be lost if your account is terminated

ENTERTAINMENT ONLY
This game is for entertainment purposes only. Virtual items are licensed, not owned, and may be modified or removed at any time.

AGE RESTRICTION
You must be at least 13 years old. Users under 18 require parental permission for purchases.

By clicking "I UNDERSTAND & ACCEPT", you confirm:
✓ You understand virtual items have NO real value
✓ You accept all purchases are FINAL
✓ You are authorized to make this purchase
✓ You have read and accept these terms`}
            </Text>
          </ScrollView>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.declineButton} onPress={onDecline}>
              <Text style={styles.buttonText}>CANCEL</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.acceptButton, !hasScrolledToEnd && styles.disabledButton]}
              onPress={handleAccept}
              disabled={!hasScrolledToEnd}
            >
              <Text style={[styles.buttonText, !hasScrolledToEnd && styles.disabledButtonText]}>
                {hasScrolledToEnd ? 'I UNDERSTAND & ACCEPT' : 'SCROLL TO READ'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
    backgroundColor: BrandTheme.colors.surface,
    borderRadius: 15,
    padding: 20,
    borderWidth: 2,
    borderColor: BrandTheme.colors.primary,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 10,
  },
  warningTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF4444',
    textAlign: 'center',
    marginBottom: 5,
  },
  purchaseAmount: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#00FF00',
    textAlign: 'center',
    marginBottom: 15,
  },
  scrollView: {
    maxHeight: 300,
    marginVertical: 20,
  },
  disclaimerText: {
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  declineButton: {
    flex: 1,
    backgroundColor: '#666666',
    padding: 15,
    borderRadius: 10,
    marginRight: 10,
  },
  acceptButton: {
    flex: 1,
    backgroundColor: BrandTheme.colors.success,
    padding: 15,
    borderRadius: 10,
    marginLeft: 10,
  },
  disabledButton: {
    backgroundColor: '#333333',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  disabledButtonText: {
    color: '#666666',
  },
});

export default LegalDisclaimer;
