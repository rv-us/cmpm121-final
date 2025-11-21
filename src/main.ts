import { Game } from './game/Game.js';

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('game-container');
  if (!container) {
    throw new Error('Game container not found');
  }

  const game = new Game(container);
  game.start();
});

