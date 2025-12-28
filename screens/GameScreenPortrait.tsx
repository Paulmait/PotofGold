import React from 'react';
import GameScreen from './GameScreen';
import ResponsiveGameWrapper from '../components/ResponsiveGameWrapper';

interface GameScreenPortraitProps {
  navigation: any;
  route?: any;
}

const GameScreenPortrait: React.FC<GameScreenPortraitProps> = ({ navigation, route }) => {
  return (
    <ResponsiveGameWrapper forcePortrait={true}>
      <GameScreen navigation={navigation} route={route} />
    </ResponsiveGameWrapper>
  );
};

export default GameScreenPortrait;
