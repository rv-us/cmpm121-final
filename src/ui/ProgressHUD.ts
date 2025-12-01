import { GameStateManager } from '../systems/GameStateManager.js';

export class ProgressHUD {
  private container: HTMLDivElement;
  private gameStateManager: GameStateManager;

  constructor(gameStateManager: GameStateManager) {
    this.gameStateManager = gameStateManager;
    
    this.container = document.createElement('div');
    this.container.id = 'progress-hud';
    this.container.style.position = 'absolute';
    this.container.style.top = '80px';
    this.container.style.left = '20px';
    this.container.style.padding = '15px';
    this.container.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    this.container.style.color = 'white';
    this.container.style.fontFamily = 'Arial, sans-serif';
    this.container.style.fontSize = '14px';
    this.container.style.borderRadius = '8px';
    this.container.style.border = '2px solid #4CAF50';
    this.container.style.zIndex = '1000';
    this.container.style.minWidth = '200px';
    
    document.body.appendChild(this.container);
    this.refresh();
  }

  /**
   * Refresh the HUD display
   */
  public refresh(): void {
    const progress = this.gameStateManager.getProgress();
    
    this.container.innerHTML = `
      <div style="margin-bottom: 10px; font-weight: bold; font-size: 16px; color: #ffd700; border-bottom: 1px solid #ffd700; padding-bottom: 5px;">
        Quest Objectives
      </div>
      <div style="margin-bottom: 8px;">
        ${this.createCheckbox(progress.itemsCollected >= progress.requiredItems)}
        Collect all items (${progress.itemsCollected}/${progress.requiredItems})
      </div>
      <div style="margin-bottom: 8px;">
        ${this.createCheckbox(progress.puzzleCompleted)}
        Complete the puzzle
      </div>
      <div style="margin-top: 10px; font-size: 12px; color: #ff6b6b;">
        Puzzle attempts: ${progress.puzzleAttempts}/${progress.maxPuzzleAttempts}
      </div>
    `;
  }

  /**
   * Create a checkbox icon
   */
  private createCheckbox(checked: boolean): string {
    if (checked) {
      return '<span style="color: #4CAF50; margin-right: 8px;">✓</span>';
    } else {
      return '<span style="color: #666; margin-right: 8px;">☐</span>';
    }
  }

  /**
   * Clean up
   */
  public dispose(): void {
    if (this.container.parentElement) {
      this.container.parentElement.removeChild(this.container);
    }
  }
}