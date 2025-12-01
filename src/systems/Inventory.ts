export interface InventoryItem {
    id: string;
    name: string;
    description: string;
    color: number;
  }
  
  export class Inventory {
    private items: Map<string, InventoryItem> = new Map();
    private onChangeCallbacks: Array<() => void> = [];
  
    /**
     * Add an item to the inventory
     */
    public addItem(item: InventoryItem): boolean {
      if (this.items.has(item.id)) {
        console.warn(`Item ${item.id} already in inventory`);
        return false;
      }
      
      this.items.set(item.id, item);
      this.notifyChange();
      return true;
    }
  
    /**
     * Remove an item from the inventory
     */
    public removeItem(itemId: string): boolean {
      const removed = this.items.delete(itemId);
      if (removed) {
        this.notifyChange();
      }
      return removed;
    }
  
    /**
     * Check if inventory contains an item
     */
    public hasItem(itemId: string): boolean {
      return this.items.has(itemId);
    }
  
    /**
     * Get an item from inventory
     */
    public getItem(itemId: string): InventoryItem | undefined {
      return this.items.get(itemId);
    }
  
    /**
     * Get all items in inventory
     */
    public getAllItems(): InventoryItem[] {
      return Array.from(this.items.values());
    }
  
    /**
     * Get number of items in inventory
     */
    public getItemCount(): number {
      return this.items.size;
    }
  
    /**
     * Clear all items from inventory
     */
    public clear(): void {
      this.items.clear();
      this.notifyChange();
    }
  
    /**
     * Register a callback for when inventory changes
     */
    public onChange(callback: () => void): void {
      this.onChangeCallbacks.push(callback);
    }
  
    /**
     * Notify all callbacks that inventory has changed
     */
    private notifyChange(): void {
      this.onChangeCallbacks.forEach(callback => callback());
    }
  }