import * as THREE from 'three';
import { Scene } from './Scene.js';
import { UndoSystem } from '../systems/UndoSystem.js';

export class SceneManager {
  private scenes: Map<string, Scene> = new Map();
  private currentScene: Scene | null = null;
  private currentSceneName: string | null = null;
  private currentCamera: THREE.Camera | null = null;
  private undoSystem: UndoSystem | null = null;
  private getPlayerPositionCallback?: () => { x: number; y: number; z: number } | undefined;

  public setUndoSystem(undoSystem: UndoSystem): void {
    this.undoSystem = undoSystem;
  }

  public setGetPlayerPositionCallback(callback: () => { x: number; y: number; z: number } | undefined): void {
    this.getPlayerPositionCallback = callback;
  }

  public registerScene(scene: Scene): void {
    this.scenes.set(scene.getName(), scene);
  }

  public switchToScene(sceneName: string, recordUndo: boolean = true): void {
    const newScene = this.scenes.get(sceneName);
    if (!newScene) {
      console.error(`Scene "${sceneName}" not found`);
      return;
    }

    // Capture state before switching
    const previousScene = this.currentSceneName;
    const playerPosition = this.getPlayerPositionCallback ? this.getPlayerPositionCallback() : undefined;

    // Exit current scene
    if (this.currentScene) {
      this.currentScene.exit();
    }

    // Enter new scene
    this.currentScene = newScene;
    this.currentSceneName = sceneName;
    this.currentScene.enter();

    // Record undo action if enabled and undo system is available
    if (recordUndo && this.undoSystem && previousScene) {
      this.undoSystem.recordSceneTransition(
        previousScene,
        sceneName,
        () => {
          // Undo callback: switch back to previous scene
          this.switchToScene(previousScene, false); // false to prevent recording undo of undo
          // Restore player position if we have it
          if (playerPosition && this.getPlayerPositionCallback) {
            // Player position will be restored by RoomScene if needed
            const currentScene = this.getCurrentScene();
            if (currentScene && (currentScene as any).setPlayerPosition) {
              (currentScene as any).setPlayerPosition(playerPosition);
            }
          }
        },
        playerPosition
      );
    }
  }

  public setCurrentCamera(camera: THREE.Camera): void {
    this.currentCamera = camera;
  }

  public getCurrentCamera(): THREE.Camera | null {
    return this.currentCamera;
  }

  public getCurrentScene(): Scene | null {
    return this.currentScene;
  }

  public getCurrentSceneName(): string | null {
    return this.currentSceneName;
  }

  public update(deltaTime: number): void {
    if (this.currentScene) {
      this.currentScene.update(deltaTime);
    }
  }

  public dispose(): void {
    if (this.currentScene) {
      this.currentScene.exit();
      this.currentScene.dispose();
    }
    this.scenes.forEach((scene) => scene.dispose());
    this.scenes.clear();
  }
}

