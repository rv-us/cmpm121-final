import * as THREE from 'three';
import { Scene } from '../game/Scene.js';
import { SceneManager } from '../game/SceneManager.js';
import { InteractableObject, InteractionType, InteractableObjectData } from '../objects/InteractableObject.js';
import { Inventory } from '../systems/Inventory.js';
import { ThemeManager } from '../systems/ThemeManager.js';

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
  private inventory: Inventory;
  private themeManager: ThemeManager;
  
  // Lighting (will be updated based on theme)
  private ambientLight: THREE.AmbientLight | null = null;
  private directionalLight: THREE.DirectionalLight | null = null;
  
  // Interaction system
  private interactableObjects: InteractableObject[] = [];
  private removedObjectIds: Set<string> = new Set(); // Track removed objects for save/load
  private hoveredObject: InteractableObject | null = null;
  private raycaster: THREE.Raycaster = new THREE.Raycaster();
  private mouse: THREE.Vector2 = new THREE.Vector2();
  private interactionUI: HTMLDivElement | null = null;
  
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
    renderer: THREE.WebGLRenderer,
    inventory: Inventory,
    themeManager: ThemeManager
  ) {
    this.scene = scene;
    this.renderer = renderer;
    this.inventory = inventory;
    this.themeManager = themeManager;
    
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
    this.setupInteractableObjects();
    this.setupInteractionUI();
    this.setupClickHandler();
    this.setupMouseMoveHandler();
    this.setupResizeHandler();
    
    // Listen for theme changes
    this.themeManager.onThemeChange(() => {
      this.applyTheme();
    });
    
    // Apply initial theme
    this.applyTheme();
  }

  public setSceneManager(sceneManager: SceneManager): void {
    this.sceneManager = sceneManager;
  }

  public getCamera(): THREE.Camera {
    return this.camera;
  }

  private setupInteractionUI(): void {
    // Create UI element for interaction messages
    this.interactionUI = document.createElement('div');
    this.interactionUI.id = 'interaction-ui';
    this.interactionUI.style.position = 'absolute';
    this.interactionUI.style.top = '20px';
    this.interactionUI.style.left = '50%';
    this.interactionUI.style.transform = 'translateX(-50%)';
    this.interactionUI.style.padding = '10px 20px';
    this.interactionUI.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    this.interactionUI.style.color = 'white';
    this.interactionUI.style.fontFamily = 'Arial, sans-serif';
    this.interactionUI.style.fontSize = '16px';
    this.interactionUI.style.borderRadius = '8px';
    this.interactionUI.style.display = 'none';
    this.interactionUI.style.zIndex = '1000';
    this.interactionUI.style.pointerEvents = 'none';
    document.body.appendChild(this.interactionUI);
  }

  private showInteractionMessage(message: string, duration: number = 2000): void {
    if (this.interactionUI) {
      this.interactionUI.textContent = message;
      this.interactionUI.style.display = 'block';
      
      setTimeout(() => {
        if (this.interactionUI) {
          this.interactionUI.style.display = 'none';
        }
      }, duration);
    }
  }

  private setupInteractableObjects(): void {
    // Define interactable objects
    const objectsData: InteractableObjectData[] = [
      {
        id: 'key1',
        name: 'Golden Key',
        description: 'A shiny golden key. Might unlock something important.',
        type: InteractionType.PICKUP,
        position: { x: -10, y: 0.5, z: -8 }, // Room 1
        color: 0xffd700,
        geometry: 'cylinder',
      },
      {
        id: 'potion1',
        name: 'Health Potion',
        description: 'A red potion that restores health.',
        type: InteractionType.PICKUP,
        position: { x: 0, y: 0.5, z: -10 }, // Room 2
        color: 0xff0000,
        geometry: 'cylinder',
      },
      {
        id: 'coin1',
        name: 'Gold Coin',
        description: 'A valuable gold coin.',
        type: InteractionType.PICKUP,
        position: { x: 10, y: 0.5, z: -10 }, // Room 3
        color: 0xffd700,
        geometry: 'sphere',
      },
      {
        id: 'statue1',
        name: 'Ancient Statue',
        description: 'An old statue with mysterious inscriptions. Cannot be moved.',
        type: InteractionType.EXAMINE,
        position: { x: -10, y: 0.5, z: 0 }, // Room 4
        color: 0x808080,
        geometry: 'box',
      },
      {
        id: 'gem1',
        name: 'Blue Gem',
        description: 'A glowing blue gemstone.',
        type: InteractionType.PICKUP,
        position: { x: 10, y: 0.5, z: 0 }, // Room 6
        color: 0x0000ff,
        geometry: 'sphere',
      },
    ];

    // Create interactable objects
    objectsData.forEach(data => {
      const obj = new InteractableObject(data);
      this.interactableObjects.push(obj);
      this.scene.add(obj.mesh);
    });
  }

  private setupMouseMoveHandler(): void {
    this.renderer.domElement.addEventListener('mousemove', (event) => {
      this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, this.camera);
      
      // Check for interactable objects
      const interactableMeshes = this.interactableObjects.map(obj => obj.mesh);
      const intersects = this.raycaster.intersectObjects(interactableMeshes);

      // Clear previous hover
      if (this.hoveredObject) {
        this.hoveredObject.unhighlight();
        this.hoveredObject = null;
        this.renderer.domElement.style.cursor = 'default';
      }

      // Highlight hovered object
      if (intersects.length > 0) {
        const mesh = intersects[0].object as THREE.Mesh;
        const obj = mesh.userData.interactableObject as InteractableObject;
        if (obj) {
          obj.highlight();
          this.hoveredObject = obj;
          this.renderer.domElement.style.cursor = 'pointer';
        }
      }
    });
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
        this.grid[x][z] = false;
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
    const spacing = 10;
    const corridorWidth = 2;
    
    // Get theme colors
    const themeColors = this.themeManager.getThemeColors();
    
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

    const floorMaterial = new THREE.MeshStandardMaterial({ color: themeColors.floorColor });
    const puzzleFloorMaterial = new THREE.MeshStandardMaterial({ color: themeColors.puzzleFloorColor });
    const wallMaterial = new THREE.MeshStandardMaterial({ color: themeColors.wallColor });
    const corridorMaterial = new THREE.MeshStandardMaterial({ color: themeColors.corridorColor });

    this.rooms.forEach((room) => {
      const floorGeometry = new THREE.PlaneGeometry(room.width, room.depth);
      const floor = new THREE.Mesh(floorGeometry, room.hasPuzzle ? puzzleFloorMaterial : floorMaterial);
      floor.rotation.x = -Math.PI / 2;
      floor.position.set(room.x, 0, room.z);
      this.scene.add(floor);
      this.roomMeshes.push(floor);

      this.setWalkableArea(room.x, room.z, room.width, room.depth);
      this.createRoomWalls(room, wallMaterial);

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

    for (let row = 0; row < 3; row++) {
      const z = (row - 1) * spacing;
      this.createCorridor(-spacing/2, z, spacing - roomSize, corridorWidth, corridorMaterial);
      this.createCorridor(spacing/2, z, spacing - roomSize, corridorWidth, corridorMaterial);
    }
    for (let col = 0; col < 3; col++) {
      const x = (col - 1) * spacing;
      this.createCorridor(x, -spacing/2, corridorWidth, spacing - roomSize, corridorMaterial);
      this.createCorridor(x, spacing/2, corridorWidth, spacing - roomSize, corridorMaterial);
    }

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
    mesh.position.set(x, 0.01, z);
    this.scene.add(mesh);
    this.roomMeshes.push(mesh);
    this.setWalkableArea(x, z, width, depth);
  }

  private createRoomWalls(room: Room, material: THREE.Material): void {
    const h = 1.5;
    const t = 0.2;
    const w = room.width;
    const d = room.depth;
    const doorWidth = 2.5;

    const addWall = (bx: number, bz: number, bw: number, bd: number) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(bw, h, bd), material);
      mesh.position.set(room.x + bx, h/2, room.z + bz);
      this.scene.add(mesh);
      this.roomMeshes.push(mesh);
    };

    const gridX = Math.round(room.x / 10) + 1;
    const gridZ = Math.round(room.z / 10) + 1;

    if (gridZ > 0) {
      addWall(-(w/4 + doorWidth/4), -d/2, w/2 - doorWidth/2, t);
      addWall((w/4 + doorWidth/4), -d/2, w/2 - doorWidth/2, t);
    } else {
      addWall(0, -d/2, w, t);
    }

    if (gridZ < 2) {
      addWall(-(w/4 + doorWidth/4), d/2, w/2 - doorWidth/2, t);
      addWall((w/4 + doorWidth/4), d/2, w/2 - doorWidth/2, t);
    } else {
      addWall(0, d/2, w, t);
    }

    if (gridX > 0) {
      addWall(-w/2, -(d/4 + doorWidth/4), t, d/2 - doorWidth/2);
      addWall(-w/2, (d/4 + doorWidth/4), t, d/2 - doorWidth/2);
    } else {
      addWall(-w/2, 0, t, d);
    }

    if (gridX < 2) {
      addWall(w/2, -(d/4 + doorWidth/4), t, d/2 - doorWidth/2);
      addWall(w/2, (d/4 + doorWidth/4), t, d/2 - doorWidth/2);
    } else {
      addWall(w/2, 0, t, d);
    }
  }

  private setupPlayer(): void {
    this.player = new THREE.Group();

    const bodyGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.8, 16);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x4169e1 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.4;
    this.player.add(body);

    const headGeo = new THREE.SphereGeometry(0.25, 16, 16);
    const headMat = new THREE.MeshStandardMaterial({ color: 0xffccaa });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 0.95;
    this.player.add(head);

    this.player.position.set(-10, 0, -10);
    this.scene.add(this.player);
    this.currentRoom = this.rooms.find(r => r.x === -10 && r.z === -10) || null;
  }

  private setupClickHandler(): void {
    this.renderer.domElement.addEventListener('click', (event) => {
      this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, this.camera);
      
      // First check for interactable objects
      const interactableMeshes = this.interactableObjects.map(obj => obj.mesh);
      const objectIntersects = this.raycaster.intersectObjects(interactableMeshes);

      if (objectIntersects.length > 0) {
        const mesh = objectIntersects[0].object as THREE.Mesh;
        const obj = mesh.userData.interactableObject as InteractableObject;
        if (obj) {
          const result = obj.interact();
          this.showInteractionMessage(result.message);
          
          if (result.success) {
            // Add to inventory
            this.inventory.addItem({
              id: obj.data.id,
              name: obj.data.name,
              description: obj.data.description,
              color: obj.data.color,
            });
            
            // Track removed object
            this.removedObjectIds.add(obj.data.id);
            
            // Remove object from scene and list
            this.scene.remove(obj.mesh);
            const index = this.interactableObjects.indexOf(obj);
            if (index > -1) {
              this.interactableObjects.splice(index, 1);
            }
            obj.dispose();
          }
          return;
        }
      }

      // Then check for room clicks (movement and puzzle)
      const intersects = this.raycaster.intersectObjects(this.roomMeshes);

      if (intersects.length > 0) {
        const point = intersects[0].point;
        
        if (this.puzzleIndicator) {
          const distance = point.distanceTo(this.puzzleIndicator.position);
          if (distance < 1.5) {
            if (this.onSceneExitCallback) {
              this.onSceneExitCallback('puzzle');
            }
            return;
          }
        }

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
    const startX = Math.floor((start.x + this.gridOffsetX) / this.gridSize);
    const startZ = Math.floor((start.z + this.gridOffsetZ) / this.gridSize);
    const endX = Math.floor((end.x + this.gridOffsetX) / this.gridSize);
    const endZ = Math.floor((end.z + this.gridOffsetZ) / this.gridSize);

    if (startX < 0 || startX >= this.gridWidth || startZ < 0 || startZ >= this.gridDepth) return [];
    if (endX < 0 || endX >= this.gridWidth || endZ < 0 || endZ >= this.gridDepth) return [];
    if (!this.grid[endX][endZ]) return [];

    const openList: GridNode[] = [];
    const closedList: boolean[][] = [];
    for(let i=0; i<this.gridWidth; i++) closedList[i] = new Array(this.gridDepth).fill(false);

    const startNode: GridNode = { x: startX, z: startZ, walkable: true, g: 0, h: 0, f: 0, parent: null };
    openList.push(startNode);

    while (openList.length > 0) {
      let lowestIndex = 0;
      for (let i = 1; i < openList.length; i++) {
        if (openList[i].f < openList[lowestIndex].f) {
          lowestIndex = i;
        }
      }
      const current = openList[lowestIndex];

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

      openList.splice(lowestIndex, 1);
      closedList[current.x][current.z] = true;

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

    return [];
  }

  public setOnSceneExit(callback: (targetScene: string) => void): void {
    this.onSceneExitCallback = callback;
  }

  public getName(): string {
    return 'room';
  }

  public enter(): void {
    if (this.sceneManager) {
      this.sceneManager.setCurrentCamera(this.camera);
    }
    
    this.roomMeshes.forEach(mesh => {
      mesh.visible = true;
    });
    if (this.player) {
      this.player.visible = true;
    }
    if (this.puzzleIndicator) {
      this.puzzleIndicator.visible = true;
    }
    
    // Show interactable objects
    this.interactableObjects.forEach(obj => {
      obj.mesh.visible = true;
    });

    const instructions = document.getElementById('instructions');
    if (instructions) {
      instructions.style.display = 'none';
    }
    
    if (this.player) {
      this.player.position.set(-10, 0, -10);
      this.playerPath = [];
    }
    this.currentRoom = this.rooms.find(r => r.x === -10 && r.z === -10) || null;
  }

  public exit(): void {
    this.roomMeshes.forEach(mesh => {
      mesh.visible = false;
    });
    if (this.player) {
      this.player.visible = false;
    }
    if (this.puzzleIndicator) {
      this.puzzleIndicator.visible = false;
    }
    
    // Hide interactable objects
    this.interactableObjects.forEach(obj => {
      obj.mesh.visible = false;
      obj.unhighlight();
    });
    
    // Clear hover state
    if (this.hoveredObject) {
      this.hoveredObject = null;
    }
    this.renderer.domElement.style.cursor = 'default';
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

    // Clean up interactable objects
    this.interactableObjects.forEach(obj => {
      this.scene.remove(obj.mesh);
      obj.dispose();
    });
    this.interactableObjects = [];

    // Clean up UI
    if (this.interactionUI && this.interactionUI.parentElement) {
      this.interactionUI.parentElement.removeChild(this.interactionUI);
      this.interactionUI = null;
    }
  }

  /**
   * Get player position for saving
   */
  public getPlayerPosition(): { x: number; y: number; z: number } {
    if (this.player) {
      return {
        x: this.player.position.x,
        y: this.player.position.y,
        z: this.player.position.z,
      };
    }
    return { x: -10, y: 0, z: -10 }; // Default position
  }

  /**
   * Set player position for loading
   */
  public setPlayerPosition(position: { x: number; y: number; z: number }): void {
    if (this.player) {
      this.player.position.set(position.x, position.y, position.z);
      this.playerPath = []; // Clear any existing path
    }
  }

  /**
   * Get removed object IDs for saving
   */
  public getRemovedObjectIds(): string[] {
    return Array.from(this.removedObjectIds);
  }

  /**
   * Set removed object IDs for loading (removes objects from scene)
   */
  public setRemovedObjectIds(ids: string[]): void {
    this.removedObjectIds = new Set(ids);
    
    // Remove objects that should be removed
    const objectsToRemove: InteractableObject[] = [];
    this.interactableObjects.forEach(obj => {
      if (this.removedObjectIds.has(obj.data.id)) {
        objectsToRemove.push(obj);
      }
    });
    
    objectsToRemove.forEach(obj => {
      this.scene.remove(obj.mesh);
      const index = this.interactableObjects.indexOf(obj);
      if (index > -1) {
        this.interactableObjects.splice(index, 1);
      }
      obj.dispose();
    });
  }

  /**
   * Apply current theme to the scene
   */
  private applyTheme(): void {
    const themeColors = this.themeManager.getThemeColors();
    
    // Update lighting
    if (this.ambientLight) {
      this.ambientLight.color.setHex(themeColors.ambientLightColor);
      this.ambientLight.intensity = themeColors.ambientLightIntensity;
    }
    
    if (this.directionalLight) {
      this.directionalLight.color.setHex(themeColors.directionalLightColor);
      this.directionalLight.intensity = themeColors.directionalLightIntensity;
    }
    
    // Update fog
    if (this.scene.fog && this.scene.fog instanceof THREE.Fog) {
      this.scene.fog.color.setHex(themeColors.fogColor);
      this.scene.fog.near = themeColors.fogNear;
      this.scene.fog.far = themeColors.fogFar;
    }
    
    // Update room materials
    this.roomMeshes.forEach((mesh, index) => {
      if (mesh.material instanceof THREE.MeshStandardMaterial) {
        // Determine what type of surface this is based on its current color
        const currentColor = mesh.material.color.getHex();
        
        // Check if it's a puzzle floor (greenish)
        if (currentColor >= 0x80ee80 && currentColor <= 0xa0eea0) {
          mesh.material.color.setHex(themeColors.puzzleFloorColor);
        }
        // Check if it's a wall (darker)
        else if (currentColor >= 0x222222 && currentColor <= 0xbbbbbb) {
          mesh.material.color.setHex(themeColors.wallColor);
        }
        // Check if it's a corridor (medium)
        else if (currentColor >= 0xaaaaaa && currentColor <= 0xd0d0d0) {
          mesh.material.color.setHex(themeColors.corridorColor);
        }
        // Otherwise it's a regular floor
        else {
          mesh.material.color.setHex(themeColors.floorColor);
        }
      }
    });
    
    console.log(`Theme applied to RoomScene: ${this.themeManager.getCurrentTheme()}`);
  }
}