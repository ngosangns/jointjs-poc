import { dia } from '@joint/core';
import type { DiagramConfig, DiagramElement, DiagramEventType } from '../types';
import { LinkFactory, ShapeFactory } from './factories';
import type {
  ICursorManager,
  IEventManager,
  IGraphManager,
  ILinkFactory,
  IShapeFactory,
  IToolbar,
  IViewport,
} from './interfaces';
import { CursorManager, EventManager, GraphManager, Toolbar, Viewport } from './managers';

export class DiagramEditor {
  private graph: dia.Graph;
  private paper: dia.Paper | null = null;
  private config: DiagramConfig;

  // Managers
  private eventManager: IEventManager;
  private viewport: IViewport;
  private graphManager: IGraphManager;
  private toolbar: IToolbar;
  private cursorManager: ICursorManager;

  // Factories
  private shapeFactory: IShapeFactory;
  private linkFactory: ILinkFactory;

  constructor(
    config: DiagramConfig,
    eventManager?: IEventManager,
    viewport?: IViewport,
    graphManager?: IGraphManager,
    toolbar?: IToolbar,
    cursorManager?: ICursorManager,
    shapeFactory?: IShapeFactory,
    linkFactory?: ILinkFactory
  ) {
    this.config = { ...config };
    this.graph = new dia.Graph();

    this.eventManager = eventManager || new EventManager();
    this.viewport = viewport || new Viewport();
    this.graphManager = graphManager || new GraphManager();
    this.toolbar = toolbar || new Toolbar();
    this.cursorManager = cursorManager || new CursorManager();

    // Initialize factories
    this.shapeFactory = shapeFactory || new ShapeFactory();
    this.linkFactory = linkFactory || new LinkFactory();

    // Setup toolbar mode change listener
    this.setupToolbarModeListener();
  }

  /**
   * Initialize the diagram paper with a DOM element
   */
  public initializePaper(element: HTMLElement): void {
    if (this.paper) this.viewport.destroy(this.paper);

    this.paper = this.viewport.initialize(element, this.graph, this.config);
    this.viewport.setupPaperEvents(this.paper, this.eventManager);

    this.eventManager.initialize(this.graph, this.paper);

    try {
      this.graphManager.setupGraphEvents(this.graph, this.eventManager);
    } catch (error) {
      console.error('GraphManager setupGraphEvents error:', error);
    }

    this.toolbar.initialize(this.paper);
    this.cursorManager.initialize(this.paper);

    // Set cursor manager on viewport for coordination
    this.viewport.setCursorManager(this.cursorManager);

    // Apply initial mode settings (default is select mode)
    this.handleToolbarModeChange(this.toolbar.getCurrentMode());
  }

  /**
   * Add an element to the diagram
   */
  public addElement(elementConfig: Partial<DiagramElement>): string {
    return this.graphManager.addElement(this.graph, elementConfig, this.shapeFactory);
  }

  // Center-centered zoom methods
  public zoomIn(step: number = 1.2): void {
    const paper = this.paper;
    if (!paper) return;
    this.viewport.zoomIn(paper, step);
  }

  public zoomOut(step: number = 1 / 1.2): void {
    const paper = this.paper;
    if (!paper) return;
    this.viewport.zoomOut(paper, step);
  }

  public getZoom(): number {
    const paper = this.paper;
    if (!paper) return 1;
    const { sx } = this.viewport.getScale(paper);
    return sx;
  }

  /**
   * Resize the diagram
   */
  public resize(width: number, height: number): void {
    this.config.width = width;
    this.config.height = height;

    if (this.paper) {
      this.viewport.resize(this.paper, width, height);
    }
  }

  /**
   * Add event listener
   */
  public addEventListener(eventType: DiagramEventType, callback: Function): void {
    this.eventManager.addEventListener(eventType, callback);
  }

  /**
   * Destroy the diagram engine
   */
  public destroy(): void {
    if (this.paper) {
      this.viewport.destroy(this.paper);
      this.paper = null;
    }
    this.eventManager.destroy();
    this.toolbar.destroy();
    this.cursorManager.destroy();
    this.graph.clear();
  }

  /**
   * Get the underlying JointJS paper
   */
  public getPaper(): dia.Paper | null {
    return this.paper;
  }

  /**
   * Get the center position of the paper in local coordinates
   */
  public getPaperCenterLocal(): { x: number; y: number } {
    if (!this.paper) {
      throw new Error('Paper not initialized.');
    }
    return this.viewport.getPaperCenterLocal(this.paper);
  }

  /**
   * Get the center position of the paper in client coordinates
   */
  public getPaperCenterClient(): { x: number; y: number } {
    if (!this.paper) {
      throw new Error('Paper not initialized.');
    }
    return this.viewport.getPaperCenterClient(this.paper);
  }

  /** Duplicate current selection with a configurable offset */
  public duplicateSelectedElements(
    offset: { dx: number; dy: number } = { dx: 20, dy: 20 }
  ): string[] {
    if (!this.paper) return [];
    // For now, return empty array since selection tracking was removed
    // This method is kept for compatibility but doesn't function
    return [];
  }

  /**
   * Get the toolbar manager instance
   */
  public getToolbarManager(): IToolbar {
    return this.toolbar;
  }

  /**
   * Get the cursor manager instance
   */
  public getCursorManager(): ICursorManager {
    return this.cursorManager;
  }

  /**
   * Set toolbar mode
   */
  public setToolbarMode(mode: 'select' | 'pan'): void {
    this.toolbar.setMode(mode);
  }

  /**
   * Get current toolbar mode
   */
  public getToolbarMode(): 'select' | 'pan' {
    return this.toolbar.getCurrentMode();
  }

  /**
   * Toggle toolbar mode
   */
  public toggleToolbarMode(): void {
    this.toolbar.toggleMode();
  }

  /**
   * Check if pan mode is active
   */
  public isPanMode(): boolean {
    return this.toolbar.isPanMode();
  }

  /**
   * Check if current mode is select mode
   */
  public isSelectMode(): boolean {
    return this.toolbar.isSelectMode();
  }

  /**
   * Set cursor for the paper
   */
  public setCursor(cursor: string): void {
    this.cursorManager.setCursor(cursor);
  }

  /**
   * Get current cursor
   */
  public getCursor(): string {
    return this.cursorManager.getCursor();
  }

  /**
   * Reset cursor to default
   */
  public resetCursor(): void {
    this.cursorManager.resetCursor();
  }

  /**
   * Set cursor for a specific mode
   */
  public setCursorForMode(mode: string, cursor: string): void {
    this.cursorManager.setCursorForMode(mode, cursor);
  }

  /**
   * Set temporary cursor (e.g., during hover)
   */
  public setTemporaryCursor(cursor: string): void {
    this.cursorManager.setTemporaryCursor(cursor);
  }

  /**
   * Restore cursor for current mode
   */
  public restoreCursor(): void {
    this.cursorManager.restoreCursor(this.getToolbarMode());
  }

  /**
   * Setup toolbar mode change listener to coordinate with viewport
   */
  private setupToolbarModeListener(): void {
    this.toolbar.addModeChangeListener((event) => {
      this.handleToolbarModeChange(event.mode);
    });
  }

  /**
   * Handle toolbar mode changes and update viewport accordingly
   */
  private handleToolbarModeChange(mode: 'select' | 'pan'): void {
    if (!this.paper) return;

    let interactionMode: { pan: boolean; zoom: boolean; elementMove: boolean };

    if (mode === 'select') {
      // Select mode: disable pan, zoom, and element movement
      // Focus on element selection and interaction only
      interactionMode = {
        pan: false,
        zoom: false,
        elementMove: false,
      };
    } else if (mode === 'pan') {
      // Pan mode: enable pan, zoom, and element movement
      // Allow full viewport navigation and element manipulation
      interactionMode = {
        pan: true,
        zoom: true,
        elementMove: true,
      };
    } else {
      // Default fallback
      interactionMode = {
        pan: false,
        zoom: false,
        elementMove: false,
      };
    }

    // Update viewport interaction mode
    this.viewport.setInteractionMode(this.paper, interactionMode);

    // Notify cursor manager about mode change and interaction mode
    this.cursorManager.onModeChange(mode);
    this.cursorManager.onInteractionModeChange(interactionMode);
  }
}
