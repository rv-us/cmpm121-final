// Base interface for all game scenes
export interface Scene {
  // Called when scene is entered
  enter(): void;
  
  // Called when scene is exited
  exit(): void;
  
  // Update scene logic (called every frame)
  update(deltaTime: number): void;
  
  // Clean up scene resources
  dispose(): void;
  
  // Get scene name/ID
  getName(): string;
}

