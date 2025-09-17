import { Injectable } from '@angular/core';
import { DiagramEngine, DiagramConfig, DiagramData, DiagramElement, DiagramLink } from 'lib';

@Injectable({
  providedIn: 'root',
})
export class DiagramService {
  private diagramEngine: DiagramEngine | null = null;

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
    return this.diagramEngine.addElement(element);
  }

  /**
   * Add a link between elements
   */
  addLink(link: Partial<DiagramLink>): string {
    if (!this.diagramEngine) {
      throw new Error('Diagram engine not initialized.');
    }
    return this.diagramEngine.addLink(link);
  }

  /**
   * Remove an element
   */
  removeElement(elementId: string): void {
    if (!this.diagramEngine) {
      throw new Error('Diagram engine not initialized.');
    }
    this.diagramEngine.removeElement(elementId);
  }

  /**
   * Remove a link
   */
  removeLink(linkId: string): void {
    if (!this.diagramEngine) {
      throw new Error('Diagram engine not initialized.');
    }
    this.diagramEngine.removeLink(linkId);
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
}
