import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Animated,
  Text,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

// Get screen dimensions
const { width: windowWidth, height: windowHeight } = Dimensions.get('window');

// Game viewport dimensions - contained size for better playability
const MAX_GAME_WIDTH = 450;
const MAX_GAME_HEIGHT = 700;

const gameWidth = Math.min(windowWidth, MAX_GAME_WIDTH);
const gameHeight = Math.min(windowHeight, MAX_GAME_HEIGHT);

// Calculate centering offsets for larger screens
const horizontalOffset = windowWidth > MAX_GAME_WIDTH ? (windowWidth - MAX_GAME_WIDTH) / 2 : 0;
const verticalOffset = windowHeight > MAX_GAME_HEIGHT ? (windowHeight - MAX_GAME_HEIGHT) / 2 : 0;

// Web-optimized scaling based on game viewport
const getWebScale = () => {
  if (Platform.OS === 'web') {
    const baseWidth = 375;
    const scale = Math.min(gameWidth / baseWidth, 1.2);
    return scale;
  }
  return 1;
};

const webScale = getWebScale();
const scale = (size: number) => size * webScale;
const verticalScale = (size: number) => size * webScale;
const fontScale = (size: number) => size * webScale;

interface GameScreenWebProps {
  navigation: any;
}

export default function GameScreenWeb({ navigation }: GameScreenWebProps) {
  // Game state
  const [isGameActive, setIsGameActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [lives, setLives] = useState(5);
  const [level, setLevel] = useState(1);
  const [showStartScreen, setShowStartScreen] = useState(true);
  
  // Cart state
  const [cartPosition, setCartPosition] = useState(gameWidth / 2 - scale(30));
  const cartSpeed = scale(12); // Increased speed for better control
  const cartSize = scale(60);
  
  // Falling items
  const [fallingItems, setFallingItems] = useState<any[]>([]);
  const itemSize = scale(30);
  const fallSpeed = verticalScale(3);
  
  // Animation refs
  const gameLoopRef = useRef<any>(null);
  const spawnTimerRef = useRef<any>(null);
  
  useEffect(() => {
    // Add keyboard controls for desktop
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isGameActive || isPaused) return;
      
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        moveCart('left');
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        moveCart('right');
      } else if (e.key === ' ' || e.key === 'Escape') {
        if (isPaused) {
          resumeGame();
        } else {
          pauseGame();
        }
      }
    };

    if (Platform.OS === 'web') {
      window.addEventListener('keydown', handleKeyPress);
    }

    return () => {
      // Cleanup on unmount
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
      if (spawnTimerRef.current) clearInterval(spawnTimerRef.current);
      if (Platform.OS === 'web') {
        window.removeEventListener('keydown', handleKeyPress);
      }
    };
  }, [isGameActive, isPaused]);

  const startGame = () => {
    setShowStartScreen(false);
    setIsGameActive(true);
    setScore(0);
    setLives(5);
    setLevel(1);
    setFallingItems([]);
    
    // Start spawning items
    spawnTimerRef.current = setInterval(spawnItem, 1500);
    
    // Start game loop
    gameLoop();
  };

  const spawnItem = () => {
    const types = ['gold', 'diamond', 'ruby', 'rock'];
    const randomType = types[Math.floor(Math.random() * types.length)];
    const randomX = Math.random() * (gameWidth - itemSize);
    
    setFallingItems(prev => [...prev, {
      id: Date.now() + Math.random(),
      type: randomType,
      x: randomX,
      y: -itemSize,
      value: randomType === 'gold' ? 10 : randomType === 'diamond' ? 50 : randomType === 'ruby' ? 30 : -10,
    }]);
  };

  const gameLoop = () => {
    if (!isGameActive) return;
    
    setFallingItems(prev => {
      return prev.map(item => ({
        ...item,
        y: item.y + fallSpeed,
      })).filter(item => {
        // Check collision with cart
        if (
          item.y + itemSize > gameHeight - scale(100) &&
          item.y < gameHeight - scale(70) &&
          item.x + itemSize > cartPosition &&
          item.x < cartPosition + cartSize
        ) {
          // Collected item
          if (item.type !== 'rock') {
            setScore(s => s + item.value);
            setCoins(c => c + (item.type === 'gold' ? 1 : 0));
          } else {
            setLives(l => Math.max(0, l - 1));
          }
          return false;
        }
        
        // Remove items that fell off screen
        return item.y < gameHeight;
      });
    });
    
    gameLoopRef.current = requestAnimationFrame(gameLoop);
  };

  const moveCart = (direction: 'left' | 'right') => {
    setCartPosition(prev => {
      const newPos = direction === 'left' ? prev - cartSpeed : prev + cartSpeed;
      return Math.max(0, Math.min(gameWidth - cartSize, newPos));
    });
  };

  const handleTouch = (e: any) => {
    if (!isGameActive || isPaused) return;
    
    // Get touch position relative to game container
    const touchX = (e.nativeEvent.locationX || e.nativeEvent.pageX) - horizontalOffset;
    const screenCenter = gameWidth / 2;
    
    if (touchX < screenCenter) {
      moveCart('left');
    } else {
      moveCart('right');
    }
  };

  const pauseGame = () => {
    setIsPaused(true);
    if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    if (spawnTimerRef.current) clearInterval(spawnTimerRef.current);
  };

  const resumeGame = () => {
    setIsPaused(false);
    spawnTimerRef.current = setInterval(spawnItem, 1500);
    gameLoop();
  };

  const endGame = async () => {
    setIsGameActive(false);
    if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    if (spawnTimerRef.current) clearInterval(spawnTimerRef.current);
    
    // Save high score
    try {
      const highScore = await AsyncStorage.getItem('guest_high_score');
      if (!highScore || score > parseInt(highScore, 10)) {
        await AsyncStorage.setItem('guest_high_score', score.toString());
      }
      await AsyncStorage.setItem('guest_coins', coins.toString());
    } catch (error) {
      console.error('Error saving score:', error);
    }
    
    navigation.navigate('Home');
  };

  useEffect(() => {
    if (lives <= 0 && isGameActive) {
      endGame();
    }
  }, [lives]);

  if (showStartScreen) {
    return (
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f3460']}
        style={styles.container}
      >
        <View style={styles.startScreen}>
          <Text style={styles.title}>Pot of Gold</Text>
          <Text style={styles.subtitle}>Catch the treasures, avoid the rocks!</Text>
          
          <TouchableOpacity style={styles.startButton} onPress={startGame}>
            <LinearGradient
              colors={['#FFD700', '#FFA500']}
              style={styles.startButtonGradient}
            >
              <Text style={styles.startButtonText}>START GAME</Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('Home')}>
            <Text style={styles.backButtonText}>Back to Menu</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  return (
    <View style={styles.outerContainer}>
      <View style={[styles.gameContainer, { width: gameWidth, height: gameHeight }]} onTouchStart={handleTouch}>
        <LinearGradient
          colors={['#87CEEB', '#4682B4', '#1E90FF']}
          style={styles.skyBackground}
        />
      
      {/* Game HUD */}
      <View style={styles.hud}>
        <View style={styles.hudItem}>
          <Ionicons name="star" size={scale(20)} color="#FFD700" />
          <Text style={styles.hudText}>{score}</Text>
        </View>
        <View style={styles.hudItem}>
          <Ionicons name="cash" size={scale(20)} color="#FFD700" />
          <Text style={styles.hudText}>{coins}</Text>
        </View>
        <View style={styles.hudItem}>
          <Ionicons name="heart" size={scale(20)} color="#FF6B6B" />
          <Text style={styles.hudText}>{lives}</Text>
        </View>
        <TouchableOpacity 
          style={styles.pauseButton} 
          onPress={isPaused ? resumeGame : pauseGame}
        >
          <Ionicons 
            name={isPaused ? "play" : "pause"} 
            size={scale(24)} 
            color="#FFF" 
          />
        </TouchableOpacity>
      </View>
      
      {/* Falling Items */}
      {fallingItems.map(item => (
        <View
          key={item.id}
          style={[
            styles.fallingItem,
            {
              left: item.x,
              top: item.y,
              width: itemSize,
              height: itemSize,
              backgroundColor: 
                item.type === 'gold' ? '#FFD700' :
                item.type === 'diamond' ? '#B9F2FF' :
                item.type === 'ruby' ? '#DC143C' :
                '#808080',
            },
          ]}
        />
      ))}
      
      {/* Cart */}
      <View
        style={[
          styles.cart,
          {
            left: cartPosition,
            width: cartSize,
            height: scale(40),
          },
        ]}
      >
        <Text style={styles.cartEmoji}>🛒</Text>
      </View>
      
      {/* Ground */}
      <View style={styles.ground} />
      
      {/* Pause Overlay */}
      {isPaused && (
        <View style={styles.pauseOverlay}>
          <View style={styles.pauseModal}>
            <Text style={styles.pauseTitle}>Game Paused</Text>
            <TouchableOpacity style={styles.resumeButton} onPress={resumeGame}>
              <Text style={styles.resumeButtonText}>Resume</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quitButton} onPress={endGame}>
              <Text style={styles.quitButtonText}>Quit Game</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      
        {/* Touch Indicators */}
        <View style={styles.touchIndicators}>
          <View style={[styles.touchZone, styles.leftZone]}>
            <Ionicons name="arrow-back" size={scale(30)} color="rgba(255,255,255,0.3)" />
          </View>
          <View style={[styles.touchZone, styles.rightZone]}>
            <Ionicons name="arrow-forward" size={scale(30)} color="rgba(255,255,255,0.3)" />
          </View>
        </View>
      </View>
      
      {/* Game Instructions - Outside game viewport */}
      {isGameActive && !isPaused && (
        <View style={styles.instructions}>
          <Text style={styles.instructionText}>
            {Platform.OS === 'web' 
              ? '⌨️ Arrow Keys or A/D to move • Space/Esc to pause • 🖱️ Click sides to move'
              : 'Tap left or right side to move cart'}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gameContainer: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: scale(20),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
    backgroundColor: '#000',
  },
  skyBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  startScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: scale(20),
  },
  title: {
    fontSize: fontScale(48),
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: verticalScale(10),
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
  },
  subtitle: {
    fontSize: fontScale(18),
    color: '#FFF',
    marginBottom: verticalScale(40),
  },
  startButton: {
    marginBottom: verticalScale(20),
  },
  startButtonGradient: {
    paddingVertical: verticalScale(15),
    paddingHorizontal: scale(40),
    borderRadius: scale(30),
  },
  startButtonText: {
    fontSize: fontScale(20),
    fontWeight: 'bold',
    color: '#FFF',
  },
  backButton: {
    padding: scale(10),
  },
  backButtonText: {
    fontSize: fontScale(16),
    color: '#AAA',
  },
  hud: {
    position: 'absolute',
    top: verticalScale(40),
    left: scale(20),
    right: scale(20),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 100,
  },
  hudItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(5),
    borderRadius: scale(15),
  },
  hudText: {
    color: '#FFF',
    fontSize: fontScale(16),
    fontWeight: 'bold',
    marginLeft: scale(5),
  },
  pauseButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: scale(10),
    borderRadius: scale(20),
  },
  fallingItem: {
    position: 'absolute',
    borderRadius: scale(5),
  },
  cart: {
    position: 'absolute',
    bottom: scale(60),
    backgroundColor: '#8B4513',
    borderRadius: scale(10),
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartEmoji: {
    fontSize: fontScale(30),
  },
  ground: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: scale(60),
    backgroundColor: '#654321',
  },
  pauseOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 200,
  },
  pauseModal: {
    backgroundColor: '#2a2a3e',
    padding: scale(30),
    borderRadius: scale(20),
    alignItems: 'center',
  },
  pauseTitle: {
    fontSize: fontScale(24),
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: verticalScale(20),
  },
  resumeButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(30),
    borderRadius: scale(20),
    marginBottom: verticalScale(10),
  },
  resumeButtonText: {
    color: '#FFF',
    fontSize: fontScale(16),
    fontWeight: 'bold',
  },
  quitButton: {
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(30),
  },
  quitButtonText: {
    color: '#FF6B6B',
    fontSize: fontScale(16),
  },
  touchIndicators: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    pointerEvents: 'none',
  },
  touchZone: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  leftZone: {
    alignItems: 'flex-start',
    paddingLeft: scale(20),
  },
  rightZone: {
    alignItems: 'flex-end',
    paddingRight: scale(20),
  },
  instructions: {
    position: 'absolute',
    bottom: scale(20),
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: scale(20),
    paddingVertical: scale(10),
    borderRadius: scale(20),
  },
  instructionText: {
    color: '#FFF',
    fontSize: fontScale(14),
    textAlign: 'center',
  },
});