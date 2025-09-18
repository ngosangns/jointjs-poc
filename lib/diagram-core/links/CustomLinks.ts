/**
 * Example custom links to demonstrate extensibility
 */

import { shapes, util } from '@joint/core';

/**
 * Custom Data Flow link (with data label)
 */
export class DataFlowLink extends shapes.standard.Link {
  override defaults() {
    return util.defaultsDeep(
      {
        type: 'custom.DataFlow',
        attrs: {
          line: {
            stroke: '#2196F3',
            strokeWidth: 3,
            strokeDasharray: '0',
            targetMarker: {
              type: 'path',
              d: 'M 10 -5 0 0 10 5 z',
              fill: '#2196F3',
              stroke: '#2196F3',
            },
          },
          wrapper: {
            strokeWidth: 10,
            strokeOpacity: 0,
          },
          dataLabel: {
            text: 'data',
            fontSize: 12,
            fontFamily: 'Arial, sans-serif',
            fill: '#2196F3',
            textAnchor: 'middle',
            textVerticalAnchor: 'middle',
            textPath: {
              selector: 'line',
              startOffset: '50%',
            },
            backgroundColor: '#ffffff',
            backgroundOpacity: 0.8,
            padding: 4,
          },
        },
        router: { name: 'orthogonal' },
        connector: { name: 'rounded', args: { radius: 10 } },
        labels: [
          {
            attrs: {
              text: {
                text: 'data',
                fontSize: 12,
                fill: '#2196F3',
              },
              rect: {
                fill: '#ffffff',
                stroke: '#2196F3',
                strokeWidth: 1,
                rx: 3,
                ry: 3,
              },
            },
            position: {
              distance: 0.5,
              offset: 0,
            },
          },
        ],
      },
      super.defaults()
    );
  }
}

/**
 * Custom Control Flow link (with condition label)
 */
export class ControlFlowLink extends shapes.standard.Link {
  override defaults() {
    return util.defaultsDeep(
      {
        type: 'custom.ControlFlow',
        attrs: {
          line: {
            stroke: '#FF9800',
            strokeWidth: 2,
            strokeDasharray: '5,5',
            targetMarker: {
              type: 'path',
              d: 'M 10 -5 0 0 10 5 z',
              fill: '#FF9800',
              stroke: '#FF9800',
            },
          },
          wrapper: {
            strokeWidth: 10,
            strokeOpacity: 0,
          },
        },
        router: { name: 'manhattan' },
        connector: { name: 'rounded', args: { radius: 5 } },
        labels: [
          {
            attrs: {
              text: {
                text: 'condition',
                fontSize: 11,
                fill: '#FF9800',
                fontStyle: 'italic',
              },
              rect: {
                fill: '#FFF8E1',
                stroke: '#FF9800',
                strokeWidth: 1,
                rx: 3,
                ry: 3,
              },
            },
            position: {
              distance: 0.3,
              offset: -15,
            },
          },
        ],
      },
      super.defaults()
    );
  }
}

/**
 * Custom Dependency link (dotted with dependency label)
 */
export class DependencyLink extends shapes.standard.Link {
  override defaults() {
    return util.defaultsDeep(
      {
        type: 'custom.Dependency',
        attrs: {
          line: {
            stroke: '#9C27B0',
            strokeWidth: 2,
            strokeDasharray: '3,3',
            targetMarker: {
              type: 'path',
              d: 'M 10 -5 0 0 10 5 z',
              fill: 'none',
              stroke: '#9C27B0',
              strokeWidth: 2,
            },
          },
          wrapper: {
            strokeWidth: 10,
            strokeOpacity: 0,
          },
        },
        router: { name: 'normal' },
        connector: { name: 'smooth' },
        labels: [
          {
            attrs: {
              text: {
                text: '<<depends>>',
                fontSize: 10,
                fill: '#9C27B0',
                fontStyle: 'italic',
              },
              rect: {
                fill: '#F3E5F5',
                stroke: '#9C27B0',
                strokeWidth: 1,
                rx: 3,
                ry: 3,
              },
            },
            position: {
              distance: 0.5,
              offset: 0,
            },
          },
        ],
      },
      super.defaults()
    );
  }
}

/**
 * Custom Inheritance link (with triangle arrow)
 */
export class InheritanceLink extends shapes.standard.Link {
  override defaults() {
    return util.defaultsDeep(
      {
        type: 'custom.Inheritance',
        attrs: {
          line: {
            stroke: '#4CAF50',
            strokeWidth: 2,
            targetMarker: {
              type: 'path',
              d: 'M 15 -8 0 0 15 8 z',
              fill: '#ffffff',
              stroke: '#4CAF50',
              strokeWidth: 2,
            },
          },
          wrapper: {
            strokeWidth: 10,
            strokeOpacity: 0,
          },
        },
        router: { name: 'orthogonal' },
        connector: { name: 'rounded', args: { radius: 8 } },
      },
      super.defaults()
    );
  }
}

/**
 * Custom Composition link (with diamond)
 */
export class CompositionLink extends shapes.standard.Link {
  override defaults() {
    return util.defaultsDeep(
      {
        type: 'custom.Composition',
        attrs: {
          line: {
            stroke: '#F44336',
            strokeWidth: 2,
            sourceMarker: {
              type: 'path',
              d: 'M 15 0 7.5 -5 0 0 7.5 5 z',
              fill: '#F44336',
              stroke: '#F44336',
            },
            targetMarker: {
              type: 'path',
              d: 'M 10 -5 0 0 10 5 z',
              fill: '#F44336',
              stroke: '#F44336',
            },
          },
          wrapper: {
            strokeWidth: 10,
            strokeOpacity: 0,
          },
        },
        router: { name: 'orthogonal' },
        connector: { name: 'rounded', args: { radius: 8 } },
      },
      super.defaults()
    );
  }
}

/**
 * Custom Message link (with message label and sequence number)
 */
export class MessageLink extends shapes.standard.Link {
  override defaults() {
    return util.defaultsDeep(
      {
        type: 'custom.Message',
        attrs: {
          line: {
            stroke: '#607D8B',
            strokeWidth: 2,
            targetMarker: {
              type: 'path',
              d: 'M 10 -5 0 0 10 5 z',
              fill: '#607D8B',
              stroke: '#607D8B',
            },
          },
          wrapper: {
            strokeWidth: 10,
            strokeOpacity: 0,
          },
        },
        router: { name: 'normal' },
        connector: { name: 'normal' },
        labels: [
          {
            attrs: {
              text: {
                text: '1: message()',
                fontSize: 12,
                fill: '#607D8B',
                fontWeight: 'bold',
              },
              rect: {
                fill: '#ECEFF1',
                stroke: '#607D8B',
                strokeWidth: 1,
                rx: 3,
                ry: 3,
              },
            },
            position: {
              distance: 0.5,
              offset: -15,
            },
          },
        ],
      },
      super.defaults()
    );
  }
}

/**
 * Custom Bidirectional link (with arrows on both ends)
 */
export class BidirectionalLink extends shapes.standard.Link {
  override defaults() {
    return util.deepSupplement(
      {
        type: 'custom.Bidirectional',
        attrs: {
          line: {
            stroke: '#795548',
            strokeWidth: 3,
            sourceMarker: {
              type: 'path',
              d: 'M -10 -5 0 0 -10 5 z',
              fill: '#795548',
              stroke: '#795548',
            },
            targetMarker: {
              type: 'path',
              d: 'M 10 -5 0 0 10 5 z',
              fill: '#795548',
              stroke: '#795548',
            },
          },
          wrapper: {
            strokeWidth: 10,
            strokeOpacity: 0,
          },
        },
        router: { name: 'orthogonal' },
        connector: { name: 'rounded', args: { radius: 10 } },
      },
      super.defaults()
    );
  }
}
