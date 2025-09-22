/**
 * Paper manager for handling JointJS paper operations
 */

import { dia, shapes, Vectorizer } from '@joint/core';
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
    });

    return paper;
  }

  private setupMouseWheelZoom(paper: dia.Paper, eventManager: IEventManager): void {
    paper.on('blank:mousewheel', (evt: any, x: number, y: number, delta: number) => {
      this.mouseWheelZoomHandler(paper, evt, x, y, delta);
    });
    paper.on('cell:mousewheel', (cellView: any, evt: any, x: number, y: number, delta: number) => {
      this.mouseWheelZoomHandler(paper, evt, x, y, delta);
    });
  }

  private mouseWheelZoomHandler(
    paper: dia.Paper,
    evt: MouseEvent,
    x: number,
    y: number,
    delta: number
  ) {
    evt.preventDefault();

    const oldscale = paper.scale().sx;
    const newscale = oldscale + 0.2 * delta * oldscale;
    const clampedScale = this.clampScale(newscale, 0.2, 5.0);

    if (clampedScale !== oldscale) {
      paper.scale(clampedScale, clampedScale);
      paper.translate(-x * clampedScale + evt.offsetX!, -y * clampedScale + evt.offsetY!);
    }
  }

  /**
   * Zoom in with center-focused zoom
   * @param paper - The paper instance
   * @param step - Zoom step multiplier (default: 1.2)
   */
  public zoomIn(paper: dia.Paper, step: number = 1.2): void {
    const { sx } = this.getScale(paper);
    const newScale = sx * step;
    const clampedScale = this.clampScale(newScale);

    // Get paper center in local coordinates
    const centerPos = this.getPaperCenterLocal(paper);

    // Calculate the offset needed to keep the center point fixed during zoom
    const scaleRatio = clampedScale / sx;
    const currentTranslate = paper.translate();

    // Adjust translation to zoom into the center
    const newTranslateX = centerPos.x - centerPos.x * scaleRatio + currentTranslate.tx * scaleRatio;
    const newTranslateY = centerPos.y - centerPos.y * scaleRatio + currentTranslate.ty * scaleRatio;

    paper.scale(clampedScale);
    paper.translate(newTranslateX, newTranslateY);
  }

  /**
   * Zoom out with center-focused zoom
   * @param paper - The paper instance
   * @param step - Zoom step multiplier (default: 1/1.2)
   */
  public zoomOut(paper: dia.Paper, step: number = 1 / 1.2): void {
    const { sx } = this.getScale(paper);
    const newScale = sx * step;
    const clampedScale = this.clampScale(newScale);

    // Get paper center in local coordinates
    const centerPos = this.getPaperCenterLocal(paper);

    // Calculate the offset needed to keep the center point fixed during zoom
    const scaleRatio = clampedScale / sx;
    const currentTranslate = paper.translate();

    // Adjust translation to zoom into the center
    const newTranslateX = centerPos.x - centerPos.x * scaleRatio + currentTranslate.tx * scaleRatio;
    const newTranslateY = centerPos.y - centerPos.y * scaleRatio + currentTranslate.ty * scaleRatio;

    paper.scale(clampedScale);
    paper.translate(newTranslateX, newTranslateY);
  }

  public setupPaperEvents(paper: dia.Paper, eventManager: IEventManager): void {
    // Setup mouse wheel zoom support
    this.setupMouseWheelZoom(paper, eventManager);

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
   * Setup touch gesture events for zoom and element interaction
   */
  private setupTouchEvents(paper: dia.Paper, eventManager: IEventManager): void {
    const paperElement = paper.el;
    if (!paperElement) return;

    // Shared gesture state
    let touchStartTime = 0;

    // Zoom state
    let zoomStartDistance = 0;
    let zoomStartScale = 1;
    let zoomStartTranslate = { tx: 0, ty: 0 };
    let zoomLastCenter = { x: 0, y: 0 };
    let isZooming = false;

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
    };

    const updateZoom = (touch1: Touch, touch2: Touch) => {
      const currentDistance = this.getTouchDistance(touch1, touch2);
      const scaleChange = currentDistance / zoomStartDistance;
      const newScale = this.clampScale(zoomStartScale * scaleChange);

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
          // Single touch - element selection only
          const touch = evt.touches[0];

          const localPosition = this.eventToLocal(paper, touch);
          const elementViews = paper.findElementViewsAtPoint(localPosition);
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

        if (evt.touches.length === 2 && isZooming) {
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
          const wasZooming = isZooming;
          endZoom();

          // Handle tap (short touch without movement)
          if (touchDuration < 300 && !wasZooming) {
            // Emit canvas click event at the zoom center if available
            eventManager.emitEvent('canvas:clicked', { position: zoomLastCenter });
          }
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

  public getScale(paper: dia.Paper): Vectorizer.Scale {
    return paper.scale();
  }

  /**
   * Calculate the center position of the paper accounting for current pan and zoom
   * @deprecated Use getPaperCenterLocal() instead
   */
  public calculatePaperCenter(paper: dia.Paper): { x: number; y: number } {
    return this.getPaperCenterLocal(paper);
  }

  /**
   * Clamp scale value within specified bounds
   * @param scale - The scale value to clamp
   * @param minScale - Minimum allowed scale (default: 0.1)
   * @param maxScale - Maximum allowed scale (default: 5.0)
   * @returns The clamped scale value
   */
  public clampScale(scale: number, minScale: number = 0.1, maxScale: number = 5.0): number {
    return Math.max(minScale, Math.min(maxScale, scale));
  }

  // ==================== COORDINATE SYSTEM METHODS ====================

  /**
   * Convert client coordinates to local coordinates
   * @param paper - The paper instance
   * @param clientPoint - Client coordinates {x, y}
   * @returns Local coordinates {x, y}
   */
  public clientToLocal(
    paper: dia.Paper,
    clientPoint: { x: number; y: number }
  ): { x: number; y: number } {
    return paper.clientToLocalPoint(clientPoint);
  }

  /**
   * Convert local coordinates to client coordinates
   * @param paper - The paper instance
   * @param localPoint - Local coordinates {x, y}
   * @returns Client coordinates {x, y}
   */
  public localToClient(
    paper: dia.Paper,
    localPoint: { x: number; y: number }
  ): { x: number; y: number } {
    return paper.localToClientPoint(localPoint);
  }

  /**
   * Convert page coordinates to local coordinates
   * @param paper - The paper instance
   * @param pagePoint - Page coordinates {x, y}
   * @returns Local coordinates {x, y}
   */
  public pageToLocal(
    paper: dia.Paper,
    pagePoint: { x: number; y: number }
  ): { x: number; y: number } {
    return paper.pageToLocalPoint(pagePoint);
  }

  /**
   * Convert local coordinates to page coordinates
   * @param paper - The paper instance
   * @param localPoint - Local coordinates {x, y}
   * @returns Page coordinates {x, y}
   */
  public localToPage(
    paper: dia.Paper,
    localPoint: { x: number; y: number }
  ): { x: number; y: number } {
    return paper.localToPagePoint(localPoint);
  }

  /**
   * Convert paper coordinates to local coordinates
   * @param paper - The paper instance
   * @param paperPoint - Paper coordinates {x, y}
   * @returns Local coordinates {x, y}
   */
  public paperToLocal(
    paper: dia.Paper,
    paperPoint: { x: number; y: number }
  ): { x: number; y: number } {
    return paper.paperToLocalPoint(paperPoint);
  }

  /**
   * Convert local coordinates to paper coordinates
   * @param paper - The paper instance
   * @param localPoint - Local coordinates {x, y}
   * @returns Paper coordinates {x, y}
   */
  public localToPaper(
    paper: dia.Paper,
    localPoint: { x: number; y: number }
  ): { x: number; y: number } {
    return paper.localToPaperPoint(localPoint);
  }

  /**
   * Get the center position of the paper in local coordinates
   * @param paper - The paper instance
   * @returns Center position in local coordinates {x, y}
   */
  public getPaperCenterLocal(paper: dia.Paper): { x: number; y: number } {
    const paperSize = paper.getComputedSize();
    const paperCenter = {
      x: paperSize.width / 2,
      y: paperSize.height / 2,
    };
    return this.paperToLocal(paper, paperCenter);
  }

  /**
   * Get the center position of the paper in client coordinates
   * @param paper - The paper instance
   * @returns Center position in client coordinates {x, y}
   */
  public getPaperCenterClient(paper: dia.Paper): { x: number; y: number } {
    const localCenter = this.getPaperCenterLocal(paper);
    return this.localToClient(paper, localCenter);
  }

  /**
   * Convert mouse event coordinates to local coordinates
   * @param paper - The paper instance
   * @param event - Mouse event or Touch
   * @returns Local coordinates {x, y}
   */
  public eventToLocal(paper: dia.Paper, event: MouseEvent | Touch): { x: number; y: number } {
    const clientPoint = {
      x: event.clientX,
      y: event.clientY,
    };
    return this.clientToLocal(paper, clientPoint);
  }

  /**
   * Get paper element's bounding rectangle in client coordinates
   * @param paper - The paper instance
   * @returns Bounding rectangle
   */
  public getPaperBounds(paper: dia.Paper): DOMRect | null {
    return paper.el?.getBoundingClientRect() || null;
  }

  /**
   * Check if a point is within paper bounds
   * @param paper - The paper instance
   * @param clientPoint - Client coordinates {x, y}
   * @returns True if point is within paper bounds
   */
  public isPointInPaper(paper: dia.Paper, clientPoint: { x: number; y: number }): boolean {
    const bounds = this.getPaperBounds(paper);
    if (!bounds) return false;

    return (
      clientPoint.x >= bounds.left &&
      clientPoint.x <= bounds.right &&
      clientPoint.y >= bounds.top &&
      clientPoint.y <= bounds.bottom
    );
  }

  /**
   * Get paper dimensions in local coordinates
   * @param paper - The paper instance
   * @returns Paper dimensions {width, height}
   */
  public getPaperDimensions(paper: dia.Paper): { width: number; height: number } {
    const size = paper.getComputedSize();
    return { width: size.width, height: size.height };
  }

  /**
   * Get paper dimensions in client coordinates
   * @param paper - The paper instance
   * @returns Paper dimensions {width, height}
   */
  public getPaperDimensionsClient(paper: dia.Paper): { width: number; height: number } {
    const bounds = this.getPaperBounds(paper);
    if (!bounds) return { width: 0, height: 0 };
    return { width: bounds.width, height: bounds.height };
  }
}
