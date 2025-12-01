import * as THREE from 'three';

/**
 * Interface that all game scenes must implement
 */
export interface Scene {
  /**
   * Gets the unique name identifier for this scene
   */
  getName(): string;

  /**
   * Called when the scene becomes active
   */
  enter(): void;

  /**
   * Called when the scene becomes inactive
   */
  exit(): void;

  /**
   * Called every frame to update scene logic
   * @param deltaTime - Time elapsed since last frame in seconds
   */
  update(deltaTime: number): void;

  /**
   * Called to clean up scene resources
   */
  dispose(): void;

  /**
   * Optional: Set the scene manager reference
   * @param sceneManager - Reference to the scene manager
   */
  setSceneManager?(sceneManager: any): void;

  /**
   * Optional: Get the camera used by this scene
   * @returns The scene's camera, or undefined to use default
   */
  getCamera?(): THREE.Camera | undefined;
}