import { Injectable } from '@angular/core';

export interface ShapeMetadata {
  name: string;
  icon: string;
  defaultSize: { width: number; height: number };
  description?: string;
  keywords?: string[];
}

@Injectable({
  providedIn: 'root',
})
export class ShapeLibraryService {
  private shapeRegistry: Map<string, ShapeMetadata> = new Map();

  constructor() {
    this.initializeShapeRegistry();
  }

  /**
   * Get all shapes
   */
  getAllShapes(): ShapeMetadata[] {
    return Array.from(this.shapeRegistry.values());
  }

  /**
   * Get shape metadata by type
   */
  getShapeMetadata(shapeType: string): ShapeMetadata | undefined {
    return this.shapeRegistry.get(shapeType);
  }

  /**
   * Search shapes by name or keywords
   */
  searchShapes(query: string): ShapeMetadata[] {
    const lowercaseQuery = query.toLowerCase();
    return Array.from(this.shapeRegistry.values()).filter(
      (shape) =>
        shape.name.toLowerCase().includes(lowercaseQuery) ||
        shape.keywords?.some((keyword) => keyword.toLowerCase().includes(lowercaseQuery))
    );
  }

  /**
   * Get shape preview data for toolbar display
   */
  getShapePreview(shapeType: string): { type: string; metadata: ShapeMetadata } | null {
    const metadata = this.shapeRegistry.get(shapeType);
    return metadata ? { type: shapeType, metadata } : null;
  }

  /**
   * Initialize the shape registry with only Rectangle and Circle shapes
   */
  private initializeShapeRegistry(): void {
    const shapes: ShapeMetadata[] = [
      {
        name: 'Rectangle',
        icon: 'rectangle',
        defaultSize: { width: 100, height: 60 },
        description: 'A rectangular shape for general use',
        keywords: ['rectangle', 'box', 'square', 'rect'],
      },
      {
        name: 'Circle',
        icon: 'circle',
        defaultSize: { width: 80, height: 80 },
        description: 'A circular shape',
        keywords: ['circle', 'round', 'oval'],
      },
    ];

    // Register shapes
    shapes.forEach((shape) => {
      this.shapeRegistry.set(shape.name.toLowerCase().replace(/\s+/g, '-'), shape);
    });
  }
}
