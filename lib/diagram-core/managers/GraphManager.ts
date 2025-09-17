/**
 * Graph manager for handling JointJS graph operations
 */

import { dia, shapes } from '@joint/core';
import { IGraphManager, IEventManager, IShapeFactory, ILinkFactory } from '../interfaces';
import { DiagramElement, DiagramLink } from '../../types';
import { generateId, validateElement, validateLink } from '../../utils';

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
   * Add a link to the graph
   */
  public addLink(
    graph: dia.Graph,
    linkConfig: Partial<DiagramLink>,
    linkFactory: ILinkFactory
  ): string {
    if (!validateLink(linkConfig)) {
      throw new Error('Invalid link configuration');
    }

    const id = linkConfig.id || generateId();
    const type = linkConfig.type || 'standard'; // Use provided type or default to 'standard'

    try {
      const link = linkFactory.createLink(type, {
        ...linkConfig,
        id,
      });

      graph.addCell(link);
      return id;
    } catch (error) {
      throw new Error(`Failed to create link: ${error}`);
    }
  }

  /**
   * Remove an element from the graph
   */
  public removeElement(graph: dia.Graph, elementId: string): void {
    const element = graph.getCell(elementId);
    if (element && element.isElement()) {
      // Remove all connected links first
      const connectedLinks = graph.getConnectedLinks(element);
      connectedLinks.forEach((link) => link.remove());

      // Then remove the element
      element.remove();
    }
  }

  /**
   * Remove a link from the graph
   */
  public removeLink(graph: dia.Graph, linkId: string): void {
    const link = graph.getCell(linkId);
    if (link && link.isLink()) {
      link.remove();
    }
  }

  /**
   * Clear all cells from the graph
   */
  public clear(graph: dia.Graph): void {
    graph.clear();
  }

  /**
   * Setup graph-specific events
   */
  public setupEvents(graph: dia.Graph, eventManager: IEventManager): void {
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
          changes: cell.changed,
        });
      } else if (cell.isLink()) {
        eventManager.emitEvent('link:changed', {
          id: cell.id,
          link: this.convertToLinkData(cell as dia.Link),
          changes: cell.changed,
        });
      }
    });

    // Position change events
    graph.on('change:position', (element) => {
      if (element.isElement()) {
        eventManager.emitEvent('element:moved', {
          id: element.id,
          element: this.convertToElementData(element as dia.Element),
          newPosition: element.position(),
          previousPosition: element.previous('position'),
        });
      }
    });

    // Size change events
    graph.on('change:size', (element) => {
      if (element.isElement()) {
        eventManager.emitEvent('element:resized', {
          id: element.id,
          element: this.convertToElementData(element as dia.Element),
          newSize: element.size(),
          previousSize: element.previous('size'),
        });
      }
    });
  }

  /**
   * Get element by ID
   */
  public getElement(graph: dia.Graph, elementId: string): dia.Element | null {
    const cell = graph.getCell(elementId);
    return cell && cell.isElement() ? (cell as dia.Element) : null;
  }

  /**
   * Get link by ID
   */
  public getLink(graph: dia.Graph, linkId: string): dia.Link | null {
    const cell = graph.getCell(linkId);
    return cell && cell.isLink() ? (cell as dia.Link) : null;
  }

  /**
   * Get all elements in the graph
   */
  public getAllElements(graph: dia.Graph): dia.Element[] {
    return graph.getElements();
  }

  /**
   * Get all links in the graph
   */
  public getAllLinks(graph: dia.Graph): dia.Link[] {
    return graph.getLinks();
  }

  /**
   * Get connected links for an element
   */
  public getConnectedLinks(graph: dia.Graph, elementId: string): dia.Link[] {
    const element = this.getElement(graph, elementId);
    return element ? graph.getConnectedLinks(element) : [];
  }

  /**
   * Check if two elements are connected
   */
  public areElementsConnected(graph: dia.Graph, sourceId: string, targetId: string): boolean {
    const sourceElement = this.getElement(graph, sourceId);
    const targetElement = this.getElement(graph, targetId);

    if (!sourceElement || !targetElement) {
      return false;
    }

    const links = graph.getConnectedLinks(sourceElement);
    return links.some((link) => {
      const source = link.source();
      const target = link.target();
      return (
        (source.id === sourceId && target.id === targetId) ||
        (source.id === targetId && target.id === sourceId)
      );
    });
  }

  /**
   * Embed an element into a parent element
   */
  public embedElement(graph: dia.Graph, parentId: string, childId: string): void {
    const parent = this.getElement(graph, parentId);
    const child = this.getElement(graph, childId);

    if (!parent || !child) {
      throw new Error('Parent or child element not found');
    }

    parent.embed(child);
  }

  /**
   * Unembed an element from its parent
   */
  public unembedElement(graph: dia.Graph, elementId: string): void {
    const element = this.getElement(graph, elementId);
    if (!element) {
      throw new Error('Element not found');
    }

    const parent = element.getParentCell();
    if (parent) {
      parent.unembed(element);
    }
  }

  /**
   * Get all embedded children of an element
   */
  public getEmbeddedElements(
    graph: dia.Graph,
    parentId: string,
    deep: boolean = false
  ): dia.Element[] {
    const parent = this.getElement(graph, parentId);
    if (!parent) {
      return [];
    }

    return parent.getEmbeddedCells({ deep }).filter((cell) => cell.isElement()) as dia.Element[];
  }

  /**
   * Get the parent element of an embedded element
   */
  public getParentElement(graph: dia.Graph, elementId: string): dia.Element | null {
    const element = this.getElement(graph, elementId);
    if (!element) {
      return null;
    }

    const parent = element.getParentCell();
    return parent && parent.isElement() ? (parent as dia.Element) : null;
  }

  /**
   * Check if an element is embedded in another element
   */
  public isElementEmbedded(graph: dia.Graph, elementId: string, parentId?: string): boolean {
    const element = this.getElement(graph, elementId);
    if (!element) {
      return false;
    }

    if (parentId) {
      const parent = this.getElement(graph, parentId);
      return parent ? element.isEmbeddedIn(parent) : false;
    }

    return element.isEmbedded();
  }

  /**
   * Get all ancestors of an element
   */
  public getElementAncestors(graph: dia.Graph, elementId: string): dia.Element[] {
    const element = this.getElement(graph, elementId);
    if (!element) {
      return [];
    }

    return element.getAncestors().filter((cell) => cell.isElement()) as dia.Element[];
  }

  /**
   * Fit parent element to contain all its children
   */
  public fitParentToChildren(graph: dia.Graph, parentId: string, padding: number = 10): void {
    const parent = this.getElement(graph, parentId);
    if (!parent) {
      throw new Error('Parent element not found');
    }

    const children = this.getEmbeddedElements(graph, parentId);
    if (children.length === 0) {
      return;
    }

    // Calculate bounding box of all children
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;

    children.forEach((child) => {
      const bbox = child.getBBox();
      minX = Math.min(minX, bbox.x);
      minY = Math.min(minY, bbox.y);
      maxX = Math.max(maxX, bbox.x + bbox.width);
      maxY = Math.max(maxY, bbox.y + bbox.height);
    });

    // Update parent position and size
    parent.set({
      position: { x: minX - padding, y: minY - padding },
      size: {
        width: maxX - minX + 2 * padding,
        height: maxY - minY + 2 * padding,
      },
    });
  }

  /**
   * Create a group from selected elements
   */
  public createGroup(
    graph: dia.Graph,
    elementIds: string[],
    groupConfig?: Partial<DiagramElement>
  ): string {
    if (elementIds.length === 0) {
      throw new Error('No elements provided for grouping');
    }

    const elements = elementIds
      .map((id) => this.getElement(graph, id))
      .filter(Boolean) as dia.Element[];
    if (elements.length === 0) {
      throw new Error('No valid elements found for grouping');
    }

    // Calculate bounding box of all elements
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;

    elements.forEach((element) => {
      const bbox = element.getBBox();
      minX = Math.min(minX, bbox.x);
      minY = Math.min(minY, bbox.y);
      maxX = Math.max(maxX, bbox.x + bbox.width);
      maxY = Math.max(maxY, bbox.y + bbox.height);
    });

    const padding = 20;

    // Create group element
    const groupElementConfig: Partial<DiagramElement> = {
      type: 'rectangle',
      position: { x: minX - padding, y: minY - padding },
      size: {
        width: maxX - minX + 2 * padding,
        height: maxY - minY + 2 * padding,
      },
      properties: {
        attrs: {
          body: {
            fill: 'rgba(255, 255, 255, 0.1)',
            stroke: '#333333',
            strokeWidth: 2,
            strokeDasharray: '5,5',
          },
          label: {
            text: 'Group',
            fontSize: 12,
            fill: '#666666',
          },
        },
      },
      ...groupConfig,
    };

    const groupId = this.addElement(graph, groupElementConfig, {
      createShape: (type: string, config: Partial<DiagramElement>) => {
        // Use a simple factory method for group creation
        return new shapes.standard.Rectangle({
          id: config.id,
          position: config.position,
          size: config.size,
          attrs: config.properties?.['attrs'] || {},
        });
      },
    } as any);

    // Embed all elements into the group
    elements.forEach((element) => {
      this.embedElement(graph, groupId, String(element.id));
    });

    return groupId;
  }

  /**
   * Ungroup elements (remove from parent and delete group)
   */
  public ungroup(graph: dia.Graph, groupId: string): string[] {
    const group = this.getElement(graph, groupId);
    if (!group) {
      throw new Error('Group element not found');
    }

    const children = this.getEmbeddedElements(graph, groupId);
    const childIds = children.map((child) => String(child.id));

    // Unembed all children
    children.forEach((child) => {
      group.unembed(child);
    });

    // Remove the group element
    this.removeElement(graph, groupId);

    return childIds;
  }

  /**
   * Convert JointJS element to DiagramElement data
   */
  private convertToElementData(element: dia.Element): DiagramElement {
    return {
      id: String(element.id),
      type: element.get('type') || 'element',
      position: element.position(),
      size: element.size(),
      properties: element.attributes,
    };
  }

  /**
   * Convert JointJS link to DiagramLink data
   */
  private convertToLinkData(link: dia.Link): DiagramLink {
    const source = link.source();
    const target = link.target();

    return {
      id: String(link.id),
      type: link.get('type'),
      source: String(source.id || ''),
      target: String(target.id || ''),
      properties: link.attributes,
    };
  }
}
