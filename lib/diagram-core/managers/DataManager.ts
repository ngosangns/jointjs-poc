import { dia } from '@joint/core';
import { DiagramData, DiagramElement, DiagramLink } from '../../types';
import { deepClone } from '../../utils';
import { IDataManager, ILinkFactory, IShapeFactory } from '../interfaces';

export class DataManager implements IDataManager {
  public serialize(graph: dia.Graph): any {
    return graph.toJSON();
  }

  public deserialize(
    data: any,
    graph: dia.Graph,
    shapeFactory?: IShapeFactory,
    linkFactory?: ILinkFactory
  ): void {
    // Validate required parameters
    if (!graph) {
      throw new Error('Graph instance is required for deserialization');
    }

    if (!data) {
      throw new Error('Data is required for deserialization');
    }

    try {
      if (this.isJointJSFormat(data)) {
        // Use JointJS standard deserialization with cell namespaces for v4.0.0 compatibility
        const cellNamespaces = shapeFactory?.getCellNamespaces() || {};
        graph.fromJSON(data, { cellNamespaces });
      } else if (this.isCustomFormat(data)) {
        // Handle custom format for backward compatibility
        if (!shapeFactory || !linkFactory) {
          throw new Error('ShapeFactory and LinkFactory are required for custom format deserialization');
        }
        this.deserializeCustomFormat(data as DiagramData, graph, shapeFactory, linkFactory);
      } else {
        throw new Error('Invalid diagram data format: data must be either JointJS format (with cells array) or custom format (with elements and links arrays)');
      }
    } catch (error) {
      // Clear graph on deserialization failure to prevent partial state
      graph.clear();
      throw new Error(`Deserialization failed: ${error}`);
    }
  }

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
        const type = this.normalizeShapeType(elementData.type);
        const element = shapeFactory.createShape(type, elementData);
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
   * Normalize JointJS type names to factory keys
   */
  private normalizeShapeType(type: string): string {
    if (!type) return 'rectangle';
    // Map common JointJS standard types to our registered keys
    if (type === 'standard.Rectangle' || type.endsWith('.Rectangle')) return 'rectangle';
    if (type === 'standard.Circle' || type.endsWith('.Circle')) return 'circle';
    return type;
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
      // Validate input
      if (!jsonString || typeof jsonString !== 'string') {
        throw new Error('Invalid JSON string provided');
      }

      if (!jsonString.trim()) {
        throw new Error('Empty JSON string provided');
      }

      const data = JSON.parse(jsonString);

      // Additional validation for parsed data
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid JSON structure: data must be an object');
      }

      this.deserialize(data, graph, shapeFactory, linkFactory);
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(`Invalid JSON format: ${error.message}`);
      }
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
}
