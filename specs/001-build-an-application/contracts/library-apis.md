# Library API Contracts

## Initialization

- create(options): DiagramEngine
  - options.host: HTMLElement
  - options.page?: PageInit

## Persistence

- load({ documentId }): Promise<void>
- save({ documentId }): Promise<void>
- export({ format: 'png'|'svg'|'pdf', scale?: number }): Promise<Blob>
- import({ format: 'drawio-xml', data: string|ArrayBuffer }): Promise<void>

## Editing

- addShape(shapeInit): Id
- updateShape(id, patch): void
- removeShape(id): void
- connect({ sourceId, targetId, sourcePortId?, targetPortId? }): Id
- updateLink(id, patch): void
- removeLink(id): void
- group(ids): GroupId
- ungroup(groupId): void
- layer: add, rename, reorder, setVisible, setLocked, moveElements

## View & Interaction

- zoomIn(), zoomOut(), setZoom(z)
- panTo(x,y), fitToViewport()
- grid: enable(bool), setSpacing(n)

## History

- undo(), redo(), canUndo(), canRedo()

## Events

- on(eventName, handler): unsubscribe
- off(eventName, handler)

### Event Names

- selection:changed
- element:added | element:updated | element:removed
- link:added | link:updated | link:removed
- viewport:changed
- document:saved | document:loaded

## Error Handling

- Methods reject with ValidationError | NotFoundError | PersistenceError
