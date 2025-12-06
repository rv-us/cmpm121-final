import * as CANNON from 'cannon-es';
import { PhysicsObject } from './PhysicsObject.js';

export class TouchController {
  private ball: PhysicsObject | null = null;
  private forceStrength: number = 2;
  private touchStartX: number = 0;
  private touchStartY: number = 0;
  private isTouching: boolean = false;
  private currentForce: CANNON.Vec3 = new CANNON.Vec3(0, 0, 0);
  private joystickBase: HTMLDivElement | null = null;
  private joystickStick: HTMLDivElement | null = null;
  private joystickActive: boolean = false;
  private joystickCenterX: number = 0;
  private joystickCenterY: number = 0;
  private joystickRadius: number = 50;

  constructor() {
    this.setupTouchListeners();
    this.createVirtualJoystick();
  }

  private createVirtualJoystick(): void {
    // Create joystick base
    this.joystickBase = document.createElement('div');
    this.joystickBase.id = 'virtual-joystick-base';
    this.joystickBase.style.cssText = `
      position: fixed;
      bottom: 100px;
      left: 100px;
      width: 100px;
      height: 100px;
      border-radius: 50%;
      background: rgba(0, 0, 0, 0.5);
      border: 2px solid rgba(255, 255, 255, 0.8);
      display: none;
      z-index: 1000;
      touch-action: none;
    `;

    // Create joystick stick
    this.joystickStick = document.createElement('div');
    this.joystickStick.id = 'virtual-joystick-stick';
    this.joystickStick.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.9);
      transform: translate(-50%, -50%);
      transition: transform 0.1s;
    `;

    this.joystickBase.appendChild(this.joystickStick);
    document.body.appendChild(this.joystickBase);
  }

  private setupTouchListeners(): void {
    // Touch start
    window.addEventListener('touchstart', (e) => {
      // Only show joystick if ball is set (i.e., we're in PuzzleScene)
      if (!this.ball) {
        return; // Don't interfere with RoomScene touch controls
      }

      if (e.touches.length > 0) {
        const touch = e.touches[0];
        this.touchStartX = touch.clientX;
        this.touchStartY = touch.clientY;
        this.isTouching = true;

        // Show joystick at touch position
        if (this.joystickBase) {
          this.joystickBase.style.display = 'block';
          this.joystickBase.style.left = `${touch.clientX - 50}px`;
          this.joystickBase.style.top = `${touch.clientY - 50}px`;
          this.joystickCenterX = touch.clientX;
          this.joystickCenterY = touch.clientY;
          this.joystickActive = true;
        }
      }
    }, { passive: false });

    // Touch move
    window.addEventListener('touchmove', (e) => {
      // Only handle joystick movement if ball is set (i.e., we're in PuzzleScene)
      if (!this.ball || !this.isTouching || !this.joystickActive) {
        return;
      }

      if (e.touches.length > 0) {
        e.preventDefault();
        const touch = e.touches[0];
        const deltaX = touch.clientX - this.joystickCenterX;
        const deltaY = touch.clientY - this.joystickCenterY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        // Limit stick movement to joystick radius
        const clampedDistance = Math.min(distance, this.joystickRadius);
        const angle = Math.atan2(deltaY, deltaX);
        
        const stickX = Math.cos(angle) * clampedDistance;
        const stickY = Math.sin(angle) * clampedDistance;
        
        if (this.joystickStick) {
          this.joystickStick.style.transform = `translate(calc(-50% + ${stickX}px), calc(-50% + ${stickY}px))`;
        }

        // Calculate force direction (normalized)
        const normalizedX = clampedDistance > 0 ? deltaX / distance : 0;
        const normalizedY = clampedDistance > 0 ? deltaY / distance : 0;

        // Apply force (Y is inverted for screen coordinates)
        this.currentForce.set(
          normalizedX * this.forceStrength,
          0,
          -normalizedY * this.forceStrength // Negative for forward movement
        );
      }
    }, { passive: false });

    // Touch end
    window.addEventListener('touchend', (e) => {
      this.isTouching = false;
      this.currentForce.set(0, 0, 0);
      this.joystickActive = false;
      
      if (this.joystickBase) {
        this.joystickBase.style.display = 'none';
      }
      
      if (this.joystickStick) {
        this.joystickStick.style.transform = 'translate(-50%, -50%)';
      }
    }, { passive: false });

    // Touch cancel
    window.addEventListener('touchcancel', () => {
      this.isTouching = false;
      this.currentForce.set(0, 0, 0);
      this.joystickActive = false;
      
      if (this.joystickBase) {
        this.joystickBase.style.display = 'none';
      }
      
      if (this.joystickStick) {
        this.joystickStick.style.transform = 'translate(-50%, -50%)';
      }
    }, { passive: false });
  }

  public setBall(ball: PhysicsObject | null): void {
    this.ball = ball;
    // Hide joystick when ball is cleared (e.g., exiting puzzle scene)
    if (!ball && this.joystickBase) {
      this.joystickBase.style.display = 'none';
      this.joystickActive = false;
      this.currentForce.set(0, 0, 0);
      if (this.joystickStick) {
        this.joystickStick.style.transform = 'translate(-50%, -50%)';
      }
    }
  }

  public update(): void {
    if (!this.ball) return;

    // Apply force if joystick is active
    if (this.currentForce.length() > 0) {
      this.ball.body.applyForce(this.currentForce, this.ball.body.position);
    }
  }

  public dispose(): void {
    if (this.joystickBase && this.joystickBase.parentElement) {
      this.joystickBase.parentElement.removeChild(this.joystickBase);
    }
  }
}

