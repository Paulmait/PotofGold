import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Simple Game Screen for Web
function GameScreen() {
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [gameActive, setGameActive] = useState(false);

  const startGame = () => {
    setGameActive(true);
    setScore(0);
    setCoins(0);
  };

  const collectCoin = () => {
    if (!gameActive) return;
    setCoins(coins + 1);
    setScore(score + 10);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.gameContainer}>
        <Text style={styles.title}>🍯 Pot of Gold</Text>
        
        <View style={styles.potContainer}>
          <Text style={styles.pot}>🍯</Text>
        </View>

        <View style={styles.statsContainer}>
          <Text style={styles.score}>Score: {score}</Text>
          <Text style={styles.coins}>💰 × {coins}</Text>
        </View>

        <View style={styles.buttonContainer}>
          {!gameActive ? (
            <TouchableOpacity style={styles.button} onPress={startGame}>
              <Text style={styles.buttonText}>Start Game</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.button} onPress={collectCoin}>
              <Text style={styles.buttonText}>Collect Coin</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            {gameActive ? 'Tap to collect coins!' : 'Press Start to begin'}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

// Home Screen
function HomeScreen({ navigation }: any) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.menuContainer}>
        <Text style={styles.title}>🍯 Pot of Gold</Text>
        <Text style={styles.subtitle}>Welcome to the Gold Rush!</Text>
        
        <TouchableOpacity 
          style={styles.menuButton}
          onPress={() => navigation.navigate('Game')}
        >
          <Text style={styles.menuButtonText}>Play Game</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.menuButton, styles.secondaryButton]}
          onPress={() => alert('Leaderboard coming soon!')}
        >
          <Text style={styles.menuButtonText}>Leaderboard</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.menuButton, styles.secondaryButton]}
          onPress={() => alert('Settings coming soon!')}
        >
          <Text style={styles.menuButtonText}>Settings</Text>
        </TouchableOpacity>
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
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
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
  potContainer: {
    marginVertical: 30,
  },
  pot: {
    fontSize: 100,
  },
  statsContainer: {
    marginVertical: 20,
    alignItems: 'center',
  },
  score: {
    fontSize: 28,
    color: '#fff',
    marginBottom: 10,
  },
  coins: {
    fontSize: 36,
    color: '#FFD700',
  },
  buttonContainer: {
    marginVertical: 20,
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
  infoContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
  },
  infoText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
  },
});