/**
 * Enhanced Features Example - Demonstrates JointJS best practices implementation
 */

import { DiagramEngine } from '../DiagramEngine';
import { DiagramConfig, DiagramEvent } from '../../types';

export class EnhancedFeaturesExample {
  private engine!: DiagramEngine;
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
    this.initializeEngine();
  }

  /**
   * Initialize the diagram engine with enhanced configuration
   */
  private initializeEngine(): void {
    const config: DiagramConfig = {
      width: 1000,
      height: 600,
      gridSize: 20,
      interactive: true,
      background: {
        color: '#f8f9fa',
      },
    };

    this.engine = new DiagramEngine(config);
    this.engine.initializePaper(this.container);
    this.setupEventHandlers();
  }

  /**
   * Setup enhanced event handling
   */
  private setupEventHandlers(): void {
    // Custom event listeners using JointJS integration
    this.engine.addEventListener('element:selected', (event: DiagramEvent) => {
      console.log('Element selected:', event.data.id);
      this.highlightElement(event.data.id);
    });

    this.engine.addEventListener('element:double-click', (event: DiagramEvent) => {
      console.log('Element double-clicked:', event.data.id);
      this.editElementLabel(event.data.id);
    });

    this.engine.addEventListener('link:connected', (event: DiagramEvent) => {
      console.log('Link connected:', event.data.id);
    });

    this.engine.addEventListener('canvas:clicked', () => {
      console.log('Canvas clicked - clearing selection');
      this.clearSelection();
    });
  }

  /**
   * Demonstrate custom shape creation with namespaces
   */
  public createCustomShapes(): void {
    const shapeFactory = this.engine.getShapeFactory();

    // Define custom shape in business namespace
    const BusinessProcess = shapeFactory.defineShape('Process', 'business', {
      attrs: {
        body: {
          fill: '#3498db',
          stroke: '#2980b9',
          strokeWidth: 2,
          rx: 10,
          ry: 10,
        },
        label: {
          text: 'Business Process',
          fontSize: 12,
          fontFamily: 'Arial, sans-serif',
          fill: '#ffffff',
          textAnchor: 'middle',
          textVerticalAnchor: 'middle',
        },
      },
    });

    // Define custom shape in flowchart namespace
    const Decision = shapeFactory.defineShape('Decision', 'flowchart', {
      attrs: {
        body: {
          fill: '#e74c3c',
          stroke: '#c0392b',
          strokeWidth: 2,
          points: '0,10 10,0 20,10 10,20',
        },
        label: {
          text: 'Decision',
          fontSize: 11,
          fill: '#ffffff',
          textAnchor: 'middle',
          textVerticalAnchor: 'middle',
        },
      },
    });

    console.log('Custom shapes registered:', {
      business: shapeFactory.getShapesInNamespace('business'),
      flowchart: shapeFactory.getShapesInNamespace('flowchart'),
    });
  }

  /**
   * Demonstrate shapes with ports
   */
  public createShapesWithPorts(): string[] {
    const shapeFactory = this.engine.getShapeFactory();
    const elementIds: string[] = [];

    // Create rectangle with input/output ports
    const rect1Id = this.engine.addElement({
      type: 'rectangle',
      position: { x: 100, y: 100 },
      size: { width: 120, height: 80 },
      properties: {
        attrs: {
          body: { fill: '#2ecc71', stroke: '#27ae60' },
          label: { text: 'Input Node' },
        },
        ports: {
          groups: {
            out: {
              position: 'right',
              attrs: {
                circle: {
                  fill: '#E74C3C',
                  stroke: '#C0392B',
                  strokeWidth: 2,
                  r: 8,
                  magnet: true,
                },
              },
            },
          },
          items: [
            { group: 'out', id: 'output1' },
            { group: 'out', id: 'output2' },
          ],
        },
      },
    });
    elementIds.push(rect1Id);

    // Create rectangle with input ports
    const rect2Id = this.engine.addElement({
      type: 'rectangle',
      position: { x: 300, y: 100 },
      size: { width: 120, height: 80 },
      properties: {
        attrs: {
          body: { fill: '#3498db', stroke: '#2980b9' },
          label: { text: 'Process Node' },
        },
        ports: {
          groups: {
            in: {
              position: 'left',
              attrs: {
                circle: {
                  fill: '#16A085',
                  stroke: '#138D75',
                  strokeWidth: 2,
                  r: 8,
                  magnet: true,
                },
              },
            },
            out: {
              position: 'right',
              attrs: {
                circle: {
                  fill: '#E74C3C',
                  stroke: '#C0392B',
                  strokeWidth: 2,
                  r: 8,
                  magnet: true,
                },
              },
            },
          },
          items: [
            { group: 'in', id: 'input1' },
            { group: 'out', id: 'output1' },
          ],
        },
      },
    });
    elementIds.push(rect2Id);

    return elementIds;
  }

  /**
   * Demonstrate custom tools
   */
  public setupCustomTools(): void {
    const toolsManager = this.engine.getToolsManager();

    // Create custom element tools
    const customElementTools = [
      toolsManager.createElementTool('Remove', {
        x: '100%',
        y: 0,
        offset: { x: 15, y: -15 },
        action: function (evt: any, elementView: any) {
          if (confirm('Delete this element?')) {
            elementView.model.remove();
          }
        },
      }),
      toolsManager.createElementTool('Button', {
        x: 0,
        y: 0,
        offset: { x: -15, y: -15 },
        action: function (evt: any, elementView: any) {
          alert(`Element ID: ${elementView.model.id}`);
        },
        markup: [
          {
            tagName: 'circle',
            attributes: {
              r: 8,
              fill: '#3498db',
              cursor: 'pointer',
            },
          },
          {
            tagName: 'text',
            textContent: 'i',
            attributes: {
              fill: 'white',
              'font-size': 10,
              'text-anchor': 'middle',
              'dominant-baseline': 'central',
              'pointer-events': 'none',
            },
          },
        ],
      }),
      toolsManager.createElementTool('Boundary', {
        padding: 15,
        attrs: {
          stroke: '#3498db',
          strokeWidth: 2,
          strokeDasharray: '5,5',
        },
      }),
    ];

    toolsManager.registerElementTools('enhanced', customElementTools);

    // Create custom link tools
    const customLinkTools = [
      toolsManager.createLinkTool('Vertices', {
        redundancyRemoval: true,
        snapRadius: 15,
        vertexAdding: true,
      }),
      toolsManager.createLinkTool('Remove', {
        distance: 30,
        markup: [
          {
            tagName: 'circle',
            attributes: {
              r: 10,
              fill: '#e74c3c',
              cursor: 'pointer',
            },
          },
          {
            tagName: 'text',
            textContent: '×',
            attributes: {
              fill: 'white',
              'font-size': 14,
              'text-anchor': 'middle',
              'dominant-baseline': 'central',
              'pointer-events': 'none',
            },
          },
        ],
      }),
    ];

    toolsManager.registerLinkTools('enhanced', customLinkTools);
  }

  /**
   * Demonstrate embedding and grouping
   */
  public createGroupExample(): string {
    const graphManager = this.engine.getGraphManager();
    const graph = this.engine.getGraph();

    // Create multiple elements
    const elem1Id = this.engine.addElement({
      type: 'rectangle',
      position: { x: 500, y: 200 },
      size: { width: 80, height: 60 },
      properties: {
        attrs: {
          body: { fill: '#9b59b6', stroke: '#8e44ad' },
          label: { text: 'Item 1' },
        },
      },
    });

    const elem2Id = this.engine.addElement({
      type: 'circle',
      position: { x: 600, y: 200 },
      size: { width: 60, height: 60 },
      properties: {
        attrs: {
          body: { fill: '#e67e22', stroke: '#d35400' },
          label: { text: 'Item 2' },
        },
      },
    });

    const elem3Id = this.engine.addElement({
      type: 'rectangle',
      position: { x: 550, y: 280 },
      size: { width: 80, height: 60 },
      properties: {
        attrs: {
          body: { fill: '#1abc9c', stroke: '#16a085' },
          label: { text: 'Item 3' },
        },
      },
    });

    // Create group
    const groupId = graphManager.createGroup(graph, [elem1Id, elem2Id, elem3Id], {
      properties: {
        attrs: {
          body: {
            fill: 'rgba(52, 152, 219, 0.1)',
            stroke: '#3498db',
            strokeWidth: 2,
            strokeDasharray: '10,5',
            rx: 10,
            ry: 10,
          },
          label: {
            text: 'Group Container',
            fontSize: 14,
            fill: '#2c3e50',
            fontWeight: 'bold',
          },
        },
      },
    });

    // Auto-fit group to children with padding
    setTimeout(() => {
      graphManager.fitParentToChildren(graph, groupId, 25);
    }, 100);

    return groupId;
  }

  /**
   * Demonstrate standard serialization
   */
  public demonstrateSerialization(): void {
    const dataManager = this.engine.getDataManager();
    const graph = this.engine.getGraph();

    // Serialize using JointJS standard format
    const standardData = dataManager.serialize(graph);
    console.log('JointJS Standard Format:', standardData);

    // Serialize using custom format (backward compatibility)
    const customData = dataManager.serializeToCustomFormat(graph);
    console.log('Custom Format:', customData);

    // Export to JSON string
    const jsonString = dataManager.exportToJSON(graph, true);
    console.log('JSON Export:', jsonString);
  }

  /**
   * Helper methods
   */
  private highlightElement(elementId: string): void {
    const element = this.engine.getGraphManager().getElement(this.engine.getGraph(), elementId);
    if (element) {
      // Add highlight effect
      element.attr('body/stroke', '#e74c3c');
      element.attr('body/strokeWidth', 4);
    }
  }

  private clearSelection(): void {
    const graph = this.engine.getGraph();
    graph.getElements().forEach((element) => {
      element.attr('body/stroke', '#333333');
      element.attr('body/strokeWidth', 2);
    });
  }

  private editElementLabel(elementId: string): void {
    const element = this.engine.getGraphManager().getElement(this.engine.getGraph(), elementId);
    if (element) {
      const newLabel = prompt('Enter new label:', element.attr('label/text') || '');
      if (newLabel !== null) {
        element.attr('label/text', newLabel);
      }
    }
  }

  /**
   * Run complete demonstration
   */
  public runDemo(): void {
    console.log('🚀 Starting Enhanced Features Demo');

    // 1. Create custom shapes
    this.createCustomShapes();
    console.log('✅ Custom shapes created');

    // 2. Create shapes with ports
    const portsElements = this.createShapesWithPorts();
    console.log('✅ Shapes with ports created:', portsElements);

    // 3. Setup custom tools
    this.setupCustomTools();
    console.log('✅ Custom tools configured');

    // 4. Create group example
    const groupId = this.createGroupExample();
    console.log('✅ Group created:', groupId);

    // 5. Demonstrate serialization
    setTimeout(() => {
      this.demonstrateSerialization();
      console.log('✅ Serialization demonstrated');
    }, 500);

    console.log('🎉 Demo completed! Interact with the diagram to see enhanced features.');
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    this.engine.destroy();
  }
}

// Usage example:
// const container = document.getElementById('diagram-container');
// const demo = new EnhancedFeaturesExample(container);
// demo.runDemo();
