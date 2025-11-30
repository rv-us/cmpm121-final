import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export class PhysicsObject {
  public mesh: THREE.Mesh;
  public body: CANNON.Body;

  constructor(
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    physicsShape: CANNON.Shape,
    mass: number = 1,
    physicsMaterial?: CANNON.Material
  ) {
    // Three.js mesh
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;

    // Cannon.js body
    this.body = new CANNON.Body({ mass, material: physicsMaterial });
    this.body.addShape(physicsShape);
    
    // Add linear and angular damping to reduce weird bouncing
    this.body.linearDamping = 0.4; // Air resistance
    this.body.angularDamping = 0.4; // Rotational resistance
    
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

