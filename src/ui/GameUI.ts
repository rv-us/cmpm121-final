import * as THREE from 'three';
import { PuzzleState } from '../game/Puzzle.js';

export class GameUI {
  private successText: THREE.Mesh | null = null;
  private failureText: THREE.Mesh | null = null;
  private timerText: THREE.Mesh | null = null;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera | null = null;

  constructor(scene: THREE.Scene, camera?: THREE.PerspectiveCamera) {
    this.scene = scene;
    if (camera) {
      this.camera = camera;
    }
    this.createTextMeshes();
  }

  public setCamera(camera: THREE.PerspectiveCamera): void {
    this.camera = camera;
  }

  private createTextMeshes(): void {
    // Note: For simplicity, using basic geometry. In production, use TextGeometry or HTML overlays
    // Create simple visual indicators using sprites or geometry
    // For now, we'll use colored planes as placeholders
    // In a real implementation, you'd use TextGeometry or HTML/CSS overlays
  }

  public showSuccess(): void {
    console.log('Showing success message!');
    this.hideAll();
    // Create success indicator - large green plane
    const geometry = new THREE.PlaneGeometry(10, 3);
    const material = new THREE.MeshBasicMaterial({ 
      color: 0x00ff00, 
      transparent: true, 
      opacity: 0.95 
    });
    this.successText = new THREE.Mesh(geometry, material);
    
    // Position in front of camera view - make it very visible
    if (this.camera) {
      const cameraDirection = new THREE.Vector3();
      this.camera.getWorldDirection(cameraDirection);
      this.successText.position.copy(this.camera.position);
      this.successText.position.add(cameraDirection.multiplyScalar(8));
      this.successText.position.y += 2;
      this.successText.lookAt(this.camera.position);
    } else {
      // Fallback position - center of view
      this.successText.position.set(0, 5, -8);
      this.successText.rotation.x = -0.3;
    }
    
    this.scene.add(this.successText);
    console.log('Success message added to scene at:', this.successText.position);

    // Add a pulsing effect
    let pulseTime = 0;
    const pulseAnimation = () => {
      if (!this.successText) return;
      pulseTime += 0.05;
      const scale = 1 + Math.sin(pulseTime) * 0.2;
      this.successText.scale.set(scale, scale, 1);
      
      // Update position to follow camera if it moves
      if (this.camera) {
        const cameraDirection = new THREE.Vector3();
        this.camera.getWorldDirection(cameraDirection);
        this.successText.position.copy(this.camera.position);
        this.successText.position.add(cameraDirection.multiplyScalar(8));
        this.successText.position.y += 2;
        this.successText.lookAt(this.camera.position);
      }
      
      requestAnimationFrame(pulseAnimation);
    };
    pulseAnimation();
  }

  public showFailure(): void {
    this.hideAll();
    // Create failure indicator
    const geometry = new THREE.PlaneGeometry(4, 1);
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.8 });
    this.failureText = new THREE.Mesh(geometry, material);
    this.failureText.position.set(0, 3, 0);
    this.scene.add(this.failureText);
  }

  public hideAll(): void {
    if (this.successText) {
      this.scene.remove(this.successText);
      this.successText = null;
    }
    if (this.failureText) {
      this.scene.remove(this.failureText);
      this.failureText = null;
    }
  }

  public updateState(state: PuzzleState): void {
    this.hideAll();
    if (state === PuzzleState.Success) {
      this.showSuccess();
    } else if (state === PuzzleState.Failure) {
      this.showFailure();
    }
  }

  public updateTimer(remaining: number): void {
    // Remove old timer
    if (this.timerText) {
      this.scene.remove(this.timerText);
      this.timerText = null;
    }

    // Only show timer if puzzle is still active
    if (remaining > 0) {
      // Create timer display - simple plane with visual representation
      const timerWidth = (remaining / 10) * 4; // Scale based on remaining time
      const geometry = new THREE.PlaneGeometry(timerWidth, 0.3);
      const material = new THREE.MeshBasicMaterial({ 
        color: remaining < 3 ? 0xff0000 : 0xffff00, // Red if < 3 seconds, yellow otherwise
        transparent: true, 
        opacity: 0.8 
      });
      this.timerText = new THREE.Mesh(geometry, material);
      
      // Position timer at top of screen
      if (this.camera) {
        const cameraDirection = new THREE.Vector3();
        this.camera.getWorldDirection(cameraDirection);
        this.timerText.position.copy(this.camera.position);
        this.timerText.position.add(cameraDirection.multiplyScalar(7));
        this.timerText.position.y += 3;
        this.timerText.lookAt(this.camera.position);
      } else {
        this.timerText.position.set(0, 6, -7);
      }
      
      this.scene.add(this.timerText);
    }
  }
}

