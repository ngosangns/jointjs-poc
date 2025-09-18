import { Injectable } from '@angular/core';

export interface ShapeMetadata {
  name: string;
  icon: string;
  category: string;
  defaultSize: { width: number; height: number };
  description?: string;
  keywords?: string[];
  shortcut?: string;
}

export interface ShapeCategory {
  id: string;
  name: string;
  icon: string;
  shapes: ShapeMetadata[];
}

@Injectable({
  providedIn: 'root',
})
export class ShapeLibraryService {
  private shapeRegistry: Map<string, ShapeMetadata> = new Map();
  private categories: Map<string, ShapeCategory> = new Map();

  constructor() {
    this.initializeShapeRegistry();
  }

  /**
   * Get all available shape categories
   */
  getCategories(): ShapeCategory[] {
    return Array.from(this.categories.values());
  }

  /**
   * Get shapes by category
   */
  getShapesByCategory(categoryId: string): ShapeMetadata[] {
    const category = this.categories.get(categoryId);
    return category ? category.shapes : [];
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
   * Initialize the shape registry with all available shapes
   */
  private initializeShapeRegistry(): void {
    // Basic Shapes Category
    const basicShapes: ShapeMetadata[] = [
      {
        name: 'Rectangle',
        icon: 'rectangle',
        category: 'basic',
        defaultSize: { width: 100, height: 60 },
        description: 'A rectangular shape for general use',
        keywords: ['rectangle', 'box', 'square', 'rect'],
        shortcut: 'R',
      },
      {
        name: 'Circle',
        icon: 'circle',
        category: 'basic',
        defaultSize: { width: 80, height: 80 },
        description: 'A circular shape',
        keywords: ['circle', 'round', 'oval'],
        shortcut: 'C',
      },
      {
        name: 'Ellipse',
        icon: 'ellipse',
        category: 'basic',
        defaultSize: { width: 120, height: 80 },
        description: 'An elliptical shape',
        keywords: ['ellipse', 'oval', 'egg'],
        shortcut: 'E',
      },
      {
        name: 'Polygon',
        icon: 'polygon',
        category: 'basic',
        defaultSize: { width: 100, height: 100 },
        description: 'A polygonal shape',
        keywords: ['polygon', 'star', 'shape'],
        shortcut: 'P',
      },
      {
        name: 'Path',
        icon: 'path',
        category: 'basic',
        defaultSize: { width: 100, height: 100 },
        description: 'A custom path shape',
        keywords: ['path', 'custom', 'diamond'],
        shortcut: 'D',
      },
    ];

    // Flowchart Shapes Category
    const flowchartShapes: ShapeMetadata[] = [
      {
        name: 'Process',
        icon: 'rectangle',
        category: 'flowchart',
        defaultSize: { width: 120, height: 60 },
        description: 'Process or action step',
        keywords: ['process', 'action', 'step', 'task'],
        shortcut: 'P',
      },
      {
        name: 'Decision',
        icon: 'diamond',
        category: 'flowchart',
        defaultSize: { width: 100, height: 100 },
        description: 'Decision point with yes/no branches',
        keywords: ['decision', 'choice', 'if', 'condition'],
        shortcut: 'D',
      },
      {
        name: 'Start/End',
        icon: 'ellipse',
        category: 'flowchart',
        defaultSize: { width: 100, height: 60 },
        description: 'Start or end point of a process',
        keywords: ['start', 'end', 'begin', 'finish', 'terminator'],
        shortcut: 'S',
      },
      {
        name: 'Input/Output',
        icon: 'parallelogram',
        category: 'flowchart',
        defaultSize: { width: 120, height: 60 },
        description: 'Input or output operation',
        keywords: ['input', 'output', 'data', 'io'],
        shortcut: 'I',
      },
      {
        name: 'Connector',
        icon: 'circle',
        category: 'flowchart',
        defaultSize: { width: 40, height: 40 },
        description: 'Connection point or reference',
        keywords: ['connector', 'reference', 'link'],
        shortcut: 'O',
      },
    ];

    // UML Shapes Category
    const umlShapes: ShapeMetadata[] = [
      {
        name: 'Class',
        icon: 'rectangle',
        category: 'uml',
        defaultSize: { width: 150, height: 100 },
        description: 'UML class representation',
        keywords: ['class', 'uml', 'object', 'entity'],
        shortcut: 'C',
      },
      {
        name: 'Interface',
        icon: 'rectangle',
        category: 'uml',
        defaultSize: { width: 150, height: 80 },
        description: 'UML interface representation',
        keywords: ['interface', 'contract', 'uml'],
        shortcut: 'I',
      },
      {
        name: 'Actor',
        icon: 'stickman',
        category: 'uml',
        defaultSize: { width: 80, height: 120 },
        description: 'UML actor (user or external system)',
        keywords: ['actor', 'user', 'person', 'uml'],
        shortcut: 'A',
      },
      {
        name: 'Use Case',
        icon: 'ellipse',
        category: 'uml',
        defaultSize: { width: 120, height: 60 },
        description: 'UML use case',
        keywords: ['usecase', 'use case', 'scenario', 'uml'],
        shortcut: 'U',
      },
      {
        name: 'Package',
        icon: 'folder',
        category: 'uml',
        defaultSize: { width: 120, height: 80 },
        description: 'UML package',
        keywords: ['package', 'namespace', 'module', 'uml'],
        shortcut: 'K',
      },
    ];

    // Network Shapes Category
    const networkShapes: ShapeMetadata[] = [
      {
        name: 'Router',
        icon: 'router',
        category: 'network',
        defaultSize: { width: 80, height: 80 },
        description: 'Network router device',
        keywords: ['router', 'network', 'device', 'switch'],
        shortcut: 'R',
      },
      {
        name: 'Server',
        icon: 'server',
        category: 'network',
        defaultSize: { width: 100, height: 80 },
        description: 'Server or computer',
        keywords: ['server', 'computer', 'pc', 'host'],
        shortcut: 'S',
      },
      {
        name: 'Database',
        icon: 'database',
        category: 'network',
        defaultSize: { width: 100, height: 80 },
        description: 'Database server',
        keywords: ['database', 'db', 'storage', 'data'],
        shortcut: 'D',
      },
      {
        name: 'Cloud',
        icon: 'cloud',
        category: 'network',
        defaultSize: { width: 120, height: 80 },
        description: 'Cloud service or external system',
        keywords: ['cloud', 'external', 'service', 'api'],
        shortcut: 'L',
      },
      {
        name: 'Firewall',
        icon: 'firewall',
        category: 'network',
        defaultSize: { width: 100, height: 60 },
        description: 'Network firewall',
        keywords: ['firewall', 'security', 'gateway', 'filter'],
        shortcut: 'F',
      },
    ];

    // Register all shapes
    [...basicShapes, ...flowchartShapes, ...umlShapes, ...networkShapes].forEach((shape) => {
      this.shapeRegistry.set(shape.name.toLowerCase().replace(/\s+/g, '-'), shape);
    });

    // Create categories
    this.categories.set('basic', {
      id: 'basic',
      name: 'Basic Shapes',
      icon: 'shapes',
      shapes: basicShapes,
    });

    this.categories.set('flowchart', {
      id: 'flowchart',
      name: 'Flowchart',
      icon: 'flow',
      shapes: flowchartShapes,
    });

    this.categories.set('uml', {
      id: 'uml',
      name: 'UML',
      icon: 'uml',
      shapes: umlShapes,
    });

    this.categories.set('network', {
      id: 'network',
      name: 'Network',
      icon: 'network',
      shapes: networkShapes,
    });
  }
}
