/**
 * Core diagram engine using JointJS - Refactored with modular architecture
 */

import { dia } from '@joint/core';
import type {
  DiagramConfig,
  DiagramData,
  DiagramElement,
  DiagramEventType,
  DiagramLink,
} from '../types';
import { LinkFactory, ShapeFactory } from './factories';
import type {
  IDataManager,
  IEventManager,
  IGraphManager,
  ILinkFactory,
  IPaperManager,
  IShapeFactory,
  IToolsManager,
} from './interfaces';
import type { Shape } from './interfaces/Shape';
import {
  DataManager,
  EventManager,
  GraphManager,
  HistoryManager,
  PaperManager,
  PersistenceManager,
  ToolsManager,
} from './managers';
import { KeyboardManager } from './managers/KeyboardManager';

export class DiagramEngine {
  private graph: dia.Graph;
  private paper: dia.Paper | null = null;
  private config: DiagramConfig;

  // Managers
  private eventManager: IEventManager;
  private dataManager: IDataManager;
  private paperManager: IPaperManager;
  private graphManager: IGraphManager;
  private toolsManager: IToolsManager;
  private persistence: PersistenceManager;
  private history: HistoryManager<string>;
  private keyboardManager: KeyboardManager;

  // Factories
  private shapeFactory: IShapeFactory;
  private linkFactory: ILinkFactory;

  // Performance optimization state
  private performanceMonitor: {
    lastViewportChange: number;
    viewportChangeThrottle: number;
    batchOperations: boolean;
    viewportCulling: boolean;
  } = {
    lastViewportChange: 0,
    viewportChangeThrottle: 16, // ~60fps
    batchOperations: false,
    viewportCulling: false,
  };

  // Selection state
  private selectedElements: Set<string | number> = new Set();

  constructor(
    config: DiagramConfig,
    eventManager?: IEventManager,
    dataManager?: IDataManager,
    paperManager?: IPaperManager,
    graphManager?: IGraphManager,
    toolsManager?: IToolsManager,
    shapeFactory?: IShapeFactory,
    linkFactory?: ILinkFactory,
    options?: { persistence?: PersistenceManager; history?: HistoryManager<string> }
  ) {
    this.config = { ...config };
    this.graph = new dia.Graph();

    // Initialize managers (allow dependency injection for testing)
    this.eventManager = eventManager || new EventManager();
    this.dataManager = dataManager || new DataManager();
    this.paperManager = paperManager || new PaperManager();
    this.graphManager = graphManager || new GraphManager();
    this.toolsManager = toolsManager || new ToolsManager();
    this.persistence = options?.persistence || new PersistenceManager();
    this.history =
      options?.history ||
      new HistoryManager<string>({
        createSnapshot: () => JSON.stringify(this.dataManager.serializeToCustomFormat(this.graph)),
        restoreSnapshot: (snapshot) => {
          this.graph.clear();
          this.dataManager.deserializeCustomFormat(
            JSON.parse(snapshot),
            this.graph,
            this.shapeFactory,
            this.linkFactory
          );
        },
        limit: 100,
      });

    // Initialize factories
    this.shapeFactory = shapeFactory || new ShapeFactory();
    this.linkFactory = linkFactory || new LinkFactory();

    // Initialize keyboard manager
    this.keyboardManager = new KeyboardManager();

    this.initializeEventListeners();
  }

  /**
   * Initialize the diagram paper with a DOM element
   */
  public initializePaper(element: HTMLElement): void {
    if (this.paper) {
      this.paperManager.destroy(this.paper);
    }

    this.paper = this.paperManager.initialize(element, this.graph, this.config);
    this.paperManager.setupPaperEvents(this.paper, this.eventManager);

    // Initialize EventManager with graph and paper for JointJS event integration
    this.eventManager.initialize(this.graph, this.paper);

    // Setup graph event bridging via GraphManager
    try {
      this.graphManager.setupGraphEvents(this.graph, this.eventManager);
    } catch (error) {
      console.error('GraphManager setupGraphEvents error:', error);
    }

    // Initialize ToolsManager with paper for tools management
    this.toolsManager.initialize(this.paper);

    // Initialize KeyboardManager with paper, graph, and event manager
    try {
      this.keyboardManager.initialize(this.paper, this.graph, this.eventManager);
      // Setup keyboard event handlers
      this.setupKeyboardEventHandlers();
    } catch (error) {
      console.error('KeyboardManager initialization error:', error);
    }
  }

  /**
   * Add an element to the diagram
   */
  public addElement(elementConfig: Partial<DiagramElement>): string {
    this.history.push();
    return this.graphManager.addElement(this.graph, elementConfig, this.shapeFactory);
  }

  /**
   * Add a shape at specific coordinates from drag-drop
   */
  public addShapeAtPosition(
    shapeType: string,
    position: { x: number; y: number },
    options: Partial<DiagramElement> = {}
  ): string {
    this.history.push();

    // Get default size from shape factory
    const defaultConfig = this.shapeFactory.getDefaultConfig(shapeType);
    const defaultSize = defaultConfig?.size || { width: 100, height: 60 };

    // Create element configuration
    const elementConfig: Partial<DiagramElement> = {
      type: shapeType,
      position: {
        x: position.x - defaultSize.width / 2, // Center the shape on drop position
        y: position.y - defaultSize.height / 2,
      },
      size: defaultSize,
      ...options,
    };

    // Add element to graph
    const elementId = this.graphManager.addElement(this.graph, elementConfig, this.shapeFactory);

    // Emit shape creation event
    this.eventManager.emitEvent('shape:created', {
      id: elementId,
      type: shapeType,
      position: elementConfig.position,
      size: elementConfig.size,
      source: 'drag-drop',
    });

    return elementId;
  }

  /**
   * Add a link between two elements
   */
  public addLink(linkConfig: Partial<DiagramLink>): string {
    this.history.push();
    return this.graphManager.addLink(this.graph, linkConfig, this.linkFactory);
  }

  /**
   * Remove an element from the diagram
   */
  public removeElement(elementId: string): void {
    this.history.push();
    this.graphManager.removeElement(this.graph, elementId);
  }

  /**
   * Remove a link from the diagram
   */
  public removeLink(linkId: string): void {
    this.history.push();
    this.graphManager.removeLink(this.graph, linkId);
  }

  /**
   * Get all diagram data
   */
  public getDiagramData(): DiagramData {
    return this.dataManager.serializeToCustomFormat(this.graph);
  }

  /**
   * Load diagram data
   */
  public loadDiagramData(data: DiagramData): void {
    this.dataManager.deserialize(data, this.graph, this.shapeFactory, this.linkFactory);
  }

  /**
   * Clear the entire diagram
   */
  public clear(): void {
    this.history.push();
    this.graphManager.clear(this.graph);
  }

  // Persistence
  public async save(documentId: string): Promise<void> {
    const data = this.dataManager.serializeToCustomFormat(this.graph);
    await this.persistence.saveDocument(documentId, data);
    this.eventManager.emitEvent('document:saved', { id: documentId });
  }

  public async load(documentId: string): Promise<void> {
    const data = await this.persistence.loadDocument(documentId);
    if (data) {
      this.graph.clear();
      this.dataManager.deserializeCustomFormat(
        data as DiagramData,
        this.graph,
        this.shapeFactory,
        this.linkFactory
      );
      this.eventManager.emitEvent('document:loaded', { id: documentId });
    }
  }

  // History
  public undo(): void {
    this.history.undo();
  }

  public redo(): void {
    this.history.redo();
  }

  public canUndo(): boolean {
    return this.history.canUndo();
  }

  public canRedo(): boolean {
    return this.history.canRedo();
  }

  // View controls with enhanced bounds checking and smooth transitions
  public zoomIn(step: number = 1.2, smooth: boolean = false): void {
    const paper = this.paper;
    if (!paper) return;
    const { sx } = this.paperManager.getScale(paper);
    const newScale = sx * step;
    const clampedScale = this.clampZoom(newScale);

    if (smooth) {
      this.smoothZoomTo(paper, clampedScale);
    } else {
      this.paperManager.scale(paper, clampedScale);
    }

    this.emitViewportChanged();
  }

  public zoomOut(step: number = 1 / 1.2, smooth: boolean = false): void {
    const paper = this.paper;
    if (!paper) return;
    const { sx } = this.paperManager.getScale(paper);
    const newScale = sx * step;
    const clampedScale = this.clampZoom(newScale);

    if (smooth) {
      this.smoothZoomTo(paper, clampedScale);
    } else {
      this.paperManager.scale(paper, clampedScale);
    }

    this.emitViewportChanged();
  }

  public setZoom(z: number, smooth: boolean = false): void {
    const paper = this.paper;
    if (!paper) return;
    const clampedScale = this.clampZoom(z);

    if (smooth) {
      this.smoothZoomTo(paper, clampedScale);
    } else {
      this.paperManager.scale(paper, clampedScale);
    }

    this.emitViewportChanged();
  }

  public getZoom(): number {
    const paper = this.paper;
    if (!paper) return 1;
    const { sx } = this.paperManager.getScale(paper);
    return sx;
  }

  public zoomToFit(padding: number = 20): void {
    const paper = this.paper;
    if (!paper) return;
    this.paperManager.fitToContent(paper, padding);
    this.emitViewportChanged();
  }

  public zoomToSelection(padding: number = 20): void {
    const paper = this.paper;
    if (!paper) return;

    // Get selected elements
    const selectedElements = this.graph.getElements().filter((element) => {
      const elementView = paper.findViewByModel(element);
      return elementView && (elementView as any).isSelected();
    });

    if (selectedElements.length === 0) {
      this.zoomToFit(padding);
      return;
    }

    // Calculate bounding box of selected elements
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;

    selectedElements.forEach((element) => {
      const bbox = element.getBBox();
      minX = Math.min(minX, bbox.x);
      minY = Math.min(minY, bbox.y);
      maxX = Math.max(maxX, bbox.x + bbox.width);
      maxY = Math.max(maxY, bbox.y + bbox.height);
    });

    // Fit to selection with padding
    const selectionWidth = maxX - minX;
    const selectionHeight = maxY - minY;
    const paperWidth = paper.options.width as number;
    const paperHeight = paper.options.height as number;

    const scaleX = (paperWidth - padding * 2) / selectionWidth;
    const scaleY = (paperHeight - padding * 2) / selectionHeight;
    const scale = Math.min(scaleX, scaleY, 5); // Max zoom of 5x

    const clampedScale = this.clampZoom(scale);
    this.paperManager.scale(paper, clampedScale);

    // Center the selection
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const paperCenterX = paperWidth / 2;
    const paperCenterY = paperHeight / 2;

    this.panTo(paperCenterX - centerX * clampedScale, paperCenterY - centerY * clampedScale);
  }

  private clampZoom(zoom: number): number {
    return Math.max(0.1, Math.min(5.0, zoom));
  }

  /**
   * Smooth pan animation using requestAnimationFrame
   */
  private smoothPanTo(paper: dia.Paper, dx: number, dy: number, duration: number = 300): void {
    const startTime = performance.now();
    const startTranslate = paper.translate();
    const targetTx = startTranslate.tx + dx;
    const targetTy = startTranslate.ty + dy;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);

      const currentTx = startTranslate.tx + dx * easeOut;
      const currentTy = startTranslate.ty + dy * easeOut;

      paper.translate(currentTx, currentTy);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }

  /**
   * Smooth zoom animation using requestAnimationFrame
   */
  private smoothZoomTo(paper: dia.Paper, targetScale: number, duration: number = 300): void {
    const startTime = performance.now();
    const startScale = paper.scale().sx;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);

      const currentScale = startScale + (targetScale - startScale) * easeOut;
      paper.scale(currentScale);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }

  public pan(dx: number, dy: number): void {
    const paper = this.paper;
    if (!paper) return;
    this.paperManager.translate(paper, dx, dy);
    this.emitViewportChanged();
  }

  public panTo(x: number, y: number, smooth: boolean = false): void {
    const paper = this.paper;
    if (!paper) return;
    const origin = paper.translate();

    if (smooth) {
      // Smooth transition using requestAnimationFrame
      this.smoothPanTo(paper, x - origin.tx, y - origin.ty);
    } else {
      this.paperManager.translate(paper, x - origin.tx, y - origin.ty);
    }

    this.emitViewportChanged();
  }

  public fitToViewport(padding: number = 20): void {
    const paper = this.paper;
    if (!paper) return;
    this.paperManager.fitToContent(paper, padding);
    this.emitViewportChanged();
  }

  /**
   * Legacy APIs kept for backward-compatibility
   */
  public zoom(factor: number): void {
    if (factor >= 1) {
      this.zoomIn(factor);
    } else {
      this.zoomOut(factor);
    }
  }

  /**
   * Resize the diagram
   */
  public resize(width: number, height: number): void {
    this.config.width = width;
    this.config.height = height;

    if (this.paper) {
      this.paperManager.resize(this.paper, width, height);
    }
  }

  /**
   * Add event listener
   */
  public addEventListener(eventType: DiagramEventType, callback: Function): void {
    this.eventManager.addEventListener(eventType, callback);
  }

  /**
   * Remove event listener
   */
  public removeEventListener(eventType: DiagramEventType, callback: Function): void {
    this.eventManager.removeEventListener(eventType, callback);
  }

  /**
   * Destroy the diagram engine
   */
  public destroy(): void {
    if (this.paper) {
      this.paperManager.destroy(this.paper);
      this.paper = null;
    }
    this.eventManager.destroy();
    this.toolsManager.destroy();
    this.keyboardManager.destroy();
    this.graph.clear();
  }

  /**
   * Initialize event listeners for graph changes
   */
  private initializeEventListeners(): void {
    // Event listeners will be initialized when paper is created
    // through eventManager.initialize() in initializePaper()
  }

  /**
   * Setup keyboard event handlers
   */
  private setupKeyboardEventHandlers(): void {
    // Zoom handlers
    this.eventManager.addEventListener('keyboard:zoom-in', () => {
      this.zoomIn();
    });

    this.eventManager.addEventListener('keyboard:zoom-out', () => {
      this.zoomOut();
    });

    this.eventManager.addEventListener('keyboard:reset-zoom', () => {
      this.setZoom(1);
    });

    // History handlers
    this.eventManager.addEventListener('keyboard:undo', () => {
      this.undo();
    });

    this.eventManager.addEventListener('keyboard:redo', () => {
      this.redo();
    });

    // Grid handlers
    this.eventManager.addEventListener('keyboard:toggle-grid', () => {
      this.grid.toggle();
    });

    // Selection and deletion handlers
    this.eventManager.addEventListener('keyboard:delete-selected', () => {
      this.deleteSelectedElements();
    });

    this.eventManager.addEventListener('keyboard:move-selected', (event: any) => {
      this.moveSelectedElements(event.dx, event.dy);
    });

    this.eventManager.addEventListener('keyboard:select-all', () => {
      this.selectAllElements();
    });

    this.eventManager.addEventListener('keyboard:deselect-all', () => {
      this.deselectAllElements();
    });

    // Pan canvas handlers
    this.eventManager.addEventListener('keyboard:pan-canvas', (event: any) => {
      this.pan(event.dx, event.dy);
    });

    // Fit viewport handlers
    this.eventManager.addEventListener('keyboard:fit-viewport', () => {
      this.fitToViewport();
    });

    this.eventManager.addEventListener('keyboard:fit-selection', () => {
      this.zoomToSelection();
    });

    // Element drag handlers
    this.eventManager.addEventListener('element:dragging', (event: any) => {
      this.handleElementDrag(event.data);
    });

    this.eventManager.addEventListener('element:drag-end', (event: any) => {
      this.handleElementDragEnd(event.data);
    });

    // Element selection handlers
    this.eventManager.addEventListener('element:selected', (event: any) => {
      this.handleElementSelection(event.data);
    });
  }

  private emitViewportChanged(): void {
    const paper = this.paper;
    if (!paper) return;

    // Throttle viewport change events for performance
    const now = Date.now();
    if (
      now - this.performanceMonitor.lastViewportChange <
      this.performanceMonitor.viewportChangeThrottle
    ) {
      return;
    }

    const { sx } = paper.scale();
    const { tx, ty } = paper.translate();
    this.eventManager.emitEvent('viewport:changed', { zoom: sx, pan: { x: tx, y: ty } });
    this.performanceMonitor.lastViewportChange = now;
  }

  // Getter methods for accessing managers and factories (useful for extensions)

  /**
   * Get the event manager instance
   */
  public getEventManager(): IEventManager {
    return this.eventManager;
  }

  /**
   * Get the data manager instance
   */
  public getDataManager(): IDataManager {
    return this.dataManager;
  }

  /**
   * Get the paper manager instance
   */
  public getPaperManager(): IPaperManager {
    return this.paperManager;
  }

  /**
   * Get the graph manager instance
   */
  public getGraphManager(): IGraphManager {
    return this.graphManager;
  }

  /**
   * Get the shape factory instance
   */
  public getShapeFactory(): IShapeFactory {
    return this.shapeFactory;
  }

  /**
   * Get link factory instance
   */
  public getLinkFactory(): ILinkFactory {
    return this.linkFactory;
  }

  /**
   * Get tools manager instance
   */
  public getToolsManager(): IToolsManager {
    return this.toolsManager;
  }

  /**
   * Get the underlying JointJS graph
   */
  public getGraph(): dia.Graph {
    return this.graph;
  }

  /**
   * Get the underlying JointJS paper
   */
  public getPaper(): dia.Paper | null {
    return this.paper;
  }

  /**
   * Get the current configuration
   */
  public getConfig(): DiagramConfig {
    return { ...this.config };
  }

  /**
   * Get performance monitoring data
   */
  public getPerformanceStats(): {
    elementCount: number;
    visibleElementCount: number;
    viewportCullingEnabled: boolean;
    batchOperationsEnabled: boolean;
    lastViewportChange: number;
  } {
    const allElements = this.graph.getElements();
    const visibleElements = this.getVisibleElements();

    return {
      elementCount: allElements.length,
      visibleElementCount: visibleElements.length,
      viewportCullingEnabled: this.performanceMonitor.viewportCulling,
      batchOperationsEnabled: this.performanceMonitor.batchOperations,
      lastViewportChange: this.performanceMonitor.lastViewportChange,
    };
  }

  /**
   * Enable/disable performance optimizations
   */
  public setPerformanceOptimizations(options: {
    viewportCulling?: boolean;
    batchOperations?: boolean;
    viewportChangeThrottle?: number;
  }): void {
    if (options.viewportCulling !== undefined) {
      this.performanceMonitor.viewportCulling = options.viewportCulling;
    }
    if (options.batchOperations !== undefined) {
      this.performanceMonitor.batchOperations = options.batchOperations;
    }
    if (options.viewportChangeThrottle !== undefined) {
      this.performanceMonitor.viewportChangeThrottle = options.viewportChangeThrottle;
    }
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<DiagramConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  // Grid controls exposed on engine
  public grid = {
    enable: (enabled: boolean): void => {
      this.toolsManager.setGridEnabled(enabled);
      if (this.paper) {
        // snapshot viewport
        const currentScale = this.paper.scale().sx;
        const currentTranslate = this.paper.translate();
        // apply grid change safely (only background/grid layer)
        this.paperManager.setGrid(this.paper, enabled);
        // restore viewport
        this.paper.scale(currentScale);
        this.paper.translate(currentTranslate.tx, currentTranslate.ty);
        this.emitViewportChanged();
      }
    },
    setSpacing: (size: number): void => {
      this.toolsManager.setGridSize(size);
      if (this.paper) {
        const currentScale = this.paper.scale().sx;
        const currentTranslate = this.paper.translate();
        this.paperManager.setGrid(this.paper, this.toolsManager.getGridEnabled(), size);
        this.paper.scale(currentScale);
        this.paper.translate(currentTranslate.tx, currentTranslate.ty);
        this.emitViewportChanged();
      }
    },
    toggle: (): boolean => {
      const next = this.toolsManager.toggleGrid();
      if (this.paper) {
        const currentScale = this.paper.scale().sx;
        const currentTranslate = this.paper.translate();
        this.paperManager.setGrid(this.paper, next);
        this.paper.scale(currentScale);
        this.paper.translate(currentTranslate.tx, currentTranslate.ty);
        this.emitViewportChanged();
      }
      return next;
    },
    isEnabled: (): boolean => {
      return this.toolsManager.getGridEnabled();
    },
    getSize: (): number => {
      return this.toolsManager.getGridSize();
    },
  };

  // Selection and movement methods
  public selectAllElements(): void {
    if (!this.paper) return;
    const elements = this.graph.getElements();
    elements.forEach((element) => {
      this.selectedElements.add(element.id);
    });
    this.updateSelectionState();
  }

  public deselectAllElements(): void {
    if (!this.paper) return;
    this.selectedElements.clear();
    this.updateSelectionState();
  }

  private updateSelectionState(): void {
    const elements = this.getSelectedElements();
    const elementIds = elements.map((el: any) => String(el.id));
    // Links selection not yet tracked; keep empty for now
    const linkIds: string[] = [];
    const hasSelection = elementIds.length > 0 || linkIds.length > 0;
    this.eventManager.emitEvent('selection:changed', {
      elementIds,
      linkIds,
      hasSelection,
    });
    if (!hasSelection) {
      this.eventManager.emitEvent('selection:cleared', {});
    }
  }

  private dragState: {
    isDragging: boolean;
    startPosition: { x: number; y: number };
    elementId: string | null;
  } = {
    isDragging: false,
    startPosition: { x: 0, y: 0 },
    elementId: null,
  };

  private handleElementDrag(data: any): void {
    if (!this.dragState.isDragging) {
      this.dragState.isDragging = true;
      this.dragState.startPosition = data.position || { x: 0, y: 0 };
      this.dragState.elementId = data.id;
    }

    const dx = (data.position?.x || 0) - this.dragState.startPosition.x;
    const dy = (data.position?.y || 0) - this.dragState.startPosition.y;

    if (this.dragState.elementId) {
      this.moveElement(this.dragState.elementId, dx, dy);
    }
  }

  private handleElementDragEnd(data: any): void {
    if (this.dragState.isDragging) {
      this.dragState.isDragging = false;
      this.dragState.elementId = null;
      this.dragState.startPosition = { x: 0, y: 0 };
    }
  }

  private handleElementSelection(data: any): void {
    this.selectedElements.add(data.id);
    this.updateSelectionState();
  }

  public deleteSelectedElements(): void {
    if (!this.paper) return;
    const selectedElements = this.getSelectedElements();
    if (selectedElements.length > 0) {
      selectedElements.forEach((element: any) => {
        element.remove();
      });
    }
  }

  /** Duplicate current selection with a configurable offset */
  public duplicateSelectedElements(
    offset: { dx: number; dy: number } = { dx: 20, dy: 20 }
  ): string[] {
    if (!this.paper) return [];
    const selectedElements = this.getSelectedElements();
    const newIds: string[] = [];
    if (selectedElements.length === 0) return newIds;

    this.history.push();
    selectedElements.forEach((element: any) => {
      const clone = element.clone();
      clone.translate(offset.dx, offset.dy);
      this.graph.addCell(clone);
      newIds.push(String(clone.id));

      // Emit element:added for each clone for consistency
      this.eventManager.emitEvent('element:added', {
        id: clone.id,
        element: {
          id: String(clone.id),
          type: clone.get('type') || 'element',
          position: clone.position(),
          size: clone.size(),
          properties: clone.attributes,
        },
      });
    });
    return newIds;
  }

  public moveSelectedElements(dx: number, dy: number): void {
    if (!this.paper) return;
    const selectedElements = this.getSelectedElements();

    if (selectedElements.length === 0) {
      return;
    }

    this.history.push();

    // Simple movement implementation that works
    selectedElements.forEach((element: any) => {
      const currentPosition = element.get('position') || { x: 0, y: 0 };
      const newPos = {
        x: currentPosition.x + dx,
        y: currentPosition.y + dy,
      };
      element.set('position', newPos);

      // Emit element:updated event for each moved element
      this.eventManager.emitEvent('element:updated', {
        id: element.id,
        patch: { position: newPos },
      });

      // Update connected links
      this.updateConnectedLinks(element.id);
    });
  }

  /**
   * Update a shape with new properties
   */
  public updateShape(id: string, patch: Partial<Shape>): void {
    const element = this.graph.getCell(id);
    if (!element || !element.isElement()) {
      throw new Error(`Element with id ${id} not found`);
    }

    this.history.push();

    // Check if geometry is being updated (position change)
    const wasGeometryUpdated = patch.geometry !== undefined;
    const oldGeometry = element.get('geometry');

    // Update element properties
    if (patch.geometry) {
      element.set('geometry', patch.geometry);
    }
    if (patch.style) {
      element.set('style', { ...element.get('style'), ...patch.style });
    }
    if (patch.type) {
      element.set('type', patch.type);
    }

    // Emit element:updated event
    this.eventManager.emitEvent('element:updated', {
      id: id,
      patch: patch,
    });

    // Update connected links if geometry changed
    if (wasGeometryUpdated) {
      this.updateConnectedLinks(id);
    }
  }

  public getSelectedElements(): any[] {
    if (!this.paper) return [];
    try {
      // Get all elements and filter for selected ones using our selection state
      const elements = this.graph.getElements();
      const selectedElements: any[] = [];

      elements.forEach((element) => {
        if (this.selectedElements.has(element.id)) {
          selectedElements.push(element);
        }
      });

      return selectedElements;
    } catch (error) {
      return [];
    }
  }

  /**
   * Move a link vertex to new coordinates
   */
  public moveLinkVertex(linkId: string, vertexIndex: number, x: number, y: number): void {
    const link = this.graph.getCell(linkId);
    if (!link || !link.isLink()) {
      throw new Error(`Link with id ${linkId} not found`);
    }

    this.history.push();

    // Get current vertices
    const vertices = link.get('vertices') || [];
    if (vertexIndex >= 0 && vertexIndex < vertices.length) {
      vertices[vertexIndex] = { x, y };
      link.set('vertices', vertices);

      // Emit link:updated event
      this.eventManager.emitEvent('link:updated', {
        id: linkId,
        patch: { vertices: vertices },
      });
    }
  }

  /**
   * Add a vertex to a link at specified coordinates
   */
  public addLinkVertex(linkId: string, x: number, y: number): void {
    const link = this.graph.getCell(linkId);
    if (!link || !link.isLink()) {
      throw new Error(`Link with id ${linkId} not found`);
    }

    this.history.push();

    // Get current vertices and add new one
    const vertices = link.get('vertices') || [];
    vertices.push({ x, y });
    link.set('vertices', vertices);

    // Emit link:updated event
    this.eventManager.emitEvent('link:updated', {
      id: linkId,
      patch: { vertices: vertices },
    });
  }

  /**
   * Remove a vertex from a link
   */
  public removeLinkVertex(linkId: string, vertexIndex: number): void {
    const link = this.graph.getCell(linkId);
    if (!link || !link.isLink()) {
      throw new Error(`Link with id ${linkId} not found`);
    }

    this.history.push();

    // Get current vertices and remove specified one
    const vertices = link.get('vertices') || [];
    if (vertexIndex >= 0 && vertexIndex < vertices.length) {
      vertices.splice(vertexIndex, 1);
      link.set('vertices', vertices);

      // Emit link:updated event
      this.eventManager.emitEvent('link:updated', {
        id: linkId,
        patch: { vertices: vertices },
      });
    }
  }

  /**
   * Move an individual element by id with constraints
   */
  public moveElement(id: string, dx: number, dy: number): void {
    const element = this.graph.getCell(id);
    if (!element || !element.isElement()) {
      throw new Error(`Element with id ${id} not found`);
    }

    this.history.push();

    // Calculate constrained position
    const newPosition = this.calculateConstrainedPosition(element, dx, dy);
    if (!newPosition) {
      return; // Movement blocked by constraints
    }

    // Update JointJS element position
    const currentPosition = element.get('position') || { x: 0, y: 0 };
    const updatedPosition = {
      x: currentPosition.x + newPosition.dx,
      y: currentPosition.y + newPosition.dy,
    };

    element.set('position', updatedPosition);

    // Emit element:updated event (position)
    this.eventManager.emitEvent('element:updated', {
      id: id,
      patch: { position: updatedPosition },
    });

    // Update connected links
    this.updateConnectedLinks(id);
  }

  /**
   * Calculate constrained position for element movement
   */
  private calculateConstrainedPosition(
    element: any,
    dx: number,
    dy: number
  ): { dx: number; dy: number } | null {
    const position = element.get('position') || { x: 0, y: 0 };
    const size = element.get('size') || { width: 100, height: 100 };
    const newX = position.x + dx;
    const newY = position.y + dy;

    // Apply page bounds constraints
    const pageBounds = this.getPageBounds();
    const constrainedX = Math.max(pageBounds.minX, Math.min(pageBounds.maxX - size.width, newX));
    const constrainedY = Math.max(pageBounds.minY, Math.min(pageBounds.maxY - size.height, newY));

    // Apply grid snapping if enabled
    const gridEnabled = this.toolsManager.getGridEnabled();
    const gridSize = this.toolsManager.getGridSize();

    let finalX = constrainedX;
    let finalY = constrainedY;

    if (gridEnabled) {
      finalX = Math.round(constrainedX / gridSize) * gridSize;
      finalY = Math.round(constrainedY / gridSize) * gridSize;
    }

    // Check for collision with other elements (optional - can be disabled for performance)
    const collisionDetection = this.config.collisionDetection !== false;
    if (collisionDetection) {
      const collision = this.checkCollision(element, finalX, finalY);
      if (collision) {
        return null; // Movement blocked by collision
      }
    }

    return {
      dx: finalX - position.x,
      dy: finalY - position.y,
    };
  }

  /**
   * Get page bounds for movement constraints
   */
  private getPageBounds(): { minX: number; minY: number; maxX: number; maxY: number } {
    // Default page bounds - can be configured
    const padding = 50;
    return {
      minX: -padding,
      minY: -padding,
      maxX: (this.config.width || 800) + padding,
      maxY: (this.config.height || 600) + padding,
    };
  }

  /**
   * Check for collision with other elements
   */
  private checkCollision(element: any, newX: number, newY: number): boolean {
    const size = element.get('size') || { width: 100, height: 100 };
    const newBbox = {
      x: newX,
      y: newY,
      width: size.width,
      height: size.height,
    };

    const otherElements = this.graph.getElements().filter((el) => el.id !== element.id);

    for (const otherElement of otherElements) {
      const otherBbox = otherElement.getBBox();
      if (this.bboxIntersect(newBbox, otherBbox)) {
        return true; // Collision detected
      }
    }

    return false;
  }

  /**
   * Check if two bounding boxes intersect
   */
  private bboxIntersect(bbox1: any, bbox2: any): boolean {
    return !(
      bbox1.x + bbox1.width < bbox2.x ||
      bbox2.x + bbox2.width < bbox1.x ||
      bbox1.y + bbox1.height < bbox2.y ||
      bbox2.y + bbox2.height < bbox1.y
    );
  }

  /**
   * Batch move multiple elements for better performance
   */
  private batchMoveElements(elements: any[], dx: number, dy: number): void {
    const movedElements: any[] = [];

    // Calculate all new positions first
    elements.forEach((element: any) => {
      const newPosition = this.calculateConstrainedPosition(element, dx, dy);
      if (newPosition) {
        movedElements.push({ element, newPosition });
      }
    });

    // Apply all movements in a single batch
    movedElements.forEach(({ element, newPosition }) => {
      const geometry = element.get('geometry');
      const newGeometry = {
        ...geometry,
        x: geometry.x + newPosition.dx,
        y: geometry.y + newPosition.dy,
      };
      element.set('geometry', newGeometry);

      // Update connected links
      this.updateConnectedLinks(element.id);
    });

    // Emit batch update event
    this.eventManager.emitEvent('elements:batch-updated', {
      elements: movedElements.map(({ element }) => ({
        id: element.id,
        patch: { geometry: element.get('geometry') },
      })),
    });
  }

  /**
   * Get elements visible in current viewport (for culling)
   */
  private getVisibleElements(): any[] {
    if (!this.paper || !this.performanceMonitor.viewportCulling) {
      return this.graph.getElements();
    }

    const paper = this.paper;
    const viewport = this.getViewportBounds();

    return this.graph.getElements().filter((element: any) => {
      const bbox = element.getBBox();
      return this.bboxIntersectsViewport(bbox, viewport);
    });
  }

  /**
   * Get all elements (for testing compatibility)
   */
  public getAllElements(): any[] {
    return this.graph.getElements();
  }

  /**
   * Get selection state (for testing)
   */
  public getSelectionState(): Set<string | number> {
    return this.selectedElements;
  }

  /**
   * Select an element by ID (for testing)
   */
  public selectElement(elementId: string | number): void {
    this.selectedElements.add(elementId);
    this.updateSelectionState();
  }

  /**
   * Get current viewport bounds
   */
  private getViewportBounds(): { x: number; y: number; width: number; height: number } {
    if (!this.paper) return { x: 0, y: 0, width: 800, height: 600 };

    const paper = this.paper;
    const scale = paper.scale().sx;
    const translate = paper.translate();
    const paperWidth = paper.options.width as number;
    const paperHeight = paper.options.height as number;

    return {
      x: -translate.tx / scale,
      y: -translate.ty / scale,
      width: paperWidth / scale,
      height: paperHeight / scale,
    };
  }

  /**
   * Check if bounding box intersects with viewport
   */
  private bboxIntersectsViewport(bbox: any, viewport: any): boolean {
    return !(
      bbox.x + bbox.width < viewport.x ||
      bbox.x > viewport.x + viewport.width ||
      bbox.y + bbox.height < viewport.y ||
      bbox.y > viewport.y + viewport.height
    );
  }

  /**
   * Update links connected to a moved element
   */
  private updateConnectedLinks(elementId: string): void {
    const links = this.graph.getLinks();
    links.forEach((link) => {
      const source = link.get('source');
      const target = link.get('target');

      if ((source && source.id === elementId) || (target && target.id === elementId)) {
        // Emit link:updated event for connected links
        this.eventManager.emitEvent('link:updated', {
          id: link.id,
          patch: { source, target },
        });
      }
    });
  }
}
