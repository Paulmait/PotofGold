import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

interface StateSpecialItemProps {
  type: string;
  size?: number;
  theme?: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
  };
}

export const StateSpecialItem: React.FC<StateSpecialItemProps> = ({
  type,
  size = 30,
  theme = { primaryColor: '#FFD700', secondaryColor: '#FFA500', accentColor: '#FFFFFF' },
}) => {
  const renderSpecialItem = () => {
    switch (type) {
      case 'lobster':
        return (
          <View style={[styles.itemContainer, { width: size, height: size }]}>
            <View style={[styles.lobsterBody, { backgroundColor: theme.primaryColor }]} />
            <View style={[styles.lobsterClaw1, { backgroundColor: theme.secondaryColor }]} />
            <View style={[styles.lobsterClaw2, { backgroundColor: theme.secondaryColor }]} />
            <View style={[styles.lobsterTail, { backgroundColor: theme.accentColor }]} />
          </View>
        );

      case 'peach':
        return (
          <View style={[styles.itemContainer, { width: size, height: size }]}>
            <View style={[styles.peachBody, { backgroundColor: theme.primaryColor }]} />
            <View style={[styles.peachLeaf, { backgroundColor: theme.secondaryColor }]} />
            <View style={[styles.peachHighlight, { backgroundColor: theme.accentColor }]} />
          </View>
        );

      case 'oak_leaf':
        return (
          <View style={[styles.itemContainer, { width: size, height: size }]}>
            <View style={[styles.oakLeaf, { backgroundColor: theme.primaryColor }]} />
            <View style={[styles.oakVein, { backgroundColor: theme.secondaryColor }]} />
          </View>
        );

      case 'blue_hen':
        return (
          <View style={[styles.itemContainer, { width: size, height: size }]}>
            <View style={[styles.henBody, { backgroundColor: theme.primaryColor }]} />
            <View style={[styles.henHead, { backgroundColor: theme.secondaryColor }]} />
            <View style={[styles.henBeak, { backgroundColor: theme.accentColor }]} />
            <View style={[styles.henWing, { backgroundColor: theme.primaryColor }]} />
          </View>
        );

      case 'orange':
        return (
          <View style={[styles.itemContainer, { width: size, height: size }]}>
            <View style={[styles.orangeBody, { backgroundColor: theme.primaryColor }]} />
            <View style={[styles.orangeStem, { backgroundColor: theme.secondaryColor }]} />
            <View style={[styles.orangeHighlight, { backgroundColor: theme.accentColor }]} />
          </View>
        );

      case 'cactus':
        return (
          <View style={[styles.itemContainer, { width: size, height: size }]}>
            <View style={[styles.cactusBody, { backgroundColor: theme.primaryColor }]} />
            <View style={[styles.cactusArm1, { backgroundColor: theme.secondaryColor }]} />
            <View style={[styles.cactusArm2, { backgroundColor: theme.secondaryColor }]} />
            <View style={[styles.cactusFlower, { backgroundColor: theme.accentColor }]} />
          </View>
        );

      case 'apple':
        return (
          <View style={[styles.itemContainer, { width: size, height: size }]}>
            <View style={[styles.appleBody, { backgroundColor: theme.primaryColor }]} />
            <View style={[styles.appleStem, { backgroundColor: theme.secondaryColor }]} />
            <View style={[styles.appleLeaf, { backgroundColor: theme.accentColor }]} />
          </View>
        );

      case 'corn':
        return (
          <View style={[styles.itemContainer, { width: size, height: size }]}>
            <View style={[styles.cornBody, { backgroundColor: theme.primaryColor }]} />
            <View style={[styles.cornKernels, { backgroundColor: theme.secondaryColor }]} />
            <View style={[styles.cornHusk, { backgroundColor: theme.accentColor }]} />
          </View>
        );

      default:
        return (
          <View style={[styles.itemContainer, { width: size, height: size }]}>
            <View style={[styles.defaultItem, { backgroundColor: theme.primaryColor }]} />
          </View>
        );
    }
  };

  return renderSpecialItem();
};

const styles = StyleSheet.create({
  itemContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Lobster (Maine)
  lobsterBody: {
    width: 20,
    height: 12,
    borderRadius: 6,
  },
  lobsterClaw1: {
    position: 'absolute',
    left: 2,
    top: 4,
    width: 6,
    height: 4,
    borderRadius: 2,
  },
  lobsterClaw2: {
    position: 'absolute',
    right: 2,
    top: 4,
    width: 6,
    height: 4,
    borderRadius: 2,
  },
  lobsterTail: {
    position: 'absolute',
    bottom: 2,
    left: 8,
    width: 4,
    height: 6,
    borderRadius: 2,
  },

  // Peach (Georgia)
  peachBody: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  peachLeaf: {
    position: 'absolute',
    top: 2,
    right: 4,
    width: 6,
    height: 4,
    borderRadius: 2,
  },
  peachHighlight: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
    opacity: 0.6,
  },

  // Oak Leaf (Connecticut)
  oakLeaf: {
    width: 20,
    height: 16,
    borderRadius: 10,
  },
  oakVein: {
    position: 'absolute',
    top: 2,
    left: 8,
    width: 4,
    height: 12,
    borderRadius: 2,
  },

  // Blue Hen (Delaware)
  henBody: {
    width: 16,
    height: 12,
    borderRadius: 8,
  },
  henHead: {
    position: 'absolute',
    top: 2,
    left: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  henBeak: {
    position: 'absolute',
    top: 4,
    right: 2,
    width: 3,
    height: 2,
    borderRadius: 1,
  },
  henWing: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: 6,
    height: 4,
    borderRadius: 2,
  },

  // Orange (Florida)
  orangeBody: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  orangeStem: {
    position: 'absolute',
    top: 2,
    left: 8,
    width: 2,
    height: 4,
    borderRadius: 1,
  },
  orangeHighlight: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
    opacity: 0.6,
  },

  // Cactus (Arizona)
  cactusBody: {
    width: 8,
    height: 20,
    borderRadius: 4,
  },
  cactusArm1: {
    position: 'absolute',
    left: 2,
    top: 6,
    width: 6,
    height: 3,
    borderRadius: 1.5,
  },
  cactusArm2: {
    position: 'absolute',
    right: 2,
    top: 10,
    width: 6,
    height: 3,
    borderRadius: 1.5,
  },
  cactusFlower: {
    position: 'absolute',
    top: 2,
    left: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
  },

  // Apple (Washington)
  appleBody: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  appleStem: {
    position: 'absolute',
    top: 2,
    left: 6,
    width: 4,
    height: 3,
    borderRadius: 1.5,
  },
  appleLeaf: {
    position: 'absolute',
    top: 4,
    left: 10,
    width: 4,
    height: 3,
    borderRadius: 1.5,
  },

  // Corn (Iowa)
  cornBody: {
    width: 12,
    height: 20,
    borderRadius: 6,
  },
  cornKernels: {
    position: 'absolute',
    top: 2,
    left: 2,
    right: 2,
    bottom: 2,
    borderRadius: 4,
  },
  cornHusk: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#8B4513',
  },

  // Default item
  defaultItem: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
});
