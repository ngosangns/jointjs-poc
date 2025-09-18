import { Injectable } from '@angular/core';
import { DiagramConfig, DiagramData, DiagramElement, DiagramEngine, DiagramLink } from 'lib';

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
   * Remove an element
   */
  removeElement(elementId: string): void {
    if (!this.diagramEngine) {
      throw new Error('Diagram engine not initialized.');
    }
    this.diagramEngine.removeElement(elementId);
    this.markDirty();
  }

  /**
   * Remove a link
   */
  removeLink(linkId: string): void {
    if (!this.diagramEngine) {
      throw new Error('Diagram engine not initialized.');
    }
    this.diagramEngine.removeLink(linkId);
    this.markDirty();
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
    await (this.diagramEngine as any).save(id);
    this.opsSinceSave = 0;
  }

  async load(documentId: string): Promise<void> {
    if (!this.diagramEngine) throw new Error('Diagram engine not initialized.');
    this.currentDocumentId = documentId;
    await (this.diagramEngine as any).load(documentId);
    this.opsSinceSave = 0;
  }

  setDocumentId(documentId: string): void {
    this.currentDocumentId = documentId;
  }

  // History APIs
  undo(): void {
    if (!this.diagramEngine) throw new Error('Diagram engine not initialized.');
    (this.diagramEngine as any).undo();
  }

  redo(): void {
    if (!this.diagramEngine) throw new Error('Diagram engine not initialized.');
    (this.diagramEngine as any).redo();
  }

  // Enhanced View APIs
  zoomIn(factor: number = 1.2): void {
    if (!this.diagramEngine) throw new Error('Diagram engine not initialized.');
    console.log('DiagramService.zoomIn called with factor:', factor);
    (this.diagramEngine as any).zoomIn(factor);
  }

  zoomOut(factor: number = 1 / 1.2): void {
    if (!this.diagramEngine) throw new Error('Diagram engine not initialized.');
    (this.diagramEngine as any).zoomOut(factor);
  }

  pan(dx: number, dy: number): void {
    if (!this.diagramEngine) throw new Error('Diagram engine not initialized.');
    (this.diagramEngine as any).pan(dx, dy);
  }

  setZoom(z: number): void {
    if (!this.diagramEngine) throw new Error('Diagram engine not initialized.');
    (this.diagramEngine as any).setZoom(z);
  }

  getZoom(): number {
    if (!this.diagramEngine) throw new Error('Diagram engine not initialized.');
    return (this.diagramEngine as any).getZoom();
  }

  panTo(x: number, y: number, smooth?: boolean): void {
    if (!this.diagramEngine) throw new Error('Diagram engine not initialized.');
    (this.diagramEngine as any).panTo(x, y, smooth);
  }

  fitToViewport(padding?: number): void {
    if (!this.diagramEngine) throw new Error('Diagram engine not initialized.');
    (this.diagramEngine as any).fitToViewport(padding);
  }

  getPerformanceStats(): any {
    if (!this.diagramEngine) throw new Error('Diagram engine not initialized.');
    return (this.diagramEngine as any).getPerformanceStats();
  }

  setPerformanceOptimizations(options: {
    viewportCulling?: boolean;
    batchOperations?: boolean;
    viewportChangeThrottle?: number;
  }): void {
    if (!this.diagramEngine) throw new Error('Diagram engine not initialized.');
    (this.diagramEngine as any).setPerformanceOptimizations(options);
  }

  zoomToFit(padding?: number): void {
    if (!this.diagramEngine) throw new Error('Diagram engine not initialized.');
    (this.diagramEngine as any).zoomToFit(padding);
  }

  zoomToSelection(padding?: number): void {
    if (!this.diagramEngine) throw new Error('Diagram engine not initialized.');
    (this.diagramEngine as any).zoomToSelection(padding);
  }

  // Enhanced Grid APIs
  setGridEnabled(enabled: boolean): void {
    if (!this.diagramEngine) throw new Error('Diagram engine not initialized.');
    (this.diagramEngine as any).grid.enable(enabled);
  }

  setGridSize(size: number): void {
    if (!this.diagramEngine) throw new Error('Diagram engine not initialized.');
    (this.diagramEngine as any).grid.setSpacing(size);
  }

  toggleGrid(): boolean {
    if (!this.diagramEngine) throw new Error('Diagram engine not initialized.');
    return (this.diagramEngine as any).grid.toggle();
  }

  isGridEnabled(): boolean {
    if (!this.diagramEngine) throw new Error('Diagram engine not initialized.');
    return (this.diagramEngine as any).grid.isEnabled();
  }

  getGridSize(): number {
    if (!this.diagramEngine) throw new Error('Diagram engine not initialized.');
    return (this.diagramEngine as any).grid.getSize();
  }

  // Selection and Movement APIs
  selectAll(): void {
    if (!this.diagramEngine) throw new Error('Diagram engine not initialized.');
    (this.diagramEngine as any).selectAllElements();
  }

  deselectAll(): void {
    if (!this.diagramEngine) throw new Error('Diagram engine not initialized.');
    (this.diagramEngine as any).deselectAllElements();
  }

  deleteSelected(): void {
    if (!this.diagramEngine) throw new Error('Diagram engine not initialized.');
    (this.diagramEngine as any).deleteSelectedElements();
  }

  moveSelected(dx: number, dy: number): void {
    if (!this.diagramEngine) throw new Error('Diagram engine not initialized.');
    (this.diagramEngine as any).moveSelectedElements(dx, dy);
  }

  getSelectedElements(): any[] {
    if (!this.diagramEngine) throw new Error('Diagram engine not initialized.');
    return (this.diagramEngine as any).getSelectedElements();
  }

  getEngine(): any {
    return this.diagramEngine;
  }

  canUndo(): boolean {
    if (!this.diagramEngine) return false;
    return (this.diagramEngine as any).canUndo();
  }

  canRedo(): boolean {
    if (!this.diagramEngine) return false;
    return (this.diagramEngine as any).canRedo();
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
