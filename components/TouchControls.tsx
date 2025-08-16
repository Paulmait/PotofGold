import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
  Text,
  TouchableOpacity,
  Vibration,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

// Minimum touch target size for accessibility (48dp)
const MIN_TOUCH_SIZE = 48;

interface TouchControlsProps {
  onMove: (x: number) => void;
  onPowerUpUse: (type: string, x: number, y: number) => void;
  onPause: () => void;
  powerUps: Array<{
    id: string;
    type: string;
    icon: string;
    available: boolean;
    cooldown: number;
  }>;
  cartPosition: number;
  cartWidth: number;
  isGameActive: boolean;
}

export default function TouchControls({
  onMove,
  onPowerUpUse,
  onPause,
  powerUps,
  cartPosition,
  cartWidth,
  isGameActive,
}: TouchControlsProps) {
  const [selectedPowerUp, setSelectedPowerUp] = useState<string | null>(null);
  const [touchFeedback, setTouchFeedback] = useState({ x: 0, y: 0, visible: false });
  const [dragIndicator, setDragIndicator] = useState({ x: cartPosition, visible: false });
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const powerUpAnimations = useRef(
    powerUps.map(() => new Animated.Value(1))
  ).current;

  // Pan responder for cart movement
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => isGameActive,
      onMoveShouldSetPanResponder: () => isGameActive,
      
      onPanResponderGrant: (evt) => {
        // Show touch feedback
        const touch = evt.nativeEvent;
        setTouchFeedback({ x: touch.pageX, y: touch.pageY, visible: true });
        setDragIndicator({ x: touch.pageX, visible: true });
        
        // Haptic feedback
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        
        // Animate touch indicator
        Animated.spring(scaleAnim, {
          toValue: 1.2,
          friction: 5,
          useNativeDriver: true,
        }).start();
      },
      
      onPanResponderMove: (evt, gestureState) => {
        // Update cart position with smooth boundaries
        const newX = Math.max(
          cartWidth / 2,
          Math.min(width - cartWidth / 2, evt.nativeEvent.pageX)
        );
        
        onMove(newX);
        setDragIndicator({ x: newX, visible: true });
        
        // Update touch feedback position
        setTouchFeedback({ 
          x: evt.nativeEvent.pageX, 
          y: evt.nativeEvent.pageY, 
          visible: true 
        });
      },
      
      onPanResponderRelease: () => {
        // Hide indicators
        setTouchFeedback({ ...touchFeedback, visible: false });
        setDragIndicator({ ...dragIndicator, visible: false });
        
        // Reset animation
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 5,
          useNativeDriver: true,
        }).start();
        
        // Light haptic on release
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      },
    })
  ).current;

  // Power-up tap handler
  const handlePowerUpTap = (powerUp: any, index: number) => {
    if (!powerUp.available || !isGameActive) return;
    
    // Animate power-up button
    Animated.sequence([
      Animated.timing(powerUpAnimations[index], {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(powerUpAnimations[index], {
        toValue: 1,
        friction: 3,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Strong haptic for power-up activation
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    
    // Set as selected or use immediately based on type
    if (powerUp.type === 'shovel' || powerUp.type === 'pickaxe') {
      setSelectedPowerUp(powerUp.id);
    } else {
      // Instant use power-ups
      onPowerUpUse(powerUp.type, cartPosition, height - 100);
    }
  };

  // Handle screen tap for selected power-up
  const handleScreenTap = (evt: any) => {
    if (selectedPowerUp && isGameActive) {
      const touch = evt.nativeEvent;
      onPowerUpUse(selectedPowerUp, touch.pageX, touch.pageY);
      
      // Clear selection
      setSelectedPowerUp(null);
      
      // Haptic feedback
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  // Render touch feedback indicator
  const renderTouchFeedback = () => {
    if (!touchFeedback.visible) return null;
    
    return (
      <Animated.View
        style={[
          styles.touchFeedback,
          {
            left: touchFeedback.x - 25,
            top: touchFeedback.y - 25,
            transform: [{ scale: scaleAnim }],
            opacity: fadeAnim,
          },
        ]}
        pointerEvents="none"
      >
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.8)', 'rgba(255, 255, 255, 0)']}
          style={styles.touchGradient}
        />
      </Animated.View>
    );
  };

  // Render drag indicator line
  const renderDragIndicator = () => {
    if (!dragIndicator.visible) return null;
    
    return (
      <View
        style={[
          styles.dragIndicator,
          {
            left: dragIndicator.x - 1,
          },
        ]}
        pointerEvents="none"
      />
    );
  };

  // Render power-up buttons
  const renderPowerUpButtons = () => {
    return (
      <View style={styles.powerUpContainer}>
        {powerUps.map((powerUp, index) => (
          <Animated.View
            key={powerUp.id}
            style={[
              styles.powerUpButton,
              !powerUp.available && styles.powerUpDisabled,
              selectedPowerUp === powerUp.id && styles.powerUpSelected,
              {
                transform: [{ scale: powerUpAnimations[index] }],
              },
            ]}
          >
            <TouchableOpacity
              onPress={() => handlePowerUpTap(powerUp, index)}
              disabled={!powerUp.available}
              style={styles.powerUpTouchable}
            >
              <Text style={styles.powerUpIcon}>{powerUp.icon}</Text>
              {powerUp.cooldown > 0 && (
                <View style={styles.cooldownOverlay}>
                  <Text style={styles.cooldownText}>{Math.ceil(powerUp.cooldown)}s</Text>
                </View>
              )}
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>
    );
  };

  // Render pause button
  const renderPauseButton = () => {
    return (
      <TouchableOpacity
        style={styles.pauseButton}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPause();
        }}
      >
        <Text style={styles.pauseIcon}>⏸️</Text>
      </TouchableOpacity>
    );
  };

  // Render selected power-up indicator
  const renderSelectedPowerUpIndicator = () => {
    if (!selectedPowerUp) return null;
    
    const powerUp = powerUps.find(p => p.id === selectedPowerUp);
    if (!powerUp) return null;
    
    return (
      <View style={styles.selectedIndicator}>
        <Text style={styles.selectedText}>Tap anywhere to use {powerUp.type}</Text>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => setSelectedPowerUp(null)}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View 
      style={styles.container} 
      {...panResponder.panHandlers}
      onStartShouldSetResponder={() => !!selectedPowerUp}
      onResponderGrant={handleScreenTap}
    >
      {/* Touch feedback visual */}
      {renderTouchFeedback()}
      
      {/* Drag indicator */}
      {renderDragIndicator()}
      
      {/* Power-up buttons */}
      {renderPowerUpButtons()}
      
      {/* Pause button */}
      {renderPauseButton()}
      
      {/* Selected power-up indicator */}
      {renderSelectedPowerUpIndicator()}
      
      {/* Touch zones for easier control */}
      <View style={styles.touchZones}>
        <TouchableOpacity
          style={styles.leftZone}
          onPress={() => {
            const newX = Math.max(cartWidth / 2, cartPosition - 50);
            onMove(newX);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
        />
        <TouchableOpacity
          style={styles.rightZone}
          onPress={() => {
            const newX = Math.min(width - cartWidth / 2, cartPosition + 50);
            onMove(newX);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
  },
  touchFeedback: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  touchGradient: {
    flex: 1,
    borderRadius: 25,
  },
  dragIndicator: {
    position: 'absolute',
    top: 0,
    bottom: 200,
    width: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  powerUpContainer: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    flexDirection: 'row',
    gap: 10,
  },
  powerUpButton: {
    width: MIN_TOUCH_SIZE + 8,
    height: MIN_TOUCH_SIZE + 8,
    borderRadius: (MIN_TOUCH_SIZE + 8) / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  powerUpTouchable: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  powerUpDisabled: {
    opacity: 0.5,
    backgroundColor: 'rgba(128, 128, 128, 0.5)',
  },
  powerUpSelected: {
    backgroundColor: '#FFD700',
    borderWidth: 3,
    borderColor: '#FFA500',
  },
  powerUpIcon: {
    fontSize: 28,
  },
  cooldownOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: MIN_TOUCH_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cooldownText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  pauseButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: MIN_TOUCH_SIZE,
    height: MIN_TOUCH_SIZE,
    borderRadius: MIN_TOUCH_SIZE / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  pauseIcon: {
    fontSize: 24,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 215, 0, 0.9)',
    padding: 15,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: '#FF6B6B',
    borderRadius: 5,
  },
  cancelText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  touchZones: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 150,
    flexDirection: 'row',
  },
  leftZone: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  rightZone: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});