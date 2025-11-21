import * as CANNON from 'cannon-es';

export class PhysicsWorld {
  public world: CANNON.World;
  private timeStep: number = 1 / 60;
  private maxSubSteps: number = 10;

  constructor() {
    this.world = new CANNON.World({
      gravity: new CANNON.Vec3(0, -9.82, 0),
    });
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

