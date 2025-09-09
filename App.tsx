import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { GameProvider } from './context/GameContext';
import { UserUnlockProvider } from './context/UserUnlockContext';
import { UnlocksProvider } from './context/UnlocksContext';
import { View, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase/auth';
import SplashScreenEnhanced from './components/SplashScreenEnhanced';
import { useOrientation } from './hooks/useOrientation';
import * as ScreenOrientation from 'expo-screen-orientation';
import ResponsiveGameWrapper from './components/ResponsiveGameWrapper';
import ErrorBoundary from './components/ErrorBoundary';
import WebGameContainer from './components/WebGameContainer';
import ResponsiveGameLayout from './components/ResponsiveGameLayout';

// Screens
import GameScreen from './screens/GameScreen';
import GameScreenEnhanced from './screens/GameScreenEnhanced';
import GameScreenPro from './screens/GameScreenPro';
import HomeScreen from './screens/HomeScreen';
import AuthScreen from './screens/AuthScreen';
import AdminPanel from './screens/AdminPanel';
import SettingsScreen from './screens/SettingsScreen';
import ShopScreen from './screens/ShopScreen';
import SkinShopScreen from './screens/SkinShopScreen';
import LockerScreen from './screens/LockerScreen';
import LeaderboardScreen from './screens/LeaderboardScreen';
import StatsScreen from './screens/StatsScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import HowToPlayScreen from './screens/HowToPlayScreen';
import PauseModal from './screens/PauseModal';
import GameOverScreen from './screens/GameOverScreen';
import LegalAgreementScreen from './screens/LegalAgreementScreen';

// Services
import authService from './services/authService';
import crashReporting from './services/crashReporting';

const Stack = createStackNavigator();

// Mark app start time for performance tracking
declare global {
  var appStartTime: number;
}
globalThis.appStartTime = Date.now();

// Wrapped GameScreen with responsive orientation support
const ResponsiveGameScreen = (props: any) => {
  const [gameState, setGameState] = useState({
    isPaused: false,
    score: 0,
    coins: 0,
    level: 1,
    cartPosition: 0,
    fallingItems: [],
    powerUps: [],
  });

  return (
    <ResponsiveGameWrapper
      gameState={gameState}
      onOrientationChange={(orientation) => {
        console.log('Orientation changed to:', orientation);
      }}
    >
      <GameScreen {...props} />
    </ResponsiveGameWrapper>
  );
};

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const [hasAcceptedLegal, setHasAcceptedLegal] = useState(false);
  const [legalVersion, setLegalVersion] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  
  const orientation = useOrientation();

  useEffect(() => {
    // Allow all orientations
    ScreenOrientation.unlockAsync();
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Initialize crash reporting
      crashReporting.initialize();
      crashReporting.trackAppPerformance();

      // Check legal acceptance status
      const legalAcceptance = await AsyncStorage.getItem('legal_accepted');
      const acceptedVersion = await AsyncStorage.getItem('legal_version_accepted');
      const currentLegalVersion = '2.0'; // Update this when legal terms change
      
      if (legalAcceptance && acceptedVersion === currentLegalVersion) {
        setHasAcceptedLegal(true);
      } else {
        setHasAcceptedLegal(false);
      }
      setLegalVersion(currentLegalVersion);

      // Check onboarding status
      const onboardingStatus = await AsyncStorage.getItem('hasSeenOnboarding');
      setHasSeenOnboarding(onboardingStatus === 'true');

      // Set up auth listener
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          setIsAuthenticated(true);
          
          // Load user profile
          await authService.loadUserProfile(user.uid);
          
          // Check admin status
          const adminStatus = await authService.checkAdminStatus();
          setIsAdmin(adminStatus);
          
          // Set user context for crash reporting
          crashReporting.setUser({
            id: user.uid,
            email: user.email || undefined,
            username: user.displayName || undefined,
          });

          // Sync offline updates if any
          await authService.syncOfflineUpdates();
        } else {
          setIsAuthenticated(false);
          setIsAdmin(false);
          crashReporting.setUser(null);
        }
        setIsLoading(false);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('App initialization error:', error);
      crashReporting.logException(error as Error, { context: 'app_initialization' });
      setIsLoading(false);
    }
  };

  // Show splash screen first
  if (showSplash) {
    return (
      <SplashScreenEnhanced 
        onComplete={() => setShowSplash(false)}
        duration={3500}
      />
    );
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFD700" />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <WebGameContainer>
        <ResponsiveGameLayout>
          <NavigationContainer>
            <UnlocksProvider>
              <UserUnlockProvider>
                <GameProvider>
            <Stack.Navigator
            screenOptions={{
              headerShown: false,
              animationEnabled: true,
              cardStyleInterpolator: ({ current }) => ({
                cardStyle: {
                  opacity: current.progress,
                },
              }),
            }}
          >
            {!hasAcceptedLegal ? (
              <Stack.Screen 
                name="LegalAgreement" 
                component={LegalAgreementScreen}
                initialParams={{
                  onAccept: async () => {
                    await AsyncStorage.setItem('legal_accepted', 'true');
                    await AsyncStorage.setItem('legal_version_accepted', legalVersion);
                    setHasAcceptedLegal(true);
                  },
                  onDecline: () => {
                    Alert.alert(
                      'Agreement Required',
                      'You must accept the legal agreements to use Pot of Gold.',
                      [{ text: 'Exit', onPress: () => {} }]
                    );
                  }
                }}
              />
            ) : !hasSeenOnboarding ? (
              <Stack.Screen 
                name="Onboarding" 
                component={OnboardingScreen}
                initialParams={{
                  onComplete: async () => {
                    await AsyncStorage.setItem('hasSeenOnboarding', 'true');
                    setHasSeenOnboarding(true);
                  }
                }}
              />
            ) : !isAuthenticated ? (
              <>
                <Stack.Screen name="Auth" component={AuthScreen} />
                <Stack.Screen name="Game" component={GameScreenPro} />
              </>
            ) : (
              <>
                <Stack.Screen name="Home" component={HomeScreen} />
                <Stack.Screen name="Game" component={GameScreenPro} />
                <Stack.Screen name="Settings" component={SettingsScreen} />
                <Stack.Screen name="Shop" component={ShopScreen} />
                <Stack.Screen name="SkinShop" component={SkinShopScreen} />
                <Stack.Screen name="Locker" component={LockerScreen} />
                <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
                <Stack.Screen name="Stats" component={StatsScreen} />
                <Stack.Screen name="HowToPlay" component={HowToPlayScreen} />
                {isAdmin && (
                  <Stack.Screen name="AdminPanel" component={AdminPanel} />
                )}
              </>
            )}
            </Stack.Navigator>
          </GameProvider>
        </UserUnlockProvider>
      </UnlocksProvider>
    </NavigationContainer>
    </ResponsiveGameLayout>
    </WebGameContainer>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
  },
});