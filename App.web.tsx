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
  Alert,
  ScrollView
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Game configuration constants
const GAME_CONFIG = {
  // Game area should be constrained, not full screen
  MAX_GAME_WIDTH: 600,
  MAX_GAME_HEIGHT: 800,
  MIN_GAME_WIDTH: 320,
  MIN_GAME_HEIGHT: 480,
  
  // Cart/Pot settings
  CART_SIZE: 80,
  CART_SPEED: 20,
  
  // Item settings
  ITEM_SIZE: 40,
  INITIAL_SPAWN_RATE: 2000, // Start slower
  MIN_SPAWN_RATE: 800,
  SPAWN_RATE_DECREASE: 50, // Gradual difficulty increase
  
  // Fall speeds (slower for easier gameplay)
  INITIAL_FALL_DURATION: 4000,
  MIN_FALL_DURATION: 2000,
  FALL_DURATION_DECREASE: 100,
};

// Calculate responsive game dimensions
const getGameDimensions = () => {
  const width = Math.min(screenWidth * 0.95, GAME_CONFIG.MAX_GAME_WIDTH);
  const height = Math.min(screenHeight * 0.85, GAME_CONFIG.MAX_GAME_HEIGHT);
  
  return {
    width: Math.max(width, GAME_CONFIG.MIN_GAME_WIDTH),
    height: Math.max(height, GAME_CONFIG.MIN_GAME_HEIGHT),
  };
};

// Simple MineCart component for web
const MineCart = ({ position, size }: { position: number; size: number }) => {
  return (
    <View style={[styles.mineCart, { 
      left: position - size / 2,
      width: size,
      height: size * 0.8
    }]}>
      <View style={styles.cartBody}>
        <View style={styles.cartTop}>
          <Text style={styles.cartIcon}>🛒</Text>
        </View>
        <View style={styles.cartWheels}>
          <View style={styles.wheel} />
          <View style={styles.wheel} />
        </View>
      </View>
      <View style={styles.cartGlow} />
    </View>
  );
};

// Enhanced Game Screen with proper sizing
function GameScreen({ navigation }: any) {
  const gameDimensions = getGameDimensions();
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [gameActive, setGameActive] = useState(false);
  const [cartPosition, setCartPosition] = useState(gameDimensions.width / 2);
  const [fallingItems, setFallingItems] = useState<any[]>([]);
  const [level, setLevel] = useState(1);
  const [lives, setLives] = useState(3);
  const [isPaused, setIsPaused] = useState(false);
  const [combo, setCombo] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [powerUps, setPowerUps] = useState({ shield: 0, magnet: 0, multiplier: 0 });

  const cartPan = useRef(new Animated.Value(cartPosition)).current;
  const gameLoopRef = useRef<any>(null);
  const itemIdCounter = useRef(0);
  const lastTouchRef = useRef<number | null>(null);
  const touchStartXRef = useRef<number | null>(null);
  const gameAreaRef = useRef<View>(null);

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

  // Touch/Mouse controls with boundary limits
  const handleTouchStart = (e: any) => {
    if (!gameActive || isPaused) return;
    
    const touch = e.nativeEvent.touches ? e.nativeEvent.touches[0] : e.nativeEvent;
    
    // Get relative position within game area
    if (gameAreaRef.current) {
      (gameAreaRef.current as any).measure((x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
        const relativeX = (touch.pageX || touch.clientX) - pageX;
        touchStartXRef.current = relativeX;
        lastTouchRef.current = relativeX;
      });
    }
  };

  const handleTouchMove = (e: any) => {
    if (!gameActive || isPaused || !touchStartXRef.current) return;
    
    const touch = e.nativeEvent.touches ? e.nativeEvent.touches[0] : e.nativeEvent;
    
    if (gameAreaRef.current) {
      (gameAreaRef.current as any).measure((x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
        const relativeX = (touch.pageX || touch.clientX) - pageX;
        
        if (lastTouchRef.current !== null) {
          const deltaX = relativeX - lastTouchRef.current;
          const newPosition = Math.max(
            GAME_CONFIG.CART_SIZE / 2, 
            Math.min(gameDimensions.width - GAME_CONFIG.CART_SIZE / 2, cartPosition + deltaX)
          );
          setCartPosition(newPosition);
          cartPan.setValue(newPosition);
        }
        
        lastTouchRef.current = relativeX;
      });
    }
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
        
        if (e.key === 'ArrowLeft') {
          const newPos = Math.max(GAME_CONFIG.CART_SIZE / 2, cartPosition - GAME_CONFIG.CART_SPEED);
          setCartPosition(newPos);
          cartPan.setValue(newPos);
        } else if (e.key === 'ArrowRight') {
          const newPos = Math.min(gameDimensions.width - GAME_CONFIG.CART_SIZE / 2, cartPosition + GAME_CONFIG.CART_SPEED);
          setCartPosition(newPos);
          cartPan.setValue(newPos);
        } else if (e.key === ' ') {
          e.preventDefault();
          setIsPaused(!isPaused);
        }
      };

      window.addEventListener('keydown', handleKeyPress);
      return () => window.removeEventListener('keydown', handleKeyPress);
    }
  }, [gameActive, isPaused, cartPosition, gameDimensions.width]);

  // Spawn falling items with balanced difficulty
  const spawnItem = useCallback(() => {
    const types = [
      { type: 'coin', emoji: '💰', value: 10, speed: 1, weight: 40 },
      { type: 'gem', emoji: '💎', value: 25, speed: 1.2, weight: 25 },
      { type: 'gold', emoji: '🏆', value: 50, speed: 1.5, weight: 10 },
      { type: 'powerup', emoji: '⭐', value: 0, speed: 1.3, weight: 5 },
      { type: 'heart', emoji: '❤️', value: 0, speed: 1.1, weight: 5 },
      { type: 'bomb', emoji: '💣', value: -20, speed: 0.9, weight: 15 },
    ];

    // Weighted random selection
    const totalWeight = types.reduce((sum, type) => sum + type.weight, 0);
    let random = Math.random() * totalWeight;
    let selectedType = types[0];
    
    for (const type of types) {
      random -= type.weight;
      if (random <= 0) {
        selectedType = type;
        break;
      }
    }

    const newItem = {
      id: itemIdCounter.current++,
      x: Math.random() * (gameDimensions.width - GAME_CONFIG.ITEM_SIZE),
      y: -50,
      ...selectedType,
      animation: new Animated.Value(-50),
    };

    setFallingItems(prev => [...prev, newItem]);

    // Calculate fall duration based on level
    const fallDuration = Math.max(
      GAME_CONFIG.MIN_FALL_DURATION,
      GAME_CONFIG.INITIAL_FALL_DURATION - (level - 1) * GAME_CONFIG.FALL_DURATION_DECREASE
    ) / newItem.speed;

    // Animate falling
    Animated.timing(newItem.animation, {
      toValue: gameDimensions.height,
      duration: fallDuration,
      useNativeDriver: false,
    }).start(() => {
      // Remove item when it reaches bottom
      setFallingItems(prev => prev.filter(item => item.id !== newItem.id));
      
      // Lose combo if it was a valuable item
      if (newItem.type !== 'bomb' && gameActive) {
        setCombo(0);
      }
    });

    return newItem;
  }, [level, gameActive, gameDimensions]);

  // Game loop with progressive difficulty
  useEffect(() => {
    if (gameActive && !isPaused) {
      const spawnRate = Math.max(
        GAME_CONFIG.MIN_SPAWN_RATE,
        GAME_CONFIG.INITIAL_SPAWN_RATE - (level - 1) * GAME_CONFIG.SPAWN_RATE_DECREASE
      );
      
      gameLoopRef.current = setInterval(() => {
        spawnItem();
      }, spawnRate);

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
        
        // Check if item is at cart level (with more forgiving collision box)
        if (itemY > gameDimensions.height - 120 && itemY < gameDimensions.height - 40) {
          // Check horizontal collision with larger hit box
          const cartLeft = cartPosition - GAME_CONFIG.CART_SIZE / 2 - 10;
          const cartRight = cartPosition + GAME_CONFIG.CART_SIZE / 2 + 10;
          const itemCenter = item.x + GAME_CONFIG.ITEM_SIZE / 2;
          
          if (itemCenter > cartLeft && itemCenter < cartRight) {
            handleItemCollection(item);
          }
        }
      });
    }, 50);

    return () => clearInterval(checkCollisions);
  }, [fallingItems, cartPosition, gameActive, isPaused, gameDimensions.height]);

  const handleItemCollection = (item: any) => {
    setFallingItems(prev => prev.filter(i => i.id !== item.id));
    
    if (item.type === 'bomb') {
      if (powerUps.shield > 0) {
        setPowerUps(prev => ({ ...prev, shield: prev.shield - 1 }));
      } else {
        setLives(prev => prev - 1);
        setCombo(0);
        if (lives <= 1) {
          endGame();
        }
      }
    } else if (item.type === 'heart') {
      setLives(prev => Math.min(prev + 1, 5));
    } else if (item.type === 'powerup') {
      const powerupTypes = ['shield', 'magnet', 'multiplier'];
      const randomPowerup = powerupTypes[Math.floor(Math.random() * powerupTypes.length)];
      setPowerUps(prev => ({ ...prev, [randomPowerup]: prev[randomPowerup as keyof typeof prev] + 1 }));
    } else {
      const multiplier = powerUps.multiplier > 0 ? 2 : 1;
      const comboBonus = combo > 0 ? Math.floor(item.value * (1 + combo * 0.1)) : item.value;
      setScore(prev => prev + comboBonus * multiplier);
      setCoins(prev => prev + 1);
      setCombo(prev => prev + 1);
      
      if (powerUps.multiplier > 0) {
        setPowerUps(prev => ({ ...prev, multiplier: prev.multiplier - 1 }));
      }
      
      // Level up every 200 points
      if ((score + item.value) >= level * 200) {
        setLevel(prev => prev + 1);
      }
    }
  };

  const startGame = () => {
    const dimensions = getGameDimensions();
    setGameActive(true);
    setScore(0);
    setCoins(0);
    setLevel(1);
    setLives(3);
    setCombo(0);
    setIsPaused(false);
    setFallingItems([]);
    setPowerUps({ shield: 0, magnet: 0, multiplier: 0 });
    setCartPosition(dimensions.width / 2);
    cartPan.setValue(dimensions.width / 2);
  };

  const endGame = async () => {
    setGameActive(false);
    setIsPaused(true);
    
    if (score > highScore) {
      await saveHighScore(score);
      Alert.alert('🎉 New High Score!', `Amazing! You scored ${score} points!`, [
        { text: 'OK', onPress: () => navigation.navigate('Home') }
      ]);
    } else {
      Alert.alert('Game Over', `You scored ${score} points!\nHigh Score: ${highScore}`, [
        { text: 'Try Again', onPress: startGame },
        { text: 'Home', onPress: () => navigation.navigate('Home') }
      ]);
    }
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.gameWrapper}>
        <View 
          style={[styles.gameContainer, { 
            width: gameDimensions.width,
            maxWidth: GAME_CONFIG.MAX_GAME_WIDTH
          }]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.statsRow}>
              <Text style={styles.statsText}>Score: {score}</Text>
              <Text style={styles.statsText}>Level: {level}</Text>
              <Text style={styles.statsText}>💰 × {coins}</Text>
            </View>
            <View style={styles.statsRow}>
              <Text style={styles.statsText}>{'❤️'.repeat(lives)}</Text>
              <Text style={styles.statsText}>Combo: ×{combo}</Text>
              <Text style={styles.statsText}>Best: {highScore}</Text>
            </View>
            {(powerUps.shield > 0 || powerUps.magnet > 0 || powerUps.multiplier > 0) && (
              <View style={styles.powerUpsRow}>
                {powerUps.shield > 0 && <Text style={styles.powerUpText}>🛡️×{powerUps.shield}</Text>}
                {powerUps.magnet > 0 && <Text style={styles.powerUpText}>🧲×{powerUps.magnet}</Text>}
                {powerUps.multiplier > 0 && <Text style={styles.powerUpText}>2️⃣×{powerUps.multiplier}</Text>}
              </View>
            )}
          </View>

          {/* Game Area */}
          <View 
            ref={gameAreaRef}
            style={[styles.gameArea, { 
              height: gameDimensions.height - 200,
              width: gameDimensions.width 
            }]}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleTouchStart}
            onMouseMove={handleTouchMove}
            onMouseUp={handleTouchEnd}
            onMouseLeave={handleTouchEnd}
          >
            {/* Background decoration */}
            <View style={styles.gameBackground}>
              <View style={styles.railTrack} />
            </View>

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

            {/* Cart/Pot */}
            <Animated.View
              style={[
                styles.cartContainer,
                {
                  transform: [{ translateX: cartPan }],
                  bottom: 20,
                }
              ]}
            >
              <MineCart position={0} size={GAME_CONFIG.CART_SIZE} />
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
                  ? '🖱️ Mouse/Touch: Drag to move | ⌨️ Arrow Keys: Move | Space: Pause'
                  : '👆 Touch and drag to move the cart'}
              </Text>
              <Text style={styles.instructionText}>
                Collect: 💰 Coins (+10) | 💎 Gems (+25) | 🏆 Gold (+50)
              </Text>
              <Text style={styles.instructionText}>
                Power-ups: ⭐ Random | ❤️ Extra Life | Avoid: 💣 Bombs
              </Text>
            </View>
          )}

          {isPaused && gameActive && (
            <View style={styles.pauseOverlay}>
              <Text style={styles.pauseText}>PAUSED</Text>
              <TouchableOpacity style={styles.resumeButton} onPress={togglePause}>
                <Text style={styles.buttonText}>Resume</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

// Home Screen
function HomeScreen({ navigation }: any) {
  const [highScore, setHighScore] = useState(0);
  const [totalCoins, setTotalCoins] = useState(0);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const savedHighScore = await AsyncStorage.getItem('highScore');
      const savedCoins = await AsyncStorage.getItem('totalCoins');
      if (savedHighScore) setHighScore(parseInt(savedHighScore));
      if (savedCoins) setTotalCoins(parseInt(savedCoins));
    } catch (error) {
      console.log('Error loading stats:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.menuContainer}>
          <View style={styles.logoContainer}>
            <Text style={styles.title}>🍯 Pot of Gold</Text>
            <Text style={styles.subtitle}>Catch the Gold Rush!</Text>
          </View>
          
          {highScore > 0 && (
            <View style={styles.statsCard}>
              <Text style={styles.statsTitle}>Your Stats</Text>
              <Text style={styles.highScoreText}>🏆 Best Score: {highScore}</Text>
              <Text style={styles.totalCoinsText}>💰 Total Coins: {totalCoins}</Text>
            </View>
          )}
          
          <View style={styles.menuButtons}>
            <TouchableOpacity 
              style={[styles.menuButton, styles.playButton]}
              onPress={() => navigation.navigate('Game')}
            >
              <Text style={styles.playButtonText}>▶️ Play Game</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.menuButton, styles.secondaryButton]}
              onPress={() => Alert.alert('Leaderboard', 'Coming soon! Compete with players worldwide!')}
            >
              <Text style={styles.menuButtonText}>📊 Leaderboard</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.menuButton, styles.secondaryButton]}
              onPress={() => Alert.alert('Shop', 'Coming soon! Unlock new carts and power-ups!')}
            >
              <Text style={styles.menuButtonText}>🛍️ Shop</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.menuButton, styles.secondaryButton]}
              onPress={() => Alert.alert('Settings', 'Coming soon! Customize your experience!')}
            >
              <Text style={styles.menuButtonText}>⚙️ Settings</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.platformInfo}>
            <Text style={styles.platformText}>
              Playing on {Platform.OS === 'web' ? 'Web Browser' : Platform.OS}
            </Text>
            <Text style={styles.versionText}>Version 2.0</Text>
          </View>
        </View>
      </ScrollView>
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
    }, 1500);

    console.log('Pot of Gold Web App Started');
    console.log('Platform:', Platform.OS);
    console.log('Screen:', screenWidth, 'x', screenHeight);
    console.log('Game area constrained to max', GAME_CONFIG.MAX_GAME_WIDTH, 'x', GAME_CONFIG.MAX_GAME_HEIGHT);
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <Text style={styles.loadingIcon}>🍯</Text>
          <Text style={styles.loadingText}>Pot of Gold</Text>
          <View style={styles.loadingBar}>
            <View style={styles.loadingProgress} />
          </View>
          <Text style={styles.loadingSubtext}>Loading adventure...</Text>
        </View>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: '#1a1a2e',
            elevation: 0,
            shadowOpacity: 0,
          },
          headerTintColor: '#FFD700',
          headerTitleStyle: {
            fontWeight: 'bold',
            fontSize: 20,
          },
        }}
      >
        <Stack.Screen 
          name="Home" 
          component={HomeScreen}
          options={{ 
            title: 'Pot of Gold',
            headerShown: false 
          }}
        />
        <Stack.Screen 
          name="Game" 
          component={GameScreen}
          options={{ 
            title: 'Play',
            headerShown: false
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f1f',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f0f1f',
  },
  loadingContent: {
    alignItems: 'center',
    padding: 30,
  },
  loadingIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 20,
  },
  loadingBar: {
    width: 200,
    height: 4,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  loadingProgress: {
    width: '60%',
    height: '100%',
    backgroundColor: '#FFD700',
  },
  loadingSubtext: {
    fontSize: 16,
    color: '#FFA500',
    marginTop: 10,
  },
  gameWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f0f1f',
  },
  gameContainer: {
    backgroundColor: '#1a1a2e',
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  menuContainer: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: screenHeight,
  },
  logoContainer: {
    marginBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 10,
    textAlign: 'center',
    textShadowColor: 'rgba(255, 215, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontSize: 22,
    color: '#FFA500',
    textAlign: 'center',
  },
  header: {
    padding: 15,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderBottomWidth: 2,
    borderBottomColor: '#FFD700',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 3,
  },
  statsText: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
  },
  powerUpsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 5,
    gap: 10,
  },
  powerUpText: {
    fontSize: 16,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  gameArea: {
    backgroundColor: '#16213e',
    position: 'relative',
    overflow: 'hidden',
  },
  gameBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  railTrack: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    height: 8,
    backgroundColor: '#444',
    borderTopWidth: 1,
    borderTopColor: '#666',
  },
  fallingItem: {
    position: 'absolute',
    width: GAME_CONFIG.ITEM_SIZE,
    height: GAME_CONFIG.ITEM_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemEmoji: {
    fontSize: 32,
  },
  cartContainer: {
    position: 'absolute',
    width: GAME_CONFIG.CART_SIZE,
    height: GAME_CONFIG.CART_SIZE,
  },
  mineCart: {
    position: 'absolute',
    bottom: 0,
  },
  cartBody: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  cartTop: {
    backgroundColor: '#8B4513',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#654321',
    height: '70%',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  cartIcon: {
    fontSize: 40,
  },
  cartWheels: {
    position: 'absolute',
    bottom: -5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 10,
  },
  wheel: {
    width: 16,
    height: 16,
    backgroundColor: '#333',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#666',
  },
  cartGlow: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
  },
  controls: {
    padding: 15,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  button: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderRadius: 25,
    elevation: 5,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  menuButtons: {
    width: '100%',
    maxWidth: 400,
    marginTop: 30,
  },
  menuButton: {
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 30,
    marginVertical: 8,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  playButton: {
    backgroundColor: '#FFD700',
    transform: [{ scale: 1.1 }],
  },
  playButtonText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  secondaryButton: {
    backgroundColor: '#2a2a4e',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  menuButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  instructions: {
    padding: 15,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  instructionText: {
    fontSize: 13,
    color: '#FFA500',
    textAlign: 'center',
    marginVertical: 2,
    lineHeight: 18,
  },
  pauseOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pauseText: {
    color: '#FFD700',
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  resumeButton: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 30,
    paddingVertical: 10,
    borderRadius: 20,
  },
  statsCard: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    padding: 20,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#FFD700',
    marginBottom: 20,
    alignItems: 'center',
  },
  statsTitle: {
    fontSize: 18,
    color: '#FFD700',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  highScoreText: {
    fontSize: 20,
    color: '#FFD700',
    marginBottom: 5,
  },
  totalCoinsText: {
    fontSize: 16,
    color: '#FFA500',
  },
  platformInfo: {
    position: 'absolute',
    bottom: 20,
    alignItems: 'center',
  },
  platformText: {
    color: '#666',
    fontSize: 12,
  },
  versionText: {
    color: '#555',
    fontSize: 10,
    marginTop: 2,
  },
});