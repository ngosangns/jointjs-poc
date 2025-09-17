/**
 * Paper manager for handling JointJS paper operations
 */

import { dia, shapes } from '@joint/core';
import { IPaperManager, IEventManager } from '../interfaces';
import { DiagramConfig } from '../../types';

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
   * Setup paper-specific events
   */
  public setupEvents(paper: dia.Paper, eventManager: IEventManager): void {
    // Element events
    paper.on('element:pointerdown', (elementView, evt) => {
      eventManager.emitEvent('element:selected', {
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
}
