import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export type HandPreference = 'left' | 'right' | 'auto';

export interface UILayout {
  handPreference: HandPreference;
  isOneHandMode: boolean;
  safeAreaInsets: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  buttonPositions: {
    pause: { x: number; y: number };
    powerUp: { x: number; y: number };
    settings: { x: number; y: number };
  };
  gameArea: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export class UIManager {
  private static instance: UIManager;
  private layout: UILayout;
  private isInitialized: boolean = false;

  static getInstance(): UIManager {
    if (!UIManager.instance) {
      UIManager.instance = new UIManager();
    }
    return UIManager.instance;
  }

  constructor() {
    this.layout = {
      handPreference: 'auto',
      isOneHandMode: false,
      safeAreaInsets: {
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
      },
      buttonPositions: {
        pause: { x: width - 80, y: 60 },
        powerUp: { x: 20, y: height - 120 },
        settings: { x: 20, y: 60 },
      },
      gameArea: {
        x: 0,
        y: 120,
        width: width,
        height: height - 240,
      },
    };
  }

  // Initialize UI with device dimensions and safe areas
  initialize(safeAreaInsets: { top: number; bottom: number; left: number; right: number }): void {
    this.layout.safeAreaInsets = safeAreaInsets;
    this.updateLayout();
    this.isInitialized = true;
  }

  // Set hand preference
  setHandPreference(preference: HandPreference): void {
    this.layout.handPreference = preference;
    this.updateLayout();
  }

  // Toggle one-hand mode
  toggleOneHandMode(): void {
    this.layout.isOneHandMode = !this.layout.isOneHandMode;
    this.updateLayout();
  }

  // Update layout based on current settings
  private updateLayout(): void {
    const { handPreference, isOneHandMode, safeAreaInsets } = this.layout;
    
    if (isOneHandMode) {
      this.applyOneHandLayout(handPreference);
    } else {
      this.applyStandardLayout();
    }
  }

  // Apply one-hand mode layout
  private applyOneHandLayout(handPreference: HandPreference): void {
    const isLeftHand = handPreference === 'left' || 
                      (handPreference === 'auto' && this.detectLeftHandedUser());
    
    if (isLeftHand) {
      // Left-hand layout
      this.layout.buttonPositions = {
        pause: { x: 20, y: 60 + safeAreaInsets.top },
        powerUp: { x: width - 80, y: height - 120 - safeAreaInsets.bottom },
        settings: { x: width - 80, y: 60 + safeAreaInsets.top },
      };
    } else {
      // Right-hand layout
      this.layout.buttonPositions = {
        pause: { x: width - 80, y: 60 + safeAreaInsets.top },
        powerUp: { x: 20, y: height - 120 - safeAreaInsets.bottom },
        settings: { x: 20, y: 60 + safeAreaInsets.top },
      };
    }

    // Adjust game area for one-hand mode
    this.layout.gameArea = {
      x: 0,
      y: 120 + safeAreaInsets.top,
      width: width,
      height: height - 240 - safeAreaInsets.top - safeAreaInsets.bottom,
    };
  }

  // Apply standard layout
  private applyStandardLayout(): void {
    this.layout.buttonPositions = {
      pause: { x: width - 80, y: 60 + this.layout.safeAreaInsets.top },
      powerUp: { x: width / 2 - 30, y: height - 120 - this.layout.safeAreaInsets.bottom },
      settings: { x: 20, y: 60 + this.layout.safeAreaInsets.top },
    };

    this.layout.gameArea = {
      x: 0,
      y: 120 + this.layout.safeAreaInsets.top,
      width: width,
      height: height - 240 - this.layout.safeAreaInsets.top - this.layout.safeAreaInsets.bottom,
    };
  }

  // Detect if user is left-handed (simple heuristic)
  private detectLeftHandedUser(): boolean {
    // In a real app, you might use device orientation, user settings, or analytics
    // For now, we'll use a simple random approach
    return Math.random() > 0.5;
  }

  // Get current layout
  getLayout(): UILayout {
    return { ...this.layout };
  }

  // Get button position
  getButtonPosition(button: keyof UILayout['buttonPositions']): { x: number; y: number } {
    return { ...this.layout.buttonPositions[button] };
  }

  // Get game area
  getGameArea(): UILayout['gameArea'] {
    return { ...this.layout.gameArea };
  }

  // Check if one-hand mode is active
  isOneHandMode(): boolean {
    return this.layout.isOneHandMode;
  }

  // Get hand preference
  getHandPreference(): HandPreference {
    return this.layout.handPreference;
  }

  // Get safe area insets
  getSafeAreaInsets(): UILayout['safeAreaInsets'] {
    return { ...this.layout.safeAreaInsets };
  }

  // Calculate optimal button size based on screen size
  getButtonSize(): number {
    const screenArea = width * height;
    const baseSize = 44; // Minimum touch target size
    
    if (screenArea < 2000000) { // Small screen
      return baseSize;
    } else if (screenArea < 4000000) { // Medium screen
      return baseSize + 8;
    } else { // Large screen
      return baseSize + 16;
    }
  }

  // Get optimal pot size based on screen size
  getPotSize(): number {
    const screenArea = width * height;
    const baseSize = 80;
    
    if (screenArea < 2000000) { // Small screen
      return baseSize;
    } else if (screenArea < 4000000) { // Medium screen
      return baseSize + 20;
    } else { // Large screen
      return baseSize + 40;
    }
  }

  // Get optimal coin size based on screen size
  getCoinSize(): number {
    const screenArea = width * height;
    const baseSize = 30;
    
    if (screenArea < 2000000) { // Small screen
      return baseSize;
    } else if (screenArea < 4000000) { // Medium screen
      return baseSize + 5;
    } else { // Large screen
      return baseSize + 10;
    }
  }

  // Check if device is in landscape mode
  isLandscape(): boolean {
    return width > height;
  }

  // Get optimal font size based on screen size
  getFontSize(size: 'small' | 'medium' | 'large'): number {
    const screenArea = width * height;
    const baseSizes = {
      small: 12,
      medium: 16,
      large: 20,
    };
    
    const baseSize = baseSizes[size];
    
    if (screenArea < 2000000) { // Small screen
      return baseSize - 2;
    } else if (screenArea < 4000000) { // Medium screen
      return baseSize;
    } else { // Large screen
      return baseSize + 2;
    }
  }

  // Get optimal spacing based on screen size
  getSpacing(): number {
    const screenArea = width * height;
    const baseSpacing = 16;
    
    if (screenArea < 2000000) { // Small screen
      return baseSpacing - 4;
    } else if (screenArea < 4000000) { // Medium screen
      return baseSpacing;
    } else { // Large screen
      return baseSpacing + 4;
    }
  }

  // Check if device supports haptic feedback
  supportsHaptics(): boolean {
    // In a real app, you'd check device capabilities
    return true;
  }

  // Get optimal animation duration based on device performance
  getAnimationDuration(): number {
    // In a real app, you might detect device performance
    return 300;
  }

  // Reset layout to defaults
  resetLayout(): void {
    this.layout.handPreference = 'auto';
    this.layout.isOneHandMode = false;
    this.updateLayout();
  }
}

export const uiManager = UIManager.getInstance(); 