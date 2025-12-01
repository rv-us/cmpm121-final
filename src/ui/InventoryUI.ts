import { Inventory, InventoryItem } from '../systems/Inventory.js';

export class InventoryUI {
  private container: HTMLDivElement;
  private itemsContainer: HTMLDivElement;
  private inventory: Inventory;
  private isOpen: boolean = false;
  private toggleButton: HTMLButtonElement;

  constructor(inventory: Inventory) {
    this.inventory = inventory;
    
    // Create toggle button
    this.toggleButton = document.createElement('button');
    this.toggleButton.id = 'inventory-toggle';
    this.toggleButton.textContent = '🎒 Inventory (0)';
    this.toggleButton.style.position = 'absolute';
    this.toggleButton.style.top = '20px';
    this.toggleButton.style.right = '20px';
    this.toggleButton.style.padding = '10px 20px';
    this.toggleButton.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    this.toggleButton.style.color = 'white';
    this.toggleButton.style.border = '2px solid #ffd700';
    this.toggleButton.style.borderRadius = '8px';
    this.toggleButton.style.fontFamily = 'Arial, sans-serif';
    this.toggleButton.style.fontSize = '16px';
    this.toggleButton.style.cursor = 'pointer';
    this.toggleButton.style.zIndex = '1001';
    this.toggleButton.onclick = () => this.toggle();
    document.body.appendChild(this.toggleButton);

    // Create main container
    this.container = document.createElement('div');
    this.container.id = 'inventory-ui';
    this.container.style.position = 'absolute';
    this.container.style.top = '80px';
    this.container.style.right = '20px';
    this.container.style.width = '300px';
    this.container.style.maxHeight = '500px';
    this.container.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
    this.container.style.border = '3px solid #ffd700';
    this.container.style.borderRadius = '12px';
    this.container.style.padding = '20px';
    this.container.style.fontFamily = 'Arial, sans-serif';
    this.container.style.color = 'white';
    this.container.style.display = 'none';
    this.container.style.zIndex = '1000';
    this.container.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.5)';
    this.container.style.overflowY = 'auto';

    // Create title
    const title = document.createElement('h2');
    title.textContent = 'Inventory';
    title.style.margin = '0 0 15px 0';
    title.style.fontSize = '24px';
    title.style.borderBottom = '2px solid #ffd700';
    title.style.paddingBottom = '10px';
    this.container.appendChild(title);

    // Create items container
    this.itemsContainer = document.createElement('div');
    this.itemsContainer.id = 'inventory-items';
    this.container.appendChild(this.itemsContainer);

    document.body.appendChild(this.container);

    // Listen for inventory changes
    this.inventory.onChange(() => this.refresh());
    
    // Initial render
    this.refresh();
  }

  /**
   * Toggle inventory visibility
   */
  public toggle(): void {
    this.isOpen = !this.isOpen;
    this.container.style.display = this.isOpen ? 'block' : 'none';
  }

  /**
   * Show inventory
   */
  public show(): void {
    this.isOpen = true;
    this.container.style.display = 'block';
  }

  /**
   * Hide inventory
   */
  public hide(): void {
    this.isOpen = false;
    this.container.style.display = 'none';
  }

  /**
   * Refresh the inventory display
   */
  public refresh(): void {
    // Update toggle button
    const count = this.inventory.getItemCount();
    this.toggleButton.textContent = `🎒 Inventory (${count})`;

    // Clear items container
    this.itemsContainer.innerHTML = '';

    const items = this.inventory.getAllItems();

    if (items.length === 0) {
      const emptyMessage = document.createElement('p');
      emptyMessage.textContent = 'Your inventory is empty.';
      emptyMessage.style.color = '#888';
      emptyMessage.style.fontStyle = 'italic';
      emptyMessage.style.textAlign = 'center';
      emptyMessage.style.padding = '20px';
      this.itemsContainer.appendChild(emptyMessage);
      return;
    }

    // Display each item
    items.forEach(item => {
      const itemElement = this.createItemElement(item);
      this.itemsContainer.appendChild(itemElement);
    });
  }

  /**
   * Create a DOM element for an inventory item
   */
  private createItemElement(item: InventoryItem): HTMLDivElement {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'inventory-item';
    itemDiv.style.padding = '12px';
    itemDiv.style.marginBottom = '10px';
    itemDiv.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
    itemDiv.style.borderRadius = '8px';
    itemDiv.style.border = '1px solid rgba(255, 215, 0, 0.3)';
    itemDiv.style.cursor = 'pointer';
    itemDiv.style.transition = 'all 0.2s';

    // Hover effect
    itemDiv.onmouseenter = () => {
      itemDiv.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
      itemDiv.style.borderColor = '#ffd700';
      itemDiv.style.transform = 'translateX(-5px)';
    };
    itemDiv.onmouseleave = () => {
      itemDiv.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
      itemDiv.style.borderColor = 'rgba(255, 215, 0, 0.3)';
      itemDiv.style.transform = 'translateX(0)';
    };

    // Color indicator
    const colorBox = document.createElement('div');
    colorBox.style.width = '20px';
    colorBox.style.height = '20px';
    colorBox.style.backgroundColor = `#${item.color.toString(16).padStart(6, '0')}`;
    colorBox.style.borderRadius = '4px';
    colorBox.style.display = 'inline-block';
    colorBox.style.marginRight = '10px';
    colorBox.style.verticalAlign = 'middle';
    colorBox.style.border = '1px solid rgba(255, 255, 255, 0.3)';

    // Item name
    const nameSpan = document.createElement('span');
    nameSpan.textContent = item.name;
    nameSpan.style.fontWeight = 'bold';
    nameSpan.style.fontSize = '16px';
    nameSpan.style.verticalAlign = 'middle';

    // Item description
    const descDiv = document.createElement('div');
    descDiv.textContent = item.description;
    descDiv.style.fontSize = '13px';
    descDiv.style.color = '#ccc';
    descDiv.style.marginTop = '6px';
    descDiv.style.marginLeft = '30px';

    itemDiv.appendChild(colorBox);
    itemDiv.appendChild(nameSpan);
    itemDiv.appendChild(descDiv);

    return itemDiv;
  }

  /**
   * Clean up the UI
   */
  public dispose(): void {
    if (this.container.parentElement) {
      this.container.parentElement.removeChild(this.container);
    }
    if (this.toggleButton.parentElement) {
      this.toggleButton.parentElement.removeChild(this.toggleButton);
    }
  }
}