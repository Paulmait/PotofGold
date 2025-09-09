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
    navigation.navigate('Game');
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
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
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
              {isGuest && <Text style={styles.guestWarning}>Not Saved</Text>}
            </View>
            <View style={styles.statCard}>
              <Ionicons name="trophy" size={scale(24)} color="#FFD700" />
              <Text style={styles.statValue}>{gameState.gamesPlayed}</Text>
              <Text style={styles.statLabel}>Games</Text>
            </View>
          </View>

          {/* Main Play Button */}
          <TouchableOpacity style={styles.playButton} onPress={handlePlayPress}>
            <LinearGradient
              colors={['#FFD700', '#FFA500', '#FF8C00']}
              style={styles.playButtonGradient}
            >
              <Ionicons name="play" size={scale(32)} color="#FFF" />
              <Text style={styles.playButtonText}>PLAY</Text>
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

          {/* Guest Benefits */}
          {isGuest && (
            <View style={styles.guestBenefits}>
              <Text style={styles.benefitsTitle}>🎮 Playing as Guest</Text>
              <Text style={styles.benefitsText}>✓ Full game access</Text>
              <Text style={styles.benefitsText}>✓ All power-ups available</Text>
              <Text style={styles.benefitsText}>✗ Progress not saved</Text>
              <Text style={styles.benefitsText}>✗ No leaderboard access</Text>
              
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
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: scale(20),
    paddingTop: Platform.OS === 'ios' ? scale(60) : scale(40),
  },
  header: {
    alignItems: 'center',
    marginBottom: verticalScale(30),
  },
  logo: {
    width: scale(100),
    height: scale(100),
    marginBottom: verticalScale(10),
  },
  title: {
    fontSize: fontScale(36),
    fontWeight: 'bold',
    color: '#FFD700',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
  },
  subtitle: {
    fontSize: fontScale(16),
    color: '#FFA500',
    marginTop: verticalScale(5),
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
    marginBottom: verticalScale(30),
  },
  statCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: scale(15),
    padding: scale(15),
    alignItems: 'center',
    minWidth: scale(90),
  },
  statValue: {
    fontSize: fontScale(20),
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: verticalScale(5),
  },
  statLabel: {
    fontSize: fontScale(12),
    color: '#AAA',
    marginTop: verticalScale(2),
  },
  guestWarning: {
    fontSize: fontScale(10),
    color: '#FF6B6B',
    marginTop: verticalScale(2),
  },
  playButton: {
    marginBottom: verticalScale(30),
  },
  playButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: scale(20),
    borderRadius: scale(30),
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  playButtonText: {
    fontSize: fontScale(24),
    fontWeight: 'bold',
    color: '#FFF',
    marginLeft: scale(10),
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: verticalScale(20),
  },
  menuButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: scale(15),
    padding: scale(15),
    alignItems: 'center',
    width: '48%',
    marginBottom: verticalScale(10),
  },
  menuButtonText: {
    fontSize: fontScale(14),
    color: '#FFF',
    marginTop: verticalScale(5),
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