import { SaveSystem, SaveData } from '../systems/SaveSystem.js';

export class SaveLoadUI {
  private container: HTMLDivElement;
  private saveSystem: SaveSystem;
  private isOpen: boolean = false;
  private toggleButton: HTMLButtonElement;
  private onSaveCallback?: () => SaveData;
  private onLoadCallback?: (data: SaveData) => void;

  constructor(saveSystem: SaveSystem) {
    this.saveSystem = saveSystem;
    
    // Create toggle button
    this.toggleButton = document.createElement('button');
    this.toggleButton.id = 'save-load-toggle';
    this.toggleButton.textContent = '💾 Save/Load';
    this.toggleButton.style.position = 'absolute';
    this.toggleButton.style.top = '20px';
    this.toggleButton.style.right = '200px'; // Left of inventory button
    this.toggleButton.style.padding = '10px 20px';
    this.toggleButton.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    this.toggleButton.style.color = 'white';
    this.toggleButton.style.border = '2px solid #4CAF50';
    this.toggleButton.style.borderRadius = '8px';
    this.toggleButton.style.fontFamily = 'Arial, sans-serif';
    this.toggleButton.style.fontSize = '16px';
    this.toggleButton.style.cursor = 'pointer';
    this.toggleButton.style.zIndex = '1001';
    this.toggleButton.onclick = () => this.toggle();
    document.body.appendChild(this.toggleButton);

    // Create main container
    this.container = document.createElement('div');
    this.container.id = 'save-load-ui';
    this.container.style.position = 'absolute';
    this.container.style.top = '50%';
    this.container.style.left = '50%';
    this.container.style.transform = 'translate(-50%, -50%)';
    this.container.style.width = '500px';
    this.container.style.maxHeight = '600px';
    this.container.style.backgroundColor = 'rgba(0, 0, 0, 0.95)';
    this.container.style.border = '3px solid #4CAF50';
    this.container.style.borderRadius = '12px';
    this.container.style.padding = '20px';
    this.container.style.fontFamily = 'Arial, sans-serif';
    this.container.style.color = 'white';
    this.container.style.display = 'none';
    this.container.style.zIndex = '2000';
    this.container.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.8)';
    this.container.style.overflowY = 'auto';

    document.body.appendChild(this.container);
  }

  /**
   * Set callback to get current game state for saving
   */
  public onSave(callback: () => SaveData): void {
    this.onSaveCallback = callback;
  }

  /**
   * Set callback to load game state
   */
  public onLoad(callback: (data: SaveData) => void): void {
    this.onLoadCallback = callback;
  }

  /**
   * Toggle UI visibility
   */
  public toggle(): void {
    if (this.isOpen) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * Show the UI
   */
  public show(): void {
    this.isOpen = true;
    this.container.style.display = 'block';
    this.render();
  }

  /**
   * Hide the UI
   */
  public hide(): void {
    this.isOpen = false;
    this.container.style.display = 'none';
  }

  /**
   * Render the save/load menu
   */
  private render(): void {
    this.container.innerHTML = '';

    // Title
    const title = document.createElement('h2');
    title.textContent = 'Save / Load Game';
    title.style.margin = '0 0 20px 0';
    title.style.fontSize = '28px';
    title.style.borderBottom = '2px solid #4CAF50';
    title.style.paddingBottom = '10px';
    title.style.textAlign = 'center';
    this.container.appendChild(title);

    // Auto-save section
    this.renderAutoSaveSection();

    // Manual save slots section
    this.renderSaveSlotsSection();

    // Close button
    const closeButton = this.createButton('Close', () => this.hide());
    closeButton.style.marginTop = '20px';
    closeButton.style.width = '100%';
    this.container.appendChild(closeButton);
  }

  /**
   * Render auto-save section
   */
  private renderAutoSaveSection(): void {
    const section = document.createElement('div');
    section.style.marginBottom = '30px';
    section.style.padding = '15px';
    section.style.backgroundColor = 'rgba(76, 175, 80, 0.1)';
    section.style.borderRadius = '8px';
    section.style.border = '1px solid rgba(76, 175, 80, 0.3)';

    const sectionTitle = document.createElement('h3');
    sectionTitle.textContent = '🔄 Auto-Save';
    sectionTitle.style.margin = '0 0 15px 0';
    sectionTitle.style.fontSize = '20px';
    sectionTitle.style.color = '#4CAF50';
    section.appendChild(sectionTitle);

    const autoSave = this.saveSystem.loadAutoSave();
    
    if (autoSave) {
      const info = document.createElement('div');
      info.style.marginBottom = '10px';
      info.style.fontSize = '14px';
      info.style.color = '#ccc';
      info.innerHTML = `
        <div>Scene: ${autoSave.playerState.currentScene}</div>
        <div>Items: ${autoSave.inventory.length}</div>
        <div>Saved: ${this.saveSystem.formatTimestamp(autoSave.timestamp)}</div>
      `;
      section.appendChild(info);

      const loadButton = this.createButton('Load Auto-Save', () => {
        if (this.onLoadCallback && autoSave) {
          this.onLoadCallback(autoSave);
          this.hide();
        }
      });
      section.appendChild(loadButton);
    } else {
      const noSave = document.createElement('p');
      noSave.textContent = 'No auto-save available';
      noSave.style.color = '#888';
      noSave.style.fontStyle = 'italic';
      section.appendChild(noSave);
    }

    this.container.appendChild(section);
  }

  /**
   * Render manual save slots section
   */
  private renderSaveSlotsSection(): void {
    const section = document.createElement('div');

    const sectionTitle = document.createElement('h3');
    sectionTitle.textContent = '💾 Save Slots';
    sectionTitle.style.margin = '0 0 15px 0';
    sectionTitle.style.fontSize = '20px';
    section.appendChild(sectionTitle);

    const slots = this.saveSystem.getAllSaveSlots();
    
    slots.forEach((saveData, index) => {
      const slotNumber = index + 1;
      const slotDiv = this.createSlotElement(slotNumber, saveData);
      section.appendChild(slotDiv);
    });

    this.container.appendChild(section);
  }

  /**
   * Create a save slot element
   */
  private createSlotElement(slotNumber: number, saveData: SaveData | null): HTMLDivElement {
    const slotDiv = document.createElement('div');
    slotDiv.style.padding = '15px';
    slotDiv.style.marginBottom = '10px';
    slotDiv.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
    slotDiv.style.borderRadius = '8px';
    slotDiv.style.border = '1px solid rgba(255, 255, 255, 0.1)';

    const slotTitle = document.createElement('div');
    slotTitle.textContent = `Slot ${slotNumber}`;
    slotTitle.style.fontSize = '18px';
    slotTitle.style.fontWeight = 'bold';
    slotTitle.style.marginBottom = '10px';
    slotDiv.appendChild(slotTitle);

    if (saveData) {
      // Show save info
      const info = document.createElement('div');
      info.style.fontSize = '14px';
      info.style.color = '#ccc';
      info.style.marginBottom = '10px';
      info.innerHTML = `
        <div>Scene: ${saveData.playerState.currentScene}</div>
        <div>Items: ${saveData.inventory.length}</div>
        <div>Saved: ${this.saveSystem.formatTimestamp(saveData.timestamp)}</div>
      `;
      slotDiv.appendChild(info);

      // Buttons
      const buttonContainer = document.createElement('div');
      buttonContainer.style.display = 'flex';
      buttonContainer.style.gap = '10px';

      const loadButton = this.createButton('Load', () => {
        if (this.onLoadCallback && saveData) {
          this.onLoadCallback(saveData);
          this.hide();
        }
      });
      loadButton.style.flex = '1';
      buttonContainer.appendChild(loadButton);

      const overwriteButton = this.createButton('Overwrite', () => {
        if (this.onSaveCallback) {
          const data = this.onSaveCallback();
          this.saveSystem.saveToSlot(slotNumber, data);
          this.render(); // Refresh display
        }
      });
      overwriteButton.style.flex = '1';
      overwriteButton.style.backgroundColor = '#ff9800';
      buttonContainer.appendChild(overwriteButton);

      const deleteButton = this.createButton('Delete', () => {
        if (confirm(`Delete save slot ${slotNumber}?`)) {
          this.saveSystem.deleteSlot(slotNumber);
          this.render(); // Refresh display
        }
      });
      deleteButton.style.flex = '1';
      deleteButton.style.backgroundColor = '#f44336';
      buttonContainer.appendChild(deleteButton);

      slotDiv.appendChild(buttonContainer);
    } else {
      // Empty slot
      const emptyText = document.createElement('p');
      emptyText.textContent = 'Empty slot';
      emptyText.style.color = '#888';
      emptyText.style.fontStyle = 'italic';
      emptyText.style.marginBottom = '10px';
      slotDiv.appendChild(emptyText);

      const saveButton = this.createButton('Save Here', () => {
        if (this.onSaveCallback) {
          const data = this.onSaveCallback();
          this.saveSystem.saveToSlot(slotNumber, data);
          this.render(); // Refresh display
        }
      });
      slotDiv.appendChild(saveButton);
    }

    return slotDiv;
  }

  /**
   * Create a styled button
   */
  private createButton(text: string, onClick: () => void): HTMLButtonElement {
    const button = document.createElement('button');
    button.textContent = text;
    button.style.padding = '8px 16px';
    button.style.fontSize = '14px';
    button.style.backgroundColor = '#4CAF50';
    button.style.color = 'white';
    button.style.border = 'none';
    button.style.borderRadius = '6px';
    button.style.cursor = 'pointer';
    button.style.fontWeight = 'bold';
    button.style.transition = 'all 0.2s';

    button.onmouseenter = () => {
      button.style.transform = 'scale(1.05)';
      button.style.boxShadow = '0 2px 8px rgba(76, 175, 80, 0.4)';
    };

    button.onmouseleave = () => {
      button.style.transform = 'scale(1)';
      button.style.boxShadow = 'none';
    };

    button.onclick = onClick;

    return button;
  }

  /**
   * Clean up
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