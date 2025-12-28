import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity, Text, Platform } from 'react-native';
import { PlatformUtils } from '../src/utils/platformUtils';
import Icon from 'react-native-vector-icons/Ionicons';

interface WebGameContainerProps {
  children: React.ReactNode;
  onOrientationChange?: (orientation: string) => void;
}

const WebGameContainer: React.FC<WebGameContainerProps> = ({ children, onOrientationChange }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [dimensions, setDimensions] = useState(() => {
    const { width, height } = Dimensions.get('window');
    return { width, height };
  });
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    if (!PlatformUtils.isWeb) return;

    // Handle resize
    const handleResize = () => {
      const { width, height } = Dimensions.get('window');
      setDimensions({ width, height });

      if (onOrientationChange) {
        onOrientationChange(width > height ? 'landscape' : 'portrait');
      }
    };

    // Handle fullscreen changes
    const handleFullscreenChange = () => {
      setIsFullscreen(PlatformUtils.webFeatures.isFullscreen());
    };

    // Handle PWA install prompt
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    window.addEventListener('resize', handleResize);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if already installed as PWA
    if (PlatformUtils.webFeatures.isPWA()) {
      console.log('Running as PWA');
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [onOrientationChange]);

  const toggleFullscreen = async () => {
    if (isFullscreen) {
      await PlatformUtils.webFeatures.exitFullscreen();
    } else {
      await PlatformUtils.webFeatures.requestFullscreen();
    }
  };

  const handleInstallPWA = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('PWA installed');
    }

    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  // For mobile platforms, just render children directly
  if (!PlatformUtils.isWeb) {
    return <>{children}</>;
  }

  const isDesktop = dimensions.width >= 1024;

  // Game dimensions configuration
  const MAX_GAME_WIDTH = 900; // Maximum width constraint as requested
  const MAX_GAME_HEIGHT = dimensions.height * 0.95; // Use most of screen height

  let gameWidth: number;
  let gameHeight: number;

  if (dimensions.width < 768) {
    // Mobile devices - use full width
    gameWidth = dimensions.width;
    gameHeight = dimensions.height;
  } else if (dimensions.width < 1024) {
    // Tablets - use most of screen with some padding
    gameWidth = Math.min(dimensions.width * 0.95, MAX_GAME_WIDTH);
    gameHeight = Math.min(dimensions.height * 0.95, MAX_GAME_HEIGHT);
  } else {
    // Desktop/Laptop - use full width up to max
    gameWidth = Math.min(dimensions.width * 0.9, MAX_GAME_WIDTH);
    gameHeight = Math.min(dimensions.height * 0.9, MAX_GAME_HEIGHT);
  }

  return (
    <View style={styles.container}>
      {/* Desktop/Laptop - full screen game */}
      {isDesktop && (
        <View style={styles.desktopContainer}>
          {/* Game uses full viewport */}
          <View
            style={[
              styles.gameViewport,
              {
                width: gameWidth,
                height: gameHeight,
                // Enable hardware acceleration on web
                ...Platform.select({
                  web: {
                    transform: [{ translateZ: 0 }],
                    willChange: 'transform',
                  } as any,
                  default: {},
                }),
              },
            ]}
          >
            <View style={styles.gameContent}>{children}</View>

            {/* Floating controls in top-right corner */}
            <View style={styles.floatingControls}>
              {showInstallPrompt && (
                <TouchableOpacity style={styles.installButton} onPress={handleInstallPWA}>
                  <Icon name="download-outline" size={20} color="#fff" />
                  <Text style={styles.installText}>Install</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.controlButton} onPress={toggleFullscreen}>
                <Icon
                  name={isFullscreen ? 'contract-outline' : 'expand-outline'}
                  size={24}
                  color="#fff"
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Mobile/tablet view - full screen */}
      {!isDesktop && (
        <View style={styles.mobileContainer}>
          {children}

          {/* PWA install banner for mobile */}
          {showInstallPrompt && !PlatformUtils.webFeatures.isPWA() && (
            <View style={styles.installBanner}>
              <View style={styles.installContent}>
                <Icon name="game-controller" size={32} color="#FFD700" />
                <View style={styles.installTextContainer}>
                  <Text style={styles.installTitle}>Install Pot of Gold</Text>
                  <Text style={styles.installSubtitle}>
                    Play offline and get the full app experience
                  </Text>
                </View>
              </View>
              <View style={styles.installActions}>
                <TouchableOpacity
                  style={styles.dismissButton}
                  onPress={() => setShowInstallPrompt(false)}
                >
                  <Text style={styles.dismissText}>Not now</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.installActionButton} onPress={handleInstallPWA}>
                  <Text style={styles.installActionText}>Install</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  desktopContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  controlButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
  },
  installButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    gap: 5,
  },
  installText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  gameViewport: {
    backgroundColor: '#000',
    overflow: 'hidden',
    // Remove border radius for full screen
    // Optimize rendering on web
    ...Platform.select({
      web: {
        backfaceVisibility: 'hidden' as any,
        perspective: 1000,
      },
      default: {},
    }),
  },
  floatingControls: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    zIndex: 1000,
  },
  gameContent: {
    flex: 1,
    // Enable GPU acceleration
    ...Platform.select({
      web: {
        transform: [{ translateZ: 0 }] as any,
      },
      default: {},
    }),
  },
  mobileContainer: {
    flex: 1,
  },
  installBanner: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#2a2a3e',
    padding: 15,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  installContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  installTextContainer: {
    flex: 1,
    marginLeft: 15,
  },
  installTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  installSubtitle: {
    color: '#aaa',
    fontSize: 14,
    marginTop: 2,
  },
  installActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 15,
  },
  dismissButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  dismissText: {
    color: '#888',
    fontSize: 16,
  },
  installActionButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 25,
    paddingVertical: 10,
    borderRadius: 25,
  },
  installActionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default WebGameContainer;
