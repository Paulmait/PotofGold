# Sound Effects Directory

This directory contains sound effects for the Pot of Gold game.

## Required Sound Files

### coin.wav
- **Description**: Sound played when collecting coins
- **Duration**: 0.5-1 second
- **Format**: WAV (recommended for better performance)
- **Usage**: Coin collection feedback

### powerup.wav
- **Description**: Sound played when collecting power-ups
- **Duration**: 1-2 seconds
- **Format**: WAV
- **Usage**: Power-up collection feedback

### goldrush.wav
- **Description**: Sound played during gold rush events
- **Duration**: 2-3 seconds
- **Format**: WAV
- **Usage**: Gold rush activation

### button.wav
- **Description**: Sound played on button clicks
- **Duration**: 0.2-0.5 seconds
- **Format**: WAV
- **Usage**: UI interaction feedback

## Adding Sound Files

1. Place your sound files in this directory
2. Ensure they are in WAV format for better performance
3. Use descriptive filenames
4. Keep file sizes reasonable (under 500KB each)

## Sound Design Guidelines

- **Coin sounds**: Short, satisfying chime or ding
- **Power-up sounds**: Magical or electronic effect
- **Gold rush sounds**: Exciting, energetic music or effect
- **Button sounds**: Subtle click or tap sound
- **Volume**: Keep at reasonable levels
- **Quality**: Use high-quality audio files

## Testing Sounds

Sounds are loaded in `screens/GameScreen.tsx` and played using Expo Audio.
Make sure to test sound playback on both iOS and Android devices.

## RevenueCat Integration

For in-app purchases, we use RevenueCat which provides:
- Cross-platform compatibility (iOS/Android)
- Minimal code implementation
- Works on Windows development environment
- Automatic receipt validation
- Subscription management

### RevenueCat Products
- **Coin Packages**: Various coin amounts for purchase
- **Remove Ads**: One-time purchase to disable ads
- **Premium Power-ups**: Special power-up bundles
- **Gold Rush Pass**: Unlimited gold rush activations 