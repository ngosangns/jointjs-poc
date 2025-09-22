import { dia } from '@joint/core';
import type { ToolbarMode, ToolbarModeChangeEvent } from '../interfaces/IToolbarManager';
import { IToolbarManager } from '..';

export class Toolbar implements IToolbarManager {
  private paper: dia.Paper | null = null;
  private currentMode: ToolbarMode = 'select';
  private previousMode: ToolbarMode = 'select';
  private isTemporaryPanMode: boolean = false;
  private modeChangeListeners: Array<(event: ToolbarModeChangeEvent) => void> = [];

  // Keyboard state tracking
  private isCtrlPressed: boolean = false;

  /**
   * Initialize toolbar manager with paper instance
   */
  public initialize(paper: dia.Paper): void {
    this.paper = paper;
    this.setupKeyboardEvents();
  }

  /**
   * Get current toolbar mode
   */
  public getCurrentMode(): ToolbarMode {
    return this.currentMode;
  }

  /**
   * Set toolbar mode
   */
  public setMode(mode: ToolbarMode): void {
    if (this.currentMode === mode) return;

    const previousMode = this.currentMode;
    this.currentMode = mode;
    this.isTemporaryPanMode = false;

    this.emitModeChangeEvent({ mode, previousMode });
  }

  /**
   * Toggle between select and pan modes
   */
  public toggleMode(): void {
    const newMode: ToolbarMode = this.currentMode === 'select' ? 'pan' : 'select';
    this.setMode(newMode);
  }

  /**
   * Check if pan mode is active
   */
  public isPanMode(): boolean {
    return this.currentMode === 'pan' || this.isTemporaryPanMode;
  }

  /**
   * Check if select mode is active
   */
  public isSelectMode(): boolean {
    return this.currentMode === 'select' && !this.isTemporaryPanMode;
  }

  /**
   * Temporarily activate pan mode (e.g., for Ctrl+drag)
   */
  public activatePanModeTemporarily(): void {
    if (this.isTemporaryPanMode) return;

    this.previousMode = this.currentMode;
    this.isTemporaryPanMode = true;
    this.emitModeChangeEvent({ mode: 'pan', previousMode: this.previousMode });
  }

  /**
   * Restore previous mode after temporary pan activation
   */
  public restorePreviousMode(): void {
    if (!this.isTemporaryPanMode) return;

    this.isTemporaryPanMode = false;
    this.emitModeChangeEvent({ mode: this.previousMode, previousMode: 'pan' });
  }

  /**
   * Add event listener for mode changes
   */
  public addModeChangeListener(callback: (event: ToolbarModeChangeEvent) => void): void {
    this.modeChangeListeners.push(callback);
  }

  /**
   * Remove event listener for mode changes
   */
  public removeModeChangeListener(callback: (event: ToolbarModeChangeEvent) => void): void {
    const index = this.modeChangeListeners.indexOf(callback);
    if (index > -1) {
      this.modeChangeListeners.splice(index, 1);
    }
  }

  /**
   * Setup keyboard event handling
   */
  public setupKeyboardEvents(): void {
    if (!this.paper) return;

    // Track Ctrl key state
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Control' || event.ctrlKey) {
        this.isCtrlPressed = true;
        // Activate temporary pan mode when Ctrl is pressed in select mode
        if (this.currentMode === 'select') {
          this.activatePanModeTemporarily();
        }
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === 'Control' || !event.ctrlKey) {
        this.isCtrlPressed = false;
        // Restore previous mode when Ctrl is released
        if (this.isTemporaryPanMode) {
          this.restorePreviousMode();
        }
      }
    };

    // Add event listeners to the paper's container
    const container = this.paper.el;
    if (container) {
      container.addEventListener('keydown', handleKeyDown);
      container.addEventListener('keyup', handleKeyUp);
    }

    // Store references for cleanup
    this.handleKeyDown = handleKeyDown;
    this.handleKeyUp = handleKeyUp;
  }

  /**
   * Setup mouse event handling (placeholder for interface compatibility)
   */
  public setupMouseEvents(): void {
    // This method is kept for interface compatibility but does nothing
    // Mouse events are now handled by the Viewport through DiagramEditor
  }

  /**
   * Update paper interaction (placeholder for interface compatibility)
   */
  public updatePaperInteraction(): void {
    // This method is kept for interface compatibility but does nothing
    // Paper interaction is now handled by the Viewport through DiagramEditor
  }

  /**
   * Emit mode change event to all listeners
   */
  private emitModeChangeEvent(event: ToolbarModeChangeEvent): void {
    this.modeChangeListeners.forEach((callback) => {
      try {
        callback(event);
      } catch (error) {
        console.error('Error in toolbar mode change listener:', error);
      }
    });
  }

  /**
   * Destroy toolbar manager and clean up
   */
  public destroy(): void {
    if (this.paper) {
      const container = this.paper.el;
      if (container) {
        container.removeEventListener('keydown', this.handleKeyDown);
        container.removeEventListener('keyup', this.handleKeyUp);
      }
    }

    this.modeChangeListeners = [];
    this.paper = null;
    this.currentMode = 'select';
    this.previousMode = 'select';
    this.isTemporaryPanMode = false;
    this.isCtrlPressed = false;
  }

  // Store references to event handlers for cleanup
  private handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Control' || event.ctrlKey) {
      this.isCtrlPressed = true;
      if (this.currentMode === 'select') {
        this.activatePanModeTemporarily();
      }
    }
  };

  private handleKeyUp = (event: KeyboardEvent) => {
    if (event.key === 'Control' || !event.ctrlKey) {
      this.isCtrlPressed = false;
      if (this.isTemporaryPanMode) {
        this.restorePreviousMode();
      }
    }
  };
}
