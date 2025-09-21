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
  setGrid(paper: dia.Paper, enabled: boolean, gridSize?: number): void;
  resize(paper: dia.Paper, width: number, height: number): void;
  destroy(paper: dia.Paper): void;
  getScale(paper: dia.Paper): { sx: number; sy: number };
  setupPaperEvents(paper: dia.Paper, eventManager: IEventManager): void;
  getMousePosition(): { x: number; y: number };
  calculatePaperCenter(paper: dia.Paper): { x: number; y: number };
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
  clear(graph: dia.Graph): void;
  setupGraphEvents(graph: dia.Graph, eventManager: IEventManager): void;
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
