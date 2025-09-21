import { dia, shapes } from '@joint/core';
import { DiagramElement } from '../../types';
import { generateId } from '../../utils';
import { IShapeFactory } from '../interfaces';

// Type for shape constructor
type ShapeConstructor = new (attributes?: any) => dia.Element;

// Interface for shape definition
interface ShapeDefinition {
  constructor: ShapeConstructor;
  defaultConfig?: any;
  namespace?: string;
  ports?: {
    groups?: Record<string, any>;
    items?: any[];
  };
}

export class ShapeFactory implements IShapeFactory {
  private shapeRegistry: Map<string, ShapeDefinition> = new Map();
  private cellNamespaces: Record<string, any> = {};

  constructor() {
    this.initializeCellNamespaces();
    this.registerDefaultShapes();
  }

  /**
   * Initialize cell namespaces for standard shapes
   */
  private initializeCellNamespaces(): void {
    // Standard JointJS shapes
    this.cellNamespaces = {
      ...shapes,
    };
  }

  /**
   * Create a shape of the specified type
   */
  public createShape(type: string, config: Partial<DiagramElement>): dia.Element {
    const shapeDefinition = this.shapeRegistry.get(type);
    if (!shapeDefinition) {
      throw new Error(`Unknown shape type: ${type}`);
    }

    const id = config.id || generateId();
    const defaultConfig = shapeDefinition.defaultConfig || {};

    // Merge default config with provided config
    const shapeConfig = {
      id,
      position: config.position || { x: 0, y: 0 },
      size: config.size || { width: 100, height: 60 },
      attrs: {
        ...defaultConfig.attrs,
        ...config.properties?.['attrs'],
      },
      // Add ports if defined
      ...(shapeDefinition.ports && { ports: shapeDefinition.ports }),
      ...defaultConfig,
      ...config.properties,
    };

    return new shapeDefinition.constructor(shapeConfig);
  }

  /**
   * Register a new shape type
   */
  public registerShape(type: string, shapeClass: ShapeConstructor, defaultConfig?: any): void {
    const shapeDefinition: ShapeDefinition = {
      constructor: shapeClass,
      defaultConfig,
    };
    this.shapeRegistry.set(type, shapeDefinition);
  }


  /**
   * Get all available shape types
   */
  public getAvailableShapes(): string[] {
    return Array.from(this.shapeRegistry.keys());
  }

  /**
   * Check if a shape type is registered
   */
  public hasShape(type: string): boolean {
    return this.shapeRegistry.has(type);
  }

  /**
   * Unregister a shape type
   */
  public unregisterShape(type: string): boolean {
    return this.shapeRegistry.delete(type);
  }

  /**
   * Get default configuration for a shape type
   */
  public getDefaultConfig(type: string): any {
    const shapeDefinition = this.shapeRegistry.get(type);
    return shapeDefinition?.defaultConfig;
  }

  /**
   * Update default configuration for a shape type
   */
  public updateDefaultConfig(type: string, config: any): void {
    const shapeDefinition = this.shapeRegistry.get(type);
    if (shapeDefinition) {
      shapeDefinition.defaultConfig = { ...shapeDefinition.defaultConfig, ...config };
    } else {
      throw new Error(`Shape type '${type}' is not registered`);
    }
  }

  /**
   * Get cell namespaces for use with JointJS Paper
   */
  public getCellNamespaces(): Record<string, any> {
    return this.cellNamespaces;
  }


  /**
   * Create a shape with ports configuration
   */
  public createShapeWithPorts(
    type: string,
    config: Partial<DiagramElement>,
    portsConfig?: { groups?: Record<string, any>; items?: any[] }
  ): dia.Element {
    const element = this.createShape(type, config);

    if (portsConfig) {
      element.set('ports', portsConfig);
    }

    return element;
  }

  /**
   * Register default JointJS shapes
   */
  private registerDefaultShapes(): void {
    // Rectangle shape with ports support
    this.registerShape('rectangle', shapes.standard.Rectangle, {
      size: { width: 100, height: 60 },
      attrs: {
        body: {
          fill: '#ffffff',
          stroke: '#333333',
          strokeWidth: 2,
          rx: 5,
          ry: 5,
        },
        label: {
          text: 'Rectangle',
          fontSize: 14,
          fontFamily: 'Arial, sans-serif',
          fill: '#333333',
          textAnchor: 'middle',
          textVerticalAnchor: 'middle',
        },
      },
      ports: {
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
      },
    });

    // Circle shape
    this.registerShape('circle', shapes.standard.Circle, {
      size: { width: 80, height: 80 },
      attrs: {
        body: {
          fill: '#ffffff',
          stroke: '#333333',
          strokeWidth: 2,
        },
        label: {
          text: 'Circle',
          fontSize: 14,
          fontFamily: 'Arial, sans-serif',
          fill: '#333333',
          textAnchor: 'middle',
          textVerticalAnchor: 'middle',
        },
      },
    });

    // Ellipse shape
    this.registerShape('ellipse', shapes.standard.Ellipse, {
      size: { width: 120, height: 80 },
      attrs: {
        body: {
          fill: '#ffffff',
          stroke: '#333333',
          strokeWidth: 2,
        },
        label: {
          text: 'Ellipse',
          fontSize: 14,
          fontFamily: 'Arial, sans-serif',
          fill: '#333333',
          textAnchor: 'middle',
          textVerticalAnchor: 'middle',
        },
      },
    });

    // Polygon shape
    this.registerShape('polygon', shapes.standard.Polygon, {
      size: { width: 100, height: 100 },
      attrs: {
        body: {
          fill: '#ffffff',
          stroke: '#333333',
          strokeWidth: 2,
          points: '0,10 10,10 10,0 20,0 20,10 30,10 30,20 20,20 20,30 10,30 10,20 0,20',
        },
        label: {
          text: 'Polygon',
          fontSize: 14,
          fontFamily: 'Arial, sans-serif',
          fill: '#333333',
          textAnchor: 'middle',
          textVerticalAnchor: 'middle',
        },
      },
    });

    // Path shape
    this.registerShape('path', shapes.standard.Path, {
      size: { width: 100, height: 100 },
      attrs: {
        body: {
          fill: '#ffffff',
          stroke: '#333333',
          strokeWidth: 2,
          d: 'M 0 10 L 10 0 L 20 10 L 10 20 Z',
        },
        label: {
          text: 'Path',
          fontSize: 14,
          fontFamily: 'Arial, sans-serif',
          fill: '#333333',
          textAnchor: 'middle',
          textVerticalAnchor: 'middle',
        },
      },
    });

    // Image shape
    this.registerShape('image', shapes.standard.Image, {
      attrs: {
        image: {
          xlinkHref:
            'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMiA5QzEwLjM0IDkgOSAxMC4zNCA5IDEyQzkgMTMuNjYgMTAuMzQgMTUgMTIgMTVDMTMuNjYgMTUgMTUgMTMuNjYgMTUgMTJDMTUgMTAuMzQgMTMuNjYgOSAxMiA5WiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K',
          width: '100%',
          height: '100%',
        },
        label: {
          text: 'Image',
          fontSize: 14,
          fontFamily: 'Arial, sans-serif',
          fill: '#333333',
          textAnchor: 'middle',
          textVerticalAnchor: 'middle',
          y: '120%',
        },
      },
    });

    // Header shape (rectangle with header section)
    this.registerShape('header', shapes.standard.HeaderedRectangle, {
      size: { width: 150, height: 100 },
      attrs: {
        body: {
          fill: '#ffffff',
          stroke: '#333333',
          strokeWidth: 2,
        },
        header: {
          fill: '#f0f0f0',
          stroke: '#333333',
          strokeWidth: 2,
          height: 30,
        },
        headerText: {
          text: 'Header',
          fontSize: 12,
          fontFamily: 'Arial, sans-serif',
          fill: '#333333',
          textAnchor: 'middle',
          textVerticalAnchor: 'middle',
        },
        bodyText: {
          text: 'Body',
          fontSize: 14,
          fontFamily: 'Arial, sans-serif',
          fill: '#333333',
          textAnchor: 'middle',
          textVerticalAnchor: 'middle',
        },
      },
    });

    // Flowchart shapes
    this.registerShape('process', shapes.standard.Rectangle, {
      size: { width: 120, height: 60 },
      attrs: {
        body: {
          fill: '#e3f2fd',
          stroke: '#1976d2',
          strokeWidth: 2,
          rx: 5,
          ry: 5,
        },
        label: {
          text: 'Process',
          fontSize: 14,
          fontFamily: 'Arial, sans-serif',
          fill: '#1976d2',
          textAnchor: 'middle',
          textVerticalAnchor: 'middle',
        },
      },
    });

    this.registerShape('decision', shapes.standard.Polygon, {
      size: { width: 100, height: 100 },
      attrs: {
        body: {
          fill: '#fff3e0',
          stroke: '#f57c00',
          strokeWidth: 2,
          points: '50,10 90,50 50,90 10,50',
        },
        label: {
          text: 'Decision',
          fontSize: 12,
          fontFamily: 'Arial, sans-serif',
          fill: '#f57c00',
          textAnchor: 'middle',
          textVerticalAnchor: 'middle',
        },
      },
    });

    this.registerShape('start-end', shapes.standard.Ellipse, {
      size: { width: 100, height: 60 },
      attrs: {
        body: {
          fill: '#e8f5e8',
          stroke: '#4caf50',
          strokeWidth: 2,
        },
        label: {
          text: 'Start/End',
          fontSize: 12,
          fontFamily: 'Arial, sans-serif',
          fill: '#4caf50',
          textAnchor: 'middle',
          textVerticalAnchor: 'middle',
        },
      },
    });

    this.registerShape('input-output', shapes.standard.Polygon, {
      size: { width: 120, height: 60 },
      attrs: {
        body: {
          fill: '#f3e5f5',
          stroke: '#9c27b0',
          strokeWidth: 2,
          points: '20,10 100,10 80,30 100,50 20,50 0,30',
        },
        label: {
          text: 'Input/Output',
          fontSize: 12,
          fontFamily: 'Arial, sans-serif',
          fill: '#9c27b0',
          textAnchor: 'middle',
          textVerticalAnchor: 'middle',
        },
      },
    });

    this.registerShape('connector', shapes.standard.Circle, {
      size: { width: 40, height: 40 },
      attrs: {
        body: {
          fill: '#ffebee',
          stroke: '#f44336',
          strokeWidth: 2,
        },
        label: {
          text: 'C',
          fontSize: 12,
          fontFamily: 'Arial, sans-serif',
          fill: '#f44336',
          textAnchor: 'middle',
          textVerticalAnchor: 'middle',
        },
      },
    });

    // UML shapes
    this.registerShape('class', shapes.standard.Rectangle, {
      size: { width: 150, height: 100 },
      attrs: {
        body: {
          fill: '#ffffff',
          stroke: '#333333',
          strokeWidth: 2,
        },
        label: {
          text: 'ClassName',
          fontSize: 14,
          fontFamily: 'Arial, sans-serif',
          fill: '#333333',
          textAnchor: 'middle',
          textVerticalAnchor: 'middle',
        },
      },
    });

    this.registerShape('interface', shapes.standard.Rectangle, {
      size: { width: 150, height: 80 },
      attrs: {
        body: {
          fill: '#f0f8ff',
          stroke: '#4169e1',
          strokeWidth: 2,
        },
        label: {
          text: '<<interface>>\nInterfaceName',
          fontSize: 12,
          fontFamily: 'Arial, sans-serif',
          fill: '#4169e1',
          textAnchor: 'middle',
          textVerticalAnchor: 'middle',
        },
      },
    });

    this.registerShape('actor', shapes.standard.Circle, {
      size: { width: 80, height: 80 },
      attrs: {
        body: {
          fill: '#fff9c4',
          stroke: '#fbc02d',
          strokeWidth: 2,
        },
        label: {
          text: 'Actor',
          fontSize: 12,
          fontFamily: 'Arial, sans-serif',
          fill: '#fbc02d',
          textAnchor: 'middle',
          textVerticalAnchor: 'middle',
        },
      },
    });

    this.registerShape('usecase', shapes.standard.Ellipse, {
      size: { width: 120, height: 60 },
      attrs: {
        body: {
          fill: '#e1f5fe',
          stroke: '#03a9f4',
          strokeWidth: 2,
        },
        label: {
          text: 'Use Case',
          fontSize: 12,
          fontFamily: 'Arial, sans-serif',
          fill: '#03a9f4',
          textAnchor: 'middle',
          textVerticalAnchor: 'middle',
        },
      },
    });

    this.registerShape('package', shapes.standard.Rectangle, {
      size: { width: 120, height: 80 },
      attrs: {
        body: {
          fill: '#f1f8e9',
          stroke: '#689f38',
          strokeWidth: 2,
        },
        label: {
          text: 'Package',
          fontSize: 12,
          fontFamily: 'Arial, sans-serif',
          fill: '#689f38',
          textAnchor: 'middle',
          textVerticalAnchor: 'middle',
        },
      },
    });

    // Network shapes
    this.registerShape('router', shapes.standard.Rectangle, {
      size: { width: 80, height: 80 },
      attrs: {
        body: {
          fill: '#e3f2fd',
          stroke: '#2196f3',
          strokeWidth: 2,
          rx: 5,
          ry: 5,
        },
        label: {
          text: 'Router',
          fontSize: 12,
          fontFamily: 'Arial, sans-serif',
          fill: '#2196f3',
          textAnchor: 'middle',
          textVerticalAnchor: 'middle',
        },
      },
    });

    this.registerShape('server', shapes.standard.Rectangle, {
      size: { width: 100, height: 80 },
      attrs: {
        body: {
          fill: '#e8f5e8',
          stroke: '#4caf50',
          strokeWidth: 2,
          rx: 5,
          ry: 5,
        },
        label: {
          text: 'Server',
          fontSize: 12,
          fontFamily: 'Arial, sans-serif',
          fill: '#4caf50',
          textAnchor: 'middle',
          textVerticalAnchor: 'middle',
        },
      },
    });

    this.registerShape('database', shapes.standard.Ellipse, {
      size: { width: 100, height: 80 },
      attrs: {
        body: {
          fill: '#fff3e0',
          stroke: '#ff9800',
          strokeWidth: 2,
        },
        label: {
          text: 'Database',
          fontSize: 12,
          fontFamily: 'Arial, sans-serif',
          fill: '#ff9800',
          textAnchor: 'middle',
          textVerticalAnchor: 'middle',
        },
      },
    });

    this.registerShape('cloud', shapes.standard.Ellipse, {
      size: { width: 120, height: 80 },
      attrs: {
        body: {
          fill: '#f3e5f5',
          stroke: '#9c27b0',
          strokeWidth: 2,
        },
        label: {
          text: 'Cloud',
          fontSize: 12,
          fontFamily: 'Arial, sans-serif',
          fill: '#9c27b0',
          textAnchor: 'middle',
          textVerticalAnchor: 'middle',
        },
      },
    });

    this.registerShape('firewall', shapes.standard.Rectangle, {
      size: { width: 100, height: 60 },
      attrs: {
        body: {
          fill: '#ffebee',
          stroke: '#f44336',
          strokeWidth: 2,
          rx: 5,
          ry: 5,
        },
        label: {
          text: 'Firewall',
          fontSize: 12,
          fontFamily: 'Arial, sans-serif',
          fill: '#f44336',
          textAnchor: 'middle',
          textVerticalAnchor: 'middle',
        },
      },
    });
  }
}
