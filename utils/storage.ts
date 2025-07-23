
import AsyncStorage from '@react-native-async-storage/async-storage';

export const saveGameState = async (state: any) => {
  await AsyncStorage.setItem('game_state', JSON.stringify(state));
};

export const loadGameState = async () => {
  const data = await AsyncStorage.getItem('game_state');
  return data ? JSON.parse(data) : null;
};
