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
    jest.clearAllMocks();
  });

  describe('Device Detection', () => {
    test('should correctly identify low-end device', () => {
      simulateLowEndDevice();
      const info = deviceCompatibility.getDeviceInfo();
      expect(info.isLowEnd).toBe(true);
    });

    test('should apply reduced performance profile for low-end devices', () => {
      simulateLowEndDevice();
      const profile = deviceCompatibility.getPerformanceProfile();
      
      expect(profile.targetFPS).toBe(30);
      expect(profile.particleLimit).toBeLessThanOrEqual(50);
      expect(profile.shadowsEnabled).toBe(false);
      expect(profile.postProcessingEnabled).toBe(false);
      expect(profile.textureQuality).toBe('low');
      expect(profile.renderScale).toBeLessThan(1);
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
      
      // Should reduce image size for low-end devices
      expect(optimalSize).toBeLessThan(baseSize);
    });
  });

  describe('Memory Management', () => {
    test('should have stricter cache limits on low-end devices', () => {
      simulateLowEndDevice();
      
      const storageLimit = deviceCompatibility.getStorageLimit();
      expect(storageLimit).toBeLessThanOrEqual(50); // 50MB max for low-end
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
      expect(shouldAnimate).toBe(false);
    });

    test('should handle large lists efficiently', () => {
      simulateLowEndDevice();
      
      const items = Array(1000).fill(null).map((_, i) => ({
        id: `item_${i}`,
        title: `Item ${i}`,
      }));

      const { getByTestId } = render(
        <VirtualList
          data={items}
          renderItem={({ item }: any) => <div>{(item as any).title}</div>}
          keyExtractor={(item: any) => (item as any).id}
          itemHeight={50}
        />
      );

      const list = getByTestId('virtual-list');
      expect(list).toBeDefined();
      
      // Should render only visible items (about 8-10 items for 400px height)
      const renderedItems = list.children.length;
      expect(renderedItems).toBeLessThan(20);
    });
  });

  describe('Network Optimization', () => {
    test('should reduce batch sizes on low-end devices', () => {
      simulateLowEndDevice();
      
      const batchSize = deviceCompatibility.getOptimalBatchSize();
      expect(batchSize).toBeLessThanOrEqual(10);
    });

    test('should not preload assets on low-end devices with slow network', () => {
      simulateLowEndDevice();
      
      // Simulate slow network
      (deviceCompatibility as any).deviceInfo.networkType = '2g';
      
      const shouldPreload = deviceCompatibility.shouldPreloadAssets();
      expect(shouldPreload).toBe(false);
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
      
      // Test on mid-range device
      simulateMidRangeDevice();
      const midRangeFontSize = deviceCompatibility.getOptimalFontSize(16);
      
      // Font sizes should be different based on device
      expect(lowEndFontSize).not.toBe(midRangeFontSize);
    });

    test('should handle orientation changes on low-end devices', () => {
      simulateLowEndDevice();
      
      // Start in portrait
      Dimensions.get = jest.fn().mockReturnValue({
        width: 320,
        height: 480,
      });
      
      let orientationChangeHandled = false;
      deviceCompatibility.onOrientationChange(() => {
        orientationChangeHandled = true;
      });
      
      // Switch to landscape
      act(() => {
        Dimensions.get = jest.fn().mockReturnValue({
          width: 480,
          height: 320,
        });
        
        // Trigger dimension change event
        const listeners = (Dimensions as any).addEventListener.mock.calls;
        if (listeners.length > 0) {
          const callback = listeners[0][1];
          callback({ window: { width: 480, height: 320 } });
        }
      });
      
      expect(orientationChangeHandled).toBe(true);
      
      // Performance should be further reduced in landscape on low-end
      const profile = deviceCompatibility.getPerformanceProfile();
      expect(profile.renderScale).toBeLessThanOrEqual(0.6);
    });
  });

  describe('Progressive Enhancement', () => {
    test('should enable features progressively based on device capability', () => {
      // Low-end device
      simulateLowEndDevice();
      let features = deviceCompatibility.getPlatformSpecificFeatures();
      expect(features.ar).toBe(false);
      
      // Mid-range device
      simulateMidRangeDevice();
      features = deviceCompatibility.getPlatformSpecificFeatures();
      expect(features.hapticFeedback).toBe(true);
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
        expect(profile.targetFPS).toBe(30);
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should complete 30 frames in about 1 second for 30 FPS
      expect(duration).toBeLessThan(2000);
    });
  });
});