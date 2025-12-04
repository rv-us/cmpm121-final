export enum ThemeMode {
  LIGHT = 'light',
  DARK = 'dark',
}

export interface ThemeColors {
  // Scene colors
  ambientLightColor: number;
  ambientLightIntensity: number;
  directionalLightColor: number;
  directionalLightIntensity: number;
  fogColor: number;
  fogNear: number;
  fogFar: number;
  
  // Room colors
  floorColor: number;
  wallColor: number;
  corridorColor: number;
  puzzleFloorColor: number;
  
  // UI colors (as CSS strings)
  uiBackground: string;
  uiText: string;
  uiBorder: string;
  uiAccent: string;
}

export class ThemeManager {
  private currentTheme: ThemeMode = ThemeMode.DARK;
  private onThemeChangeCallbacks: Array<(theme: ThemeMode) => void> = [];
  private mediaQuery: MediaQueryList;

  constructor() {
    // Detect system preference
    this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    this.currentTheme = this.mediaQuery.matches ? ThemeMode.DARK : ThemeMode.LIGHT;
    
    // Listen for system preference changes
    this.mediaQuery.addEventListener('change', (e) => {
      this.currentTheme = e.matches ? ThemeMode.DARK : ThemeMode.LIGHT;
      console.log(`System theme changed to: ${this.currentTheme}`);
      this.notifyThemeChange();
    });

    console.log(`Initial theme: ${this.currentTheme}`);
  }

  /**
   * Get current theme mode
   */
  public getCurrentTheme(): ThemeMode {
    return this.currentTheme;
  }

  /**
   * Get theme colors for current mode
   */
  public getThemeColors(): ThemeColors {
    if (this.currentTheme === ThemeMode.LIGHT) {
      return this.getLightThemeColors();
    } else {
      return this.getDarkThemeColors();
    }
  }

  /**
   * Light theme colors (daytime)
   */
  private getLightThemeColors(): ThemeColors {
    return {
      // Bright, sunny lighting
      ambientLightColor: 0xffffff,
      ambientLightIntensity: 1.2,
      directionalLightColor: 0xffffcc,
      directionalLightIntensity: 1.0,
      fogColor: 0xccddff,
      fogNear: 30,
      fogFar: 80,
      
      // Lighter room colors
      floorColor: 0xe8e8e8,
      wallColor: 0xbbbbbb,
      corridorColor: 0xd0d0d0,
      puzzleFloorColor: 0xb8e6b8,
      
      // Light UI theme
      uiBackground: 'rgba(255, 255, 255, 0.95)',
      uiText: '#000000',
      uiBorder: '#4CAF50',
      uiAccent: '#2196F3',
    };
  }

  /**
   * Dark theme colors (nighttime)
   */
  private getDarkThemeColors(): ThemeColors {
    return {
      // Dim, moonlit lighting
      ambientLightColor: 0x4a5f7f,
      ambientLightIntensity: 0.5,
      directionalLightColor: 0x8899bb,
      directionalLightIntensity: 0.4,
      fogColor: 0x1a1a2e,
      fogNear: 20,
      fogFar: 60,
      
      // Darker room colors
      floorColor: 0x333333,
      wallColor: 0x222222,
      corridorColor: 0x2a2a2a,
      puzzleFloorColor: 0x2d4d2d,
      
      // Dark UI theme
      uiBackground: 'rgba(0, 0, 0, 0.9)',
      uiText: '#ffffff',
      uiBorder: '#4CAF50',
      uiAccent: '#64B5F6',
    };
  }

  /**
   * Register callback for theme changes
   */
  public onThemeChange(callback: (theme: ThemeMode) => void): void {
    this.onThemeChangeCallbacks.push(callback);
  }

  /**
   * Notify all callbacks of theme change
   */
  private notifyThemeChange(): void {
    this.onThemeChangeCallbacks.forEach(callback => callback(this.currentTheme));
  }

  /**
   * Manually set theme (for testing or manual override)
   */
  public setTheme(theme: ThemeMode): void {
    if (this.currentTheme !== theme) {
      this.currentTheme = theme;
      console.log(`Theme manually set to: ${this.currentTheme}`);
      this.notifyThemeChange();
    }
  }

  /**
   * Apply theme to CSS variables
   */
  public applyThemeToCSS(): void {
    const colors = this.getThemeColors();
    const root = document.documentElement;
    
    root.style.setProperty('--ui-background', colors.uiBackground);
    root.style.setProperty('--ui-text', colors.uiText);
    root.style.setProperty('--ui-border', colors.uiBorder);
    root.style.setProperty('--ui-accent', colors.uiAccent);
  }
}