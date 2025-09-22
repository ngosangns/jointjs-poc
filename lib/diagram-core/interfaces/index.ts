/**
 * Core interfaces for diagram engine components
 */

import { dia } from '@joint/core';
import { DiagramConfig, DiagramElement, DiagramEventType, DiagramLink } from '../../types';

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
 * Interface for paper management
 */
export interface IPaperManager {
  initialize(element: HTMLElement, graph: dia.Graph, config: DiagramConfig): dia.Paper;
  resize(paper: dia.Paper, width: number, height: number): void;
  destroy(paper: dia.Paper): void;
  getScale(paper: dia.Paper): { sx: number; sy: number };
  setupPaperEvents(paper: dia.Paper, eventManager: IEventManager): void;
  calculatePaperCenter(paper: dia.Paper): { x: number; y: number };
  clampScale(scale: number, minScale?: number, maxScale?: number): number;
  zoomIn(paper: dia.Paper, step?: number): void;
  zoomOut(paper: dia.Paper, step?: number): void;

  // Coordinate system methods
  clientToLocal(paper: dia.Paper, clientPoint: { x: number; y: number }): { x: number; y: number };
  localToClient(paper: dia.Paper, localPoint: { x: number; y: number }): { x: number; y: number };
  pageToLocal(paper: dia.Paper, pagePoint: { x: number; y: number }): { x: number; y: number };
  localToPage(paper: dia.Paper, localPoint: { x: number; y: number }): { x: number; y: number };
  paperToLocal(paper: dia.Paper, paperPoint: { x: number; y: number }): { x: number; y: number };
  localToPaper(paper: dia.Paper, localPoint: { x: number; y: number }): { x: number; y: number };
  getPaperCenterLocal(paper: dia.Paper): { x: number; y: number };
  getPaperCenterClient(paper: dia.Paper): { x: number; y: number };
  eventToLocal(paper: dia.Paper, event: MouseEvent | Touch): { x: number; y: number };
  getPaperBounds(paper: dia.Paper): DOMRect | null;
  isPointInPaper(paper: dia.Paper, clientPoint: { x: number; y: number }): boolean;
  getPaperDimensions(paper: dia.Paper): { width: number; height: number };
  getPaperDimensionsClient(paper: dia.Paper): { width: number; height: number };
  
  // Interaction mode control
  setInteractionMode(paper: dia.Paper, mode: { pan: boolean; zoom: boolean; elementMove: boolean }): void;
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
}

/**
 * Interface for toolbar management
 */
export interface IToolbarManager {
  initialize(paper: dia.Paper): void;
  getCurrentMode(): 'select' | 'pan';
  setMode(mode: 'select' | 'pan'): void;
  toggleMode(): void;
  isPanMode(): boolean;
  isSelectMode(): boolean;
  activatePanModeTemporarily(): void;
  restorePreviousMode(): void;
  addModeChangeListener(callback: (event: any) => void): void;
  removeModeChangeListener(callback: (event: any) => void): void;
  setupKeyboardEvents(): void;
  setupMouseEvents(): void;
  updatePaperInteraction(): void;
  destroy(): void;
}

/**
 * Interface for cursor management
 */
export interface ICursorManager {
  initialize(paper: dia.Paper): void;
  setCursor(cursor: string): void;
  getCursor(): string;
  resetCursor(): void;
  setDefaultCursor(cursor: string): void;
  getDefaultCursor(): string;
  setCursorForMode(mode: string, cursor: string): void;
  getCursorForMode(mode: string): string | undefined;
  applyCursorForMode(mode: string): void;
  setTemporaryCursor(cursor: string): void;
  restoreCursor(mode?: string): void;
  onMouseEnter(): void;
  onMouseLeave(): void;
  onModeChange(mode: string): void;
  destroy(): void;
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
  getAvailableShapes(): string[];
  hasShape(type: string): boolean;
  unregisterShape(type: string): boolean;
  getDefaultConfig(type: string): any;
  updateDefaultConfig(type: string, config: any): void;
  getCellNamespaces(): Record<string, any>;
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
