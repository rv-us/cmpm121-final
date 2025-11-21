import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { PhysicsWorld } from '../game/PhysicsWorld.js';
import { PhysicsObject } from '../objects/PhysicsObject.js';
import { KeyboardController } from '../objects/KeyboardController.js';
import { Puzzle, PuzzleState } from '../game/Puzzle.js';
import { GameUI } from '../ui/GameUI.js';

export class PuzzleScene {
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

  constructor(physicsWorld: PhysicsWorld, renderer: THREE.WebGLRenderer, scene: THREE.Scene, _camera: THREE.PerspectiveCamera) {
    this.physicsWorld = physicsWorld;
    this.renderer = renderer;
    this.puzzle = new Puzzle();
    this.gameUI = new GameUI(scene, _camera);

    this.setupScene(scene, _camera);
    this.setupPuzzleCallbacks();
  }

  private setupScene(scene: THREE.Scene, _camera: THREE.PerspectiveCamera): void {
    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // Ground
    const groundGeometry = new THREE.PlaneGeometry(20, 20);
    const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 });
    const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.position.y = 0;
    groundMesh.receiveShadow = true;
    scene.add(groundMesh);

    const groundShape = new CANNON.Plane();
    const groundBody = new CANNON.Body({ mass: 0 });
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
    this.target = new PhysicsObject(targetGeometry, targetMaterial, targetShape, 0);
    this.target.setPosition(5, 0.25, 0);
    scene.add(this.target.mesh);
    this.physicsWorld.addBody(this.target.body);
    this.objects.push(this.target);

    // Ball (player-controlled object)
    const ballGeometry = new THREE.SphereGeometry(0.5, 32, 32);
    const ballMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    const ballShape = new CANNON.Sphere(0.5);
    this.ball = new PhysicsObject(ballGeometry, ballMaterial, ballShape, 1);
    this.ball.setPosition(-5, 2, 0);
    scene.add(this.ball.mesh);
    this.physicsWorld.addBody(this.ball.body);
    this.objects.push(this.ball);

    // Ramp/platforms
    const rampGeometry = new THREE.BoxGeometry(6, 0.5, 2);
    const rampMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
    const rampShape = new CANNON.Box(new CANNON.Vec3(3, 0.25, 1));
    const ramp = new PhysicsObject(rampGeometry, rampMaterial, rampShape, 0);
    ramp.setPosition(0, 1, 0);
    ramp.mesh.rotation.z = -0.2;
    ramp.body.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 0, 1), -0.2);
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

    // Create a clear path with walls on the sides
    // Wall 1: Left side barrier near start
    const wall1Geometry = new THREE.BoxGeometry(wallThickness, wallHeight, 3);
    const wall1Shape = new CANNON.Box(new CANNON.Vec3(wallThickness / 2, wallHeight / 2, 1.5));
    const wall1 = new PhysicsObject(wall1Geometry, wallMaterial, wall1Shape, 0);
    wall1.setPosition(-3.5, wallHeight / 2, -2);
    scene.add(wall1.mesh);
    this.physicsWorld.addBody(wall1.body);
    this.objects.push(wall1);
    this.walls.push(wall1);

    // Wall 2: Right side barrier near start
    const wall2Geometry = new THREE.BoxGeometry(wallThickness, wallHeight, 3);
    const wall2Shape = new CANNON.Box(new CANNON.Vec3(wallThickness / 2, wallHeight / 2, 1.5));
    const wall2 = new PhysicsObject(wall2Geometry, wallMaterial, wall2Shape, 0);
    wall2.setPosition(-3.5, wallHeight / 2, 2);
    scene.add(wall2.mesh);
    this.physicsWorld.addBody(wall2.body);
    this.objects.push(wall2);
    this.walls.push(wall2);

    // Wall 3: Left side middle barrier
    const wall3Geometry = new THREE.BoxGeometry(wallThickness, wallHeight, 2.5);
    const wall3Shape = new CANNON.Box(new CANNON.Vec3(wallThickness / 2, wallHeight / 2, 1.25));
    const wall3 = new PhysicsObject(wall3Geometry, wallMaterial, wall3Shape, 0);
    wall3.setPosition(0, wallHeight / 2, -1.5);
    scene.add(wall3.mesh);
    this.physicsWorld.addBody(wall3.body);
    this.objects.push(wall3);
    this.walls.push(wall3);

    // Wall 4: Right side middle barrier
    const wall4Geometry = new THREE.BoxGeometry(wallThickness, wallHeight, 2.5);
    const wall4Shape = new CANNON.Box(new CANNON.Vec3(wallThickness / 2, wallHeight / 2, 1.25));
    const wall4 = new PhysicsObject(wall4Geometry, wallMaterial, wall4Shape, 0);
    wall4.setPosition(0, wallHeight / 2, 1.5);
    scene.add(wall4.mesh);
    this.physicsWorld.addBody(wall4.body);
    this.objects.push(wall4);
    this.walls.push(wall4);

    // Wall 5: Left side near target
    const wall5Geometry = new THREE.BoxGeometry(wallThickness, wallHeight, 2);
    const wall5Shape = new CANNON.Box(new CANNON.Vec3(wallThickness / 2, wallHeight / 2, 1));
    const wall5 = new PhysicsObject(wall5Geometry, wallMaterial, wall5Shape, 0);
    wall5.setPosition(3.5, wallHeight / 2, -1);
    scene.add(wall5.mesh);
    this.physicsWorld.addBody(wall5.body);
    this.objects.push(wall5);
    this.walls.push(wall5);

    // Wall 6: Right side near target
    const wall6Geometry = new THREE.BoxGeometry(wallThickness, wallHeight, 2);
    const wall6Shape = new CANNON.Box(new CANNON.Vec3(wallThickness / 2, wallHeight / 2, 1));
    const wall6 = new PhysicsObject(wall6Geometry, wallMaterial, wall6Shape, 0);
    wall6.setPosition(3.5, wallHeight / 2, 1);
    scene.add(wall6.mesh);
    this.physicsWorld.addBody(wall6.body);
    this.objects.push(wall6);
    this.walls.push(wall6);
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
    });

    this.puzzle.onFailure(() => {
      this.gameUI.updateState(PuzzleState.Failure);
    });
  }

  public update(deltaTime: number): void {
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

  public getPuzzleState(): PuzzleState {
    return this.puzzle.state;
  }

  public getObjects(): PhysicsObject[] {
    return this.objects;
  }
}

