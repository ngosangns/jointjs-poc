/**
 * Graph manager for handling JointJS graph operations
 */

import { dia } from '@joint/core';
import { DiagramElement } from '../../types';
import { generateId, validateElement } from '../../utils';
import { IEventManager, IGraphManager, IShapeFactory } from '../interfaces';

export class GraphManager implements IGraphManager {
  /**
   * Add an element to the graph
   */
  public addElement(
    graph: dia.Graph,
    elementConfig: Partial<DiagramElement>,
    shapeFactory: IShapeFactory
  ): string {
    if (!validateElement(elementConfig)) {
      throw new Error('Invalid element configuration');
    }

    const id = elementConfig.id || generateId();
    const type = elementConfig.type || 'rectangle';

    try {
      const element = shapeFactory.createShape(type, {
        ...elementConfig,
        id,
      });

      graph.addCell(element);
      return id;
    } catch (error) {
      throw new Error(`Failed to create element of type '${type}': ${error}`);
    }
  }

  /**
   * Clear all cells from the graph
   */
  public clear(graph: dia.Graph): void {
    graph.clear();
  }

  /**
   * Setup graph-specific events and bridge them through the provided EventManager
   */
  public setupGraphEvents(graph: dia.Graph, eventManager: IEventManager): void {
    // Cell addition events
    graph.on('add', (cell) => {
      if (cell.isElement()) {
        eventManager.emitEvent('element:added', {
          id: cell.id,
          element: this.convertToElementData(cell as dia.Element),
        });
      } else if (cell.isLink()) {
        eventManager.emitEvent('link:added', {
          id: cell.id,
          link: this.convertToLinkData(cell as dia.Link),
        });
      }
    });

    // Cell removal events
    graph.on('remove', (cell) => {
      if (cell.isElement()) {
        eventManager.emitEvent('element:removed', {
          id: cell.id,
          element: this.convertToElementData(cell as dia.Element),
        });
      } else if (cell.isLink()) {
        eventManager.emitEvent('link:removed', {
          id: cell.id,
          link: this.convertToLinkData(cell as dia.Link),
        });
      }
    });

    // Cell change events
    graph.on('change', (cell) => {
      if (cell.isElement()) {
        eventManager.emitEvent('element:changed', {
          id: cell.id,
          element: this.convertToElementData(cell as dia.Element),
          changes: (cell as any).changed,
        });
      } else if (cell.isLink()) {
        eventManager.emitEvent('link:changed', {
          id: cell.id,
          link: this.convertToLinkData(cell as dia.Link),
          changes: (cell as any).changed,
        });
      }
    });

    // Position change events
    graph.on('change:position', (element) => {
      if (element.isElement()) {
        eventManager.emitEvent('element:moved', {
          id: element.id,
          element: this.convertToElementData(element as dia.Element),
          newPosition: (element as dia.Element).position(),
          previousPosition: (element as any).previous('position'),
        });
      }
    });

    // Size change events
    graph.on('change:size', (element) => {
      if (element.isElement()) {
        eventManager.emitEvent('element:resized', {
          id: element.id,
          element: this.convertToElementData(element as dia.Element),
          newSize: (element as dia.Element).size(),
          previousSize: (element as any).previous('size'),
        });
      }
    });
  }

  private convertToElementData(element: dia.Element): any {
    return {
      id: String(element.id),
      type: (element as any).get('type') || 'element',
      position: element.position(),
      size: element.size(),
      properties: (element as any).attributes,
    };
  }

  private convertToLinkData(link: dia.Link): any {
    const source = link.source();
    const target = link.target();
    return {
      id: String(link.id),
      type: (link as any).get('type'),
      source: String((source as any).id || ''),
      target: String((target as any).id || ''),
      properties: (link as any).attributes,
    };
  }
}