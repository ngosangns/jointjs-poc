import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { DiagramConfig, DiagramElement, DiagramEngine } from 'lib';
import { ShapeMetadataService } from './shape-library.service';

@Injectable({
  providedIn: 'root',
})
export class DiagramService {
  private diagramEngine: DiagramEngine | null = null;

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

  constructor() { }

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
   * Clear the diagram
   */
  clear(): void {
    if (!this.diagramEngine) {
      throw new Error('Diagram engine not initialized.');
    }
    this.diagramEngine.clear();
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
   * Destroy the diagram
   */
  destroy(): void {
    if (this.diagramEngine) {
      this.diagramEngine.destroy();
      this.diagramEngine = null;
    }
  }


  // Enhanced View APIs
  zoomIn(factor: number = 1.2): void {
    if (!this.diagramEngine) throw new Error('Diagram engine not initialized.');
    this.diagramEngine.zoomIn(factor);
  }

  zoomOut(factor: number = 1 / 1.2): void {
    if (!this.diagramEngine) throw new Error('Diagram engine not initialized.');
    this.diagramEngine.zoomOut(factor);
  }


  getZoom(): number {
    if (!this.diagramEngine) throw new Error('Diagram engine not initialized.');
    return this.diagramEngine.getZoom();
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


  duplicateSelected(dx: number = 20, dy: number = 20): string[] {
    if (!this.diagramEngine) throw new Error('Diagram engine not initialized.');
    return (this.diagramEngine as any).duplicateSelectedElements({ dx, dy });
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

    return this.diagramEngine.calculatePaperCenter();
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
  insertShapeAtPosition(shapeMetadata: ShapeMetadataService, position: { x: number; y: number }): string {
    if (!this.diagramEngine) {
      throw new Error('Diagram engine not initialized.');
    }

    try {
      // Map shape metadata to diagram element properties
      const elementData = this.mapShapeMetadataToElement(shapeMetadata, position);

      // Add element to diagram
      const elementId = this.diagramEngine.addElement(elementData);

      return elementId;
    } catch (error) {
      console.error('Failed to insert shape:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to insert shape: ${errorMessage}`);
    }
  }

  /**
   * Map shape metadata to diagram element properties
   */
  private mapShapeMetadataToElement(
    shapeMetadata: ShapeMetadataService,
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
  private getShapeTypeFromMetadata(shapeMetadata: ShapeMetadataService): string {
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



}
