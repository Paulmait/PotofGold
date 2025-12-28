import { eventBus } from './EventBus';

export enum GameEventType {
  // Core Game Events
  GAME_START = 'game:start',
  GAME_PAUSE = 'game:pause',
  GAME_RESUME = 'game:resume',
  GAME_OVER = 'game:over',
  LEVEL_COMPLETE = 'level:complete',

  // Player Events
  PLAYER_MOVE = 'player:move',
  PLAYER_COLLECT = 'player:collect',
  PLAYER_DAMAGE = 'player:damage',
  PLAYER_LEVELUP = 'player:levelup',
  PLAYER_DEATH = 'player:death',

  // Item Events
  ITEM_SPAWN = 'item:spawn',
  ITEM_COLLECTED = 'item:collected',
  ITEM_MISSED = 'item:missed',
  POWERUP_ACTIVATED = 'powerup:activated',
  POWERUP_EXPIRED = 'powerup:expired',

  // Multiplayer Events
  MULTIPLAYER_MATCH_START = 'multiplayer:match:start',
  MULTIPLAYER_MATCH_END = 'multiplayer:match:end',
  MULTIPLAYER_PLAYER_JOIN = 'multiplayer:player:join',
  MULTIPLAYER_PLAYER_LEAVE = 'multiplayer:player:leave',
  MULTIPLAYER_RACE_UPDATE = 'multiplayer:race:update',

  // Guild Events
  GUILD_CREATED = 'guild:created',
  GUILD_JOINED = 'guild:joined',
  GUILD_LEFT = 'guild:left',
  GUILD_WAR_START = 'guild:war:start',
  GUILD_WAR_END = 'guild:war:end',
  GUILD_CONTRIBUTION = 'guild:contribution',

  // Social Events
  FRIEND_REQUEST_SENT = 'friend:request:sent',
  FRIEND_REQUEST_RECEIVED = 'friend:request:received',
  FRIEND_REQUEST_ACCEPTED = 'friend:request:accepted',
  GIFT_SENT = 'gift:sent',
  GIFT_RECEIVED = 'gift:received',

  // Tournament Events
  TOURNAMENT_START = 'tournament:start',
  TOURNAMENT_END = 'tournament:end',
  TOURNAMENT_ROUND_COMPLETE = 'tournament:round:complete',
  TOURNAMENT_ELIMINATED = 'tournament:eliminated',

  // Achievement Events
  ACHIEVEMENT_UNLOCKED = 'achievement:unlocked',
  ACHIEVEMENT_PROGRESS = 'achievement:progress',

  // Shop Events
  SHOP_PURCHASE = 'shop:purchase',
  SHOP_OPEN = 'shop:open',
  SHOP_CLOSE = 'shop:close',

  // Currency Events
  CURRENCY_EARNED = 'currency:earned',
  CURRENCY_SPENT = 'currency:spent',

  // UI Events
  UI_MODAL_OPEN = 'ui:modal:open',
  UI_MODAL_CLOSE = 'ui:modal:close',
  UI_SCREEN_CHANGE = 'ui:screen:change',

  // Network Events
  NETWORK_CONNECTED = 'network:connected',
  NETWORK_DISCONNECTED = 'network:disconnected',
  SYNC_START = 'sync:start',
  SYNC_COMPLETE = 'sync:complete',

  // Analytics Events
  ANALYTICS_EVENT = 'analytics:event',
  ANALYTICS_SCREEN_VIEW = 'analytics:screen:view',

  // Live Ops Events
  LIVEOPS_EVENT_START = 'liveops:event:start',
  LIVEOPS_EVENT_END = 'liveops:event:end',
  LIVEOPS_UPDATE = 'liveops:update',

  // Performance Events
  PERFORMANCE_LAG = 'performance:lag',
  PERFORMANCE_RECOVERED = 'performance:recovered',

  // Error Events
  ERROR_OCCURRED = 'error:occurred',
  ERROR_RECOVERED = 'error:recovered',
}

export interface GameEventData {
  [GameEventType.GAME_START]: {
    playerId: string;
    timestamp: number;
    sessionId: string;
  };

  [GameEventType.PLAYER_COLLECT]: {
    playerId: string;
    itemType: string;
    value: number;
    position: { x: number; y: number };
  };

  [GameEventType.ITEM_SPAWN]: {
    itemId: string;
    itemType: string;
    position: { x: number; y: number };
    velocity?: { x: number; y: number };
  };

  [GameEventType.MULTIPLAYER_RACE_UPDATE]: {
    playerId: string;
    position: number;
    score: number;
    velocity: number;
  };

  [GameEventType.GUILD_CONTRIBUTION]: {
    guildId: string;
    playerId: string;
    contribution: number;
    type: 'gold' | 'items' | 'points';
  };

  [GameEventType.GIFT_SENT]: {
    fromPlayerId: string;
    toPlayerId: string;
    giftType: string;
    giftValue: any;
  };

  [GameEventType.TOURNAMENT_ROUND_COMPLETE]: {
    tournamentId: string;
    round: number;
    winners: string[];
    eliminated: string[];
  };

  [GameEventType.ACHIEVEMENT_UNLOCKED]: {
    achievementId: string;
    playerId: string;
    rewards: any[];
  };

  [GameEventType.CURRENCY_EARNED]: {
    type: 'gold' | 'gems' | 'tickets';
    amount: number;
    source: string;
  };

  [GameEventType.LIVEOPS_EVENT_START]: {
    eventId: string;
    eventType: string;
    duration: number;
    rewards: any[];
  };
}

export class GameEventManager {
  private static instance: GameEventManager;
  private eventHandlers: Map<string, Function[]> = new Map();

  private constructor() {
    this.setupEventHandlers();
  }

  static getInstance(): GameEventManager {
    if (!GameEventManager.instance) {
      GameEventManager.instance = new GameEventManager();
    }
    return GameEventManager.instance;
  }

  private setupEventHandlers() {
    // Setup default event handlers for critical game events
    eventBus.on(GameEventType.GAME_START, (data) => {
      console.log('Game started:', data);
      this.trackAnalytics('game_start', data);
    });

    eventBus.on(GameEventType.PLAYER_COLLECT, (data) => {
      this.handleItemCollection(data);
    });

    eventBus.on(GameEventType.ACHIEVEMENT_UNLOCKED, (data) => {
      this.handleAchievementUnlock(data);
    });

    eventBus.on(GameEventType.NETWORK_DISCONNECTED, () => {
      this.handleNetworkDisconnect();
    });
  }

  emit<K extends keyof GameEventData>(event: K, data: GameEventData[K]): void {
    eventBus.emit(event, data);
  }

  on<K extends keyof GameEventData>(
    event: K,
    callback: (data: GameEventData[K]) => void,
    priority = 0
  ): () => void {
    return eventBus.on(event, callback, priority);
  }

  once<K extends keyof GameEventData>(
    event: K,
    callback: (data: GameEventData[K]) => void,
    priority = 0
  ): () => void {
    return eventBus.once(event, callback, priority);
  }

  private handleItemCollection(data: any) {
    // Update scores, trigger combos, etc.
    this.emit(GameEventType.ANALYTICS_EVENT, {
      name: 'item_collected',
      properties: data,
    } as any);
  }

  private handleAchievementUnlock(data: any) {
    // Show notification, grant rewards, etc.
    this.emit(GameEventType.UI_MODAL_OPEN, {
      type: 'achievement',
      data: data,
    } as any);
  }

  private handleNetworkDisconnect() {
    // Queue events for sync, switch to offline mode
    console.log('Network disconnected, switching to offline mode');
  }

  private trackAnalytics(eventName: string, data: any) {
    // Send to analytics service
    this.emit(GameEventType.ANALYTICS_EVENT, {
      name: eventName,
      properties: data,
      timestamp: Date.now(),
    } as any);
  }

  getMetrics() {
    return eventBus.getMetrics();
  }

  clearEvents() {
    eventBus.clear();
  }
}

export const gameEvents = GameEventManager.getInstance();
