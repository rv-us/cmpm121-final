import * as CANNON from 'cannon-es';
import { PhysicsObject } from './PhysicsObject.js';

export class KeyboardController {
  private ball: PhysicsObject | null = null;
  private keys: Set<string> = new Set();
  private forceStrength: number = 2; //refined force strength

  constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.key.toLowerCase());
    });

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.key.toLowerCase());
    });
  }

  public setBall(ball: PhysicsObject): void {
    this.ball = ball;
  }

  public update(): void {
    if (!this.ball) return;

    const force = new CANNON.Vec3(0, 0, 0);

    // Arrow keys or WASD
    if (this.keys.has('arrowleft') || this.keys.has('a')) {
      force.x -= this.forceStrength;
    }
    if (this.keys.has('arrowright') || this.keys.has('d')) {
      force.x += this.forceStrength;
    }
    if (this.keys.has('arrowup') || this.keys.has('w')) {
      force.z -= this.forceStrength; // Negative Z is forward in our setup
    }
    if (this.keys.has('arrowdown') || this.keys.has('s')) {
      force.z += this.forceStrength;
    }

    // Apply force if any key is pressed
    if (force.length() > 0) {
      this.ball.body.applyForce(force, this.ball.body.position);
    }
  }
}

