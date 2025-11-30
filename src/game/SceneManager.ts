import * as THREE from 'three';
import { Scene } from './Scene.js';

export class SceneManager {
  private scenes: Map<string, Scene> = new Map();
  private currentScene: Scene | null = null;
  private currentSceneName: string | null = null;
  private currentCamera: THREE.Camera | null = null;

  public registerScene(scene: Scene): void {
    this.scenes.set(scene.getName(), scene);
  }

  public switchToScene(sceneName: string): void {
    const newScene = this.scenes.get(sceneName);
    if (!newScene) {
      console.error(`Scene "${sceneName}" not found`);
      return;
    }

    // Exit current scene
    if (this.currentScene) {
      this.currentScene.exit();
    }

    // Enter new scene
    this.currentScene = newScene;
    this.currentSceneName = sceneName;
    this.currentScene.enter();
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

