import * as THREE from 'three';

export enum InteractionType {
  PICKUP = 'pickup',
  EXAMINE = 'examine',
}

export interface InteractableObjectData {
  id: string;
  name: string;
  description: string;
  type: InteractionType;
  position: { x: number; y: number; z: number };
  color: number;
  geometry: 'box' | 'sphere' | 'cylinder';
}

export class InteractableObject {
  public mesh: THREE.Mesh;
  public data: InteractableObjectData;
  private originalMaterial: THREE.MeshStandardMaterial;
  private highlightMaterial: THREE.MeshStandardMaterial;
  private isHighlighted: boolean = false;

  constructor(data: InteractableObjectData) {
    this.data = data;

    // Create geometry based on type
    let geometry: THREE.BufferGeometry;
    switch (data.geometry) {
      case 'box':
        geometry = new THREE.BoxGeometry(0.4, 0.4, 0.4);
        break;
      case 'sphere':
        geometry = new THREE.SphereGeometry(0.3, 16, 16);
        break;
      case 'cylinder':
        geometry = new THREE.CylinderGeometry(0.2, 0.2, 0.5, 16);
        break;
      default:
        geometry = new THREE.BoxGeometry(0.4, 0.4, 0.4);
    }

    // Create materials
    this.originalMaterial = new THREE.MeshStandardMaterial({
      color: data.color,
      emissive: data.color,
      emissiveIntensity: 0.2,
    });

    this.highlightMaterial = new THREE.MeshStandardMaterial({
      color: data.color,
      emissive: 0xffff00, // Yellow glow
      emissiveIntensity: 0.6,
    });

    // Create mesh
    this.mesh = new THREE.Mesh(geometry, this.originalMaterial);
    this.mesh.position.set(data.position.x, data.position.y, data.position.z);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;

    // Store reference to this object in the mesh for raycasting
    this.mesh.userData.interactableObject = this;
  }

  public highlight(): void {
    if (!this.isHighlighted) {
      this.mesh.material = this.highlightMaterial;
      this.isHighlighted = true;
    }
  }

  public unhighlight(): void {
    if (this.isHighlighted) {
      this.mesh.material = this.originalMaterial;
      this.isHighlighted = false;
    }
  }

  public interact(): { success: boolean; message: string } {
    if (this.data.type === InteractionType.PICKUP) {
      return {
        success: true,
        message: `Picked up ${this.data.name}`,
      };
    } else if (this.data.type === InteractionType.EXAMINE) {
      return {
        success: false, // Don't remove from scene
        message: `${this.data.name}: ${this.data.description}`,
      };
    }
    return { success: false, message: '' };
  }

  public dispose(): void {
    this.mesh.geometry.dispose();
    this.originalMaterial.dispose();
    this.highlightMaterial.dispose();
  }
}