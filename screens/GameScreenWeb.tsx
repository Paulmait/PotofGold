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
import MiningCart from '../components/MiningCart';

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
  const [cartSkin, setCartSkin] = useState<'default' | 'golden' | 'diamond' | 'emerald' | 'ruby'>('default');
  const [isCartMoving, setIsCartMoving] = useState(false);
  
  // Cart state
  const [cartPosition, setCartPosition] = useState(gameWidth / 2 - scale(35));
  const cartSpeed = scale(20); // Much faster for mobile
  const cartSize = scale(70); // Slightly larger for mining cart
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [isTouching, setIsTouching] = useState(false);
  const [moveDirection, setMoveDirection] = useState<'left' | 'right' | null>(null);
  
  // Falling items
  const [fallingItems, setFallingItems] = useState<any[]>([]);
  const itemSize = scale(30);
  const fallSpeed = verticalScale(3);
  
  // Animation refs
  const gameLoopRef = useRef<any>(null);
  const spawnTimerRef = useRef<any>(null);
  
  // Load saved cart skin
  useEffect(() => {
    loadCartSkin();
  }, []);

  const loadCartSkin = async () => {
    try {
      const savedSkin = await AsyncStorage.getItem('selected_cart_skin');
      if (savedSkin) {
        setCartSkin(savedSkin as any);
      }
    } catch (error) {
      console.error('Error loading cart skin:', error);
    }
  };

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
    setScore(0);
    setLives(5);
    setLevel(1);
    setFallingItems([]);
    setIsGameActive(true); // Set this last to trigger the useEffect
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

  const gameLoop = useCallback(() => {
    setFallingItems(prev => {
      return prev.map(item => ({
        ...item,
        y: item.y + fallSpeed,
      })).filter(item => {
        // Check collision with cart (adjusted for mining cart height)
        if (
          item.y + itemSize > gameHeight - scale(110) &&
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
    
    if (isGameActive && !isPaused) {
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    }
  }, [isGameActive, isPaused, cartPosition, gameHeight, itemSize, cartSize, fallSpeed]);

  const moveCart = (direction: 'left' | 'right', continuous = false) => {
    setIsCartMoving(true);
    const speed = continuous ? cartSpeed / 2 : cartSpeed; // Slightly slower for continuous
    setCartPosition(prev => {
      const newPos = direction === 'left' ? prev - speed : prev + speed;
      return Math.max(0, Math.min(gameWidth - cartSize, newPos));
    });
    if (!continuous) {
      setTimeout(() => setIsCartMoving(false), 150);
    }
  };

  // Move cart to specific position (for touch/drag)
  const moveCartToPosition = (targetX: number) => {
    setIsCartMoving(true);
    const clampedX = Math.max(0, Math.min(gameWidth - cartSize, targetX - cartSize / 2));
    setCartPosition(clampedX);
    setTimeout(() => setIsCartMoving(false), 100);
  };

  // Touch handlers for better mobile control
  const handleTouchStart = (e: any) => {
    if (!isGameActive || isPaused) return;
    
    const touch = e.nativeEvent.touches?.[0] || e.nativeEvent;
    const touchX = (touch.locationX || touch.pageX) - horizontalOffset;
    
    setTouchStartX(touchX);
    setIsTouching(true);
    
    // Move cart towards touch position
    moveCartToPosition(touchX);
  };

  const handleTouchMove = (e: any) => {
    if (!isGameActive || isPaused || !isTouching) return;
    
    const touch = e.nativeEvent.touches?.[0] || e.nativeEvent;
    const touchX = (touch.locationX || touch.pageX) - horizontalOffset;
    
    // Direct cart movement to follow finger
    moveCartToPosition(touchX);
  };

  const handleTouchEnd = () => {
    setIsTouching(false);
    setTouchStartX(null);
    setMoveDirection(null);
    setIsCartMoving(false);
  };

  // For desktop click
  const handleClick = (e: any) => {
    if (!isGameActive || isPaused || Platform.OS !== 'web') return;
    
    const clickX = (e.nativeEvent.locationX || e.nativeEvent.pageX) - horizontalOffset;
    const screenCenter = gameWidth / 2;
    
    if (clickX < screenCenter) {
      moveCart('left');
    } else {
      moveCart('right');
    }
  };

  const pauseGame = () => {
    setIsPaused(true);
  };

  const resumeGame = () => {
    setIsPaused(false);
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

  // Level progression based on score
  useEffect(() => {
    const newLevel = Math.floor(score / 100) + 1;
    if (newLevel > level) {
      setLevel(newLevel);
    }
  }, [score]);

  // Continuous movement for touch hold
  useEffect(() => {
    if (moveDirection && isTouching && isGameActive && !isPaused) {
      const moveInterval = setInterval(() => {
        moveCart(moveDirection, true);
      }, 50);
      return () => clearInterval(moveInterval);
    }
  }, [moveDirection, isTouching, isGameActive, isPaused]);

  // Game loop management
  useEffect(() => {
    if (isGameActive && !isPaused) {
      // Start spawning items
      spawnTimerRef.current = setInterval(spawnItem, 1500);
      
      // Start game loop
      gameLoop();
    } else {
      // Stop spawning
      if (spawnTimerRef.current) {
        clearInterval(spawnTimerRef.current);
      }
      // Stop game loop
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    }
    
    return () => {
      if (spawnTimerRef.current) clearInterval(spawnTimerRef.current);
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [isGameActive, isPaused, gameLoop]);

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
      <View 
        style={[styles.gameContainer, { width: gameWidth, height: gameHeight }]} 
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleClick}
      >
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
            },
          ]}
        >
          {item.type === 'gold' && (
            <View style={styles.goldCoin}>
              <View style={styles.goldInner}>
                <Text style={styles.goldText}>$</Text>
              </View>
              <View style={styles.goldShine} />
            </View>
          )}
          {item.type === 'diamond' && (
            <View style={styles.diamond}>
              <View style={styles.diamondTop} />
              <View style={styles.diamondBottom} />
              <View style={styles.diamondShine} />
            </View>
          )}
          {item.type === 'ruby' && (
            <View style={styles.ruby}>
              <View style={styles.rubyTop} />
              <View style={styles.rubyMiddle} />
              <View style={styles.rubyBottom} />
            </View>
          )}
          {item.type === 'rock' && (
            <View style={styles.rock}>
              <View style={styles.rockLayer1} />
              <View style={styles.rockLayer2} />
              <View style={styles.rockCrack} />
            </View>
          )}
        </View>
      ))}
      
      {/* Mining Cart */}
      <View
        style={[
          styles.cartContainer,
          {
            left: cartPosition,
            bottom: scale(60),
          },
        ]}
      >
        <MiningCart
          position={0}
          size={cartSize}
          skin={cartSkin}
          isMoving={isCartMoving}
          level={Math.min(level, 5)}
        />
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
      
        {/* Touch Indicator - Show drag hint on mobile */}
        {Platform.OS !== 'web' && isGameActive && !isPaused && (
          <View style={styles.mobileHint}>
            <Ionicons name="hand-left" size={scale(25)} color="rgba(255,255,255,0.5)" />
            <Text style={styles.mobileHintText}>Drag to move</Text>
          </View>
        )}
      </View>
      
      {/* Game Instructions - Outside game viewport */}
      {isGameActive && !isPaused && (
        <View style={styles.instructions}>
          <Text style={styles.instructionText}>
            {Platform.OS === 'web' 
              ? '⌨️ Arrow Keys or A/D to move • Space/Esc to pause • 🖱️ Click or drag to move'
              : 'Touch and drag to move cart • Cart follows your finger'}
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
  },
  // Gold coin styles
  goldCoin: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: scale(15),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: scale(2),
    borderColor: '#FFA500',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  goldInner: {
    width: '80%',
    height: '80%',
    backgroundColor: '#FFC700',
    borderRadius: scale(12),
    justifyContent: 'center',
    alignItems: 'center',
  },
  goldText: {
    fontSize: fontScale(16),
    fontWeight: 'bold',
    color: '#B8860B',
  },
  goldShine: {
    position: 'absolute',
    top: scale(3),
    right: scale(5),
    width: scale(6),
    height: scale(6),
    backgroundColor: '#FFF',
    borderRadius: scale(3),
    opacity: 0.8,
  },
  // Diamond styles
  diamond: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  diamondTop: {
    width: 0,
    height: 0,
    borderLeftWidth: scale(15),
    borderRightWidth: scale(15),
    borderBottomWidth: scale(10),
    borderStyle: 'solid',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#B9F2FF',
    position: 'absolute',
    top: 0,
  },
  diamondBottom: {
    width: 0,
    height: 0,
    borderLeftWidth: scale(15),
    borderRightWidth: scale(15),
    borderTopWidth: scale(20),
    borderStyle: 'solid',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#87CEEB',
    position: 'absolute',
    bottom: 0,
  },
  diamondShine: {
    position: 'absolute',
    top: scale(8),
    width: scale(4),
    height: scale(4),
    backgroundColor: '#FFF',
    borderRadius: scale(2),
    opacity: 0.9,
  },
  // Ruby styles
  ruby: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rubyTop: {
    width: scale(25),
    height: scale(8),
    backgroundColor: '#DC143C',
    position: 'absolute',
    top: scale(2),
  },
  rubyMiddle: {
    width: scale(28),
    height: scale(14),
    backgroundColor: '#E0115F',
    borderRadius: scale(3),
  },
  rubyBottom: {
    width: scale(20),
    height: scale(8),
    backgroundColor: '#8B0000',
    position: 'absolute',
    bottom: scale(2),
    borderRadius: scale(2),
  },
  // Rock styles
  rock: {
    width: '100%',
    height: '100%',
    backgroundColor: '#696969',
    borderRadius: scale(8),
    overflow: 'hidden',
  },
  rockLayer1: {
    position: 'absolute',
    width: '100%',
    height: '40%',
    backgroundColor: '#808080',
    top: 0,
  },
  rockLayer2: {
    position: 'absolute',
    width: '70%',
    height: '30%',
    backgroundColor: '#A9A9A9',
    bottom: scale(5),
    left: scale(5),
    borderRadius: scale(3),
  },
  rockCrack: {
    position: 'absolute',
    width: scale(2),
    height: '60%',
    backgroundColor: '#2C2C2C',
    top: '20%',
    left: '45%',
    transform: [{ rotate: '15deg' }],
  },
  cartContainer: {
    position: 'absolute',
    zIndex: 10,
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
  mobileHint: {
    position: 'absolute',
    bottom: scale(120),
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: scale(15),
    paddingVertical: scale(8),
    borderRadius: scale(20),
  },
  mobileHintText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: fontScale(12),
    marginLeft: scale(8),
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