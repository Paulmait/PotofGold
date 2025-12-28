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
  ScrollView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useGameContext } from '../context/GameContext';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../firebase/auth';
import { fontScale, scale, verticalScale, getResponsiveLayout } from '../utils/responsive';

const { width, height } = Dimensions.get('window');
const layout = getResponsiveLayout();

interface HomeScreenGuestProps {
  navigation: any;
}

const HomeScreenGuest: React.FC<HomeScreenGuestProps> = ({ navigation }) => {
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
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    navigation.navigate('Game', { autoStart: true });
  };

  const handleShopPress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    if (isGuest) {
      Alert.alert(
        'Sign Up Recommended',
        'Create an account to save your purchases and progress across devices!',
        [
          { text: 'Sign Up', onPress: () => navigation.navigate('Auth') },
          { text: 'Continue as Guest', onPress: () => navigation.navigate('Shop') },
        ]
      );
    } else {
      navigation.navigate('Shop');
    }
  };

  const handleLeaderboardPress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    if (isGuest) {
      Alert.alert(
        'Sign Up Required',
        'You need an account to compete on the leaderboard!',
        [
          { text: 'Sign Up', onPress: () => navigation.navigate('Auth') },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    } else {
      navigation.navigate('Leaderboard');
    }
  };

  const handleStatsPress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    if (isGuest) {
      Alert.alert(
        'Limited Stats',
        'Sign up to track all your statistics and achievements!',
        [
          { text: 'Sign Up', onPress: () => navigation.navigate('Auth') },
          { text: 'View Basic Stats', onPress: () => navigation.navigate('Stats') },
        ]
      );
    } else {
      navigation.navigate('Stats');
    }
  };

  const handleSignUpPress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.navigate('Auth');
  };

  const handleHowToPlayPress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.navigate('HowToPlay');
  };

  return (
    <LinearGradient
      colors={['#1a1a2e', '#16213e', '#0f3460']}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={Platform.OS === 'web'} 
        bounces={false}
        overScrollMode="never"
      >
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
                size={Platform.OS === 'web' ? 18 : scale(20)} 
                color="#FFD700" 
              />
              <Text style={styles.userName}>{userName}</Text>
              {isGuest && (
                <TouchableOpacity
                  onPress={handleSignUpPress}
                  style={styles.signUpBadge}
                  accessibilityLabel="Sign up for an account"
                  accessibilityRole="button"
                >
                  <Text style={styles.signUpBadgeText}>Sign Up</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Stats Cards */}
          <View style={styles.statsContainer} accessible={true} accessibilityRole="summary">
            <View style={styles.statCard} accessible={true} accessibilityLabel={`High Score: ${isGuest ? guestHighScore.toLocaleString() : gameState.highScore.toLocaleString()}`}>
              <Ionicons name="star" size={Platform.OS === 'web' ? 20 : scale(24)} color="#FFD700" />
              <Text style={styles.statValue}>
                {isGuest ? guestHighScore.toLocaleString() : gameState.highScore.toLocaleString()}
              </Text>
              <Text style={styles.statLabel}>High Score</Text>
            </View>
            <View style={styles.statCard} accessible={true} accessibilityLabel={`Coins: ${isGuest ? guestCoins.toLocaleString() : gameState.coins.toLocaleString()}${isGuest ? ', not saved' : ''}`}>
              <Ionicons name="cash" size={Platform.OS === 'web' ? 20 : scale(24)} color="#FFD700" />
              <Text style={styles.statValue}>
                {isGuest ? guestCoins.toLocaleString() : gameState.coins.toLocaleString()}
              </Text>
              <Text style={styles.statLabel}>Coins</Text>
              {isGuest && <Text style={styles.guestWarning}>Not Saved</Text>}
            </View>
            <View style={styles.statCard} accessible={true} accessibilityLabel={`Games played: ${gameState.gamesPlayed}`}>
              <Ionicons name="trophy" size={Platform.OS === 'web' ? 20 : scale(24)} color="#FFD700" />
              <Text style={styles.statValue}>{gameState.gamesPlayed}</Text>
              <Text style={styles.statLabel}>Games</Text>
            </View>
          </View>

          {/* Main Play Button */}
          <TouchableOpacity
            style={styles.playButton}
            onPress={handlePlayPress}
            accessibilityLabel="Play game"
            accessibilityHint="Starts a new game"
            accessibilityRole="button"
          >
            <LinearGradient
              colors={['#FFD700', '#FFA500', '#FF8C00']}
              style={styles.playButtonGradient}
            >
              <Ionicons name="play" size={Platform.OS === 'web' ? 28 : scale(32)} color="#FFF" />
              <Text style={styles.playButtonText}>PLAY</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Menu Buttons */}
          <View style={styles.menuGrid}>
            <TouchableOpacity
              style={styles.menuButton}
              onPress={handleShopPress}
              accessibilityLabel="Shop"
              accessibilityHint="Opens the in-game shop"
              accessibilityRole="button"
            >
              <Ionicons name="cart" size={Platform.OS === 'web' ? 24 : scale(24)} color="#FFD700" />
              <Text style={styles.menuButtonText}>Shop</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuButton}
              onPress={handleLeaderboardPress}
              accessibilityLabel="Leaderboard"
              accessibilityHint="View global leaderboard rankings"
              accessibilityRole="button"
            >
              <Ionicons name="podium" size={Platform.OS === 'web' ? 24 : scale(24)} color="#FFD700" />
              <Text style={styles.menuButtonText}>Leaderboard</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuButton}
              onPress={handleStatsPress}
              accessibilityLabel="Statistics"
              accessibilityHint="View your game statistics"
              accessibilityRole="button"
            >
              <Ionicons name="stats-chart" size={Platform.OS === 'web' ? 24 : scale(24)} color="#FFD700" />
              <Text style={styles.menuButtonText}>Stats</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuButton}
              onPress={handleHowToPlayPress}
              accessibilityLabel="How to Play"
              accessibilityHint="Learn how to play the game"
              accessibilityRole="button"
            >
              <Ionicons name="help-circle" size={Platform.OS === 'web' ? 24 : scale(24)} color="#FFD700" />
              <Text style={styles.menuButtonText}>How to Play</Text>
            </TouchableOpacity>
          </View>

          {/* Guest Benefits */}
          {isGuest && (
            <View style={styles.guestBenefits}>
              <Text style={styles.benefitsTitle}>🎮 Playing as Guest</Text>
              <Text style={styles.benefitsText}>✓ Full game access</Text>
              <Text style={styles.benefitsText}>✓ All power-ups available</Text>
              <Text style={styles.benefitsText}>✗ Progress not saved</Text>
              <Text style={styles.benefitsText}>✗ No leaderboard access</Text>
              
              <TouchableOpacity
                style={styles.signUpButton}
                onPress={handleSignUpPress}
                accessibilityLabel="Sign up to save progress"
                accessibilityHint="Creates an account to save your game progress"
                accessibilityRole="button"
              >
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
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    ...Platform.select({
      web: {
        height: '100vh',
        overflow: 'auto',
      },
      default: {},
    }),
  },
  scrollContent: {
    flexGrow: 1,
    // Center content on larger screens
    ...Platform.select({
      web: {
        maxWidth: 800,
        width: '100%',
        alignSelf: 'center',
      },
      default: {},
    }),
  },
  content: {
    flex: 1,
    padding: Platform.OS === 'web' ? 15 : scale(20),
    paddingTop: Platform.OS === 'web' ? 20 : (Platform.OS === 'ios' ? scale(60) : scale(40)),
    // Ensure content is visible on all screen sizes
    minHeight: Platform.OS === 'web' ? 'auto' : '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: Platform.OS === 'web' ? 20 : verticalScale(30),
  },
  logo: {
    width: Platform.OS === 'web' ? 80 : scale(100),
    height: Platform.OS === 'web' ? 80 : scale(100),
    marginBottom: Platform.OS === 'web' ? 8 : verticalScale(10),
  },
  title: {
    fontSize: Platform.OS === 'web' ? 28 : fontScale(36),
    fontWeight: 'bold',
    color: '#FFD700',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
  },
  subtitle: {
    fontSize: Platform.OS === 'web' ? 14 : fontScale(16),
    color: '#FFA500',
    marginTop: Platform.OS === 'web' ? 4 : verticalScale(5),
  },
  userStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: verticalScale(15),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: scale(15),
    paddingVertical: verticalScale(8),
    borderRadius: scale(20),
  },
  userName: {
    color: '#FFF',
    fontSize: fontScale(14),
    marginLeft: scale(8),
  },
  signUpBadge: {
    marginLeft: scale(10),
    backgroundColor: '#4CAF50',
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(4),
    borderRadius: scale(12),
  },
  signUpBadgeText: {
    color: '#FFF',
    fontSize: fontScale(12),
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Platform.OS === 'web' ? 20 : verticalScale(30),
  },
  statCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: Platform.OS === 'web' ? 12 : scale(15),
    padding: Platform.OS === 'web' ? 12 : scale(15),
    alignItems: 'center',
    minWidth: Platform.OS === 'web' ? 80 : scale(90),
  },
  statValue: {
    fontSize: Platform.OS === 'web' ? 18 : fontScale(20),
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: Platform.OS === 'web' ? 4 : verticalScale(5),
  },
  statLabel: {
    fontSize: Platform.OS === 'web' ? 12 : fontScale(12),
    color: '#AAA',
    marginTop: Platform.OS === 'web' ? 2 : verticalScale(2),
  },
  guestWarning: {
    fontSize: fontScale(10),
    color: '#FF6B6B',
    marginTop: verticalScale(2),
  },
  playButton: {
    marginBottom: Platform.OS === 'web' ? 20 : verticalScale(30),
    // Center and limit width on desktop
    ...Platform.select({
      web: {
        maxWidth: 250,
        alignSelf: 'center',
        width: '100%',
      },
      default: {},
    }),
  },
  playButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Platform.OS === 'web' ? 15 : scale(20),
    borderRadius: Platform.OS === 'web' ? 25 : scale(30),
    // Add hover effect for desktop
    ...Platform.select({
      web: {
        cursor: 'pointer' as any,
        transition: 'transform 0.2s ease' as any,
      },
      default: {},
    }),
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  playButtonText: {
    fontSize: Platform.OS === 'web' ? 20 : fontScale(24),
    fontWeight: 'bold',
    color: '#FFF',
    marginLeft: Platform.OS === 'web' ? 8 : scale(10),
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: verticalScale(20),
    // Better layout on desktop
    ...Platform.select({
      web: {
        maxWidth: 600,
        alignSelf: 'center',
        width: '100%',
      },
      default: {},
    }),
  },
  menuButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: Platform.OS === 'web' ? 12 : scale(15),
    padding: Platform.OS === 'web' ? 15 : scale(15),
    alignItems: 'center',
    width: Platform.OS === 'web' && width >= 768 ? '23%' : '48%',
    marginBottom: Platform.OS === 'web' ? 12 : verticalScale(10),
    // Better hover effect for desktop
    ...Platform.select({
      web: {
        cursor: 'pointer' as any,
        transition: 'all 0.3s ease' as any,
        '&:hover': {
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
          transform: 'scale(1.05)',
        } as any,
      },
      default: {},
    }),
  },
  menuButtonText: {
    fontSize: Platform.OS === 'web' ? 14 : fontScale(14),
    color: '#FFF',
    marginTop: Platform.OS === 'web' ? 6 : verticalScale(5),
  },
  guestBenefits: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: scale(15),
    padding: scale(20),
    marginTop: verticalScale(10),
  },
  benefitsTitle: {
    fontSize: fontScale(18),
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: verticalScale(10),
  },
  benefitsText: {
    fontSize: fontScale(14),
    color: '#FFF',
    marginBottom: verticalScale(5),
  },
  signUpButton: {
    marginTop: verticalScale(15),
  },
  signUpButtonGradient: {
    padding: scale(15),
    borderRadius: scale(25),
    alignItems: 'center',
  },
  signUpButtonText: {
    fontSize: fontScale(16),
    fontWeight: 'bold',
    color: '#FFF',
  },
});

export default HomeScreenGuest;