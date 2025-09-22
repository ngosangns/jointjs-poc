import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { DiagramConfig, DiagramElement, DiagramEditor } from 'lib';
import { ShapeMetadata } from './shape-library.service';

@Injectable({
  providedIn: 'root',
})
export class DiagramService {
  private diagramEditor: DiagramEditor | null = null;

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
  async initialize(config: DiagramConfig): Promise<void> {
    this.diagramEditor = new DiagramEditor(config);
  }

  /**
   * Attach the diagram to DOM element
   */
  attachToElement(element: HTMLElement): void {
    if (!this.diagramEditor) {
      throw new Error('Diagram editor not initialized. Call initialize first.');
    }
    this.diagramEditor.initializePaper(element);

    // Bridge selection events to selection$
    this.diagramEditor.addEventListener('selection:changed', (event: any) => {
      const {
        elementIds = [],
        linkIds = [],
        hasSelection = (elementIds && elementIds.length > 0) || (linkIds && linkIds.length > 0),
      } = event.data || {};
      this.selectionSubject.next({ hasSelection, elementIds, linkIds });
    });
    this.diagramEditor.addEventListener('selection:cleared', () => {
      this.selectionSubject.next({ hasSelection: false, elementIds: [], linkIds: [] });
    });
  }



  /**
   * Resize the diagram
   */
  resizeDiagram(width: number, height: number): void {
    if (!this.diagramEditor) {
      throw new Error('Diagram editor not initialized.');
    }
    this.diagramEditor.resize(width, height);
  }

  /**
   * Add event listener
   */
  addEventListener(eventType: any, callback: Function): void {
    if (!this.diagramEditor) {
      throw new Error('Diagram editor not initialized.');
    }
    this.diagramEditor.addEventListener(eventType, callback);
  }

  /**
   * Destroy the diagram
   */
  destroy(): void {
    if (this.diagramEditor) {
      this.diagramEditor.destroy();
      this.diagramEditor = null;
    }
  }

  // Enhanced View APIs
  zoomIn(factor: number = 1.2): void {
    if (!this.diagramEditor) throw new Error('Diagram editor not initialized.');
    this.diagramEditor.zoomIn(factor);
  }

  zoomOut(factor: number = 1 / 1.2): void {
    if (!this.diagramEditor) throw new Error('Diagram editor not initialized.');
    this.diagramEditor.zoomOut(factor);
  }

  getZoom(): number {
    if (!this.diagramEditor) throw new Error('Diagram editor not initialized.');
    return this.diagramEditor.getZoom();
  }

  duplicateSelected(dx: number = 20, dy: number = 20): string[] {
    if (!this.diagramEditor) throw new Error('Diagram editor not initialized.');
    return (this.diagramEditor as any).duplicateSelectedElements({ dx, dy });
  }

  getEditor(): DiagramEditor {
    if (!this.diagramEditor) throw new Error('Diagram editor not initialized.');
    return this.diagramEditor;
  }

  /**
   * Get center position of the current viewport for element placement in local coordinates
   */
  getCenterPosition(): { x: number; y: number } {
    if (!this.diagramEditor) {
      throw new Error('Diagram editor not initialized.');
    }

    return this.diagramEditor.getPaperCenterLocal();
  }

  /**
   * Get center position of the current viewport in client coordinates
   */
  getCenterPositionClient(): { x: number; y: number } {
    if (!this.diagramEditor) {
      throw new Error('Diagram editor not initialized.');
    }

    return this.diagramEditor.getPaperCenterClient();
  }

  /**
   * Get paper size in local coordinates
   */
  getPaperSize(): { width: number; height: number } {
    if (!this.diagramEditor) {
      throw new Error('Diagram editor not initialized.');
    }

    const paper = this.diagramEditor.getPaper();
    if (!paper) {
      throw new Error('Paper not initialized.');
    }

    // Use the paper manager to get dimensions in local coordinates
    const paperManager = (this.diagramEditor as any).paperManager;
    return paperManager.getPaperDimensions(paper);
  }

  /**
   * Get paper size in client coordinates
   */
  getPaperSizeClient(): { width: number; height: number } {
    if (!this.diagramEditor) {
      throw new Error('Diagram editor not initialized.');
    }

    const paper = this.diagramEditor.getPaper();
    if (!paper) {
      throw new Error('Paper not initialized.');
    }

    // Use the paper manager to get dimensions in client coordinates
    const paperManager = (this.diagramEditor as any).paperManager;
    return paperManager.getPaperDimensionsClient(paper);
  }

  /**
   * Get current pan position
   */
  getPan(): { x: number; y: number } {
    if (!this.diagramEditor) {
      throw new Error('Diagram editor not initialized.');
    }

    const paper = this.diagramEditor.getPaper();
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
    if (!this.diagramEditor) {
      throw new Error('Diagram editor not initialized.');
    }

    try {
      // Map shape metadata to diagram element properties
      const elementData = this.mapShapeMetadataToElement(shapeMetadata, position);

      // Add element to diagram
      const elementId = this.diagramEditor.addElement(elementData);

      return elementId;
    } catch (error) {
      console.error('Failed to insert shape:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to insert shape: ${errorMessage}`);
    }
  }

  /**
   * Insert shape with ports at specified position
   */
  insertShapeWithPortsAtPosition(
    shapeMetadata: ShapeMetadata,
    position: { x: number; y: number },
    customPortsConfig?: { groups?: Record<string, any>; items?: any[] }
  ): string {
    if (!this.diagramEditor) {
      throw new Error('Diagram editor not initialized.');
    }

    try {
      // Map shape metadata to diagram element properties
      const elementData = this.mapShapeMetadataToElement(shapeMetadata, position);

      // Use custom ports config if provided, otherwise use metadata ports config
      const portsConfig = customPortsConfig || shapeMetadata.portsConfig;

      if (portsConfig) {
        elementData.properties = {
          ...elementData.properties,
          ports: portsConfig,
        };
      }

      // Add element to diagram
      const elementId = this.diagramEditor.addElement(elementData);

      return elementId;
    } catch (error) {
      console.error('Failed to insert shape with ports:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to insert shape with ports: ${errorMessage}`);
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
        icon: shapeMetadata.icon,
        // Include ports configuration if available
        ...(shapeMetadata.hasPorts &&
          shapeMetadata.portsConfig && {
            ports: shapeMetadata.portsConfig,
          }),
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
    };

    return typeMap[shapeMetadata.icon] || 'rectangle';
  }

  // Toolbar Methods

  /**
   * Set toolbar mode
   */
  setToolbarMode(mode: 'select' | 'pan'): void {
    if (!this.diagramEditor) {
      throw new Error('Diagram editor not initialized.');
    }
    this.diagramEditor.setToolbarMode(mode);
  }

  /**
   * Get current toolbar mode
   */
  getToolbarMode(): 'select' | 'pan' {
    if (!this.diagramEditor) {
      throw new Error('Diagram editor not initialized.');
    }
    return this.diagramEditor.getToolbarMode();
  }

  /**
   * Toggle toolbar mode
   */
  toggleToolbarMode(): void {
    if (!this.diagramEditor) {
      throw new Error('Diagram editor not initialized.');
    }
    this.diagramEditor.toggleToolbarMode();
  }

  /**
   * Check if pan mode is active
   */
  isPanMode(): boolean {
    if (!this.diagramEditor) {
      throw new Error('Diagram editor not initialized.');
    }
    return this.diagramEditor.isPanMode();
  }

  /**
   * Check if select mode is active
   */
  isSelectMode(): boolean {
    if (!this.diagramEditor) {
      throw new Error('Diagram editor not initialized.');
    }
    return this.diagramEditor.isSelectMode();
  }

  /**
   * Get toolbar manager for advanced operations
   */
  getToolbarManager(): any {
    if (!this.diagramEditor) {
      throw new Error('Diagram editor not initialized.');
    }
    return this.diagramEditor.getToolbarManager();
  }

  /**
   * Check if diagram editor is initialized
   */
  isInitialized(): boolean {
    return this.diagramEditor !== null;
  }
}
