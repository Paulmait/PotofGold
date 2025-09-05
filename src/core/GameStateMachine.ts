import { eventBus } from './EventBus';
import { GameEventType } from './GameEvents';

export enum GameState {
  IDLE = 'idle',
  LOADING = 'loading',
  MENU = 'menu',
  PLAYING = 'playing',
  PAUSED = 'paused',
  GAME_OVER = 'game_over',
  MULTIPLAYER_LOBBY = 'multiplayer_lobby',
  MULTIPLAYER_RACING = 'multiplayer_racing',
  TOURNAMENT = 'tournament',
  GUILD_WAR = 'guild_war',
  SPECTATING = 'spectating',
  ERROR = 'error',
}

export enum GameTransition {
  START_GAME = 'start_game',
  PAUSE_GAME = 'pause_game',
  RESUME_GAME = 'resume_game',
  END_GAME = 'end_game',
  ENTER_MULTIPLAYER = 'enter_multiplayer',
  START_RACE = 'start_race',
  END_RACE = 'end_race',
  JOIN_TOURNAMENT = 'join_tournament',
  JOIN_GUILD_WAR = 'join_guild_war',
  SPECTATE = 'spectate',
  RETURN_TO_MENU = 'return_to_menu',
  HANDLE_ERROR = 'handle_error',
  RECOVER = 'recover',
}

interface StateConfig {
  onEnter?: () => void | Promise<void>;
  onExit?: () => void | Promise<void>;
  onUpdate?: (deltaTime: number) => void;
  validTransitions: Map<GameTransition, GameState>;
}

interface TransitionGuard {
  canTransition: () => boolean | Promise<boolean>;
  errorMessage: string;
}

export class GameStateMachine {
  private static instance: GameStateMachine;
  private currentState: GameState = GameState.IDLE;
  private previousState: GameState = GameState.IDLE;
  private states: Map<GameState, StateConfig> = new Map();
  private transitionGuards: Map<string, TransitionGuard> = new Map();
  private stateHistory: GameState[] = [];
  private maxHistorySize = 10;
  private isTransitioning = false;
  private stateTimers: Map<GameState, number> = new Map();
  private currentStateStartTime = 0;

  private constructor() {
    this.initializeStates();
    this.setupEventListeners();
  }

  static getInstance(): GameStateMachine {
    if (!GameStateMachine.instance) {
      GameStateMachine.instance = new GameStateMachine();
    }
    return GameStateMachine.instance;
  }

  private initializeStates() {
    // IDLE State
    this.states.set(GameState.IDLE, {
      validTransitions: new Map([
        [GameTransition.START_GAME, GameState.LOADING],
        [GameTransition.HANDLE_ERROR, GameState.ERROR],
      ]),
    });

    // LOADING State
    this.states.set(GameState.LOADING, {
      onEnter: async () => {
        eventBus.emit('state:loading:enter');
        await this.preloadAssets();
      },
      validTransitions: new Map([
        [GameTransition.START_GAME, GameState.MENU],
        [GameTransition.HANDLE_ERROR, GameState.ERROR],
      ]),
    });

    // MENU State
    this.states.set(GameState.MENU, {
      onEnter: () => {
        eventBus.emit('state:menu:enter');
      },
      validTransitions: new Map([
        [GameTransition.START_GAME, GameState.PLAYING],
        [GameTransition.ENTER_MULTIPLAYER, GameState.MULTIPLAYER_LOBBY],
        [GameTransition.JOIN_TOURNAMENT, GameState.TOURNAMENT],
        [GameTransition.SPECTATE, GameState.SPECTATING],
        [GameTransition.HANDLE_ERROR, GameState.ERROR],
      ]),
    });

    // PLAYING State
    this.states.set(GameState.PLAYING, {
      onEnter: () => {
        eventBus.emit(GameEventType.GAME_START, {
          playerId: 'current',
          timestamp: Date.now(),
          sessionId: this.generateSessionId(),
        });
      },
      onExit: () => {
        this.saveGameState();
      },
      onUpdate: (deltaTime) => {
        // Update game logic
      },
      validTransitions: new Map([
        [GameTransition.PAUSE_GAME, GameState.PAUSED],
        [GameTransition.END_GAME, GameState.GAME_OVER],
        [GameTransition.HANDLE_ERROR, GameState.ERROR],
      ]),
    });

    // PAUSED State
    this.states.set(GameState.PAUSED, {
      onEnter: () => {
        eventBus.emit(GameEventType.GAME_PAUSE, {});
      },
      validTransitions: new Map([
        [GameTransition.RESUME_GAME, GameState.PLAYING],
        [GameTransition.RETURN_TO_MENU, GameState.MENU],
        [GameTransition.END_GAME, GameState.GAME_OVER],
      ]),
    });

    // GAME_OVER State
    this.states.set(GameState.GAME_OVER, {
      onEnter: () => {
        eventBus.emit(GameEventType.GAME_OVER, {
          finalScore: this.getFinalScore(),
          duration: this.getStateDuration(GameState.PLAYING),
        });
      },
      validTransitions: new Map([
        [GameTransition.START_GAME, GameState.PLAYING],
        [GameTransition.RETURN_TO_MENU, GameState.MENU],
      ]),
    });

    // MULTIPLAYER_LOBBY State
    this.states.set(GameState.MULTIPLAYER_LOBBY, {
      onEnter: () => {
        this.connectToMultiplayerServer();
      },
      onExit: () => {
        this.cleanupMultiplayerConnection();
      },
      validTransitions: new Map([
        [GameTransition.START_RACE, GameState.MULTIPLAYER_RACING],
        [GameTransition.RETURN_TO_MENU, GameState.MENU],
        [GameTransition.HANDLE_ERROR, GameState.ERROR],
      ]),
    });

    // MULTIPLAYER_RACING State
    this.states.set(GameState.MULTIPLAYER_RACING, {
      onEnter: () => {
        eventBus.emit(GameEventType.MULTIPLAYER_MATCH_START, {
          matchId: this.generateMatchId(),
          players: [],
        });
      },
      onUpdate: (deltaTime) => {
        this.updateMultiplayerRace(deltaTime);
      },
      validTransitions: new Map([
        [GameTransition.END_RACE, GameState.MULTIPLAYER_LOBBY],
        [GameTransition.PAUSE_GAME, GameState.PAUSED],
        [GameTransition.HANDLE_ERROR, GameState.ERROR],
      ]),
    });

    // TOURNAMENT State
    this.states.set(GameState.TOURNAMENT, {
      onEnter: () => {
        eventBus.emit(GameEventType.TOURNAMENT_START, {
          tournamentId: this.generateTournamentId(),
        });
      },
      validTransitions: new Map([
        [GameTransition.START_GAME, GameState.PLAYING],
        [GameTransition.RETURN_TO_MENU, GameState.MENU],
        [GameTransition.HANDLE_ERROR, GameState.ERROR],
      ]),
    });

    // GUILD_WAR State
    this.states.set(GameState.GUILD_WAR, {
      onEnter: () => {
        eventBus.emit(GameEventType.GUILD_WAR_START, {
          warId: this.generateWarId(),
        });
      },
      validTransitions: new Map([
        [GameTransition.END_GAME, GameState.MENU],
        [GameTransition.HANDLE_ERROR, GameState.ERROR],
      ]),
    });

    // SPECTATING State
    this.states.set(GameState.SPECTATING, {
      onEnter: () => {
        this.connectToSpectatorMode();
      },
      onExit: () => {
        this.disconnectSpectatorMode();
      },
      validTransitions: new Map([
        [GameTransition.RETURN_TO_MENU, GameState.MENU],
      ]),
    });

    // ERROR State
    this.states.set(GameState.ERROR, {
      onEnter: () => {
        eventBus.emit(GameEventType.ERROR_OCCURRED, {
          state: this.previousState,
          timestamp: Date.now(),
        });
      },
      validTransitions: new Map([
        [GameTransition.RECOVER, GameState.MENU],
        [GameTransition.RETURN_TO_MENU, GameState.MENU],
      ]),
    });
  }

  private setupEventListeners() {
    eventBus.on('game:request:pause', () => {
      if (this.canTransition(GameTransition.PAUSE_GAME)) {
        this.transition(GameTransition.PAUSE_GAME);
      }
    });

    eventBus.on('game:request:resume', () => {
      if (this.canTransition(GameTransition.RESUME_GAME)) {
        this.transition(GameTransition.RESUME_GAME);
      }
    });

    eventBus.on('error:critical', () => {
      this.transition(GameTransition.HANDLE_ERROR);
    });
  }

  async transition(transition: GameTransition): Promise<boolean> {
    if (this.isTransitioning) {
      console.warn('Transition already in progress');
      return false;
    }

    const stateConfig = this.states.get(this.currentState);
    if (!stateConfig) {
      console.error(`No configuration for state: ${this.currentState}`);
      return false;
    }

    const nextState = stateConfig.validTransitions.get(transition);
    if (!nextState) {
      console.error(
        `Invalid transition ${transition} from state ${this.currentState}`
      );
      return false;
    }

    const guardKey = `${this.currentState}->${nextState}`;
    const guard = this.transitionGuards.get(guardKey);
    if (guard) {
      const canTransition = await guard.canTransition();
      if (!canTransition) {
        console.warn(`Transition blocked: ${guard.errorMessage}`);
        eventBus.emit('state:transition:blocked', {
          from: this.currentState,
          to: nextState,
          reason: guard.errorMessage,
        });
        return false;
      }
    }

    this.isTransitioning = true;

    try {
      // Exit current state
      if (stateConfig.onExit) {
        await stateConfig.onExit();
      }

      // Record state duration
      const duration = Date.now() - this.currentStateStartTime;
      this.stateTimers.set(this.currentState, duration);

      // Update state
      this.previousState = this.currentState;
      this.currentState = nextState;
      this.currentStateStartTime = Date.now();

      // Update history
      this.stateHistory.push(nextState);
      if (this.stateHistory.length > this.maxHistorySize) {
        this.stateHistory.shift();
      }

      // Enter new state
      const newStateConfig = this.states.get(nextState);
      if (newStateConfig?.onEnter) {
        await newStateConfig.onEnter();
      }

      eventBus.emit('state:changed', {
        from: this.previousState,
        to: this.currentState,
        transition,
      });

      return true;
    } catch (error) {
      console.error('Error during state transition:', error);
      this.currentState = GameState.ERROR;
      return false;
    } finally {
      this.isTransitioning = false;
    }
  }

  addTransitionGuard(
    from: GameState,
    to: GameState,
    guard: TransitionGuard
  ) {
    const key = `${from}->${to}`;
    this.transitionGuards.set(key, guard);
  }

  removeTransitionGuard(from: GameState, to: GameState) {
    const key = `${from}->${to}`;
    this.transitionGuards.delete(key);
  }

  canTransition(transition: GameTransition): boolean {
    const stateConfig = this.states.get(this.currentState);
    return stateConfig?.validTransitions.has(transition) || false;
  }

  getCurrentState(): GameState {
    return this.currentState;
  }

  getPreviousState(): GameState {
    return this.previousState;
  }

  getStateHistory(): GameState[] {
    return [...this.stateHistory];
  }

  getStateDuration(state: GameState): number {
    if (state === this.currentState) {
      return Date.now() - this.currentStateStartTime;
    }
    return this.stateTimers.get(state) || 0;
  }

  update(deltaTime: number) {
    const stateConfig = this.states.get(this.currentState);
    if (stateConfig?.onUpdate) {
      stateConfig.onUpdate(deltaTime);
    }
  }

  reset() {
    this.currentState = GameState.IDLE;
    this.previousState = GameState.IDLE;
    this.stateHistory = [];
    this.stateTimers.clear();
    this.currentStateStartTime = Date.now();
  }

  // Helper methods
  private async preloadAssets() {
    // Asset preloading logic
    console.log('Preloading assets...');
  }

  private saveGameState() {
    // Save game state logic
    console.log('Saving game state...');
  }

  private connectToMultiplayerServer() {
    // Multiplayer connection logic
    console.log('Connecting to multiplayer server...');
  }

  private cleanupMultiplayerConnection() {
    // Cleanup multiplayer connection
    console.log('Cleaning up multiplayer connection...');
  }

  private updateMultiplayerRace(deltaTime: number) {
    // Update multiplayer race logic
  }

  private connectToSpectatorMode() {
    // Connect to spectator mode
    console.log('Connecting to spectator mode...');
  }

  private disconnectSpectatorMode() {
    // Disconnect from spectator mode
    console.log('Disconnecting from spectator mode...');
  }

  private getFinalScore(): number {
    // Get final score logic
    return 0;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateMatchId(): string {
    return `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateTournamentId(): string {
    return `tournament_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateWarId(): string {
    return `war_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const gameStateMachine = GameStateMachine.getInstance();