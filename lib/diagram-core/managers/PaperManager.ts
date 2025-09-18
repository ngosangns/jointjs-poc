/**
 * Paper manager for handling JointJS paper operations
 */

import { dia, shapes } from '@joint/core';
import { DiagramConfig } from '../../types';
import { IEventManager, IPaperManager } from '../interfaces';

export class PaperManager implements IPaperManager {
  /**
   * Initialize a new paper instance
   */
  public initialize(element: HTMLElement, graph: dia.Graph, config: DiagramConfig): dia.Paper {
    const paper = new dia.Paper({
      el: element,
      model: graph,
      width: config.width,
      height: config.height,
      gridSize: config.gridSize || 10,
      drawGrid: true,
      interactive: config.interactive !== false,
      background: config.background || { color: '#f8f9fa' },
      snapLinks: true,
      linkPinning: false,
      // Enable element dragging
      allowDrag: true,
      allowDrop: true,
      defaultLink: () => new shapes.standard.Link(),
      // Additional paper options for better UX
      highlighting: {
        default: {
          name: 'stroke',
          options: {
            padding: 6,
            attrs: {
              'stroke-width': 3,
              stroke: '#FF4081',
            },
          },
        },
      },
      // Enable connection validation
      validateConnection: function (cellViewS, magnetS, cellViewT, magnetT, end, linkView) {
        // Prevent linking from input ports to input ports
        // and from output ports to output ports
        if (magnetS && magnetT) {
          const sourcePortGroup = magnetS.getAttribute('port-group');
          const targetPortGroup = magnetT.getAttribute('port-group');

          if (sourcePortGroup === targetPortGroup) {
            return false;
          }
        }

        // Prevent self-linking
        return cellViewS !== cellViewT;
      },
      // Restrict link connections to ports only
      restrictTranslate: function (elementView) {
        return elementView.getBBox();
      },
    });

    return paper;
  }

  /**
   * Setup paper-specific events including touch gestures
   */
  public setupEvents(paper: dia.Paper, eventManager: IEventManager): void {
    // Element events
    paper.on('element:pointerdown', (elementView, evt) => {
      console.log('Element pointerdown:', elementView.model.id);
      eventManager.emitEvent('element:selected', {
        id: elementView.model.id,
        element: elementView.model,
        position: { x: evt.clientX, y: evt.clientY },
      });
    });

    // Element drag events for movement
    paper.on('element:pointermove', (elementView, evt) => {
      if (evt.buttons === 1) {
        // Left mouse button is pressed
        eventManager.emitEvent('element:dragging', {
          id: elementView.model.id,
          element: elementView.model,
          position: { x: evt.clientX, y: evt.clientY },
        });
      }
    });

    paper.on('element:pointerup', (elementView, evt) => {
      eventManager.emitEvent('element:drag-end', {
        id: elementView.model.id,
        element: elementView.model,
        position: { x: evt.clientX, y: evt.clientY },
      });
    });

    paper.on('element:pointerdblclick', (elementView, evt) => {
      eventManager.emitEvent('element:double-click', {
        id: elementView.model.id,
        element: elementView.model,
        position: { x: evt.clientX, y: evt.clientY },
      });
    });

    // JointJS built-in drag events
    paper.on('element:move', (elementView, evt) => {
      console.log('JointJS element:move event triggered for element:', elementView.model.id);
      eventManager.emitEvent('element:moved', {
        id: elementView.model.id,
        element: elementView.model,
        position: { x: evt.clientX, y: evt.clientY },
      });
    });

    // Link events
    paper.on('link:pointerdown', (linkView, evt) => {
      eventManager.emitEvent('link:selected', {
        id: linkView.model.id,
        link: linkView.model,
        position: { x: evt.clientX, y: evt.clientY },
      });
    });

    paper.on('link:pointerdblclick', (linkView, evt) => {
      eventManager.emitEvent('link:double-click', {
        id: linkView.model.id,
        link: linkView.model,
        position: { x: evt.clientX, y: evt.clientY },
      });
    });

    // Paper events
    paper.on('blank:pointerdown', (evt) => {
      eventManager.emitEvent('canvas:clicked', {
        position: { x: evt.clientX, y: evt.clientY },
      });
    });

    paper.on('cell:mouseover', (cellView) => {
      eventManager.emitEvent('cell:hover', {
        id: cellView.model.id,
        cell: cellView.model,
        type: cellView.model.isElement() ? 'element' : 'link',
      });
    });

    paper.on('cell:mouseout', (cellView) => {
      eventManager.emitEvent('cell:unhover', {
        id: cellView.model.id,
        cell: cellView.model,
        type: cellView.model.isElement() ? 'element' : 'link',
      });
    });

    // Connection events
    paper.on('link:connect', (linkView) => {
      eventManager.emitEvent('link:connected', {
        id: linkView.model.id,
        link: linkView.model,
        source: linkView.model.source(),
        target: linkView.model.target(),
      });
    });

    paper.on('link:disconnect', (linkView) => {
      eventManager.emitEvent('link:disconnected', {
        id: linkView.model.id,
        link: linkView.model,
      });
    });

    // Touch gesture events
    this.setupTouchEvents(paper, eventManager);
  }

  /**
   * Setup touch gesture events for pan/zoom and element interaction
   */
  private setupTouchEvents(paper: dia.Paper, eventManager: IEventManager): void {
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
            eventManager.emitEvent('element:selected', {
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

          eventManager.emitEvent('viewport:changed', {
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

          eventManager.emitEvent('viewport:changed', {
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
            eventManager.emitEvent('canvas:clicked', {
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
   * Resize the paper
   */
  public resize(paper: dia.Paper, width: number, height: number): void {
    paper.setDimensions(width, height);
  }

  /**
   * Destroy the paper and clean up resources
   */
  public destroy(paper: dia.Paper): void {
    paper.remove();
  }

  /**
   * Enable/disable paper interactivity
   */
  public setInteractive(paper: dia.Paper, interactive: boolean): void {
    paper.setInteractivity(interactive);
  }

  /**
   * Fit paper content to viewport
   */
  public fitToContent(paper: dia.Paper, padding: number = 20): void {
    paper.fitToContent({
      padding,
      allowNewOrigin: 'any',
      minWidth: 100,
      minHeight: 100,
    });
  }

  /**
   * Scale paper content
   */
  public scale(paper: dia.Paper, scaleX: number, scaleY?: number): void {
    paper.scale(scaleX, scaleY || scaleX);
  }

  /**
   * Get paper scale
   */
  public getScale(paper: dia.Paper): { sx: number; sy: number } {
    return paper.scale();
  }

  /**
   * Translate viewport by dx, dy
   */
  public translate(paper: dia.Paper, dx: number, dy: number): void {
    const origin = paper.translate();
    paper.translate(origin.tx + dx, origin.ty + dy);
  }

  /**
   * Attach a minimap - placeholder hook for future implementation
   */
  public attachMinimap(_paper: dia.Paper, _container: HTMLElement): void {
    // Intentionally left as a stub for future enhancement
  }
}
