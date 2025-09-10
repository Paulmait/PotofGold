import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface GameHUDEnhancedProps {
  score: number;
  coins: number;
  stars: number;
  bombs: number;
  hearts: number;
  onPause: () => void;
  powerUps: {
    medal: number;
    magnet: number;
    multiplier: number;
  };
}

const GameHUDEnhanced: React.FC<GameHUDEnhancedProps> = ({
  score,
  coins,
  stars,
  bombs,
  hearts,
  onPause,
  powerUps,
}) => {
  return (
    <View style={styles.container}>
      {/* Top HUD Bar */}
      <View style={styles.topBar}>
        {/* Coins */}
        <View style={styles.hudItem}>
          <FontAwesome5 name="coins" size={20} color="#FFD700" />
          <Text style={styles.hudText}>{coins}</Text>
        </View>
        
        {/* Stars */}
        <View style={styles.hudItem}>
          <FontAwesome5 name="star" size={20} color="#FFD700" />
          <Text style={styles.hudText}>{stars}</Text>
        </View>
        
        {/* Bombs */}
        <View style={styles.hudItem}>
          <MaterialCommunityIcons name="bomb" size={20} color="#FF4444" />
          <Text style={styles.hudText}>{bombs}</Text>
        </View>
        
        {/* Hearts */}
        <View style={styles.hudItem}>
          <FontAwesome5 name="heart" size={20} color="#FF69B4" />
          <Text style={styles.hudText}>{hearts}</Text>
        </View>
        
        {/* Pause Button */}
        <TouchableOpacity style={styles.pauseButton} onPress={onPause}>
          <Ionicons name="pause" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
      
      {/* Power-up Indicators */}
      <View style={styles.powerUpRow}>
        {/* Medal Power-up */}
        <View style={[styles.powerUpItem, powerUps.medal > 0 && styles.powerUpActive]}>
          <FontAwesome5 name="medal" size={24} color={powerUps.medal > 0 ? "#FFD700" : "#666"} />
          {powerUps.medal > 0 && (
            <View style={styles.powerUpBadge}>
              <Text style={styles.powerUpBadgeText}>{powerUps.medal}</Text>
            </View>
          )}
        </View>
        
        {/* Magnet Power-up */}
        <View style={[styles.powerUpItem, powerUps.magnet > 0 && styles.powerUpActive]}>
          <MaterialCommunityIcons name="magnet" size={24} color={powerUps.magnet > 0 ? "#FF6B6B" : "#666"} />
          {powerUps.magnet > 0 && (
            <View style={styles.powerUpBadge}>
              <Text style={styles.powerUpBadgeText}>{powerUps.magnet}</Text>
            </View>
          )}
        </View>
        
        {/* Multiplier Power-up */}
        <View style={[styles.powerUpItem, powerUps.multiplier > 0 && styles.powerUpActive]}>
          <Text style={[styles.multiplierText, { color: powerUps.multiplier > 0 ? "#00FF00" : "#666" }]}>
            x{powerUps.multiplier > 0 ? powerUps.multiplier : 2}
          </Text>
          {powerUps.multiplier > 0 && (
            <View style={styles.powerUpBadge}>
              <Text style={styles.powerUpBadgeText}>{powerUps.multiplier}</Text>
            </View>
          )}
        </View>
        
        {/* Gift/Present indicator */}
        <View style={styles.powerUpItem}>
          <FontAwesome5 name="gift" size={24} color="#FF69B4" />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  
  hudItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    minWidth: 60,
    gap: 5,
  },
  
  hudText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  
  pauseButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#4A5568',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  
  powerUpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 15,
    gap: 8,
  },
  
  powerUpItem: {
    width: 50,
    height: 50,
    backgroundColor: 'rgba(74, 85, 104, 0.8)',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#888',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  powerUpActive: {
    backgroundColor: 'rgba(255, 215, 0, 0.3)',
    borderColor: '#FFD700',
  },
  
  powerUpBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#FF0000',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
    minWidth: 16,
    alignItems: 'center',
  },
  
  powerUpBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  
  multiplierText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default GameHUDEnhanced;