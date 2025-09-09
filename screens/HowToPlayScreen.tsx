import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import GoldRushItem from '../components/GoldRushItems';

const { width } = Dimensions.get('window');

export default function HowToPlayScreen({ navigation }: any) {
  return (
    <LinearGradient
      colors={['#1a1a2e', '#16213e', '#0f3460']}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFD700" />
        </TouchableOpacity>
        <Text style={styles.title}>How to Play</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Game Objective */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎯 Game Objective</Text>
          <Text style={styles.description}>
            Control your mine cart to collect falling treasures while avoiding bombs!
            Build combos, collect power-ups, and survive as long as possible to achieve
            the highest score!
          </Text>
        </View>

        {/* Controls */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎮 Controls</Text>
          <View style={styles.controlItem}>
            <Ionicons name="hand-left" size={30} color="#FFD700" />
            <Text style={styles.controlText}>
              <Text style={styles.bold}>Tap</Text> anywhere on the screen to move the cart
            </Text>
          </View>
          <View style={styles.controlItem}>
            <Ionicons name="move" size={30} color="#FFD700" />
            <Text style={styles.controlText}>
              <Text style={styles.bold}>Swipe</Text> left or right for smooth movement
            </Text>
          </View>
        </View>

        {/* Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💎 Collectibles</Text>
          
          <View style={styles.itemRow}>
            <View style={styles.itemDisplay}>
              <GoldRushItem type="coin" size={40} isAnimated={false} />
            </View>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>Gold Coin</Text>
              <Text style={styles.itemDesc}>+10 points, +1 coin</Text>
            </View>
          </View>

          <View style={styles.itemRow}>
            <View style={styles.itemDisplay}>
              <GoldRushItem type="gem" size={40} isAnimated={false} />
            </View>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>Emerald</Text>
              <Text style={styles.itemDesc}>+50 points, +5 coins</Text>
            </View>
          </View>

          <View style={styles.itemRow}>
            <View style={styles.itemDisplay}>
              <GoldRushItem type="diamond" size={40} isAnimated={false} />
            </View>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>Diamond</Text>
              <Text style={styles.itemDesc}>+100 points, +10 coins</Text>
            </View>
          </View>

          <View style={styles.itemRow}>
            <View style={styles.itemDisplay}>
              <GoldRushItem type="nugget" size={40} isAnimated={false} />
            </View>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>Gold Nugget</Text>
              <Text style={styles.itemDesc}>+25 points, +3 coins</Text>
            </View>
          </View>

          <View style={styles.itemRow}>
            <View style={styles.itemDisplay}>
              <GoldRushItem type="mystery" size={40} isAnimated={false} />
            </View>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>Mystery Box</Text>
              <Text style={styles.itemDesc}>Random reward or power-up</Text>
            </View>
          </View>
        </View>

        {/* Dangers */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚠️ Dangers</Text>
          
          <View style={styles.itemRow}>
            <View style={styles.itemDisplay}>
              <GoldRushItem type="bomb" size={40} isAnimated={false} />
            </View>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>Bomb</Text>
              <Text style={styles.itemDesc}>-1 life, resets combo</Text>
            </View>
          </View>

          <View style={styles.warningBox}>
            <Ionicons name="warning" size={24} color="#FF6347" />
            <Text style={styles.warningText}>
              Missing items creates blockages on the track that limit your movement!
            </Text>
          </View>
        </View>

        {/* Power-ups */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚡ Power-ups</Text>
          
          <View style={styles.powerupItem}>
            <Ionicons name="magnet" size={30} color="#FFD700" />
            <View style={styles.powerupInfo}>
              <Text style={styles.powerupName}>Magnet</Text>
              <Text style={styles.powerupDesc}>Attracts nearby items for 10 seconds</Text>
            </View>
          </View>

          <View style={styles.powerupItem}>
            <Ionicons name="shield" size={30} color="#00BFFF" />
            <View style={styles.powerupInfo}>
              <Text style={styles.powerupName}>Shield</Text>
              <Text style={styles.powerupDesc}>Protects from one bomb hit</Text>
            </View>
          </View>

          <View style={styles.powerupItem}>
            <Ionicons name="flash" size={30} color="#FF4500" />
            <View style={styles.powerupInfo}>
              <Text style={styles.powerupName}>2x Multiplier</Text>
              <Text style={styles.powerupDesc}>Double points and coins for 15 seconds</Text>
            </View>
          </View>
        </View>

        {/* Tips */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💡 Pro Tips</Text>
          <View style={styles.tipsList}>
            <Text style={styles.tip}>• Build combos by collecting items consecutively</Text>
            <Text style={styles.tip}>• Clear blockages with power-ups or special abilities</Text>
            <Text style={styles.tip}>• Higher levels mean faster falling items</Text>
            <Text style={styles.tip}>• Save coins to buy continues and upgrades</Text>
            <Text style={styles.tip}>• Complete daily challenges for bonus rewards</Text>
          </View>
        </View>

        {/* Lives System */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>❤️ Lives System</Text>
          <Text style={styles.description}>
            You start with 5 lives. Lives regenerate 1 every 20 minutes.
            Watch ads or use coins to get extra lives instantly!
          </Text>
        </View>

        {/* Play Button */}
        <TouchableOpacity
          style={styles.playButton}
          onPress={() => navigation.navigate('Game')}
        >
          <LinearGradient
            colors={['#FFD700', '#FFA500']}
            style={styles.playButtonGradient}
          >
            <Text style={styles.playButtonText}>Start Playing!</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: 50 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    padding: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFD700',
    marginLeft: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 15,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 15,
  },
  description: {
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 24,
    opacity: 0.9,
  },
  controlItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  controlText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginLeft: 15,
    flex: 1,
  },
  bold: {
    fontWeight: 'bold',
    color: '#FFD700',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  itemDisplay: {
    width: 50,
    alignItems: 'center',
  },
  itemInfo: {
    marginLeft: 20,
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  itemDesc: {
    fontSize: 14,
    color: '#FFD700',
    marginTop: 2,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 99, 71, 0.2)',
    borderRadius: 10,
    padding: 15,
    marginTop: 10,
  },
  warningText: {
    fontSize: 14,
    color: '#FF6347',
    marginLeft: 10,
    flex: 1,
  },
  powerupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  powerupInfo: {
    marginLeft: 15,
    flex: 1,
  },
  powerupName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  powerupDesc: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  tipsList: {
    marginTop: 5,
  },
  tip: {
    fontSize: 15,
    color: '#FFFFFF',
    marginBottom: 8,
    lineHeight: 22,
  },
  playButton: {
    marginVertical: 20,
  },
  playButtonGradient: {
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: 'center',
  },
  playButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C1810',
  },
});