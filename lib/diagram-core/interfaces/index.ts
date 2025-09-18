/**
 * Core interfaces for diagram engine components
 */

import { dia } from '@joint/core';
import {
  DiagramConfig,
  DiagramData,
  DiagramElement,
  DiagramEventType,
  DiagramLink,
} from '../../types';

/**
 * Interface for event management
 */
export interface IEventManager {
  initialize(graph: dia.Graph, paper: dia.Paper): void;
  addEventListener(eventType: DiagramEventType, callback: Function): void;
  removeEventListener(eventType: DiagramEventType, callback: Function): void;
  emitEvent(eventType: DiagramEventType, data: any): void;
  clear(): void;
  getRegisteredEventTypes(): DiagramEventType[];
  hasListeners(eventType: DiagramEventType): boolean;
  destroy(): void;
}

/**
 * Interface for data serialization/deserialization
 */
export interface IDataManager {
  serialize(graph: dia.Graph): any;
  serializeToCustomFormat(graph: dia.Graph): DiagramData;
  deserialize(
    data: any,
    graph: dia.Graph,
    shapeFactory?: IShapeFactory,
    linkFactory?: ILinkFactory
  ): void;
  deserializeCustomFormat(
    data: DiagramData,
    graph: dia.Graph,
    shapeFactory: IShapeFactory,
    linkFactory: ILinkFactory
  ): void;
  validateData(data: DiagramData): boolean;
  exportToJSON(graph: dia.Graph, pretty?: boolean): string;
  importFromJSON(
    jsonString: string,
    graph: dia.Graph,
    shapeFactory?: IShapeFactory,
    linkFactory?: ILinkFactory
  ): void;
}

/**
 * Interface for paper management
 */
export interface IPaperManager {
  initialize(element: HTMLElement, graph: dia.Graph, config: DiagramConfig): dia.Paper;
  setupEvents(paper: dia.Paper, eventManager: IEventManager): void;
  setGrid(paper: dia.Paper, enabled: boolean, gridSize?: number): void;
  resize(paper: dia.Paper, width: number, height: number): void;
  destroy(paper: dia.Paper): void;
  fitToContent(paper: dia.Paper, padding?: number): void;
  scale(paper: dia.Paper, scaleX: number, scaleY?: number): void;
  getScale(paper: dia.Paper): { sx: number; sy: number };
  translate(paper: dia.Paper, dx: number, dy: number): void;
}

/**
 * Interface for graph management
 */
export interface IGraphManager {
  addElement(
    graph: dia.Graph,
    elementConfig: Partial<DiagramElement>,
    shapeFactory: IShapeFactory
  ): string;
  addLink(graph: dia.Graph, linkConfig: Partial<DiagramLink>, linkFactory: ILinkFactory): string;
  removeElement(graph: dia.Graph, elementId: string): void;
  removeLink(graph: dia.Graph, linkId: string): void;
  clear(graph: dia.Graph): void;
  setupEvents(graph: dia.Graph, eventManager: IEventManager): void;

  // Query methods
  getElement(graph: dia.Graph, elementId: string): dia.Element | null;
  getLink(graph: dia.Graph, linkId: string): dia.Link | null;
  getAllElements(graph: dia.Graph): dia.Element[];
  getAllLinks(graph: dia.Graph): dia.Link[];
  getConnectedLinks(graph: dia.Graph, elementId: string): dia.Link[];
  areElementsConnected(graph: dia.Graph, sourceId: string, targetId: string): boolean;

  // Embedding and grouping methods
  embedElement(graph: dia.Graph, parentId: string, childId: string): void;
  unembedElement(graph: dia.Graph, elementId: string): void;
  getEmbeddedElements(graph: dia.Graph, parentId: string, deep?: boolean): dia.Element[];
  getParentElement(graph: dia.Graph, elementId: string): dia.Element | null;
  isElementEmbedded(graph: dia.Graph, elementId: string, parentId?: string): boolean;
  getElementAncestors(graph: dia.Graph, elementId: string): dia.Element[];
  fitParentToChildren(graph: dia.Graph, parentId: string, padding?: number): void;
  createGroup(
    graph: dia.Graph,
    elementIds: string[],
    groupConfig?: Partial<DiagramElement>
  ): string;
  ungroup(graph: dia.Graph, groupId: string): string[];
}

/**
 * Interface for tools management
 */
export interface IToolsManager {
  initialize(paper: dia.Paper): void;
  registerElementTools(name: string, tools: dia.ToolView[]): void;
  registerLinkTools(name: string, tools: dia.ToolView[]): void;
  showElementTools(elementView: dia.ElementView, toolsName?: string): void;
  hideElementTools(elementView: dia.ElementView): void;
  showLinkTools(linkView: dia.LinkView, toolsName?: string): void;
  hideLinkTools(linkView: dia.LinkView): void;
  showAllTools(): void;
  hideAllTools(): void;
  removeAllTools(): void;
  createElementTool(type: string, options?: any): dia.ToolView;
  createLinkTool(type: string, options?: any): dia.ToolView;
  getElementTools(name: string): dia.ToolView[] | undefined;
  getLinkTools(name: string): dia.ToolView[] | undefined;
  getElementToolNames(): string[];
  getLinkToolNames(): string[];
  unregisterElementTools(name: string): boolean;
  unregisterLinkTools(name: string): boolean;
  destroy(): void;
  // Grid controls
  setGridEnabled(enabled: boolean): void;
  setGridSize(size: number): void;
  getGridEnabled(): boolean;
  getGridSize(): number;
  toggleGrid(): boolean;
}

// Models
export * from './Diagram';
export * from './Page';
export * from './Shape';
export * from './Port';
export * from './Link';
export * from './Label';
export * from './Layer';
export * from './Group';
export * from './Style';
export * from './Template';
export * from './DocumentSettings';
export * from './HistoryEntry';

/**
 * Interface for shape factory
 */
export interface IShapeFactory {
  createShape(type: string, config: Partial<DiagramElement>): dia.Element;
  registerShape(type: string, shapeClass: any, defaultConfig?: any): void;
  registerCustomShape(type: string, namespace: string, shapeDefinition: any): void;
  defineShape(type: string, namespace: string, protoProps: any, staticProps?: any): any;
  getAvailableShapes(): string[];
  hasShape(type: string): boolean;
  unregisterShape(type: string): boolean;
  getDefaultConfig(type: string): any;
  updateDefaultConfig(type: string, config: any): void;
  getCellNamespaces(): Record<string, any>;
  getShapesInNamespace(namespace: string): string[];
  createShapeWithPorts(
    type: string,
    config: Partial<DiagramElement>,
    portsConfig?: any
  ): dia.Element;
}

/**
 * Interface for link factory
 */
export interface ILinkFactory {
  createLink(type: string, config: Partial<DiagramLink>): dia.Link;
  registerLink(type: string, linkClass: any): void;
  getAvailableLinks(): string[];
}

/**
 * Shape configuration for custom shapes
 */
export interface ShapeConfig {
  type: string;
  defaultAttrs?: Record<string, any>;
  ports?: {
    groups?: Record<string, any>;
    items?: any[];
  };
}

/**
 * Link factory configuration for custom links
 */
export interface LinkFactoryConfig {
  type: string;
  defaultAttrs?: Record<string, any>;
  router?: string;
  connector?: string;
}
