export const Audio = {
  Sound: {
    createAsync: jest.fn().mockResolvedValue({
      sound: {
        playAsync: jest.fn().mockResolvedValue(true),
        pauseAsync: jest.fn().mockResolvedValue(true),
        stopAsync: jest.fn().mockResolvedValue(true),
        unloadAsync: jest.fn().mockResolvedValue(true),
        setPositionAsync: jest.fn().mockResolvedValue(true),
        setVolumeAsync: jest.fn().mockResolvedValue(true),
        getStatusAsync: jest.fn().mockResolvedValue({
          isLoaded: true,
          isPlaying: false,
          durationMillis: 1000,
          positionMillis: 0,
        }),
      },
      status: {
        isLoaded: true,
      },
    }),
  },
  setAudioModeAsync: jest.fn().mockResolvedValue(true),
  setIsEnabledAsync: jest.fn().mockResolvedValue(true),
};

export const Video = {
  RESIZE_MODE_CONTAIN: 'contain',
  RESIZE_MODE_COVER: 'cover',
  RESIZE_MODE_STRETCH: 'stretch',
};

export default { Audio, Video };