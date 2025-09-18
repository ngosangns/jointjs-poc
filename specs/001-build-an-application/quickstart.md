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
import { DiagramEngine, DiagramConfig } from 'lib';

constructor(private elementRef: ElementRef) {}

ngAfterViewInit() {
  const host = this.elementRef.nativeElement.querySelector('#canvas') as HTMLElement;
  const config: DiagramConfig = { width: host.clientWidth, height: host.clientHeight, gridSize: 10 };
  this.engine = new DiagramEngine(config);
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
// Elements & links (API varies by app wrappers)
this.engine.addElement({
  type: 'rectangle',
  position: { x: 100, y: 100 },
  size: { width: 100, height: 60 },
});
this.engine.addLink({ source: { id: 'a' }, target: { id: 'b' } });

// History
this.engine.undo();
this.engine.redo();
const canUndo = this.engine.canUndo();
const canRedo = this.engine.canRedo();

// View
this.engine.zoomIn();
this.engine.zoomOut();
this.engine.setZoom(1.25);
this.engine.pan(10, 0);
this.engine.panTo(0, 0);
this.engine.fitToViewport(20);

// Grid
this.engine.grid.enable(true);
this.engine.grid.setSpacing(20);
```

## Events

```ts
this.engine.addEventListener('element:selected', (e) => console.log(e));
this.engine.addEventListener('document:saved', (e) => console.log(e));
this.engine.addEventListener('viewport:changed', ({ zoom, pan }) => console.log({ zoom, pan }));
```

## Toolbar Integration

- Bind buttons to engine commands (undo, redo, align, distribute, group)
- Toggle grid and snapping via engine settings

## Persistence

- No direct IndexedDB usage in Angular. The library persists automatically (autosave policy).

## Tests

```bash
yarn test:lib   # runs Jest for the library
yarn e2e        # runs Playwright E2E against Angular app
```
