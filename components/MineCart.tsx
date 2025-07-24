import React from 'react';
import { View, StyleSheet, Animated, Text } from 'react-native';

interface MineCartProps {
  position: number;
  size: number;
  isTurboActive?: boolean;
  onWheelSpin?: (direction: 'left' | 'right') => void;
  activeSkin?: {
    id: string;
    type: 'flag' | 'shape' | 'trail';
    theme: {
      primaryColor: string;
      secondaryColor: string;
      accentColor: string;
    };
  };
}

export default function MineCart({ 
  position, 
  size, 
  isTurboActive = false, 
  onWheelSpin,
  activeSkin 
}: MineCartProps) {
  const wheelSpinAnimation = new Animated.Value(0);

  // Wheel spinning animation
  React.useEffect(() => {
    if (isTurboActive) {
      const spinAnimation = Animated.loop(
        Animated.timing(wheelSpinAnimation, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        })
      );
      spinAnimation.start();
      return () => spinAnimation.stop();
    }
  }, [isTurboActive]);

  const wheelRotation = wheelSpinAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const renderFlagSkin = () => {
    if (!activeSkin || activeSkin.type !== 'flag') return null;

    return (
      <View style={[styles.flagOverlay, { backgroundColor: activeSkin.theme.primaryColor }]}>
        {/* Flag pattern based on state */}
        {activeSkin.id === 'california' && (
          <View style={styles.californiaFlag}>
            <View style={[styles.flagSection, { backgroundColor: '#FFFFFF' }]}>
              <View style={styles.bearEmblem}>
                <Text style={styles.bearText}>🐻</Text>
              </View>
              <View style={styles.starEmblem}>
                <Text style={styles.starText}>⭐</Text>
              </View>
            </View>
            <View style={[styles.flagSection, { backgroundColor: '#FF0000' }]} />
          </View>
        )}
        {activeSkin.id === 'texas' && (
          <View style={styles.texasFlag}>
            <View style={[styles.flagSection, { backgroundColor: '#FFFFFF' }]}>
              <Text style={styles.loneStar}>⭐</Text>
            </View>
            <View style={[styles.flagSection, { backgroundColor: '#FF0000' }]} />
          </View>
        )}
        {activeSkin.id === 'new_york' && (
          <View style={styles.newYorkFlag}>
            <View style={[styles.flagSection, { backgroundColor: '#1E3A8A' }]} />
            <View style={[styles.flagSection, { backgroundColor: '#F59E0B' }]} />
          </View>
        )}
        {/* Add more state flags as needed */}
      </View>
    );
  };

  const renderShapeSkin = () => {
    if (!activeSkin || activeSkin.type !== 'shape') return null;

    return (
      <View style={styles.shapeEmblem}>
        {activeSkin.id === 'texas' && (
          <View style={[styles.stateShape, { borderColor: activeSkin.theme.accentColor }]}>
            <Text style={styles.shapeText}>TX</Text>
          </View>
        )}
        {activeSkin.id === 'new_york' && (
          <View style={[styles.stateShape, { borderColor: activeSkin.theme.accentColor }]}>
            <Text style={styles.shapeText}>NY</Text>
          </View>
        )}
        {activeSkin.id === 'california' && (
          <View style={[styles.stateShape, { borderColor: activeSkin.theme.accentColor }]}>
            <Text style={styles.shapeText}>CA</Text>
          </View>
        )}
        {activeSkin.id === 'florida' && (
          <View style={[styles.stateShape, { borderColor: activeSkin.theme.accentColor }]}>
            <Text style={styles.shapeText}>FL</Text>
          </View>
        )}
        {/* Add more state shapes as needed */}
      </View>
    );
  };

  const renderTrailEffect = () => {
    if (!activeSkin || activeSkin.type !== 'trail') return null;

    return (
      <View style={styles.trailContainer}>
        {activeSkin.id === 'florida' && (
          <View style={styles.floridaTrail}>
            <Text style={styles.palmTree}>🌴</Text>
            <Text style={styles.sun}>☀️</Text>
          </View>
        )}
        {activeSkin.id === 'hawaii' && (
          <View style={styles.hawaiiTrail}>
            <Text style={styles.hibiscus}>🌸</Text>
          </View>
        )}
        {activeSkin.id === 'alaska' && (
          <View style={styles.alaskaTrail}>
            <Text style={styles.aurora}>✨</Text>
          </View>
        )}
        {/* Add more trail effects as needed */}
      </View>
    );
  };

  return (
    <View style={[styles.container, { left: position - size / 2 }]}>
      {/* Main Cart Body */}
      <View style={[styles.cartBody, { width: size, height: size * 0.67 }]}>
        {/* Flag Skin Overlay */}
        {renderFlagSkin()}
        
        {/* Shape Skin Emblem */}
        {renderShapeSkin()}
        
        {/* Cart Details */}
        <View style={styles.cartDetails}>
          <View style={styles.cartFront}>
            <View style={styles.cartWindow} />
          </View>
          <View style={styles.cartSide}>
            <View style={styles.woodenPlanks}>
              <View style={styles.plank} />
              <View style={styles.plank} />
              <View style={styles.plank} />
            </View>
          </View>
        </View>
      </View>

      {/* Wheels */}
      <View style={styles.wheelsContainer}>
        <Animated.View 
          style={[
            styles.wheel, 
            { 
              left: size * 0.2,
              transform: [{ rotate: wheelRotation }]
            }
          ]} 
        />
        <Animated.View 
          style={[
            styles.wheel, 
            { 
              right: size * 0.2,
              transform: [{ rotate: wheelRotation }]
            }
          ]} 
        />
      </View>

      {/* Trail Effect */}
      {renderTrailEffect()}

      {/* Turbo Boost Effect */}
      {isTurboActive && (
        <View style={styles.turboEffect}>
          <Text style={styles.turboText}>⚡</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    zIndex: 20,
  },
  cartBody: {
    backgroundColor: '#8B4513',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#654321',
    position: 'relative',
  },
  flagOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 6,
    opacity: 0.8,
    zIndex: 1,
  },
  californiaFlag: {
    flex: 1,
    flexDirection: 'row',
  },
  flagSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bearEmblem: {
    position: 'absolute',
    top: '20%',
    left: '20%',
  },
  bearText: {
    fontSize: 12,
  },
  starEmblem: {
    position: 'absolute',
    top: '10%',
    left: '10%',
  },
  starText: {
    fontSize: 8,
  },
  texasFlag: {
    flex: 1,
    flexDirection: 'row',
  },
  loneStar: {
    fontSize: 16,
    color: '#1E3A8A',
  },
  newYorkFlag: {
    flex: 1,
    flexDirection: 'row',
  },
  shapeEmblem: {
    position: 'absolute',
    top: '10%',
    left: '10%',
    zIndex: 2,
  },
  stateShape: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  shapeText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#000',
  },
  cartDetails: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 3,
  },
  cartFront: {
    position: 'absolute',
    top: '15%',
    left: '10%',
    width: '30%',
    height: '40%',
    backgroundColor: '#654321',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartWindow: {
    width: '60%',
    height: '60%',
    backgroundColor: '#87CEEB',
    borderRadius: 2,
  },
  cartSide: {
    position: 'absolute',
    top: '15%',
    right: '10%',
    width: '40%',
    height: '40%',
  },
  woodenPlanks: {
    flex: 1,
    justifyContent: 'space-between',
  },
  plank: {
    height: 2,
    backgroundColor: '#654321',
    borderRadius: 1,
  },
  wheelsContainer: {
    position: 'absolute',
    bottom: -8,
    left: 0,
    right: 0,
    height: 16,
  },
  wheel: {
    position: 'absolute',
    width: 16,
    height: 16,
    backgroundColor: '#333333',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#666666',
  },
  trailContainer: {
    position: 'absolute',
    bottom: 0,
    left: -20,
    right: -20,
    height: 30,
    zIndex: 1,
  },
  floridaTrail: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  palmTree: {
    fontSize: 12,
  },
  sun: {
    fontSize: 10,
  },
  hawaiiTrail: {
    alignItems: 'center',
  },
  hibiscus: {
    fontSize: 12,
  },
  alaskaTrail: {
    alignItems: 'center',
  },
  aurora: {
    fontSize: 12,
  },
  turboEffect: {
    position: 'absolute',
    top: -10,
    right: -5,
    zIndex: 4,
  },
  turboText: {
    fontSize: 16,
  },
}); 