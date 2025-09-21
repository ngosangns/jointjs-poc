import { Injectable } from '@angular/core';

export interface ShapeMetadata {
  name: string;
  icon: string;
  defaultSize: { width: number; height: number };
  description?: string;
  keywords?: string[];
  hasPorts?: boolean;
  portsConfig?: {
    groups?: Record<string, any>;
    items?: any[];
  };
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
   * Initialize the shape registry with shapes including ports configuration
   */
  private initializeShapeRegistry(): void {
    const shapes: ShapeMetadata[] = [
      {
        name: 'Rectangle',
        icon: 'rectangle',
        defaultSize: { width: 100, height: 60 },
        description: 'A rectangular shape for general use',
        keywords: ['rectangle', 'box', 'square', 'rect'],
        hasPorts: true,
        portsConfig: {
          groups: {
            in: {
              position: 'left',
              attrs: {
                circle: {
                  fill: '#16A085',
                  stroke: '#333333',
                  strokeWidth: 2,
                  r: 6,
                  magnet: true,
                },
              },
            },
            out: {
              position: 'right',
              attrs: {
                circle: {
                  fill: '#E74C3C',
                  stroke: '#333333',
                  strokeWidth: 2,
                  r: 6,
                  magnet: true,
                },
              },
            },
          },
          items: [
            { group: 'in', id: 'in1' },
            { group: 'out', id: 'out1' },
          ],
        },
      },
      {
        name: 'Circle',
        icon: 'circle',
        defaultSize: { width: 80, height: 80 },
        description: 'A circular shape',
        keywords: ['circle', 'round', 'oval'],
        hasPorts: true,
        portsConfig: {
          groups: {
            top: {
              position: 'top',
              attrs: {
                circle: {
                  fill: '#3498db',
                  stroke: '#ffffff',
                  strokeWidth: 2,
                  r: 6,
                  magnet: true,
                },
              },
            },
            right: {
              position: 'right',
              attrs: {
                circle: {
                  fill: '#e74c3c',
                  stroke: '#ffffff',
                  strokeWidth: 2,
                  r: 6,
                  magnet: true,
                },
              },
            },
            bottom: {
              position: 'bottom',
              attrs: {
                circle: {
                  fill: '#2ecc71',
                  stroke: '#ffffff',
                  strokeWidth: 2,
                  r: 6,
                  magnet: true,
                },
              },
            },
            left: {
              position: 'left',
              attrs: {
                circle: {
                  fill: '#f39c12',
                  stroke: '#ffffff',
                  strokeWidth: 2,
                  r: 6,
                  magnet: true,
                },
              },
            },
          },
          items: [
            { group: 'top', id: 'top1' },
            { group: 'right', id: 'right1' },
            { group: 'bottom', id: 'bottom1' },
            { group: 'left', id: 'left1' },
          ],
        },
      },
    ];

    // Register shapes
    shapes.forEach((shape) => {
      this.shapeRegistry.set(shape.name.toLowerCase().replace(/\s+/g, '-'), shape);
    });
  }
}
