/**
 * Event manager for handling diagram events using JointJS built-in event system
 */

import type { dia } from '@joint/core';
import type { DiagramEvent, DiagramEventType } from '../../types';
import type { IEventManager } from '../interfaces';

export class EventManager implements IEventManager {
  private graph: dia.Graph | null = null;
  private paper: dia.Paper | null = null;
  private eventMappings: Map<DiagramEventType, string[]> = new Map();
  private eventListeners: Map<DiagramEventType, Function[]> = new Map();

  constructor() {
    this.initializeEventMappings();
  }

  /**
   * Initialize the event manager with graph and paper instances
   */
  public initialize(graph: dia.Graph, paper: dia.Paper): void {
    this.graph = graph;
    this.paper = paper;
    this.setupJointJSEventListeners();
  }

  /**
   * Add event listener for a specific event type
   */
  public addEventListener(eventType: DiagramEventType, callback: Function): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType)!.push(callback);
  }

  /**
   * Remove event listener for a specific event type
   */
  public removeEventListener(eventType: DiagramEventType, callback: Function): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Emit an event to all registered listeners
   */
  public emitEvent(eventType: DiagramEventType, data: any): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      const event: DiagramEvent = { type: eventType, data };
      listeners.forEach((callback) => {
        try {
          callback(event);
        } catch (error) {
          console.error(`Error in event listener for ${eventType}:`, error);
        }
      });
    }
  }

  /**
   * Clear all event listeners
   */
  public clear(): void {
    this.eventListeners.clear();
    if (this.graph) {
      this.graph.off();
    }
    if (this.paper) {
      this.paper.off();
    }
  }

  /**
   * Initialize event mappings between custom events and JointJS events
   */
  private initializeEventMappings(): void {
    this.eventMappings.set('element:added', ['add']);
    this.eventMappings.set('element:removed', ['remove']);
    this.eventMappings.set('element:changed', ['change']);
    this.eventMappings.set('element:moved', ['change:position']);
    this.eventMappings.set('element:resized', ['change:size']);
    this.eventMappings.set('element:selected', ['element:pointerdown']);
    this.eventMappings.set('element:double-click', ['element:pointerdblclick']);
    this.eventMappings.set('link:added', ['add']);
    this.eventMappings.set('link:removed', ['remove']);
    this.eventMappings.set('link:changed', ['change']);
    this.eventMappings.set('link:selected', ['link:pointerdown']);
    this.eventMappings.set('link:double-click', ['link:pointerdblclick']);
    this.eventMappings.set('link:connected', ['link:connect']);
    this.eventMappings.set('link:disconnected', ['link:disconnect']);
    this.eventMappings.set('canvas:clicked', ['blank:pointerdown']);
    // this.eventMappings.set('cell:hover', ['cell:mouseenter']);
    // this.eventMappings.set('cell:unhover', ['cell:mouseleave']);
    this.eventMappings.set('document:saved', []);
    this.eventMappings.set('document:loaded', []);
    this.eventMappings.set('viewport:changed', []);
    this.eventMappings.set('shape:created', []);
    this.eventMappings.set('selection:changed', []);
    this.eventMappings.set('selection:cleared', []);
  }

  /**
   * Setup JointJS event listeners to bridge to custom events
   */
  private setupJointJSEventListeners(): void {
    if (!this.graph || !this.paper) return;

    // Graph events
    this.graph.on('add', (cell: dia.Cell) => {
      if (cell.isElement()) {
        this.emitEvent('element:added', cell);
      } else if (cell.isLink()) {
        this.emitEvent('link:added', cell);
      }
    });

    this.graph.on('remove', (cell: dia.Cell) => {
      if (cell.isElement()) {
        this.emitEvent('element:removed', cell);
      } else if (cell.isLink()) {
        this.emitEvent('link:removed', cell);
      }
    });

    this.graph.on('change:position', (element: dia.Element) => {
      this.emitEvent('element:moved', element);
    });

    this.graph.on('change:size', (element: dia.Element) => {
      this.emitEvent('element:resized', element);
    });

    // Paper events
    this.paper.on('element:pointerdown', (elementView: dia.ElementView) => {
      this.emitEvent('element:selected', elementView.model);
    });

    this.paper.on('element:pointerdblclick', (elementView: dia.ElementView) => {
      this.emitEvent('element:double-click', elementView.model);
    });

    this.paper.on('link:pointerdown', (linkView: dia.LinkView) => {
      this.emitEvent('link:selected', linkView.model);
    });

    this.paper.on('link:pointerdblclick', (linkView: dia.LinkView) => {
      this.emitEvent('link:double-click', linkView.model);
    });

    this.paper.on('link:connect', (linkView: dia.LinkView) => {
      this.emitEvent('link:connected', linkView.model);
    });

    this.paper.on('link:disconnect', (linkView: dia.LinkView) => {
      this.emitEvent('link:disconnected', linkView.model);
    });

    this.paper.on('blank:pointerdown', (evt: dia.Event) => {
      this.emitEvent('canvas:clicked', evt);
    });

    this.paper.on('cell:mouseenter', (cellView: dia.CellView) => {
      this.emitEvent('cell:hover', cellView.model);
    });

    this.paper.on('cell:mouseleave', (cellView: dia.CellView) => {
      this.emitEvent('cell:unhover', cellView.model);
    });
  }

  /**
   * Get all registered event types
   */
  public getRegisteredEventTypes(): DiagramEventType[] {
    return Array.from(this.eventMappings.keys());
  }

  /**
   * Check if there are listeners for a specific event type
   */
  public hasListeners(eventType: DiagramEventType): boolean {
    const listeners = this.eventListeners.get(eventType);
    return listeners ? listeners.length > 0 : false;
  }

  // Paper-specific event setup moved to PaperManager

  // Graph-specific event setup moved to GraphManager

  /**
   * Destroy the event manager and clean up all listeners
   */
  public destroy(): void {
    this.clear();
    this.graph = null;
    this.paper = null;
  }
}
