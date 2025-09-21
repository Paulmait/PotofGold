
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import GameScreenPortrait from '../screens/GameScreenPortrait';
import StoreScreen from '../screens/StoreScreen';
import SettingsScreen from '../screens/SettingsScreen';
import StatsScreen from '../screens/StatsScreen';
import GameOverScreen from '../screens/GameOverScreen';
import UpgradeScreen from '../screens/UpgradeScreen';
import BuyGoldScreen from '../screens/BuyGoldScreen';
import ChallengeFriendsScreen from '../screens/ChallengeFriendsScreen';
import LeaderboardScreen from '../screens/LeaderboardScreen';

const Stack = createNativeStackNavigator();

export default function MainStack() {
  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Game" component={GameScreenPortrait} />
      <Stack.Screen name="Store" component={StoreScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Stats" component={StatsScreen} />
      <Stack.Screen name="GameOver" component={GameOverScreen} />
      <Stack.Screen name="Upgrade" component={UpgradeScreen} />
      <Stack.Screen name="BuyGold" component={BuyGoldScreen} />
      <Stack.Screen name="ChallengeFriends" component={ChallengeFriendsScreen} />
      <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
    </Stack.Navigator>
  );
}
