import { eventBus } from '../core/EventBus';
import { GameEventType, gameEvents } from '../core/GameEvents';

export interface Friend {
  id: string;
  name: string;
  avatar: string;
  level: number;
  status: 'online' | 'offline' | 'playing';
  lastActive: number;
  friendshipLevel: number;
  xpToNextLevel: number;
  canSendGift: boolean;
  canReceiveGift: boolean;
  lastGiftSent?: number;
  lastGiftReceived?: number;
  favoriteGifts: string[];
  mutualFriends: string[];
  stats: FriendStats;
}

export interface FriendStats {
  giftsSent: number;
  giftsReceived: number;
  racesTogether: number;
  highestCombo: number;
  totalInteractions: number;
}

export interface Gift {
  id: string;
  type: GiftType;
  value: any;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  message?: string;
  wrapping?: string;
  expiresAt?: number;
  canBeRegifted: boolean;
  source: 'friend' | 'system' | 'event';
}

export enum GiftType {
  GOLD = 'gold',
  GEMS = 'gems',
  ENERGY = 'energy',
  POWERUP = 'powerup',
  SKIN = 'skin',
  LOOT_BOX = 'loot_box',
  BOOST = 'boost',
  LIFE = 'life',
  MYSTERY = 'mystery',
  FRIEND_PASS = 'friend_pass',
}

export interface GiftBox {
  received: GiftRecord[];
  sent: GiftRecord[];
  pending: GiftRecord[];
  history: GiftRecord[];
}

export interface GiftRecord {
  id: string;
  gift: Gift;
  from: string;
  to: string;
  timestamp: number;
  status: 'pending' | 'opened' | 'expired' | 'regifted';
  thanked: boolean;
}

export interface FriendRequest {
  id: string;
  from: string;
  to: string;
  message?: string;
  timestamp: number;
  status: 'pending' | 'accepted' | 'rejected';
  mutualFriends: string[];
}

export interface SocialChallenge {
  id: string;
  type: 'race' | 'score' | 'collect';
  challenger: string;
  challenged: string;
  stake?: Gift;
  target: number;
  deadline: number;
  status: 'pending' | 'active' | 'completed' | 'expired';
  winner?: string;
}

export interface FriendshipReward {
  level: number;
  rewards: {
    gold: number;
    gems: number;
    items: string[];
    perks: string[];
  };
}

export interface ViralMechanic {
  type: 'invite' | 'share' | 'help' | 'challenge';
  reward: Gift;
  requirements: {
    count?: number;
    withinTime?: number;
    newPlayers?: boolean;
  };
  progress: number;
}

export class FriendGiftingSystem {
  private static instance: FriendGiftingSystem;
  private friends: Map<string, Friend> = new Map();
  private giftBox: GiftBox = {
    received: [],
    sent: [],
    pending: [],
    history: [],
  };
  private friendRequests: Map<string, FriendRequest> = new Map();
  private socialChallenges: Map<string, SocialChallenge> = new Map();
  private dailyGiftLimit = 20;
  private dailyReceiveLimit = 50;
  private giftsSentToday = 0;
  private giftsReceivedToday = 0;
  private lastResetTime = 0;
  private friendshipRewards: FriendshipReward[] = [];
  private viralMechanics: Map<string, ViralMechanic> = new Map();
  private giftTemplates: Map<GiftType, Gift> = new Map();
  private updateInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.initializeGiftTemplates();
    this.initializeFriendshipRewards();
    this.initializeViralMechanics();
    this.setupEventListeners();
    this.startUpdateLoop();
  }

  static getInstance(): FriendGiftingSystem {
    if (!FriendGiftingSystem.instance) {
      FriendGiftingSystem.instance = new FriendGiftingSystem();
    }
    return FriendGiftingSystem.instance;
  }

  private initializeGiftTemplates() {
    this.giftTemplates.set(GiftType.GOLD, {
      id: 'gift_gold',
      type: GiftType.GOLD,
      value: 100,
      rarity: 'common',
      canBeRegifted: false,
      source: 'friend',
    });

    this.giftTemplates.set(GiftType.GEMS, {
      id: 'gift_gems',
      type: GiftType.GEMS,
      value: 5,
      rarity: 'rare',
      canBeRegifted: false,
      source: 'friend',
    });

    this.giftTemplates.set(GiftType.ENERGY, {
      id: 'gift_energy',
      type: GiftType.ENERGY,
      value: 1,
      rarity: 'common',
      canBeRegifted: false,
      source: 'friend',
    });

    this.giftTemplates.set(GiftType.MYSTERY, {
      id: 'gift_mystery',
      type: GiftType.MYSTERY,
      value: null,
      rarity: 'epic',
      canBeRegifted: true,
      source: 'friend',
    });

    this.giftTemplates.set(GiftType.LOOT_BOX, {
      id: 'gift_lootbox',
      type: GiftType.LOOT_BOX,
      value: { tier: 'bronze' },
      rarity: 'rare',
      canBeRegifted: false,
      source: 'friend',
    });
  }

  private initializeFriendshipRewards() {
    this.friendshipRewards = [
      {
        level: 1,
        rewards: { gold: 100, gems: 5, items: [], perks: ['gift_bonus_5'] },
      },
      {
        level: 5,
        rewards: { gold: 500, gems: 25, items: ['special_gift'], perks: ['gift_bonus_10'] },
      },
      {
        level: 10,
        rewards: { gold: 1000, gems: 50, items: ['exclusive_skin'], perks: ['double_gift_chance'] },
      },
      {
        level: 20,
        rewards: { gold: 5000, gems: 200, items: ['legendary_item'], perks: ['mega_gift'] },
      },
    ];
  }

  private initializeViralMechanics() {
    this.viralMechanics.set('invite_friends', {
      type: 'invite',
      reward: {
        id: 'invite_reward',
        type: GiftType.GEMS,
        value: 50,
        rarity: 'epic',
        canBeRegifted: false,
        source: 'system',
      },
      requirements: { count: 3, newPlayers: true },
      progress: 0,
    });

    this.viralMechanics.set('share_achievement', {
      type: 'share',
      reward: {
        id: 'share_reward',
        type: GiftType.GOLD,
        value: 1000,
        rarity: 'rare',
        canBeRegifted: false,
        source: 'system',
      },
      requirements: { count: 5 },
      progress: 0,
    });

    this.viralMechanics.set('help_friends', {
      type: 'help',
      reward: {
        id: 'help_reward',
        type: GiftType.ENERGY,
        value: 10,
        rarity: 'common',
        canBeRegifted: false,
        source: 'system',
      },
      requirements: { count: 10, withinTime: 86400000 }, // 24 hours
      progress: 0,
    });
  }

  private setupEventListeners() {
    eventBus.on('friend:request:send', (data: any) => {
      this.sendFriendRequest(data.to, data.message);
    });

    eventBus.on('friend:request:accept', (data: any) => {
      this.acceptFriendRequest(data.requestId);
    });

    eventBus.on('gift:send', (data: any) => {
      this.sendGift(data.to, data.giftType, data.message);
    });

    eventBus.on('gift:open', (data: any) => {
      this.openGift(data.giftId);
    });

    eventBus.on('challenge:send', (data: any) => {
      this.sendChallenge(data.to, data.type, data.target, data.stake);
    });

    eventBus.on('player:action:social', (data: any) => {
      this.trackSocialAction(data);
    });
  }

  private startUpdateLoop() {
    this.updateInterval = setInterval(() => {
      this.checkDailyReset();
      this.updateFriendStatuses();
      this.processExpiredGifts();
      this.checkViralProgress();
    }, 60000); // Every minute
  }

  async sendFriendRequest(toPlayerId: string, message?: string): Promise<boolean> {
    // Check if already friends
    if (this.friends.has(toPlayerId)) {
      console.log('Already friends with this player');
      return false;
    }

    // Check if request already sent
    const existingRequest = Array.from(this.friendRequests.values()).find(
      (r) => r.to === toPlayerId && r.status === 'pending'
    );

    if (existingRequest) {
      console.log('Friend request already pending');
      return false;
    }

    const request: FriendRequest = {
      id: this.generateRequestId(),
      from: 'current_player',
      to: toPlayerId,
      message,
      timestamp: Date.now(),
      status: 'pending',
      mutualFriends: this.getMutualFriends(toPlayerId),
    };

    this.friendRequests.set(request.id, request);

    gameEvents.emit(GameEventType.FRIEND_REQUEST_SENT, {
      requestId: request.id,
      to: toPlayerId,
    });

    // Notify recipient
    this.notifyPlayer(toPlayerId, 'You have a new friend request!');

    return true;
  }

  acceptFriendRequest(requestId: string): boolean {
    const request = this.friendRequests.get(requestId);
    if (!request || request.status !== 'pending') {
      return false;
    }

    request.status = 'accepted';

    // Create friend relationships
    const friend1: Friend = {
      id: request.from,
      name: 'Friend',
      avatar: 'default',
      level: 1,
      status: 'online',
      lastActive: Date.now(),
      friendshipLevel: 1,
      xpToNextLevel: 100,
      canSendGift: true,
      canReceiveGift: true,
      favoriteGifts: [],
      mutualFriends: [],
      stats: {
        giftsSent: 0,
        giftsReceived: 0,
        racesTogether: 0,
        highestCombo: 0,
        totalInteractions: 0,
      },
    };

    this.friends.set(request.from, friend1);

    gameEvents.emit(GameEventType.FRIEND_REQUEST_ACCEPTED, {
      requestId,
      newFriend: request.from,
    });

    // Send welcome gift
    this.sendSystemGift(request.from, GiftType.GOLD, 'Welcome gift!');

    // Update viral mechanics progress
    this.updateViralProgress('invite_friends', 1);

    return true;
  }

  async sendGift(
    toFriendId: string,
    giftType: GiftType,
    message?: string,
    wrapping?: string
  ): Promise<boolean> {
    // Check daily limit
    if (this.giftsSentToday >= this.dailyGiftLimit) {
      console.log('Daily gift sending limit reached');
      eventBus.emit('notification:show', {
        message: `Daily gift limit reached (${this.dailyGiftLimit})`,
        type: 'warning',
      });
      return false;
    }

    const friend = this.friends.get(toFriendId);
    if (!friend) {
      console.log('Not friends with this player');
      return false;
    }

    if (!friend.canReceiveGift) {
      console.log('Friend cannot receive gifts at this time');
      return false;
    }

    // Check cooldown
    if (friend.lastGiftSent) {
      const cooldown = 3600000; // 1 hour
      if (Date.now() - friend.lastGiftSent < cooldown) {
        console.log('Gift cooldown not expired');
        return false;
      }
    }

    const template = this.giftTemplates.get(giftType);
    if (!template) {
      console.log('Invalid gift type');
      return false;
    }

    const gift: Gift = {
      ...template,
      id: this.generateGiftId(),
      message,
      wrapping: wrapping || this.getSeasonalWrapping(),
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    };

    const record: GiftRecord = {
      id: this.generateRecordId(),
      gift,
      from: 'current_player',
      to: toFriendId,
      timestamp: Date.now(),
      status: 'pending',
      thanked: false,
    };

    this.giftBox.sent.push(record);
    this.giftsSentToday++;
    friend.lastGiftSent = Date.now();

    // Update friendship XP
    this.addFriendshipXP(toFriendId, 10);

    gameEvents.emit(GameEventType.GIFT_SENT, {
      fromPlayerId: 'current_player',
      toPlayerId: toFriendId,
      giftType: giftType,
      giftValue: gift.value,
    });

    // Notify recipient
    this.notifyPlayer(toFriendId, `You received a gift from a friend!`);

    // Update stats
    friend.stats.giftsSent++;
    this.updateViralProgress('help_friends', 1);

    return true;
  }

  async sendMassGift(giftType: GiftType): Promise<number> {
    let sentCount = 0;
    const eligibleFriends = Array.from(this.friends.values()).filter(
      (f) => f.canReceiveGift && (!f.lastGiftSent || Date.now() - f.lastGiftSent > 3600000)
    );

    for (const friend of eligibleFriends) {
      if (this.giftsSentToday >= this.dailyGiftLimit) break;

      if (await this.sendGift(friend.id, giftType, 'Mass gift!')) {
        sentCount++;
      }

      // Small delay to prevent spam
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    eventBus.emit('notification:show', {
      message: `Sent gifts to ${sentCount} friends!`,
      type: 'success',
    });

    return sentCount;
  }

  openGift(giftId: string): boolean {
    const recordIndex = this.giftBox.received.findIndex((r) => r.gift.id === giftId);
    if (recordIndex === -1) {
      console.log('Gift not found');
      return false;
    }

    const record = this.giftBox.received[recordIndex];

    if (record.status !== 'pending') {
      console.log('Gift already opened');
      return false;
    }

    // Check expiration
    if (record.gift.expiresAt && Date.now() > record.gift.expiresAt) {
      record.status = 'expired';
      this.giftBox.history.push(record);
      this.giftBox.received.splice(recordIndex, 1);
      console.log('Gift has expired');
      return false;
    }

    // Apply gift rewards
    this.applyGiftRewards(record.gift);

    record.status = 'opened';
    this.giftBox.history.push(record);
    this.giftBox.received.splice(recordIndex, 1);

    // Update friendship XP with sender
    this.addFriendshipXP(record.from, 5);

    // Update stats
    const friend = this.friends.get(record.from);
    if (friend) {
      friend.stats.giftsReceived++;
    }

    gameEvents.emit(GameEventType.GIFT_RECEIVED, {
      fromPlayerId: record.from,
      toPlayerId: 'current_player',
      giftType: record.gift.type,
      giftValue: record.gift.value,
    });

    // Auto-thank option
    if (!record.thanked) {
      this.thankForGift(record.from);
      record.thanked = true;
    }

    return true;
  }

  private applyGiftRewards(gift: Gift) {
    switch (gift.type) {
      case GiftType.GOLD:
        gameEvents.emit(GameEventType.CURRENCY_EARNED, {
          type: 'gold',
          amount: gift.value,
          source: 'friend_gift',
        });
        break;

      case GiftType.GEMS:
        gameEvents.emit(GameEventType.CURRENCY_EARNED, {
          type: 'gems',
          amount: gift.value,
          source: 'friend_gift',
        });
        break;

      case GiftType.ENERGY:
        eventBus.emit('energy:add', { amount: gift.value });
        break;

      case GiftType.MYSTERY:
        this.openMysteryGift(gift);
        break;

      case GiftType.LOOT_BOX:
        eventBus.emit('lootbox:add', { tier: gift.value.tier });
        break;

      case GiftType.POWERUP:
        eventBus.emit('powerup:add', { type: gift.value });
        break;
    }
  }

  private openMysteryGift(gift: Gift) {
    // Random reward from mystery gift
    const rewards = [
      { type: GiftType.GOLD, value: Math.floor(Math.random() * 1000) + 500 },
      { type: GiftType.GEMS, value: Math.floor(Math.random() * 50) + 10 },
      { type: GiftType.ENERGY, value: 5 },
      { type: GiftType.LOOT_BOX, value: { tier: 'silver' } },
    ];

    const reward = rewards[Math.floor(Math.random() * rewards.length)];
    gift.value = reward.value;
    gift.type = reward.type;

    this.applyGiftRewards(gift);

    eventBus.emit('notification:show', {
      message: `Mystery gift revealed: ${reward.type} x${reward.value}!`,
      type: 'success',
    });
  }

  async sendChallenge(
    toFriendId: string,
    type: 'race' | 'score' | 'collect',
    target: number,
    stake?: Gift
  ): Promise<boolean> {
    const friend = this.friends.get(toFriendId);
    if (!friend) {
      console.log('Not friends with this player');
      return false;
    }

    const challenge: SocialChallenge = {
      id: this.generateChallengeId(),
      type,
      challenger: 'current_player',
      challenged: toFriendId,
      stake,
      target,
      deadline: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
      status: 'pending',
    };

    this.socialChallenges.set(challenge.id, challenge);

    eventBus.emit('challenge:sent', {
      challengeId: challenge.id,
      to: toFriendId,
      type,
    });

    this.notifyPlayer(toFriendId, `You've been challenged to a ${type}!`);

    return true;
  }

  acceptChallenge(challengeId: string): boolean {
    const challenge = this.socialChallenges.get(challengeId);
    if (!challenge || challenge.status !== 'pending') {
      return false;
    }

    challenge.status = 'active';

    eventBus.emit('challenge:accepted', {
      challengeId,
      type: challenge.type,
      target: challenge.target,
    });

    // Start tracking challenge progress
    this.trackChallengeProgress(challenge);

    return true;
  }

  private trackChallengeProgress(challenge: SocialChallenge) {
    // This would track actual gameplay and determine winner
    eventBus.on(`challenge:${challenge.type}:update`, (data: any) => {
      if (data.challengeId !== challenge.id) return;

      if (data.score >= challenge.target) {
        this.completeChallenge(challenge, data.playerId);
      }
    });
  }

  private completeChallenge(challenge: SocialChallenge, winnerId: string) {
    challenge.status = 'completed';
    challenge.winner = winnerId;

    // Award stake to winner
    if (challenge.stake) {
      if (winnerId === 'current_player') {
        this.applyGiftRewards(challenge.stake);
      }
    }

    // Award friendship XP
    const friendId = winnerId === 'current_player' ? challenge.challenged : challenge.challenger;
    this.addFriendshipXP(friendId, 20);

    eventBus.emit('challenge:completed', {
      challengeId: challenge.id,
      winner: winnerId,
    });
  }

  private addFriendshipXP(friendId: string, amount: number) {
    const friend = this.friends.get(friendId);
    if (!friend) return;

    friend.friendshipLevel += amount;

    while (friend.friendshipLevel >= friend.xpToNextLevel) {
      friend.friendshipLevel -= friend.xpToNextLevel;
      friend.friendshipLevel++;
      friend.xpToNextLevel = this.calculateXPToNextLevel(friend.friendshipLevel);

      // Check for friendship rewards
      this.checkFriendshipRewards(friend);
    }

    friend.stats.totalInteractions++;
  }

  private calculateXPToNextLevel(level: number): number {
    return 100 * level * Math.pow(1.2, level - 1);
  }

  private checkFriendshipRewards(friend: Friend) {
    const reward = this.friendshipRewards.find((r) => r.level === friend.friendshipLevel);
    if (reward) {
      // Award rewards
      gameEvents.emit(GameEventType.CURRENCY_EARNED, {
        type: 'gold',
        amount: reward.rewards.gold,
        source: 'friendship_level',
      });

      gameEvents.emit(GameEventType.CURRENCY_EARNED, {
        type: 'gems',
        amount: reward.rewards.gems,
        source: 'friendship_level',
      });

      eventBus.emit('notification:show', {
        message: `Friendship level ${friend.friendshipLevel} reached with ${friend.name}!`,
        type: 'success',
      });
    }
  }

  private thankForGift(friendId: string) {
    // Send thank you message
    eventBus.emit('message:send', {
      to: friendId,
      message: 'Thanks for the gift!',
      type: 'auto_thank',
    });
  }

  private checkDailyReset() {
    const now = Date.now();
    const dayStart = new Date().setHours(0, 0, 0, 0);

    if (this.lastResetTime < dayStart) {
      this.giftsSentToday = 0;
      this.giftsReceivedToday = 0;
      this.lastResetTime = now;

      // Reset friend gift status
      this.friends.forEach((friend) => {
        friend.canSendGift = true;
        friend.canReceiveGift = true;
      });

      eventBus.emit('gifts:daily:reset');
    }
  }

  private updateFriendStatuses() {
    // This would normally fetch from server
    this.friends.forEach((friend) => {
      // Simulate status updates
      const random = Math.random();
      if (random < 0.3) {
        friend.status = 'online';
      } else if (random < 0.5) {
        friend.status = 'playing';
      } else {
        friend.status = 'offline';
      }
    });
  }

  private processExpiredGifts() {
    const now = Date.now();

    this.giftBox.received = this.giftBox.received.filter((record) => {
      if (record.gift.expiresAt && now > record.gift.expiresAt) {
        record.status = 'expired';
        this.giftBox.history.push(record);
        return false;
      }
      return true;
    });
  }

  private trackSocialAction(data: any) {
    // Track actions for viral mechanics
    switch (data.action) {
      case 'share':
        this.updateViralProgress('share_achievement', 1);
        break;
      case 'invite':
        if (data.newPlayer) {
          this.updateViralProgress('invite_friends', 1);
        }
        break;
    }
  }

  private updateViralProgress(mechanicId: string, amount: number) {
    const mechanic = this.viralMechanics.get(mechanicId);
    if (!mechanic) return;

    mechanic.progress += amount;

    if (mechanic.requirements.count && mechanic.progress >= mechanic.requirements.count) {
      // Award viral reward
      this.applyGiftRewards(mechanic.reward);
      mechanic.progress = 0;

      eventBus.emit('viral:reward:earned', {
        mechanicId,
        reward: mechanic.reward,
      });
    }
  }

  private checkViralProgress() {
    this.viralMechanics.forEach((mechanic, id) => {
      if (mechanic.requirements.withinTime) {
        // Reset progress if time expired
        // This would track actual time windows
      }
    });
  }

  private sendSystemGift(toPlayerId: string, giftType: GiftType, message: string) {
    const template = this.giftTemplates.get(giftType);
    if (!template) return;

    const gift: Gift = {
      ...template,
      id: this.generateGiftId(),
      message,
      source: 'system',
    };

    const record: GiftRecord = {
      id: this.generateRecordId(),
      gift,
      from: 'system',
      to: toPlayerId,
      timestamp: Date.now(),
      status: 'pending',
      thanked: false,
    };

    this.giftBox.received.push(record);
  }

  private getMutualFriends(playerId: string): string[] {
    // Get mutual friends between current player and target
    return [];
  }

  private getSeasonalWrapping(): string {
    const month = new Date().getMonth();
    if (month === 11) return 'christmas';
    if (month === 9) return 'halloween';
    if (month === 1) return 'valentine';
    return 'default';
  }

  private notifyPlayer(playerId: string, message: string) {
    eventBus.emit('notification:player', { playerId, message });
  }

  // ID generators
  private generateGiftId(): string {
    return `gift_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateRecordId(): string {
    return `record_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateRequestId(): string {
    return `request_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateChallengeId(): string {
    return `challenge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public methods
  getFriends(): Friend[] {
    return Array.from(this.friends.values());
  }

  getFriend(friendId: string): Friend | null {
    return this.friends.get(friendId) || null;
  }

  getGiftBox(): GiftBox {
    return this.giftBox;
  }

  getPendingGifts(): GiftRecord[] {
    return this.giftBox.received.filter((r) => r.status === 'pending');
  }

  getFriendRequests(): FriendRequest[] {
    return Array.from(this.friendRequests.values()).filter((r) => r.status === 'pending');
  }

  getActiveChallenges(): SocialChallenge[] {
    return Array.from(this.socialChallenges.values()).filter((c) => c.status === 'active');
  }

  getViralProgress(): Map<string, ViralMechanic> {
    return this.viralMechanics;
  }

  getRemainingGifts(): { send: number; receive: number } {
    return {
      send: Math.max(0, this.dailyGiftLimit - this.giftsSentToday),
      receive: Math.max(0, this.dailyReceiveLimit - this.giftsReceivedToday),
    };
  }

  cleanup() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }
}

export const friendGiftingSystem = FriendGiftingSystem.getInstance();
