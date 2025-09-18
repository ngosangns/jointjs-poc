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
      // Custom interaction options for drag threshold and press-hold
      interaction: {
        dragStartThresholdPx: config.interaction?.dragStartThresholdPx ?? 4,
        pressHoldMs: config.interaction?.pressHoldMs ?? 200,
      } as any,
      snapLinks: true,
      linkPinning: false,
      // Enable element dragging
      allowDrag: true,
      allowDrop: true,
      defaultLink: () => new shapes.standard.Link(),
      // Enable panning on blank area by default; element drag remains enabled
      defaultInteraction: {
        blank: { pan: true },
        element: { move: true },
      } as any,
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

  /** Update grid without reinitializing paper or clearing cells */
  public setGrid(paper: dia.Paper, enabled: boolean, gridSize?: number): void {
    (paper.options as any).drawGrid = !!enabled;
    if (typeof gridSize === 'number' && gridSize > 0) {
      paper.setGridSize(gridSize);
    }
    try {
      (paper as any).drawGrid({ color: '#e9ecef' });
    } catch {
      paper.render();
    }
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
