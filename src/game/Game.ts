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
import { SaveSystem, SaveData } from '../systems/SaveSystem.js';
import { SaveLoadUI } from '../ui/SaveLoadUI.js';
import { ThemeManager } from '../systems/ThemeManager.js';

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
  private saveSystem: SaveSystem;
  private saveLoadUI: SaveLoadUI;
  private themeManager: ThemeManager;
  private animationId: number | null = null;
  private lastTime: number = 0;
  private roomScene?: RoomScene;
  private puzzleScene?: PuzzleScene;

  constructor(container: HTMLElement) {
    this.renderer = new Renderer(container);
    this.physicsWorld = new PhysicsWorld();
    this.sceneManager = new SceneManager();
    this.keyboardController = new KeyboardController();
    
    // Create theme manager
    this.themeManager = new ThemeManager();
    this.themeManager.applyThemeToCSS();
    
    // Create inventory system
    this.inventory = new Inventory();
    this.inventoryUI = new InventoryUI(this.inventory);
    
    // Create game state and ending systems
    this.gameStateManager = new GameStateManager();
    this.endingUI = new EndingUI();
    this.progressHUD = new ProgressHUD(this.gameStateManager);
    
    // Create save system
    this.saveSystem = new SaveSystem();
    this.saveLoadUI = new SaveLoadUI(this.saveSystem);
    
    // Setup save/load callbacks
    this.saveLoadUI.onSave(() => this.captureGameState());
    this.saveLoadUI.onLoad((data) => this.loadGameState(data));
    
    // Listen for inventory changes to update game state and auto-save
    this.inventory.onChange(() => {
      const itemCount = this.inventory.getItemCount();
      this.gameStateManager.setItemsCollected(itemCount);
      this.progressHUD.refresh(); // Update HUD when inventory changes
      this.autoSave(); // Auto-save when inventory changes
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
      this.inventory, // Pass inventory to room scene
      this.themeManager // Pass theme manager
    );
    this.roomScene = roomScene; // Store reference for save/load
    roomScene.setSceneManager(this.sceneManager);
    roomScene.setOnSceneExit((targetScene: string) => {
      console.log(`Room scene exiting to: ${targetScene}`);
      this.sceneManager.switchToScene(targetScene);
      this.autoSave(); // Auto-save when changing scenes
    });
    this.sceneManager.registerScene(roomScene);
    
    // Create and register the puzzle scene
    const puzzleScene = new PuzzleScene(
      this.physicsWorld,
      this.renderer.renderer,
      this.renderer.scene,
      this.renderer.camera,
      this.inventory, // Pass inventory to puzzle scene
      this.gameStateManager, // Pass game state manager
      this.themeManager // Pass theme manager
    );
    this.puzzleScene = puzzleScene; // Store reference for save/load
    puzzleScene.setSceneManager(this.sceneManager);
    puzzleScene.setKeyboardController(this.keyboardController);
    // Set callback for when puzzle is completed (returns to room scene)
    puzzleScene.setOnSceneExit(() => {
      console.log('Puzzle completed - returning to room scene');
      this.sceneManager.switchToScene('room');
      this.autoSave(); // Auto-save when completing puzzle
    });
    this.sceneManager.registerScene(puzzleScene);
    
    // Start with the room scene
    this.sceneManager.switchToScene('room');
    
    // Try to load auto-save on startup
    this.tryLoadAutoSave();
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

  /**
   * Capture current game state for saving
   */
  private captureGameState(): SaveData {
    const currentScene = this.sceneManager.getCurrentScene();
    const sceneName = currentScene?.getName() || 'room';
    
    // Get player position from room scene
    let playerPosition = { x: -10, y: 0, z: -10 }; // Default starting position
    if (this.roomScene) {
      playerPosition = this.roomScene.getPlayerPosition();
    }

    return {
      timestamp: Date.now(),
      slotName: '',
      inventory: this.inventory.getAllItems(),
      gameProgress: this.gameStateManager.getProgress(),
      playerState: {
        position: playerPosition,
        currentScene: sceneName,
      },
      interactableObjectsRemoved: this.roomScene?.getRemovedObjectIds() || [],
    };
  }

  /**
   * Load game state from save data
   */
  private loadGameState(data: SaveData): void {
    console.log('Loading game state...', data);

    // Clear current inventory
    this.inventory.clear();

    // Restore inventory
    data.inventory.forEach(item => {
      this.inventory.addItem(item);
    });

    // Restore game progress
    this.gameStateManager.setItemsCollected(data.inventory.length);
    if (data.gameProgress.puzzleCompleted) {
      this.gameStateManager.completePuzzle();
    }

    // Restore removed objects in room scene
    if (this.roomScene) {
      this.roomScene.setRemovedObjectIds(data.interactableObjectsRemoved);
    }

    // Switch to saved scene
    this.sceneManager.switchToScene(data.playerState.currentScene);

    // Restore player position if in room scene
    if (data.playerState.currentScene === 'room' && this.roomScene) {
      this.roomScene.setPlayerPosition(data.playerState.position);
    }

    console.log('Game state loaded successfully!');
  }

  /**
   * Auto-save the game
   */
  private autoSave(): void {
    const gameState = this.captureGameState();
    this.saveSystem.autoSave(gameState);
  }

  /**
   * Try to load auto-save on startup
   */
  private tryLoadAutoSave(): void {
    if (this.saveSystem.hasAutoSave()) {
      const userWantsToLoad = confirm('Auto-save detected! Would you like to continue from your last save?');
      if (userWantsToLoad) {
        const autoSave = this.saveSystem.loadAutoSave();
        if (autoSave) {
          this.loadGameState(autoSave);
        }
      }
    }
  }
}