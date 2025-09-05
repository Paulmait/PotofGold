import { eventBus } from '../core/EventBus';
import { GameEventType, gameEvents } from '../core/GameEvents';
import { gameStateMachine, GameState, GameTransition } from '../core/GameStateMachine';

export interface Player {
  id: string;
  name: string;
  avatar: string;
  score: number;
  position: { x: number; y: number };
  velocity: { x: number; y: number };
  powerups: string[];
  rank: number;
  isLocal: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
}

export interface RaceMatch {
  id: string;
  players: Player[];
  startTime: number;
  duration: number;
  status: 'waiting' | 'countdown' | 'racing' | 'finished';
  winner?: string;
  rewards: RaceRewards;
  trackType: string;
  difficulty: number;
}

export interface RaceRewards {
  winner: { gold: number; gems: number; xp: number };
  second: { gold: number; gems: number; xp: number };
  third: { gold: number; gems: number; xp: number };
  participation: { gold: number; gems: number; xp: number };
}

export interface SpectatorData {
  matchId: string;
  viewingPlayerId?: string;
  viewMode: 'overview' | 'player' | 'leaderboard';
  chatEnabled: boolean;
}

export class MultiplayerRacingSystem {
  private static instance: MultiplayerRacingSystem;
  private currentMatch: RaceMatch | null = null;
  private localPlayerId: string = '';
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private pingInterval: NodeJS.Timeout | null = null;
  private updateInterval: NodeJS.Timeout | null = null;
  private spectatorMode: SpectatorData | null = null;
  private matchQueue: string[] = [];
  private playerPredictions: Map<string, { position: { x: number; y: number }; velocity: { x: number; y: number } }> = new Map();
  private lastServerUpdate = 0;
  private serverTickRate = 60; // 60Hz server update rate
  private clientPredictionEnabled = true;
  private lagCompensationEnabled = true;
  private interpolationDelay = 100; // ms
  private networkLatency = 0;

  private constructor() {
    this.setupEventListeners();
  }

  static getInstance(): MultiplayerRacingSystem {
    if (!MultiplayerRacingSystem.instance) {
      MultiplayerRacingSystem.instance = new MultiplayerRacingSystem();
    }
    return MultiplayerRacingSystem.instance;
  }

  private setupEventListeners() {
    eventBus.on('multiplayer:join:race', (data: { playerId: string }) => {
      this.joinRace(data.playerId);
    });

    eventBus.on('multiplayer:leave:race', () => {
      this.leaveRace();
    });

    eventBus.on('multiplayer:spectate', (data: { matchId: string }) => {
      this.spectateMatch(data.matchId);
    });

    eventBus.on('player:input', (data: { input: any }) => {
      this.handlePlayerInput(data.input);
    });
  }

  async connectToServer(serverUrl: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(serverUrl);

        this.ws.onopen = () => {
          console.log('Connected to multiplayer server');
          this.startPingInterval();
          this.startUpdateInterval();
          resolve(true);
        };

        this.ws.onmessage = (event) => {
          this.handleServerMessage(JSON.parse(event.data));
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.handleConnectionError();
        };

        this.ws.onclose = () => {
          console.log('Disconnected from multiplayer server');
          this.handleDisconnection();
        };
      } catch (error) {
        console.error('Failed to connect to multiplayer server:', error);
        reject(error);
      }
    });
  }

  private handleServerMessage(message: any) {
    this.lastServerUpdate = Date.now();

    switch (message.type) {
      case 'match_found':
        this.handleMatchFound(message.data);
        break;
      case 'match_countdown':
        this.handleMatchCountdown(message.data);
        break;
      case 'match_start':
        this.handleMatchStart(message.data);
        break;
      case 'player_update':
        this.handlePlayerUpdate(message.data);
        break;
      case 'item_spawn':
        this.handleItemSpawn(message.data);
        break;
      case 'powerup_used':
        this.handlePowerupUsed(message.data);
        break;
      case 'match_end':
        this.handleMatchEnd(message.data);
        break;
      case 'player_disconnected':
        this.handlePlayerDisconnected(message.data);
        break;
      case 'player_reconnected':
        this.handlePlayerReconnected(message.data);
        break;
      case 'spectator_data':
        this.handleSpectatorData(message.data);
        break;
      case 'ping':
        this.handlePing(message.data);
        break;
      case 'server_tick':
        this.handleServerTick(message.data);
        break;
    }
  }

  private handleMatchFound(data: any) {
    this.currentMatch = {
      id: data.matchId,
      players: data.players.map((p: any) => ({
        ...p,
        isLocal: p.id === this.localPlayerId,
      })),
      startTime: 0,
      duration: data.duration || 120000, // 2 minutes default
      status: 'waiting',
      rewards: data.rewards,
      trackType: data.trackType,
      difficulty: data.difficulty,
    };

    gameEvents.emit(GameEventType.MULTIPLAYER_MATCH_START, {
      matchId: data.matchId,
      players: data.players,
    });

    gameStateMachine.transition(GameTransition.START_RACE);
  }

  private handleMatchCountdown(data: any) {
    if (!this.currentMatch) return;

    this.currentMatch.status = 'countdown';
    
    eventBus.emit('race:countdown', {
      seconds: data.seconds,
    });
  }

  private handleMatchStart(data: any) {
    if (!this.currentMatch) return;

    this.currentMatch.status = 'racing';
    this.currentMatch.startTime = Date.now();

    eventBus.emit('race:start', {
      matchId: this.currentMatch.id,
    });
  }

  private handlePlayerUpdate(data: any) {
    if (!this.currentMatch) return;

    const player = this.currentMatch.players.find(p => p.id === data.playerId);
    if (!player) return;

    // Store server state for reconciliation
    if (this.clientPredictionEnabled && player.isLocal) {
      this.reconcileClientPrediction(player, data);
    } else {
      // Interpolate remote players
      this.interpolatePlayerPosition(player, data);
    }

    // Update player data
    Object.assign(player, data);

    // Update rankings
    this.updateRankings();

    gameEvents.emit(GameEventType.MULTIPLAYER_RACE_UPDATE, {
      playerId: data.playerId,
      position: player.rank,
      score: player.score,
      velocity: Math.sqrt(player.velocity.x ** 2 + player.velocity.y ** 2),
    });
  }

  private reconcileClientPrediction(player: Player, serverData: any) {
    const prediction = this.playerPredictions.get(player.id);
    if (!prediction) return;

    // Calculate prediction error
    const errorX = serverData.position.x - prediction.position.x;
    const errorY = serverData.position.y - prediction.position.y;
    const errorMagnitude = Math.sqrt(errorX ** 2 + errorY ** 2);

    // If error is significant, correct it smoothly
    if (errorMagnitude > 5) {
      // Smooth correction over several frames
      const correctionFactor = 0.1;
      player.position.x += errorX * correctionFactor;
      player.position.y += errorY * correctionFactor;
    }
  }

  private interpolatePlayerPosition(player: Player, targetData: any) {
    if (!this.lagCompensationEnabled) {
      player.position = targetData.position;
      player.velocity = targetData.velocity;
      return;
    }

    // Smooth interpolation to target position
    const interpolationFactor = 0.2;
    player.position.x += (targetData.position.x - player.position.x) * interpolationFactor;
    player.position.y += (targetData.position.y - player.position.y) * interpolationFactor;
    player.velocity = targetData.velocity;
  }

  private handleItemSpawn(data: any) {
    gameEvents.emit(GameEventType.ITEM_SPAWN, {
      itemId: data.itemId,
      itemType: data.itemType,
      position: data.position,
      velocity: data.velocity,
    });
  }

  private handlePowerupUsed(data: any) {
    const player = this.currentMatch?.players.find(p => p.id === data.playerId);
    if (!player) return;

    gameEvents.emit(GameEventType.POWERUP_ACTIVATED, {
      playerId: data.playerId,
      powerupType: data.powerupType,
      duration: data.duration,
    });
  }

  private handleMatchEnd(data: any) {
    if (!this.currentMatch) return;

    this.currentMatch.status = 'finished';
    this.currentMatch.winner = data.winnerId;

    // Award rewards based on position
    const localPlayer = this.currentMatch.players.find(p => p.isLocal);
    if (localPlayer) {
      const reward = this.calculateReward(localPlayer.rank);
      
      gameEvents.emit(GameEventType.CURRENCY_EARNED, {
        type: 'gold',
        amount: reward.gold,
        source: 'multiplayer_race',
      });

      gameEvents.emit(GameEventType.CURRENCY_EARNED, {
        type: 'gems',
        amount: reward.gems,
        source: 'multiplayer_race',
      });
    }

    gameEvents.emit(GameEventType.MULTIPLAYER_MATCH_END, {
      matchId: this.currentMatch.id,
      winner: data.winnerId,
      rankings: data.rankings,
      rewards: data.rewards,
    });

    gameStateMachine.transition(GameTransition.END_RACE);
  }

  private handlePlayerDisconnected(data: any) {
    const player = this.currentMatch?.players.find(p => p.id === data.playerId);
    if (player) {
      player.connectionStatus = 'disconnected';
    }

    gameEvents.emit(GameEventType.MULTIPLAYER_PLAYER_LEAVE, {
      playerId: data.playerId,
    });
  }

  private handlePlayerReconnected(data: any) {
    const player = this.currentMatch?.players.find(p => p.id === data.playerId);
    if (player) {
      player.connectionStatus = 'connected';
      Object.assign(player, data.playerState);
    }

    gameEvents.emit(GameEventType.MULTIPLAYER_PLAYER_JOIN, {
      playerId: data.playerId,
    });
  }

  private handleSpectatorData(data: any) {
    if (!this.spectatorMode) return;

    eventBus.emit('spectator:update', {
      players: data.players,
      items: data.items,
      events: data.events,
    });
  }

  private handlePing(data: any) {
    this.networkLatency = Date.now() - data.timestamp;
    this.sendToServer({
      type: 'pong',
      data: { timestamp: data.timestamp },
    });
  }

  private handleServerTick(data: any) {
    // Synchronize with server tick for better prediction
    if (this.currentMatch && this.currentMatch.status === 'racing') {
      this.processServerTick(data);
    }
  }

  private processServerTick(tickData: any) {
    // Update game state based on server tick
    // This ensures all clients are synchronized
  }

  private handlePlayerInput(input: any) {
    if (!this.currentMatch || this.currentMatch.status !== 'racing') return;

    const localPlayer = this.currentMatch.players.find(p => p.isLocal);
    if (!localPlayer) return;

    // Apply input immediately for responsive feel (client prediction)
    if (this.clientPredictionEnabled) {
      this.applyInputLocally(localPlayer, input);
      
      // Store prediction for reconciliation
      this.playerPredictions.set(localPlayer.id, {
        position: { ...localPlayer.position },
        velocity: { ...localPlayer.velocity },
      });
    }

    // Send input to server
    this.sendToServer({
      type: 'player_input',
      data: {
        input,
        timestamp: Date.now(),
        sequenceNumber: this.getNextSequenceNumber(),
      },
    });
  }

  private applyInputLocally(player: Player, input: any) {
    // Apply input to local player immediately
    const speed = 5;
    if (input.left) player.position.x -= speed;
    if (input.right) player.position.x += speed;
    if (input.up) player.position.y -= speed;
    if (input.down) player.position.y += speed;

    // Update velocity
    player.velocity.x = input.left ? -speed : input.right ? speed : 0;
    player.velocity.y = input.up ? -speed : input.down ? speed : 0;
  }

  private updateRankings() {
    if (!this.currentMatch) return;

    // Sort players by score
    this.currentMatch.players.sort((a, b) => b.score - a.score);
    
    // Update ranks
    this.currentMatch.players.forEach((player, index) => {
      player.rank = index + 1;
    });
  }

  private calculateReward(rank: number): { gold: number; gems: number; xp: number } {
    if (!this.currentMatch) return { gold: 0, gems: 0, xp: 0 };

    const rewards = this.currentMatch.rewards;
    switch (rank) {
      case 1:
        return rewards.winner;
      case 2:
        return rewards.second;
      case 3:
        return rewards.third;
      default:
        return rewards.participation;
    }
  }

  async joinRace(playerId: string) {
    this.localPlayerId = playerId;

    this.sendToServer({
      type: 'join_race',
      data: {
        playerId,
        playerData: await this.getPlayerData(),
      },
    });

    this.matchQueue.push(playerId);
  }

  async leaveRace() {
    if (!this.currentMatch) return;

    this.sendToServer({
      type: 'leave_race',
      data: {
        playerId: this.localPlayerId,
        matchId: this.currentMatch.id,
      },
    });

    this.currentMatch = null;
    this.playerPredictions.clear();
  }

  async spectateMatch(matchId: string) {
    this.spectatorMode = {
      matchId,
      viewMode: 'overview',
      chatEnabled: true,
    };

    this.sendToServer({
      type: 'spectate_match',
      data: {
        matchId,
      },
    });

    gameStateMachine.transition(GameTransition.SPECTATE);
  }

  private async getPlayerData() {
    // Get player data from storage/firebase
    return {
      name: 'Player',
      avatar: 'default',
      level: 1,
      wins: 0,
      losses: 0,
    };
  }

  private sendToServer(message: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  private startPingInterval() {
    this.pingInterval = setInterval(() => {
      this.sendToServer({
        type: 'ping',
        data: { timestamp: Date.now() },
      });
    }, 5000);
  }

  private startUpdateInterval() {
    this.updateInterval = setInterval(() => {
      if (this.currentMatch && this.currentMatch.status === 'racing') {
        this.updateRaceState();
      }
    }, 1000 / this.serverTickRate);
  }

  private updateRaceState() {
    // Update local race state
    const elapsed = Date.now() - this.currentMatch!.startTime;
    
    if (elapsed >= this.currentMatch!.duration) {
      // Race time limit reached
      this.sendToServer({
        type: 'race_timeout',
        data: {
          matchId: this.currentMatch!.id,
        },
      });
    }
  }

  private handleConnectionError() {
    eventBus.emit(GameEventType.NETWORK_DISCONNECTED, {});
    this.attemptReconnection();
  }

  private handleDisconnection() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }

    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    this.attemptReconnection();
  }

  private async attemptReconnection() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      gameStateMachine.transition(GameTransition.HANDLE_ERROR);
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`Attempting reconnection in ${delay}ms...`);

    setTimeout(async () => {
      try {
        await this.connectToServer(this.getServerUrl());
        this.reconnectAttempts = 0;
        
        if (this.currentMatch) {
          // Rejoin current match
          this.sendToServer({
            type: 'rejoin_match',
            data: {
              matchId: this.currentMatch.id,
              playerId: this.localPlayerId,
            },
          });
        }

        eventBus.emit(GameEventType.NETWORK_CONNECTED, {});
      } catch (error) {
        this.attemptReconnection();
      }
    }, delay);
  }

  private getServerUrl(): string {
    // Get server URL from config
    return process.env.MULTIPLAYER_SERVER_URL || 'ws://localhost:3001';
  }

  private sequenceNumber = 0;
  private getNextSequenceNumber(): number {
    return ++this.sequenceNumber;
  }

  getCurrentMatch(): RaceMatch | null {
    return this.currentMatch;
  }

  getNetworkLatency(): number {
    return this.networkLatency;
  }

  getSpectatorMode(): SpectatorData | null {
    return this.spectatorMode;
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.currentMatch = null;
    this.spectatorMode = null;
    this.playerPredictions.clear();
    this.matchQueue = [];
  }
}

export const multiplayerRacing = MultiplayerRacingSystem.getInstance();