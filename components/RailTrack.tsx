import React from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');

interface RailTrackProps {
  showDust?: boolean;
  isMoving?: boolean;
}

export default function RailTrack({ showDust = false, isMoving = false }: RailTrackProps) {
  return (
    <View style={styles.railContainer}>
      {/* Main rail track */}
      <View style={styles.railTrack}>
        {/* Top rail */}
        <View style={styles.railTop} />
        
        {/* Bottom rail */}
        <View style={styles.railBottom} />
        
        {/* Rail ties */}
        {Array.from({ length: Math.floor(width / 30) }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.railTie,
              { left: index * 30 },
            ]}
          />
        ))}
      </View>

      {/* Dust particles when moving */}
      {showDust && isMoving && (
        <View style={styles.dustContainer}>
          {Array.from({ length: 5 }).map((_, index) => (
            <View
              key={index}
              style={[
                styles.dustParticle,
                {
                  left: Math.random() * width,
                  animationDelay: `${index * 100}ms`,
                },
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  railContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 20,
    zIndex: 1,
  },
  railTrack: {
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  railTop: {
    position: 'absolute',
    top: 2,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#696969',
    borderRadius: 1,
  },
  railBottom: {
    position: 'absolute',
    bottom: 2,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#696969',
    borderRadius: 1,
  },
  railTie: {
    position: 'absolute',
    bottom: 0,
    width: 4,
    height: 20,
    backgroundColor: '#8B4513',
    borderRadius: 1,
  },
  dustContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 10,
  },
  dustParticle: {
    position: 'absolute',
    bottom: 0,
    width: 2,
    height: 2,
    backgroundColor: '#8B7355',
    borderRadius: 1,
    opacity: 0.6,
  },
}); 