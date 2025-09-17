/**
 * Core diagram engine using JointJS - Refactored with modular architecture
 */

import { dia } from '@joint/core';
import {
  DiagramConfig,
  DiagramData,
  DiagramElement,
  DiagramEventType,
  DiagramLink,
} from '../types';
import { LinkFactory, ShapeFactory } from './factories';
import {
  IDataManager,
  IEventManager,
  IGraphManager,
  ILinkFactory,
  IPaperManager,
  IShapeFactory,
  IToolsManager,
} from './interfaces';
import { DataManager, EventManager, GraphManager, PaperManager, ToolsManager } from './managers';

export class DiagramEngine {
  private graph: dia.Graph;
  private paper: dia.Paper | null = null;
  private config: DiagramConfig;

  // Managers
  private eventManager: IEventManager;
  private dataManager: IDataManager;
  private paperManager: IPaperManager;
  private graphManager: IGraphManager;
  private toolsManager: IToolsManager;

  // Factories
  private shapeFactory: IShapeFactory;
  private linkFactory: ILinkFactory;

  constructor(
    config: DiagramConfig,
    eventManager?: IEventManager,
    dataManager?: IDataManager,
    paperManager?: IPaperManager,
    graphManager?: IGraphManager,
    toolsManager?: IToolsManager,
    shapeFactory?: IShapeFactory,
    linkFactory?: ILinkFactory
  ) {
    this.config = { ...config };
    this.graph = new dia.Graph();

    // Initialize managers (allow dependency injection for testing)
    this.eventManager = eventManager || new EventManager();
    this.dataManager = dataManager || new DataManager();
    this.paperManager = paperManager || new PaperManager();
    this.graphManager = graphManager || new GraphManager();
    this.toolsManager = toolsManager || new ToolsManager();

    // Initialize factories
    this.shapeFactory = shapeFactory || new ShapeFactory();
    this.linkFactory = linkFactory || new LinkFactory();

    this.initializeEventListeners();
  }

  /**
   * Initialize the diagram paper with a DOM element
   */
  public initializePaper(element: HTMLElement): void {
    if (this.paper) {
      this.paperManager.destroy(this.paper);
    }

    this.paper = this.paperManager.initialize(element, this.graph, this.config);
    this.paperManager.setupEvents(this.paper, this.eventManager);

    // Initialize EventManager with graph and paper for JointJS event integration
    this.eventManager.initialize(this.graph, this.paper);

    // Initialize ToolsManager with paper for tools management
    this.toolsManager.initialize(this.paper);
  }

  /**
   * Add an element to the diagram
   */
  public addElement(elementConfig: Partial<DiagramElement>): string {
    return this.graphManager.addElement(this.graph, elementConfig, this.shapeFactory);
  }

  /**
   * Add a link between two elements
   */
  public addLink(linkConfig: Partial<DiagramLink>): string {
    return this.graphManager.addLink(this.graph, linkConfig, this.linkFactory);
  }

  /**
   * Remove an element from the diagram
   */
  public removeElement(elementId: string): void {
    this.graphManager.removeElement(this.graph, elementId);
  }

  /**
   * Remove a link from the diagram
   */
  public removeLink(linkId: string): void {
    this.graphManager.removeLink(this.graph, linkId);
  }

  /**
   * Get all diagram data
   */
  public getDiagramData(): DiagramData {
    return this.dataManager.serialize(this.graph);
  }

  /**
   * Load diagram data
   */
  public loadDiagramData(data: DiagramData): void {
    this.dataManager.deserialize(data, this.graph, this.shapeFactory, this.linkFactory);
  }

  /**
   * Clear the entire diagram
   */
  public clear(): void {
    this.graphManager.clear(this.graph);
  }

  /**
   * Resize the diagram
   */
  public resize(width: number, height: number): void {
    this.config.width = width;
    this.config.height = height;

    if (this.paper) {
      this.paperManager.resize(this.paper, width, height);
    }
  }

  /**
   * Add event listener
   */
  public addEventListener(eventType: DiagramEventType, callback: Function): void {
    this.eventManager.addEventListener(eventType, callback);
  }

  /**
   * Remove event listener
   */
  public removeEventListener(eventType: DiagramEventType, callback: Function): void {
    this.eventManager.removeEventListener(eventType, callback);
  }

  /**
   * Destroy the diagram engine
   */
  public destroy(): void {
    if (this.paper) {
      this.paperManager.destroy(this.paper);
      this.paper = null;
    }
    this.eventManager.destroy();
    this.toolsManager.destroy();
    this.graph.clear();
  }

  /**
   * Initialize event listeners for graph changes
   */
  private initializeEventListeners(): void {
    // Event listeners will be initialized when paper is created
    // through eventManager.initialize() in initializePaper()
  }

  // Getter methods for accessing managers and factories (useful for extensions)

  /**
   * Get the event manager instance
   */
  public getEventManager(): IEventManager {
    return this.eventManager;
  }

  /**
   * Get the data manager instance
   */
  public getDataManager(): IDataManager {
    return this.dataManager;
  }

  /**
   * Get the paper manager instance
   */
  public getPaperManager(): IPaperManager {
    return this.paperManager;
  }

  /**
   * Get the graph manager instance
   */
  public getGraphManager(): IGraphManager {
    return this.graphManager;
  }

  /**
   * Get the shape factory instance
   */
  public getShapeFactory(): IShapeFactory {
    return this.shapeFactory;
  }

  /**
   * Get link factory instance
   */
  public getLinkFactory(): ILinkFactory {
    return this.linkFactory;
  }

  /**
   * Get tools manager instance
   */
  public getToolsManager(): IToolsManager {
    return this.toolsManager;
  }

  /**
   * Get the underlying JointJS graph
   */
  public getGraph(): dia.Graph {
    return this.graph;
  }

  /**
   * Get the underlying JointJS paper
   */
  public getPaper(): dia.Paper | null {
    return this.paper;
  }

  /**
   * Get the current configuration
   */
  public getConfig(): DiagramConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<DiagramConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}
