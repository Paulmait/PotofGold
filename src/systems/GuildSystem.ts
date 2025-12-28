import { eventBus } from '../core/EventBus';
import { GameEventType, gameEvents } from '../core/GameEvents';
import { gameStateMachine, GameTransition } from '../core/GameStateMachine';

export interface Guild {
  id: string;
  name: string;
  tag: string; // 3-5 character tag
  description: string;
  icon: string;
  banner: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  members: GuildMember[];
  maxMembers: number;
  treasury: {
    gold: number;
    gems: number;
    items: Map<string, number>;
  };
  perks: GuildPerk[];
  achievements: string[];
  warHistory: GuildWarRecord[];
  createdAt: number;
  leader: string;
  officers: string[];
  settings: GuildSettings;
  weeklyContribution: number;
  seasonPoints: number;
}

export interface GuildMember {
  playerId: string;
  name: string;
  avatar: string;
  level: number;
  role: 'leader' | 'officer' | 'member';
  joinedAt: number;
  lastActive: number;
  weeklyContribution: number;
  totalContribution: number;
  warParticipation: number;
  permissions: GuildPermission[];
}

export interface GuildPerk {
  id: string;
  name: string;
  description: string;
  level: number;
  maxLevel: number;
  effects: PerkEffect[];
  cost: { gold: number; gems: number };
  requirements: { guildLevel: number; memberCount?: number };
}

export interface PerkEffect {
  type: 'gold_bonus' | 'xp_bonus' | 'item_bonus' | 'spawn_rate' | 'powerup_duration';
  value: number;
  isPercentage: boolean;
}

export interface GuildWar {
  id: string;
  attackingGuild: Guild;
  defendingGuild: Guild;
  status: 'preparation' | 'active' | 'ended';
  startTime: number;
  endTime: number;
  duration: number;
  score: {
    attacking: number;
    defending: number;
  };
  participants: Map<string, WarParticipant>;
  rewards: WarRewards;
  objectives: WarObjective[];
  events: WarEvent[];
}

export interface WarParticipant {
  playerId: string;
  guildId: string;
  score: number;
  kills: number;
  deaths: number;
  objectivesCaptured: number;
  contribution: number;
}

export interface WarObjective {
  id: string;
  name: string;
  type: 'capture_point' | 'resource_node' | 'boss_defeat';
  controlledBy?: string;
  points: number;
  captureProgress: number;
  captureTime: number;
  bonuses: string[];
}

export interface WarRewards {
  winner: { gold: number; gems: number; guildXp: number; items: any[] };
  loser: { gold: number; gems: number; guildXp: number; items: any[] };
  mvp: { gold: number; gems: number; items: any[] };
}

export interface GuildWarRecord {
  warId: string;
  opponent: string;
  result: 'win' | 'loss' | 'draw';
  score: { us: number; them: number };
  date: number;
  mvp: string;
}

export interface GuildSettings {
  joinType: 'open' | 'invite' | 'request';
  minLevel: number;
  autoKickInactiveDays: number;
  warParticipation: 'optional' | 'mandatory';
  language: string;
  timezone: string;
}

export interface GuildPermission {
  action: 'invite' | 'kick' | 'promote' | 'start_war' | 'use_treasury' | 'edit_settings';
  granted: boolean;
}

export interface GuildQuest {
  id: string;
  name: string;
  description: string;
  type: 'daily' | 'weekly' | 'special';
  requirements: QuestRequirement[];
  progress: number;
  target: number;
  rewards: { gold: number; gems: number; guildXp: number };
  expiresAt: number;
}

export interface QuestRequirement {
  type: 'collect_gold' | 'win_races' | 'donate_items' | 'participate_war';
  amount: number;
  current: number;
}

export interface WarEvent {
  timestamp: number;
  type: 'objective_captured' | 'player_kill' | 'boss_spawned' | 'bonus_activated';
  data: any;
}

export class GuildSystem {
  private static instance: GuildSystem;
  private currentGuild: Guild | null = null;
  private availableGuilds: Guild[] = [];
  private currentWar: GuildWar | null = null;
  private guildQuests: GuildQuest[] = [];
  private invitations: Map<string, string[]> = new Map(); // guildId -> playerIds
  private warSchedule: Map<string, number> = new Map(); // guildId -> warStartTime
  private guildChat: Map<string, any[]> = new Map(); // guildId -> messages
  private updateInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.setupEventListeners();
    this.startUpdateLoop();
  }

  static getInstance(): GuildSystem {
    if (!GuildSystem.instance) {
      GuildSystem.instance = new GuildSystem();
    }
    return GuildSystem.instance;
  }

  private setupEventListeners() {
    eventBus.on('guild:create', (data: any) => {
      this.createGuild(data);
    });

    eventBus.on('guild:join', (data: { guildId: string; playerId: string }) => {
      this.joinGuild(data.guildId, data.playerId);
    });

    eventBus.on('guild:leave', (data: { playerId: string }) => {
      this.leaveGuild(data.playerId);
    });

    eventBus.on('guild:contribute', (data: any) => {
      this.contributeToGuild(data);
    });

    eventBus.on('guild:war:start', (data: { targetGuildId: string }) => {
      this.startGuildWar(data.targetGuildId);
    });

    eventBus.on('guild:war:participate', (data: any) => {
      this.participateInWar(data);
    });
  }

  private startUpdateLoop() {
    this.updateInterval = setInterval(() => {
      this.updateGuildQuests();
      this.updateWarStatus();
      this.checkInactiveMembers();
    }, 60000); // Update every minute
  }

  async createGuild(data: {
    name: string;
    tag: string;
    description: string;
    leaderId: string;
  }): Promise<Guild> {
    const guild: Guild = {
      id: this.generateGuildId(),
      name: data.name,
      tag: data.tag.toUpperCase(),
      description: data.description,
      icon: 'default_icon',
      banner: 'default_banner',
      level: 1,
      xp: 0,
      xpToNextLevel: 1000,
      members: [],
      maxMembers: 30,
      treasury: {
        gold: 0,
        gems: 0,
        items: new Map(),
      },
      perks: this.getDefaultPerks(),
      achievements: [],
      warHistory: [],
      createdAt: Date.now(),
      leader: data.leaderId,
      officers: [],
      settings: this.getDefaultSettings(),
      weeklyContribution: 0,
      seasonPoints: 0,
    };

    // Add leader as first member
    const leader: GuildMember = {
      playerId: data.leaderId,
      name: 'Guild Leader',
      avatar: 'default',
      level: 1,
      role: 'leader',
      joinedAt: Date.now(),
      lastActive: Date.now(),
      weeklyContribution: 0,
      totalContribution: 0,
      warParticipation: 0,
      permissions: this.getAllPermissions(),
    };

    guild.members.push(leader);
    this.currentGuild = guild;

    gameEvents.emit(GameEventType.GUILD_CREATED, {
      guildId: guild.id,
      guildName: guild.name,
    });

    return guild;
  }

  async joinGuild(guildId: string, playerId: string): Promise<boolean> {
    const guild = this.findGuild(guildId);
    if (!guild) return false;

    if (guild.members.length >= guild.maxMembers) {
      console.log('Guild is full');
      return false;
    }

    const member: GuildMember = {
      playerId,
      name: await this.getPlayerName(playerId),
      avatar: 'default',
      level: 1,
      role: 'member',
      joinedAt: Date.now(),
      lastActive: Date.now(),
      weeklyContribution: 0,
      totalContribution: 0,
      warParticipation: 0,
      permissions: this.getMemberPermissions(),
    };

    guild.members.push(member);

    gameEvents.emit(GameEventType.GUILD_JOINED, {
      guildId,
      playerId,
    });

    // Apply guild perks to new member
    this.applyGuildPerks(playerId, guild.perks);

    return true;
  }

  async leaveGuild(playerId: string): Promise<boolean> {
    if (!this.currentGuild) return false;

    const memberIndex = this.currentGuild.members.findIndex((m) => m.playerId === playerId);

    if (memberIndex === -1) return false;

    const member = this.currentGuild.members[memberIndex];

    // Check if leader is leaving
    if (member.role === 'leader') {
      // Promote an officer or highest contributing member
      const newLeader = this.findNewLeader();
      if (newLeader) {
        newLeader.role = 'leader';
        this.currentGuild.leader = newLeader.playerId;
      } else {
        // Disband guild if no suitable replacement
        this.disbandGuild();
        return true;
      }
    }

    this.currentGuild.members.splice(memberIndex, 1);

    gameEvents.emit(GameEventType.GUILD_LEFT, {
      guildId: this.currentGuild.id,
      playerId,
    });

    // Remove guild perks from player
    this.removeGuildPerks(playerId);

    return true;
  }

  contributeToGuild(data: {
    playerId: string;
    type: 'gold' | 'gems' | 'items';
    amount: number;
    itemId?: string;
  }) {
    if (!this.currentGuild) return;

    const member = this.currentGuild.members.find((m) => m.playerId === data.playerId);

    if (!member) return;

    // Update treasury
    switch (data.type) {
      case 'gold':
        this.currentGuild.treasury.gold += data.amount;
        break;
      case 'gems':
        this.currentGuild.treasury.gems += data.amount;
        break;
      case 'items':
        if (data.itemId) {
          const currentAmount = this.currentGuild.treasury.items.get(data.itemId) || 0;
          this.currentGuild.treasury.items.set(data.itemId, currentAmount + data.amount);
        }
        break;
    }

    // Update member contribution
    member.weeklyContribution += data.amount;
    member.totalContribution += data.amount;
    this.currentGuild.weeklyContribution += data.amount;

    // Award guild XP
    const xpGained = Math.floor(data.amount / 10);
    this.addGuildXP(xpGained);

    gameEvents.emit(GameEventType.GUILD_CONTRIBUTION, {
      guildId: this.currentGuild.id,
      playerId: data.playerId,
      contribution: data.amount,
      type: data.type,
    });

    // Check for contribution achievements
    this.checkContributionAchievements(member);
  }

  async startGuildWar(targetGuildId: string): Promise<boolean> {
    if (!this.currentGuild) return false;

    const targetGuild = this.findGuild(targetGuildId);
    if (!targetGuild) return false;

    // Check if already in war
    if (this.currentWar && this.currentWar.status === 'active') {
      console.log('Already in an active war');
      return false;
    }

    // Check war cooldown
    const lastWar = this.currentGuild.warHistory[0];
    if (lastWar) {
      const cooldownPeriod = 24 * 60 * 60 * 1000; // 24 hours
      if (Date.now() - lastWar.date < cooldownPeriod) {
        console.log('War cooldown not expired');
        return false;
      }
    }

    // Create war instance
    this.currentWar = {
      id: this.generateWarId(),
      attackingGuild: this.currentGuild,
      defendingGuild: targetGuild,
      status: 'preparation',
      startTime: Date.now() + 3600000, // Start in 1 hour
      endTime: Date.now() + 7200000, // End in 2 hours
      duration: 3600000, // 1 hour duration
      score: { attacking: 0, defending: 0 },
      participants: new Map(),
      rewards: this.calculateWarRewards(),
      objectives: this.generateWarObjectives(),
      events: [],
    };

    gameEvents.emit(GameEventType.GUILD_WAR_START, {
      warId: this.currentWar.id,
      attackingGuild: this.currentGuild.id,
      defendingGuild: targetGuildId,
    });

    // Notify all guild members
    this.notifyGuildMembers('War declared!', `War against ${targetGuild.name} starts in 1 hour!`);

    // Schedule war start
    setTimeout(() => {
      this.activateWar();
    }, 3600000);

    return true;
  }

  private activateWar() {
    if (!this.currentWar) return;

    this.currentWar.status = 'active';

    gameStateMachine.transition(GameTransition.JOIN_GUILD_WAR);

    // Start war objectives
    this.currentWar.objectives.forEach((objective) => {
      this.activateObjective(objective);
    });

    // Start war timer
    setTimeout(() => {
      this.endWar();
    }, this.currentWar.duration);
  }

  private participateInWar(data: {
    playerId: string;
    action: 'capture' | 'defend' | 'collect' | 'defeat';
    objectiveId?: string;
    value: number;
  }) {
    if (!this.currentWar || this.currentWar.status !== 'active') return;

    let participant = this.currentWar.participants.get(data.playerId);
    if (!participant) {
      const member = this.currentGuild?.members.find((m) => m.playerId === data.playerId);
      if (!member) return;

      participant = {
        playerId: data.playerId,
        guildId: this.currentGuild!.id,
        score: 0,
        kills: 0,
        deaths: 0,
        objectivesCaptured: 0,
        contribution: 0,
      };

      this.currentWar.participants.set(data.playerId, participant);
    }

    // Update participant stats based on action
    switch (data.action) {
      case 'capture':
        if (data.objectiveId) {
          const objective = this.currentWar.objectives.find((o) => o.id === data.objectiveId);
          if (objective) {
            this.captureObjective(objective, participant);
          }
        }
        break;
      case 'defend':
        participant.score += data.value * 2;
        participant.contribution += data.value;
        break;
      case 'collect':
        participant.score += data.value;
        participant.contribution += data.value / 2;
        break;
      case 'defeat':
        participant.kills++;
        participant.score += 100;
        break;
    }

    // Update guild score
    const isAttacking = participant.guildId === this.currentWar.attackingGuild.id;
    if (isAttacking) {
      this.currentWar.score.attacking += data.value;
    } else {
      this.currentWar.score.defending += data.value;
    }

    // Record war event
    this.currentWar.events.push({
      timestamp: Date.now(),
      type: 'player_kill',
      data: { playerId: data.playerId, action: data.action, value: data.value },
    });
  }

  private captureObjective(objective: WarObjective, participant: WarParticipant) {
    objective.captureProgress += 10;

    if (objective.captureProgress >= 100) {
      objective.controlledBy = participant.guildId;
      objective.captureProgress = 0;
      participant.objectivesCaptured++;
      participant.score += objective.points;

      this.currentWar!.events.push({
        timestamp: Date.now(),
        type: 'objective_captured',
        data: { objectiveId: objective.id, capturedBy: participant.playerId },
      });

      // Apply objective bonuses
      this.applyObjectiveBonuses(objective);
    }
  }

  private endWar() {
    if (!this.currentWar) return;

    this.currentWar.status = 'ended';

    // Determine winner
    const winner =
      this.currentWar.score.attacking > this.currentWar.score.defending
        ? this.currentWar.attackingGuild
        : this.currentWar.defendingGuild;

    const loser =
      winner === this.currentWar.attackingGuild
        ? this.currentWar.defendingGuild
        : this.currentWar.attackingGuild;

    // Award rewards
    this.awardWarRewards(winner, loser);

    // Record war history
    if (this.currentGuild) {
      const record: GuildWarRecord = {
        warId: this.currentWar.id,
        opponent: winner === this.currentGuild ? loser.name : winner.name,
        result: winner === this.currentGuild ? 'win' : 'loss',
        score: {
          us:
            winner === this.currentGuild
              ? this.currentWar.score.attacking
              : this.currentWar.score.defending,
          them:
            winner === this.currentGuild
              ? this.currentWar.score.defending
              : this.currentWar.score.attacking,
        },
        date: Date.now(),
        mvp: this.findWarMVP(),
      };

      this.currentGuild.warHistory.unshift(record);
      if (this.currentGuild.warHistory.length > 50) {
        this.currentGuild.warHistory = this.currentGuild.warHistory.slice(0, 50);
      }
    }

    gameEvents.emit(GameEventType.GUILD_WAR_END, {
      warId: this.currentWar.id,
      winner: winner.id,
      loser: loser.id,
      score: this.currentWar.score,
    });

    this.currentWar = null;
  }

  private awardWarRewards(winner: Guild, loser: Guild) {
    if (!this.currentWar) return;

    // Award winner rewards
    winner.treasury.gold += this.currentWar.rewards.winner.gold;
    winner.treasury.gems += this.currentWar.rewards.winner.gems;
    this.addGuildXP(this.currentWar.rewards.winner.guildXp, winner);

    // Award loser rewards (participation)
    loser.treasury.gold += this.currentWar.rewards.loser.gold;
    loser.treasury.gems += this.currentWar.rewards.loser.gems;
    this.addGuildXP(this.currentWar.rewards.loser.guildXp, loser);

    // Award MVP rewards
    const mvpId = this.findWarMVP();
    if (mvpId) {
      gameEvents.emit(GameEventType.CURRENCY_EARNED, {
        type: 'gold',
        amount: this.currentWar.rewards.mvp.gold,
        source: 'guild_war_mvp',
      });
    }
  }

  private findWarMVP(): string {
    if (!this.currentWar) return '';

    let mvp: WarParticipant | null = null;
    let highestScore = 0;

    this.currentWar.participants.forEach((participant) => {
      if (participant.score > highestScore) {
        highestScore = participant.score;
        mvp = participant;
      }
    });

    return mvp?.playerId || '';
  }

  upgradePerk(perkId: string): boolean {
    if (!this.currentGuild) return false;

    const perk = this.currentGuild.perks.find((p) => p.id === perkId);
    if (!perk) return false;

    if (perk.level >= perk.maxLevel) return false;

    // Check requirements
    if (this.currentGuild.level < perk.requirements.guildLevel) return false;

    // Check cost
    if (
      this.currentGuild.treasury.gold < perk.cost.gold ||
      this.currentGuild.treasury.gems < perk.cost.gems
    ) {
      return false;
    }

    // Deduct cost
    this.currentGuild.treasury.gold -= perk.cost.gold;
    this.currentGuild.treasury.gems -= perk.cost.gems;

    // Upgrade perk
    perk.level++;

    // Update perk effects
    perk.effects.forEach((effect) => {
      effect.value = this.calculatePerkValue(effect, perk.level);
    });

    // Apply to all members
    this.currentGuild.members.forEach((member) => {
      this.applyGuildPerks(member.playerId, [perk]);
    });

    return true;
  }

  private calculatePerkValue(effect: PerkEffect, level: number): number {
    const baseValue = effect.value;
    const increment = effect.isPercentage ? 2 : 10;
    return baseValue + increment * (level - 1);
  }

  private updateGuildQuests() {
    // Remove expired quests
    this.guildQuests = this.guildQuests.filter((q) => q.expiresAt > Date.now());

    // Add new daily quests if needed
    const dailyQuests = this.guildQuests.filter((q) => q.type === 'daily');
    if (dailyQuests.length < 3) {
      this.guildQuests.push(this.generateDailyQuest());
    }

    // Check quest completion
    this.guildQuests.forEach((quest) => {
      if (quest.progress >= quest.target) {
        this.completeQuest(quest);
      }
    });
  }

  private completeQuest(quest: GuildQuest) {
    if (!this.currentGuild) return;

    // Award rewards
    this.currentGuild.treasury.gold += quest.rewards.gold;
    this.currentGuild.treasury.gems += quest.rewards.gems;
    this.addGuildXP(quest.rewards.guildXp);

    // Remove completed quest
    const index = this.guildQuests.indexOf(quest);
    if (index !== -1) {
      this.guildQuests.splice(index, 1);
    }

    // Notify guild
    this.notifyGuildMembers('Quest Complete!', `${quest.name} has been completed!`);
  }

  private updateWarStatus() {
    if (!this.currentWar) return;

    if (this.currentWar.status === 'preparation' && Date.now() >= this.currentWar.startTime) {
      this.activateWar();
    }

    if (this.currentWar.status === 'active' && Date.now() >= this.currentWar.endTime) {
      this.endWar();
    }
  }

  private checkInactiveMembers() {
    if (!this.currentGuild) return;

    const inactivePeriod = this.currentGuild.settings.autoKickInactiveDays * 24 * 60 * 60 * 1000;
    if (inactivePeriod === 0) return;

    const now = Date.now();
    const toKick: string[] = [];

    this.currentGuild.members.forEach((member) => {
      if (member.role !== 'leader' && now - member.lastActive > inactivePeriod) {
        toKick.push(member.playerId);
      }
    });

    toKick.forEach((playerId) => {
      this.leaveGuild(playerId);
      this.notifyPlayer(playerId, 'Kicked from guild due to inactivity');
    });
  }

  private addGuildXP(amount: number, guild: Guild = this.currentGuild!) {
    if (!guild) return;

    guild.xp += amount;

    while (guild.xp >= guild.xpToNextLevel) {
      guild.xp -= guild.xpToNextLevel;
      guild.level++;
      guild.xpToNextLevel = this.calculateXPToNextLevel(guild.level);
      guild.maxMembers = Math.min(100, 30 + (guild.level - 1) * 2);

      this.notifyGuildMembers('Guild Level Up!', `Guild reached level ${guild.level}!`);
      this.unlockNewPerks(guild);
    }
  }

  private calculateXPToNextLevel(level: number): number {
    return 1000 * level * Math.pow(1.5, level - 1);
  }

  // Helper methods
  private generateGuildId(): string {
    return `guild_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateWarId(): string {
    return `war_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private findGuild(guildId: string): Guild | null {
    if (this.currentGuild?.id === guildId) return this.currentGuild;
    return this.availableGuilds.find((g) => g.id === guildId) || null;
  }

  private findNewLeader(): GuildMember | null {
    if (!this.currentGuild) return null;

    // First try officers
    const officer = this.currentGuild.members.find((m) => m.role === 'officer');
    if (officer) return officer;

    // Then highest contributor
    return (
      this.currentGuild.members
        .filter((m) => m.role !== 'leader')
        .sort((a, b) => b.totalContribution - a.totalContribution)[0] || null
    );
  }

  private disbandGuild() {
    if (!this.currentGuild) return;

    this.notifyGuildMembers('Guild Disbanded', 'The guild has been disbanded.');
    this.currentGuild = null;
  }

  private getDefaultPerks(): GuildPerk[] {
    return [
      {
        id: 'gold_boost',
        name: 'Golden Treasury',
        description: 'Increases gold earned by all members',
        level: 1,
        maxLevel: 10,
        effects: [
          {
            type: 'gold_bonus',
            value: 5,
            isPercentage: true,
          },
        ],
        cost: { gold: 1000, gems: 0 },
        requirements: { guildLevel: 1 },
      },
      {
        id: 'xp_boost',
        name: 'Wisdom Sharing',
        description: 'Increases XP earned by all members',
        level: 1,
        maxLevel: 10,
        effects: [
          {
            type: 'xp_bonus',
            value: 5,
            isPercentage: true,
          },
        ],
        cost: { gold: 1500, gems: 0 },
        requirements: { guildLevel: 2 },
      },
    ];
  }

  private getDefaultSettings(): GuildSettings {
    return {
      joinType: 'request',
      minLevel: 1,
      autoKickInactiveDays: 14,
      warParticipation: 'optional',
      language: 'en',
      timezone: 'UTC',
    };
  }

  private getAllPermissions(): GuildPermission[] {
    return [
      { action: 'invite', granted: true },
      { action: 'kick', granted: true },
      { action: 'promote', granted: true },
      { action: 'start_war', granted: true },
      { action: 'use_treasury', granted: true },
      { action: 'edit_settings', granted: true },
    ];
  }

  private getMemberPermissions(): GuildPermission[] {
    return [
      { action: 'invite', granted: false },
      { action: 'kick', granted: false },
      { action: 'promote', granted: false },
      { action: 'start_war', granted: false },
      { action: 'use_treasury', granted: false },
      { action: 'edit_settings', granted: false },
    ];
  }

  private async getPlayerName(playerId: string): Promise<string> {
    // Get from firebase/storage
    return 'Player';
  }

  private applyGuildPerks(playerId: string, perks: GuildPerk[]) {
    // Apply perk effects to player
    perks.forEach((perk) => {
      perk.effects.forEach((effect) => {
        eventBus.emit('perk:apply', {
          playerId,
          type: effect.type,
          value: effect.value,
          isPercentage: effect.isPercentage,
        });
      });
    });
  }

  private removeGuildPerks(playerId: string) {
    eventBus.emit('perk:remove:all', { playerId });
  }

  private checkContributionAchievements(member: GuildMember) {
    // Check and award contribution achievements
  }

  private calculateWarRewards(): WarRewards {
    return {
      winner: { gold: 50000, gems: 500, guildXp: 5000, items: [] },
      loser: { gold: 10000, gems: 100, guildXp: 1000, items: [] },
      mvp: { gold: 10000, gems: 100, items: [] },
    };
  }

  private generateWarObjectives(): WarObjective[] {
    return [
      {
        id: 'obj_1',
        name: 'Gold Mine',
        type: 'capture_point',
        points: 100,
        captureProgress: 0,
        captureTime: 30000,
        bonuses: ['gold_generation'],
      },
      {
        id: 'obj_2',
        name: 'Crystal Tower',
        type: 'capture_point',
        points: 150,
        captureProgress: 0,
        captureTime: 45000,
        bonuses: ['power_boost'],
      },
      {
        id: 'obj_3',
        name: 'Dragon Boss',
        type: 'boss_defeat',
        points: 500,
        captureProgress: 0,
        captureTime: 60000,
        bonuses: ['mega_rewards'],
      },
    ];
  }

  private activateObjective(objective: WarObjective) {
    // Activate war objective
    eventBus.emit('war:objective:activated', { objective });
  }

  private applyObjectiveBonuses(objective: WarObjective) {
    // Apply objective bonuses to controlling guild
  }

  private generateDailyQuest(): GuildQuest {
    const questTypes = [
      {
        name: 'Gold Rush',
        type: 'collect_gold',
        target: 100000,
        rewards: { gold: 10000, gems: 50, guildXp: 500 },
      },
      {
        name: 'Race Champions',
        type: 'win_races',
        target: 50,
        rewards: { gold: 5000, gems: 100, guildXp: 750 },
      },
    ];

    const quest = questTypes[Math.floor(Math.random() * questTypes.length)];

    return {
      id: `quest_${Date.now()}`,
      name: quest.name,
      description: `Complete ${quest.target} ${quest.type}`,
      type: 'daily',
      requirements: [
        {
          type: quest.type as any,
          amount: quest.target,
          current: 0,
        },
      ],
      progress: 0,
      target: quest.target,
      rewards: quest.rewards,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    };
  }

  private notifyGuildMembers(title: string, message: string) {
    eventBus.emit('notification:guild', { title, message });
  }

  private notifyPlayer(playerId: string, message: string) {
    eventBus.emit('notification:player', { playerId, message });
  }

  private unlockNewPerks(guild: Guild) {
    // Unlock new perks based on guild level
  }

  // Public methods
  getCurrentGuild(): Guild | null {
    return this.currentGuild;
  }

  getAvailableGuilds(): Guild[] {
    return this.availableGuilds;
  }

  getCurrentWar(): GuildWar | null {
    return this.currentWar;
  }

  getGuildQuests(): GuildQuest[] {
    return this.guildQuests;
  }

  searchGuilds(query: string): Guild[] {
    return this.availableGuilds.filter(
      (g) =>
        g.name.toLowerCase().includes(query.toLowerCase()) ||
        g.tag.toLowerCase().includes(query.toLowerCase())
    );
  }

  cleanup() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }
}

export const guildSystem = GuildSystem.getInstance();
