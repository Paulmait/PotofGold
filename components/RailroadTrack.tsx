import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

const RailroadTrack: React.FC = () => {
  // Create array of railroad ties
  const tieCount = Math.floor(width / 50) + 2;
  const ties = Array.from({ length: tieCount }, (_, i) => i);
  
  return (
    <View style={styles.container}>
      {/* Railroad ties (wooden beams) */}
      <View style={styles.tiesContainer}>
        {ties.map((index) => (
          <View key={index} style={styles.tie}>
            <View style={styles.tieTop} />
            <View style={styles.tieMiddle} />
            <View style={styles.tieBottom} />
          </View>
        ))}
      </View>
      
      {/* Rails */}
      <View style={styles.railsContainer}>
        {/* Left rail */}
        <View style={styles.railLeft}>
          <View style={styles.railTop} />
          <View style={styles.railSide} />
        </View>
        
        {/* Right rail */}
        <View style={styles.railRight}>
          <View style={styles.railTop} />
          <View style={styles.railSide} />
        </View>
      </View>
      
      {/* Gravel/ballast between ties */}
      <View style={styles.ballastContainer}>
        {ties.map((index) => (
          <View key={`ballast-${index}`} style={styles.ballast} />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: height * 0.05,
    left: 0,
    right: 0,
    height: 80,
  },
  
  tiesContainer: {
    position: 'absolute',
    flexDirection: 'row',
    bottom: 0,
    left: -25,
    right: -25,
    height: 60,
    justifyContent: 'space-between',
  },
  
  tie: {
    width: 12,
    height: 60,
    marginHorizontal: 38,
  },
  
  tieTop: {
    width: '100%',
    height: 15,
    backgroundColor: '#654321',
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  
  tieMiddle: {
    width: '100%',
    height: 30,
    backgroundColor: '#5C3A1E',
  },
  
  tieBottom: {
    width: '100%',
    height: 15,
    backgroundColor: '#4A2F18',
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
  
  railsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 40,
  },
  
  railLeft: {
    position: 'absolute',
    left: width * 0.25,
    top: 10,
    right: width * 0.75,
    height: 8,
  },
  
  railRight: {
    position: 'absolute',
    left: width * 0.75,
    top: 10,
    right: width * 0.25,
    height: 8,
  },
  
  railTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 6,
    backgroundColor: '#C0C0C0',
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
    borderWidth: 1,
    borderColor: '#A8A8A8',
  },
  
  railSide: {
    position: 'absolute',
    top: 6,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#808080',
  },
  
  ballastContainer: {
    position: 'absolute',
    bottom: -5,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  
  ballast: {
    width: 30,
    height: 10,
    backgroundColor: '#696969',
    borderRadius: 5,
    opacity: 0.3,
  },
});

export default RailroadTrack;