
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import MainStack from './navigation';
import { GameProvider } from './context/GameContext';

export default function App() {
  return (
    <NavigationContainer>
      <GameProvider>
        <MainStack />
      </GameProvider>
    </NavigationContainer>
  );
}
