import React from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
} from 'react-native';

const { width, height } = Dimensions.get('window');

interface StateThemeProps {
  stateId: string;
  theme: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
  };
  visualElements: {
    flagPattern?: string;
    shapeOutline?: string;
    particleEffect?: string;
  };
}

export const StateFlagPattern: React.FC<StateThemeProps> = ({ stateId, theme, visualElements }) => {
  const renderFlagPattern = () => {
    switch (visualElements.flagPattern) {
      case 'bay_state':
        return (
          <View style={[styles.flagContainer, { backgroundColor: theme.primaryColor }]}>
            <View style={[styles.flagStripe, { backgroundColor: theme.secondaryColor }]} />
            <View style={[styles.flagStripe, { backgroundColor: theme.accentColor }]} />
            <View style={[styles.flagCanton, { backgroundColor: theme.primaryColor }]} />
          </View>
        );
      case 'empire_state':
        return (
          <View style={[styles.flagContainer, { backgroundColor: theme.primaryColor }]}>
            <View style={[styles.flagStripe, { backgroundColor: theme.secondaryColor }]} />
            <View style={[styles.flagStripe, { backgroundColor: theme.accentColor }]} />
            <View style={[styles.flagStripe, { backgroundColor: theme.secondaryColor }]} />
          </View>
        );
      case 'old_line_state':
        return (
          <View style={[styles.flagContainer, { backgroundColor: theme.primaryColor }]}>
            <View style={[styles.flagCross, { backgroundColor: theme.secondaryColor }]} />
            <View style={[styles.flagCross, { backgroundColor: theme.accentColor }]} />
          </View>
        );
      case 'old_dominion':
        return (
          <View style={[styles.flagContainer, { backgroundColor: theme.primaryColor }]}>
            <View style={[styles.flagStripe, { backgroundColor: theme.secondaryColor }]} />
            <View style={[styles.flagStripe, { backgroundColor: theme.accentColor }]} />
            <View style={[styles.flagStripe, { backgroundColor: theme.secondaryColor }]} />
          </View>
        );
      case 'sunshine_state':
        return (
          <View style={[styles.flagContainer, { backgroundColor: theme.primaryColor }]}>
            <View style={[styles.flagSun, { backgroundColor: theme.secondaryColor }]} />
            <View style={[styles.flagStripe, { backgroundColor: theme.accentColor }]} />
          </View>
        );
      default:
        return (
          <View style={[styles.flagContainer, { backgroundColor: theme.primaryColor }]}>
            <View style={[styles.flagStripe, { backgroundColor: theme.secondaryColor }]} />
          </View>
        );
    }
  };

  return renderFlagPattern();
};

export const StateShapeSilhouette: React.FC<StateThemeProps> = ({ stateId, theme, visualElements }) => {
  const renderShape = () => {
    switch (visualElements.shapeOutline) {
      case 'mountain':
        return (
          <View style={styles.shapeContainer}>
            <View style={[styles.mountain, { backgroundColor: theme.primaryColor }]} />
          </View>
        );
      case 'anchor':
        return (
          <View style={styles.shapeContainer}>
            <View style={[styles.anchor, { backgroundColor: theme.primaryColor }]} />
          </View>
        );
      case 'keystone':
        return (
          <View style={styles.shapeContainer}>
            <View style={[styles.keystone, { backgroundColor: theme.primaryColor }]} />
          </View>
        );
      case 'palmetto':
        return (
          <View style={styles.shapeContainer}>
            <View style={[styles.palmetto, { backgroundColor: theme.primaryColor }]} />
          </View>
        );
      default:
        return null;
    }
  };

  return renderShape();
};

export const StateParticleEffect: React.FC<StateThemeProps> = ({ stateId, theme, visualElements }) => {
  const renderParticles = () => {
    switch (visualElements.particleEffect) {
      case 'maple_leaves':
        return (
          <View style={styles.particleContainer}>
            {Array.from({ length: 5 }).map((_, index) => (
              <View
                key={index}
                style={[
                  styles.mapleLeaf,
                  {
                    backgroundColor: theme.accentColor,
                    left: Math.random() * width,
                    animationDelay: `${index * 200}ms`,
                  },
                ]}
              />
            ))}
          </View>
        );
      case 'garden_flowers':
        return (
          <View style={styles.particleContainer}>
            {Array.from({ length: 6 }).map((_, index) => (
              <View
                key={index}
                style={[
                  styles.flower,
                  {
                    backgroundColor: theme.secondaryColor,
                    left: Math.random() * width,
                    animationDelay: `${index * 150}ms`,
                  },
                ]}
              />
            ))}
          </View>
        );
      case 'pine_needles':
        return (
          <View style={styles.particleContainer}>
            {Array.from({ length: 8 }).map((_, index) => (
              <View
                key={index}
                style={[
                  styles.pineNeedle,
                  {
                    backgroundColor: theme.secondaryColor,
                    left: Math.random() * width,
                    animationDelay: `${index * 100}ms`,
                  },
                ]}
              />
            ))}
          </View>
        );
      default:
        return null;
    }
  };

  return renderParticles();
};

const styles = StyleSheet.create({
  // Flag patterns
  flagContainer: {
    width: 60,
    height: 40,
    borderRadius: 4,
    overflow: 'hidden',
  },
  flagStripe: {
    height: '33.33%',
    width: '100%',
  },
  flagCanton: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '40%',
    height: '50%',
  },
  flagCross: {
    position: 'absolute',
    width: '100%',
    height: 4,
    backgroundColor: '#FFFFFF',
  },
  flagSun: {
    position: 'absolute',
    top: 5,
    left: 5,
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  
  // Shape silhouettes
  shapeContainer: {
    width: 60,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mountain: {
    width: 40,
    height: 25,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  anchor: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  keystone: {
    width: 35,
    height: 25,
    backgroundColor: '#8B4513',
  },
  palmetto: {
    width: 25,
    height: 35,
    backgroundColor: '#228B22',
  },
  
  // Particle effects
  particleContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  mapleLeaf: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    opacity: 0.7,
  },
  flower: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    opacity: 0.8,
  },
  pineNeedle: {
    position: 'absolute',
    width: 3,
    height: 12,
    borderRadius: 1,
    opacity: 0.6,
  },
}); 