
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { GameProvider } from './context/GameContext';
import { UserUnlockProvider } from './context/UserUnlockContext';
import { AdaptiveQualityProvider } from './src/components/AdaptiveQualityProvider';
import GameScreen from './screens/GameScreen';
import SkinShopScreen from './screens/SkinShopScreen';
import SubscriptionVaultScreen from './screens/SubscriptionVaultScreen';
import SettingsScreen from './screens/SettingsScreen';
import ShopScreen from './screens/ShopScreen';
import LockerScreen from './screens/LockerScreen';
import HomeScreen from './screens/HomeScreen';
import CampScreen from './screens/CampScreen';
import MissionsScreen from './screens/MissionsScreen';
import StateCollectionScreen from './screens/StateCollectionScreen';
import LeaderboardScreen from './screens/LeaderboardScreen';
import StatsScreen from './screens/StatsScreen';
import StoreScreen from './screens/StoreScreen';
import BuyGoldScreen from './screens/BuyGoldScreen';
import UpgradeScreen from './screens/UpgradeScreen';
import ChallengeFriendsScreen from './screens/ChallengeFriendsScreen';
import LegalScreen from './screens/LegalScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import AuthScreen from './screens/AuthScreen';
import { RevenueCatManager } from './src/lib/revenuecat';
import { deviceInfoManager } from './src/utils/deviceInfo';
import { performanceMonitor } from './src/utils/performanceMonitor';
import { telemetrySystem } from './src/systems/TelemetrySystem';
import { crashReporting } from './src/systems/CrashReporting';
import { hapticEngine } from './src/systems/HapticEngine';
import { dynamicDifficulty } from './src/systems/DynamicDifficulty';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, View, ActivityIndicator, Text, StyleSheet } from 'react-native';

const Stack = createStackNavigator();

export default function App() {
  const [isRevenueCatReady, setIsRevenueCatReady] = useState(false);
  const [isFirstLaunch, setIsFirstLaunch] = useState(false);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Initialize device info first
      await deviceInfoManager.refresh();
      const deviceProfile = deviceInfoManager.getDeviceProfile();
      console.log('Device initialized:', {
        device: deviceProfile.deviceName,
        type: deviceProfile.deviceType,
        performance: deviceProfile.performanceTier,
        resolution: deviceProfile.screenResolution,
      });

      // Initialize crash reporting early
      await crashReporting.initialize();

      // Check if first launch
      const hasLaunched = await AsyncStorage.getItem('hasLaunched');
      const userId = await AsyncStorage.getItem('userId') || `user_${Date.now()}`;
      
      if (!hasLaunched) {
        setIsFirstLaunch(true);
        await AsyncStorage.setItem('hasLaunched', 'true');
        await AsyncStorage.setItem('userId', userId);
      }

      // Initialize telemetry system
      telemetrySystem.startSession(userId);

      // Initialize RevenueCat
      await RevenueCatManager.initialize(userId);
      
      // Start performance monitoring
      performanceMonitor.reset();
      
      // Initialize dynamic difficulty
      dynamicDifficulty.startSession();
      
      // Initialize haptic engine (it initializes automatically)
      
      setIsRevenueCatReady(true);
      
      // Track successful initialization
      telemetrySystem.track('app_initialized' as any, {
        isFirstLaunch,
        deviceType: deviceProfile.deviceType,
        performanceTier: deviceProfile.performanceTier
      });
      
    } catch (error) {
      console.error('Failed to initialize app:', error);
      
      // Report the error to crash reporting
      crashReporting.handleError(error as Error, 'app_initialization' as any);
      
      Alert.alert(
        'Initialization Error',
        'Failed to initialize the app. Please restart.',
        [{ text: 'OK' }]
      );
      setIsRevenueCatReady(true); // Allow app to continue even if RC fails
    }
  };

  if (!isRevenueCatReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#FFD700" />
      </View>
    );
  }

  return (
    <AdaptiveQualityProvider>
      <NavigationContainer>
        <UserUnlockProvider>
          <GameProvider>
            <Stack.Navigator 
            initialRouteName={isFirstLaunch ? "Welcome" : "Game"}
            screenOptions={{
              headerStyle: {
                backgroundColor: '#1A1A1A',
              },
              headerTintColor: '#FFD700',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
            }}
          >
            <Stack.Screen 
              name="Game" 
              component={GameScreen} 
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="SkinShop" 
              component={SkinShopScreen} 
              options={{ title: 'State Skins' }}
            />
            <Stack.Screen 
              name="SubscriptionVault" 
              component={SubscriptionVaultScreen} 
              options={{ 
                title: 'Gold Vault Club',
                headerBackTitle: 'Back',
              }}
            />
            <Stack.Screen 
              name="Settings" 
              component={SettingsScreen} 
              options={{ title: 'Settings' }}
            />
            <Stack.Screen 
              name="Shop" 
              component={ShopScreen} 
              options={{ title: 'Shop' }}
            />
            <Stack.Screen 
              name="Locker" 
              component={LockerScreen} 
              options={{ title: 'My Locker' }}
            />
            <Stack.Screen 
              name="Home" 
              component={HomeScreen} 
              options={{ title: 'Home' }}
            />
            <Stack.Screen 
              name="Camp" 
              component={CampScreen} 
              options={{ title: 'Camp' }}
            />
            <Stack.Screen 
              name="Missions" 
              component={MissionsScreen} 
              options={{ title: 'Missions' }}
            />
            <Stack.Screen 
              name="StateCollection" 
              component={StateCollectionScreen} 
              options={{ title: 'State Collection' }}
            />
            <Stack.Screen 
              name="SeasonPass" 
              component={StateCollectionScreen} 
              options={{ title: 'Season Pass' }}
            />
            <Stack.Screen 
              name="Leaderboard" 
              component={LeaderboardScreen} 
              options={{ title: 'Leaderboard' }}
            />
            <Stack.Screen 
              name="Stats" 
              component={StatsScreen} 
              options={{ title: 'Statistics' }}
            />
            <Stack.Screen 
              name="Store" 
              component={StoreScreen} 
              options={{ title: 'Store' }}
            />
            <Stack.Screen 
              name="BuyGold" 
              component={BuyGoldScreen} 
              options={{ title: 'Buy Gold' }}
            />
            <Stack.Screen 
              name="Upgrade" 
              component={UpgradeScreen} 
              options={{ title: 'Upgrade' }}
            />
            <Stack.Screen 
              name="ChallengeFriends" 
              component={ChallengeFriendsScreen} 
              options={{ title: 'Challenge Friends' }}
            />
            <Stack.Screen 
              name="Legal" 
              component={LegalScreen} 
              options={{ title: 'Legal' }}
            />
            <Stack.Screen 
              name="DataRequest" 
              component={LegalScreen} 
              options={{ title: 'Data Request' }}
            />
            <Stack.Screen 
              name="DeleteAccount" 
              component={LegalScreen} 
              options={{ title: 'Delete Account' }}
            />
            <Stack.Screen 
              name="ManageConsent" 
              component={LegalScreen} 
              options={{ title: 'Manage Consent' }}
            />
            <Stack.Screen 
              name="Welcome" 
              component={OnboardingScreen} 
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="Auth" 
              component={AuthScreen} 
              options={{ title: 'Sign In' }}
            />
          </Stack.Navigator>
        </GameProvider>
      </UserUnlockProvider>
    </NavigationContainer>
    </AdaptiveQualityProvider>
  );
}
