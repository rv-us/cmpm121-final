import { GameState } from '../systems/GameStateManager.js';

export class EndingUI {
  private overlay: HTMLDivElement;
  private isVisible: boolean = false;

  constructor() {
    this.overlay = document.createElement('div');
    this.overlay.id = 'ending-overlay';
    this.overlay.style.position = 'fixed';
    this.overlay.style.top = '0';
    this.overlay.style.left = '0';
    this.overlay.style.width = '100%';
    this.overlay.style.height = '100%';
    this.overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.95)';
    this.overlay.style.display = 'none';
    this.overlay.style.justifyContent = 'center';
    this.overlay.style.alignItems = 'center';
    this.overlay.style.zIndex = '9999';
    this.overlay.style.fontFamily = 'Arial, sans-serif';
    this.overlay.style.color = 'white';
    this.overlay.style.textAlign = 'center';
    this.overlay.style.flexDirection = 'column';
    
    document.body.appendChild(this.overlay);
  }

  /**
   * Show victory screen
   */
  public showVictory(): void {
    this.overlay.innerHTML = '';
    
    const title = document.createElement('h1');
    title.textContent = '🎉 VICTORY! 🎉';
    title.style.fontSize = '72px';
    title.style.marginBottom = '30px';
    title.style.color = '#ffd700';
    title.style.textShadow = '0 0 20px rgba(255, 215, 0, 0.8)';
    title.style.animation = 'pulse 2s infinite';
    
    const message = document.createElement('p');
    message.textContent = 'You collected all the items and completed the puzzle!';
    message.style.fontSize = '24px';
    message.style.marginBottom = '20px';
    message.style.maxWidth = '600px';
    
    const subMessage = document.createElement('p');
    subMessage.textContent = 'Congratulations, brave adventurer!';
    subMessage.style.fontSize = '20px';
    subMessage.style.color = '#aaa';
    subMessage.style.marginBottom = '40px';
    
    const restartButton = this.createButton('Play Again', () => {
      window.location.reload();
    });
    
    // Add CSS animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
      }
    `;
    document.head.appendChild(style);
    
    this.overlay.appendChild(title);
    this.overlay.appendChild(message);
    this.overlay.appendChild(subMessage);
    this.overlay.appendChild(restartButton);
    
    this.show();
  }

  /**
   * Show game over screen
   */
  public showGameOver(): void {
    this.overlay.innerHTML = '';
    
    const title = document.createElement('h1');
    title.textContent = '💀 GAME OVER 💀';
    title.style.fontSize = '72px';
    title.style.marginBottom = '30px';
    title.style.color = '#ff4444';
    title.style.textShadow = '0 0 20px rgba(255, 68, 68, 0.8)';
    
    const message = document.createElement('p');
    message.textContent = 'You failed the puzzle too many times.';
    message.style.fontSize = '24px';
    message.style.marginBottom = '20px';
    message.style.maxWidth = '600px';
    
    const subMessage = document.createElement('p');
    subMessage.textContent = 'Better luck next time!';
    subMessage.style.fontSize = '20px';
    subMessage.style.color = '#aaa';
    subMessage.style.marginBottom = '40px';
    
    const restartButton = this.createButton('Try Again', () => {
      window.location.reload();
    });
    
    this.overlay.appendChild(title);
    this.overlay.appendChild(message);
    this.overlay.appendChild(subMessage);
    this.overlay.appendChild(restartButton);
    
    this.show();
  }

  /**
   * Create a styled button
   */
  private createButton(text: string, onClick: () => void): HTMLButtonElement {
    const button = document.createElement('button');
    button.textContent = text;
    button.style.padding = '15px 40px';
    button.style.fontSize = '20px';
    button.style.backgroundColor = '#ffd700';
    button.style.color = '#000';
    button.style.border = 'none';
    button.style.borderRadius = '10px';
    button.style.cursor = 'pointer';
    button.style.fontWeight = 'bold';
    button.style.transition = 'all 0.3s';
    button.style.boxShadow = '0 4px 15px rgba(255, 215, 0, 0.4)';
    
    button.onmouseenter = () => {
      button.style.backgroundColor = '#ffed4e';
      button.style.transform = 'scale(1.1)';
      button.style.boxShadow = '0 6px 20px rgba(255, 215, 0, 0.6)';
    };
    
    button.onmouseleave = () => {
      button.style.backgroundColor = '#ffd700';
      button.style.transform = 'scale(1)';
      button.style.boxShadow = '0 4px 15px rgba(255, 215, 0, 0.4)';
    };
    
    button.onclick = onClick;
    
    return button;
  }

  /**
   * Show the overlay
   */
  private show(): void {
    this.overlay.style.display = 'flex';
    this.isVisible = true;
  }

  /**
   * Hide the overlay
   */
  public hide(): void {
    this.overlay.style.display = 'none';
    this.isVisible = false;
  }

  /**
   * Clean up
   */
  public dispose(): void {
    if (this.overlay.parentElement) {
      this.overlay.parentElement.removeChild(this.overlay);
    }
  }
}