import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { DiagramConfig, DiagramData, DiagramElement, DiagramEngine, DiagramLink } from 'lib';
import { ShapeMetadata } from './shape-library';

@Injectable({
  providedIn: 'root',
})
export class DiagramService {
  private diagramEngine: DiagramEngine | null = null;
  private autosaveTimer: any = null;
  private autosaveIdleMs = 1000;
  private opsSinceSave = 0;
  private autosaveOpThreshold = 10;
  private currentDocumentId: string | null = null;

  // Selection stream
  private selectionSubject = new BehaviorSubject<{
    hasSelection: boolean;
    elementIds: string[];
    linkIds: string[];
  }>({
    hasSelection: false,
    elementIds: [],
    linkIds: [],
  });
  public readonly selection$ = this.selectionSubject.asObservable();

  constructor() {}

  /**
   * Initialize the diagram with configuration
   */
  initialize(config: DiagramConfig): void {
    this.diagramEngine = new DiagramEngine(config);
  }

  /**
   * Attach the diagram to DOM element
   */
  attachToElement(element: HTMLElement): void {
    if (!this.diagramEngine) {
      throw new Error('Diagram engine not initialized. Call initialize first.');
    }
    this.diagramEngine.initializePaper(element);
    // Bridge selection events to selection$
    this.diagramEngine.addEventListener('selection:changed', (event: any) => {
      const {
        elementIds = [],
        linkIds = [],
        hasSelection = (elementIds && elementIds.length > 0) || (linkIds && linkIds.length > 0),
      } = event.data || {};
      this.selectionSubject.next({ hasSelection, elementIds, linkIds });
    });
    this.diagramEngine.addEventListener('selection:cleared', () => {
      this.selectionSubject.next({ hasSelection: false, elementIds: [], linkIds: [] });
    });
  }

  /**
   * Add an element to the diagram
   */
  addElement(element: Partial<DiagramElement>): string {
    if (!this.diagramEngine) {
      throw new Error('Diagram engine not initialized.');
    }
    const id = this.diagramEngine.addElement(element);
    this.markDirty();
    return id;
  }

  /**
   * Add a link between elements
   */
  addLink(link: Partial<DiagramLink>): string {
    if (!this.diagramEngine) {
      throw new Error('Diagram engine not initialized.');
    }
    const id = this.diagramEngine.addLink(link);
    this.markDirty();
    return id;
  }

  /**
   * Get diagram data
   */
  getData(): DiagramData | null {
    if (!this.diagramEngine) {
      return null;
    }
    return this.diagramEngine.getDiagramData();
  }

  /**
   * Load diagram data
   */
  loadData(data: DiagramData): void {
    if (!this.diagramEngine) {
      throw new Error('Diagram engine not initialized.');
    }
    this.diagramEngine.loadDiagramData(data);
  }

  /**
   * Clear the diagram
   */
  clear(): void {
    if (!this.diagramEngine) {
      throw new Error('Diagram engine not initialized.');
    }
    this.diagramEngine.clear();
    this.markDirty();
  }

  /**
   * Resize the diagram
   */
  resizeDiagram(width: number, height: number): void {
    if (!this.diagramEngine) {
      throw new Error('Diagram engine not initialized.');
    }
    this.diagramEngine.resize(width, height);
  }

  /**
   * Add event listener
   */
  addEventListener(eventType: any, callback: Function): void {
    if (!this.diagramEngine) {
      throw new Error('Diagram engine not initialized.');
    }
    this.diagramEngine.addEventListener(eventType, callback);
  }

  /**
   * Remove event listener
   */
  removeEventListener(eventType: any, callback: Function): void {
    if (!this.diagramEngine) {
      throw new Error('Diagram engine not initialized.');
    }
    this.diagramEngine.removeEventListener(eventType, callback);
  }

  /**
   * Destroy the diagram
   */
  destroy(): void {
    if (this.diagramEngine) {
      this.diagramEngine.destroy();
      this.diagramEngine = null;
    }
    if (this.autosaveTimer) {
      clearTimeout(this.autosaveTimer);
      this.autosaveTimer = null;
    }
  }

  /**
   * Export diagram data
   */
  exportData(): DiagramData | null {
    if (!this.diagramEngine) {
      return null;
    }
    return this.diagramEngine.getDiagramData();
  }

  // Persistence APIs
  async save(documentId?: string): Promise<void> {
    if (!this.diagramEngine) throw new Error('Diagram engine not initialized.');
    const id = documentId ?? this.currentDocumentId;
    if (!id) throw new Error('No documentId specified for save');
    await this.diagramEngine.save(id);
    this.opsSinceSave = 0;
  }

  async load(documentId: string): Promise<void> {
    if (!this.diagramEngine) throw new Error('Diagram engine not initialized.');
    this.currentDocumentId = documentId;
    await this.diagramEngine.load(documentId);
    this.opsSinceSave = 0;
  }

  setDocumentId(documentId: string): void {
    this.currentDocumentId = documentId;
  }

  // Enhanced View APIs
  zoomIn(factor: number = 1.2): void {
    if (!this.diagramEngine) throw new Error('Diagram engine not initialized.');
    // Use cursor-centered zoom by default
    this.diagramEngine.zoomIn(factor, false, true);
  }

  zoomOut(factor: number = 1 / 1.2): void {
    if (!this.diagramEngine) throw new Error('Diagram engine not initialized.');
    // Use cursor-centered zoom by default
    this.diagramEngine.zoomOut(factor, false, true);
  }

  pan(dx: number, dy: number): void {
    if (!this.diagramEngine) throw new Error('Diagram engine not initialized.');
    this.diagramEngine.pan(dx, dy);
  }

  setZoom(z: number): void {
    if (!this.diagramEngine) throw new Error('Diagram engine not initialized.');
    this.diagramEngine.setZoom(z);
  }

  getZoom(): number {
    if (!this.diagramEngine) throw new Error('Diagram engine not initialized.');
    return this.diagramEngine.getZoom();
  }

  panTo(x: number, y: number, smooth?: boolean): void {
    if (!this.diagramEngine) throw new Error('Diagram engine not initialized.');
    this.diagramEngine.panTo(x, y, smooth);
  }

  fitToViewport(padding?: number): void {
    if (!this.diagramEngine) throw new Error('Diagram engine not initialized.');
    this.diagramEngine.fitToViewport(padding);
  }

  getPerformanceStats(): any {
    if (!this.diagramEngine) throw new Error('Diagram engine not initialized.');
    return this.diagramEngine.getPerformanceStats();
  }

  setPerformanceOptimizations(options: {
    viewportCulling?: boolean;
    batchOperations?: boolean;
    viewportChangeThrottle?: number;
  }): void {
    if (!this.diagramEngine) throw new Error('Diagram engine not initialized.');
    this.diagramEngine.setPerformanceOptimizations(options);
  }

  /**
   * Enable performance optimizations for shape insertion
   */
  enableShapeInsertionOptimizations(): void {
    this.setPerformanceOptimizations({
      viewportCulling: true,
      batchOperations: true,
      viewportChangeThrottle: 16, // ~60fps
    });
  }

  zoomToFit(padding?: number): void {
    if (!this.diagramEngine) throw new Error('Diagram engine not initialized.');
    this.diagramEngine.zoomToFit(padding);
  }

  zoomToSelection(padding?: number): void {
    if (!this.diagramEngine) throw new Error('Diagram engine not initialized.');
    this.diagramEngine.zoomToSelection(padding);
  }

  // Enhanced Grid APIs
  setGridEnabled(enabled: boolean): void {
    if (!this.diagramEngine) throw new Error('Diagram engine not initialized.');
    this.diagramEngine.grid.enable(enabled);
  }

  setGridSize(size: number): void {
    if (!this.diagramEngine) throw new Error('Diagram engine not initialized.');
    this.diagramEngine.grid.setSpacing(size);
  }

  toggleGrid(): boolean {
    if (!this.diagramEngine) throw new Error('Diagram engine not initialized.');
    // Grid toggle now includes element position preservation
    return this.diagramEngine.grid.toggle();
  }

  isGridEnabled(): boolean {
    if (!this.diagramEngine) throw new Error('Diagram engine not initialized.');
    return this.diagramEngine.grid.isEnabled();
  }

  getGridSize(): number {
    if (!this.diagramEngine) throw new Error('Diagram engine not initialized.');
    return this.diagramEngine.grid.getSize();
  }

  // Selection and Movement APIs
  selectAll(): void {
    if (!this.diagramEngine) throw new Error('Diagram engine not initialized.');
    this.diagramEngine.selectAllElements();
  }

  deselectAll(): void {
    if (!this.diagramEngine) throw new Error('Diagram engine not initialized.');
    this.diagramEngine.deselectAllElements();
  }

  deleteSelected(): void {
    if (!this.diagramEngine) throw new Error('Diagram engine not initialized.');
    this.diagramEngine.deleteSelectedElements();
  }

  duplicateSelected(dx: number = 20, dy: number = 20): string[] {
    if (!this.diagramEngine) throw new Error('Diagram engine not initialized.');
    return (this.diagramEngine as any).duplicateSelectedElements({ dx, dy });
  }

  moveSelected(dx: number, dy: number): void {
    if (!this.diagramEngine) throw new Error('Diagram engine not initialized.');
    this.diagramEngine.moveSelectedElements(dx, dy);
  }

  getSelectedElements(): any[] {
    if (!this.diagramEngine) throw new Error('Diagram engine not initialized.');
    return this.diagramEngine.getSelectedElements();
  }

  getEngine(): any {
    return this.diagramEngine;
  }

  /**
   * Get center position of the current viewport for element placement
   */
  getCenterPosition(): { x: number; y: number } {
    if (!this.diagramEngine) {
      throw new Error('Diagram engine not initialized.');
    }

    // Get the current viewport dimensions and position
    const paper = this.diagramEngine.getPaper();
    if (!paper) {
      throw new Error('Paper not initialized.');
    }

    // Get paper dimensions
    const paperWidth = paper.options.width || 800;
    const paperHeight = paper.options.height || 600;

    // Get current zoom and pan
    const zoom = this.getZoom();
    const pan = paper.translate();

    // Calculate center position in paper coordinates
    // Account for zoom and pan to get the center of the visible viewport
    const centerX = (Number(paperWidth) / 2 - Number(pan.tx)) / Number(zoom);
    const centerY = (Number(paperHeight) / 2 - Number(pan.ty)) / Number(zoom);

    return { x: centerX, y: centerY };
  }

  /**
   * Get paper size for center calculation
   */
  getPaperSize(): { width: number; height: number } {
    if (!this.diagramEngine) {
      throw new Error('Diagram engine not initialized.');
    }

    const paper = this.diagramEngine.getPaper();
    if (!paper) {
      throw new Error('Paper not initialized.');
    }

    return {
      width: Number(paper.options.width) || 800,
      height: Number(paper.options.height) || 600,
    };
  }

  /**
   * Get current pan position
   */
  getPan(): { x: number; y: number } {
    if (!this.diagramEngine) {
      throw new Error('Diagram engine not initialized.');
    }

    const paper = this.diagramEngine.getPaper();
    if (!paper) {
      throw new Error('Paper not initialized.');
    }

    const translate = paper.translate();
    return { x: translate.tx, y: translate.ty };
  }

  /**
   * Insert shape at specified position using shape metadata
   */
  insertShapeAtPosition(shapeMetadata: ShapeMetadata, position: { x: number; y: number }): string {
    if (!this.diagramEngine) {
      throw new Error('Diagram engine not initialized.');
    }

    try {
      // Check if position is within viewport for performance optimization
      if (!this.isPositionInViewport(position)) {
        console.warn('Shape insertion position is outside viewport, may impact performance');
      }

      // Map shape metadata to diagram element properties
      const elementData = this.mapShapeMetadataToElement(shapeMetadata, position);

      // Add element to diagram
      const elementId = this.addElement(elementData);

      // Mark as dirty for autosave
      this.markDirty();

      return elementId;
    } catch (error) {
      console.error('Failed to insert shape:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to insert shape: ${errorMessage}`);
    }
  }

  /**
   * Check if position is within current viewport for performance optimization
   */
  private isPositionInViewport(position: { x: number; y: number }): boolean {
    if (!this.diagramEngine) {
      return true; // Assume in viewport if engine not available
    }

    try {
      const paper = this.diagramEngine.getPaper();
      if (!paper) {
        return true;
      }

      const paperWidth = paper.options.width || 800;
      const paperHeight = paper.options.height || 600;
      const zoom = this.getZoom();
      const pan = paper.translate();

      // Calculate viewport bounds in paper coordinates
      const viewportLeft = -Number(pan.tx) / Number(zoom);
      const viewportTop = -Number(pan.ty) / Number(zoom);
      const viewportRight = viewportLeft + Number(paperWidth) / Number(zoom);
      const viewportBottom = viewportTop + Number(paperHeight) / Number(zoom);

      return (
        position.x >= viewportLeft &&
        position.x <= viewportRight &&
        position.y >= viewportTop &&
        position.y <= viewportBottom
      );
    } catch (error) {
      console.warn('Failed to check viewport bounds:', error);
      return true; // Assume in viewport on error
    }
  }

  /**
   * Map shape metadata to diagram element properties
   */
  private mapShapeMetadataToElement(
    shapeMetadata: ShapeMetadata,
    position: { x: number; y: number }
  ): Partial<DiagramElement> {
    // Map shape type from metadata
    const shapeType = this.getShapeTypeFromMetadata(shapeMetadata);

    // Create element data
    const elementData: Partial<DiagramElement> = {
      type: shapeType,
      position: {
        x: position.x - shapeMetadata.defaultSize.width / 2, // Center the shape
        y: position.y - shapeMetadata.defaultSize.height / 2,
      },
      size: {
        width: shapeMetadata.defaultSize.width,
        height: shapeMetadata.defaultSize.height,
      },
      properties: {
        name: shapeMetadata.name,
        description: shapeMetadata.description,
        category: shapeMetadata.category,
        icon: shapeMetadata.icon,
      },
    };

    return elementData;
  }

  /**
   * Get shape type from shape metadata
   */
  private getShapeTypeFromMetadata(shapeMetadata: ShapeMetadata): string {
    // Map shape metadata to ShapeFactory registered keys
    const typeMap: Record<string, string> = {
      rectangle: 'rectangle',
      circle: 'circle',
      ellipse: 'ellipse',
      polygon: 'polygon',
      path: 'path',
      diamond: 'diamond',
      parallelogram: 'parallelogram',
      stickman: 'stickman',
      folder: 'folder',
      router: 'router',
      server: 'server',
      database: 'database',
      cloud: 'cloud',
      firewall: 'firewall',
    };

    return typeMap[shapeMetadata.icon] || 'rectangle';
  }

  // Autosave internals
  private markDirty(): void {
    this.opsSinceSave++;
    if (this.autosaveTimer) clearTimeout(this.autosaveTimer);
    this.autosaveTimer = setTimeout(() => this.flushAutosaveIfNeeded(), this.autosaveIdleMs);
    if (this.opsSinceSave >= this.autosaveOpThreshold) {
      this.flushAutosaveIfNeeded();
    }
  }

  private async flushAutosaveIfNeeded(): Promise<void> {
    if (!this.currentDocumentId) return;
    try {
      await this.save(this.currentDocumentId);
    } catch (e) {
      // swallow autosave errors for now
      console.error('Autosave failed', e);
    }
  }
}
