import { Renderer } from './Renderer.js';
import { PhysicsWorld } from './PhysicsWorld.js';
import { PuzzleScene } from '../scenes/PuzzleScene.js';
import { KeyboardController } from '../objects/KeyboardController.js';

export class Game {
  private renderer: Renderer;
  private physicsWorld: PhysicsWorld;
  private scene: PuzzleScene;
  private keyboardController: KeyboardController;
  private animationId: number | null = null;
  private lastTime: number = 0;

  constructor(container: HTMLElement) {
    this.renderer = new Renderer(container);
    this.physicsWorld = new PhysicsWorld();
    this.scene = new PuzzleScene(
      this.physicsWorld,
      this.renderer.renderer,
      this.renderer.scene,
      this.renderer.camera
    );
    this.keyboardController = new KeyboardController();
    this.scene.setKeyboardController(this.keyboardController);
  }

  public start(): void {
    this.lastTime = performance.now();
    this.animate();
  }

  private animate = (): void => {
    this.animationId = requestAnimationFrame(this.animate);

    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastTime) / 1000; // Convert to seconds
    this.lastTime = currentTime;

    // Update game logic
    this.scene.update(deltaTime);

    // Render
    this.renderer.render();
  };

  public stop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }
}
//random comment
