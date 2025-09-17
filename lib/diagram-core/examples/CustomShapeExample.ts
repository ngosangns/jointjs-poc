/**
 * Example demonstrating how to use custom shapes and links
 */

import { DiagramConfig } from '../../types';
import { DiagramEngine } from '../DiagramEngine';
import {
  BidirectionalLink,
  CompositionLink,
  ControlFlowLink,
  DataFlowLink,
  DependencyLink,
  InheritanceLink,
  MessageLink,
} from '../links/CustomLinks';
import { ActorShape, DatabaseShape, DecisionShape, ProcessShape } from '../shapes/CustomShapes';

/**
 * Example class showing how to extend the diagram engine with custom shapes and links
 */
export class CustomShapeExample {
  private engine: DiagramEngine;

  constructor(config: DiagramConfig) {
    this.engine = new DiagramEngine(config);
    this.registerCustomShapes();
    this.registerCustomLinks();
  }

  /**
   * Register custom shapes with the shape factory
   */
  private registerCustomShapes(): void {
    const shapeFactory = this.engine.getShapeFactory();

    // Register custom shapes
    shapeFactory.registerShape('process', ProcessShape, {
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
          fill: '#1976D2',
        },
      },
    });

    shapeFactory.registerShape('decision', DecisionShape, {
      attrs: {
        body: {
          fill: '#FFF3E0',
          stroke: '#F57C00',
          strokeWidth: 2,
        },
        label: {
          text: 'Decision?',
          fontSize: 12,
          fill: '#F57C00',
        },
      },
    });

    shapeFactory.registerShape('database', DatabaseShape, {
      attrs: {
        body: {
          fill: '#E8F5E8',
          stroke: '#4CAF50',
          strokeWidth: 2,
        },
        label: {
          text: 'Database',
          fontSize: 12,
          fill: '#4CAF50',
        },
      },
    });

    shapeFactory.registerShape('actor', ActorShape, {
      attrs: {
        body: {
          stroke: '#9C27B0',
          strokeWidth: 3,
        },
        label: {
          text: 'User',
          fontSize: 12,
          fill: '#9C27B0',
        },
      },
    });
  }

  /**
   * Register custom links with the link factory
   */
  private registerCustomLinks(): void {
    const linkFactory = this.engine.getLinkFactory();

    // Register custom links
    linkFactory.registerLink('dataflow', DataFlowLink);
    linkFactory.registerLink('controlflow', ControlFlowLink);
    linkFactory.registerLink('dependency', DependencyLink);
    linkFactory.registerLink('inheritance', InheritanceLink);
    linkFactory.registerLink('composition', CompositionLink);
    linkFactory.registerLink('message', MessageLink);
    linkFactory.registerLink('bidirectional', BidirectionalLink);
  }

  /**
   * Create a sample workflow diagram
   */
  public createWorkflowDiagram(): void {
    // Add actor
    const actorId = this.engine.addElement({
      type: 'actor',
      position: { x: 50, y: 100 },
      size: { width: 60, height: 100 },
    });

    // Add process
    const processId = this.engine.addElement({
      type: 'process',
      position: { x: 200, y: 120 },
      size: { width: 120, height: 60 },
    });

    // Add decision
    const decisionId = this.engine.addElement({
      type: 'decision',
      position: { x: 400, y: 100 },
      size: { width: 100, height: 80 },
    });

    // Add database
    const databaseId = this.engine.addElement({
      type: 'database',
      position: { x: 600, y: 110 },
      size: { width: 80, height: 100 },
    });

    // Connect with custom links
    this.engine.addLink({
      source: actorId,
      target: processId,
      type: 'message',
    });

    this.engine.addLink({
      source: processId,
      target: decisionId,
      type: 'controlflow',
    });

    this.engine.addLink({
      source: decisionId,
      target: databaseId,
      type: 'dataflow',
    });

    this.engine.addLink({
      source: databaseId,
      target: processId,
      type: 'dependency',
    });
  }

  /**
   * Create a class diagram example
   */
  public createClassDiagram(): void {
    // Add base class
    const baseClassId = this.engine.addElement({
      type: 'rectangle',
      position: { x: 200, y: 50 },
      size: { width: 150, height: 80 },
      properties: {
        attrs: {
          label: { text: 'BaseClass' },
        },
      },
    });

    // Add derived class
    const derivedClassId = this.engine.addElement({
      type: 'rectangle',
      position: { x: 200, y: 200 },
      size: { width: 150, height: 80 },
      properties: {
        attrs: {
          label: { text: 'DerivedClass' },
        },
      },
    });

    // Add component class
    const componentId = this.engine.addElement({
      type: 'rectangle',
      position: { x: 450, y: 200 },
      size: { width: 150, height: 80 },
      properties: {
        attrs: {
          label: { text: 'Component' },
        },
      },
    });

    // Connect with inheritance
    this.engine.addLink({
      source: derivedClassId,
      target: baseClassId,
      type: 'inheritance',
    });

    // Connect with composition
    this.engine.addLink({
      source: derivedClassId,
      target: componentId,
      type: 'composition',
    });
  }

  /**
   * Get the diagram engine instance
   */
  public getEngine(): DiagramEngine {
    return this.engine;
  }

  /**
   * Initialize the diagram with a DOM element
   */
  public initialize(element: HTMLElement): void {
    this.engine.initializePaper(element);
  }

  /**
   * Demonstrate event handling
   */
  public setupEventHandlers(): void {
    const eventManager = this.engine.getEventManager();

    // Listen for element selection
    eventManager.addEventListener('element:selected', (event: any) => {
      console.log('Element selected:', event.data.id);
    });

    // Listen for link creation
    eventManager.addEventListener('link:connected', (event: any) => {
      console.log('Link connected:', event.data);
    });

    // Listen for element changes
    eventManager.addEventListener('element:changed', (event: any) => {
      console.log('Element changed:', event.data.id, event.data.changes);
    });
  }

  /**
   * Export diagram data using serialize method
   */
  public exportDiagram(): string {
    const dataManager = this.engine.getDataManager();
    const diagramData = dataManager.serialize(this.engine.getGraph());
    return JSON.stringify(diagramData, null, 2);
  }

  /**
   * Import diagram data using deserialize method
   */
  public importDiagram(jsonData: string): void {
    const dataManager = this.engine.getDataManager();
    const diagramData = JSON.parse(jsonData);
    dataManager.deserialize(
      diagramData,
      this.engine.getGraph(),
      this.engine.getShapeFactory(),
      this.engine.getLinkFactory()
    );
  }
}

/**
 * Usage example
 */
export function createCustomDiagramExample(): CustomShapeExample {
  const config: DiagramConfig = {
    width: 800,
    height: 600,
    gridSize: 10,
    interactive: true,
    background: { color: '#f8f9fa' },
  };

  const example = new CustomShapeExample(config);
  example.setupEventHandlers();

  return example;
}
