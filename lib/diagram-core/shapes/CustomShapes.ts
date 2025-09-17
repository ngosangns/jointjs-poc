/**
 * Example custom shapes to demonstrate extensibility
 */

import { dia, shapes, util } from '@joint/core';

/**
 * Custom Process shape (rounded rectangle with icon)
 */
export class ProcessShape extends shapes.standard.Rectangle {
  override defaults() {
    return util.deepSupplement(
      {
        type: 'custom.Process',
        attrs: {
          body: {
            fill: '#E3F2FD',
            stroke: '#1976D2',
            strokeWidth: 2,
            rx: 10,
            ry: 10,
          },
          label: {
            text: 'Process',
            fontSize: 14,
            fontFamily: 'Arial, sans-serif',
            fill: '#1976D2',
            textAnchor: 'middle',
            textVerticalAnchor: 'middle',
          },
          icon: {
            xlinkHref:
              'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTkgMTJMMTEgMTRMMTUgMTBNMjEgMTJDMjEgMTYuOTcwNiAxNi45NzA2IDIxIDEyIDIxQzcuMDI5NDQgMjEgMyAxNi45NzA2IDMgMTJDMyA3LjAyOTQ0IDcuMDI5NDQgMyAxMiAzQzE2Ljk3MDYgMyAyMSA3LjAyOTQ0IDIxIDEyWiIgc3Ryb2tlPSIjMTk3NkQyIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8L3N2Zz4K',
            width: 20,
            height: 20,
            x: 10,
            y: 10,
          },
        },
        ports: {
          groups: {
            in: {
              position: 'left',
              attrs: {
                circle: {
                  fill: '#1976D2',
                  stroke: '#ffffff',
                  strokeWidth: 2,
                  r: 6,
                },
              },
            },
            out: {
              position: 'right',
              attrs: {
                circle: {
                  fill: '#1976D2',
                  stroke: '#ffffff',
                  strokeWidth: 2,
                  r: 6,
                },
              },
            },
          },
          items: [
            { group: 'in', id: 'in1' },
            { group: 'out', id: 'out1' },
          ],
        },
      },
      super.defaults()
    );
  }

  override markup = [
    {
      tagName: 'rect',
      selector: 'body',
    },
    {
      tagName: 'image',
      selector: 'icon',
    },
    {
      tagName: 'text',
      selector: 'label',
    },
  ];
}

/**
 * Custom Decision shape (diamond)
 */
export class DecisionShape extends dia.Element {
  override defaults() {
    return util.deepSupplement(
      {
        type: 'custom.Decision',
        size: { width: 100, height: 80 },
        attrs: {
          body: {
            fill: '#FFF3E0',
            stroke: '#F57C00',
            strokeWidth: 2,
            points: '50,0 100,40 50,80 0,40',
          },
          label: {
            text: 'Decision',
            fontSize: 12,
            fontFamily: 'Arial, sans-serif',
            fill: '#F57C00',
            textAnchor: 'middle',
            textVerticalAnchor: 'middle',
            x: '50%',
            y: '50%',
          },
        },
        ports: {
          groups: {
            in: {
              position: { name: 'absolute', args: { x: 50, y: 0 } },
              attrs: {
                circle: {
                  fill: '#F57C00',
                  stroke: '#ffffff',
                  strokeWidth: 2,
                  r: 6,
                },
              },
            },
            'out-yes': {
              position: { name: 'absolute', args: { x: 100, y: 40 } },
              attrs: {
                circle: {
                  fill: '#4CAF50',
                  stroke: '#ffffff',
                  strokeWidth: 2,
                  r: 6,
                },
              },
            },
            'out-no': {
              position: { name: 'absolute', args: { x: 0, y: 40 } },
              attrs: {
                circle: {
                  fill: '#F44336',
                  stroke: '#ffffff',
                  strokeWidth: 2,
                  r: 6,
                },
              },
            },
          },
          items: [
            { group: 'in', id: 'in1' },
            { group: 'out-yes', id: 'yes' },
            { group: 'out-no', id: 'no' },
          ],
        },
      },
      super.defaults()
    );
  }

  override markup = [
    {
      tagName: 'polygon',
      selector: 'body',
    },
    {
      tagName: 'text',
      selector: 'label',
    },
  ];
}

/**
 * Custom Database shape
 */
export class DatabaseShape extends dia.Element {
  override defaults() {
    return util.deepSupplement(
      {
        type: 'custom.Database',
        size: { width: 80, height: 100 },
        attrs: {
          body: {
            fill: '#E8F5E8',
            stroke: '#4CAF50',
            strokeWidth: 2,
          },
          top: {
            fill: '#E8F5E8',
            stroke: '#4CAF50',
            strokeWidth: 2,
            cx: 40,
            cy: 15,
            rx: 40,
            ry: 15,
          },
          bottom: {
            fill: '#E8F5E8',
            stroke: '#4CAF50',
            strokeWidth: 2,
            cx: 40,
            cy: 85,
            rx: 40,
            ry: 15,
          },
          label: {
            text: 'Database',
            fontSize: 12,
            fontFamily: 'Arial, sans-serif',
            fill: '#4CAF50',
            textAnchor: 'middle',
            textVerticalAnchor: 'middle',
            x: '50%',
            y: '50%',
          },
        },
        ports: {
          groups: {
            in: {
              position: { name: 'absolute', args: { x: 0, y: 50 } },
              attrs: {
                circle: {
                  fill: '#4CAF50',
                  stroke: '#ffffff',
                  strokeWidth: 2,
                  r: 6,
                },
              },
            },
            out: {
              position: { name: 'absolute', args: { x: 80, y: 50 } },
              attrs: {
                circle: {
                  fill: '#4CAF50',
                  stroke: '#ffffff',
                  strokeWidth: 2,
                  r: 6,
                },
              },
            },
          },
          items: [
            { group: 'in', id: 'in1' },
            { group: 'out', id: 'out1' },
          ],
        },
      },
      super.defaults()
    );
  }

  override markup = [
    {
      tagName: 'path',
      selector: 'body',
      attributes: {
        d: 'M 0 15 L 0 85 Q 0 100 40 100 Q 80 100 80 85 L 80 15 Q 80 0 40 0 Q 0 0 0 15 Z',
      },
    },
    {
      tagName: 'ellipse',
      selector: 'top',
    },
    {
      tagName: 'ellipse',
      selector: 'bottom',
    },
    {
      tagName: 'text',
      selector: 'label',
    },
  ];
}

/**
 * Custom Actor shape (stick figure)
 */
export class ActorShape extends dia.Element {
  override defaults() {
    return util.deepSupplement(
      {
        type: 'custom.Actor',
        size: { width: 60, height: 100 },
        attrs: {
          body: {
            fill: 'none',
            stroke: '#9C27B0',
            strokeWidth: 3,
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
          },
          label: {
            text: 'Actor',
            fontSize: 12,
            fontFamily: 'Arial, sans-serif',
            fill: '#9C27B0',
            textAnchor: 'middle',
            textVerticalAnchor: 'top',
            x: '50%',
            y: '105%',
          },
        },
        ports: {
          groups: {
            out: {
              position: { name: 'absolute', args: { x: 60, y: 50 } },
              attrs: {
                circle: {
                  fill: '#9C27B0',
                  stroke: '#ffffff',
                  strokeWidth: 2,
                  r: 6,
                },
              },
            },
          },
          items: [{ group: 'out', id: 'out1' }],
        },
      },
      super.defaults()
    );
  }

  override markup = [
    {
      tagName: 'g',
      selector: 'body',
      children: [
        {
          tagName: 'circle',
          attributes: { cx: 30, cy: 15, r: 10 },
        },
        {
          tagName: 'line',
          attributes: { x1: 30, y1: 25, x2: 30, y2: 60 },
        },
        {
          tagName: 'line',
          attributes: { x1: 10, y1: 40, x2: 50, y2: 40 },
        },
        {
          tagName: 'line',
          attributes: { x1: 30, y1: 60, x2: 15, y2: 85 },
        },
        {
          tagName: 'line',
          attributes: { x1: 30, y1: 60, x2: 45, y2: 85 },
        },
      ],
    },
    {
      tagName: 'text',
      selector: 'label',
    },
  ];
}
