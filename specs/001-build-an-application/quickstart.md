# Quickstart: Using the Diagram Core Library in Angular

## Install & Build

- Ensure workspace builds `lib` first (yarn build or ng build lib)
- Angular app imports public APIs from `lib/index.ts`

## Run

```bash
yarn start
# open http://localhost:4200
```

## Initialize

```ts
import { DiagramEditor, DiagramConfig } from 'lib';

constructor(private elementRef: ElementRef) {}

ngAfterViewInit() {
  const host = this.elementRef.nativeElement.querySelector('#canvas') as HTMLElement;
  const config: DiagramConfig = { width: host.clientWidth, height: host.clientHeight, gridSize: 10 };
  this.engine = new DiagramEditor(config);
  this.engine.initializePaper(host);
}
```

## Load / Save

```ts
await this.engine.load('current');
await this.engine.save('current');
```

## Commands

```ts
// Elements & links (via DiagramService)
this.diagramService.addElement({
  type: 'basic.Rect',
  position: { x: 100, y: 100 },
  size: { width: 100, height: 60 },
});
this.diagramService.addLink({
  source: { id: 'element1' },
  target: { id: 'element2' },
});

// Shape insertion from toolbar
const centerPosition = this.diagramService.getCenterPosition();
const elementId = this.diagramService.insertShapeAtPosition(shapeMetadata, centerPosition);

// View (via DiagramService)
this.diagramService.zoomIn();
this.diagramService.zoomOut();
this.diagramService.setZoom(1.25);
this.diagramService.pan(10, 0);
this.diagramService.panTo(0, 0);
this.diagramService.fitToViewport(20);

// Grid
this.diagramService.setGridEnabled(true);
this.diagramService.setGridSize(20);
```

## Events

```ts
// Via DiagramService (recommended)
this.diagramService.addEventListener('selection:changed', (e) => {
  const { elementIds, linkIds, hasSelection } = e.data;
  console.log('selection changed', { elementIds, linkIds, hasSelection });
});

// Via RxJS Observable (for reactive patterns)
this.diagramService.selection$.subscribe((selection) => {
  console.log('selection changed', selection);
});

// Direct engine access (advanced)
const engine = this.diagramService.getEngine();
engine.addEventListener('viewport:changed', (e) => {
  const { zoom, pan } = e.data;
  console.log({ zoom, pan });
});
```

## Toolbar Integration

- ✅ **Shape Toolbar**: Click shapes to insert at viewport center
- ✅ **Selection Actions**: Delete/Duplicate buttons show only when selection exists
- ✅ **Grid Controls**: Toggle grid and adjust spacing via DiagramService
- ✅ **Visual Feedback**: Loading states and success/error animations

## Persistence

- No direct IndexedDB usage in Angular. The library persists automatically (autosave policy).

## Tests

```bash
yarn test:lib   # runs Jest for the library
yarn e2e        # runs Playwright E2E against Angular app
```

## Tailwind CSS

Tailwind is preconfigured via `tailwind.config.js` and `postcss.config.js`. Global utilities are enabled in `src/styles.scss` via:

```scss
@tailwind base;
@tailwind components;
@tailwind utilities;
```

You can safely add utility classes to templates (e.g., `min-h-screen`, `grid`) alongside existing SCSS.

## Panning

- Blank-drag pans the canvas; element drag moves the element.
- Programmatic: `engine.pan(dx, dy)` and `engine.panTo(x, y)`; the engine emits `viewport:changed` on pan/zoom.
