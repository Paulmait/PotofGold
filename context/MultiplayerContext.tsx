import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { doc, onSnapshot, updateDoc, getDoc, collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

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
  completedAt?: Date;
}

interface Challenge {
  id: string;
  challengerId: string;
  challengerName: string;
  opponentId: string;
  opponentName: string;
  status: 'pending' | 'waiting' | 'ready' | 'active' | 'completed';
  sessionId?: string;
  createdAt: Date;
  expiresAt: Date;
}

interface MultiplayerState {
  currentSession: GameSession | null;
  activeChallenges: Challenge[];
  opponentScore: number;
  isWaiting: boolean;
  isReady: boolean;
  isActive: boolean;
  isCompleted: boolean;
  winner: 'player' | 'opponent' | 'tie' | null;
}

interface MultiplayerContextType {
  state: MultiplayerState;
  joinSession: (sessionId: string, playerId: string, playerName: string) => Promise<void>;
  leaveSession: () => void;
  updateScore: (score: number) => Promise<void>;
  createChallenge: (opponentId: string, opponentName: string) => Promise<string>;
  acceptChallenge: (challengeId: string, playerId: string, playerName: string) => Promise<string>;
  declineChallenge: (challengeId: string) => Promise<void>;
  loadChallenges: (playerId: string) => void;
  setGameReady: (sessionId: string) => Promise<void>;
  startGame: (sessionId: string) => Promise<void>;
  endGame: (sessionId: string, winner: 'player' | 'opponent' | 'tie') => Promise<void>;
}

const MultiplayerContext = createContext<MultiplayerContextType | undefined>(undefined);

export const useMultiplayer = () => {
  const context = useContext(MultiplayerContext);
  if (!context) {
    throw new Error('useMultiplayer must be used within a MultiplayerProvider');
  }
  return context;
};

interface MultiplayerProviderProps {
  children: React.ReactNode;
}

export const MultiplayerProvider: React.FC<MultiplayerProviderProps> = ({ children }) => {
  const [state, setState] = useState<MultiplayerState>({
    currentSession: null,
    activeChallenges: [],
    opponentScore: 0,
    isWaiting: false,
    isReady: false,
    isActive: false,
    isCompleted: false,
    winner: null,
  });

  const sessionUnsubscribe = useRef<(() => void) | null>(null);
  const challengesUnsubscribe = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => {
      // Cleanup listeners on unmount
      if (sessionUnsubscribe.current) {
        sessionUnsubscribe.current();
      }
      if (challengesUnsubscribe.current) {
        challengesUnsubscribe.current();
      }
    };
  }, []);

  const joinSession = async (sessionId: string, playerId: string, playerName: string) => {
    try {
      const sessionRef = doc(db, 'games', sessionId);
      const sessionDoc = await getDoc(sessionRef);

      if (!sessionDoc.exists()) {
        throw new Error('Session not found');
      }

      const sessionData = sessionDoc.data() as GameSession;

      // Determine if player is player1 or player2
      const isPlayer1 = sessionData.player1Id === playerId;
      const playerKey = isPlayer1 ? 'player1' : 'player2';

      // Update session with player info if not already set
      if (!sessionData[`${playerKey}Id`] || sessionData[`${playerKey}Id`] === 'anonymous') {
        await updateDoc(sessionRef, {
          [`${playerKey}Id`]: playerId,
          [`${playerKey}Name`]: playerName,
          status: 'waiting',
        });
      }

      // Listen to session changes
      if (sessionUnsubscribe.current) {
        sessionUnsubscribe.current();
      }

      sessionUnsubscribe.current = onSnapshot(sessionRef, (doc) => {
        if (doc.exists()) {
          const updatedSession = { id: doc.id, ...doc.data() } as GameSession;
          setState((prev) => ({
            ...prev,
            currentSession: updatedSession,
            opponentScore: isPlayer1 ? updatedSession.player2Score : updatedSession.player1Score,
            isWaiting: updatedSession.status === 'waiting',
            isReady: updatedSession.status === 'ready',
            isActive: updatedSession.status === 'active',
            isCompleted: updatedSession.status === 'completed',
            winner:
              updatedSession.winner === playerId
                ? 'player'
                : updatedSession.winner ===
                    (isPlayer1 ? updatedSession.player2Id : updatedSession.player1Id)
                  ? 'opponent'
                  : updatedSession.winner === 'tie'
                    ? 'tie'
                    : null,
          }));
        }
      });
    } catch (error) {
      console.error('Error joining session:', error);
      throw error;
    }
  };

  const leaveSession = () => {
    if (sessionUnsubscribe.current) {
      sessionUnsubscribe.current();
      sessionUnsubscribe.current = null;
    }
    setState((prev) => ({
      ...prev,
      currentSession: null,
      opponentScore: 0,
      isWaiting: false,
      isReady: false,
      isActive: false,
      isCompleted: false,
      winner: null,
    }));
  };

  const updateScore = async (score: number) => {
    if (!state.currentSession) return;

    try {
      const sessionRef = doc(db, 'games', state.currentSession.id);
      const isPlayer1 = state.currentSession.player1Id === state.currentSession.player1Id;
      const playerKey = isPlayer1 ? 'player1' : 'player2';

      await updateDoc(sessionRef, {
        [`${playerKey}Score`]: score,
      });
    } catch (error) {
      console.error('Error updating score:', error);
    }
  };

  const createChallenge = async (opponentId: string, opponentName: string): Promise<string> => {
    try {
      const challenge: Omit<Challenge, 'id'> = {
        challengerId: 'current-user-id', // This should come from auth context
        challengerName: 'Current User', // This should come from auth context
        opponentId,
        opponentName,
        status: 'pending',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      };

      const docRef = await addDoc(collection(db, 'challenges'), challenge);
      return docRef.id;
    } catch (error) {
      console.error('Error creating challenge:', error);
      throw error;
    }
  };

  const acceptChallenge = async (
    challengeId: string,
    playerId: string,
    playerName: string
  ): Promise<string> => {
    try {
      const challengeRef = doc(db, 'challenges', challengeId);
      const challengeDoc = await getDoc(challengeRef);

      if (!challengeDoc.exists()) {
        throw new Error('Challenge not found');
      }

      const challenge = challengeDoc.data() as Challenge;

      // Create game session
      const sessionId = `session_${Date.now()}`;
      const gameSession: Omit<GameSession, 'id'> = {
        player1Id: challenge.challengerId,
        player1Name: challenge.challengerName,
        player1Score: 0,
        player2Id: playerId,
        player2Name: playerName,
        player2Score: 0,
        status: 'waiting',
        createdAt: new Date(),
      };

      await addDoc(collection(db, 'games'), { ...gameSession, id: sessionId });

      // Update challenge with session ID
      await updateDoc(challengeRef, {
        sessionId,
        status: 'ready',
      });

      return sessionId;
    } catch (error) {
      console.error('Error accepting challenge:', error);
      throw error;
    }
  };

  const declineChallenge = async (challengeId: string): Promise<void> => {
    try {
      const challengeRef = doc(db, 'challenges', challengeId);
      await updateDoc(challengeRef, {
        status: 'completed',
      });
    } catch (error) {
      console.error('Error declining challenge:', error);
      throw error;
    }
  };

  const loadChallenges = (playerId: string) => {
    // This would set up a listener for challenges involving the player
    // For now, we'll just set up a basic structure
    console.log('Loading challenges for player:', playerId);
  };

  const setGameReady = async (sessionId: string): Promise<void> => {
    try {
      const sessionRef = doc(db, 'games', sessionId);
      await updateDoc(sessionRef, {
        status: 'ready',
      });
    } catch (error) {
      console.error('Error setting game ready:', error);
      throw error;
    }
  };

  const startGame = async (sessionId: string): Promise<void> => {
    try {
      const sessionRef = doc(db, 'games', sessionId);
      await updateDoc(sessionRef, {
        status: 'active',
      });
    } catch (error) {
      console.error('Error starting game:', error);
      throw error;
    }
  };

  const endGame = async (
    sessionId: string,
    winner: 'player' | 'opponent' | 'tie'
  ): Promise<void> => {
    try {
      const sessionRef = doc(db, 'games', sessionId);
      const sessionDoc = await getDoc(sessionRef);

      if (sessionDoc.exists()) {
        const sessionData = sessionDoc.data() as GameSession;
        const winnerId =
          winner === 'player'
            ? sessionData.player1Id
            : winner === 'opponent'
              ? sessionData.player2Id
              : 'tie';

        await updateDoc(sessionRef, {
          status: 'completed',
          winner: winnerId,
          completedAt: new Date(),
        });
      }
    } catch (error) {
      console.error('Error ending game:', error);
      throw error;
    }
  };

  const value: MultiplayerContextType = {
    state,
    joinSession,
    leaveSession,
    updateScore,
    createChallenge,
    acceptChallenge,
    declineChallenge,
    loadChallenges,
    setGameReady,
    startGame,
    endGame,
  };

  return <MultiplayerContext.Provider value={value}>{children}</MultiplayerContext.Provider>;
};

export default MultiplayerContext;
