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
    this.eventMappings.set('cell:hover', ['cell:mouseenter']);
    this.eventMappings.set('cell:unhover', ['cell:mouseleave']);
    // Additional logical events (emitted manually by engine/managers)
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

  /**
   * Setup paper-specific events including touch gestures
   */
  public setupPaperEvents(paper: dia.Paper): void {
    // Element events with drag threshold and press-hold activation
    let potentialDrag = false;
    let dragStarted = false;
    let origin = { x: 0, y: 0 };
    let holdTimer: any = null;
    const dragThreshold = (paper.options as any).interaction?.dragStartThresholdPx ?? 4;
    const pressHoldMs = (paper.options as any).interaction?.pressHoldMs ?? 200;

    paper.on('element:pointerdown', (elementView: any, evt: any) => {
      potentialDrag = true;
      dragStarted = false;
      origin = { x: evt.clientX, y: evt.clientY };

      // emit selection immediately on down (no clearing selection here)
      this.emitEvent('element:selected', {
        id: elementView.model.id,
        element: elementView.model,
        position: { x: evt.clientX, y: evt.clientY },
      });

      // start press-hold timer to initiate drag without movement
      if (holdTimer) clearTimeout(holdTimer);
      holdTimer = setTimeout(() => {
        if (potentialDrag && !dragStarted) {
          dragStarted = true;
          this.emitEvent('element:dragging', {
            id: elementView.model.id,
            element: elementView.model,
            position: { x: evt.clientX, y: evt.clientY },
          });
        }
      }, pressHoldMs);
    });

    // Element drag events for movement with threshold
    paper.on('element:pointermove', (elementView: any, evt: any) => {
      if (evt.buttons !== 1) return;
      const dx = Math.abs(evt.clientX - origin.x);
      const dy = Math.abs(evt.clientY - origin.y);
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (potentialDrag && !dragStarted && dist >= dragThreshold) {
        dragStarted = true;
      }
      if (dragStarted) {
        this.emitEvent('element:dragging', {
          id: elementView.model.id,
          element: elementView.model,
          position: { x: evt.clientX, y: evt.clientY },
        });
      }
    });

    paper.on('element:pointerup', (elementView: any, evt: any) => {
      if (holdTimer) clearTimeout(holdTimer);
      if (dragStarted) {
        this.emitEvent('element:drag-end', {
          id: elementView.model.id,
          element: elementView.model,
          position: { x: evt.clientX, y: evt.clientY },
        });
      }
      potentialDrag = false;
      dragStarted = false;
    });

    paper.on('element:pointerdblclick', (elementView, evt) => {
      this.emitEvent('element:double-click', {
        id: elementView.model.id,
        element: elementView.model,
        position: { x: evt.clientX, y: evt.clientY },
      });
    });

    // JointJS built-in drag events
    paper.on('element:move', (elementView, evt) => {
      this.emitEvent('element:moved', {
        id: elementView.model.id,
        element: elementView.model,
        position: { x: evt.clientX, y: evt.clientY },
      });
    });

    // Link events
    paper.on('link:pointerdown', (linkView, evt) => {
      this.emitEvent('link:selected', {
        id: linkView.model.id,
        link: linkView.model,
        position: { x: evt.clientX, y: evt.clientY },
      });
    });

    paper.on('link:pointerdblclick', (linkView, evt) => {
      this.emitEvent('link:double-click', {
        id: linkView.model.id,
        link: linkView.model,
        position: { x: evt.clientX, y: evt.clientY },
      });
    });

    // Paper events
    paper.on('blank:pointerdown', (evt) => {
      this.emitEvent('canvas:clicked', {
        position: { x: evt.clientX, y: evt.clientY },
      });
    });

    // Emit viewport changes on pan/translate and scale
    const emitViewport = () => {
      const scale = paper.scale().sx;
      const t = paper.translate();
      this.emitEvent('viewport:changed', { zoom: scale, pan: { x: t.tx, y: t.ty } });
    };
    paper.on('blank:pointermove', () => emitViewport());
    paper.on('blank:pointerup', () => emitViewport());
    paper.on('translate', () => emitViewport());
    paper.on('scale', () => emitViewport());

    paper.on('cell:mouseover', (cellView) => {
      this.emitEvent('cell:hover', {
        id: cellView.model.id,
        cell: cellView.model,
        type: cellView.model.isElement() ? 'element' : 'link',
      });
    });

    paper.on('cell:mouseout', (cellView) => {
      this.emitEvent('cell:unhover', {
        id: cellView.model.id,
        cell: cellView.model,
        type: cellView.model.isElement() ? 'element' : 'link',
      });
    });

    // Connection events
    paper.on('link:connect', (linkView) => {
      this.emitEvent('link:connected', {
        id: linkView.model.id,
        link: linkView.model,
        source: linkView.model.source(),
        target: linkView.model.target(),
      });
    });

    paper.on('link:disconnect', (linkView) => {
      this.emitEvent('link:disconnected', {
        id: linkView.model.id,
        link: linkView.model,
      });
    });

    // Touch gesture events
    this.setupTouchEvents(paper);
  }

  /**
   * Setup touch gesture events for pan/zoom and element interaction
   */
  private setupTouchEvents(paper: dia.Paper): void {
    const paperElement = paper.el;
    if (!paperElement) return;

    let touchStartTime = 0;
    let touchStartDistance = 0;
    let touchStartScale = 1;
    let touchStartTranslate = { tx: 0, ty: 0 };
    let lastTouchCenter = { x: 0, y: 0 };
    let isPanning = false;
    let isZooming = false;

    // Touch start
    paperElement.addEventListener(
      'touchstart',
      (evt: TouchEvent) => {
        evt.preventDefault();
        touchStartTime = Date.now();

        if (evt.touches.length === 1) {
          // Single touch - potential pan or element selection
          const touch = evt.touches[0];
          lastTouchCenter = { x: touch.clientX, y: touch.clientY };
          touchStartTranslate = paper.translate();
          isPanning = true;
          isZooming = false;

          // Check if touching an element
          const elementViews = paper.findViewsFromPoint({ x: touch.clientX, y: touch.clientY });
          if (elementViews.length > 0 && elementViews[0].model.isElement()) {
            const elementView = elementViews[0];
            this.emitEvent('element:selected', {
              id: elementView.model.id,
              element: elementView.model,
              position: { x: touch.clientX, y: touch.clientY },
            });
          }
        } else if (evt.touches.length === 2) {
          // Two touches - pinch to zoom
          isPanning = false;
          isZooming = true;

          const touch1 = evt.touches[0];
          const touch2 = evt.touches[1];

          touchStartDistance = this.getTouchDistance(touch1, touch2);
          touchStartScale = paper.scale().sx;
          touchStartTranslate = paper.translate();

          // Calculate center point between touches
          lastTouchCenter = {
            x: (touch1.clientX + touch2.clientX) / 2,
            y: (touch1.clientY + touch2.clientY) / 2,
          };
        }
      },
      { passive: false }
    );

    // Touch move
    paperElement.addEventListener(
      'touchmove',
      (evt: TouchEvent) => {
        evt.preventDefault();

        if (evt.touches.length === 1 && isPanning) {
          // Single touch pan
          const touch = evt.touches[0];
          const dx = touch.clientX - lastTouchCenter.x;
          const dy = touch.clientY - lastTouchCenter.y;

          paper.translate(touchStartTranslate.tx + dx, touchStartTranslate.ty + dy);

          this.emitEvent('viewport:changed', {
            zoom: paper.scale().sx,
            pan: { x: paper.translate().tx, y: paper.translate().ty },
          });

          lastTouchCenter = { x: touch.clientX, y: touch.clientY };
        } else if (evt.touches.length === 2 && isZooming) {
          // Two touch pinch to zoom
          const touch1 = evt.touches[0];
          const touch2 = evt.touches[1];

          const currentDistance = this.getTouchDistance(touch1, touch2);
          const scaleChange = currentDistance / touchStartDistance;
          const newScale = Math.max(0.1, Math.min(5.0, touchStartScale * scaleChange));

          // Calculate new center point
          const newCenter = {
            x: (touch1.clientX + touch2.clientX) / 2,
            y: (touch1.clientY + touch2.clientY) / 2,
          };

          // Apply zoom centered on touch point
          const scale = newScale / touchStartScale;
          const offsetX = (newCenter.x - lastTouchCenter.x) * (1 - scale);
          const offsetY = (newCenter.y - lastTouchCenter.y) * (1 - scale);

          paper.scale(newScale);
          paper.translate(touchStartTranslate.tx + offsetX, touchStartTranslate.ty + offsetY);

          this.emitEvent('viewport:changed', {
            zoom: paper.scale().sx,
            pan: { x: paper.translate().tx, y: paper.translate().ty },
          });
        }
      },
      { passive: false }
    );

    // Touch end
    paperElement.addEventListener(
      'touchend',
      (evt: TouchEvent) => {
        evt.preventDefault();

        const touchDuration = Date.now() - touchStartTime;

        if (evt.touches.length === 0) {
          // All touches ended
          isPanning = false;
          isZooming = false;

          // Handle tap (short touch without movement)
          if (touchDuration < 300 && !isPanning && !isZooming) {
            // This could be a tap - emit canvas click event
            this.emitEvent('canvas:clicked', {
              position: lastTouchCenter,
            });
          }
        } else if (evt.touches.length === 1 && isZooming) {
          // Transition from zoom to pan
          isZooming = false;
          isPanning = true;
          const touch = evt.touches[0];
          lastTouchCenter = { x: touch.clientX, y: touch.clientY };
          touchStartTranslate = paper.translate();
        }
      },
      { passive: false }
    );
  }

  /**
   * Calculate distance between two touch points
   */
  private getTouchDistance(touch1: Touch, touch2: Touch): number {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Setup graph-specific events
   */
  public setupGraphEvents(graph: dia.Graph): void {
    // Cell addition events
    graph.on('add', (cell) => {
      if (cell.isElement()) {
        this.emitEvent('element:added', {
          id: cell.id,
          element: this.convertToElementData(cell as dia.Element),
        });
      } else if (cell.isLink()) {
        this.emitEvent('link:added', {
          id: cell.id,
          link: this.convertToLinkData(cell as dia.Link),
        });
      }
    });

    // Cell removal events
    graph.on('remove', (cell) => {
      if (cell.isElement()) {
        this.emitEvent('element:removed', {
          id: cell.id,
          element: this.convertToElementData(cell as dia.Element),
        });
      } else if (cell.isLink()) {
        this.emitEvent('link:removed', {
          id: cell.id,
          link: this.convertToLinkData(cell as dia.Link),
        });
      }
    });

    // Cell change events
    graph.on('change', (cell) => {
      if (cell.isElement()) {
        this.emitEvent('element:changed', {
          id: cell.id,
          element: this.convertToElementData(cell as dia.Element),
          changes: cell.changed,
        });
      } else if (cell.isLink()) {
        this.emitEvent('link:changed', {
          id: cell.id,
          link: this.convertToLinkData(cell as dia.Link),
          changes: cell.changed,
        });
      }
    });

    // Position change events
    graph.on('change:position', (element) => {
      if (element.isElement()) {
        this.emitEvent('element:moved', {
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
        this.emitEvent('element:resized', {
          id: element.id,
          element: this.convertToElementData(element as dia.Element),
          newSize: element.size(),
          previousSize: element.previous('size'),
        });
      }
    });
  }

  /**
   * Convert JointJS element to DiagramElement data
   */
  private convertToElementData(element: dia.Element): any {
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
  private convertToLinkData(link: dia.Link): any {
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

  /**
   * Destroy the event manager and clean up all listeners
   */
  public destroy(): void {
    this.clear();
    this.graph = null;
    this.paper = null;
  }
}
