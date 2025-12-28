import { MonthlyDrop, DropCalendar } from '../../types/drops';

// Static imports of all drop files
import calendar from '../../../assets/drops/calendar.json';
import drop_2025_08 from '../../../assets/drops/month_2025_08.json';
import drop_2025_09 from '../../../assets/drops/month_2025_09.json';
import drop_2025_10 from '../../../assets/drops/month_2025_10.json';
import drop_2025_11 from '../../../assets/drops/month_2025_11.json';
import drop_2025_12 from '../../../assets/drops/month_2025_12.json';
import drop_2026_01 from '../../../assets/drops/month_2026_01.json';
import drop_2026_02 from '../../../assets/drops/month_2026_02.json';
import drop_2026_03 from '../../../assets/drops/month_2026_03.json';
import drop_2026_04 from '../../../assets/drops/month_2026_04.json';
import drop_2026_05 from '../../../assets/drops/month_2026_05.json';
import drop_2026_06 from '../../../assets/drops/month_2026_06.json';
import drop_2026_07 from '../../../assets/drops/month_2026_07.json';

/**
 * Drop Catalog - manages static monthly drop data
 */
class DropCatalog {
  private static instance: DropCatalog;
  private drops: Map<string, MonthlyDrop> = new Map();
  private calendar: DropCalendar = calendar as DropCalendar;

  private constructor() {
    this.initializeCatalog();
  }

  static getInstance(): DropCatalog {
    if (!DropCatalog.instance) {
      DropCatalog.instance = new DropCatalog();
    }
    return DropCatalog.instance;
  }

  private initializeCatalog(): void {
    // Map all drops by their ID
    const allDrops = [
      drop_2025_08,
      drop_2025_09,
      drop_2025_10,
      drop_2025_11,
      drop_2025_12,
      drop_2026_01,
      drop_2026_02,
      drop_2026_03,
      drop_2026_04,
      drop_2026_05,
      drop_2026_06,
      drop_2026_07,
    ] as MonthlyDrop[];

    allDrops.forEach((drop) => {
      this.drops.set(drop.id, drop);
    });
  }

  /**
   * Get a drop by its ID
   */
  getDropById(dropId: string): MonthlyDrop | null {
    return this.drops.get(dropId) || null;
  }

  /**
   * Get all available drops
   */
  getAllDrops(): MonthlyDrop[] {
    return Array.from(this.drops.values());
  }

  /**
   * Get upcoming drops (future months)
   */
  getUpcomingDrops(n?: number): MonthlyDrop[] {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const currentDropId = `drop_${currentYear}_${String(currentMonth).padStart(2, '0')}`;

    const allDrops = this.getAllDrops();
    const currentIndex = allDrops.findIndex((d) => d.id === currentDropId);

    if (currentIndex === -1) {
      return [];
    }

    const upcoming = allDrops.slice(currentIndex + 1);
    return n ? upcoming.slice(0, n) : upcoming;
  }

  /**
   * Get past drops
   */
  getPastDrops(): MonthlyDrop[] {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const currentDropId = `drop_${currentYear}_${String(currentMonth).padStart(2, '0')}`;

    const allDrops = this.getAllDrops();
    const currentIndex = allDrops.findIndex((d) => d.id === currentDropId);

    if (currentIndex === -1) {
      return allDrops; // All drops are in the past
    }

    return allDrops.slice(0, currentIndex);
  }

  /**
   * Get the current month's drop based on system date
   */
  getCurrentMonthDrop(): MonthlyDrop | null {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const currentDropId = `drop_${currentYear}_${String(currentMonth).padStart(2, '0')}`;

    return this.getDropById(currentDropId);
  }

  /**
   * Check if a drop is within its claim window
   */
  isDropClaimable(dropId: string): boolean {
    const drop = this.getDropById(dropId);
    if (!drop) return false;

    const now = Date.now();
    const [year, month] = dropId.replace('drop_', '').split('_').map(Number);

    // First day of the drop month
    const dropStart = new Date(year, month - 1, 1).getTime();

    // Calculate end of claim window
    const claimWindowDays = drop.claimWindowDays || this.calendar.defaultClaimWindowDays;
    const claimWindowEnd = dropStart + claimWindowDays * 24 * 60 * 60 * 1000;

    return now >= dropStart && now <= claimWindowEnd;
  }

  /**
   * Get days remaining in claim window
   */
  getDaysRemainingInClaimWindow(dropId: string): number {
    const drop = this.getDropById(dropId);
    if (!drop) return 0;

    const now = Date.now();
    const [year, month] = dropId.replace('drop_', '').split('_').map(Number);

    // First day of the drop month
    const dropStart = new Date(year, month - 1, 1).getTime();

    // Calculate end of claim window
    const claimWindowDays = drop.claimWindowDays || this.calendar.defaultClaimWindowDays;
    const claimWindowEnd = dropStart + claimWindowDays * 24 * 60 * 60 * 1000;

    if (now > claimWindowEnd) return 0;

    const daysRemaining = Math.ceil((claimWindowEnd - now) / (24 * 60 * 60 * 1000));
    return Math.max(0, daysRemaining);
  }

  /**
   * Get the default claim window days
   */
  getDefaultClaimWindowDays(): number {
    return this.calendar.defaultClaimWindowDays;
  }
}

export const dropCatalog = DropCatalog.getInstance();
