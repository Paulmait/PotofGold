import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { AppState, AppStateStatus, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { deviceInfoManager, DeviceProfile, AssetQualitySettings } from '../utils/deviceInfo';
import { performanceMonitor } from '../utils/performanceMonitor';

/**
 * Adaptive Quality Provider
 * Automatically adjusts app quality based on device capabilities and real-time performance
 */

export interface QualityContext {
  // Current quality settings
  qualityMode: 'auto' | 'low' | 'medium' | 'high' | 'ultra';
  effectiveQuality: 'low' | 'medium' | 'high' | 'ultra';

  // Device info
  deviceProfile: DeviceProfile;
  deviceScore: number;

  // Performance metrics
  currentFPS: number;
  performanceScore: number;
  isLowPerformance: boolean;

  // Network status
  isOffline: boolean;
  networkQuality: 'poor' | 'fair' | 'good' | 'excellent';
  shouldPreload: boolean;

  // User preferences
  userPreferences: UserPreferences;

  // Actions
  setQualityMode: (mode: 'auto' | 'low' | 'medium' | 'high' | 'ultra') => void;
  optimizeForBattery: () => void;
  optimizeForPerformance: () => void;
  resetToAuto: () => void;
  refreshDeviceInfo: () => Promise<void>;
}

export interface UserPreferences {
  reduceMotion: boolean;
  highContrast: boolean;
  saveData: boolean;
  powerSaveMode: boolean;
  autoQuality: boolean;
  preloadAssets: boolean;
  cacheSize: 'small' | 'medium' | 'large';
}

const QualityContext = createContext<QualityContext | undefined>(undefined);

interface AdaptiveQualityProviderProps {
  children: ReactNode;
}

export const AdaptiveQualityProvider: React.FC<AdaptiveQualityProviderProps> = ({ children }) => {
  // State
  const [qualityMode, setQualityModeState] = useState<'auto' | 'low' | 'medium' | 'high' | 'ultra'>(
    'auto'
  );
  const [effectiveQuality, setEffectiveQuality] = useState<'low' | 'medium' | 'high' | 'ultra'>(
    'medium'
  );
  const [deviceProfile, setDeviceProfile] = useState(() => deviceInfoManager.getDeviceProfile());
  const [deviceScore, setDeviceScore] = useState(0);
  const [currentFPS, setCurrentFPS] = useState(60);
  const [performanceScore, setPerformanceScore] = useState(100);
  const [isLowPerformance, setIsLowPerformance] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [networkQuality, setNetworkQuality] = useState<'poor' | 'fair' | 'good' | 'excellent'>(
    'good'
  );
  const [userPreferences, setUserPreferences] = useState<UserPreferences>({
    reduceMotion: false,
    highContrast: false,
    saveData: false,
    powerSaveMode: false,
    autoQuality: true,
    preloadAssets: true,
    cacheSize: 'medium',
  });

  // Calculate device score based on capabilities
  const calculateDeviceScore = useCallback((profile: DeviceProfile): number => {
    let score = 0;

    // Performance tier (0-40 points)
    switch (profile.performanceTier) {
      case 'ultra':
        score += 40;
        break;
      case 'high':
        score += 30;
        break;
      case 'medium':
        score += 20;
        break;
      case 'low':
        score += 10;
        break;
    }

    // Memory (0-20 points)
    if (profile.totalMemory) {
      const memoryGB = profile.totalMemory / (1024 * 1024 * 1024);
      score += Math.min(memoryGB * 2.5, 20);
    }

    // Screen resolution (0-20 points)
    const pixels = profile.screenWidth * profile.screenHeight * profile.screenScale;
    const megapixels = pixels / 1000000;
    score += Math.min(megapixels * 2, 20);

    // Device year (0-10 points)
    if (profile.deviceYearClass) {
      const age = new Date().getFullYear() - profile.deviceYearClass;
      score += Math.max(10 - age * 2, 0);
    }

    // Features (0-10 points)
    if (profile.supportsWebP) score += 2;
    if (profile.supportsHEIC) score += 2;
    if (profile.supportsP3ColorSpace) score += 3;
    if (profile.supportsHDR) score += 3;

    return Math.min(Math.round(score), 100);
  }, []);

  // Determine effective quality based on all factors
  const determineEffectiveQuality = useCallback(() => {
    if (qualityMode !== 'auto') {
      return qualityMode;
    }

    // Auto mode - consider all factors
    const factors = {
      device: deviceScore,
      performance: performanceScore,
      battery: deviceProfile.batteryLevel ? deviceProfile.batteryLevel * 100 : 100,
      network:
        networkQuality === 'excellent'
          ? 100
          : networkQuality === 'good'
            ? 75
            : networkQuality === 'fair'
              ? 50
              : 25,
    };

    // Weight the factors
    const weightedScore =
      factors.device * 0.4 +
      factors.performance * 0.3 +
      factors.battery * 0.15 +
      factors.network * 0.15;

    // Apply user preferences
    let adjustedScore = weightedScore;
    if (userPreferences.powerSaveMode) adjustedScore -= 20;
    if (userPreferences.saveData) adjustedScore -= 15;
    if (deviceProfile.isLowPowerMode) adjustedScore -= 25;

    // Determine quality level
    if (adjustedScore >= 80) return 'ultra';
    if (adjustedScore >= 60) return 'high';
    if (adjustedScore >= 40) return 'medium';
    return 'low';
  }, [qualityMode, deviceScore, performanceScore, deviceProfile, networkQuality, userPreferences]);

  // Load user preferences
  const loadPreferences = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem('@user_preferences');
      if (stored) {
        setUserPreferences(JSON.parse(stored));
      }

      const storedQuality = await AsyncStorage.getItem('@quality_mode');
      if (storedQuality) {
        setQualityModeState(storedQuality as any);
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
    }
  }, []);

  // Save user preferences
  const savePreferences = useCallback(async (prefs: UserPreferences) => {
    try {
      await AsyncStorage.setItem('@user_preferences', JSON.stringify(prefs));
      setUserPreferences(prefs);
    } catch (error) {
      console.error('Failed to save preferences:', error);
    }
  }, []);

  // Initialize
  useEffect(() => {
    loadPreferences();

    // Calculate initial device score
    const score = calculateDeviceScore(deviceProfile);
    setDeviceScore(score);

    // Subscribe to device changes
    const unsubscribeDevice = deviceInfoManager.subscribe((profile) => {
      setDeviceProfile(profile);
      setDeviceScore(calculateDeviceScore(profile));
    });

    // Subscribe to network changes
    const unsubscribeNetwork = NetInfo.addEventListener((state) => {
      setIsOffline(!state.isConnected);

      // Determine network quality
      if (state.type === 'wifi') {
        setNetworkQuality('excellent');
      } else if (state.type === 'cellular') {
        const details = state.details as any;
        if (details?.cellularGeneration === '4g' || details?.cellularGeneration === '5g') {
          setNetworkQuality('good');
        } else {
          setNetworkQuality('fair');
        }
      } else {
        setNetworkQuality('poor');
      }
    });

    // Monitor app state changes
    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

    // Monitor performance
    const performanceInterval = setInterval(() => {
      const metrics = performanceMonitor.getCurrentMetrics();
      setCurrentFPS(Math.round(metrics.fps));
      setPerformanceScore(performanceMonitor.getPerformanceScore());

      // Detect low performance
      if (metrics.fps < 30 || metrics.memoryUsage > 0.8) {
        setIsLowPerformance(true);

        // Auto-adjust quality if in auto mode
        if (qualityMode === 'auto' && effectiveQuality !== 'low') {
          console.log('Auto-reducing quality due to poor performance');
          setEffectiveQuality('low');
        }
      } else {
        setIsLowPerformance(false);
      }
    }, 2000);

    return () => {
      unsubscribeDevice();
      unsubscribeNetwork();
      appStateSubscription.remove();
      clearInterval(performanceInterval);
    };
  }, []);

  // Update effective quality when factors change
  useEffect(() => {
    const quality = determineEffectiveQuality();
    setEffectiveQuality(quality);
  }, [determineEffectiveQuality]);

  // Handle app state changes
  const handleAppStateChange = useCallback((nextAppState: AppStateStatus) => {
    if (nextAppState === 'active') {
      // App became active, refresh device info
      deviceInfoManager.refresh();
    } else if (nextAppState === 'background') {
      // App went to background, save report
      performanceMonitor.saveReport();
    }
  }, []);

  // Actions
  const setQualityMode = useCallback(async (mode: 'auto' | 'low' | 'medium' | 'high' | 'ultra') => {
    setQualityModeState(mode);
    await AsyncStorage.setItem('@quality_mode', mode);

    if (mode !== 'auto') {
      setEffectiveQuality(mode);
    }
  }, []);

  const optimizeForBattery = useCallback(async () => {
    const newPrefs = {
      ...userPreferences,
      powerSaveMode: true,
      preloadAssets: false,
      cacheSize: 'small' as const,
    };

    await savePreferences(newPrefs);
    setQualityMode('low');

    Alert.alert('Battery Optimization Enabled', 'Quality reduced to extend battery life');
  }, [userPreferences, savePreferences, setQualityMode]);

  const optimizeForPerformance = useCallback(async () => {
    const newPrefs = {
      ...userPreferences,
      powerSaveMode: false,
      preloadAssets: true,
      cacheSize: 'large' as const,
    };

    await savePreferences(newPrefs);

    // Set quality based on device capabilities
    if (deviceScore >= 80) {
      setQualityMode('ultra');
    } else if (deviceScore >= 60) {
      setQualityMode('high');
    } else {
      setQualityMode('medium');
    }

    Alert.alert('Performance Mode Enabled', 'Quality optimized for best visuals');
  }, [userPreferences, savePreferences, setQualityMode, deviceScore]);

  const resetToAuto = useCallback(async () => {
    setQualityMode('auto');

    const defaultPrefs: UserPreferences = {
      reduceMotion: false,
      highContrast: false,
      saveData: false,
      powerSaveMode: false,
      autoQuality: true,
      preloadAssets: true,
      cacheSize: 'medium',
    };

    await savePreferences(defaultPrefs);
  }, [setQualityMode, savePreferences]);

  const refreshDeviceInfo = useCallback(async () => {
    await deviceInfoManager.refresh();
    const profile = deviceInfoManager.getDeviceProfile();
    setDeviceProfile(profile);
    setDeviceScore(calculateDeviceScore(profile));
  }, [calculateDeviceScore]);

  // Determine if we should preload assets
  const shouldPreload =
    !isOffline &&
    !isLowPerformance &&
    userPreferences.preloadAssets &&
    (networkQuality === 'good' || networkQuality === 'excellent');

  const contextValue: QualityContext = {
    qualityMode,
    effectiveQuality,
    deviceProfile,
    deviceScore,
    currentFPS,
    performanceScore,
    isLowPerformance,
    isOffline,
    networkQuality,
    shouldPreload,
    userPreferences,
    setQualityMode,
    optimizeForBattery,
    optimizeForPerformance,
    resetToAuto,
    refreshDeviceInfo,
  };

  return <QualityContext.Provider value={contextValue}>{children}</QualityContext.Provider>;
};

// Custom hook to use quality context
export const useAdaptiveQuality = (): QualityContext => {
  const context = useContext(QualityContext);
  if (!context) {
    throw new Error('useAdaptiveQuality must be used within AdaptiveQualityProvider');
  }
  return context;
};

// Convenience hooks
export const useQualityMode = () => {
  const { effectiveQuality } = useAdaptiveQuality();
  return effectiveQuality;
};

export const useDeviceCapabilities = () => {
  const { deviceProfile, deviceScore } = useAdaptiveQuality();
  return { deviceProfile, deviceScore };
};

export const usePerformanceStatus = () => {
  const { currentFPS, performanceScore, isLowPerformance } = useAdaptiveQuality();
  return { currentFPS, performanceScore, isLowPerformance };
};

export const useShouldReduceQuality = () => {
  const { isLowPerformance, isOffline, networkQuality, deviceProfile } = useAdaptiveQuality();
  return (
    isLowPerformance ||
    isOffline ||
    networkQuality === 'poor' ||
    deviceProfile.isLowPowerMode ||
    (deviceProfile.batteryLevel !== null && deviceProfile.batteryLevel < 0.2)
  );
};
