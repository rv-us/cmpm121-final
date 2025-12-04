import { InventoryItem } from './Inventory.js';
import { GameProgress } from './GameStateManager.js';

export interface PlayerState {
  position: { x: number; y: number; z: number };
  currentScene: string;
}

export interface SaveData {
  timestamp: number;
  slotName: string;
  inventory: InventoryItem[];
  gameProgress: GameProgress;
  playerState: PlayerState;
  interactableObjectsRemoved: string[]; // IDs of picked-up objects
}

export class SaveSystem {
  private readonly AUTOSAVE_KEY = 'fgame_autosave';
  private readonly SAVE_SLOT_PREFIX = 'fgame_slot_';
  private readonly MAX_SAVE_SLOTS = 3;

  /**
   * Save game data to a specific slot
   */
  public saveToSlot(slotNumber: number, data: SaveData): boolean {
    if (slotNumber < 1 || slotNumber > this.MAX_SAVE_SLOTS) {
      console.error(`Invalid save slot: ${slotNumber}`);
      return false;
    }

    try {
      const key = this.SAVE_SLOT_PREFIX + slotNumber;
      const saveData: SaveData = {
        ...data,
        timestamp: Date.now(),
        slotName: `Save ${slotNumber}`,
      };
      localStorage.setItem(key, JSON.stringify(saveData));
      console.log(`Game saved to slot ${slotNumber}`);
      return true;
    } catch (error) {
      console.error('Failed to save game:', error);
      return false;
    }
  }

  /**
   * Load game data from a specific slot
   */
  public loadFromSlot(slotNumber: number): SaveData | null {
    if (slotNumber < 1 || slotNumber > this.MAX_SAVE_SLOTS) {
      console.error(`Invalid save slot: ${slotNumber}`);
      return null;
    }

    try {
      const key = this.SAVE_SLOT_PREFIX + slotNumber;
      const data = localStorage.getItem(key);
      if (!data) {
        return null;
      }
      return JSON.parse(data) as SaveData;
    } catch (error) {
      console.error('Failed to load game:', error);
      return null;
    }
  }

  /**
   * Auto-save game data
   */
  public autoSave(data: SaveData): boolean {
    try {
      const saveData: SaveData = {
        ...data,
        timestamp: Date.now(),
        slotName: 'Auto-save',
      };
      localStorage.setItem(this.AUTOSAVE_KEY, JSON.stringify(saveData));
      console.log('Auto-saved game');
      return true;
    } catch (error) {
      console.error('Failed to auto-save game:', error);
      return false;
    }
  }

  /**
   * Load auto-save data
   */
  public loadAutoSave(): SaveData | null {
    try {
      const data = localStorage.getItem(this.AUTOSAVE_KEY);
      if (!data) {
        return null;
      }
      return JSON.parse(data) as SaveData;
    } catch (error) {
      console.error('Failed to load auto-save:', error);
      return null;
    }
  }

  /**
   * Check if a save slot has data
   */
  public hasSlotData(slotNumber: number): boolean {
    if (slotNumber < 1 || slotNumber > this.MAX_SAVE_SLOTS) {
      return false;
    }
    const key = this.SAVE_SLOT_PREFIX + slotNumber;
    return localStorage.getItem(key) !== null;
  }

  /**
   * Check if auto-save exists
   */
  public hasAutoSave(): boolean {
    return localStorage.getItem(this.AUTOSAVE_KEY) !== null;
  }

  /**
   * Get all save slots info
   */
  public getAllSaveSlots(): Array<SaveData | null> {
    const slots: Array<SaveData | null> = [];
    for (let i = 1; i <= this.MAX_SAVE_SLOTS; i++) {
      slots.push(this.loadFromSlot(i));
    }
    return slots;
  }

  /**
   * Delete a save slot
   */
  public deleteSlot(slotNumber: number): boolean {
    if (slotNumber < 1 || slotNumber > this.MAX_SAVE_SLOTS) {
      console.error(`Invalid save slot: ${slotNumber}`);
      return false;
    }

    try {
      const key = this.SAVE_SLOT_PREFIX + slotNumber;
      localStorage.removeItem(key);
      console.log(`Deleted save slot ${slotNumber}`);
      return true;
    } catch (error) {
      console.error('Failed to delete save slot:', error);
      return false;
    }
  }

  /**
   * Delete auto-save
   */
  public deleteAutoSave(): boolean {
    try {
      localStorage.removeItem(this.AUTOSAVE_KEY);
      console.log('Deleted auto-save');
      return true;
    } catch (error) {
      console.error('Failed to delete auto-save:', error);
      return false;
    }
  }

  /**
   * Clear all save data
   */
  public clearAllSaves(): boolean {
    try {
      for (let i = 1; i <= this.MAX_SAVE_SLOTS; i++) {
        this.deleteSlot(i);
      }
      this.deleteAutoSave();
      console.log('Cleared all saves');
      return true;
    } catch (error) {
      console.error('Failed to clear saves:', error);
      return false;
    }
  }

  /**
   * Format timestamp for display
   */
  public formatTimestamp(timestamp: number): string {
    const date = new Date(timestamp);
    return date.toLocaleString();
  }
}