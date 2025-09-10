import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { GameProvider } from './context/GameContext';
import { UserUnlockProvider } from './context/UserUnlockContext';
import { UnlocksProvider } from './context/UnlocksContext';
import { View, ActivityIndicator, Alert, StyleSheet, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase/auth';
import { hasCompletedOnboarding, getDeviceAnalytics } from './utils/deviceTracking';
import SplashScreenEnhanced from './components/SplashScreenEnhanced';
import { useOrientation } from './hooks/useOrientation';
import * as ScreenOrientation from 'expo-screen-orientation';
import ErrorBoundary from './components/ErrorBoundary';
import sessionPersistence from './services/sessionPersistence';

// Screens
import GameScreen from './screens/GameScreen';
import GameScreenPerfect from './screens/GameScreenPerfect';
import GameScreenEnhanced from './screens/GameScreenEnhanced';
import GameScreenResponsive from './screens/GameScreenResponsive';
import GameScreenWrapped from './screens/GameScreenWrapped';
import HomeScreenGuest from './screens/HomeScreenGuest';
import AuthScreenFixed from './screens/AuthScreenFixed';
import AdminPanel from './screens/AdminPanel';
import SettingsScreen from './screens/SettingsScreen';
import ShopScreen from './screens/ShopScreen';
import ShopScreenPro from './screens/ShopScreenPro';
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

// GameScreenClean is already responsive and doesn't need additional wrapping

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

      // Check session and user preferences
      const session = await sessionPersistence.getSession();
      const currentLegalVersion = '2.0';
      
      // Check legal acceptance with session persistence
      const legalAccepted = await sessionPersistence.hasAcceptedLegal(currentLegalVersion);
      setHasAcceptedLegal(legalAccepted);
      setLegalVersion(currentLegalVersion);

      // Check onboarding status with session persistence
      const hasCompletedOnb = await sessionPersistence.hasCompletedOnboarding();
      setHasSeenOnboarding(hasCompletedOnb);
      
      // Update last active time
      await sessionPersistence.updateLastActive();
      
      // Track device analytics
      const analytics = await getDeviceAnalytics();
      console.log('Device analytics:', analytics);

      // Set up auth listener
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        try {
          if (user) {
            setIsAuthenticated(true);
            
            // Save user data to session
            await sessionPersistence.saveUserData(
              user.uid,
              user.email || undefined,
              user.displayName || undefined,
              false
            );
            
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
        } catch (error) {
          console.error('Auth state change error:', error);
          // Don't crash the app on auth errors
        } finally {
          setIsLoading(false);
        }
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

  // Main app content
  const AppContent = (
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
              <>
                <Stack.Screen 
                  name="LegalAgreement" 
                  component={LegalAgreementScreen}
                  initialParams={{
                    onAccept: async () => {
                      await sessionPersistence.acceptLegal(legalVersion);
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
                {/* Add all screens as fallback during transition */}
                <Stack.Screen name="Onboarding" component={OnboardingScreen} />
                <Stack.Screen name="Home" component={HomeScreenGuest} />
                <Stack.Screen name="Game" component={GameScreenPerfect} />
              </>
            ) : !hasSeenOnboarding ? (
              <>
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
                {/* Add Home screen as fallback during transition */}
                <Stack.Screen name="Home" component={HomeScreenGuest} />
              </>
            ) : !isAuthenticated ? (
              <>
                <Stack.Screen name="Home" component={HomeScreenGuest} />
                <Stack.Screen name="Game" component={GameScreenPerfect} />
                <Stack.Screen name="GameOver" component={GameOverScreen} />
                <Stack.Screen name="Auth" component={AuthScreenFixed} />
                <Stack.Screen name="Shop" component={ShopScreenPro} />
                <Stack.Screen name="HowToPlay" component={HowToPlayScreen} />
              </>
            ) : (
              <>
                <Stack.Screen name="Home" component={HomeScreenGuest} />
                <Stack.Screen name="Game" component={GameScreenPerfect} />
                <Stack.Screen name="Settings" component={SettingsScreen} />
                <Stack.Screen name="Shop" component={ShopScreenPro} />
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
  );

  // Don't wrap navigation with ResponsiveGameWrapper - only game screens need it
  return (
    <ErrorBoundary>
      {AppContent}
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