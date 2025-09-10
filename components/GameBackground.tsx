import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const GameBackground: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* Sky gradient background */}
      <LinearGradient
        colors={['#87CEEB', '#B0E0E6', '#ADD8E6']}
        style={styles.skyGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
      
      {/* Rolling hills landscape */}
      <View style={styles.landscape}>
        {/* Left hill */}
        <View style={styles.hillLeft}>
          <LinearGradient
            colors={['#7FD82B', '#6BC81B']}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        </View>
        
        {/* Right hill */}
        <View style={styles.hillRight}>
          <LinearGradient
            colors={['#8FE53B', '#7FD82B']}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        </View>
        
        {/* Middle hill */}
        <View style={styles.hillMiddle}>
          <LinearGradient
            colors={['#6BC81B', '#5BB80B']}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          />
        </View>
      </View>
      
      {/* Ground/track bed */}
      <View style={styles.ground}>
        <LinearGradient
          colors={['#8B6332', '#6B4226']}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  
  skyGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.75,
  },
  
  landscape: {
    position: 'absolute',
    bottom: height * 0.15,
    left: 0,
    right: 0,
    height: height * 0.25,
  },
  
  hillLeft: {
    position: 'absolute',
    bottom: 0,
    left: -width * 0.2,
    width: width * 0.7,
    height: 180,
    borderTopRightRadius: 300,
    transform: [{ skewX: '-10deg' }],
    overflow: 'hidden',
  },
  
  hillRight: {
    position: 'absolute',
    bottom: 0,
    right: -width * 0.2,
    width: width * 0.7,
    height: 150,
    borderTopLeftRadius: 300,
    transform: [{ skewX: '10deg' }],
    overflow: 'hidden',
  },
  
  hillMiddle: {
    position: 'absolute',
    bottom: -20,
    left: width * 0.2,
    width: width * 0.6,
    height: 120,
    borderTopLeftRadius: 200,
    borderTopRightRadius: 200,
    overflow: 'hidden',
  },
  
  ground: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.15,
  },
});

export default GameBackground;