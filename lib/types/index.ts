/**
 * Basic types for the diagram library
 */

export interface DiagramConfig {
  width: number;
  height: number;
  gridSize?: number;
  interactive?: boolean;
  collisionDetection?: boolean;
  background?: {
    color?: string;
    image?: string;
  };
  /**
   * Interaction tuning options for element dragging behavior
   */
  interaction?: {
    /** Movement in pixels before a drag starts when the pointer moves */
    dragStartThresholdPx?: number;
    /** Press-and-hold duration in milliseconds to begin drag without moving */
    pressHoldMs?: number;
  };
}

export interface ElementConfig {
  id?: string;
  position: {
    x: number;
    y: number;
  };
  size: {
    width: number;
    height: number;
  };
  attrs?: Record<string, any>;
}

export interface LinkConfig {
  id?: string;
  type?: string;
  source: {
    id: string;
    port?: string;
  };
  target: {
    id: string;
    port?: string;
  };
  attrs?: Record<string, any>;
}

export interface DiagramElement {
  id: string;
  type: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  properties?: Record<string, any>;
}

export interface DiagramLink {
  id: string;
  type?: string;
  source: string | number;
  target: string | number;
  properties?: Record<string, any>;
}

export interface DiagramData {
  elements: DiagramElement[];
  links: DiagramLink[];
}

export type DiagramEventType =
  // Element events
  | 'element:added'
  | 'element:removed'
  | 'element:changed'
  | 'element:updated'
  | 'elements:batch-updated'
  | 'element:resized'
  | 'element:moved'
  | 'element:selected'
  | 'element:double-click'
  | 'element:dragging'
  | 'element:drag-end'
  // Shape creation events
  | 'shape:created'
  // Link events
  | 'link:added'
  | 'link:removed'
  | 'link:changed'
  | 'link:updated'
  | 'link:selected'
  | 'link:double-click'
  | 'link:connected'
  | 'link:disconnected'
  // Canvas events
  | 'canvas:clicked'
  | 'canvas:tap'
  // Cell events (generic for both elements and links)
  | 'cell:hover'
  | 'cell:unhover'
  // Document lifecycle events
  | 'document:saved'
  | 'document:loaded'
  // Viewport events
  | 'viewport:changed'
  // Mouse wheel events
  | 'wheel:zoom'
  // Keyboard events
  | 'keyboard:zoom-in'
  | 'keyboard:zoom-out'
  | 'keyboard:reset-zoom'
  | 'keyboard:toggle-grid'
  | 'keyboard:delete-selected'
  | 'keyboard:move-selected'
  | 'keyboard:select-all'
  | 'keyboard:deselect-all'
  | 'keyboard:pan-canvas'
  | 'keyboard:fit-viewport'
  | 'keyboard:fit-selection'
  // Selection events
  | 'selection:changed'
  | 'selection:cleared';

export interface DiagramEvent {
  type: DiagramEventType;
  data: any;
}
