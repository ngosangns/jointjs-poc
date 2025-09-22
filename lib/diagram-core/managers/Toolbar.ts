import { dia, elementTools, linkTools } from '@joint/core';
import type { ToolbarMode, ToolbarModeChangeEvent } from '../interfaces/IToolbar';
import { IToolbar } from '..';

export class Toolbar implements IToolbar {
  private paper: dia.Paper | null = null;
  private currentMode: ToolbarMode = 'select';
  private previousMode: ToolbarMode = 'select';
  private isTemporaryPanMode: boolean = false;
  private modeChangeListeners: Array<(event: ToolbarModeChangeEvent) => void> = [];

  // Keyboard state tracking
  private isCtrlPressed: boolean = false;

  // Tools management
  private elementToolsRegistry: Map<string, dia.ToolView[]> = new Map();
  private linkToolsRegistry: Map<string, dia.ToolView[]> = new Map();

  /**
   * Initialize toolbar manager with paper instance
   */
  public initialize(paper: dia.Paper): void {
    this.paper = paper;
    this.setupKeyboardEvents();
    this.registerDefaultTools();
    this.setupToolEvents();
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
   * Register default element and link tools with enhanced functionality
   */
  private registerDefaultTools(): void {
    // Default element tools (no delete/duplicate buttons; keep boundary only)
    const defaultElementTools = [
      new elementTools.Boundary({
        padding: 8,
        useModelGeometry: true,
        markup: [
          {
            tagName: 'rect',
            selector: 'body',
            attributes: {
              fill: 'none',
              stroke: '#3498db',
              'stroke-width': 2,
              'stroke-dasharray': '4,4',
              'pointer-events': 'none',
            },
          },
        ],
      }),
    ];
    this.elementToolsRegistry.set('default', defaultElementTools);

    // Default link tools (no remove tool)
    const defaultLinkTools = [
      new linkTools.Vertices({
        redundancyRemoval: false,
        snapRadius: 10,
        vertexAdding: true,
      }),
      new linkTools.Segments(),
      new linkTools.SourceArrowhead(),
      new linkTools.TargetArrowhead(),
      new linkTools.Boundary({
        padding: 10,
      }),
    ];
    this.linkToolsRegistry.set('default', defaultLinkTools);
  }

  /**
   * Setup tool-related events
   */
  private setupToolEvents(): void {
    if (!this.paper) return;

    // Show tools on element hover
    this.paper.on('element:mouseenter', (elementView: dia.ElementView) => {
      this.showElementTools(elementView, 'default');
    });

    // Keep tools visible on element hover; pointerdown does not initiate move
    this.paper.on('element:pointerdown', (elementView: dia.ElementView) => {
      this.showElementTools(elementView, 'default');
    });

    // Hide tools on element leave (with delay to allow tool interaction)
    this.paper.on('element:mouseleave', (elementView: dia.ElementView) => {
      // Add a small delay to allow users to interact with tools
      setTimeout(() => {
        this.hideElementTools(elementView);
      }, 150);
    });

    // Show tools on link hover
    this.paper.on('link:mouseenter', (linkView: dia.LinkView) => {
      this.showLinkTools(linkView, 'default');
    });

    // Hide tools on link leave
    this.paper.on('link:mouseleave', (linkView: dia.LinkView) => {
      setTimeout(() => {
        this.hideLinkTools(linkView);
      }, 150);
    });

    // Hide all tools when clicking on blank area
    this.paper.on('blank:pointerdown', () => {
      this.hideAllTools();
    });
  }

  // Tools management methods

  /**
   * Register custom element tools
   */
  public registerElementTools(name: string, tools: dia.ToolView[]): void {
    this.elementToolsRegistry.set(name, tools);
  }

  /**
   * Register custom link tools
   */
  public registerLinkTools(name: string, tools: dia.ToolView[]): void {
    this.linkToolsRegistry.set(name, tools);
  }

  /**
   * Show element tools
   */
  public showElementTools(elementView: dia.ElementView, toolsName: string = 'default'): void {
    const tools = this.elementToolsRegistry.get(toolsName);
    if (tools) {
      const toolsView = new dia.ToolsView({ tools });
      elementView.addTools(toolsView);
    }
  }

  /**
   * Hide element tools
   */
  public hideElementTools(elementView: dia.ElementView): void {
    elementView.removeTools();
  }

  /**
   * Show link tools
   */
  public showLinkTools(linkView: dia.LinkView, toolsName: string = 'default'): void {
    const tools = this.linkToolsRegistry.get(toolsName);
    if (tools) {
      const toolsView = new dia.ToolsView({ tools });
      linkView.addTools(toolsView);
    }
  }

  /**
   * Hide link tools
   */
  public hideLinkTools(linkView: dia.LinkView): void {
    linkView.removeTools();
  }

  /**
   * Show all tools on paper
   */
  public showAllTools(): void {
    if (this.paper) {
      this.paper.showTools();
    }
  }

  /**
   * Hide all tools on paper
   */
  public hideAllTools(): void {
    if (this.paper) {
      this.paper.hideTools();
    }
  }

  /**
   * Remove all tools from paper
   */
  public removeAllTools(): void {
    if (this.paper) {
      this.paper.removeTools();
    }
  }

  /**
   * Create custom element tool
   */
  public createElementTool(
    type: 'Remove' | 'Boundary' | 'Button',
    options: any = {}
  ): dia.ToolView {
    switch (type) {
      case 'Remove':
        return new elementTools.Remove(options);
      case 'Boundary':
        return new elementTools.Boundary(options);
      case 'Button':
        return new elementTools.Button(options);
      default:
        throw new Error(`Unknown element tool type: ${type}`);
    }
  }

  /**
   * Create custom link tool
   */
  public createLinkTool(
    type: 'Vertices' | 'Segments' | 'SourceArrowhead' | 'TargetArrowhead' | 'Remove' | 'Boundary',
    options: any = {}
  ): dia.ToolView {
    switch (type) {
      case 'Vertices':
        return new linkTools.Vertices(options);
      case 'Segments':
        return new linkTools.Segments(options);
      case 'SourceArrowhead':
        return new linkTools.SourceArrowhead(options);
      case 'TargetArrowhead':
        return new linkTools.TargetArrowhead(options);
      case 'Remove':
        return new linkTools.Remove(options);
      case 'Boundary':
        return new linkTools.Boundary(options);
      default:
        throw new Error(`Unknown link tool type: ${type}`);
    }
  }

  /**
   * Get registered element tools
   */
  public getElementTools(name: string): dia.ToolView[] | undefined {
    return this.elementToolsRegistry.get(name);
  }

  /**
   * Get registered link tools
   */
  public getLinkTools(name: string): dia.ToolView[] | undefined {
    return this.linkToolsRegistry.get(name);
  }

  /**
   * Get all registered element tool names
   */
  public getElementToolNames(): string[] {
    return Array.from(this.elementToolsRegistry.keys());
  }

  /**
   * Get all registered link tool names
   */
  public getLinkToolNames(): string[] {
    return Array.from(this.linkToolsRegistry.keys());
  }

  /**
   * Unregister element tools
   */
  public unregisterElementTools(name: string): boolean {
    return this.elementToolsRegistry.delete(name);
  }

  /**
   * Unregister link tools
   */
  public unregisterLinkTools(name: string): boolean {
    return this.linkToolsRegistry.delete(name);
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
      
      // Clean up tool events
      this.paper.off('element:mouseenter');
      this.paper.off('element:mouseleave');
      this.paper.off('element:pointerdown');
      this.paper.off('link:mouseenter');
      this.paper.off('link:mouseleave');
      this.paper.off('blank:pointerdown');
      this.removeAllTools();
    }

    this.modeChangeListeners = [];
    this.elementToolsRegistry.clear();
    this.linkToolsRegistry.clear();
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
