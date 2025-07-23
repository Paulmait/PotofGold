import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  ActivityIndicator,
  Share,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useGameContext } from '../context/GameContext';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import * as Linking from 'expo-linking';

interface Challenge {
  id: string;
  challengerId: string;
  challengerName: string;
  challengerScore?: number;
  opponentId: string;
  opponentName: string;
  opponentScore?: number;
  status: 'pending' | 'waiting' | 'ready' | 'active' | 'completed';
  createdAt: Date;
  expiresAt: Date;
  sessionId?: string;
}

interface Friend {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  online: boolean;
  lastSeen: Date;
}

interface GameSession {
  id: string;
  player1Id: string;
  player1Name: string;
  player1Score: number;
  player2Id: string;
  player2Name: string;
  player2Score: number;
  status: 'waiting' | 'ready' | 'active' | 'completed';
  winner?: string;
  createdAt: Date;
}

const ChallengeFriendsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { gameState } = useGameContext();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [activeChallenges, setActiveChallenges] = useState<Challenge[]>([]);
  const [gameSessions, setGameSessions] = useState<GameSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [challenging, setChallenging] = useState<string | null>(null);
  const [inviteUsername, setInviteUsername] = useState('');
  const [showInviteInput, setShowInviteInput] = useState(false);

  useEffect(() => {
    loadFriends();
    loadActiveChallenges();
    loadGameSessions();
    setupDeepLinking();
  }, []);

  const setupDeepLinking = () => {
    // Handle deep links for game invites
    Linking.addEventListener('url', (event) => {
      const { url } = event;
      if (url.includes('challenge=')) {
        const challengeId = url.split('challenge=')[1];
        handleChallengeInvite(challengeId);
      }
    });
  };

  const loadFriends = async () => {
    try {
      // Mock friends data - in real app, this would come from Firebase
      const mockFriends: Friend[] = [
        { id: '1', name: 'Alice', username: 'alice_gamer', online: true, lastSeen: new Date() },
        { id: '2', name: 'Bob', username: 'bob_master', online: false, lastSeen: new Date(Date.now() - 300000) },
        { id: '3', name: 'Charlie', username: 'charlie_pro', online: true, lastSeen: new Date() },
        { id: '4', name: 'Diana', username: 'diana_queen', online: false, lastSeen: new Date(Date.now() - 600000) },
      ];
      setFriends(mockFriends);
    } catch (error) {
      console.log('Error loading friends:', error);
    }
  };

  const loadActiveChallenges = async () => {
    try {
      // Listen to challenges where user is involved
      const challengesRef = collection(db, 'challenges');
      const q = query(
        challengesRef,
        where('challengerId', '==', gameState.userId),
        where('status', 'in', ['pending', 'waiting', 'ready'])
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const challenges: Challenge[] = [];
        snapshot.forEach((doc) => {
          challenges.push({ id: doc.id, ...doc.data() } as Challenge);
        });
        setActiveChallenges(challenges);
        setLoading(false);
      });

      return unsubscribe;
    } catch (error) {
      console.log('Error loading challenges:', error);
      setLoading(false);
    }
  };

  const loadGameSessions = async () => {
    try {
      // Listen to game sessions where user is involved
      const sessionsRef = collection(db, 'games');
      const q = query(
        sessionsRef,
        where('player1Id', '==', gameState.userId),
        where('status', 'in', ['waiting', 'ready'])
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const sessions: GameSession[] = [];
        snapshot.forEach((doc) => {
          sessions.push({ id: doc.id, ...doc.data() } as GameSession);
        });
        setGameSessions(sessions);
      });

      return unsubscribe;
    } catch (error) {
      console.log('Error loading game sessions:', error);
    }
  };

  const sendChallenge = async (friendId: string, friendName: string, friendUsername: string) => {
    try {
      setChallenging(friendId);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const challenge: Omit<Challenge, 'id'> = {
        challengerId: gameState.userId || 'anonymous',
        challengerName: gameState.userName || 'Anonymous',
        opponentId: friendId,
        opponentName: friendName,
        status: 'pending',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      };

      const docRef = await addDoc(collection(db, 'challenges'), challenge);
      
      // Create shareable link
      const shareLink = `potofgold://challenge?challengeId=${docRef.id}&inviter=${gameState.userName}`;
      
      Alert.alert('Challenge Sent!', `Challenge sent to ${friendName}!`, [
        { text: 'Share Link', onPress: () => shareChallengeLink(shareLink, friendUsername) },
        { text: 'OK' }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to send challenge. Please try again.');
    } finally {
      setChallenging(null);
    }
  };

  const shareChallengeLink = async (link: string, username: string) => {
    try {
      await Share.share({
        message: `Hey ${username}! I challenge you to a 60-second Pot of Gold game! Click this link to accept: ${link}`,
        url: link,
        title: 'Pot of Gold Challenge',
      });
    } catch (error) {
      console.log('Error sharing challenge:', error);
    }
  };

  const inviteByUsername = async () => {
    if (!inviteUsername.trim()) {
      Alert.alert('Error', 'Please enter a username');
      return;
    }

    try {
      // Check if username exists
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('username', '==', inviteUsername.trim()));
      const snapshot = await getDoc(doc(db, 'users', inviteUsername.trim()));
      
      if (!snapshot.exists()) {
        Alert.alert('User Not Found', 'No user found with that username');
        return;
      }

      const userData = snapshot.data();
      sendChallenge(userData.uid, userData.displayName, userData.username);
      setInviteUsername('');
      setShowInviteInput(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to find user. Please try again.');
    }
  };

  const handleChallengeInvite = async (challengeId: string) => {
    try {
      const challengeDoc = await getDoc(doc(db, 'challenges', challengeId));
      if (challengeDoc.exists()) {
        const challenge = challengeDoc.data() as Challenge;
        Alert.alert(
          'Challenge Received!',
          `${challenge.challengerName} has challenged you to a game!`,
          [
            { text: 'Decline', style: 'cancel' },
            { text: 'Accept', onPress: () => acceptChallenge(challenge) }
          ]
        );
      }
    } catch (error) {
      console.log('Error handling challenge invite:', error);
    }
  };

  const acceptChallenge = async (challenge: Challenge) => {
    try {
      // Update challenge status
      await updateDoc(doc(db, 'challenges', challenge.id), {
        status: 'waiting',
      });

      // Create game session
      const sessionId = `session_${Date.now()}`;
      const gameSession: Omit<GameSession, 'id'> = {
        player1Id: challenge.challengerId,
        player1Name: challenge.challengerName,
        player1Score: 0,
        player2Id: gameState.userId || 'anonymous',
        player2Name: gameState.userName || 'Anonymous',
        player2Score: 0,
        status: 'waiting',
        createdAt: new Date(),
      };

      await addDoc(collection(db, 'games'), { ...gameSession, id: sessionId });

      // Update challenge with session ID
      await updateDoc(doc(db, 'challenges', challenge.id), {
        sessionId,
        status: 'ready',
      });

      // Navigate to game with session
      navigation.navigate('Game', { 
        mode: 'challenge',
        sessionId,
        timeLimit: 60,
        opponentName: challenge.challengerName
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to accept challenge. Please try again.');
    }
  };

  const renderFriend = (friend: Friend) => {
    const isChallenging = challenging === friend.id;

    return (
      <TouchableOpacity
        key={friend.id}
        style={[styles.friendItem, !friend.online && styles.offlineFriend]}
        onPress={() => {
          if (friend.online) {
            Alert.alert(
              'Send Challenge',
              `Challenge ${friend.name} (@${friend.username}) to a 60-second game?`,
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Challenge', onPress: () => sendChallenge(friend.id, friend.name, friend.username) }
              ]
            );
          }
        }}
        disabled={!friend.online || isChallenging}
        activeOpacity={0.8}
      >
        <View style={styles.friendAvatar}>
          <Text style={styles.avatarText}>{friend.name.charAt(0)}</Text>
          <View style={[styles.onlineIndicator, { backgroundColor: friend.online ? '#4CAF50' : '#999' }]} />
        </View>
        
        <View style={styles.friendInfo}>
          <Text style={styles.friendName}>{friend.name}</Text>
          <Text style={styles.friendUsername}>@{friend.username}</Text>
          <Text style={styles.friendStatus}>
            {friend.online ? 'Online' : `Last seen ${getTimeAgo(friend.lastSeen)}`}
          </Text>
        </View>

        {isChallenging ? (
          <ActivityIndicator color="#FFD700" />
        ) : (
          <TouchableOpacity
            style={[styles.challengeButton, !friend.online && styles.disabledButton]}
            onPress={() => sendChallenge(friend.id, friend.name, friend.username)}
            disabled={!friend.online}
          >
            <Ionicons name="game-controller" size={20} color="white" />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  const renderChallenge = (challenge: Challenge) => {
    const isPending = challenge.status === 'pending';
    const isWaiting = challenge.status === 'waiting';
    const isReady = challenge.status === 'ready';
    const isMyChallenge = challenge.challengerId === gameState.userId;

    return (
      <View key={challenge.id} style={styles.challengeItem}>
        <View style={styles.challengeHeader}>
          <Text style={styles.challengeTitle}>
            {isMyChallenge ? `vs ${challenge.opponentName}` : `vs ${challenge.challengerName}`}
          </Text>
          <View style={[
            styles.statusBadge,
            { backgroundColor: isReady ? '#4CAF50' : isWaiting ? '#FFA500' : '#FF6B6B' }
          ]}>
            <Text style={styles.statusText}>
              {isReady ? 'Ready' : isWaiting ? 'Waiting' : 'Pending'}
            </Text>
          </View>
        </View>

        <View style={styles.challengeDetails}>
          <Text style={styles.challengeInfo}>
            {isMyChallenge 
              ? (isReady ? 'Game ready to start!' : 'Waiting for opponent...')
              : 'Tap to accept challenge'
            }
          </Text>
          
          {!isMyChallenge && isPending && (
            <TouchableOpacity
              style={styles.acceptButton}
              onPress={() => acceptChallenge(challenge)}
            >
              <Text style={styles.acceptButtonText}>Accept Challenge</Text>
            </TouchableOpacity>
          )}

          {isReady && (
            <TouchableOpacity
              style={styles.startButton}
              onPress={() => {
                navigation.navigate('Game', { 
                  mode: 'challenge',
                  sessionId: challenge.sessionId,
                  timeLimit: 60,
                  opponentName: isMyChallenge ? challenge.opponentName : challenge.challengerName
                });
              }}
            >
              <Text style={styles.startButtonText}>Start Game</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderGameSession = (session: GameSession) => {
    const isMySession = session.player1Id === gameState.userId;
    const opponentName = isMySession ? session.player2Name : session.player1Name;

    return (
      <View key={session.id} style={styles.sessionItem}>
        <View style={styles.sessionHeader}>
          <Text style={styles.sessionTitle}>vs {opponentName}</Text>
          <View style={[styles.statusBadge, { backgroundColor: '#4CAF50' }]}>
            <Text style={styles.statusText}>Active</Text>
          </View>
        </View>

        <View style={styles.sessionDetails}>
          <Text style={styles.sessionInfo}>Game in progress...</Text>
          <TouchableOpacity
            style={styles.joinButton}
            onPress={() => {
              navigation.navigate('Game', { 
                mode: 'challenge',
                sessionId: session.id,
                timeLimit: 60,
                opponentName
              });
            }}
          >
            <Text style={styles.joinButtonText}>Join Game</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const getTimeAgo = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  return (
    <LinearGradient
      colors={['#FFD700', '#FFA500', '#FF8C00']}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        
        <Text style={styles.title}>Challenge Friends</Text>
        
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowInviteInput(!showInviteInput)}
        >
          <Ionicons name="person-add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Username Invite Input */}
      {showInviteInput && (
        <View style={styles.inviteContainer}>
          <TextInput
            style={styles.usernameInput}
            placeholder="Enter username to invite"
            placeholderTextColor="rgba(255,255,255,0.6)"
            value={inviteUsername}
            onChangeText={setInviteUsername}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity
            style={styles.inviteButton}
            onPress={inviteByUsername}
          >
            <Text style={styles.inviteButtonText}>Invite</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFD700" />
          <Text style={styles.loadingText}>Loading friends...</Text>
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Active Game Sessions */}
          {gameSessions.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Active Games</Text>
              {gameSessions.map(renderGameSession)}
            </View>
          )}

          {/* Active Challenges */}
          {activeChallenges.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Active Challenges</Text>
              {activeChallenges.map(renderChallenge)}
            </View>
          )}

          {/* Friends List */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Friends</Text>
            {friends.map(renderFriend)}
          </View>

          {/* No Friends State */}
          {friends.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="people" size={64} color="rgba(255,255,255,0.5)" />
              <Text style={styles.emptyStateTitle}>No Friends Yet</Text>
              <Text style={styles.emptyStateText}>
                Add friends to challenge them to 60-second games!
              </Text>
              <TouchableOpacity
                style={styles.addFriendsButton}
                onPress={() => setShowInviteInput(true)}
              >
                <Text style={styles.addFriendsButtonText}>Add Friends</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  addButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 8,
  },
  inviteContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 16,
    alignItems: 'center',
  },
  usernameInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: 'white',
    marginRight: 12,
  },
  inviteButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inviteButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: 'white',
    marginTop: 16,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  offlineFriend: {
    opacity: 0.6,
  },
  friendAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    position: 'relative',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'white',
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 2,
  },
  friendUsername: {
    fontSize: 12,
    color: '#FFD700',
    marginBottom: 2,
  },
  friendStatus: {
    fontSize: 12,
    color: 'white',
    opacity: 0.8,
  },
  challengeButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 20,
    padding: 8,
  },
  disabledButton: {
    backgroundColor: '#666',
  },
  challengeItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  sessionItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  challengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  challengeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  statusBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
  },
  challengeDetails: {
    alignItems: 'center',
  },
  sessionDetails: {
    alignItems: 'center',
  },
  challengeInfo: {
    fontSize: 14,
    color: 'white',
    opacity: 0.8,
    marginBottom: 8,
  },
  sessionInfo: {
    fontSize: 14,
    color: 'white',
    opacity: 0.8,
    marginBottom: 8,
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  acceptButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
  },
  startButton: {
    backgroundColor: '#FFD700',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  startButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'black',
  },
  joinButton: {
    backgroundColor: '#2196F3',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  joinButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: 'white',
    opacity: 0.8,
    textAlign: 'center',
    marginBottom: 24,
  },
  addFriendsButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  addFriendsButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
});

export default ChallengeFriendsScreen; 