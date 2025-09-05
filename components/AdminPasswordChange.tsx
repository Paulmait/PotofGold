import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { validatePassword } from '../src/config/adminCredentials';

interface AdminPasswordChangeProps {
  isVisible: boolean;
  onPasswordChanged: (newPassword: string) => void;
  onCancel: () => void;
  isFirstLogin?: boolean;
}

export const AdminPasswordChange: React.FC<AdminPasswordChangeProps> = ({
  isVisible,
  onPasswordChanged,
  onCancel,
  isFirstLogin = false
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setErrors([]);
    }
  }, [isVisible]);

  const validateForm = (): boolean => {
    const newErrors: string[] = [];

    // Validate current password
    if (!currentPassword.trim()) {
      newErrors.push('Current password is required');
    }

    // Validate new password
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      newErrors.push(...passwordValidation.errors);
    }

    // Validate password confirmation
    if (newPassword !== confirmPassword) {
      newErrors.push('New passwords do not match');
    }

    // Check for common weak passwords
    const weakPasswords = ['password', '123456', 'admin', 'temp', 'TempPassword123!'];
    if (weakPasswords.includes(newPassword.toLowerCase())) {
      newErrors.push('Password is too common. Please choose a stronger password');
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Here you would typically make an API call to change the password
      // For now, we'll simulate the process
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Success
      Alert.alert(
        'Password Changed Successfully',
        'Your password has been updated. You will be logged out and need to sign in again.',
        [
          {
            text: 'OK',
            onPress: () => {
              onPasswordChanged(newPassword);
              setIsSubmitting(false);
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to change password. Please try again.');
      setIsSubmitting(false);
    }
  };

  const renderPasswordRequirements = () => (
    <View style={styles.requirementsContainer}>
      <Text style={styles.requirementsTitle}>Password Requirements:</Text>
      <Text style={styles.requirement}>• At least 8 characters long</Text>
      <Text style={styles.requirement}>• Include uppercase letters</Text>
      <Text style={styles.requirement}>• Include numbers</Text>
      <Text style={styles.requirement}>• Include special characters (!@#$%^&*)</Text>
      <Text style={styles.requirement}>• Not a common password</Text>
    </View>
  );

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onCancel}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {isFirstLogin ? 'Welcome! Change Your Password' : 'Change Password'}
            </Text>
            {isFirstLogin && (
              <Text style={styles.subtitle}>
                For security reasons, you must change your temporary password before continuing.
              </Text>
            )}
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Current Password</Text>
              <TextInput
                style={styles.input}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Enter current password"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>New Password</Text>
              <TextInput
                style={styles.input}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Enter new password"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm New Password</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm new password"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {renderPasswordRequirements()}

            {errors.length > 0 && (
              <View style={styles.errorsContainer}>
                {errors.map((error, index) => (
                  <Text key={index} style={styles.errorText}>
                    • {error}
                  </Text>
                ))}
              </View>
            )}

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={onCancel}
                disabled={isSubmitting}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.submitButton, isSubmitting && styles.disabledButton]}
                onPress={handleSubmit}
                disabled={isSubmitting}
              >
                <Text style={styles.submitButtonText}>
                  {isSubmitting ? 'Changing...' : 'Change Password'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    paddingTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  form: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  requirementsContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 8,
  },
  requirement: {
    fontSize: 13,
    color: '#6c757d',
    marginBottom: 4,
  },
  errorsContainer: {
    backgroundColor: '#f8d7da',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
  },
  errorText: {
    fontSize: 14,
    color: '#721c24',
    marginBottom: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#6c757d',
  },
  submitButton: {
    backgroundColor: '#007bff',
  },
  disabledButton: {
    backgroundColor: '#6c757d',
    opacity: 0.6,
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AdminPasswordChange;
