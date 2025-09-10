import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Text,
  Platform,
} from 'react-native';
import { PlatformUtils } from '../src/utils/platformUtils';
import Icon from 'react-native-vector-icons/Ionicons';

interface WebGameContainerProps {
  children: React.ReactNode;
  onOrientationChange?: (orientation: string) => void;
}

const WebGameContainer: React.FC<WebGameContainerProps> = ({
  children,
  onOrientationChange,
}) => {
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
  
  // Optimal game dimensions based on device type
  const MAX_GAME_WIDTH = 900;  // Maximum width constraint
  const MAX_GAME_HEIGHT = 900; // Maximum height for better visibility
  const MOBILE_BASE_WIDTH = 375;
  const MOBILE_BASE_HEIGHT = 667;
  const TABLET_BASE_WIDTH = 768;
  const TABLET_BASE_HEIGHT = 1024;
  
  // Determine base dimensions based on device type
  let baseWidth: number;
  let baseHeight: number;
  
  if (dimensions.width < 768) {
    // Mobile devices
    baseWidth = MOBILE_BASE_WIDTH;
    baseHeight = MOBILE_BASE_HEIGHT;
  } else if (dimensions.width < 1024) {
    // Tablets
    baseWidth = TABLET_BASE_WIDTH;
    baseHeight = TABLET_BASE_HEIGHT;
  } else {
    // Desktop - use optimal fixed size
    baseWidth = 600;
    baseHeight = 900;
  }
  
  // Calculate scale to fit screen while respecting max dimensions
  const scaleX = Math.min(dimensions.width * 0.95 / baseWidth, MAX_GAME_WIDTH / baseWidth);
  const scaleY = Math.min(dimensions.height * 0.9 / baseHeight, MAX_GAME_HEIGHT / baseHeight);
  const gameScale = Math.min(scaleX, scaleY, 2.5);
  
  // Final game dimensions
  const gameWidth = Math.min(baseWidth * gameScale, MAX_GAME_WIDTH);
  const gameHeight = Math.min(baseHeight * gameScale, MAX_GAME_HEIGHT);

  return (
    <View style={styles.container}>
      {/* Desktop wrapper with controls */}
      {isDesktop && (
        <View style={styles.desktopContainer}>
          {/* Game title bar */}
          <View style={styles.titleBar}>
            <Text style={styles.title}>Pot of Gold</Text>
            <View style={styles.controls}>
              {showInstallPrompt && (
                <TouchableOpacity
                  style={styles.installButton}
                  onPress={handleInstallPWA}
                >
                  <Icon name="download-outline" size={20} color="#fff" />
                  <Text style={styles.installText}>Install App</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.controlButton}
                onPress={toggleFullscreen}
              >
                <Icon
                  name={isFullscreen ? 'contract-outline' : 'expand-outline'}
                  size={24}
                  color="#fff"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Game viewport with HTML5 optimization */}
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
            <View style={styles.gameContent}>
              {children}
            </View>
          </View>

          {/* Removed instructions to avoid blocking gameplay view */}
        </View>
      )}

      {/* Mobile/tablet view with responsive scaling */}
      {!isDesktop && (
        <View style={[
          styles.mobileContainer,
          {
            // Apply max dimensions for tablets
            maxWidth: dimensions.width >= 768 ? MAX_GAME_WIDTH : '100%',
            alignSelf: 'center',
          },
        ]}>
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
                <TouchableOpacity
                  style={styles.installActionButton}
                  onPress={handleInstallPWA}
                >
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
  titleBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    maxWidth: 800,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFD700',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  controlButton: {
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
  },
  installButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  installText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  gameViewport: {
    backgroundColor: '#000',
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    // Optimize rendering on web
    ...Platform.select({
      web: {
        backfaceVisibility: 'hidden' as any,
        perspective: 1000,
      },
      default: {},
    }),
  },
  gameContent: {
    flex: 1,
    // Enable GPU acceleration
    ...Platform.select({
      web: {
        transform: [{ translateZ: 0 }],
      },
      default: {},
    }),
  },
  instructions: {
    marginTop: 20,
    padding: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    maxWidth: 600,
  },
  instructionText: {
    color: '#fff',
    fontSize: 14,
    marginVertical: 5,
    textAlign: 'center',
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