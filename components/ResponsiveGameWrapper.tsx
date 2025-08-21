import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Animated,
  Text,
  SafeAreaView,
} from 'react-native';
import { useOrientation, responsive } from '../hooks/useOrientation';

interface ResponsiveGameWrapperProps {
  children: React.ReactNode;
  gameState?: any;
  onOrientationChange?: (orientation: 'portrait' | 'landscape') => void;
}

export default function ResponsiveGameWrapper({
  children,
  gameState,
  onOrientationChange,
}: ResponsiveGameWrapperProps) {
  const orientation = useOrientation(gameState);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const [isRotating, setIsRotating] = useState(false);
  const [savedGameState, setSavedGameState] = useState<any>(null);
  const layout = orientation.getLayout();

  useEffect(() => {
    if (orientation.isTransitioning) {
      // Fade out during transition
      setIsRotating(true);
      
      Animated.timing(fadeAnim, {
        toValue: 0.3,
        duration: 150,
        useNativeDriver: true,
      }).start(() => {
        // Restore game state after orientation change
        orientation.restoreGameState().then(restoredState => {
          if (restoredState) {
            setSavedGameState(restoredState);
          }
        });
        
        // Fade back in
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }).start(() => {
          setIsRotating(false);
          if (onOrientationChange) {
            onOrientationChange(orientation.orientation);
          }
        });
      });
    }
  }, [orientation.isTransitioning, orientation.orientation, fadeAnim, onOrientationChange]);

  // Dynamic styles based on orientation
  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#000',
    },
    gameArea: {
      flex: 1,
      height: layout.gameAreaHeight,
    },
    uiArea: {
      height: layout.uiAreaHeight,
      padding: layout.padding.medium,
    },
    safeArea: {
      flex: 1,
      backgroundColor: orientation.orientation === 'portrait' ? '#1a1a1a' : '#0a0a0a',
    },
  });

  return (
    <SafeAreaView style={dynamicStyles.safeArea}>
      <Animated.View style={[dynamicStyles.container, { opacity: fadeAnim }]}>
        {isRotating && (
          <View style={styles.transitionOverlay}>
            <View style={styles.transitionContent}>
              <Text style={styles.transitionText}>Adjusting view...</Text>
              <Text style={styles.transitionSubtext}>Your game is saved</Text>
            </View>
          </View>
        )}
        
        {/* Pass orientation data to children */}
        {React.Children.map(children, child => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child as React.ReactElement<any>, {
              orientation: orientation.orientation,
              layout,
              isTablet: orientation.isTablet,
              scale: orientation.scale,
              savedGameState: savedGameState,
              clearSavedState: () => setSavedGameState(null),
            });
          }
          return child;
        })}
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  transitionOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  transitionContent: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    padding: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#FFD700',
    alignItems: 'center',
  },
  transitionText: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  transitionSubtext: {
    color: '#FFA500',
    fontSize: 14,
  },
});