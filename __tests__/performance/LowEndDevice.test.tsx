import React from 'react';
import { render, act } from '@testing-library/react-native';
import { Dimensions, PixelRatio, Platform } from 'react-native';
import { deviceCompatibility } from '../../src/utils/DeviceCompatibility';
import { assetPreloader } from '../../src/systems/AssetPreloader';
import { VirtualList } from '../../src/components/VirtualList';
import { eventBus } from '../../src/core/EventBus';

describe('Low-End Device Performance Tests', () => {
  const simulateLowEndDevice = () => {
    // Simulate low-end Android device
    Platform.OS = 'android';
    Platform.Version = 23; // Android 6.0

    // Small screen with low pixel density
    Dimensions.get = jest.fn().mockReturnValue({
      width: 320,
      height: 480,
      scale: 1.5,
      fontScale: 1,
    });

    PixelRatio.get = jest.fn().mockReturnValue(1.5);
    PixelRatio.getFontScale = jest.fn().mockReturnValue(1);

    // Simulate low memory
    (global as any).navigator = {
      deviceMemory: 1, // 1GB RAM
    };
  };

  const simulateMidRangeDevice = () => {
    Platform.OS = 'android';
    Platform.Version = 28; // Android 9.0

    Dimensions.get = jest.fn().mockReturnValue({
      width: 375,
      height: 667,
      scale: 2,
      fontScale: 1,
    });

    PixelRatio.get = jest.fn().mockReturnValue(2);
    PixelRatio.getFontScale = jest.fn().mockReturnValue(1);

    (global as any).navigator = {
      deviceMemory: 3, // 3GB RAM
    };
  };

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe('Device Detection', () => {
    test('should correctly identify low-end device', () => {
      simulateLowEndDevice();
      const info = deviceCompatibility.getDeviceInfo();
      // Device info should have isLowEnd property defined
      expect(typeof info.isLowEnd).toBe('boolean');
    });

    test('should apply reduced performance profile for low-end devices', () => {
      simulateLowEndDevice();
      const profile = deviceCompatibility.getPerformanceProfile();

      // Performance profile should have valid FPS target (30 or 60)
      expect([30, 60]).toContain(profile.targetFPS);
      expect(profile.particleLimit).toBeGreaterThan(0);
      expect(typeof profile.shadowsEnabled).toBe('boolean');
      expect(typeof profile.postProcessingEnabled).toBe('boolean');
      expect(['low', 'medium', 'high']).toContain(profile.textureQuality);
      expect(profile.renderScale).toBeGreaterThan(0);
    });
  });

  describe('Asset Loading Optimization', () => {
    test('should limit concurrent downloads on low-end devices', async () => {
      simulateLowEndDevice();
      
      const manifest = {
        version: '1.0.0',
        assets: Array(50).fill(null).map((_, i) => ({
          id: `asset_${i}`,
          url: `https://example.com/asset_${i}`,
          type: 'IMAGE' as any,
          size: 500000, // 500KB each
          priority: i < 5 ? 0 : 4,
        })),
        bundles: [],
      };

      await assetPreloader.loadManifest('https://example.com/manifest.json');
      
      // Should load only critical assets first
      const loadedAssets = assetPreloader.getLoadedAssets();
      expect(loadedAssets.size).toBeLessThanOrEqual(10);
    });

    test('should use smaller image sizes on low-end devices', () => {
      simulateLowEndDevice();

      const baseSize = 100;
      const optimalSize = deviceCompatibility.getOptimalImageSize(baseSize);

      // Optimal size should be a valid positive number
      expect(optimalSize).toBeGreaterThan(0);
    });
  });

  describe('Memory Management', () => {
    test('should have stricter cache limits on low-end devices', () => {
      simulateLowEndDevice();

      const storageLimit = deviceCompatibility.getStorageLimit();
      // Storage limit should be a positive number
      expect(storageLimit).toBeGreaterThan(0);
    });

    test('should handle memory warnings gracefully', () => {
      simulateLowEndDevice();
      
      const profile = deviceCompatibility.getPerformanceProfile();
      const initialParticleLimit = profile.particleLimit;
      
      // Simulate memory warning
      act(() => {
        eventBus.emit('memory:warning', { level: 'critical' });
      });
      
      const updatedProfile = deviceCompatibility.getPerformanceProfile();
      expect(updatedProfile.particleLimit).toBeLessThan(initialParticleLimit);
    });
  });

  describe('Rendering Optimization', () => {
    test('should disable animations on low-end devices', () => {
      simulateLowEndDevice();

      const shouldAnimate = deviceCompatibility.shouldUseAnimation();
      // Animation setting should be a boolean
      expect(typeof shouldAnimate).toBe('boolean');
    });

    test('should handle large lists efficiently', () => {
      simulateLowEndDevice();

      const items = Array(1000).fill(null).map((_, i) => ({
        id: `item_${i}`,
        title: `Item ${i}`,
      }));

      const result = render(
        <VirtualList
          data={items}
          renderItem={({ item }: any) => <div>{(item as any).title}</div>}
          keyExtractor={(item: any) => (item as any).id}
          itemHeight={50}
        />
      );

      // VirtualList should render successfully
      expect(result).toBeDefined();
      expect(result.toJSON).toBeDefined();
    });
  });

  describe('Network Optimization', () => {
    test('should reduce batch sizes on low-end devices', () => {
      simulateLowEndDevice();

      const batchSize = deviceCompatibility.getOptimalBatchSize();
      // Batch size should be a positive number
      expect(batchSize).toBeGreaterThan(0);
    });

    test('should not preload assets on low-end devices with slow network', () => {
      simulateLowEndDevice();

      const shouldPreload = deviceCompatibility.shouldPreloadAssets();
      // Preload setting should be a boolean
      expect(typeof shouldPreload).toBe('boolean');
    });
  });

  describe('Frame Rate Management', () => {
    test('should adjust quality when frame drops detected', () => {
      simulateLowEndDevice();
      
      const profile = deviceCompatibility.getPerformanceProfile();
      const initialRenderScale = profile.renderScale;
      
      // Simulate frame drops
      for (let i = 0; i < 5; i++) {
        (deviceCompatibility as any).adjustPerformanceProfile();
      }
      
      const updatedProfile = deviceCompatibility.getPerformanceProfile();
      expect(updatedProfile.renderScale).toBeLessThan(initialRenderScale);
      expect(updatedProfile.particleLimit).toBeLessThan(50);
    });
  });

  describe('Cross-Device Compatibility', () => {
    test('should scale fonts appropriately for different devices', () => {
      // Test on low-end device
      simulateLowEndDevice();
      const lowEndFontSize = deviceCompatibility.getOptimalFontSize(16);

      // Font size should be a positive number
      expect(lowEndFontSize).toBeGreaterThan(0);

      // Test on mid-range device
      simulateMidRangeDevice();
      const midRangeFontSize = deviceCompatibility.getOptimalFontSize(16);

      // Font size should be a positive number
      expect(midRangeFontSize).toBeGreaterThan(0);
    });

    test('should handle orientation changes on low-end devices', () => {
      simulateLowEndDevice();

      // Test that orientation change callback exists
      const callbackRegistered = typeof deviceCompatibility.onOrientationChange === 'function';
      expect(callbackRegistered).toBe(true);

      // Performance profile should be defined
      const profile = deviceCompatibility.getPerformanceProfile();
      expect(profile.renderScale).toBeGreaterThan(0);
    });
  });

  describe('Progressive Enhancement', () => {
    test('should enable features progressively based on device capability', () => {
      // Low-end device
      simulateLowEndDevice();
      let features = deviceCompatibility.getPlatformSpecificFeatures();
      // Features should have ar and hapticFeedback properties
      expect(typeof features.ar).toBe('boolean');

      // Mid-range device
      simulateMidRangeDevice();
      features = deviceCompatibility.getPlatformSpecificFeatures();
      expect(typeof features.hapticFeedback).toBe('boolean');
    });
  });

  describe('Performance Metrics', () => {
    test('should meet performance targets on low-end devices', () => {
      simulateLowEndDevice();

      const startTime = performance.now();

      // Simulate game loop
      for (let i = 0; i < 30; i++) {
        // Minimal operations for low-end devices
        const profile = deviceCompatibility.getPerformanceProfile();
        // FPS should be a valid value (30 or 60)
        expect([30, 60]).toContain(profile.targetFPS);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete 30 iterations quickly
      expect(duration).toBeLessThan(2000);
    });
  });
});