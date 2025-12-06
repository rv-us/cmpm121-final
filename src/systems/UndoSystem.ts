import { InventoryItem } from './Inventory.js';
import { InteractableObjectData } from '../objects/InteractableObject.js';

export enum UndoActionType {
  SCENE_TRANSITION = 'scene_transition',
  OBJECT_INTERACTION = 'object_interaction',
  PLAYER_MOVEMENT = 'player_movement',
}

export interface SceneTransitionData {
  fromScene: string;
  toScene: string;
  playerPosition?: { x: number; y: number; z: number };
}

export interface ObjectInteractionData {
  objectId: string;
  objectData: InteractableObjectData;
  inventoryStateBefore: InventoryItem[];
  objectPosition: { x: number; y: number; z: number };
}

export interface PlayerMovementData {
  fromPosition: { x: number; y: number; z: number };
  toPosition: { x: number; y: number; z: number };
}

export interface UndoAction {
  type: UndoActionType;
  timestamp: number;
  data: SceneTransitionData | ObjectInteractionData | PlayerMovementData;
  undo: () => void;
}

export class UndoSystem {
  private actionStack: UndoAction[] = [];
  private maxStackSize: number = Infinity; // Unlimited undo

  /**
   * Record a scene transition action
   */
  public recordSceneTransition(
    fromScene: string,
    toScene: string,
    undoCallback: () => void,
    playerPosition?: { x: number; y: number; z: number }
  ): void {
    const action: UndoAction = {
      type: UndoActionType.SCENE_TRANSITION,
      timestamp: Date.now(),
      data: {
        fromScene,
        toScene,
        playerPosition,
      } as SceneTransitionData,
      undo: undoCallback,
    };

    this.actionStack.push(action);
  }

  /**
   * Record an object interaction action (picking up items)
   */
  public recordObjectInteraction(
    objectId: string,
    objectData: InteractableObjectData,
    inventoryStateBefore: InventoryItem[],
    objectPosition: { x: number; y: number; z: number },
    undoCallback: () => void
  ): void {
    const action: UndoAction = {
      type: UndoActionType.OBJECT_INTERACTION,
      timestamp: Date.now(),
      data: {
        objectId,
        objectData,
        inventoryStateBefore,
        objectPosition,
      } as ObjectInteractionData,
      undo: undoCallback,
    };

    this.actionStack.push(action);
  }

  /**
   * Record a player movement action
   */
  public recordPlayerMovement(
    fromPosition: { x: number; y: number; z: number },
    toPosition: { x: number; y: number; z: number },
    undoCallback: () => void
  ): void {
    const action: UndoAction = {
      type: UndoActionType.PLAYER_MOVEMENT,
      timestamp: Date.now(),
      data: {
        fromPosition,
        toPosition,
      } as PlayerMovementData,
      undo: undoCallback,
    };

    this.actionStack.push(action);
  }

  /**
   * Undo the last action
   */
  public undo(): boolean {
    if (this.actionStack.length === 0) {
      console.log('No actions to undo');
      return false;
    }

    const action = this.actionStack.pop();
    if (action) {
      console.log(`Undoing action: ${action.type}`);
      action.undo();
      return true;
    }

    return false;
  }

  /**
   * Check if undo is available
   */
  public canUndo(): boolean {
    return this.actionStack.length > 0;
  }

  /**
   * Get the number of actions in the stack
   */
  public getActionCount(): number {
    return this.actionStack.length;
  }

  /**
   * Get the last action type (without removing it)
   */
  public getLastActionType(): UndoActionType | null {
    if (this.actionStack.length === 0) {
      return null;
    }
    return this.actionStack[this.actionStack.length - 1].type;
  }

  /**
   * Clear all undo history
   */
  public clear(): void {
    this.actionStack = [];
  }

  /**
   * Get all actions in the stack (for debugging)
   */
  public getActionStack(): UndoAction[] {
    return [...this.actionStack];
  }
}

