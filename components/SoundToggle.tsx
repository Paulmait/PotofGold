import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import audioManager from '../utils/audioManager';
import * as Haptics from 'expo-haptics';

interface SoundToggleProps {
  style?: any;
  showLabels?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const SoundToggle: React.FC<SoundToggleProps> = ({
  style,
  showLabels = true,
  size = 'medium'
}) => {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [masterVolume, setMasterVolume] = useState(70);

  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const rotateAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const sound = await AsyncStorage.getItem('soundEnabled');
      const music = await AsyncStorage.getItem('musicEnabled');
      const vibration = await AsyncStorage.getItem('vibrationEnabled');
      const volume = await AsyncStorage.getItem('masterVolume');

      if (sound !== null) setSoundEnabled(sound !== 'false');
      if (music !== null) setMusicEnabled(music !== 'false');
      if (vibration !== null) setVibrationEnabled(vibration !== 'false');
      if (volume !== null) setMasterVolume(parseFloat(volume) * 100);
    } catch (error) {
      console.error('Failed to load sound settings:', error);
    }
  };

  const toggleSound = async () => {
    const newValue = !soundEnabled;
    setSoundEnabled(newValue);
    await audioManager.setSoundEnabled(newValue);

    // Animate button
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 0.8,
        tension: 100,
        friction: 5,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 3,
        useNativeDriver: true,
      }),
    ]).start();

    if (newValue && vibrationEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const toggleMusic = async () => {
    const newValue = !musicEnabled;
    setMusicEnabled(newValue);
    await audioManager.setMusicEnabled(newValue);

    // Animate rotation
    Animated.timing(rotateAnim, {
      toValue: newValue ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    if (vibrationEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const toggleVibration = async () => {
    const newValue = !vibrationEnabled;
    setVibrationEnabled(newValue);
    await audioManager.setVibrationEnabled(newValue);

    if (newValue) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const handleVolumeChange = async (value: number) => {
    setMasterVolume(value);
    await audioManager.setMasterVolume(value / 100);
  };

  const getIconSize = () => {
    switch (size) {
      case 'small': return 20;
      case 'large': return 36;
      default: return 28;
    }
  };

  const getContainerSize = () => {
    switch (size) {
      case 'small': return { width: 40, height: 40 };
      case 'large': return { width: 60, height: 60 };
      default: return { width: 50, height: 50 };
    }
  };

  return (
    <>
      {/* Quick Toggle Button */}
      <TouchableOpacity
        style={[styles.quickToggle, getContainerSize(), style]}
        onPress={() => setShowSettings(true)}
      >
        <Animated.View
          style={{
            transform: [
              { scale: scaleAnim },
              {
                rotate: rotateAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '180deg'],
                }),
              },
            ],
          }}
        >
          <Text style={[styles.icon, { fontSize: getIconSize() }]}>
            {soundEnabled && musicEnabled ? '🔊' : soundEnabled ? '🔈' : '🔇'}
          </Text>
        </Animated.View>
      </TouchableOpacity>

      {/* Settings Modal */}
      <Modal
        visible={showSettings}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSettings(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.modalOverlay}
            onPress={() => setShowSettings(false)}
          />

          <View style={styles.settingsPanel}>
            <LinearGradient
              colors={['#FFD700', '#FFA500']}
              style={styles.settingsGradient}
            >
              <Text style={styles.settingsTitle}>🎵 Sound Settings 🎵</Text>

              {/* Sound Effects Toggle */}
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>Sound Effects</Text>
                <TouchableOpacity
                  style={[
                    styles.toggle,
                    soundEnabled && styles.toggleActive,
                  ]}
                  onPress={toggleSound}
                >
                  <Text style={styles.toggleIcon}>
                    {soundEnabled ? '✅' : '❌'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Background Music Toggle */}
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>Background Music</Text>
                <TouchableOpacity
                  style={[
                    styles.toggle,
                    musicEnabled && styles.toggleActive,
                  ]}
                  onPress={toggleMusic}
                >
                  <Text style={styles.toggleIcon}>
                    {musicEnabled ? '✅' : '❌'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Vibration Toggle */}
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>Vibration</Text>
                <TouchableOpacity
                  style={[
                    styles.toggle,
                    vibrationEnabled && styles.toggleActive,
                  ]}
                  onPress={toggleVibration}
                >
                  <Text style={styles.toggleIcon}>
                    {vibrationEnabled ? '✅' : '❌'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Master Volume Slider */}
              <View style={styles.volumeContainer}>
                <Text style={styles.settingLabel}>Master Volume</Text>
                <View style={styles.volumeBar}>
                  <View
                    style={[
                      styles.volumeFill,
                      { width: `${masterVolume}%` },
                    ]}
                  />
                </View>
                <Text style={styles.volumeText}>{Math.round(masterVolume)}%</Text>
              </View>

              {/* Volume Preset Buttons */}
              <View style={styles.presetContainer}>
                <TouchableOpacity
                  style={styles.presetButton}
                  onPress={() => handleVolumeChange(0)}
                >
                  <Text style={styles.presetIcon}>🔇</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.presetButton}
                  onPress={() => handleVolumeChange(30)}
                >
                  <Text style={styles.presetIcon}>🔈</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.presetButton}
                  onPress={() => handleVolumeChange(70)}
                >
                  <Text style={styles.presetIcon}>🔉</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.presetButton}
                  onPress={() => handleVolumeChange(100)}
                >
                  <Text style={styles.presetIcon}>🔊</Text>
                </TouchableOpacity>
              </View>

              {/* Fun Message */}
              <Text style={styles.funMessage}>
                {soundEnabled && musicEnabled
                  ? '🎉 Let the fun begin! 🎉'
                  : soundEnabled
                  ? '🎮 Game sounds active! 🎮'
                  : musicEnabled
                  ? '🎵 Enjoying the music! 🎵'
                  : '🤫 Stealth mode activated! 🤫'}
              </Text>

              {/* Close Button */}
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowSettings(false)}
              >
                <Text style={styles.closeButtonText}>Done Playing With Settings!</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  quickToggle: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  icon: {
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  settingsPanel: {
    width: '85%',
    maxWidth: 400,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  settingsGradient: {
    padding: 20,
  },
  settingsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 20,
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
    paddingHorizontal: 10,
  },
  settingLabel: {
    fontSize: 18,
    color: '#FFF',
    fontWeight: '600',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  toggle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  toggleActive: {
    backgroundColor: 'rgba(0, 255, 0, 0.3)',
  },
  toggleIcon: {
    fontSize: 24,
  },
  volumeContainer: {
    marginTop: 20,
    paddingHorizontal: 10,
  },
  volumeBar: {
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 15,
    marginTop: 10,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  volumeFill: {
    height: '100%',
    backgroundColor: '#00FF00',
    borderRadius: 15,
  },
  volumeText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 5,
  },
  presetContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 15,
    paddingHorizontal: 20,
  },
  presetButton: {
    width: 50,
    height: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  presetIcon: {
    fontSize: 24,
  },
  funMessage: {
    fontSize: 16,
    color: '#FFF',
    textAlign: 'center',
    marginTop: 20,
    fontStyle: 'italic',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  closeButton: {
    backgroundColor: '#FFF',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: 20,
    alignSelf: 'center',
  },
  closeButtonText: {
    color: '#FFA500',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SoundToggle;