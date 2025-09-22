# Diagram Core Library - Enhanced JointJS Integration

A comprehensive diagram library built on top of JointJS with enhanced features and improved architecture following JointJS best practices.

## 🚀 Key Improvements

### ✅ **JointJS Best Practices Integration**

- **Event System**: Leverages JointJS built-in `mvc.Events` instead of custom implementation
- **Serialization**: Uses JointJS standard `graph.toJSON()` format with backward compatibility
- **Cell Namespaces**: Supports JointJS cell namespace pattern for custom shapes
- **Tools Management**: Comprehensive tools system using JointJS `elementTools` and `linkTools`

### 🏗️ **Enhanced Architecture**

- **Dependency Injection**: Full DI support for all managers and factories
- **Modular Design**: Clean separation of concerns with dedicated managers
- **Interface-based**: Comprehensive interfaces for testing and extensibility
- **TypeScript**: Full type safety with proper JointJS type integration

## 📦 Core Components

### Managers

- **EventManager**: JointJS event integration with custom event mapping
- **Viewport**: Paper lifecycle and configuration management
- **GraphManager**: Graph operations with embedding/grouping support
- **ToolsManager**: Interactive tools for elements and links

### Factories

- **ShapeFactory**: Enhanced shape creation with cell namespaces and ports
- **LinkFactory**: Link creation with advanced connection handling

## 🎯 New Features

### 2. Tools Management

```typescript
// Custom element tools
const customTools = [
  toolsManager.createElementTool('Remove'),
  toolsManager.createElementTool('Boundary'),
];
toolsManager.registerElementTools('custom', customTools);

// Show tools on element
toolsManager.showElementTools(elementView, 'custom');
```

### 3. Embedding & Grouping

```typescript
// Create group from elements
const groupId = graphManager.createGroup(graph, ['elem1', 'elem2'], {
  properties: {
    attrs: {
      body: { fill: 'rgba(0,0,0,0.1)' },
      label: { text: 'My Group' },
    },
  },
});

// Embed element
graphManager.embedElement(graph, parentId, childId);

// Auto-fit parent to children
graphManager.fitParentToChildren(graph, parentId, 15);
```

### 4. Enhanced Event System

```typescript
// JointJS events are automatically mapped to custom events
diagramEngine.addEventListener('element:selected', (event) => {
  console.log('Element selected:', event.data);
});

// Direct JointJS event access still available
const paper = diagramEngine.getPaper();
paper.on('element:pointerdown', (elementView) => {
  // Handle JointJS event directly
});
```

### 5. Standard Serialization

```typescript
// JointJS standard format (recommended)
const data = dataManager.serialize(graph);
// Note: JointJS v4.0.0 requires cell namespaces for fromJSON
const cellNamespaces = shapeFactory.getCellNamespaces();
graph.fromJSON(data, { cellNamespaces });

// Custom format (backward compatibility)
const customData = dataManager.serializeToCustomFormat(graph);
dataManager.deserializeCustomFormat(customData, graph, shapeFactory, linkFactory);
```

## 🔧 Usage Example

```typescript
import { DiagramEditor } from './diagram-core';

// Initialize with enhanced features
const engine = new DiagramEditor({
  width: 800,
  height: 600,
  gridSize: 10,
  interactive: true,
});

// Initialize paper
engine.initializePaper(document.getElementById('diagram'));

// Create elements with ports
const rect = engine.getShapeFactory().createShapeWithPorts(
  'rectangle',
  {
    position: { x: 100, y: 100 },
    size: { width: 120, height: 80 },
  },
  {
    groups: {
      in: { position: 'left', attrs: { circle: { fill: '#16A085' } } },
      out: { position: 'right', attrs: { circle: { fill: '#E74C3C' } } },
    },
    items: [
      { group: 'in', id: 'input' },
      { group: 'out', id: 'output' },
    ],
  }
);

// Add to diagram
const elementId = engine.addElement({
  type: 'rectangle',
  position: { x: 100, y: 100 },
  size: { width: 120, height: 80 },
});

// Setup event handling
engine.addEventListener('element:selected', (event) => {
  console.log('Selected element:', event.data.id);
});

// Create group
const groupId = engine.getGraphManager().createGroup(engine.getGraph(), [elementId], {
  properties: { attrs: { label: { text: 'My Group' } } },
});
```

## 🎨 Architecture Benefits

1. **JointJS Compliance**: Follows JointJS patterns and conventions
2. **Performance**: Leverages JointJS optimizations and event system
3. **Extensibility**: Easy to extend with custom shapes, tools, and behaviors
4. **Maintainability**: Clean interfaces and separation of concerns
5. **Testing**: Full dependency injection for comprehensive testing
6. **Type Safety**: Complete TypeScript integration with JointJS types

## 🔄 Migration from Previous Version

The enhanced version maintains backward compatibility while adding new features:

- **Events**: Old event listeners continue to work, new JointJS events available
- **Serialization**: Custom format still supported, JointJS standard recommended
- **Shapes**: Existing shapes work, new namespace features available
- **API**: All existing methods preserved, new methods added

## 📚 Dependencies

- `@joint/core`: JointJS core library
- TypeScript support for full type safety
- Modern ES6+ features for clean, maintainable code

---

**Note**: This implementation follows JointJS best practices and provides a solid foundation for building complex diagram applications with professional-grade features and performance.

This document describes the refactored modular architecture of the diagram-core library, designed for better maintainability, extensibility, and separation of concerns.

## Architecture Overview

The library has been refactored from a monolithic `DiagramEditor` class into a modular architecture with the following components:

### Core Components

```
diagram-core/
├── interfaces/           # Type definitions and contracts
├── managers/            # Business logic managers
├── factories/           # Object creation factories
├── mappers/            # Data format mappers
├── persistence/        # Persistence adapters
├── validators/         # Data validation utilities
├── DiagramEditor.ts    # Main orchestrator
└── index.ts           # Main export file
```

## Key Benefits

1. **Single Responsibility Principle**: Each component has a clear, focused responsibility
2. **Dependency Injection**: Managers and factories can be injected for testing
3. **Extensibility**: Easy to add custom shapes, links, and behaviors
4. **Maintainability**: Code is organized into logical modules
5. **Testability**: Each component can be tested in isolation

## Components

### Interfaces

Define contracts for all major components:

- `IEventManager`: Event handling interface
- `IViewport`: JointJS viewport management interface
- `IGraphManager`: JointJS graph operations interface
- `IToolsManager`: Tools management interface
- `IShapeFactory`: Shape creation interface
- `ILinkFactory`: Link creation interface

### Managers

#### EventManager

Handles all event-related operations:

- Event listener registration/removal
- Event emission
- Cross-component communication

#### Viewport

Manages JointJS paper operations:

- Paper initialization
- Event setup
- Resize operations
- Interaction management

#### GraphManager

Manages JointJS graph operations:

- Element/link addition/removal
- Graph event handling
- Cell management
- Embedding and grouping operations
- Element querying and relationships

#### ToolsManager

Manages interactive tools:

- Element and link tool registration
- Tool visibility and interaction
- Grid controls and settings

### Factories

#### ShapeFactory

Creates and manages shapes:

- Registry pattern for shape types
- Default shape configurations
- Shape creation with validation
- Cell namespace management
- Port configuration and creation

#### LinkFactory

Creates and manages links:

- Registry pattern for link types
- Default link configurations
- Link creation with validation
- Advanced connection handling
- Router and connector configuration

## Usage Examples

### Basic Usage

```typescript
import { DiagramEditor, DiagramConfig } from './diagram-core';

const config: DiagramConfig = {
  width: 800,
  height: 600,
  gridSize: 10,
  interactive: true,
};

const engine = new DiagramEditor(config);
engine.initializePaper(document.getElementById('diagram-container'));

// Add elements
const elementId = engine.addElement({
  type: 'rectangle',
  position: { x: 100, y: 100 },
  size: { width: 120, height: 60 },
});

// Add links
engine.addLink({
  source: elementId,
  target: anotherId,
  type: 'standard',
});
```

### Event Handling

```typescript
const eventManager = engine.getEventManager();

// Listen for events
eventManager.addEventListener('element:selected', (event) => {
  console.log('Element selected:', event.data.id);
});

eventManager.addEventListener('link:connected', (event) => {
  console.log('Link connected:', event.data);
});
```

## Dependency Injection

For testing or custom implementations, you can inject your own managers:

```typescript
import {
  DiagramEditor,
  EventManager,
  Viewport,
  GraphManager,
  ToolsManager,
  ShapeFactory,
  LinkFactory,
} from './diagram-core';

const customEventManager = new EventManager();
const customPaperManager = new Viewport();
const customGraphManager = new GraphManager();
const customToolsManager = new ToolsManager();
const customShapeFactory = new ShapeFactory();
const customLinkFactory = new LinkFactory();

const engine = new DiagramEditor(
  config,
  customEventManager,
  customPaperManager,
  customGraphManager,
  customToolsManager,
  customShapeFactory,
  customLinkFactory
);
```

## Migration from Old Architecture

The public API of `DiagramEditor` remains the same, so existing code should work without changes. However, you now have access to the underlying managers and factories for advanced customization:

```typescript
// Old way (still works)
engine.addEventListener('element:added', callback);

// New way (more flexible)
engine.getEventManager().addEventListener('element:added', callback);
```

## Testing

The modular architecture makes testing much easier:

```typescript
import { EventManager } from './diagram-core/managers/EventManager';
import { DiagramEventType } from './diagram-core/types';

describe('EventManager', () => {
  let eventManager: EventManager;

  beforeEach(() => {
    eventManager = new EventManager();
  });

  it('should add event listeners', () => {
    const callback = jest.fn();
    eventManager.addEventListener('element:added' as DiagramEventType, callback);

    eventManager.emitEvent('element:added' as DiagramEventType, { id: 'test' });

    expect(callback).toHaveBeenCalledWith({
      type: 'element:added',
      data: { id: 'test' },
    });
  });
});
```

## Future Extensions

The modular architecture makes it easy to add new features:

1. **Plugin System**: Create plugins that extend functionality
2. **Theme System**: Add theme management for consistent styling
3. **Validation System**: Comprehensive validation for diagrams (already implemented)
4. **Collaboration**: Add real-time collaboration features
5. **Performance Optimization**: Advanced viewport culling and batch operations

## Best Practices

1. **Use Interfaces**: Always program against interfaces, not concrete implementations
2. **Use Factory Pattern**: Use the factory pattern to register shapes and links
3. **Handle Events**: Use the event system for loose coupling between components
4. **Validate Data**: Always validate data before processing (validation utilities available)
5. **Test Components**: Write unit tests for individual components with dependency injection
6. **Leverage JointJS**: Use JointJS built-in features and patterns for optimal performance
7. **Namespace Management**: Use cell namespaces for shape organization

This refactored architecture provides a solid foundation for building complex diagram applications while maintaining clean, maintainable code.
