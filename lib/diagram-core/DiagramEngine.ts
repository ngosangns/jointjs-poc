import { dia } from '@joint/core';
import type {
  DiagramConfig,
  DiagramElement,
  DiagramEventType,
} from '../types';
import { LinkFactory, ShapeFactory } from './factories';
import type {
  IDataManager,
  IEventManager,
  IGraphManager,
  ILinkFactory,
  IPaperManager,
  IShapeFactory,
  IToolsManager,
} from './interfaces';
import {
  DataManager,
  EventManager,
  GraphManager,
  PaperManager,
  PersistenceManager,
  ToolsManager,
} from './managers';
import { KeyboardManager } from './managers/KeyboardManager';

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
  private persistence: PersistenceManager;
  private keyboardManager: KeyboardManager;

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
    linkFactory?: ILinkFactory,
    options?: { persistence?: PersistenceManager }
  ) {
    this.config = { ...config };
    this.graph = new dia.Graph();

    // Initialize managers (allow dependency injection for testing)
    this.eventManager = eventManager || new EventManager();
    this.dataManager = dataManager || new DataManager();
    this.paperManager = paperManager || new PaperManager();
    this.graphManager = graphManager || new GraphManager();
    this.toolsManager = toolsManager || new ToolsManager();
    this.persistence = options?.persistence || new PersistenceManager();

    // Initialize factories
    this.shapeFactory = shapeFactory || new ShapeFactory();
    this.linkFactory = linkFactory || new LinkFactory();

    // Initialize keyboard manager
    this.keyboardManager = new KeyboardManager();
  }

  /**
   * Initialize the diagram paper with a DOM element
   */
  public initializePaper(element: HTMLElement): void {
    if (this.paper) {
      this.paperManager.destroy(this.paper);
    }

    this.paper = this.paperManager.initialize(element, this.graph, this.config);
    this.paperManager.setupPaperEvents(this.paper, this.eventManager);

    // Initialize EventManager with graph and paper for JointJS event integration
    this.eventManager.initialize(this.graph, this.paper);

    // Setup graph event bridging via GraphManager
    try {
      this.graphManager.setupGraphEvents(this.graph, this.eventManager);
    } catch (error) {
      console.error('GraphManager setupGraphEvents error:', error);
    }

    // Initialize ToolsManager with paper for tools management
    this.toolsManager.initialize(this.paper);

    // Initialize KeyboardManager with paper, graph, and event manager
    try {
      this.keyboardManager.initialize(this.paper, this.graph, this.eventManager);
    } catch (error) {
      console.error('KeyboardManager initialization error:', error);
    }
  }

  /**
   * Add an element to the diagram
   */
  public addElement(elementConfig: Partial<DiagramElement>): string {
    return this.graphManager.addElement(this.graph, elementConfig, this.shapeFactory);
  }



  /**
   * Clear the entire diagram
   */
  public clear(): void {
    this.graphManager.clear(this.graph);
  }


  // Cursor-centered zoom methods
  public zoomIn(step: number = 1.2): void {
    const paper = this.paper;
    if (!paper) return;

    const { sx } = this.paperManager.getScale(paper);
    const newScale = sx * step;
    const clampedScale = Math.max(0.1, Math.min(5.0, newScale));

    // Use provided cursor position or get current mouse position
    const cursorPos = this.paperManager.getMousePosition();

    // Calculate new pan offset to keep cursor position fixed
    const scaleChange = clampedScale / sx;
    const currentTranslate = paper.translate();

    const newTx = currentTranslate.tx - cursorPos.x * (scaleChange - 1);
    const newTy = currentTranslate.ty - cursorPos.y * (scaleChange - 1);

    paper.scale(clampedScale);
    paper.translate(newTx, newTy);
  }

  public zoomOut(step: number = 1 / 1.2): void {
    const paper = this.paper;
    if (!paper) return;

    const { sx } = this.paperManager.getScale(paper);
    const newScale = sx * step;
    const clampedScale = Math.max(0.1, Math.min(5.0, newScale));

    // Use provided cursor position or get current mouse position
    const cursorPos = this.paperManager.getMousePosition();

    // Calculate new pan offset to keep cursor position fixed
    const scaleChange = clampedScale / sx;
    const currentTranslate = paper.translate();

    const newTx = currentTranslate.tx - cursorPos.x * (scaleChange - 1);
    const newTy = currentTranslate.ty - cursorPos.y * (scaleChange - 1);

    paper.scale(clampedScale);
    paper.translate(newTx, newTy);
  }


  public getZoom(): number {
    const paper = this.paper;
    if (!paper) return 1;
    const { sx } = this.paperManager.getScale(paper);
    return sx;
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
   * Destroy the diagram engine
   */
  public destroy(): void {
    if (this.paper) {
      this.paperManager.destroy(this.paper);
      this.paper = null;
    }
    this.eventManager.destroy();
    this.toolsManager.destroy();
    this.keyboardManager.destroy();
    this.graph.clear();
  }




  /**
   * Get the underlying JointJS paper
   */
  public getPaper(): dia.Paper | null {
    return this.paper;
  }

  /**
   * Calculate the center position of the paper accounting for current pan and zoom
   */
  public calculatePaperCenter(): { x: number; y: number } {
    if (!this.paper) {
      throw new Error('Paper not initialized.');
    }
    return this.paperManager.calculatePaperCenter(this.paper);
  }



  // Grid controls exposed on engine
  public grid = {
    toggle: (): boolean => {
      const next = this.toolsManager.toggleGrid();
      if (this.paper) {
        const currentScale = this.paper.scale().sx;
        const currentTranslate = this.paper.translate();
        this.paperManager.setGrid(this.paper, next);
        this.paper.scale(currentScale);
        this.paper.translate(currentTranslate.tx, currentTranslate.ty);
      }
      return next;
    },
    isEnabled: (): boolean => {
      return this.toolsManager.getGridEnabled();
    },
  };


  /** Duplicate current selection with a configurable offset */
  public duplicateSelectedElements(
    offset: { dx: number; dy: number } = { dx: 20, dy: 20 }
  ): string[] {
    if (!this.paper) return [];
    // For now, return empty array since selection tracking was removed
    // This method is kept for compatibility but doesn't function
    return [];
  }







}
