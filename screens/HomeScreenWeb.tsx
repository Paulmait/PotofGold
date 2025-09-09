import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Animated,
  Image,
  Platform,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useGameContext } from '../context/GameContext';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../firebase/auth';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Web-optimized scaling
const getWebScale = () => {
  if (Platform.OS === 'web') {
    const baseWidth = 375;
    const scale = Math.min(screenWidth / baseWidth, 1.5);
    return scale;
  }
  return 1;
};

const webScale = getWebScale();
const scale = (size: number) => size * webScale;
const verticalScale = (size: number) => size * webScale;
const fontScale = (size: number) => size * webScale;

interface HomeScreenWebProps {
  navigation: any;
}

const HomeScreenWeb: React.FC<HomeScreenWebProps> = ({ navigation }) => {
  const { gameState } = useGameContext();
  const [isGuest, setIsGuest] = useState(true);
  const [userName, setUserName] = useState('Guest Player');
  const [guestHighScore, setGuestHighScore] = useState(0);
  const [guestCoins, setGuestCoins] = useState(0);
  
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.8);

  useEffect(() => {
    checkAuthStatus();
    loadGuestData();
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const checkAuthStatus = () => {
    const user = auth.currentUser;
    if (user) {
      setIsGuest(false);
      setUserName(user.displayName || user.email || 'Player');
    }
  };

  const loadGuestData = async () => {
    try {
      const highScore = await AsyncStorage.getItem('guest_high_score');
      const coins = await AsyncStorage.getItem('guest_coins');
      
      if (highScore) setGuestHighScore(parseInt(highScore, 10));
      if (coins) setGuestCoins(parseInt(coins, 10));
    } catch (error) {
      console.log('Error loading guest data:', error);
    }
  };

  const handlePlayPress = () => {
    console.log('Play button pressed - navigating to Game');
    navigation.navigate('Game');
  };

  const handleShopPress = () => {
    if (isGuest) {
      if (Platform.OS === 'web') {
        const goToShop = window.confirm(
          'Create an account to save your purchases and progress across devices!\n\nContinue as guest?'
        );
        if (goToShop) {
          navigation.navigate('Shop');
        } else {
          navigation.navigate('Auth');
        }
      } else {
        Alert.alert(
          'Sign Up Recommended',
          'Create an account to save your purchases and progress across devices!',
          [
            { text: 'Sign Up', onPress: () => navigation.navigate('Auth') },
            { text: 'Continue as Guest', onPress: () => navigation.navigate('Shop') },
          ]
        );
      }
    } else {
      navigation.navigate('Shop');
    }
  };

  const handleLeaderboardPress = () => {
    if (isGuest) {
      if (Platform.OS === 'web') {
        window.alert('You need an account to compete on the leaderboard!');
        navigation.navigate('Auth');
      } else {
        Alert.alert(
          'Sign Up Required',
          'You need an account to compete on the leaderboard!',
          [
            { text: 'Sign Up', onPress: () => navigation.navigate('Auth') },
            { text: 'Cancel', style: 'cancel' },
          ]
        );
      }
    } else {
      navigation.navigate('Leaderboard');
    }
  };

  const handleStatsPress = () => {
    navigation.navigate('Stats');
  };

  const handleSignUpPress = () => {
    navigation.navigate('Auth');
  };

  const handleHowToPlayPress = () => {
    navigation.navigate('HowToPlay');
  };

  return (
    <LinearGradient
      colors={['#1a1a2e', '#16213e', '#0f3460']}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <View style={styles.mainContent}>
        <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
          {/* Header */}
          <View style={styles.header}>
            <Image 
              source={require('../assets/images/pot_of_gold_logo.png')} 
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>Pot of Gold</Text>
            <Text style={styles.subtitle}>Catch the falling treasure!</Text>
            
            {/* User Status */}
            <View style={styles.userStatus}>
              <Ionicons 
                name={isGuest ? "person-outline" : "person"} 
                size={scale(20)} 
                color="#FFD700" 
              />
              <Text style={styles.userName}>{userName}</Text>
              {isGuest && (
                <TouchableOpacity onPress={handleSignUpPress} style={styles.signUpBadge}>
                  <Text style={styles.signUpBadgeText}>Sign Up</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Stats Cards */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Ionicons name="star" size={scale(24)} color="#FFD700" />
              <Text style={styles.statValue}>
                {isGuest ? guestHighScore.toLocaleString() : gameState.highScore.toLocaleString()}
              </Text>
              <Text style={styles.statLabel}>High Score</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="cash" size={scale(24)} color="#FFD700" />
              <Text style={styles.statValue}>
                {isGuest ? guestCoins.toLocaleString() : gameState.coins.toLocaleString()}
              </Text>
              <Text style={styles.statLabel}>Coins</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="trophy" size={scale(24)} color="#FFD700" />
              <Text style={styles.statValue}>{gameState.gamesPlayed}</Text>
              <Text style={styles.statLabel}>Games</Text>
            </View>
          </View>

          {/* Main Play Button - Made larger and more prominent */}
          <TouchableOpacity 
            style={styles.playButton} 
            onPress={handlePlayPress}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#FFD700', '#FFA500', '#FF8C00']}
              style={styles.playButtonGradient}
            >
              <Ionicons name="play" size={scale(40)} color="#FFF" />
              <Text style={styles.playButtonText}>PLAY NOW</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Menu Buttons */}
          <View style={styles.menuGrid}>
            <TouchableOpacity style={styles.menuButton} onPress={handleShopPress}>
              <Ionicons name="cart" size={scale(24)} color="#FFD700" />
              <Text style={styles.menuButtonText}>Shop</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuButton} onPress={handleLeaderboardPress}>
              <Ionicons name="podium" size={scale(24)} color="#FFD700" />
              <Text style={styles.menuButtonText}>Leaderboard</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuButton} onPress={handleStatsPress}>
              <Ionicons name="stats-chart" size={scale(24)} color="#FFD700" />
              <Text style={styles.menuButtonText}>Stats</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuButton} onPress={handleHowToPlayPress}>
              <Ionicons name="help-circle" size={scale(24)} color="#FFD700" />
              <Text style={styles.menuButtonText}>How to Play</Text>
            </TouchableOpacity>
          </View>

          {/* Guest Benefits - Compact for web */}
          {isGuest && (
            <View style={styles.guestBenefits}>
              <Text style={styles.benefitsTitle}>Playing as Guest</Text>
              <View style={styles.benefitsRow}>
                <Text style={styles.benefitsText}>✓ Full game access</Text>
                <Text style={styles.benefitsText}>✗ Progress not saved</Text>
              </View>
              
              <TouchableOpacity style={styles.signUpButton} onPress={handleSignUpPress}>
                <LinearGradient
                  colors={['#4CAF50', '#45a049']}
                  style={styles.signUpButtonGradient}
                >
                  <Text style={styles.signUpButtonText}>Sign Up to Save Progress</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 600 : '100%',
    alignSelf: 'center',
    paddingHorizontal: scale(20),
  },
  content: {
    width: '100%',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: verticalScale(20),
  },
  logo: {
    width: scale(80),
    height: scale(80),
    marginBottom: verticalScale(10),
  },
  title: {
    fontSize: fontScale(32),
    fontWeight: 'bold',
    color: '#FFD700',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
  },
  subtitle: {
    fontSize: fontScale(14),
    color: '#FFA500',
    marginTop: verticalScale(5),
  },
  userStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: verticalScale(10),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(6),
    borderRadius: scale(20),
  },
  userName: {
    color: '#FFF',
    fontSize: fontScale(13),
    marginLeft: scale(6),
  },
  signUpBadge: {
    marginLeft: scale(8),
    backgroundColor: '#4CAF50',
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(3),
    borderRadius: scale(10),
  },
  signUpBadgeText: {
    color: '#FFF',
    fontSize: fontScale(11),
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: verticalScale(20),
    gap: scale(10),
  },
  statCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: scale(12),
    padding: scale(12),
    alignItems: 'center',
    minWidth: scale(80),
  },
  statValue: {
    fontSize: fontScale(18),
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: verticalScale(4),
  },
  statLabel: {
    fontSize: fontScale(11),
    color: '#AAA',
    marginTop: verticalScale(2),
  },
  playButton: {
    marginBottom: verticalScale(20),
    width: '100%',
    maxWidth: scale(280),
  },
  playButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(18),
    paddingHorizontal: scale(30),
    borderRadius: scale(30),
    elevation: 5,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  playButtonText: {
    fontSize: fontScale(22),
    fontWeight: 'bold',
    color: '#FFF',
    marginLeft: scale(10),
    letterSpacing: 1,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: scale(10),
    marginBottom: verticalScale(15),
    width: '100%',
  },
  menuButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: scale(12),
    padding: scale(12),
    alignItems: 'center',
    minWidth: scale(100),
    flex: Platform.OS === 'web' ? 0 : 1,
    flexBasis: Platform.OS === 'web' ? 'auto' : '45%',
  },
  menuButtonText: {
    fontSize: fontScale(12),
    color: '#FFF',
    marginTop: verticalScale(4),
  },
  guestBenefits: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: scale(12),
    padding: scale(15),
    width: '100%',
    maxWidth: scale(400),
  },
  benefitsTitle: {
    fontSize: fontScale(16),
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: verticalScale(8),
    textAlign: 'center',
  },
  benefitsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: verticalScale(10),
  },
  benefitsText: {
    fontSize: fontScale(12),
    color: '#FFF',
  },
  signUpButton: {
    marginTop: verticalScale(10),
  },
  signUpButtonGradient: {
    padding: scale(12),
    borderRadius: scale(20),
    alignItems: 'center',
  },
  signUpButtonText: {
    fontSize: fontScale(14),
    fontWeight: 'bold',
    color: '#FFF',
  },
});

export default HomeScreenWeb;