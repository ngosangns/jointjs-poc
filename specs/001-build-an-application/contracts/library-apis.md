# Library API Contracts

## Initialization (DiagramService)

- initialize(config: DiagramConfig): void
- attachToElement(element: HTMLElement): void

## Persistence

- load(documentId: string): Promise<void>
- save(documentId?: string): Promise<void>
- exportData(): DiagramData | null
- loadData(data: DiagramData): void

## Editing

- addElement(element: Partial<DiagramElement>): string
- addLink(link: Partial<DiagramLink>): string
- insertShapeAtPosition(shapeMetadata: ShapeMetadata, position: { x: number; y: number }): string
- getCenterPosition(): { x: number; y: number }
- clear(): void

## Selection & Movement

- selectAll(): void
- deselectAll(): void
- deleteSelected(): void
- duplicateSelected(dx?: number, dy?: number): string[]
- moveSelected(dx: number, dy: number): void
- getSelectedElements(): any[]

## View & Interaction

- zoomIn(factor?: number): void
- zoomOut(factor?: number): void
- setZoom(z: number): void
- getZoom(): number
- pan(dx: number, dy: number): void
- panTo(x: number, y: number, smooth?: boolean): void
- fitToViewport(padding?: number): void
- zoomToFit(padding?: number): void
- zoomToSelection(padding?: number): void

## Grid Controls

- setGridEnabled(enabled: boolean): void
- setGridSize(size: number): void
- toggleGrid(): boolean
- isGridEnabled(): boolean
- getGridSize(): number

## Events

- addEventListener(eventType: any, callback: Function): void
- removeEventListener(eventType: any, callback: Function): void
- selection$: Observable<{ hasSelection: boolean; elementIds: string[]; linkIds: string[] }>

### Event Names

- selection:changed
- selection:cleared
- element:added | element:updated | element:removed
- link:added | link:updated | link:removed
- viewport:changed
- document:saved | document:loaded

## Performance

- getPerformanceStats(): any
- setPerformanceOptimizations(options: object): void
- enableShapeInsertionOptimizations(): void

## Error Handling

- Methods throw Error with descriptive messages
- Shape insertion includes viewport validation and error feedback
