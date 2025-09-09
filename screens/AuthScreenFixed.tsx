import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  updateProfile,
  signInAnonymously,
} from 'firebase/auth';
import { auth } from '../firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { scale, fontScale, verticalScale } from '../utils/responsive';

const { width, height } = Dimensions.get('window');

interface AuthScreenFixedProps {
  navigation: any;
}

export default function AuthScreenFixed({ navigation }: AuthScreenFixedProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSignUp = async () => {
    if (!email || !password || !displayName) {
      if (Platform.OS === 'web') {
        alert('Please fill in all fields');
      } else {
        Alert.alert('Error', 'Please fill in all fields');
      }
      return;
    }

    setIsLoading(true);
    console.log('Starting sign up process...');

    try {
      // Create user account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      console.log('User created:', user.uid);

      // Update display name
      await updateProfile(user, {
        displayName: displayName,
      });

      // Create user profile in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: displayName,
        createdAt: new Date().toISOString(),
        coins: 0,
        highScore: 0,
        gamesPlayed: 0,
        achievements: [],
        purchasedSkins: [],
        selectedSkin: 'default',
      });

      console.log('User profile created in Firestore');

      // Save to AsyncStorage
      await AsyncStorage.setItem('user_uid', user.uid);
      await AsyncStorage.setItem('user_name', displayName);

      if (Platform.OS === 'web') {
        alert('Account created successfully!');
      } else {
        Alert.alert('Success!', 'Account created successfully!');
      }

      // Navigate to Home
      navigation.replace('Home');
    } catch (error: any) {
      console.error('Sign up error:', error);
      let errorMessage = 'Sign up failed. Please try again.';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already registered.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password should be at least 6 characters.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      }

      if (Platform.OS === 'web') {
        alert(errorMessage);
      } else {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async () => {
    if (!email || !password) {
      if (Platform.OS === 'web') {
        alert('Please fill in all fields');
      } else {
        Alert.alert('Error', 'Please fill in all fields');
      }
      return;
    }

    setIsLoading(true);
    console.log('Starting sign in process...');

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      console.log('User signed in:', user.uid);

      // Get user profile from Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        await AsyncStorage.setItem('user_coins', userData.coins?.toString() || '0');
        await AsyncStorage.setItem('user_high_score', userData.highScore?.toString() || '0');
      }

      // Save to AsyncStorage
      await AsyncStorage.setItem('user_uid', user.uid);
      await AsyncStorage.setItem('user_name', user.displayName || user.email || 'Player');

      if (Platform.OS === 'web') {
        console.log('Sign in successful!');
      } else {
        Alert.alert('Success!', 'Welcome back!');
      }

      // Navigate to Home
      navigation.replace('Home');
    } catch (error: any) {
      console.error('Sign in error:', error);
      let errorMessage = 'Sign in failed. Please try again.';
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      }

      if (Platform.OS === 'web') {
        alert(errorMessage);
      } else {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayAsGuest = async () => {
    setIsLoading(true);
    console.log('Starting guest play...');

    try {
      // Mark as guest in AsyncStorage
      await AsyncStorage.setItem('is_guest', 'true');
      await AsyncStorage.setItem('guest_started_at', new Date().toISOString());
      
      console.log('Guest mode activated');
      
      // Navigate directly to Home
      navigation.replace('Home');
    } catch (error) {
      console.error('Guest play error:', error);
      if (Platform.OS === 'web') {
        alert('Failed to start guest mode. Please try again.');
      } else {
        Alert.alert('Error', 'Failed to start guest mode. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuth = () => {
    if (isLogin) {
      handleSignIn();
    } else {
      handleSignUp();
    }
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setEmail('');
    setPassword('');
    setDisplayName('');
  };

  return (
    <LinearGradient
      colors={['#1a1a2e', '#16213e', '#0f3460']}
      style={styles.container}
    >
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.logo}>💰</Text>
            <Text style={styles.title}>Pot of Gold</Text>
            <Text style={styles.subtitle}>
              {isLogin ? 'Welcome Back!' : 'Create Your Account'}
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {!isLogin && (
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={scale(20)} color="#888" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Display Name"
                  placeholderTextColor="#888"
                  value={displayName}
                  onChangeText={setDisplayName}
                  autoCapitalize="words"
                />
              </View>
            )}

            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={scale(20)} color="#888" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#888"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={scale(20)} color="#888" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#888"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons 
                  name={showPassword ? "eye-outline" : "eye-off-outline"} 
                  size={scale(20)} 
                  color="#888" 
                />
              </TouchableOpacity>
            </View>

            {/* Auth Button */}
            <TouchableOpacity
              style={[styles.authButton, isLoading && styles.disabledButton]}
              onPress={handleAuth}
              disabled={isLoading}
            >
              <LinearGradient
                colors={['#FFD700', '#FFA500', '#FF8C00']}
                style={styles.authButtonGradient}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.authButtonText}>
                    {isLogin ? 'Sign In' : 'Create Account'}
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Toggle Auth Mode */}
            <TouchableOpacity onPress={toggleAuthMode} style={styles.toggleButton}>
              <Text style={styles.toggleText}>
                {isLogin ? "Don't have an account? " : 'Already have an account? '}
                <Text style={styles.toggleTextBold}>
                  {isLogin ? 'Sign Up' : 'Sign In'}
                </Text>
              </Text>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Play as Guest Button */}
            <TouchableOpacity
              style={[styles.guestButton, isLoading && styles.disabledButton]}
              onPress={handlePlayAsGuest}
              disabled={isLoading}
            >
              <Ionicons name="game-controller-outline" size={scale(24)} color="#FFF" />
              <Text style={styles.guestButtonText}>Play as Guest</Text>
            </TouchableOpacity>

            {/* Guest Info */}
            <View style={styles.guestInfo}>
              <Text style={styles.guestInfoText}>
                🎮 Playing as guest allows full game access
              </Text>
              <Text style={styles.guestInfoText}>
                ⚠️ Progress won't be saved without an account
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: scale(20),
    paddingTop: Platform.OS === 'ios' ? verticalScale(60) : verticalScale(40),
  },
  header: {
    alignItems: 'center',
    marginBottom: verticalScale(40),
  },
  logo: {
    fontSize: fontScale(60),
    marginBottom: verticalScale(10),
  },
  title: {
    fontSize: fontScale(32),
    fontWeight: 'bold',
    color: '#FFD700',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
  },
  subtitle: {
    fontSize: fontScale(16),
    color: '#FFA500',
    marginTop: verticalScale(5),
  },
  form: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: scale(10),
    marginBottom: verticalScale(15),
    paddingHorizontal: scale(15),
  },
  inputIcon: {
    marginRight: scale(10),
  },
  input: {
    flex: 1,
    color: '#FFF',
    fontSize: fontScale(16),
    paddingVertical: verticalScale(15),
  },
  eyeIcon: {
    padding: scale(5),
  },
  authButton: {
    marginTop: verticalScale(10),
    marginBottom: verticalScale(15),
  },
  authButtonGradient: {
    paddingVertical: verticalScale(15),
    borderRadius: scale(10),
    alignItems: 'center',
  },
  authButtonText: {
    fontSize: fontScale(18),
    fontWeight: 'bold',
    color: '#FFF',
  },
  disabledButton: {
    opacity: 0.6,
  },
  toggleButton: {
    alignItems: 'center',
    marginBottom: verticalScale(20),
  },
  toggleText: {
    color: '#AAA',
    fontSize: fontScale(14),
  },
  toggleTextBold: {
    color: '#FFD700',
    fontWeight: 'bold',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: verticalScale(20),
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  dividerText: {
    color: '#888',
    marginHorizontal: scale(10),
    fontSize: fontScale(14),
  },
  guestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: verticalScale(15),
    borderRadius: scale(10),
    marginBottom: verticalScale(15),
  },
  guestButtonText: {
    fontSize: fontScale(16),
    color: '#FFF',
    marginLeft: scale(10),
    fontWeight: '600',
  },
  guestInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: scale(10),
    padding: scale(15),
  },
  guestInfoText: {
    fontSize: fontScale(12),
    color: '#AAA',
    marginBottom: verticalScale(5),
  },
});