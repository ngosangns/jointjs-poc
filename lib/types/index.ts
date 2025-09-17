/**
 * Basic types for the diagram library
 */

export interface DiagramConfig {
  width: number;
  height: number;
  gridSize?: number;
  interactive?: boolean;
  background?: {
    color?: string;
    image?: string;
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
  | 'element:resized'
  | 'element:moved'
  | 'element:selected'
  | 'element:double-click'
  // Link events
  | 'link:added'
  | 'link:removed'
  | 'link:changed'
  | 'link:selected'
  | 'link:double-click'
  | 'link:connected'
  | 'link:disconnected'
  // Canvas events
  | 'canvas:clicked'
  // Cell events (generic for both elements and links)
  | 'cell:hover'
  | 'cell:unhover';

export interface DiagramEvent {
  type: DiagramEventType;
  data: any;
}
