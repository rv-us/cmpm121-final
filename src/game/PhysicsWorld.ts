import * as CANNON from 'cannon-es';

export class PhysicsWorld {
  public world: CANNON.World;
  private timeStep: number = 1 / 60;
  private maxSubSteps: number = 10;
  
  // Physics materials for different object types
  public ballMaterial: CANNON.Material;
  public wallMaterial: CANNON.Material;
  public groundMaterial: CANNON.Material;
  public targetMaterial: CANNON.Material;

  constructor() {
    this.world = new CANNON.World({
      gravity: new CANNON.Vec3(0, -9.82, 0),
    });
    
    // Create physics materials with proper collision properties
    // Ball material - low friction, some bounce
    this.ballMaterial = new CANNON.Material('ball');
    this.ballMaterial.friction = 0.3;
    this.ballMaterial.restitution = 0.3; // Bounciness
    
    // Wall material - high friction, no bounce
    this.wallMaterial = new CANNON.Material('wall');
    this.wallMaterial.friction = 0.8;
    this.wallMaterial.restitution = 0.1;
    
    // Ground material - medium friction, no bounce
    this.groundMaterial = new CANNON.Material('ground');
    this.groundMaterial.friction = 0.6;
    this.groundMaterial.restitution = 0.0;
    
    // Target material - medium friction, no bounce
    this.targetMaterial = new CANNON.Material('target');
    this.targetMaterial.friction = 0.5;
    this.targetMaterial.restitution = 0.0;
    
    // Create contact materials for interactions between materials
    // Ball vs Wall
    const ballWallContact = new CANNON.ContactMaterial(
      this.ballMaterial,
      this.wallMaterial,
      {
        friction: 0.4,
        restitution: 0.2,
      }
    );
    this.world.addContactMaterial(ballWallContact);
    
    // Ball vs Ground
    const ballGroundContact = new CANNON.ContactMaterial(
      this.ballMaterial,
      this.groundMaterial,
      {
        friction: 0.5,
        restitution: 0.1,
      }
    );
    this.world.addContactMaterial(ballGroundContact);
    
    // Ball vs Target
    const ballTargetContact = new CANNON.ContactMaterial(
      this.ballMaterial,
      this.targetMaterial,
      {
        friction: 0.4,
        restitution: 0.0,
      }
    );
    this.world.addContactMaterial(ballTargetContact);
  }

  public step(deltaTime: number): void {
    this.world.step(this.timeStep, deltaTime, this.maxSubSteps);
  }

  public addBody(body: CANNON.Body): void {
    this.world.addBody(body);
  }

  public removeBody(body: CANNON.Body): void {
    this.world.removeBody(body);
  }
}

