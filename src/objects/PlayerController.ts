import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { PhysicsObject } from './PhysicsObject.js';

export class PlayerController {
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private selectedObject: PhysicsObject | null = null;
  private isDragging: boolean = false;
  private dragOffset: CANNON.Vec3 = new CANNON.Vec3();

  constructor(
    private camera: THREE.PerspectiveCamera,
    private scene: THREE.Scene,
    private objects: PhysicsObject[]
  ) {
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    // Mouse events
    window.addEventListener('mousedown', (e) => this.onMouseDown(e));
    window.addEventListener('mousemove', (e) => this.onMouseMove(e));
    window.addEventListener('mouseup', () => this.onMouseUp());
  }

  private onMouseDown(event: MouseEvent): void {
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(
      this.objects.map((obj) => obj.mesh)
    );

    if (intersects.length > 0) {
      const clickedMesh = intersects[0].object as THREE.Mesh;
      this.selectedObject = this.objects.find((obj) => obj.mesh === clickedMesh) || null;

      if (this.selectedObject) {
        this.isDragging = true;
        const worldPoint = intersects[0].point;
        const bodyPoint = new CANNON.Vec3(
          worldPoint.x - this.selectedObject.body.position.x,
          worldPoint.y - this.selectedObject.body.position.y,
          worldPoint.z - this.selectedObject.body.position.z
        );
        this.dragOffset = bodyPoint;
      }
    }
  }

  private onMouseMove(event: MouseEvent): void {
    if (!this.isDragging || !this.selectedObject) return;

    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    // Create a plane at the object's height for dragging
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -this.selectedObject.body.position.y);
    const intersection = new THREE.Vector3();
    this.raycaster.ray.intersectPlane(plane, intersection);

    if (intersection) {
      const targetPos = new CANNON.Vec3(intersection.x, intersection.y, intersection.z);
      const currentPos = this.selectedObject.body.position;
      const force = targetPos.vsub(currentPos);
      force.scale(10); // Adjust force strength
      this.selectedObject.body.applyForce(force, this.dragOffset);
    }
  }

  private onMouseUp(): void {
    this.isDragging = false;
    this.selectedObject = null;
  }
}

