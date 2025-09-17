/**
 * Data manager for handling serialization and deserialization using JointJS standard format
 */

import { dia } from '@joint/core';
import { IDataManager, IShapeFactory, ILinkFactory } from '../interfaces';
import { DiagramData, DiagramElement, DiagramLink } from '../../types';
import { deepClone } from '../../utils';

export class DataManager implements IDataManager {
  /**
   * Serialize graph to JointJS standard JSON format
   */
  public serialize(graph: dia.Graph): any {
    return graph.toJSON();
  }

  /**
   * Serialize graph to custom DiagramData format (for backward compatibility)
   */
  public serializeToCustomFormat(graph: dia.Graph): DiagramData {
    const elements: DiagramElement[] = [];
    const links: DiagramLink[] = [];

    graph.getCells().forEach((cell) => {
      if (cell.isElement()) {
        const element = cell as dia.Element;
        elements.push({
          id: String(element.id),
          type: element.get('type') || 'element',
          position: element.position(),
          size: element.size(),
          properties: this.sanitizeProperties(element.attributes),
        });
      } else if (cell.isLink()) {
        const link = cell as dia.Link;
        const source = link.source();
        const target = link.target();

        if (source.id && target.id) {
          links.push({
            id: String(link.id),
            source: String(source.id),
            target: String(target.id),
            properties: this.sanitizeProperties(link.attributes),
          });
        }
      }
    });

    return { elements, links };
  }

  /**
   * Deserialize JointJS standard JSON format to graph
   */
  public deserialize(
    data: any,
    graph: dia.Graph,
    shapeFactory?: IShapeFactory,
    linkFactory?: ILinkFactory
  ): void {
    if (this.isJointJSFormat(data)) {
      // Use JointJS standard deserialization
      graph.fromJSON(data);
    } else if (this.isCustomFormat(data)) {
      // Handle custom format for backward compatibility
      this.deserializeCustomFormat(data as DiagramData, graph, shapeFactory!, linkFactory!);
    } else {
      throw new Error('Invalid diagram data format');
    }
  }

  /**
   * Deserialize custom DiagramData format to graph (backward compatibility)
   */
  public deserializeCustomFormat(
    data: DiagramData,
    graph: dia.Graph,
    shapeFactory: IShapeFactory,
    linkFactory: ILinkFactory
  ): void {
    if (!this.validateData(data)) {
      throw new Error('Invalid diagram data format');
    }

    // Clear existing graph
    graph.clear();

    // Create a map to track created elements for link validation
    const createdElements = new Set<string>();

    try {
      // Add elements first
      data.elements.forEach((elementData) => {
        const element = shapeFactory.createShape(elementData.type, elementData);
        graph.addCell(element);
        createdElements.add(elementData.id);
      });

      // Then add links, but only if both source and target elements exist
      data.links.forEach((linkData) => {
        if (
          createdElements.has(String(linkData.source)) &&
          createdElements.has(String(linkData.target))
        ) {
          const link = linkFactory.createLink('standard', linkData);
          graph.addCell(link);
        } else {
          console.warn(`Skipping link ${linkData.id}: source or target element not found`);
        }
      });
    } catch (error) {
      // If deserialization fails, clear the graph to prevent partial state
      graph.clear();
      throw new Error(`Failed to deserialize diagram data: ${error}`);
    }
  }

  /**
   * Validate diagram data structure
   */
  public validateData(data: DiagramData): boolean {
    if (!data || typeof data !== 'object') {
      return false;
    }

    if (!Array.isArray(data.elements) || !Array.isArray(data.links)) {
      return false;
    }

    // Validate elements
    for (const element of data.elements) {
      if (!this.validateElement(element)) {
        return false;
      }
    }

    // Validate links
    for (const link of data.links) {
      if (!this.validateLink(link)) {
        return false;
      }
    }

    // Check for orphaned links (links referencing non-existent elements)
    const elementIds = new Set(data.elements.map((e) => e.id));
    for (const link of data.links) {
      if (!elementIds.has(String(link.source)) || !elementIds.has(String(link.target))) {
        console.warn(`Link ${link.id} references non-existent elements`);
        // Don't fail validation, just warn - we'll skip these links during deserialization
      }
    }

    return true;
  }

  /**
   * Export diagram data as JSON string
   */
  public exportToJSON(graph: dia.Graph, pretty: boolean = false): string {
    const data = this.serialize(graph);
    return JSON.stringify(data, null, pretty ? 2 : 0);
  }

  /**
   * Import diagram data from JSON string
   */
  public importFromJSON(
    jsonString: string,
    graph: dia.Graph,
    shapeFactory?: IShapeFactory,
    linkFactory?: ILinkFactory
  ): void {
    try {
      const data = JSON.parse(jsonString);
      this.deserialize(data, graph, shapeFactory, linkFactory);
    } catch (error) {
      throw new Error(`Failed to import JSON data: ${error}`);
    }
  }

  /**
   * Create a deep copy of diagram data
   */
  public cloneData(data: DiagramData): DiagramData {
    return deepClone(data);
  }

  /**
   * Merge two diagram data objects
   */
  public mergeData(baseData: DiagramData, additionalData: DiagramData): DiagramData {
    const merged: DiagramData = {
      elements: [...baseData.elements],
      links: [...baseData.links],
    };

    // Add elements that don't already exist
    const existingElementIds = new Set(merged.elements.map((e) => e.id));
    additionalData.elements.forEach((element) => {
      if (!existingElementIds.has(element.id)) {
        merged.elements.push(deepClone(element));
      }
    });

    // Add links that don't already exist
    const existingLinkIds = new Set(merged.links.map((l) => l.id));
    additionalData.links.forEach((link) => {
      if (!existingLinkIds.has(link.id)) {
        merged.links.push(deepClone(link));
      }
    });

    return merged;
  }

  /**
   * Get statistics about the diagram data
   */
  public getDataStatistics(data: DiagramData): {
    elementCount: number;
    linkCount: number;
    elementTypes: Record<string, number>;
    orphanedLinks: number;
  } {
    const elementIds = new Set(data.elements.map((e) => e.id));
    const elementTypes: Record<string, number> = {};

    data.elements.forEach((element) => {
      elementTypes[element.type] = (elementTypes[element.type] || 0) + 1;
    });

    const orphanedLinks = data.links.filter(
      (link) => !elementIds.has(String(link.source)) || !elementIds.has(String(link.target))
    ).length;

    return {
      elementCount: data.elements.length,
      linkCount: data.links.length,
      elementTypes,
      orphanedLinks,
    };
  }

  /**
   * Validate individual element
   */
  private validateElement(element: DiagramElement): boolean {
    return (
      typeof element.id === 'string' &&
      typeof element.type === 'string' &&
      element.position &&
      typeof element.position.x === 'number' &&
      typeof element.position.y === 'number' &&
      element.size &&
      typeof element.size.width === 'number' &&
      typeof element.size.height === 'number'
    );
  }

  /**
   * Validate individual link
   */
  private validateLink(link: DiagramLink): boolean {
    return (
      typeof link.id === 'string' &&
      (typeof link.source === 'string' || typeof link.source === 'number') &&
      (typeof link.target === 'string' || typeof link.target === 'number')
    );
  }

  /**
   * Check if data is in JointJS standard format
   */
  private isJointJSFormat(data: any): boolean {
    return data && typeof data === 'object' && Array.isArray(data.cells);
  }

  /**
   * Check if data is in custom DiagramData format
   */
  private isCustomFormat(data: any): boolean {
    return (
      data && typeof data === 'object' && Array.isArray(data.elements) && Array.isArray(data.links)
    );
  }

  /**
   * Sanitize properties to remove circular references and non-serializable data
   */
  private sanitizeProperties(properties: any): Record<string, any> {
    try {
      // Use JSON stringify/parse to remove circular references and functions
      return JSON.parse(JSON.stringify(properties));
    } catch (error) {
      console.warn('Failed to sanitize properties:', error);
      return {};
    }
  }
}
