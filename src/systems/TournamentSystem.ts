import { eventBus } from '../core/EventBus';
import { GameEventType, gameEvents } from '../core/GameEvents';

export interface Tournament {
  id: string;
  name: string;
  description: string;
  type: TournamentType;
  format: TournamentFormat;
  status: TournamentStatus;
  startTime: number;
  endTime: number;
  entryFee?: { gold?: number; gems?: number; tickets?: number };
  prizes: TournamentPrizes;
  rules: TournamentRules;
  brackets: Bracket[];
  participants: TournamentParticipant[];
  maxParticipants: number;
  currentRound: number;
  totalRounds: number;
  matchesPerRound: Map<number, Match[]>;
  leaderboard?: TournamentLeaderboard;
  spectators: string[];
  featured: boolean;
  sponsored?: string;
}

export enum TournamentType {
  SINGLE_ELIMINATION = 'single_elimination',
  DOUBLE_ELIMINATION = 'double_elimination',
  ROUND_ROBIN = 'round_robin',
  SWISS = 'swiss',
  LADDER = 'ladder',
  KNOCKOUT = 'knockout',
  LEAGUE = 'league',
}

export enum TournamentFormat {
  SOLO = 'solo',
  TEAM = 'team',
  GUILD = 'guild',
  MIXED = 'mixed',
}

export enum TournamentStatus {
  UPCOMING = 'upcoming',
  REGISTRATION = 'registration',
  SEEDING = 'seeding',
  IN_PROGRESS = 'in_progress',
  FINALS = 'finals',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export interface Bracket {
  round: number;
  position: number;
  match?: Match;
  winner?: string;
  loser?: string;
  nextMatchPosition?: number;
  loserBracketPosition?: number; // For double elimination
}

export interface Match {
  id: string;
  round: number;
  position: number;
  player1: string | null;
  player2: string | null;
  score1: number;
  score2: number;
  winner?: string;
  status: 'pending' | 'ready' | 'in_progress' | 'completed';
  startTime?: number;
  endTime?: number;
  bestOf: number;
  games: Game[];
  spectatorCount: number;
  streamUrl?: string;
}

export interface Game {
  gameNumber: number;
  player1Score: number;
  player2Score: number;
  winner?: string;
  duration: number;
  highlights: GameHighlight[];
}

export interface GameHighlight {
  timestamp: number;
  type: 'combo' | 'powerup' | 'comeback' | 'perfect';
  player: string;
  description: string;
}

export interface TournamentParticipant {
  id: string;
  name: string;
  avatar: string;
  seed: number;
  stats: ParticipantStats;
  currentMatch?: string;
  eliminated: boolean;
  placement?: number;
  prizesWon?: any[];
}

export interface ParticipantStats {
  wins: number;
  losses: number;
  gamesPlayed: number;
  totalScore: number;
  averageScore: number;
  highestScore: number;
  comebacks: number;
  perfectGames: number;
}

export interface TournamentPrizes {
  first: { gold: number; gems: number; items: string[]; title?: string };
  second: { gold: number; gems: number; items: string[] };
  third: { gold: number; gems: number; items: string[] };
  top8: { gold: number; gems: number; items: string[] };
  top16: { gold: number; gems: number; items: string[] };
  participation: { gold: number; gems: number };
  special?: { perfectTournament?: any; mostComebacks?: any; highestScore?: any };
}

export interface TournamentRules {
  gameMode: string;
  timeLimit?: number;
  scoreLimit?: number;
  allowedPowerups: string[];
  bannedItems: string[];
  matchFormat: 'best_of_1' | 'best_of_3' | 'best_of_5';
  seedingMethod: 'random' | 'skill' | 'previous_performance';
  tiebreaker: string;
}

export interface TournamentLeaderboard {
  entries: Array<{
    participantId: string;
    rank: number;
    wins: number;
    losses: number;
    points: number;
    tiebreaker: number;
  }>;
}

export class TournamentSystem {
  private static instance: TournamentSystem;
  private activeTournaments: Map<string, Tournament> = new Map();
  private upcomingTournaments: Tournament[] = [];
  private completedTournaments: Tournament[] = [];
  private playerTournaments: Map<string, string[]> = new Map(); // playerId -> tournamentIds
  private currentPlayerTournament: Tournament | null = null;
  private watchingMatch: Match | null = null;
  private updateInterval: NodeJS.Timeout | null = null;
  private bracketGenerators: Map<TournamentType, BracketGenerator> = new Map();

  private constructor() {
    this.initializeBracketGenerators();
    this.setupEventListeners();
    this.startUpdateLoop();
  }

  static getInstance(): TournamentSystem {
    if (!TournamentSystem.instance) {
      TournamentSystem.instance = new TournamentSystem();
    }
    return TournamentSystem.instance;
  }

  private initializeBracketGenerators() {
    this.bracketGenerators.set(TournamentType.SINGLE_ELIMINATION, new SingleEliminationGenerator());
    this.bracketGenerators.set(TournamentType.DOUBLE_ELIMINATION, new DoubleEliminationGenerator());
    this.bracketGenerators.set(TournamentType.ROUND_ROBIN, new RoundRobinGenerator());
  }

  private setupEventListeners() {
    eventBus.on('tournament:register', (data: any) => {
      this.registerForTournament(data.tournamentId, data.playerId);
    });

    eventBus.on('tournament:start_match', (data: any) => {
      this.startMatch(data.matchId);
    });

    eventBus.on('tournament:report_score', (data: any) => {
      this.reportMatchScore(data.matchId, data.gameNumber, data.scores);
    });

    eventBus.on('tournament:spectate', (data: any) => {
      this.spectateMatch(data.matchId);
    });
  }

  private startUpdateLoop() {
    this.updateInterval = setInterval(() => {
      this.checkTournamentStarts();
      this.updateMatchStatuses();
      this.processCompletedTournaments();
    }, 30000); // Every 30 seconds
  }

  createTournament(config: Partial<Tournament>): Tournament {
    const tournament: Tournament = {
      id: this.generateTournamentId(),
      name: config.name || 'Tournament',
      description: config.description || '',
      type: config.type || TournamentType.SINGLE_ELIMINATION,
      format: config.format || TournamentFormat.SOLO,
      status: TournamentStatus.UPCOMING,
      startTime: config.startTime || Date.now() + 3600000,
      endTime: config.endTime || Date.now() + 7200000,
      entryFee: config.entryFee,
      prizes: config.prizes || this.getDefaultPrizes(),
      rules: config.rules || this.getDefaultRules(),
      brackets: [],
      participants: [],
      maxParticipants: config.maxParticipants || 32,
      currentRound: 0,
      totalRounds: this.calculateTotalRounds(config.maxParticipants || 32, config.type!),
      matchesPerRound: new Map(),
      spectators: [],
      featured: config.featured || false,
      sponsored: config.sponsored,
    };

    this.upcomingTournaments.push(tournament);

    gameEvents.emit(GameEventType.TOURNAMENT_START, {
      tournamentId: tournament.id,
    });

    // Schedule tournament start
    const timeUntilStart = tournament.startTime - Date.now();
    if (timeUntilStart > 0) {
      setTimeout(
        () => {
          this.startRegistration(tournament);
        },
        Math.max(0, timeUntilStart - 1800000)
      ); // Open registration 30 min before
    }

    return tournament;
  }

  private startRegistration(tournament: Tournament) {
    tournament.status = TournamentStatus.REGISTRATION;

    eventBus.emit('tournament:registration:open', {
      tournamentId: tournament.id,
      name: tournament.name,
    });

    // Auto-start when full or at start time
    const checkStart = setInterval(() => {
      if (
        tournament.participants.length >= tournament.maxParticipants ||
        Date.now() >= tournament.startTime
      ) {
        clearInterval(checkStart);
        this.startTournament(tournament);
      }
    }, 5000);
  }

  async registerForTournament(tournamentId: string, playerId: string): Promise<boolean> {
    const tournament = this.findTournament(tournamentId);
    if (!tournament) {
      console.log('Tournament not found');
      return false;
    }

    if (tournament.status !== TournamentStatus.REGISTRATION) {
      console.log('Tournament registration is closed');
      return false;
    }

    if (tournament.participants.length >= tournament.maxParticipants) {
      console.log('Tournament is full');
      return false;
    }

    // Check if already registered
    if (tournament.participants.find((p) => p.id === playerId)) {
      console.log('Already registered');
      return false;
    }

    // Check entry fee
    if (tournament.entryFee) {
      const canPay = await this.checkEntryFee(playerId, tournament.entryFee);
      if (!canPay) {
        console.log('Insufficient funds for entry fee');
        return false;
      }
      await this.payEntryFee(playerId, tournament.entryFee);
    }

    const participant: TournamentParticipant = {
      id: playerId,
      name: await this.getPlayerName(playerId),
      avatar: 'default',
      seed: tournament.participants.length + 1,
      stats: {
        wins: 0,
        losses: 0,
        gamesPlayed: 0,
        totalScore: 0,
        averageScore: 0,
        highestScore: 0,
        comebacks: 0,
        perfectGames: 0,
      },
      eliminated: false,
    };

    tournament.participants.push(participant);

    // Track player tournaments
    if (!this.playerTournaments.has(playerId)) {
      this.playerTournaments.set(playerId, []);
    }
    this.playerTournaments.get(playerId)!.push(tournamentId);

    eventBus.emit('tournament:registered', {
      tournamentId,
      playerId,
      participantCount: tournament.participants.length,
    });

    return true;
  }

  private startTournament(tournament: Tournament) {
    if (tournament.participants.length < 2) {
      console.log('Not enough participants');
      tournament.status = TournamentStatus.CANCELLED;
      this.refundEntryFees(tournament);
      return;
    }

    tournament.status = TournamentStatus.SEEDING;

    // Seed participants
    this.seedParticipants(tournament);

    // Generate brackets
    const generator = this.bracketGenerators.get(tournament.type);
    if (generator) {
      tournament.brackets = generator.generate(tournament.participants);
      tournament.matchesPerRound = generator.getMatchesPerRound(tournament.brackets);
    }

    tournament.status = TournamentStatus.IN_PROGRESS;
    tournament.currentRound = 1;
    this.activeTournaments.set(tournament.id, tournament);

    // Remove from upcoming
    const index = this.upcomingTournaments.indexOf(tournament);
    if (index !== -1) {
      this.upcomingTournaments.splice(index, 1);
    }

    // Start first round matches
    this.startRound(tournament, 1);

    eventBus.emit('tournament:started', {
      tournamentId: tournament.id,
      participantCount: tournament.participants.length,
      totalRounds: tournament.totalRounds,
    });
  }

  private seedParticipants(tournament: Tournament) {
    switch (tournament.rules.seedingMethod) {
      case 'random':
        this.shuffleArray(tournament.participants);
        break;
      case 'skill':
        tournament.participants.sort((a, b) => {
          // Sort by skill rating (would fetch from player stats)
          return 0; // Placeholder
        });
        break;
      case 'previous_performance':
        tournament.participants.sort((a, b) => {
          // Sort by previous tournament performance
          return 0; // Placeholder
        });
        break;
    }

    // Assign seeds
    tournament.participants.forEach((p, index) => {
      p.seed = index + 1;
    });
  }

  private startRound(tournament: Tournament, round: number) {
    const matches = tournament.matchesPerRound.get(round);
    if (!matches) return;

    matches.forEach((match) => {
      if (match.player1 && match.player2) {
        match.status = 'ready';
        this.notifyMatchReady(match);
      } else if (match.player1 || match.player2) {
        // Bye - auto advance
        this.advancePlayer(tournament, match, match.player1 || match.player2!);
      }
    });

    gameEvents.emit(GameEventType.TOURNAMENT_ROUND_COMPLETE, {
      tournamentId: tournament.id,
      round: round - 1,
      winners: [],
      eliminated: [],
    });
  }

  startMatch(matchId: string): boolean {
    const tournament = this.findTournamentByMatch(matchId);
    if (!tournament) return false;

    const match = this.findMatch(tournament, matchId);
    if (!match || match.status !== 'ready') return false;

    match.status = 'in_progress';
    match.startTime = Date.now();

    // Initialize games
    for (let i = 0; i < match.bestOf; i++) {
      match.games.push({
        gameNumber: i + 1,
        player1Score: 0,
        player2Score: 0,
        duration: 0,
        highlights: [],
      });
    }

    eventBus.emit('match:started', {
      matchId,
      player1: match.player1,
      player2: match.player2,
    });

    return true;
  }

  reportMatchScore(
    matchId: string,
    gameNumber: number,
    scores: { player1: number; player2: number }
  ): boolean {
    const tournament = this.findTournamentByMatch(matchId);
    if (!tournament) return false;

    const match = this.findMatch(tournament, matchId);
    if (!match || match.status !== 'in_progress') return false;

    const game = match.games[gameNumber - 1];
    if (!game) return false;

    game.player1Score = scores.player1;
    game.player2Score = scores.player2;
    game.winner = scores.player1 > scores.player2 ? match.player1! : match.player2!;
    game.duration = Date.now() - (match.startTime || Date.now());

    // Check for highlights
    this.checkForHighlights(game, match);

    // Update match scores
    match.score1 = match.games.filter((g) => g.winner === match.player1).length;
    match.score2 = match.games.filter((g) => g.winner === match.player2).length;

    // Check if match is complete
    const winsNeeded = Math.ceil(match.bestOf / 2);
    if (match.score1 >= winsNeeded || match.score2 >= winsNeeded) {
      this.completeMatch(tournament, match);
    }

    return true;
  }

  private completeMatch(tournament: Tournament, match: Match) {
    match.status = 'completed';
    match.endTime = Date.now();
    match.winner = match.score1 > match.score2 ? match.player1! : match.player2!;

    const loser = match.winner === match.player1 ? match.player2! : match.player1!;

    // Update participant stats
    this.updateParticipantStats(tournament, match);

    // Advance winner to next round
    this.advancePlayer(tournament, match, match.winner);

    // Handle loser
    if (tournament.type === TournamentType.DOUBLE_ELIMINATION) {
      this.moveToLoserBracket(tournament, match, loser);
    } else {
      this.eliminatePlayer(tournament, loser);
    }

    // Check if round is complete
    this.checkRoundComplete(tournament);

    eventBus.emit('match:completed', {
      matchId: match.id,
      winner: match.winner,
      score: { player1: match.score1, player2: match.score2 },
    });
  }

  private advancePlayer(tournament: Tournament, match: Match, playerId: string) {
    const bracket = tournament.brackets.find((b) => b.match?.id === match.id);
    if (!bracket || !bracket.nextMatchPosition) return;

    const nextBracket = tournament.brackets.find(
      (b) => b.round === bracket.round + 1 && b.position === bracket.nextMatchPosition
    );

    if (nextBracket && nextBracket.match) {
      if (!nextBracket.match.player1) {
        nextBracket.match.player1 = playerId;
      } else {
        nextBracket.match.player2 = playerId;
      }

      if (nextBracket.match.player1 && nextBracket.match.player2) {
        nextBracket.match.status = 'ready';
        this.notifyMatchReady(nextBracket.match);
      }
    }
  }

  private eliminatePlayer(tournament: Tournament, playerId: string) {
    const participant = tournament.participants.find((p) => p.id === playerId);
    if (participant) {
      participant.eliminated = true;
      participant.placement = this.calculatePlacement(tournament);
    }

    gameEvents.emit(GameEventType.TOURNAMENT_ELIMINATED, {
      tournamentId: tournament.id,
      playerId,
      placement: participant?.placement,
    });
  }

  private checkRoundComplete(tournament: Tournament) {
    const currentRoundMatches = tournament.matchesPerRound.get(tournament.currentRound);
    if (!currentRoundMatches) return;

    const allComplete = currentRoundMatches.every((m) => m.status === 'completed');
    if (allComplete) {
      tournament.currentRound++;

      if (tournament.currentRound > tournament.totalRounds) {
        this.completeTournament(tournament);
      } else {
        this.startRound(tournament, tournament.currentRound);
      }
    }
  }

  private completeTournament(tournament: Tournament) {
    tournament.status = TournamentStatus.COMPLETED;
    tournament.endTime = Date.now();

    // Calculate final placements
    this.calculateFinalPlacements(tournament);

    // Award prizes
    this.awardPrizes(tournament);

    // Move to completed
    this.activeTournaments.delete(tournament.id);
    this.completedTournaments.push(tournament);

    gameEvents.emit(GameEventType.TOURNAMENT_END, {
      tournamentId: tournament.id,
      winner: tournament.participants.find((p) => p.placement === 1)?.id,
    });
  }

  private calculateFinalPlacements(tournament: Tournament) {
    // Sort participants by placement
    tournament.participants.sort((a, b) => {
      if (a.eliminated && !b.eliminated) return 1;
      if (!a.eliminated && b.eliminated) return -1;
      if (a.placement && b.placement) return a.placement - b.placement;
      return b.stats.wins - a.stats.wins;
    });

    // Assign final placements
    tournament.participants.forEach((p, index) => {
      if (!p.placement) {
        p.placement = index + 1;
      }
    });
  }

  private awardPrizes(tournament: Tournament) {
    tournament.participants.forEach((participant) => {
      const prizes = this.getPrizesForPlacement(participant.placement!, tournament.prizes);
      if (prizes) {
        participant.prizesWon = prizes;
        this.grantPrizes(participant.id, prizes);
      }
    });

    // Award special prizes
    if (tournament.prizes.special) {
      this.awardSpecialPrizes(tournament);
    }
  }

  private getPrizesForPlacement(placement: number, prizes: TournamentPrizes): any {
    switch (placement) {
      case 1:
        return prizes.first;
      case 2:
        return prizes.second;
      case 3:
        return prizes.third;
      case 4:
      case 5:
      case 6:
      case 7:
      case 8:
        return prizes.top8;
      default:
        if (placement <= 16) return prizes.top16;
        return prizes.participation;
    }
  }

  private grantPrizes(playerId: string, prizes: any) {
    if (prizes.gold) {
      gameEvents.emit(GameEventType.CURRENCY_EARNED, {
        type: 'gold',
        amount: prizes.gold,
        source: 'tournament_prize',
      });
    }

    if (prizes.gems) {
      gameEvents.emit(GameEventType.CURRENCY_EARNED, {
        type: 'gems',
        amount: prizes.gems,
        source: 'tournament_prize',
      });
    }

    if (prizes.items) {
      prizes.items.forEach((item: string) => {
        eventBus.emit('item:grant', { playerId, itemId: item });
      });
    }

    if (prizes.title) {
      eventBus.emit('title:grant', { playerId, title: prizes.title });
    }
  }

  spectateMatch(matchId: string): boolean {
    const tournament = this.findTournamentByMatch(matchId);
    if (!tournament) return false;

    const match = this.findMatch(tournament, matchId);
    if (!match || match.status !== 'in_progress') return false;

    match.spectatorCount++;
    this.watchingMatch = match;

    eventBus.emit('spectator:joined', {
      matchId,
      spectatorCount: match.spectatorCount,
    });

    return true;
  }

  // Helper methods
  private calculateTotalRounds(participants: number, type: TournamentType): number {
    switch (type) {
      case TournamentType.SINGLE_ELIMINATION:
        return Math.ceil(Math.log2(participants));
      case TournamentType.DOUBLE_ELIMINATION:
        return Math.ceil(Math.log2(participants)) * 2 - 1;
      case TournamentType.ROUND_ROBIN:
        return participants - 1;
      default:
        return 1;
    }
  }

  private calculatePlacement(tournament: Tournament): number {
    const activePlayers = tournament.participants.filter((p) => !p.eliminated).length;
    return activePlayers + 1;
  }

  private checkForHighlights(game: Game, match: Match) {
    // Check for perfect game
    if (game.player1Score === 0 || game.player2Score === 0) {
      game.highlights.push({
        timestamp: Date.now(),
        type: 'perfect',
        player: game.winner!,
        description: 'Perfect game!',
      });
    }

    // Check for comeback
    // This would analyze score progression
  }

  private updateParticipantStats(tournament: Tournament, match: Match) {
    const p1 = tournament.participants.find((p) => p.id === match.player1);
    const p2 = tournament.participants.find((p) => p.id === match.player2);

    if (p1) {
      p1.stats.gamesPlayed += match.games.length;
      p1.stats.wins += match.winner === match.player1 ? 1 : 0;
      p1.stats.losses += match.winner === match.player2 ? 1 : 0;
      match.games.forEach((game) => {
        p1.stats.totalScore += game.player1Score;
        p1.stats.highestScore = Math.max(p1.stats.highestScore, game.player1Score);
      });
      p1.stats.averageScore = p1.stats.totalScore / p1.stats.gamesPlayed;
    }

    if (p2) {
      p2.stats.gamesPlayed += match.games.length;
      p2.stats.wins += match.winner === match.player2 ? 1 : 0;
      p2.stats.losses += match.winner === match.player1 ? 1 : 0;
      match.games.forEach((game) => {
        p2.stats.totalScore += game.player2Score;
        p2.stats.highestScore = Math.max(p2.stats.highestScore, game.player2Score);
      });
      p2.stats.averageScore = p2.stats.totalScore / p2.stats.gamesPlayed;
    }
  }

  private moveToLoserBracket(tournament: Tournament, match: Match, loserId: string) {
    // Implementation for double elimination
  }

  private awardSpecialPrizes(tournament: Tournament) {
    // Award prizes for special achievements
  }

  private checkTournamentStarts() {
    const now = Date.now();
    this.upcomingTournaments.forEach((tournament) => {
      if (tournament.startTime <= now && tournament.status === TournamentStatus.UPCOMING) {
        this.startRegistration(tournament);
      }
    });
  }

  private updateMatchStatuses() {
    this.activeTournaments.forEach((tournament) => {
      tournament.matchesPerRound.forEach((matches) => {
        matches.forEach((match) => {
          if (match.status === 'in_progress') {
            // Check for timeouts, disconnections, etc.
          }
        });
      });
    });
  }

  private processCompletedTournaments() {
    // Clean up old completed tournaments
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000; // 7 days
    this.completedTournaments = this.completedTournaments.filter((t) => t.endTime > cutoff);
  }

  private async checkEntryFee(playerId: string, fee: any): Promise<boolean> {
    // Check if player has sufficient resources
    return true; // Placeholder
  }

  private async payEntryFee(playerId: string, fee: any) {
    // Deduct entry fee
  }

  private refundEntryFees(tournament: Tournament) {
    // Refund all participants
  }

  private notifyMatchReady(match: Match) {
    eventBus.emit('notification:player', {
      playerId: match.player1,
      message: 'Your tournament match is ready!',
    });
    eventBus.emit('notification:player', {
      playerId: match.player2,
      message: 'Your tournament match is ready!',
    });
  }

  private findTournament(tournamentId: string): Tournament | null {
    return (
      this.activeTournaments.get(tournamentId) ||
      this.upcomingTournaments.find((t) => t.id === tournamentId) ||
      null
    );
  }

  private findTournamentByMatch(matchId: string): Tournament | null {
    for (const tournament of this.activeTournaments.values()) {
      for (const matches of tournament.matchesPerRound.values()) {
        if (matches.find((m) => m.id === matchId)) {
          return tournament;
        }
      }
    }
    return null;
  }

  private findMatch(tournament: Tournament, matchId: string): Match | null {
    for (const matches of tournament.matchesPerRound.values()) {
      const match = matches.find((m) => m.id === matchId);
      if (match) return match;
    }
    return null;
  }

  private async getPlayerName(playerId: string): Promise<string> {
    return 'Player'; // Placeholder
  }

  private shuffleArray<T>(array: T[]) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  private generateTournamentId(): string {
    return `tournament_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getDefaultPrizes(): TournamentPrizes {
    return {
      first: { gold: 10000, gems: 500, items: ['trophy_gold'], title: 'Champion' },
      second: { gold: 5000, gems: 250, items: ['trophy_silver'] },
      third: { gold: 2500, gems: 100, items: ['trophy_bronze'] },
      top8: { gold: 1000, gems: 50, items: [] },
      top16: { gold: 500, gems: 25, items: [] },
      participation: { gold: 100, gems: 10 },
    };
  }

  private getDefaultRules(): TournamentRules {
    return {
      gameMode: 'standard',
      timeLimit: 180,
      allowedPowerups: ['all'],
      bannedItems: [],
      matchFormat: 'best_of_3',
      seedingMethod: 'random',
      tiebreaker: 'sudden_death',
    };
  }

  // Public methods
  getActiveTournaments(): Tournament[] {
    return Array.from(this.activeTournaments.values());
  }

  getUpcomingTournaments(): Tournament[] {
    return this.upcomingTournaments;
  }

  getPlayerTournaments(playerId: string): Tournament[] {
    const tournamentIds = this.playerTournaments.get(playerId) || [];
    return tournamentIds
      .map((id) => this.findTournament(id))
      .filter((t) => t !== null) as Tournament[];
  }

  getCurrentMatch(playerId: string): Match | null {
    for (const tournament of this.activeTournaments.values()) {
      for (const matches of tournament.matchesPerRound.values()) {
        const match = matches.find(
          (m) => (m.player1 === playerId || m.player2 === playerId) && m.status === 'ready'
        );
        if (match) return match;
      }
    }
    return null;
  }

  cleanup() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }
}

// Bracket Generator Classes
abstract class BracketGenerator {
  abstract generate(participants: TournamentParticipant[]): Bracket[];
  abstract getMatchesPerRound(brackets: Bracket[]): Map<number, Match[]>;
}

class SingleEliminationGenerator extends BracketGenerator {
  generate(participants: TournamentParticipant[]): Bracket[] {
    const brackets: Bracket[] = [];
    const rounds = Math.ceil(Math.log2(participants.length));

    // Generate brackets for each round
    for (let round = 1; round <= rounds; round++) {
      const matchesInRound = Math.pow(2, rounds - round);
      for (let position = 0; position < matchesInRound; position++) {
        brackets.push({
          round,
          position,
          nextMatchPosition: Math.floor(position / 2),
        });
      }
    }

    return brackets;
  }

  getMatchesPerRound(brackets: Bracket[]): Map<number, Match[]> {
    const matchesPerRound = new Map<number, Match[]>();

    brackets.forEach((bracket) => {
      if (!matchesPerRound.has(bracket.round)) {
        matchesPerRound.set(bracket.round, []);
      }

      const match: Match = {
        id: `match_${bracket.round}_${bracket.position}`,
        round: bracket.round,
        position: bracket.position,
        player1: null,
        player2: null,
        score1: 0,
        score2: 0,
        status: 'pending',
        bestOf: 3,
        games: [],
        spectatorCount: 0,
      };

      bracket.match = match;
      matchesPerRound.get(bracket.round)!.push(match);
    });

    return matchesPerRound;
  }
}

class DoubleEliminationGenerator extends BracketGenerator {
  generate(participants: TournamentParticipant[]): Bracket[] {
    // Implementation for double elimination brackets
    return [];
  }

  getMatchesPerRound(brackets: Bracket[]): Map<number, Match[]> {
    return new Map();
  }
}

class RoundRobinGenerator extends BracketGenerator {
  generate(participants: TournamentParticipant[]): Bracket[] {
    // Implementation for round robin
    return [];
  }

  getMatchesPerRound(brackets: Bracket[]): Map<number, Match[]> {
    return new Map();
  }
}

export const tournamentSystem = TournamentSystem.getInstance();
