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
   * Initialize cell namespaces for custom shapes
   */
  private initializeCellNamespaces(): void {
    // Standard JointJS shapes
    this.cellNamespaces = {
      ...shapes,
      // Custom namespaces will be added here
      custom: {},
      business: {},
      flowchart: {},
      uml: {},
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
   * Register a custom shape with namespace support
   */
  public registerCustomShape(
    type: string,
    namespace: string,
    shapeDefinition: Partial<ShapeDefinition> & { constructor: ShapeConstructor }
  ): void {
    // Ensure namespace exists
    if (!this.cellNamespaces[namespace]) {
      this.cellNamespaces[namespace] = {};
    }

    // Add to namespace
    this.cellNamespaces[namespace][type] = shapeDefinition.constructor;

    // Register in factory
    const fullDefinition: ShapeDefinition = {
      ...shapeDefinition,
      namespace,
    };
    this.shapeRegistry.set(`${namespace}.${type}`, fullDefinition);
  }

  /**
   * Define a new shape using JointJS pattern
   */
  public defineShape(
    type: string,
    namespace: string,
    protoProps: any,
    staticProps?: any
  ): ShapeConstructor {
    const baseShape = shapes.standard.Rectangle;
    const ShapeClass = baseShape.define(`${namespace}.${type}`, protoProps, staticProps);

    this.registerCustomShape(type, namespace, {
      constructor: ShapeClass,
      defaultConfig: protoProps,
    });

    return ShapeClass;
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
    const shapeDefinition = this.shapeRegistry.get(type);
    if (shapeDefinition && shapeDefinition.namespace) {
      // Remove from namespace as well
      const [namespace, shapeName] = type.split('.');
      if (this.cellNamespaces[namespace] && this.cellNamespaces[namespace][shapeName]) {
        delete this.cellNamespaces[namespace][shapeName];
      }
    }
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
   * Get shapes in a specific namespace
   */
  public getShapesInNamespace(namespace: string): string[] {
    return Array.from(this.shapeRegistry.keys())
      .filter((key) => key.startsWith(`${namespace}.`))
      .map((key) => key.split('.')[1]);
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
  }
}
