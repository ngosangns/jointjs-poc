/**
 * Toolbar manager for handling interaction modes (select/pan)
 */

import { dia } from '@joint/core';
import type { ToolbarMode, ToolbarModeChangeEvent } from '../interfaces/IToolbarManager';
import { IToolbarManager } from '..';

export class ToolbarManager implements IToolbarManager {
  private paper: dia.Paper | null = null;
  private currentMode: ToolbarMode = 'select';
  private previousMode: ToolbarMode = 'select';
  private isTemporaryPanMode: boolean = false;
  private modeChangeListeners: Array<(event: ToolbarModeChangeEvent) => void> = [];

  // Keyboard state tracking
  private isCtrlPressed: boolean = false;
  private isDragging: boolean = false;

  // Mouse state tracking
  private mouseDownPosition: { x: number; y: number } | null = null;
  private panStartPosition: { x: number; y: number } | null = null;

  /**
   * Initialize toolbar manager with paper instance
   */
  public initialize(paper: dia.Paper): void {
    this.paper = paper;
    this.setupKeyboardEvents();
    this.setupMouseEvents();
    this.updatePaperInteraction();
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

    this.updatePaperInteraction();
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
    this.updatePaperInteraction();
  }

  /**
   * Restore previous mode after temporary pan activation
   */
  public restorePreviousMode(): void {
    if (!this.isTemporaryPanMode) return;

    this.isTemporaryPanMode = false;
    this.updatePaperInteraction();
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
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === 'Control' || !event.ctrlKey) {
        this.isCtrlPressed = false;
        // Restore previous mode if we were in temporary pan mode
        if (this.isTemporaryPanMode && !this.isDragging) {
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
  }

  /**
   * Setup mouse event handling
   */
  public setupMouseEvents(): void {
    if (!this.paper) return;

    const handleMouseDown = (evt: any, x: number, y: number) => {
      // Get client coordinates from the event
      const clientX = evt.originalEvent?.clientX || x;
      const clientY = evt.originalEvent?.clientY || y;

      this.mouseDownPosition = { x: clientX, y: clientY };
      this.isDragging = false;

      // Check if we should activate temporary pan mode
      if (this.isCtrlPressed && this.currentMode === 'select') {
        this.activatePanModeTemporarily();
        this.panStartPosition = { x: clientX, y: clientY };
      }
    };

    const handleMouseMove = (evt: any, x: number, y: number) => {
      if (this.mouseDownPosition) {
        // Get client coordinates from the event
        const clientX = evt.originalEvent?.clientX || x;
        const clientY = evt.originalEvent?.clientY || y;

        const distance = Math.sqrt(
          Math.pow(clientX - this.mouseDownPosition.x, 2) +
            Math.pow(clientY - this.mouseDownPosition.y, 2)
        );

        if (distance > 5) {
          // Threshold for drag detection
          this.isDragging = true;
        }
      }
    };

    const handleMouseUp = (evt: any, x: number, y: number) => {
      this.mouseDownPosition = null;
      this.panStartPosition = null;

      // Restore previous mode after a short delay to allow for click events
      if (this.isTemporaryPanMode && !this.isCtrlPressed) {
        setTimeout(() => {
          this.restorePreviousMode();
        }, 100);
      }

      this.isDragging = false;
    };

    // Add event listeners to the paper
    this.paper.on('blank:pointerdown', handleMouseDown);
    this.paper.on('blank:pointermove', handleMouseMove);
    this.paper.on('blank:pointerup', handleMouseUp);
  }

  /**
   * Update paper interaction based on current mode
   */
  public updatePaperInteraction(): void {
    if (!this.paper) return;

    const isPanMode = this.isPanMode();

    // Update paper options based on mode
    if (isPanMode) {
      // Pan mode: disable element selection and movement
      (this.paper.options as any).interactive = {
        linkView: false,
        arrowheadView: false,
        vertexView: false,
        vertexAddView: false,
        useLinkTools: false,
        useElementTools: false,
      };

      // Enable panning
      (this.paper.options as any)['panning'] = {
        enabled: true,
        eventTypes: ['leftMouseDown', 'mouseWheel'],
      };
    } else {
      // Select mode: enable element interaction
      (this.paper.options as any).interactive = {
        linkView: true,
        arrowheadView: true,
        vertexView: true,
        vertexAddView: true,
        useLinkTools: true,
        useElementTools: true,
      };

      // Disable panning (will be handled by JointJS default behavior)
      (this.paper.options as any)['panning'] = {
        enabled: false,
      };
    }
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

      this.paper.off('blank:pointerdown');
      this.paper.off('blank:pointermove');
      this.paper.off('blank:pointerup');
    }

    this.modeChangeListeners = [];
    this.paper = null;
    this.currentMode = 'select';
    this.previousMode = 'select';
    this.isTemporaryPanMode = false;
    this.isCtrlPressed = false;
    this.isDragging = false;
    this.mouseDownPosition = null;
    this.panStartPosition = null;
  }

  // Store references to event handlers for cleanup
  private handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Control' || event.ctrlKey) {
      this.isCtrlPressed = true;
    }
  };

  private handleKeyUp = (event: KeyboardEvent) => {
    if (event.key === 'Control' || !event.ctrlKey) {
      this.isCtrlPressed = false;
      if (this.isTemporaryPanMode && !this.isDragging) {
        this.restorePreviousMode();
      }
    }
  };
}
