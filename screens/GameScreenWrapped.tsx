import React from 'react';
import { Platform } from 'react-native';
import GameScreenClean from './GameScreenClean';
import ResponsiveGameWrapper from '../components/ResponsiveGameWrapper';

// Wrapper that only applies responsive sizing to the game screen on desktop
const GameScreenWrapped = (props: any) => {
  // Only apply the responsive wrapper on desktop/laptop for contained viewport
  // Mobile and tablets should use full screen
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.innerWidth >= 1024) {
    return (
      <ResponsiveGameWrapper>
        <GameScreenClean {...props} />
      </ResponsiveGameWrapper>
    );
  }
  
  // For mobile and tablets, render game without wrapper
  return <GameScreenClean {...props} />;
};

export default GameScreenWrapped;