import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { FontAwesome5, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface GameActionButtonsProps {
  onStreak: () => void;
  onPass: () => void;
  onShop: () => void;
  onSkin: () => void;
  onVacuum: () => void;
  onClearAll: () => void;
  streakCount?: number;
  passCount?: number;
  vacuumCount?: number;
  clearAllCount?: number;
}

const GameActionButtons: React.FC<GameActionButtonsProps> = ({
  onStreak,
  onPass,
  onShop,
  onSkin,
  onVacuum,
  onClearAll,
  streakCount = 0,
  passCount = 0,
  vacuumCount = 25,
  clearAllCount = 50,
}) => {
  return (
    <View style={styles.container}>
      {/* Streak Button */}
      <TouchableOpacity style={styles.actionButton} onPress={onStreak}>
        <FontAwesome5 name="fire" size={24} color="#FF6B35" />
        <Text style={styles.buttonText}>Streak</Text>
        {streakCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{streakCount}</Text>
          </View>
        )}
      </TouchableOpacity>
      
      {/* Pass Button */}
      <TouchableOpacity style={styles.actionButton} onPress={onPass}>
        <MaterialCommunityIcons name="trophy" size={24} color="#FFD700" />
        <Text style={styles.buttonText}>Pass</Text>
        {passCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{passCount}</Text>
          </View>
        )}
      </TouchableOpacity>
      
      {/* Shop Button */}
      <TouchableOpacity style={styles.actionButton} onPress={onShop}>
        <FontAwesome5 name="shopping-cart" size={22} color="#4ECDC4" />
        <Text style={styles.buttonText}>Shop</Text>
      </TouchableOpacity>
      
      {/* Skin Button */}
      <TouchableOpacity style={styles.actionButton} onPress={onSkin}>
        <MaterialCommunityIcons name="palette" size={24} color="#FF69B4" />
        <Text style={styles.buttonText}>Skin</Text>
      </TouchableOpacity>
      
      {/* Vacuum Button */}
      <TouchableOpacity style={styles.actionButton} onPress={onVacuum}>
        <MaterialCommunityIcons name="magnet" size={24} color="#9B59B6" />
        <Text style={styles.buttonText}>Vacuum</Text>
        <View style={[styles.badge, styles.costBadge]}>
          <Text style={styles.badgeText}>{vacuumCount}</Text>
        </View>
      </TouchableOpacity>
      
      {/* Clear All Button */}
      <TouchableOpacity style={styles.actionButton} onPress={onClearAll}>
        <Ionicons name="close-circle" size={24} color="#E74C3C" />
        <Text style={styles.buttonText}>Clear All</Text>
        <View style={[styles.badge, styles.costBadge]}>
          <Text style={styles.badgeText}>{clearAllCount}</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 85,
    backgroundColor: '#3A3458',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 5,
    borderTopWidth: 2,
    borderTopColor: '#2A2448',
  },
  
  actionButton: {
    width: width / 6.5,
    height: 65,
    backgroundColor: '#5A4B8B',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#7A6BAB',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  
  buttonText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF4444',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  
  costBadge: {
    backgroundColor: '#FFD700',
    bottom: -5,
    top: undefined,
  },
  
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default GameActionButtons;