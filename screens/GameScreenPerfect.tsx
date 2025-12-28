import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Animated,
  Alert,
} from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';

// Import new enhanced components
import GameBackground from '../components/GameBackground';
import RailroadTrack from '../components/RailroadTrack';
import GameHUDEnhanced from '../components/GameHUDEnhanced';
import GameActionButtons from '../components/GameActionButtons';
import MineCartEnhanced from '../components/MineCartEnhanced';
import FallingItemsEnhanced, { FallingItem } from '../components/FallingItemsEnhanced';

const { width, height } = Dimensions.get('window');

interface GameScreenPerfectProps {
  navigation: any;
}

const GameScreenPerfect: React.FC<GameScreenPerfectProps> = ({ navigation }) => {
  // Game state
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [stars, setStars] = useState(0);
  const [bombs, setBombs] = useState(0);
  const [hearts, setHearts] = useState(3);
  const [gameActive, setGameActive] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  
  // Power-ups state
  const [powerUps, setPowerUps] = useState({
    medal: 0,
    magnet: 0,
    multiplier: 0,
  });
  
  // Cart position
  const cartPosition = useRef(new Animated.Value(width / 2 - 40)).current;
  const [collectedCoins, setCollectedCoins] = useState(0);
  
  // Falling items
  const [fallingItems, setFallingItems] = useState<FallingItem[]>([]);
  const itemIdCounter = useRef(0);
  
  // Touch handling for cart movement
  const handleGesture = Animated.event(
    [{ nativeEvent: { translationX: cartPosition } }],
    { useNativeDriver: false }
  );
  
  const onHandlerStateChange = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      // Limit cart position to screen bounds
      const newX = event.nativeEvent.translationX;
      const boundedX = Math.max(0, Math.min(width - 80, newX));
      
      Animated.spring(cartPosition, {
        toValue: boundedX,
        useNativeDriver: false,
        tension: 50,
        friction: 7,
      }).start();
    }
  };
  
  // Spawn falling items
  useEffect(() => {
    if (!gameActive || isPaused) return;
    
    const spawnInterval = setInterval(() => {
      const itemTypes: FallingItem['type'][] = ['coin', 'diamond', 'star', 'clover', 'bomb', 'heart'];
      const randomType = itemTypes[Math.floor(Math.random() * itemTypes.length)];
      const randomX = Math.random() * (width - 40);
      
      const newItem: FallingItem = {
        id: `item-${itemIdCounter.current++}`,
        type: randomType,
        x: randomX,
        y: new Animated.Value(-50),
        speed: 2 + Math.random() * 2,
        value: randomType === 'diamond' ? 50 : randomType === 'star' ? 20 : 10,
      };
      
      setFallingItems(prev => [...prev, newItem]);
    }, 1000);
    
    return () => clearInterval(spawnInterval);
  }, [gameActive, isPaused]);
  
  // Handle item reaching bottom
  const handleItemReachBottom = (itemId: string) => {
    setFallingItems(prev => prev.filter(item => item.id !== itemId));
  };
  
  // Collision detection
  useEffect(() => {
    if (!gameActive || isPaused) return;
    
    const collisionInterval = setInterval(() => {
      fallingItems.forEach(item => {
        // Simple collision detection (you can enhance this)
        const itemY = item.y._value;
        const cartX = cartPosition._value;
        
        if (itemY > height - 150 && itemY < height - 90) {
          if (item.x > cartX - 20 && item.x < cartX + 100) {
            // Collision detected
            handleCollision(item);
          }
        }
      });
    }, 16);
    
    return () => clearInterval(collisionInterval);
  }, [fallingItems, cartPosition, gameActive, isPaused]);
  
  // Handle collision with items
  const handleCollision = (item: FallingItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    switch (item.type) {
      case 'coin':
        setCoins(prev => prev + 1);
        setScore(prev => prev + item.value);
        setCollectedCoins(prev => prev + 1);
        break;
      case 'diamond':
        setScore(prev => prev + item.value);
        break;
      case 'star':
        setStars(prev => prev + 1);
        setScore(prev => prev + item.value);
        break;
      case 'clover':
        setScore(prev => prev + item.value * 2);
        break;
      case 'bomb':
        setBombs(prev => prev + 1);
        setHearts(prev => {
          const newHearts = prev - 1;
          if (newHearts <= 0) {
            handleGameOver();
          }
          return newHearts;
        });
        break;
      case 'heart':
        setHearts(prev => Math.min(prev + 1, 5));
        break;
    }
    
    // Remove collected item
    setFallingItems(prev => prev.filter(i => i.id !== item.id));
  };
  
  // Game over handler
  const handleGameOver = () => {
    setGameActive(false);
    Alert.alert(
      'Game Over',
      `Final Score: ${score}\nCoins: ${coins}`,
      [
        { text: 'Play Again', onPress: resetGame },
        { text: 'Home', onPress: () => navigation.navigate('Home') },
      ]
    );
  };
  
  // Reset game
  const resetGame = () => {
    setScore(0);
    setCoins(0);
    setStars(0);
    setBombs(0);
    setHearts(3);
    setCollectedCoins(0);
    setFallingItems([]);
    setGameActive(true);
    setIsPaused(false);
    cartPosition.setValue(width / 2 - 40);
  };
  
  // Action button handlers
  const handleStreak = () => {
    Alert.alert('Streak', 'Streak bonus activated!');
  };
  
  const handlePass = () => {
    Alert.alert('Pass', 'Season pass features');
  };
  
  const handleShop = () => {
    navigation.navigate('Shop');
  };
  
  const handleSkin = () => {
    Alert.alert('Skins', 'Cart customization');
  };
  
  const handleVacuum = () => {
    if (coins >= 25) {
      setCoins(prev => prev - 25);
      // Activate vacuum power-up
      setPowerUps(prev => ({ ...prev, magnet: 5 }));
    } else {
      Alert.alert('Not enough coins', 'You need 25 coins for vacuum');
    }
  };
  
  const handleClearAll = () => {
    if (coins >= 50) {
      setCoins(prev => prev - 50);
      // Clear all bombs
      setFallingItems(prev => prev.filter(item => item.type !== 'bomb'));
    } else {
      Alert.alert('Not enough coins', 'You need 50 coins for clear all');
    }
  };
  
  return (
    <View style={styles.container}>
      {/* Background layers */}
      <GameBackground />
      <RailroadTrack />
      
      {/* Game HUD */}
      <GameHUDEnhanced
        score={score}
        coins={coins}
        stars={stars}
        bombs={bombs}
        hearts={hearts}
        onPause={() => setIsPaused(!isPaused)}
        powerUps={powerUps}
      />
      
      {/* Falling items */}
      <FallingItemsEnhanced
        items={fallingItems}
        onItemReachBottom={handleItemReachBottom}
      />
      
      {/* Mine cart with gesture handler */}
      <PanGestureHandler
        onGestureEvent={handleGesture}
        onHandlerStateChange={onHandlerStateChange}
      >
        <View
          style={StyleSheet.absoluteFillObject}
          accessible={true}
          accessibilityLabel="Game area. Drag left or right to move the cart"
          accessibilityHint="Move your finger to control the cart and catch falling items"
          accessibilityRole="adjustable"
        >
          <MineCartEnhanced
            position={cartPosition}
            collectedCoins={collectedCoins}
          />
        </View>
      </PanGestureHandler>
      
      {/* Bottom action buttons */}
      <GameActionButtons
        onStreak={handleStreak}
        onPass={handlePass}
        onShop={handleShop}
        onSkin={handleSkin}
        onVacuum={handleVacuum}
        onClearAll={handleClearAll}
        streakCount={0}
        passCount={0}
        vacuumCount={25}
        clearAllCount={50}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#87CEEB',
  },
});

export default GameScreenPerfect;