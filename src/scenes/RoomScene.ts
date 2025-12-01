import { SceneManager } from '../game/SceneManager.js';
import * as THREE from 'three';
import { Scene } from '../game/Scene.js';



interface Room {
  name: string;
  x: number;
  z: number;
  width: number;
  depth: number;
  hasPuzzle: boolean;
}

interface GridNode {
  x: number;
  z: number;
  walkable: boolean;
  g: number;
  h: number;
  f: number;
  parent: GridNode | null;
}

export class RoomScene implements Scene {
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private renderer: THREE.WebGLRenderer;
  private rooms: Room[] = [];
  private roomMeshes: THREE.Mesh[] = [];
  private player: THREE.Group | null = null;
  private playerPath: THREE.Vector3[] = [];
  private playerSpeed: number = 5;
  private currentRoom: Room | null = null;
  private puzzleIndicator: THREE.Mesh | null = null;
  private onSceneExitCallback?: (targetScene: string) => void;
  private sceneManager: SceneManager | null = null;
  
  // Pathfinding grid
  private gridSize: number = 0.5;
  private gridWidth: number = 60;
  private gridDepth: number = 60;
  private gridOffsetX: number = 15;
  private gridOffsetZ: number = 15;
  private grid: boolean[][] = [];

  constructor(
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    renderer: THREE.WebGLRenderer
  ) {
    this.scene = scene;
    this.renderer = renderer;
    
    // Create orthographic camera for 2D top-down view
    const aspect = window.innerWidth / window.innerHeight;
    const viewSize = 20;
    this.camera = new THREE.OrthographicCamera(
      -viewSize * aspect,
      viewSize * aspect,
      viewSize,
      -viewSize,
      0.1,
      100
    );
    this.camera.position.set(0, 20, 0);
    this.camera.lookAt(0, 0, 0);

    this.initializeGrid();
    this.setupRooms();
    this.setupPlayer();
    this.setupClickHandler();
    this.setupResizeHandler();
  }

  public setSceneManager(sceneManager: SceneManager): void {
    this.sceneManager = sceneManager;
  }

  public getCamera(): THREE.Camera {
    return this.camera;
  }

  private setupResizeHandler(): void {
    window.addEventListener('resize', () => {
      const aspect = window.innerWidth / window.innerHeight;
      const viewSize = 20;
      this.camera.left = -viewSize * aspect;
      this.camera.right = viewSize * aspect;
      this.camera.top = viewSize;
      this.camera.bottom = -viewSize;
      this.camera.updateProjectionMatrix();
    });
  }

  private initializeGrid(): void {
    this.grid = [];
    for (let x = 0; x < this.gridWidth; x++) {
      this.grid[x] = [];
      for (let z = 0; z < this.gridDepth; z++) {
        this.grid[x][z] = false; // Default not walkable
      }
    }
  }

  private setWalkableArea(x: number, z: number, width: number, depth: number): void {
    const startX = Math.floor((x - width / 2 + this.gridOffsetX) / this.gridSize);
    const endX = Math.floor((x + width / 2 + this.gridOffsetX) / this.gridSize);
    const startZ = Math.floor((z - depth / 2 + this.gridOffsetZ) / this.gridSize);
    const endZ = Math.floor((z + depth / 2 + this.gridOffsetZ) / this.gridSize);

    for (let i = startX; i < endX; i++) {
      for (let j = startZ; j < endZ; j++) {
        if (i >= 0 && i < this.gridWidth && j >= 0 && j < this.gridDepth) {
          this.grid[i][j] = true;
        }
      }
    }
  }

  private setupRooms(): void {
    const roomSize = 6;
    const spacing = 10; // Increased spacing to make corridors more visible
    const corridorWidth = 2;
    
    this.rooms = [
      { name: 'Room 1', x: -spacing, z: -spacing, width: roomSize, depth: roomSize, hasPuzzle: false },
      { name: 'Room 2', x: 0, z: -spacing, width: roomSize, depth: roomSize, hasPuzzle: false },
      { name: 'Room 3', x: spacing, z: -spacing, width: roomSize, depth: roomSize, hasPuzzle: false },
      { name: 'Room 4', x: -spacing, z: 0, width: roomSize, depth: roomSize, hasPuzzle: false },
      { name: 'Room 5', x: 0, z: 0, width: roomSize, depth: roomSize, hasPuzzle: true },
      { name: 'Room 6', x: spacing, z: 0, width: roomSize, depth: roomSize, hasPuzzle: false },
      { name: 'Room 7', x: -spacing, z: spacing, width: roomSize, depth: roomSize, hasPuzzle: false },
      { name: 'Room 8', x: 0, z: spacing, width: roomSize, depth: roomSize, hasPuzzle: false },
      { name: 'Room 9', x: spacing, z: spacing, width: roomSize, depth: roomSize, hasPuzzle: false },
    ];

    const floorMaterial = new THREE.MeshStandardMaterial({ color: 0xcccccc });
    const puzzleFloorMaterial = new THREE.MeshStandardMaterial({ color: 0x90ee90 });
    const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x555555 });
    const corridorMaterial = new THREE.MeshStandardMaterial({ color: 0xaaaaaa });

    // Create Rooms
    this.rooms.forEach((room) => {
      // Floor
      const floorGeometry = new THREE.PlaneGeometry(room.width, room.depth);
      const floor = new THREE.Mesh(floorGeometry, room.hasPuzzle ? puzzleFloorMaterial : floorMaterial);
      floor.rotation.x = -Math.PI / 2;
      floor.position.set(room.x, 0, room.z);
      this.scene.add(floor);
      this.roomMeshes.push(floor);

      // Mark walkable
      this.setWalkableArea(room.x, room.z, room.width, room.depth);

      // Walls
      this.createRoomWalls(room, wallMaterial);

      // Puzzle Indicator
      if (room.hasPuzzle) {
        const indicatorGeometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 8);
        const indicatorMaterial = new THREE.MeshStandardMaterial({ 
          color: 0xff6b6b,
          emissive: 0xff0000,
          emissiveIntensity: 0.5
        });
        this.puzzleIndicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
        this.puzzleIndicator.position.set(room.x, 0.5, room.z);
        this.scene.add(this.puzzleIndicator);
      }
    });

    // Create Corridors (Connecting adjacent rooms)
    // Horizontal corridors
    for (let row = 0; row < 3; row++) {
      const z = (row - 1) * spacing;
      // Connect col 0 to 1, 1 to 2
      this.createCorridor(-spacing/2, z, spacing - roomSize, corridorWidth, corridorMaterial);
      this.createCorridor(spacing/2, z, spacing - roomSize, corridorWidth, corridorMaterial);
    }
    // Vertical corridors
    for (let col = 0; col < 3; col++) {
      const x = (col - 1) * spacing;
      // Connect row 0 to 1, 1 to 2
      this.createCorridor(x, -spacing/2, corridorWidth, spacing - roomSize, corridorMaterial);
      this.createCorridor(x, spacing/2, corridorWidth, spacing - roomSize, corridorMaterial);
    }

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    this.scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(0, 10, 0);
    this.scene.add(directionalLight);
  }

  private createCorridor(x: number, z: number, width: number, depth: number, material: THREE.Material): void {
    const geometry = new THREE.PlaneGeometry(width, depth);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, 0.01, z); // Slightly above 0 to avoid z-fighting overlap with possible edges
    this.scene.add(mesh);
    this.roomMeshes.push(mesh);
    this.setWalkableArea(x, z, width, depth);
  }

  private createRoomWalls(room: Room, material: THREE.Material): void {
    const h = 1.5; // Wall height
    const t = 0.2; // Wall thickness
    const w = room.width;
    const d = room.depth;
    const doorWidth = 2.5;

    // Helper to create a wall segment
    const addWall = (bx: number, bz: number, bw: number, bd: number) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(bw, h, bd), material);
      mesh.position.set(room.x + bx, h/2, room.z + bz);
      this.scene.add(mesh);
      this.roomMeshes.push(mesh);
    };

    // North Wall (Top)
    if (room.z > -10) { // If not top row, has door (actually grid is -spacing, 0, spacing. Top is -spacing)
       // Check if connected to top. Row indices: 0 (-spacing), 1 (0), 2 (spacing)
       // If z is 0 or spacing, there is a room above.
       // Actually, let's just put doors everywhere internally and solid walls on the perimeter.
    }

    // Simplified logic: Check grid position
    const gridX = Math.round(room.x / 10) + 1; // -1,0,1 -> 0,1,2
    const gridZ = Math.round(room.z / 10) + 1; // -1,0,1 -> 0,1,2

    // North (-Z)
    if (gridZ > 0) { // Connects to north
      addWall(-(w/4 + doorWidth/4), -d/2, w/2 - doorWidth/2, t); // Left part
      addWall((w/4 + doorWidth/4), -d/2, w/2 - doorWidth/2, t);  // Right part
    } else { // Solid wall
      addWall(0, -d/2, w, t);
    }

    // South (+Z)
    if (gridZ < 2) { // Connects to south
      addWall(-(w/4 + doorWidth/4), d/2, w/2 - doorWidth/2, t);
      addWall((w/4 + doorWidth/4), d/2, w/2 - doorWidth/2, t);
    } else {
      addWall(0, d/2, w, t);
    }

    // West (-X)
    if (gridX > 0) { // Connects to west
      addWall(-w/2, -(d/4 + doorWidth/4), t, d/2 - doorWidth/2);
      addWall(-w/2, (d/4 + doorWidth/4), t, d/2 - doorWidth/2);
    } else {
      addWall(-w/2, 0, t, d);
    }

    // East (+X)
    if (gridX < 2) { // Connects to east
      addWall(w/2, -(d/4 + doorWidth/4), t, d/2 - doorWidth/2);
      addWall(w/2, (d/4 + doorWidth/4), t, d/2 - doorWidth/2);
    } else {
      addWall(w/2, 0, t, d);
    }
  }

  private setupPlayer(): void {
    this.player = new THREE.Group();

    // Body
    const bodyGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.8, 16);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x4169e1 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.4;
    this.player.add(body);

    // Head
    const headGeo = new THREE.SphereGeometry(0.25, 16, 16);
    const headMat = new THREE.MeshStandardMaterial({ color: 0xffccaa });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 0.95;
    this.player.add(head);

    // Spawn in Room 1 (top-left, not the puzzle room)
    this.player.position.set(-10, 0, -10);
    this.scene.add(this.player);
    this.currentRoom = this.rooms.find(r => r.x === -10 && r.z === -10) || null;
  }

  private setupClickHandler(): void {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    this.renderer.domElement.addEventListener('click', (event) => {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, this.camera);
      const intersects = raycaster.intersectObjects(this.roomMeshes);

      if (intersects.length > 0) {
        const point = intersects[0].point;
        
        // Check puzzle click
        if (this.puzzleIndicator) {
          const distance = point.distanceTo(this.puzzleIndicator.position);
          if (distance < 1.5) {
            if (this.onSceneExitCallback) {
              this.onSceneExitCallback('puzzle');
            }
            return;
          }
        }

        // Pathfinding
        if (this.player) {
          const start = this.player.position;
          const path = this.findPath(start, point);
          if (path.length > 0) {
            this.playerPath = path;
          }
        }
      }
    });
  }

  private findPath(start: THREE.Vector3, end: THREE.Vector3): THREE.Vector3[] {
    // Convert world coords to grid coords
    const startX = Math.floor((start.x + this.gridOffsetX) / this.gridSize);
    const startZ = Math.floor((start.z + this.gridOffsetZ) / this.gridSize);
    const endX = Math.floor((end.x + this.gridOffsetX) / this.gridSize);
    const endZ = Math.floor((end.z + this.gridOffsetZ) / this.gridSize);

    if (startX < 0 || startX >= this.gridWidth || startZ < 0 || startZ >= this.gridDepth) return [];
    if (endX < 0 || endX >= this.gridWidth || endZ < 0 || endZ >= this.gridDepth) return [];
    if (!this.grid[endX][endZ]) return []; // Target unreachable

    // A* Implementation
    const openList: GridNode[] = [];
    const closedList: boolean[][] = [];
    for(let i=0; i<this.gridWidth; i++) closedList[i] = new Array(this.gridDepth).fill(false);

    const startNode: GridNode = { x: startX, z: startZ, walkable: true, g: 0, h: 0, f: 0, parent: null };
    openList.push(startNode);

    while (openList.length > 0) {
      // Get node with lowest f
      let lowestIndex = 0;
      for (let i = 1; i < openList.length; i++) {
        if (openList[i].f < openList[lowestIndex].f) {
          lowestIndex = i;
        }
      }
      const current = openList[lowestIndex];

      // Found target
      if (current.x === endX && current.z === endZ) {
        const path: THREE.Vector3[] = [];
        let temp: GridNode | null = current;
        while (temp) {
          path.push(new THREE.Vector3(
            (temp.x * this.gridSize) - this.gridOffsetX + this.gridSize/2,
            0.4,
            (temp.z * this.gridSize) - this.gridOffsetZ + this.gridSize/2
          ));
          temp = temp.parent;
        }
        return path.reverse();
      }

      // Move from open to closed
      openList.splice(lowestIndex, 1);
      closedList[current.x][current.z] = true;

      // Check neighbors
      const neighbors = [
        { x: 0, z: -1 }, { x: 0, z: 1 }, { x: -1, z: 0 }, { x: 1, z: 0 }
      ];

      for (const offset of neighbors) {
        const neighborX = current.x + offset.x;
        const neighborZ = current.z + offset.z;

        if (neighborX >= 0 && neighborX < this.gridWidth && 
            neighborZ >= 0 && neighborZ < this.gridDepth && 
            this.grid[neighborX][neighborZ] && 
            !closedList[neighborX][neighborZ]) {

          const gScore = current.g + 1;
          let neighbor = openList.find(n => n.x === neighborX && n.z === neighborZ);

          if (!neighbor) {
            const h = Math.abs(neighborX - endX) + Math.abs(neighborZ - endZ);
            neighbor = {
              x: neighborX,
              z: neighborZ,
              walkable: true,
              g: gScore,
              h: h,
              f: gScore + h,
              parent: current
            };
            openList.push(neighbor);
          } else if (gScore < neighbor.g) {
            neighbor.g = gScore;
            neighbor.f = neighbor.g + neighbor.h;
            neighbor.parent = current;
          }
        }
      }
    }

    return []; // No path found
  }

  public setOnSceneExit(callback: (targetScene: string) => void): void {
    this.onSceneExitCallback = callback;
  }

  public getName(): string {
    return 'room';
  }

  public enter(): void {
    // Register this scene's camera with SceneManager
    if (this.sceneManager) {
      this.sceneManager.setCurrentCamera(this.camera);
    }
    
    // Show room objects
    this.roomMeshes.forEach(mesh => {
      mesh.visible = true;
    });
    if (this.player) {
      this.player.visible = true;
    }
    if (this.puzzleIndicator) {
      this.puzzleIndicator.visible = true;
    }

    // Hide Instructions from Puzzle Scene if visible
    const instructions = document.getElementById('instructions');
    if (instructions) {
      instructions.style.display = 'none';
    }
    
    // Reset player to Room 1 (top-left, not the puzzle room)
    if (this.player) {
      this.player.position.set(-10, 0, -10);
      this.playerPath = [];
    }
    this.currentRoom = this.rooms.find(r => r.x === -10 && r.z === -10) || null;
  }

  public exit(): void {
    // Hide room objects
    this.roomMeshes.forEach(mesh => {
      mesh.visible = false;
    });
    if (this.player) {
      this.player.visible = false;
    }
    if (this.puzzleIndicator) {
      this.puzzleIndicator.visible = false;
    }
  }

  public update(deltaTime: number): void {
    if (this.player && this.playerPath.length > 0) {
      const target = this.playerPath[0];
      const direction = new THREE.Vector3().subVectors(target, this.player.position);
      const dist = direction.length();

      if (dist < 0.1) {
        this.player.position.copy(target);
        this.playerPath.shift();
      } else {
        direction.normalize();
        const moveDist = this.playerSpeed * deltaTime;
        this.player.position.add(direction.multiplyScalar(Math.min(moveDist, dist)));
        
        // Rotate player to face movement
        // ...
      }
    }
  }

  public dispose(): void {
    this.roomMeshes.forEach(mesh => {
      this.scene.remove(mesh);
      mesh.geometry.dispose();
      if (mesh.material instanceof THREE.Material) {
        mesh.material.dispose();
      }
    });
    this.roomMeshes = [];

    if (this.player) {
      this.scene.remove(this.player);
      // traverse to dispose children...
      this.player = null;
    }

    if (this.puzzleIndicator) {
      this.scene.remove(this.puzzleIndicator);
      this.puzzleIndicator.geometry.dispose();
      if (this.puzzleIndicator.material instanceof THREE.Material) {
        this.puzzleIndicator.material.dispose();
      }
      this.puzzleIndicator = null;
    }
  }
}
