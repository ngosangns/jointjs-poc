import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { DiagramConfig, DiagramElement, DiagramEngine } from 'lib';
import { ShapeMetadata } from './shape-library.service';

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
  async initialize(config: DiagramConfig): Promise<void> {
    this.diagramEngine = new DiagramEngine(config);

    // Auto-load diagram on initialization
    try {
      await this.loadDiagram();
    } catch (error) {
      console.log('No existing diagram found, starting with empty canvas');
    }
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

    // Setup auto-save on diagram changes
    this.setupAutoSave();
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
   * Get center position of the current viewport for element placement in local coordinates
   */
  getCenterPosition(): { x: number; y: number } {
    if (!this.diagramEngine) {
      throw new Error('Diagram engine not initialized.');
    }

    return this.diagramEngine.getPaperCenterLocal();
  }

  /**
   * Get center position of the current viewport in client coordinates
   */
  getCenterPositionClient(): { x: number; y: number } {
    if (!this.diagramEngine) {
      throw new Error('Diagram engine not initialized.');
    }

    return this.diagramEngine.getPaperCenterClient();
  }

  /**
   * Get paper size in local coordinates
   */
  getPaperSize(): { width: number; height: number } {
    if (!this.diagramEngine) {
      throw new Error('Diagram engine not initialized.');
    }

    const paper = this.diagramEngine.getPaper();
    if (!paper) {
      throw new Error('Paper not initialized.');
    }

    // Use the paper manager to get dimensions in local coordinates
    const paperManager = (this.diagramEngine as any).paperManager;
    return paperManager.getPaperDimensions(paper);
  }

  /**
   * Get paper size in client coordinates
   */
  getPaperSizeClient(): { width: number; height: number } {
    if (!this.diagramEngine) {
      throw new Error('Diagram engine not initialized.');
    }

    const paper = this.diagramEngine.getPaper();
    if (!paper) {
      throw new Error('Paper not initialized.');
    }

    // Use the paper manager to get dimensions in client coordinates
    const paperManager = (this.diagramEngine as any).paperManager;
    return paperManager.getPaperDimensionsClient(paper);
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
   * Insert shape with ports at specified position
   */
  insertShapeWithPortsAtPosition(
    shapeMetadata: ShapeMetadata,
    position: { x: number; y: number },
    customPortsConfig?: { groups?: Record<string, any>; items?: any[] }
  ): string {
    if (!this.diagramEngine) {
      throw new Error('Diagram engine not initialized.');
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
      const elementId = this.diagramEngine.addElement(elementData);

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
        ...(shapeMetadata.hasPorts && shapeMetadata.portsConfig && {
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

  /**
   * Save the current diagram state
   */
  async saveDiagram(documentId: string = 'default-diagram'): Promise<void> {
    if (!this.diagramEngine) {
      throw new Error('Diagram engine not initialized.');
    }
    await this.diagramEngine.saveDiagram(documentId);
  }

  /**
   * Load diagram from storage
   */
  async loadDiagram(documentId: string = 'default-diagram'): Promise<void> {
    if (!this.diagramEngine) {
      throw new Error('Diagram engine not initialized.');
    }
    await this.diagramEngine.loadDiagram(documentId);
  }

  /**
   * Export diagram data as JSON string
   */
  exportToJSON(pretty: boolean = false): string {
    if (!this.diagramEngine) {
      throw new Error('Diagram engine not initialized.');
    }
    return this.diagramEngine.exportToJSON(pretty);
  }

  /**
   * Import diagram data from JSON string
   */
  importFromJSON(jsonString: string): void {
    if (!this.diagramEngine) {
      throw new Error('Diagram engine not initialized.');
    }
    this.diagramEngine.importFromJSON(jsonString);
  }

  /**
   * Get current diagram data for external use
   */
  getDiagramData(): any {
    if (!this.diagramEngine) {
      throw new Error('Diagram engine not initialized.');
    }
    return this.diagramEngine.getDiagramData();
  }

  /**
   * Load diagram from external data
   */
  loadFromData(data: any): void {
    if (!this.diagramEngine) {
      throw new Error('Diagram engine not initialized.');
    }
    this.diagramEngine.loadFromData(data);
  }

  /**
   * Download diagram as JSON file
   */
  downloadDiagramAsJSON(filename: string = 'diagram.json', pretty: boolean = true): void {
    try {
      const jsonData = this.exportToJSON(pretty);
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download diagram:', error);
      throw new Error(`Failed to download diagram: ${error}`);
    }
  }

  /**
   * Load diagram from uploaded JSON file
   */
  async loadDiagramFromFile(file: File): Promise<void> {
    try {
      // Validate file
      if (!file) {
        throw new Error('No file provided');
      }

      if (file.size === 0) {
        throw new Error('File is empty');
      }

      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        throw new Error('File size exceeds 10MB limit');
      }

      const text = await file.text();
      this.importFromJSON(text);
    } catch (error) {
      console.error('Failed to load diagram from file:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to load diagram from file: ${error.message}`);
      }
      throw new Error(`Failed to load diagram from file: ${error}`);
    }
  }

  /**
   * Setup auto-save functionality
   */
  private setupAutoSave(): void {
    if (!this.diagramEngine) return;

    // Debounce auto-save to avoid too frequent saves
    let saveTimeout: any = null;
    const debouncedSave = () => {
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }
      saveTimeout = setTimeout(async () => {
        try {
          await this.saveDiagram();
        } catch (error) {
          console.error('Auto-save failed:', error);
        }
      }, 1000); // Save after 1 second of inactivity
    };

    // Listen for diagram changes
    this.diagramEngine.addEventListener('element:added', debouncedSave);
    this.diagramEngine.addEventListener('element:removed', debouncedSave);
    this.diagramEngine.addEventListener('element:changed', debouncedSave);
    this.diagramEngine.addEventListener('link:added', debouncedSave);
    this.diagramEngine.addEventListener('link:removed', debouncedSave);
    this.diagramEngine.addEventListener('link:changed', debouncedSave);
  }

}
