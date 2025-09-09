import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  Platform,
  Dimensions,
  Animated,
  PanResponder,
  Alert
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Enhanced Game Screen with full functionality
function GameScreen({ navigation }: any) {
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [gameActive, setGameActive] = useState(false);
  const [cartPosition, setCartPosition] = useState(screenWidth / 2 - 30);
  const [fallingItems, setFallingItems] = useState<any[]>([]);
  const [level, setLevel] = useState(1);
  const [lives, setLives] = useState(3);
  const [isPaused, setIsPaused] = useState(false);
  const [combo, setCombo] = useState(0);
  const [highScore, setHighScore] = useState(0);

  const cartPan = useRef(new Animated.Value(cartPosition)).current;
  const gameLoopRef = useRef<any>(null);
  const itemIdCounter = useRef(0);
  const lastTouchRef = useRef<number | null>(null);
  const touchStartXRef = useRef<number | null>(null);

  // Load high score
  useEffect(() => {
    loadHighScore();
  }, []);

  const loadHighScore = async () => {
    try {
      const saved = await AsyncStorage.getItem('highScore');
      if (saved) setHighScore(parseInt(saved));
    } catch (error) {
      console.log('Error loading high score:', error);
    }
  };

  const saveHighScore = async (newScore: number) => {
    try {
      await AsyncStorage.setItem('highScore', newScore.toString());
      setHighScore(newScore);
    } catch (error) {
      console.log('Error saving high score:', error);
    }
  };

  // Touch/Mouse controls for web
  const handleTouchStart = (e: any) => {
    if (!gameActive || isPaused) return;
    
    const touch = e.nativeEvent.touches ? e.nativeEvent.touches[0] : e.nativeEvent;
    touchStartXRef.current = touch.pageX || touch.clientX;
    lastTouchRef.current = touch.pageX || touch.clientX;
  };

  const handleTouchMove = (e: any) => {
    if (!gameActive || isPaused || !touchStartXRef.current) return;
    
    const touch = e.nativeEvent.touches ? e.nativeEvent.touches[0] : e.nativeEvent;
    const currentX = touch.pageX || touch.clientX;
    
    if (lastTouchRef.current !== null) {
      const deltaX = currentX - lastTouchRef.current;
      const newPosition = Math.max(0, Math.min(screenWidth - 60, cartPosition + deltaX));
      setCartPosition(newPosition);
      cartPan.setValue(newPosition);
    }
    
    lastTouchRef.current = currentX;
  };

  const handleTouchEnd = () => {
    touchStartXRef.current = null;
    lastTouchRef.current = null;
  };

  // Keyboard controls for desktop
  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleKeyPress = (e: KeyboardEvent) => {
        if (!gameActive || isPaused) return;
        
        const moveSpeed = 15;
        if (e.key === 'ArrowLeft') {
          const newPos = Math.max(0, cartPosition - moveSpeed);
          setCartPosition(newPos);
          cartPan.setValue(newPos);
        } else if (e.key === 'ArrowRight') {
          const newPos = Math.min(screenWidth - 60, cartPosition + moveSpeed);
          setCartPosition(newPos);
          cartPan.setValue(newPos);
        } else if (e.key === ' ') {
          setIsPaused(!isPaused);
        }
      };

      window.addEventListener('keydown', handleKeyPress);
      return () => window.removeEventListener('keydown', handleKeyPress);
    }
  }, [gameActive, isPaused, cartPosition]);

  // Spawn falling items
  const spawnItem = useCallback(() => {
    const types = [
      { type: 'coin', emoji: '💰', value: 10, speed: 2 + level * 0.3 },
      { type: 'gem', emoji: '💎', value: 25, speed: 2.5 + level * 0.3 },
      { type: 'gold', emoji: '🏆', value: 50, speed: 3 + level * 0.3 },
      { type: 'bomb', emoji: '💣', value: -20, speed: 2 + level * 0.2 },
    ];

    const itemType = types[Math.floor(Math.random() * types.length)];
    const newItem = {
      id: itemIdCounter.current++,
      x: Math.random() * (screenWidth - 40),
      y: -50,
      ...itemType,
      animation: new Animated.Value(-50),
    };

    setFallingItems(prev => [...prev, newItem]);

    // Animate falling
    Animated.timing(newItem.animation, {
      toValue: screenHeight,
      duration: (5000 - level * 100) / itemType.speed,
      useNativeDriver: false,
    }).start(() => {
      // Remove item when it reaches bottom
      setFallingItems(prev => prev.filter(item => item.id !== newItem.id));
      
      // Lose life if it was a valuable item
      if (newItem.type !== 'bomb' && gameActive) {
        setCombo(0);
      }
    });

    return newItem;
  }, [level, gameActive]);

  // Game loop
  useEffect(() => {
    if (gameActive && !isPaused) {
      gameLoopRef.current = setInterval(() => {
        spawnItem();
      }, Math.max(500, 2000 - level * 100));

      return () => {
        if (gameLoopRef.current) {
          clearInterval(gameLoopRef.current);
        }
      };
    }
  }, [gameActive, isPaused, level, spawnItem]);

  // Collision detection
  useEffect(() => {
    if (!gameActive || isPaused) return;

    const checkCollisions = setInterval(() => {
      fallingItems.forEach(item => {
        const itemY = (item.animation as any)._value;
        
        // Check if item is at cart level
        if (itemY > screenHeight - 150 && itemY < screenHeight - 50) {
          // Check horizontal collision
          if (item.x > cartPosition - 30 && item.x < cartPosition + 60) {
            // Collision detected
            handleItemCollection(item);
          }
        }
      });
    }, 50);

    return () => clearInterval(checkCollisions);
  }, [fallingItems, cartPosition, gameActive, isPaused]);

  const handleItemCollection = (item: any) => {
    setFallingItems(prev => prev.filter(i => i.id !== item.id));
    
    if (item.type === 'bomb') {
      setLives(prev => prev - 1);
      setCombo(0);
      if (lives <= 1) {
        endGame();
      }
    } else {
      setScore(prev => {
        const comboBonus = combo > 0 ? Math.floor(item.value * (1 + combo * 0.1)) : item.value;
        return prev + comboBonus;
      });
      setCoins(prev => prev + 1);
      setCombo(prev => prev + 1);
      
      // Level up every 100 points
      if ((score + item.value) >= level * 100) {
        setLevel(prev => prev + 1);
      }
    }
  };

  const startGame = () => {
    setGameActive(true);
    setScore(0);
    setCoins(0);
    setLevel(1);
    setLives(3);
    setCombo(0);
    setIsPaused(false);
    setFallingItems([]);
    setCartPosition(screenWidth / 2 - 30);
    cartPan.setValue(screenWidth / 2 - 30);
  };

  const endGame = async () => {
    setGameActive(false);
    setIsPaused(true);
    
    if (score > highScore) {
      await saveHighScore(score);
      Alert.alert('New High Score!', `You scored ${score} points!`, [
        { text: 'OK', onPress: () => navigation.navigate('Home') }
      ]);
    } else {
      Alert.alert('Game Over', `You scored ${score} points!`, [
        { text: 'OK', onPress: () => navigation.navigate('Home') }
      ]);
    }
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View 
        style={styles.gameContainer}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleTouchStart}
        onMouseMove={handleTouchMove}
        onMouseUp={handleTouchEnd}
        onMouseLeave={handleTouchEnd}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.statsRow}>
            <Text style={styles.statsText}>Score: {score}</Text>
            <Text style={styles.statsText}>Level: {level}</Text>
            <Text style={styles.statsText}>💰 × {coins}</Text>
          </View>
          <View style={styles.statsRow}>
            <Text style={styles.statsText}>Lives: {'❤️'.repeat(lives)}</Text>
            <Text style={styles.statsText}>Combo: ×{combo}</Text>
            <Text style={styles.statsText}>High: {highScore}</Text>
          </View>
        </View>

        {/* Game Area */}
        <View style={styles.gameArea}>
          {/* Falling Items */}
          {fallingItems.map(item => (
            <Animated.View
              key={item.id}
              style={[
                styles.fallingItem,
                {
                  left: item.x,
                  transform: [{ translateY: item.animation }],
                }
              ]}
            >
              <Text style={styles.itemEmoji}>{item.emoji}</Text>
            </Animated.View>
          ))}

          {/* Cart */}
          <Animated.View
            style={[
              styles.cart,
              {
                transform: [{ translateX: cartPan }],
                bottom: 50,
              }
            ]}
          >
            <Text style={styles.cartEmoji}>🛒</Text>
          </Animated.View>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          {!gameActive ? (
            <TouchableOpacity style={styles.button} onPress={startGame}>
              <Text style={styles.buttonText}>Start Game</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.button} onPress={togglePause}>
              <Text style={styles.buttonText}>{isPaused ? 'Resume' : 'Pause'}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Instructions */}
        {!gameActive && (
          <View style={styles.instructions}>
            <Text style={styles.instructionText}>
              {Platform.OS === 'web' 
                ? '🖱️ Mouse/Touch: Drag to move cart | ⌨️ Arrow Keys: Move | Space: Pause'
                : '👆 Touch and drag to move the cart'}
            </Text>
            <Text style={styles.instructionText}>
              Collect 💰💎🏆 and avoid 💣!
            </Text>
          </View>
        )}

        {isPaused && gameActive && (
          <View style={styles.pauseOverlay}>
            <Text style={styles.pauseText}>PAUSED</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

// Home Screen
function HomeScreen({ navigation }: any) {
  const [highScore, setHighScore] = useState(0);

  useEffect(() => {
    loadHighScore();
  }, []);

  const loadHighScore = async () => {
    try {
      const saved = await AsyncStorage.getItem('highScore');
      if (saved) setHighScore(parseInt(saved));
    } catch (error) {
      console.log('Error loading high score:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.menuContainer}>
        <Text style={styles.title}>🍯 Pot of Gold</Text>
        <Text style={styles.subtitle}>Welcome to the Gold Rush!</Text>
        
        {highScore > 0 && (
          <Text style={styles.highScoreText}>High Score: {highScore}</Text>
        )}
        
        <TouchableOpacity 
          style={styles.menuButton}
          onPress={() => navigation.navigate('Game')}
        >
          <Text style={styles.menuButtonText}>Play Game</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.menuButton, styles.secondaryButton]}
          onPress={() => Alert.alert('Coming Soon', 'Leaderboard will be available soon!')}
        >
          <Text style={styles.menuButtonText}>Leaderboard</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.menuButton, styles.secondaryButton]}
          onPress={() => Alert.alert('Coming Soon', 'Settings will be available soon!')}
        >
          <Text style={styles.menuButtonText}>Settings</Text>
        </TouchableOpacity>

        <View style={styles.platformInfo}>
          <Text style={styles.platformText}>
            Playing on {Platform.OS === 'web' ? 'Web' : Platform.OS}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const Stack = createStackNavigator();

// Main App Component
export default function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simple initialization
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    // Log that app started
    console.log('Pot of Gold Web App Started');
    console.log('Platform:', Platform.OS);
    console.log('Touch support enabled for mobile devices');
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>🍯</Text>
        <Text style={styles.loadingSubtext}>Loading Pot of Gold...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: '#1a1a2e',
          },
          headerTintColor: '#FFD700',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen 
          name="Home" 
          component={HomeScreen}
          options={{ title: 'Pot of Gold' }}
        />
        <Stack.Screen 
          name="Game" 
          component={GameScreen}
          options={{ title: 'Play Game' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
  },
  loadingText: {
    fontSize: 72,
    marginBottom: 20,
  },
  loadingSubtext: {
    fontSize: 18,
    color: '#FFD700',
  },
  gameContainer: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  menuContainer: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 20,
    color: '#fff',
    marginBottom: 40,
    textAlign: 'center',
  },
  header: {
    padding: 15,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 5,
  },
  statsText: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
  },
  gameArea: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  fallingItem: {
    position: 'absolute',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemEmoji: {
    fontSize: 30,
  },
  cart: {
    position: 'absolute',
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartEmoji: {
    fontSize: 40,
  },
  controls: {
    padding: 20,
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 30,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  menuButton: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 50,
    paddingVertical: 15,
    borderRadius: 30,
    marginVertical: 10,
    minWidth: 200,
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: '#764ba2',
  },
  menuButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  instructions: {
    padding: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 20,
    borderRadius: 10,
    marginBottom: 20,
  },
  instructionText: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
    marginVertical: 2,
  },
  pauseOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -50 }, { translateY: -25 }],
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 20,
    borderRadius: 10,
  },
  pauseText: {
    color: '#FFD700',
    fontSize: 24,
    fontWeight: 'bold',
  },
  highScoreText: {
    fontSize: 18,
    color: '#FFD700',
    marginBottom: 20,
  },
  platformInfo: {
    position: 'absolute',
    bottom: 20,
    padding: 10,
  },
  platformText: {
    color: '#888',
    fontSize: 12,
  },
});