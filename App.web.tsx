import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { GameProvider } from './context/GameContext';
import { UserUnlockProvider } from './context/UserUnlockContext';
import { UnlocksProvider } from './context/UnlocksContext';
import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase/auth';
import { hasCompletedOnboarding, getDeviceAnalytics } from './utils/deviceTracking';

// Components
import GameLoadingSplash from './components/GameLoadingSplash';

// Screens - Use web-optimized versions
import GameScreenWeb from './screens/GameScreenWeb';
import HomeScreenWeb from './screens/HomeScreenWeb';
import AuthScreenFixed from './screens/AuthScreenFixed';
import AdminPanel from './screens/AdminPanel';
import SettingsScreen from './screens/SettingsScreen';
import ShopScreenPro from './screens/ShopScreenPro';
import SkinShopScreen from './screens/SkinShopScreen';
import LockerScreen from './screens/LockerScreen';
import LeaderboardScreen from './screens/LeaderboardScreen';
import StatsScreen from './screens/StatsScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import LegalAgreementScreen from './screens/LegalAgreementScreen';
import HowToPlayScreen from './screens/HowToPlayScreen';
import GameOverScreen from './screens/GameOverScreen';

// Services
import authService from './services/authService';
import crashReporting from './services/crashReporting';

const Stack = createStackNavigator();

// Global app start time for performance tracking
if (typeof globalThis !== 'undefined') {
  (globalThis as any).appStartTime = Date.now();
}

export default function AppWeb() {
  const [isLoading, setIsLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const [hasAcceptedLegal, setHasAcceptedLegal] = useState(false);
  const [legalVersion, setLegalVersion] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
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
      const currentLegalVersion = '2.0';
      
      if (legalAcceptance && acceptedVersion === currentLegalVersion) {
        setHasAcceptedLegal(true);
      } else {
        setHasAcceptedLegal(false);
      }
      setLegalVersion(currentLegalVersion);

      // Check onboarding status with device tracking
      const hasCompleted = await hasCompletedOnboarding();
      setHasSeenOnboarding(hasCompleted);
      
      // Track device analytics
      const analytics = await getDeviceAnalytics();
      console.log('Device analytics:', analytics);

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
      <GameLoadingSplash 
        onComplete={() => setShowSplash(false)}
        duration={2500}
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
    <View style={styles.appContainer}>
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
                            await AsyncStorage.setItem('legal_accepted', 'true');
                            await AsyncStorage.setItem('legal_version_accepted', legalVersion);
                            setHasAcceptedLegal(true);
                          },
                          onDecline: () => {
                            alert('You must accept the legal agreements to use Pot of Gold.');
                          }
                        }}
                      />
                      {/* Add all screens as fallback during transition */}
                      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
                      <Stack.Screen name="Home" component={HomeScreenWeb} />
                      <Stack.Screen name="Game" component={GameScreenWeb} />
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
                      <Stack.Screen name="Home" component={HomeScreenWeb} />
                    </>
                  ) : !isAuthenticated ? (
                    <>
                      <Stack.Screen name="Home" component={HomeScreenWeb} />
                      <Stack.Screen name="Game" component={GameScreenWeb} />
                      <Stack.Screen name="GameOver" component={GameOverScreen} />
                      <Stack.Screen name="Auth" component={AuthScreenFixed} />
                      <Stack.Screen name="Shop" component={ShopScreenPro} />
                      <Stack.Screen name="HowToPlay" component={HowToPlayScreen} />
                    </>
                  ) : (
                    <>
                      <Stack.Screen name="Home" component={HomeScreenWeb} />
                      <Stack.Screen name="Game" component={GameScreenWeb} />
                      <Stack.Screen name="GameOver" component={GameOverScreen} />
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
      </View>
  );
}

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#1a1a2e',
    ...Platform.select({
      web: {
        height: '100vh',
        overflow: 'hidden',
      },
    }),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
  },
});