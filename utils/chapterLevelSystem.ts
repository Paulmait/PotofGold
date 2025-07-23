import { offlineManager } from './offlineManager';

export interface Chapter {
  id: string;
  name: string;
  description: string;
  objective: {
    type: 'collect_coins' | 'collect_gems' | 'avoid_obstacles' | 'collect_special' | 'survive_time';
    target: number;
    description: string;
  };
  reward: {
    type: 'skin' | 'effect' | 'unlock' | 'coins' | 'gems';
    itemId: string;
    amount?: number;
    description: string;
  };
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  timeLimit?: number; // seconds
  unlocked: boolean;
  completed: boolean;
  bestScore: number;
  attempts: number;
}

export interface ChapterProgress {
  userId: string;
  currentChapter: number;
  chapters: Chapter[];
  totalChapters: number;
  completedChapters: number;
  totalProgress: number;
  lastUpdated: Date;
}

export class ChapterLevelSystem {
  private static instance: ChapterLevelSystem;
  private progress: ChapterProgress | null = null;

  static getInstance(): ChapterLevelSystem {
    if (!ChapterLevelSystem.instance) {
      ChapterLevelSystem.instance = new ChapterLevelSystem();
    }
    return ChapterLevelSystem.instance;
  }

  // Initialize chapter system
  async initializeChapters(userId: string): Promise<ChapterProgress> {
    try {
      const offlineData = await offlineManager.getOfflineData(userId);
      
      if (offlineData.chapterProgress) {
        this.progress = offlineData.chapterProgress;
        return this.progress;
      }
    } catch (error) {
      console.log('Error loading chapter data:', error);
    }

    // Create default chapter progress
    this.progress = {
      userId,
      currentChapter: 1,
      chapters: this.generateChapters(),
      totalChapters: 0,
      completedChapters: 0,
      totalProgress: 0,
      lastUpdated: new Date(),
    };

    this.progress.totalChapters = this.progress.chapters.length;
    this.progress.completedChapters = 0;
    this.progress.totalProgress = 0;

    await this.saveChapterProgress();
    return this.progress;
  }

  // Generate all chapters
  private generateChapters(): Chapter[] {
    return [
      {
        id: 'chapter_1',
        name: 'Gold Cavern',
        description: 'Welcome to the mines! Start your gold collection journey.',
        objective: {
          type: 'collect_coins',
          target: 100,
          description: 'Catch 100 coins',
        },
        reward: {
          type: 'skin',
          itemId: 'florida_pot',
          description: 'Unlock Florida Pot skin',
        },
        difficulty: 'easy',
        unlocked: true,
        completed: false,
        bestScore: 0,
        attempts: 0,
      },
      {
        id: 'chapter_2',
        name: 'Crystal Falls',
        description: 'Shimmering crystals await! Collect precious gems.',
        objective: {
          type: 'collect_gems',
          target: 5,
          description: 'Collect 5 gems',
        },
        reward: {
          type: 'effect',
          itemId: 'crystal_trail_effect',
          description: 'Unlock Crystal Trail Effect',
        },
        difficulty: 'easy',
        unlocked: false,
        completed: false,
        bestScore: 0,
        attempts: 0,
      },
      {
        id: 'chapter_3',
        name: 'Obsidian Mine',
        description: 'Dangerous territory! Avoid falling rocks while collecting.',
        objective: {
          type: 'avoid_obstacles',
          target: 15,
          description: 'Avoid 15 falling rocks',
        },
        reward: {
          type: 'unlock',
          itemId: 'bonus_store',
          description: 'Unlock Bonus Store',
        },
        difficulty: 'medium',
        unlocked: false,
        completed: false,
        bestScore: 0,
        attempts: 0,
      },
      {
        id: 'chapter_4',
        name: 'Rainbow Depths',
        description: 'Magical scrolls float through rainbow-colored depths.',
        objective: {
          type: 'collect_special',
          target: 3,
          description: 'Catch 3 bonus scrolls',
        },
        reward: {
          type: 'skin',
          itemId: 'rainbow_pot_skin',
          description: 'Unlock Rainbow Pot Skin',
        },
        difficulty: 'medium',
        unlocked: false,
        completed: false,
        bestScore: 0,
        attempts: 0,
      },
      {
        id: 'chapter_5',
        name: 'Volcano Forge',
        description: 'Fiery challenges await in the molten depths.',
        objective: {
          type: 'collect_coins',
          target: 250,
          description: 'Catch 250 coins',
        },
        reward: {
          type: 'skin',
          itemId: 'volcano_pot_skin',
          description: 'Unlock Volcano Pot Skin',
        },
        difficulty: 'hard',
        timeLimit: 120, // 2 minutes
        unlocked: false,
        completed: false,
        bestScore: 0,
        attempts: 0,
      },
      {
        id: 'chapter_6',
        name: 'Cosmic Void',
        description: 'Navigate through space-time distortions.',
        objective: {
          type: 'survive_time',
          target: 180,
          description: 'Survive for 3 minutes',
        },
        reward: {
          type: 'skin',
          itemId: 'cosmic_pot_skin',
          description: 'Unlock Cosmic Pot Skin',
        },
        difficulty: 'expert',
        timeLimit: 180,
        unlocked: false,
        completed: false,
        bestScore: 0,
        attempts: 0,
      },
      {
        id: 'chapter_7',
        name: 'Diamond Peak',
        description: 'The highest challenge! Collect rare diamonds.',
        objective: {
          type: 'collect_gems',
          target: 10,
          description: 'Collect 10 diamonds',
        },
        reward: {
          type: 'effect',
          itemId: 'diamond_sparkle_effect',
          description: 'Unlock Diamond Sparkle Effect',
        },
        difficulty: 'expert',
        timeLimit: 150,
        unlocked: false,
        completed: false,
        bestScore: 0,
        attempts: 0,
      },
    ];
  }

  // Get current chapter
  getCurrentChapter(): Chapter | null {
    if (!this.progress) return null;
    return this.progress.chapters.find(c => c.id === `chapter_${this.progress!.currentChapter}`) || null;
  }

  // Get all chapters
  getAllChapters(): Chapter[] {
    if (!this.progress) return [];
    return this.progress.chapters;
  }

  // Check if chapter is unlocked
  isChapterUnlocked(chapterId: string): boolean {
    if (!this.progress) return false;
    const chapter = this.progress.chapters.find(c => c.id === chapterId);
    return chapter?.unlocked || false;
  }

  // Unlock next chapter
  async unlockNextChapter(): Promise<{
    success: boolean;
    chapter: Chapter | null;
    message: string;
  }> {
    if (!this.progress) {
      return { success: false, chapter: null, message: 'No progress available' };
    }

    const nextChapterIndex = this.progress.currentChapter;
    if (nextChapterIndex < this.progress.chapters.length) {
      const chapter = this.progress.chapters[nextChapterIndex - 1]; // 0-based index
      if (chapter) {
        chapter.unlocked = true;
        await this.saveChapterProgress();
        return {
          success: true,
          chapter,
          message: `Chapter ${nextChapterIndex} unlocked: ${chapter.name}`,
        };
      }
    }

    return { success: false, chapter: null, message: 'No more chapters to unlock' };
  }

  // Complete chapter
  async completeChapter(chapterId: string, score: number): Promise<{
    success: boolean;
    chapter: Chapter | null;
    reward: any;
    nextChapterUnlocked: boolean;
  }> {
    if (!this.progress) {
      return { success: false, chapter: null, reward: null, nextChapterUnlocked: false };
    }

    const chapter = this.progress.chapters.find(c => c.id === chapterId);
    if (!chapter || !chapter.unlocked) {
      return { success: false, chapter: null, reward: null, nextChapterUnlocked: false };
    }

    // Update chapter completion
    chapter.completed = true;
    chapter.bestScore = Math.max(chapter.bestScore, score);
    chapter.attempts++;

    // Update progress
    this.progress.completedChapters++;
    this.progress.totalProgress = (this.progress.completedChapters / this.progress.totalChapters) * 100;

    // Unlock next chapter
    const nextChapterUnlocked = await this.unlockNextChapter();

    await this.saveChapterProgress();

    return {
      success: true,
      chapter,
      reward: chapter.reward,
      nextChapterUnlocked: nextChapterUnlocked.success,
    };
  }

  // Check chapter objective progress
  checkChapterProgress(chapterId: string, currentValue: number): {
    completed: boolean;
    progress: number;
    remaining: number;
  } {
    if (!this.progress) {
      return { completed: false, progress: 0, remaining: 0 };
    }

    const chapter = this.progress.chapters.find(c => c.id === chapterId);
    if (!chapter) {
      return { completed: false, progress: 0, remaining: 0 };
    }

    const progress = Math.min(currentValue / chapter.objective.target, 1);
    const remaining = Math.max(chapter.objective.target - currentValue, 0);
    const completed = currentValue >= chapter.objective.target;

    return {
      completed,
      progress,
      remaining,
    };
  }

  // Get chapter statistics
  getChapterStats(): {
    totalChapters: number;
    completedChapters: number;
    currentChapter: number;
    totalProgress: number;
    unlockedChapters: number;
  } {
    if (!this.progress) {
      return {
        totalChapters: 0,
        completedChapters: 0,
        currentChapter: 0,
        totalProgress: 0,
        unlockedChapters: 0,
      };
    }

    const unlockedChapters = this.progress.chapters.filter(c => c.unlocked).length;

    return {
      totalChapters: this.progress.totalChapters,
      completedChapters: this.progress.completedChapters,
      currentChapter: this.progress.currentChapter,
      totalProgress: this.progress.totalProgress,
      unlockedChapters,
    };
  }

  // Get chapter by ID
  getChapterById(chapterId: string): Chapter | null {
    if (!this.progress) return null;
    return this.progress.chapters.find(c => c.id === chapterId) || null;
  }

  // Get difficulty color
  getDifficultyColor(difficulty: string): string {
    switch (difficulty) {
      case 'easy': return '#4CAF50';
      case 'medium': return '#FF9800';
      case 'hard': return '#F44336';
      case 'expert': return '#9C27B0';
      default: return '#4CAF50';
    }
  }

  // Save chapter progress
  private async saveChapterProgress(): Promise<void> {
    if (!this.progress) return;

    try {
      await offlineManager.saveOfflineData(this.progress.userId, {
        chapterProgress: this.progress,
      });

      await offlineManager.addPendingAction(this.progress.userId, {
        type: 'chapter_progress_update',
        data: this.progress,
      });
    } catch (error) {
      console.log('Error saving chapter progress:', error);
    }
  }
}

export const chapterLevelSystem = ChapterLevelSystem.getInstance(); 