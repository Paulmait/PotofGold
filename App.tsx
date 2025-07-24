
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { GameProvider } from './context/GameContext';
import { UserUnlockProvider } from './context/UserUnlockContext';
import GameScreen from './screens/GameScreen';
import SkinShopScreen from './screens/SkinShopScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <UserUnlockProvider>
        <GameProvider>
          <Stack.Navigator initialRouteName="Game">
            <Stack.Screen 
              name="Game" 
              component={GameScreen} 
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="SkinShop" 
              component={SkinShopScreen} 
              options={{ 
                title: 'State Skins',
                headerStyle: {
                  backgroundColor: '#1A1A1A',
                },
                headerTintColor: '#FFFFFF',
                headerTitleStyle: {
                  fontWeight: 'bold',
                },
              }}
            />
          </Stack.Navigator>
        </GameProvider>
      </UserUnlockProvider>
    </NavigationContainer>
  );
}
