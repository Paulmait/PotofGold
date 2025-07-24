export interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  type: 'score' | 'combo' | 'collection' | 'survival' | 'special';
  target: number;
  reward: {
    coins: number;
    experience: number;
    specialReward?: string;
  };
  progress: number;
  isCompleted: boolean;
  expiresAt: number;
}

export const DAILY_CHALLENGES: Omit<DailyChallenge, 'progress' | 'isCompleted' | 'expiresAt'>[] = [
  {
    id: 'daily_score_5000',
    title: 'Score Rush',
    description: 'Score 5,000 points in a single game',
    type: 'score',
    target: 5000,
    reward: { coins: 100, experience: 50 },
  },
  {
    id: 'daily_combo_10',
    title: 'Combo Master',
    description: 'Achieve a 10x combo',
    type: 'combo',
    target: 10,
    reward: { coins: 75, experience: 40 },
  },
  {
    id: 'daily_coins_200',
    title: 'Coin Collector',
    description: 'Collect 200 coins',
    type: 'collection',
    target: 200,
    reward: { coins: 150, experience: 60 },
  },
  {
    id: 'daily_survival_180',
    title: 'Survival Expert',
    description: 'Survive for 3 minutes',
    type: 'survival',
    target: 180,
    reward: { coins: 80, experience: 45 },
  },
  {
    id: 'daily_gems_20',
    title: 'Gem Hunter',
    description: 'Collect 20 gemstones',
    type: 'collection',
    target: 20,
    reward: { coins: 120, experience: 55, specialReward: 'gem_boost' },
  },
  {
    id: 'daily_perfect_50',
    title: 'Perfect Catcher',
    description: 'Catch 50 items without missing',
    type: 'special',
    target: 50,
    reward: { coins: 200, experience: 80, specialReward: 'precision_skin' },
  },
  {
    id: 'daily_states_3',
    title: 'State Explorer',
    description: 'Unlock 3 new states',
    type: 'special',
    target: 3,
    reward: { coins: 300, experience: 100, specialReward: 'state_theme' },
  },
  {
    id: 'daily_powerups_10',
    title: 'Power Player',
    description: 'Use 10 power-ups',
    type: 'special',
    target: 10,
    reward: { coins: 90, experience: 50 },
  },
];

export class DailyChallengeSystem {
  private challenges: Map<string, DailyChallenge> = new Map();
  private completedChallenges: Set<string> = new Set();
  private lastRefreshDate: string = '';

  constructor() {
    this.refreshChallenges();
  }

  /**
   * Refresh daily challenges
   */
  refreshChallenges(): void {
    const today = new Date().toDateString();
    
    if (this.lastRefreshDate !== today) {
      this.lastRefreshDate = today;
      this.challenges.clear();
      this.completedChallenges.clear();

      // Select 3 random challenges for today
      const shuffled = [...DAILY_CHALLENGES].sort(() => 0.5 - Math.random());
      const selectedChallenges = shuffled.slice(0, 3);

      selectedChallenges.forEach(challenge => {
        const expiresAt = new Date();
        expiresAt.setHours(23, 59, 59, 999); // End of day

        this.challenges.set(challenge.id, {
          ...challenge,
          progress: 0,
          isCompleted: false,
          expiresAt: expiresAt.getTime(),
        });
      });

      this.saveChallenges();
    }
  }

  /**
   * Update challenge progress
   */
  updateProgress(type: string, value: number): DailyChallenge[] {
    const completed: DailyChallenge[] = [];

    this.challenges.forEach((challenge, id) => {
      if (this.completedChallenges.has(id)) return;

      if (challenge.type === type || 
          (type === 'collection' && challenge.type === 'collection')) {
        challenge.progress = Math.min(value, challenge.target);
        
        if (challenge.progress >= challenge.target && !challenge.isCompleted) {
          this.completeChallenge(id);
          completed.push(challenge);
        }
      }
    });

    return completed;
  }

  /**
   * Complete a challenge
   */
  private completeChallenge(challengeId: string): void {
    const challenge = this.challenges.get(challengeId);
    if (challenge) {
      challenge.isCompleted = true;
      this.completedChallenges.add(challengeId);
      this.saveChallenges();
    }
  }

  /**
   * Get all active challenges
   */
  getActiveChallenges(): DailyChallenge[] {
    return Array.from(this.challenges.values());
  }

  /**
   * Get completed challenges
   */
  getCompletedChallenges(): DailyChallenge[] {
    return Array.from(this.challenges.values()).filter(c => c.isCompleted);
  }

  /**
   * Get challenge by ID
   */
  getChallenge(challengeId: string): DailyChallenge | undefined {
    return this.challenges.get(challengeId);
  }

  /**
   * Check if challenge is expired
   */
  isExpired(challengeId: string): boolean {
    const challenge = this.challenges.get(challengeId);
    return challenge ? Date.now() > challenge.expiresAt : true;
  }

  /**
   * Get total rewards for completed challenges
   */
  getTotalRewards(): { coins: number; experience: number; specialRewards: string[] } {
    let totalCoins = 0;
    let totalExperience = 0;
    const specialRewards: string[] = [];

    this.getCompletedChallenges().forEach(challenge => {
      totalCoins += challenge.reward.coins;
      totalExperience += challenge.reward.experience;
      if (challenge.reward.specialReward) {
        specialRewards.push(challenge.reward.specialReward);
      }
    });

    return { coins: totalCoins, experience: totalExperience, specialRewards };
  }

  /**
   * Get progress percentage for a challenge
   */
  getProgressPercentage(challengeId: string): number {
    const challenge = this.challenges.get(challengeId);
    return challenge ? (challenge.progress / challenge.target) * 100 : 0;
  }

  /**
   * Save challenges to storage
   */
  private saveChallenges(): void {
    // In a real app, save to AsyncStorage
    console.log('Saving daily challenges:', Array.from(this.challenges.values()));
  }

  /**
   * Load challenges from storage
   */
  private loadChallenges(): void {
    // In a real app, load from AsyncStorage
    console.log('Loading daily challenges...');
  }
} 