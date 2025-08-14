export type MonthlyDrop = {
  id: string;                 // e.g., "drop_2025_08"
  monthLabel: string;         // "August 2025"
  cartSkinId: string;
  trailId: string;
  badgeId: string;
  frameId: string;
  bonusCoins: number;
  claimWindowDays?: number;   // default 45
  previewArt: {
    cartSkinPng: string;
    trailPng: string;
    badgePng: string;
    framePng: string;
  };
};

export type UserDropClaim = {
  userId: string;
  dropId: string;
  claimedAt: number;          // ms epoch
  granularity: "monthly";
};

export type DropCalendar = {
  defaultClaimWindowDays: number;
  months: string[];
};

export type UserInventory = {
  skins: string[];
  trails: string[];
  badges: string[];
  frames: string[];
  coins: number;
  lastUpdated: number;
};