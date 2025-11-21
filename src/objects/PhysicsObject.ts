import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export class PhysicsObject {
  public mesh: THREE.Mesh;
  public body: CANNON.Body;

  constructor(
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    physicsShape: CANNON.Shape,
    mass: number = 1
  ) {
    // Three.js mesh
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;

    // Cannon.js body
    this.body = new CANNON.Body({ mass });
    this.body.addShape(physicsShape);
    
    // Sync initial positions
    this.syncMeshToBody();
  }

  public syncMeshToBody(): void {
    this.mesh.position.set(
      this.body.position.x,
      this.body.position.y,
      this.body.position.z
    );
    this.mesh.quaternion.set(
      this.body.quaternion.x,
      this.body.quaternion.y,
      this.body.quaternion.z,
      this.body.quaternion.w
    );
  }

  public setPosition(x: number, y: number, z: number): void {
    this.body.position.set(x, y, z);
    this.syncMeshToBody();
  }

  public applyForce(force: CANNON.Vec3, point?: CANNON.Vec3): void {
    this.body.applyForce(force, point || this.body.position);
  }

  public applyImpulse(impulse: CANNON.Vec3, point?: CANNON.Vec3): void {
    this.body.applyImpulse(impulse, point || this.body.position);
  }
}

