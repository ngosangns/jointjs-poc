# Paper and Graph Initialization Steps

**Feature**: Draw.io-like Diagramming Application  
**Branch**: `001-build-an-application`  
**Date**: 2025-01-27  
**Scope**: Document initialization steps for paper and graph when loading the page

## Overview

This document outlines the complete initialization flow for the diagramming application, from Angular component lifecycle to JointJS paper and graph setup. The initialization process ensures proper setup of the diagram engine, paper rendering, and graph management.

## Initialization Flow

### Step 1: Angular Component Initialization

**File**: `src/app/components/diagram-canvas/diagram-canvas.ts`

**Lifecycle**: `ngOnInit()`

```typescript
ngOnInit(): void {
  // Initialize diagram service
  this.diagramService.initialize({
    width: 800,
    height: 600,
    gridSize: 10,
    interactive: true,
  });
}
```

**What happens**:

1. Component implements `OnInit`, `AfterViewInit`, and `OnDestroy` lifecycle hooks
2. `ngOnInit()` initializes the diagram service with configuration
3. Sets up basic diagram parameters (width, height, grid size, interactivity)

### Step 2: Diagram Service Initialization

**File**: `src/app/services/diagram.ts`

**Method**: `initialize(config: DiagramConfig)`

```typescript
initialize(config: DiagramConfig): void {
  this.diagramEngine = new DiagramEngine(config);
}
```

**What happens**:

1. Service constructor initializes private properties:
   - `diagramEngine: DiagramEngine | null = null`
   - `autosaveTimer: any = null`
   - Autosave configuration (idle time, operation threshold)
2. Creates new DiagramEngine instance with configuration

### Step 3: DiagramEngine Constructor Setup

**File**: `lib/diagram-core/DiagramEngine.ts`

**Constructor**:

```typescript
constructor(
  config: DiagramConfig,
  eventManager?: IEventManager,
  dataManager?: IDataManager,
  paperManager?: IPaperManager,
  graphManager?: IGraphManager,
  toolsManager?: IToolsManager,
  shapeFactory?: IShapeFactory,
  linkFactory?: ILinkFactory,
  options?: { persistence?: PersistenceManager; history?: HistoryManager<string> }
) {
  // Initialize core managers with dependency injection or defaults
  // Create JointJS graph instance
  this.graph = new dia.Graph();
  // Setup event listeners
  this.initializeEventListeners();
}
```

**What happens**:

1. Constructor receives configuration and optional managers
2. Initialize core managers with dependency injection or defaults
3. Create JointJS graph instance: `this.graph = new dia.Graph()`
4. Setup event listeners: `this.initializeEventListeners()`

### Step 4: Manager Initialization (Parallel)

#### Graph Manager

**File**: `lib/diagram-core/managers/GraphManager.ts`

- Initialize graph manager with JointJS graph instance
- Setup graph-level event listeners
- Configure graph options (validation, cell namespace)
- Prepare graph for paper attachment

#### Paper Manager

**File**: `lib/diagram-core/managers/PaperManager.ts`

- Initialize paper manager with configuration
- Setup paper-specific options (grid, interactive, validation, highlighting)
- Prepare paper initialization method for DOM attachment

#### Event Manager

**File**: `lib/diagram-core/managers/EventManager.ts`

- Initialize event manager with empty state
- Setup event mappings and handlers
- Prepare for graph and paper integration
- Initialize event listener registry

### Step 5: DOM Element Attachment

**File**: `src/app/components/diagram-canvas/diagram-canvas.ts`

**Lifecycle**: `ngAfterViewInit()`

```typescript
ngAfterViewInit(): void {
  // Attach diagram to DOM element
  if (this.diagramContainer?.nativeElement) {
    this.diagramService.attachToElement(this.diagramContainer.nativeElement);
  }
}
```

**What happens**:

1. Get DOM element reference: `this.diagramContainer.nativeElement`
2. Call service attachment: `this.diagramService.attachToElement(element)`
3. Set test attributes for E2E testing
4. Expose engine to window for testing

### Step 6: Paper Initialization

**File**: `lib/diagram-core/DiagramEngine.ts`

**Method**: `initializePaper(element: HTMLElement)`

```typescript
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

  // Initialize KeyboardManager with paper, graph, and event manager
  this.keyboardManager.initialize(this.paper, this.graph, this.eventManager);
}
```

**What happens**:

1. Destroy existing paper if present: `this.paperManager.destroy(this.paper)`
2. Initialize new paper: `this.paper = this.paperManager.initialize(element, this.graph, this.config)`
3. Setup paper events: `this.paperManager.setupEvents(this.paper, this.eventManager)`
4. Initialize event manager: `this.eventManager.initialize(this.graph, this.paper)`
5. Initialize tools manager: `this.toolsManager.initialize(this.paper)`
6. Initialize keyboard manager: `this.keyboardManager.initialize(this.paper, this.graph, this.eventManager)`

### Step 7: JointJS Paper Creation

**File**: `lib/diagram-core/managers/PaperManager.ts`

**Method**: `initialize(element: HTMLElement, graph: dia.Graph, config: DiagramConfig)`

```typescript
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
    allowDrag: true,
    allowDrop: true,
    defaultLink: () => new shapes.standard.Link(),
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
    validateConnection: function (cellViewS, magnetS, cellViewT, magnetT, end, linkView) {
      // Connection validation logic
      if (magnetS && magnetT) {
        const sourcePortGroup = magnetS.getAttribute('port-group');
        const targetPortGroup = magnetT.getAttribute('port-group');
        if (sourcePortGroup === targetPortGroup) {
          return false;
        }
      }
      return cellViewS !== cellViewT;
    },
  });

  return paper;
}
```

**What happens**:

1. Create JointJS paper instance with configuration
2. Configure paper-specific settings (grid, highlighting, validation)
3. Return configured paper instance

### Step 8: Event System Setup

**File**: `lib/diagram-core/managers/EventManager.ts`

**Method**: `initialize(graph: dia.Graph, paper: dia.Paper)`

```typescript
public initialize(graph: dia.Graph, paper: dia.Paper): void {
  this.graph = graph;
  this.paper = paper;
  this.setupJointJSEventListeners();
}
```

**What happens**:

1. Store graph and paper references: `this.graph = graph; this.paper = paper`
2. Setup JointJS event listeners: `this.setupJointJSEventListeners()`
3. Map JointJS events to application events
4. Initialize event handler registry

### Step 9: Tools and Keyboard Manager Setup

#### Tools Manager

**File**: `lib/diagram-core/managers/ToolsManager.ts`

- Initialize tools manager with paper instance
- Setup tool-specific event handlers
- Configure tool interactions and behaviors
- Prepare tools for user interaction

#### Keyboard Manager

**File**: `lib/diagram-core/managers/KeyboardManager.ts`

- Initialize keyboard manager with paper, graph, and event manager
- Detect platform for appropriate modifier keys
- Setup default keyboard shortcuts
- Attach keyboard event listeners
- Configure platform-specific behaviors

### Step 10: UI State Initialization

**File**: `src/app/components/diagram-canvas/diagram-canvas.ts`

**Lifecycle**: `ngAfterViewInit()` (continued)

```typescript
// Initialize grid state
this.isGridEnabled = this.diagramService.isGridEnabled();
this.currentZoom = this.diagramService.getZoom();
```

**What happens**:

1. Initialize grid state: `this.isGridEnabled = this.diagramService.isGridEnabled()`
2. Initialize zoom level: `this.currentZoom = this.diagramService.getZoom()`
3. Setup event listeners for UI updates
4. Configure mouse wheel zoom and drag-to-pan
5. Setup performance monitoring
6. Update history state for undo/redo buttons

### Step 11: Event Listener Registration

**File**: `src/app/components/diagram-canvas/diagram-canvas.ts`

**Method**: `setupEventListeners()`

```typescript
private setupEventListeners(): void {
  // Listen for viewport changes to update zoom and pan display
  this.diagramService.addEventListener('viewport:changed', (event: any) => {
    this.currentZoom = event.data.zoom;
    this.currentPan = event.data.pan;
    this.cdr.detectChanges();
  });

  // Listen for selection changes
  this.diagramService.addEventListener('element:selected', () => {
    this.updateSelectionState();
  });

  // Setup mouse wheel zoom
  this.setupMouseWheelZoom();

  // Setup drag-to-pan
  this.setupDragToPan();
}
```

**What happens**:

1. Register viewport change listener: `'viewport:changed'`
2. Register element selection listeners: `'element:selected'`, `'canvas:clicked'`
3. Setup mouse wheel zoom functionality
4. Setup drag-to-pan functionality
5. Setup performance monitoring interval
6. Configure change detection for Angular updates

### Step 12: Cleanup and Error Handling

**File**: `src/app/components/diagram-canvas/diagram-canvas.ts`

**Lifecycle**: `ngOnDestroy()`

```typescript
ngOnDestroy(): void {
  this.diagramService.destroy();
}
```

**What happens**:

1. Destroy diagram service: `this.diagramService.destroy()`
2. Clean up event listeners
3. Clear timers and intervals
4. Remove window references
5. Ensure proper memory cleanup

## Key Dependencies

### External Libraries

- JointJS (@joint/core)
- Angular framework
- TypeScript

### Internal Dependencies

- DiagramEngine
- Manager classes (Paper, Graph, Event, Tools, Keyboard)
- Configuration interfaces
- Service layer

## Configuration Options

### DiagramConfig

```typescript
interface DiagramConfig {
  width: number;
  height: number;
  gridSize?: number;
  interactive?: boolean;
  background?: { color: string };
}
```

### Manager Options

- EventManager: Custom event handling
- DataManager: Data persistence
- PaperManager: Paper-specific settings
- GraphManager: Graph configuration
- ToolsManager: Tool behaviors
- ShapeFactory: Custom shapes
- LinkFactory: Custom links

## Success Criteria

1. ✅ Paper renders correctly in DOM element
2. ✅ Graph is properly attached to paper
3. ✅ All managers are initialized and functional
4. ✅ Event system is working
5. ✅ User interactions are responsive
6. ✅ Memory is properly managed
7. ✅ Error handling is robust
8. ✅ Performance is acceptable

## Error Handling

### Validation Errors

- Ensure DOM element exists before paper initialization
- Validate configuration parameters
- Check for required dependencies

### Initialization Failures

- Graceful fallback for missing managers
- Error logging for debugging
- User feedback for critical failures

### Memory Management

- Proper cleanup in ngOnDestroy
- Clear event listeners
- Remove DOM references

## Performance Considerations

### Initialization Optimization

- Lazy loading of non-critical managers
- Deferred setup of heavy operations
- Efficient DOM manipulation

### Memory Management

- Proper cleanup of JointJS instances
- Event listener removal
- Timer and interval cleanup

## Notes

- Initialization is split across multiple lifecycle hooks for optimal performance
- Managers use dependency injection for testability
- Event system provides loose coupling between components
- Cleanup is critical for memory management
- Configuration is flexible and extensible
