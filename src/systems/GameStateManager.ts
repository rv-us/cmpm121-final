export enum GameState {
    PLAYING = 'playing',
    VICTORY = 'victory',
    GAME_OVER = 'game_over',
  }
  
  export interface GameProgress {
    itemsCollected: number;
    requiredItems: number;
    puzzleCompleted: boolean;
    puzzleAttempts: number;
    maxPuzzleAttempts: number;
  }
  
  export class GameStateManager {
    private state: GameState = GameState.PLAYING;
    private progress: GameProgress = {
      itemsCollected: 0,
      requiredItems: 4, // Golden Key, Health Potion, Gold Coin, Blue Gem
      puzzleCompleted: false,
      puzzleAttempts: 0,
      maxPuzzleAttempts: 3,
    };
    private onStateChangeCallbacks: Array<(state: GameState) => void> = [];
  
    /**
     * Get current game state
     */
    public getState(): GameState {
      return this.state;
    }
  
    /**
     * Get current progress
     */
    public getProgress(): GameProgress {
      return { ...this.progress };
    }
  
    /**
     * Update items collected count
     */
    public setItemsCollected(count: number): void {
      this.progress.itemsCollected = count;
      this.checkVictoryCondition();
    }
  
    /**
     * Mark puzzle as completed
     */
    public completePuzzle(): void {
      if (!this.progress.puzzleCompleted) {
        this.progress.puzzleCompleted = true;
        console.log('Puzzle completed!');
        this.checkVictoryCondition();
      }
    }
  
    /**
     * Record a failed puzzle attempt
     */
    public recordPuzzleFailure(): void {
      this.progress.puzzleAttempts++;
      console.log(`Puzzle attempt ${this.progress.puzzleAttempts}/${this.progress.maxPuzzleAttempts}`);
      
      if (this.progress.puzzleAttempts >= this.progress.maxPuzzleAttempts) {
        this.setGameOver();
      }
    }
  
    /**
     * Check if victory conditions are met
     */
    private checkVictoryCondition(): void {
      if (this.state !== GameState.PLAYING) {
        return;
      }
  
      const hasAllItems = this.progress.itemsCollected >= this.progress.requiredItems;
      const hasCompletedPuzzle = this.progress.puzzleCompleted;
  
      if (hasAllItems && hasCompletedPuzzle) {
        this.setVictory();
      }
    }
  
    /**
     * Set game state to victory
     */
    private setVictory(): void {
      this.state = GameState.VICTORY;
      console.log('🎉 VICTORY! You won the game!');
      this.notifyStateChange();
    }
  
    /**
     * Set game state to game over
     */
    private setGameOver(): void {
      this.state = GameState.GAME_OVER;
      console.log('💀 GAME OVER! Too many failed attempts.');
      this.notifyStateChange();
    }
  
    /**
     * Reset the game state
     */
    public reset(): void {
      this.state = GameState.PLAYING;
      this.progress = {
        itemsCollected: 0,
        requiredItems: 4,
        puzzleCompleted: false,
        puzzleAttempts: 0,
        maxPuzzleAttempts: 3,
      };
      this.notifyStateChange();
    }
  
    /**
     * Register a callback for state changes
     */
    public onStateChange(callback: (state: GameState) => void): void {
      this.onStateChangeCallbacks.push(callback);
    }
  
    /**
     * Notify all callbacks of state change
     */
    private notifyStateChange(): void {
      this.onStateChangeCallbacks.forEach(callback => callback(this.state));
    }
  }