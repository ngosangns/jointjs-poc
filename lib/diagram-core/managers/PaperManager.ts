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
      interaction: {
        dragStartThresholdPx: config.interaction?.dragStartThresholdPx ?? 4,
        pressHoldMs: config.interaction?.pressHoldMs ?? 200,
      },
      snapLinks: true,
      linkPinning: false,
      allowDrag: true,
      allowDrop: true,
      defaultLink: () => new shapes.standard.Link(),
      // Enable panning on blank area by default; element drag remains enabled
      defaultInteraction: {
        blank: { pan: true },
        element: { move: true },
      },
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

          if (sourcePortGroup === targetPortGroup) return false;
        }

        // Prevent self-linking
        return cellViewS !== cellViewT;
      },
      // Restrict link connections to ports only
      // Allow free element translation (no restriction)
    });

    return paper;
  }

  /**
   * Setup paper-specific events including drag thresholds and touch gestures
   */
  public setupPaperEvents(paper: dia.Paper, eventManager: IEventManager): void {
    // Manual panning over blank area with LEFT mouse button
    let isBlankPanning = false;
    let blankPanStart = { x: 0, y: 0 };
    let blankPanTranslate = { tx: 0, ty: 0 };

    paper.on('element:pointerdblclick', (elementView, evt) => {
      eventManager.emitEvent('element:double-click', {
        id: elementView.model.id,
        element: elementView.model,
        position: { x: evt.clientX, y: evt.clientY },
      });
    });

    // Note: element move interactions are disabled; no custom drag events

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
    paper.on('blank:pointerdown', (evt: any) => {
      // left button initiates pan on blank
      if (evt.button === 0) {
        isBlankPanning = true;
        blankPanStart = { x: evt.clientX, y: evt.clientY };
        blankPanTranslate = paper.translate();
      }
      eventManager.emitEvent('canvas:clicked', {
        position: { x: evt.clientX, y: evt.clientY },
      });
    });

    // Emit viewport changes on pan/translate and scale
    const emitViewport = () => {
      const scale = paper.scale().sx;
      const t = paper.translate();
      eventManager.emitEvent('viewport:changed', { zoom: scale, pan: { x: t.tx, y: t.ty } });
    };
    paper.on('blank:pointermove', (evt: any) => {
      if (isBlankPanning) {
        // Ensure left button is still pressed
        if ((evt.buttons & 1) === 1) {
          const dx = evt.clientX - blankPanStart.x;
          const dy = evt.clientY - blankPanStart.y;
          paper.translate(blankPanTranslate.tx + dx, blankPanTranslate.ty + dy);
        }
      }
      emitViewport();
    });
    paper.on('blank:pointerup', () => {
      if (isBlankPanning) {
        isBlankPanning = false;
      }
      emitViewport();
    });
    paper.on('translate', () => emitViewport());
    paper.on('scale', () => emitViewport());

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

    // Shared gesture state
    let touchStartTime = 0;

    // Pan state
    let panStartTranslate = { tx: 0, ty: 0 };
    let panLastPoint = { x: 0, y: 0 };
    let isPanning = false;

    // Zoom state
    let zoomStartDistance = 0;
    let zoomStartScale = 1;
    let zoomStartTranslate = { tx: 0, ty: 0 };
    let zoomLastCenter = { x: 0, y: 0 };
    let isZooming = false;

    // --- Pan helpers ---
    const beginPan = (touch: Touch) => {
      panLastPoint = { x: touch.clientX, y: touch.clientY };
      panStartTranslate = paper.translate();
      isPanning = true;
      isZooming = false;
    };

    const updatePan = (touch: Touch) => {
      const dx = touch.clientX - panLastPoint.x;
      const dy = touch.clientY - panLastPoint.y;
      paper.translate(panStartTranslate.tx + dx, panStartTranslate.ty + dy);
      eventManager.emitEvent('viewport:changed', {
        zoom: paper.scale().sx,
        pan: { x: paper.translate().tx, y: paper.translate().ty },
      });
      panLastPoint = { x: touch.clientX, y: touch.clientY };
    };

    const endPan = () => {
      isPanning = false;
    };

    // --- Zoom helpers ---
    const beginZoom = (touch1: Touch, touch2: Touch) => {
      zoomStartDistance = this.getTouchDistance(touch1, touch2);
      zoomStartScale = paper.scale().sx;
      zoomStartTranslate = paper.translate();
      zoomLastCenter = {
        x: (touch1.clientX + touch2.clientX) / 2,
        y: (touch1.clientY + touch2.clientY) / 2,
      };
      isZooming = true;
      isPanning = false;
    };

    const updateZoom = (touch1: Touch, touch2: Touch) => {
      const currentDistance = this.getTouchDistance(touch1, touch2);
      const scaleChange = currentDistance / zoomStartDistance;
      const newScale = Math.max(0.1, Math.min(5.0, zoomStartScale * scaleChange));

      const newCenter = {
        x: (touch1.clientX + touch2.clientX) / 2,
        y: (touch1.clientY + touch2.clientY) / 2,
      };

      const scale = newScale / zoomStartScale;
      const offsetX = (newCenter.x - zoomLastCenter.x) * (1 - scale);
      const offsetY = (newCenter.y - zoomLastCenter.y) * (1 - scale);

      paper.scale(newScale);
      paper.translate(zoomStartTranslate.tx + offsetX, zoomStartTranslate.ty + offsetY);

      eventManager.emitEvent('viewport:changed', {
        zoom: paper.scale().sx,
        pan: { x: paper.translate().tx, y: paper.translate().ty },
      });
      // keep last center to make subsequent deltas relative
      zoomLastCenter = newCenter;
    };

    const endZoom = () => {
      isZooming = false;
    };

    // Touch start
    paperElement.addEventListener(
      'touchstart',
      (evt: TouchEvent) => {
        evt.preventDefault();
        touchStartTime = Date.now();

        if (evt.touches.length === 1) {
          // Single touch - begin pan and maybe element selection
          const touch = evt.touches[0];
          beginPan(touch);

          const elementViews = paper.findElementViewsAtPoint({
            x: touch.clientX,
            y: touch.clientY,
          });
          if (elementViews.length > 0 && elementViews[0].model.isElement()) {
            const elementView = elementViews[0];
            eventManager.emitEvent('element:selected', {
              id: elementView.model.id,
              element: elementView.model,
              position: { x: touch.clientX, y: touch.clientY },
            });
          }
        } else if (evt.touches.length === 2) {
          // Two touches - begin zoom
          beginZoom(evt.touches[0], evt.touches[1]);
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
          updatePan(evt.touches[0]);
        } else if (evt.touches.length === 2 && isZooming) {
          updateZoom(evt.touches[0], evt.touches[1]);
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
          const wasPanning = isPanning;
          const wasZooming = isZooming;
          endPan();
          endZoom();

          // Handle tap (short touch without movement)
          if (touchDuration < 300 && !wasPanning && !wasZooming) {
            // Emit canvas click event at the last known pan point or zoom center
            const position = isZooming ? zoomLastCenter : panLastPoint;
            eventManager.emitEvent('canvas:clicked', { position });
          }
        } else if (evt.touches.length === 1 && isZooming) {
          // Transition from zoom to pan
          endZoom();
          beginPan(evt.touches[0]);
        }
      },
      { passive: false }
    );
  }

  private getTouchDistance(touch1: Touch, touch2: Touch): number {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /** Update grid without reinitializing paper or clearing cells */
  public setGrid(paper: dia.Paper, enabled: boolean, gridSize?: number): void {
    paper.options.drawGrid = !!enabled;
    if (typeof gridSize === 'number' && gridSize > 0) {
      paper.setGridSize(gridSize);
    }
    paper.render();
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
}
