import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { metaGameSystem } from '../utils/metaGameSystem';
import { masterGameManager } from '../utils/masterGameManager';

const { width, height } = Dimensions.get('window');

interface CampScreenProps {
  navigation: any;
}

export default function CampScreen({ navigation }: CampScreenProps) {
  const [campProgress, setCampProgress] = useState<any>(null);
  const [passiveIncome, setPassiveIncome] = useState(0);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    loadCampData();
    const interval = setInterval(updatePassiveIncome, 1000);
    return () => clearInterval(interval);
  }, []);

  const loadCampData = async () => {
    try {
      const progress = metaGameSystem.getProgress();
      if (progress) {
        setCampProgress(progress);
        await generatePassiveIncome();
      }
    } catch (error) {
      console.log('Error loading camp data:', error);
    }
  };

  const generatePassiveIncome = async () => {
    try {
      const income = await metaGameSystem.generatePassiveIncome();
      setPassiveIncome(income.coins);
      setLastUpdate(new Date());
    } catch (error) {
      console.log('Error generating passive income:', error);
    }
  };

  const updatePassiveIncome = () => {
    if (campProgress) {
      const timeSinceLastUpdate = Date.now() - lastUpdate.getTime();
      const hoursPassed = timeSinceLastUpdate / (1000 * 60 * 60);
      const newIncome = Math.floor(campProgress.camp.totalCoinGeneration * hoursPassed);
      setPassiveIncome(newIncome);
    }
  };

  const upgradeBuilding = async (buildingId: string) => {
    try {
      const result = await metaGameSystem.upgradeBuilding(buildingId);
      if (result.success) {
        Alert.alert(
          'Upgrade Successful!',
          `${campProgress.camp.buildings.find((b: any) => b.id === buildingId)?.name} upgraded to level ${result.newLevel}`,
          [{ text: 'OK', onPress: loadCampData }]
        );
      } else {
        Alert.alert('Upgrade Failed', 'Not enough coins or building at max level');
      }
    } catch (error) {
      console.log('Error upgrading building:', error);
    }
  };

  const claimPassiveIncome = async () => {
    try {
      await generatePassiveIncome();
      Alert.alert('Income Claimed!', `You earned ${passiveIncome} coins`);
      setPassiveIncome(0);
    } catch (error) {
      console.log('Error claiming passive income:', error);
    }
  };

  if (!campProgress) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading Camp...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🏕️ Your Camp</Text>
        <Text style={styles.headerSubtitle}>Build your gold empire</Text>
      </View>

      {/* Passive Income Display */}
      <View style={styles.incomeContainer}>
        <Text style={styles.incomeTitle}>Passive Income</Text>
        <Text style={styles.incomeAmount}>+{passiveIncome} coins</Text>
        <TouchableOpacity style={styles.claimButton} onPress={claimPassiveIncome}>
          <Text style={styles.claimButtonText}>Claim Income</Text>
        </TouchableOpacity>
      </View>

      {/* Buildings */}
      <ScrollView style={styles.buildingsContainer}>
        <Text style={styles.sectionTitle}>Buildings</Text>
        {campProgress.camp.buildings.map((building: any) => (
          <View key={building.id} style={styles.buildingCard}>
            <View style={styles.buildingInfo}>
              <Text style={styles.buildingName}>{building.name}</Text>
              <Text style={styles.buildingDescription}>{building.description}</Text>
              <Text style={styles.buildingLevel}>
                Level {building.level}/{building.maxLevel}
              </Text>
            </View>

            <View style={styles.buildingStats}>
              <Text style={styles.statText}>
                Coin Generation: +{building.effects.coinGeneration}/hr
              </Text>
              <Text style={styles.statText}>
                Experience Bonus: +{building.effects.experienceBonus}%
              </Text>
              <Text style={styles.statText}>
                Power-up Chance: +{building.effects.powerUpChance}%
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.upgradeButton,
                building.level >= building.maxLevel && styles.upgradeButtonDisabled,
              ]}
              onPress={() => upgradeBuilding(building.id)}
              disabled={building.level >= building.maxLevel}
            >
              <Text style={styles.upgradeButtonText}>
                {building.level >= building.maxLevel ? 'MAX LEVEL' : 'Upgrade'}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {/* Camp Statistics */}
      <View style={styles.statsContainer}>
        <Text style={styles.statsTitle}>Camp Statistics</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Total Coin Generation</Text>
            <Text style={styles.statValue}>+{campProgress.camp.totalCoinGeneration}/hr</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Total Experience Bonus</Text>
            <Text style={styles.statValue}>+{campProgress.camp.totalExperienceBonus}%</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Camp Level</Text>
            <Text style={styles.statValue}>{campProgress.camp.level}</Text>
          </View>
        </View>
      </View>

      {/* Navigation */}
      <View style={styles.navigationContainer}>
        <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('Shop')}>
          <Text style={styles.navButtonText}>Shop</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('Game')}>
          <Text style={styles.navButtonText}>Play Game</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    padding: 20,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#ccc',
    marginTop: 5,
  },
  incomeContainer: {
    margin: 20,
    padding: 20,
    backgroundColor: '#2a2a2a',
    borderRadius: 15,
    alignItems: 'center',
  },
  incomeTitle: {
    fontSize: 18,
    color: '#ccc',
    marginBottom: 10,
  },
  incomeAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 15,
  },
  claimButton: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  claimButtonText: {
    color: '#1a1a1a',
    fontWeight: 'bold',
  },
  buildingsContainer: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 15,
  },
  buildingCard: {
    backgroundColor: '#2a2a2a',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  buildingInfo: {
    marginBottom: 10,
  },
  buildingName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  buildingDescription: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 5,
  },
  buildingLevel: {
    fontSize: 12,
    color: '#888',
    marginTop: 5,
  },
  buildingStats: {
    marginBottom: 15,
  },
  statText: {
    fontSize: 12,
    color: '#ccc',
    marginVertical: 2,
  },
  upgradeButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  upgradeButtonDisabled: {
    backgroundColor: '#666',
  },
  upgradeButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  statsContainer: {
    padding: 20,
    backgroundColor: '#2a2a2a',
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#ccc',
    textAlign: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFD700',
    marginTop: 5,
  },
  navigationContainer: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#333',
  },
  navButton: {
    flex: 1,
    backgroundColor: '#555',
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  navButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  loadingText: {
    fontSize: 18,
    color: '#ccc',
    textAlign: 'center',
    marginTop: 50,
  },
}); 