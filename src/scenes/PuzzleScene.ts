import { SceneManager } from '../game/SceneManager.js';
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { PhysicsWorld } from '../game/PhysicsWorld.js';
import { PhysicsObject } from '../objects/PhysicsObject.js';
import { KeyboardController } from '../objects/KeyboardController.js';
import { Puzzle, PuzzleState } from '../game/Puzzle.js';
import { GameUI } from '../ui/GameUI.js';
import { Scene } from '../game/Scene.js';

export class PuzzleScene implements Scene {
  private physicsWorld: PhysicsWorld;
  private renderer: THREE.WebGLRenderer; // Will be set from Game class
  private keyboardController: KeyboardController | null = null;
  private puzzle: Puzzle;
  private gameUI: GameUI;
  private objects: PhysicsObject[] = [];
  private target: PhysicsObject | null = null;
  private ball: PhysicsObject | null = null;
  private ground: PhysicsObject | null = null;
  private walls: PhysicsObject[] = [];
  private camera: THREE.PerspectiveCamera;
  private sceneManager: any = null; // Will be set by Game
  private scene: THREE.Scene;
  private puzzleLights: THREE.Light[] = [];
  private groundMesh: THREE.Mesh | null = null;
  
  // Timer system
  private timerElapsed: number = 0;
  private timerMax: number = 10; // 10 seconds
  private onSceneExitCallback?: () => void;

  constructor(physicsWorld: PhysicsWorld, renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.PerspectiveCamera) {
    this.physicsWorld = physicsWorld;
    this.renderer = renderer;
    this.camera = camera;
    this.scene = scene;
    this.puzzle = new Puzzle();
    this.gameUI = new GameUI(scene, camera);
    // Hide UI initially
    this.gameUI.hideAll();

    this.setupScene(scene, camera);
    this.setupPuzzleCallbacks();
  }

  public setSceneManager(sceneManager: any): void {
    this.sceneManager = sceneManager;
  }

  private setupScene(scene: THREE.Scene, _camera: THREE.PerspectiveCamera): void {
    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    ambientLight.visible = false; // Start hidden
    scene.add(ambientLight);
    this.puzzleLights.push(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.visible = false; // Start hidden
    scene.add(directionalLight);
    this.puzzleLights.push(directionalLight);

    // Ground
    const groundGeometry = new THREE.PlaneGeometry(20, 20);
    const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 });
    this.groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
    this.groundMesh.rotation.x = -Math.PI / 2;
    this.groundMesh.position.y = 0;
    this.groundMesh.receiveShadow = true;
    this.groundMesh.visible = false; // Start hidden
    scene.add(this.groundMesh);

    const groundShape = new CANNON.Plane();
    const groundBody = new CANNON.Body({ 
      mass: 0,
      material: this.physicsWorld.groundMaterial
    });
    groundBody.addShape(groundShape);
    groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    this.physicsWorld.addBody(groundBody);

    // Create puzzle: Ball rolling to target
    this.createPuzzle(scene);
  }

  private createPuzzle(scene: THREE.Scene): void {
    // Target platform (green)
    const targetGeometry = new THREE.BoxGeometry(2, 0.5, 2);
    const targetMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
    const targetShape = new CANNON.Box(new CANNON.Vec3(1, 0.25, 1));
    this.target = new PhysicsObject(targetGeometry, targetMaterial, targetShape, 0, this.physicsWorld.targetMaterial);
    this.target.setPosition(5, 0.25, 0);
    this.target.mesh.visible = false; // Start hidden
    scene.add(this.target.mesh);
    this.physicsWorld.addBody(this.target.body);
    this.objects.push(this.target);

    // Ball (player-controlled object)
    const ballGeometry = new THREE.SphereGeometry(0.5, 32, 32);
    const ballMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    const ballShape = new CANNON.Sphere(0.5);
    this.ball = new PhysicsObject(ballGeometry, ballMaterial, ballShape, 1, this.physicsWorld.ballMaterial);
    this.ball.setPosition(-5, 2, 0);
    this.ball.mesh.visible = false; // Start hidden
    scene.add(this.ball.mesh);
    this.physicsWorld.addBody(this.ball.body);
    this.objects.push(this.ball);

    // Ramp/platforms - angled up from spawn towards target, then ball falls onto target
    const rampGeometry = new THREE.BoxGeometry(6, 0.5, 2);
    const rampMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
    const rampShape = new CANNON.Box(new CANNON.Vec3(3, 0.25, 1));
    const ramp = new PhysicsObject(rampGeometry, rampMaterial, rampShape, 0, this.physicsWorld.groundMaterial);
    // Position ramp between spawn and target, sunk into floor
    ramp.setPosition(0, 0.3, 0); // Lowered from 1.0 to 0.3 to sink into floor
    // Reverse angle: positive rotation tilts UP towards target (ball rolls up, then falls)
    ramp.mesh.rotation.z = 0.3; // Changed from -0.2 to +0.3 (opposite direction, steeper)
    ramp.body.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 0, 1), 0.3);
    ramp.mesh.visible = false; // Start hidden
    scene.add(ramp.mesh);
    this.physicsWorld.addBody(ramp.body);
    this.objects.push(ramp);

    // Add walls between spawn and target
    this.createWalls(scene);
  }

  private createWalls(scene: THREE.Scene): void {
    const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x666666 });
    const wallHeight = 2.5;
    const wallThickness = 0.3;
    
    // Platform dimensions: 20x20 units, centered at (0,0)
    // Area = 400 square units
    // Extends from -10 to +10 in both X and Z
    // Half-width = 10 units, diagonal radius ≈ 14.14 units
    
    // Place walls at platform edges (slightly inside to account for wall thickness)
    const platformEdge = 9.85; // 10 - (wallThickness/2) to keep walls inside platform
    const pathGapWidth = 4; // Gap width for the path (centered at Z=0)
    
    // North wall (positive Z) - split into two sections with gap for path
    // Left section: from X = -10 to X = -pathGapWidth/2
    const northWallLeftLength = platformEdge - (pathGapWidth / 2);
    const northWallLeftGeometry = new THREE.BoxGeometry(northWallLeftLength, wallHeight, wallThickness);
    const northWallLeftShape = new CANNON.Box(new CANNON.Vec3(northWallLeftLength / 2, wallHeight / 2, wallThickness / 2));
    const northWallLeft = new PhysicsObject(northWallLeftGeometry, wallMaterial, northWallLeftShape, 0, this.physicsWorld.wallMaterial);
    northWallLeft.setPosition(-(platformEdge + pathGapWidth / 2) / 2, wallHeight / 2, platformEdge);
    northWallLeft.mesh.visible = false; // Start hidden
    scene.add(northWallLeft.mesh);
    this.physicsWorld.addBody(northWallLeft.body);
    this.objects.push(northWallLeft);
    this.walls.push(northWallLeft);
    
    // Right section: from X = pathGapWidth/2 to X = 10
    const northWallRightLength = platformEdge - (pathGapWidth / 2);
    const northWallRightGeometry = new THREE.BoxGeometry(northWallRightLength, wallHeight, wallThickness);
    const northWallRightShape = new CANNON.Box(new CANNON.Vec3(northWallRightLength / 2, wallHeight / 2, wallThickness / 2));
    const northWallRight = new PhysicsObject(northWallRightGeometry, wallMaterial, northWallRightShape, 0, this.physicsWorld.wallMaterial);
    northWallRight.setPosition((platformEdge + pathGapWidth / 2) / 2, wallHeight / 2, platformEdge);
    northWallRight.mesh.visible = false; // Start hidden
    scene.add(northWallRight.mesh);
    this.physicsWorld.addBody(northWallRight.body);
    this.objects.push(northWallRight);
    this.walls.push(northWallRight);
    
    // South wall (negative Z) - split into two sections with gap for path
    // Left section
    const southWallLeftGeometry = new THREE.BoxGeometry(northWallLeftLength, wallHeight, wallThickness);
    const southWallLeftShape = new CANNON.Box(new CANNON.Vec3(northWallLeftLength / 2, wallHeight / 2, wallThickness / 2));
    const southWallLeft = new PhysicsObject(southWallLeftGeometry, wallMaterial, southWallLeftShape, 0, this.physicsWorld.wallMaterial);
    southWallLeft.setPosition(-(platformEdge + pathGapWidth / 2) / 2, wallHeight / 2, -platformEdge);
    southWallLeft.mesh.visible = false; // Start hidden
    scene.add(southWallLeft.mesh);
    this.physicsWorld.addBody(southWallLeft.body);
    this.objects.push(southWallLeft);
    this.walls.push(southWallLeft);
    
    // Right section
    const southWallRightGeometry = new THREE.BoxGeometry(northWallRightLength, wallHeight, wallThickness);
    const southWallRightShape = new CANNON.Box(new CANNON.Vec3(northWallRightLength / 2, wallHeight / 2, wallThickness / 2));
    const southWallRight = new PhysicsObject(southWallRightGeometry, wallMaterial, southWallRightShape, 0, this.physicsWorld.wallMaterial);
    southWallRight.setPosition((platformEdge + pathGapWidth / 2) / 2, wallHeight / 2, -platformEdge);
    southWallRight.mesh.visible = false; // Start hidden
    scene.add(southWallRight.mesh);
    this.physicsWorld.addBody(southWallRight.body);
    this.objects.push(southWallRight);
    this.walls.push(southWallRight);
    
    // East wall (positive X) - full length
    const eastWallGeometry = new THREE.BoxGeometry(wallThickness, wallHeight, 20);
    const eastWallShape = new CANNON.Box(new CANNON.Vec3(wallThickness / 2, wallHeight / 2, 10));
    const eastWall = new PhysicsObject(eastWallGeometry, wallMaterial, eastWallShape, 0, this.physicsWorld.wallMaterial);
    eastWall.setPosition(platformEdge, wallHeight / 2, 0);
    eastWall.mesh.visible = false; // Start hidden
    scene.add(eastWall.mesh);
    this.physicsWorld.addBody(eastWall.body);
    this.objects.push(eastWall);
    this.walls.push(eastWall);
    
    // West wall (negative X) - full length
    const westWallGeometry = new THREE.BoxGeometry(wallThickness, wallHeight, 20);
    const westWallShape = new CANNON.Box(new CANNON.Vec3(wallThickness / 2, wallHeight / 2, 10));
    const westWall = new PhysicsObject(westWallGeometry, wallMaterial, westWallShape, 0, this.physicsWorld.wallMaterial);
    westWall.setPosition(-platformEdge, wallHeight / 2, 0);
    westWall.mesh.visible = false; // Start hidden
    scene.add(westWall.mesh);
    this.physicsWorld.addBody(westWall.body);
    this.objects.push(westWall);
    this.walls.push(westWall);
    
    // Cover the gaps in north and south walls
    // Gap dimensions: 4 units wide (pathGapWidth), centered at X=0
    // Gap extends from X = -2 to X = +2
    // Add two walls to cover each gap (one on each side of the path)
    
    // North gap cover - left side (covers from X = -2 to X = -1, leaving 2-unit path)
    const northGapLeftGeometry = new THREE.BoxGeometry(5, wallHeight, wallThickness);
    const northGapLeftShape = new CANNON.Box(new CANNON.Vec3(0.5, wallHeight / 2, wallThickness / 2));
    const northGapLeft = new PhysicsObject(northGapLeftGeometry, wallMaterial, northGapLeftShape, 0, this.physicsWorld.wallMaterial);
    northGapLeft.setPosition(-1.5, wallHeight / 2, platformEdge);
    northGapLeft.mesh.visible = false; // Start hidden
    scene.add(northGapLeft.mesh);
    this.physicsWorld.addBody(northGapLeft.body);
    this.objects.push(northGapLeft);
    this.walls.push(northGapLeft);
    
    // North gap cover - right side (covers from X = +1 to X = +2, leaving 2-unit path)
    const northGapRightGeometry = new THREE.BoxGeometry(1, wallHeight, wallThickness);
    const northGapRightShape = new CANNON.Box(new CANNON.Vec3(0.5, wallHeight / 2, wallThickness / 2));
    const northGapRight = new PhysicsObject(northGapRightGeometry, wallMaterial, northGapRightShape, 0, this.physicsWorld.wallMaterial);
    northGapRight.setPosition(1.5, wallHeight / 2, platformEdge);
    northGapRight.mesh.visible = false; // Start hidden
    scene.add(northGapRight.mesh);
    this.physicsWorld.addBody(northGapRight.body);
    this.objects.push(northGapRight);
    this.walls.push(northGapRight);
    
    // South gap cover - left side
    const southGapLeftGeometry = new THREE.BoxGeometry(5, wallHeight, wallThickness);
    const southGapLeftShape = new CANNON.Box(new CANNON.Vec3(0.5, wallHeight / 2, wallThickness / 2));
    const southGapLeft = new PhysicsObject(southGapLeftGeometry, wallMaterial, southGapLeftShape, 0, this.physicsWorld.wallMaterial);
    southGapLeft.setPosition(-1.5, wallHeight / 2, -platformEdge);
    southGapLeft.mesh.visible = false; // Start hidden
    scene.add(southGapLeft.mesh);
    this.physicsWorld.addBody(southGapLeft.body);
    this.objects.push(southGapLeft);
    this.walls.push(southGapLeft);
    
    // South gap cover - right side
    const southGapRightGeometry = new THREE.BoxGeometry(1, wallHeight, wallThickness);
    const southGapRightShape = new CANNON.Box(new CANNON.Vec3(0.5, wallHeight / 2, wallThickness / 2));
    const southGapRight = new PhysicsObject(southGapRightGeometry, wallMaterial, southGapRightShape, 0, this.physicsWorld.wallMaterial);
    southGapRight.setPosition(1.5, wallHeight / 2, -platformEdge);
    southGapRight.mesh.visible = false; // Start hidden
    scene.add(southGapRight.mesh);
    this.physicsWorld.addBody(southGapRight.body);
    this.objects.push(southGapRight);
    this.walls.push(southGapRight);
  }

  public setKeyboardController(controller: KeyboardController): void {
    this.keyboardController = controller;
    if (this.ball) {
      controller.setBall(this.ball);
    }
  }

  private setupPuzzleCallbacks(): void {
    this.puzzle.onSuccess(() => {
      this.gameUI.updateState(PuzzleState.Success);
      // Exit scene after a brief delay to show success message
      setTimeout(() => {
        if (this.onSceneExitCallback) {
          this.onSceneExitCallback();
        }
      }, 2000); // 2 second delay to show success
    });

    this.puzzle.onFailure(() => {
      this.gameUI.updateState(PuzzleState.Failure);
    });
  }

  public setOnSceneExit(callback: () => void): void {
    this.onSceneExitCallback = callback;
  }

  public update(deltaTime: number): void {
    // Update timer if puzzle is still playing
    if (this.puzzle.state === PuzzleState.Playing) {
      this.timerElapsed += deltaTime;
      
      // Update timer display
      const remaining = this.getTimerRemaining();
      this.gameUI.updateTimer(remaining);
      
      // Check if timer expired
      if (this.timerElapsed >= this.timerMax) {
        console.log('Timer expired - restarting scene');
        this.puzzle.checkFailureCondition(false, true);
        // Restart the scene
        setTimeout(() => {
          this.enter();
        }, 1000); // Brief delay to show failure message
        return;
      }
    } else {
      // Hide timer when puzzle is not playing
      this.gameUI.updateTimer(0);
    }

    // Update keyboard controls
    if (this.keyboardController) {
      this.keyboardController.update();
    }

    // Update physics
    this.physicsWorld.step(deltaTime);

    // Sync physics to visuals
    this.objects.forEach((obj) => {
      obj.syncMeshToBody();
    });

    // Check win condition: ball is touching/on the green target
    if (this.ball && this.target && this.puzzle.state === PuzzleState.Playing) {
      const ballPos = this.ball.body.position;
      const targetPos = this.target.body.position;
      
      // Check if ball is within target bounds (X and Z) and close to target height
      const dx = Math.abs(ballPos.x - targetPos.x);
      const dz = Math.abs(ballPos.z - targetPos.z);
      const dy = ballPos.y - targetPos.y;
      
      // Ball is on target if: within target bounds (1.2 unit radius) and ball bottom is near target top
      const isOnTarget = dx < 1.2 && dz < 1.2 && dy > 0.1 && dy < 2.0;
      
      if (isOnTarget) {
        console.log('Ball reached target!', { dx, dz, dy });
        this.puzzle.checkWinCondition(true);
      }
    }

    // Check failure condition: ball fell off
    if (this.ball) {
      const ballPos = this.ball.body.position;
      if (ballPos.y < -5) {
        this.puzzle.checkFailureCondition(true, false);
      }
    }
  }

  public getTimerRemaining(): number {
    return Math.max(0, this.timerMax - this.timerElapsed);
  }

  public getPuzzleState(): PuzzleState {
    return this.puzzle.state;
  }

  public getObjects(): PhysicsObject[] {
    return this.objects;
  }

  // Scene interface implementation
  public getName(): string {
    return 'puzzle';
  }

  public enter(): void {
    // Show instructions
    const instructions = document.getElementById('instructions');
    if (instructions) {
      instructions.style.display = 'block';
    }

    // Register this scene's camera with SceneManager
    if (this.sceneManager) {
      this.sceneManager.setCurrentCamera(this.camera);
    }
    
    // Show puzzle objects
    this.puzzleLights.forEach(light => {
      light.visible = true;
    });
    if (this.groundMesh) {
      this.groundMesh.visible = true;
    }
    this.objects.forEach(obj => {
      obj.mesh.visible = true;
    });
    
    // Scene is entered - reset puzzle state and timer
    this.puzzle.reset();
    this.gameUI.hideAll();
    this.timerElapsed = 0; // Reset timer
    this.gameUI.updateTimer(this.timerMax); // Show initial timer
    
    // Reset ball position
    if (this.ball) {
      this.ball.setPosition(-5, 2, 0);
      this.ball.body.velocity.set(0, 0, 0);
      this.ball.body.angularVelocity.set(0, 0, 0);
    }
  }

  public exit(): void {
    // Hide instructions
    const instructions = document.getElementById('instructions');
    if (instructions) {
      instructions.style.display = 'none';
    }

    // Hide puzzle objects when exiting
    this.puzzleLights.forEach(light => {
      light.visible = false;
    });
    if (this.groundMesh) {
      this.groundMesh.visible = false;
    }
    this.objects.forEach(obj => {
      obj.mesh.visible = false;
    });
    this.gameUI.hideAll();
  }

  public dispose(): void {
    // Clean up scene resources
    // Remove all objects from physics world
    this.objects.forEach((obj) => {
      this.physicsWorld.removeBody(obj.body);
    });
    this.objects = [];
    this.walls = [];
    this.target = null;
    this.ball = null;
  }
}
