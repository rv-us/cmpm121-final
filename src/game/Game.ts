import { Renderer } from './Renderer.js';
import { PhysicsWorld } from './PhysicsWorld.js';
import { PuzzleScene } from '../scenes/PuzzleScene.js';
import { RoomScene } from '../scenes/RoomScene.js';
import { KeyboardController } from '../objects/KeyboardController.js';
import { SceneManager } from './SceneManager.js';
import { Inventory } from '../systems/Inventory.js';
import { InventoryUI } from '../ui/InventoryUI.js';
import { GameStateManager, GameState } from '../systems/GameStateManager.js';
import { EndingUI } from '../ui/EndingUI.js';
import { ProgressHUD } from '../ui/ProgressHUD.js';

export class Game {
  private renderer: Renderer;
  private physicsWorld: PhysicsWorld;
  private sceneManager: SceneManager;
  private keyboardController: KeyboardController;
  private inventory: Inventory;
  private inventoryUI: InventoryUI;
  private gameStateManager: GameStateManager;
  private endingUI: EndingUI;
  private progressHUD: ProgressHUD;
  private animationId: number | null = null;
  private lastTime: number = 0;

  constructor(container: HTMLElement) {
    this.renderer = new Renderer(container);
    this.physicsWorld = new PhysicsWorld();
    this.sceneManager = new SceneManager();
    this.keyboardController = new KeyboardController();
    
    // Create inventory system
    this.inventory = new Inventory();
    this.inventoryUI = new InventoryUI(this.inventory);
    
    // Create game state and ending systems
    this.gameStateManager = new GameStateManager();
    this.endingUI = new EndingUI();
    this.progressHUD = new ProgressHUD(this.gameStateManager);
    
    // Listen for inventory changes to update game state
    this.inventory.onChange(() => {
      const itemCount = this.inventory.getItemCount();
      this.gameStateManager.setItemsCollected(itemCount);
      this.progressHUD.refresh(); // Update HUD when inventory changes
    });
    
    // Listen for game state changes to show ending screens
    this.gameStateManager.onStateChange((state: GameState) => {
      this.progressHUD.refresh(); // Update HUD when state changes
      
      if (state === GameState.VICTORY) {
        this.endingUI.showVictory();
        this.stop();
      } else if (state === GameState.GAME_OVER) {
        this.endingUI.showGameOver();
        this.stop();
      }
    });
    
    // Create and register the room scene (2D top-down adventure)
    const roomScene = new RoomScene(
      this.renderer.scene,
      this.renderer.camera,
      this.renderer.renderer,
      this.inventory // Pass inventory to room scene
    );
    roomScene.setSceneManager(this.sceneManager);
    roomScene.setOnSceneExit((targetScene: string) => {
      console.log(`Room scene exiting to: ${targetScene}`);
      this.sceneManager.switchToScene(targetScene);
    });
    this.sceneManager.registerScene(roomScene);
    
    // Create and register the puzzle scene
    const puzzleScene = new PuzzleScene(
      this.physicsWorld,
      this.renderer.renderer,
      this.renderer.scene,
      this.renderer.camera,
      this.inventory, // Pass inventory to puzzle scene
      this.gameStateManager // Pass game state manager
    );
    puzzleScene.setSceneManager(this.sceneManager);
    puzzleScene.setKeyboardController(this.keyboardController);
    // Set callback for when puzzle is completed (returns to room scene)
    puzzleScene.setOnSceneExit(() => {
      console.log('Puzzle completed - returning to room scene');
      this.sceneManager.switchToScene('room');
    });
    this.sceneManager.registerScene(puzzleScene);
    
    // Start with the room scene
    this.sceneManager.switchToScene('room');
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

    // Update current scene
    this.sceneManager.update(deltaTime);

    // Render with current scene's camera (if set) or default camera
    const sceneCamera = this.sceneManager.getCurrentCamera();
    this.renderer.render(sceneCamera || undefined);
  };

  public switchScene(sceneName: string): void {
    this.sceneManager.switchToScene(sceneName);
  }

  public stop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  public getInventory(): Inventory {
    return this.inventory;
  }
}