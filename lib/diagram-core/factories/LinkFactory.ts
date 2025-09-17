import { dia, shapes } from '@joint/core';
import { ILinkFactory } from '../interfaces';
import { DiagramLink } from '../../types';
import { generateId } from '../../utils';

// Type for link constructor
type LinkConstructor = new (attributes?: any) => dia.Link;

export class LinkFactory implements ILinkFactory {
  private linkRegistry: Map<string, LinkConstructor> = new Map();
  private defaultLinkConfigs: Map<string, any> = new Map();

  constructor() {
    this.registerDefaultLinks();
  }

  /**
   * Create a link of the specified type
   */
  public createLink(type: string, config: Partial<DiagramLink>): dia.Link {
    const LinkClass = this.linkRegistry.get(type);
    if (!LinkClass) {
      throw new Error(`Unknown link type: ${type}`);
    }

    const id = config.id || generateId();
    const defaultConfig = this.defaultLinkConfigs.get(type) || {};

    // Prepare source and target
    const source =
      typeof config.source === 'string' || typeof config.source === 'number'
        ? { id: config.source }
        : config.source;
    const target =
      typeof config.target === 'string' || typeof config.target === 'number'
        ? { id: config.target }
        : config.target;

    // Merge default config with provided config
    const linkConfig = {
      id,
      source,
      target,
      attrs: {
        ...defaultConfig.attrs,
        ...config.properties?.['attrs'],
      },
      ...defaultConfig,
      ...config.properties,
    };

    return new LinkClass(linkConfig);
  }

  /**
   * Register a new link type
   */
  public registerLink(type: string, linkClass: LinkConstructor, defaultConfig?: any): void {
    this.linkRegistry.set(type, linkClass);
    if (defaultConfig) {
      this.defaultLinkConfigs.set(type, defaultConfig);
    }
  }

  /**
   * Get all available link types
   */
  public getAvailableLinks(): string[] {
    return Array.from(this.linkRegistry.keys());
  }

  /**
   * Check if a link type is registered
   */
  public hasLink(type: string): boolean {
    return this.linkRegistry.has(type);
  }

  /**
   * Unregister a link type
   */
  public unregisterLink(type: string): boolean {
    const removed = this.linkRegistry.delete(type);
    this.defaultLinkConfigs.delete(type);
    return removed;
  }

  /**
   * Get default configuration for a link type
   */
  public getDefaultConfig(type: string): any {
    return this.defaultLinkConfigs.get(type);
  }

  /**
   * Update default configuration for a link type
   */
  public updateDefaultConfig(type: string, config: any): void {
    if (this.linkRegistry.has(type)) {
      this.defaultLinkConfigs.set(type, { ...this.defaultLinkConfigs.get(type), ...config });
    }
  }

  /**
   * Register default JointJS links
   */
  private registerDefaultLinks(): void {
    // Standard link
    this.registerLink('standard', shapes.standard.Link, {
      attrs: {
        line: {
          stroke: '#333333',
          strokeWidth: 2,
          targetMarker: {
            type: 'path',
            d: 'M 10 -5 0 0 10 5 z',
            fill: '#333333',
            stroke: '#333333',
          },
        },
      },
      router: { name: 'orthogonal' },
      connector: { name: 'rounded' },
    });

    // Double link (parallel lines)
    this.registerLink('double', shapes.standard.DoubleLink, {
      attrs: {
        line: {
          stroke: '#333333',
          strokeWidth: 2,
          targetMarker: {
            type: 'path',
            d: 'M 10 -5 0 0 10 5 z',
            fill: '#333333',
            stroke: '#333333',
          },
        },
        outline: {
          stroke: '#ffffff',
          strokeWidth: 6,
        },
      },
      router: { name: 'orthogonal' },
      connector: { name: 'rounded' },
    });

    // Shadow link (with drop shadow effect)
    this.registerLink('shadow', shapes.standard.ShadowLink, {
      attrs: {
        line: {
          stroke: '#333333',
          strokeWidth: 2,
          targetMarker: {
            type: 'path',
            d: 'M 10 -5 0 0 10 5 z',
            fill: '#333333',
            stroke: '#333333',
          },
        },
        shadow: {
          stroke: '#cccccc',
          strokeWidth: 2,
          strokeOpacity: 0.5,
          transform: 'translate(2, 2)',
        },
      },
      router: { name: 'orthogonal' },
      connector: { name: 'rounded' },
    });

    // Dashed link
    this.registerLink('dashed', shapes.standard.Link, {
      attrs: {
        line: {
          stroke: '#333333',
          strokeWidth: 2,
          strokeDasharray: '5,5',
          targetMarker: {
            type: 'path',
            d: 'M 10 -5 0 0 10 5 z',
            fill: '#333333',
            stroke: '#333333',
          },
        },
      },
      router: { name: 'orthogonal' },
      connector: { name: 'rounded' },
    });

    // Dotted link
    this.registerLink('dotted', shapes.standard.Link, {
      attrs: {
        line: {
          stroke: '#333333',
          strokeWidth: 2,
          strokeDasharray: '2,3',
          targetMarker: {
            type: 'path',
            d: 'M 10 -5 0 0 10 5 z',
            fill: '#333333',
            stroke: '#333333',
          },
        },
      },
      router: { name: 'orthogonal' },
      connector: { name: 'rounded' },
    });

    // Thick link
    this.registerLink('thick', shapes.standard.Link, {
      attrs: {
        line: {
          stroke: '#333333',
          strokeWidth: 4,
          targetMarker: {
            type: 'path',
            d: 'M 10 -5 0 0 10 5 z',
            fill: '#333333',
            stroke: '#333333',
          },
        },
      },
      router: { name: 'orthogonal' },
      connector: { name: 'rounded' },
    });

    // Curved link
    this.registerLink('curved', shapes.standard.Link, {
      attrs: {
        line: {
          stroke: '#333333',
          strokeWidth: 2,
          targetMarker: {
            type: 'path',
            d: 'M 10 -5 0 0 10 5 z',
            fill: '#333333',
            stroke: '#333333',
          },
        },
      },
      router: { name: 'normal' },
      connector: { name: 'smooth' },
    });

    // Bidirectional link
    this.registerLink('bidirectional', shapes.standard.Link, {
      attrs: {
        line: {
          stroke: '#333333',
          strokeWidth: 2,
          sourceMarker: {
            type: 'path',
            d: 'M -10 -5 0 0 -10 5 z',
            fill: '#333333',
            stroke: '#333333',
          },
          targetMarker: {
            type: 'path',
            d: 'M 10 -5 0 0 10 5 z',
            fill: '#333333',
            stroke: '#333333',
          },
        },
      },
      router: { name: 'orthogonal' },
      connector: { name: 'rounded' },
    });

    // No arrow link
    this.registerLink('no-arrow', shapes.standard.Link, {
      attrs: {
        line: {
          stroke: '#333333',
          strokeWidth: 2,
        },
      },
      router: { name: 'orthogonal' },
      connector: { name: 'rounded' },
    });
  }
}
