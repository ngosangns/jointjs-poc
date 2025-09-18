Feature: Show Delete/Duplicate only when a shape or link is selected (not on hover)

Scope: Adjust selection-driven UI behavior across the Angular app toolbar and the diagram core events so that the delete and duplicate actions appear only when one or more shapes/links are selected. Maintain existing keyboard shortcuts and command APIs.

Conventions:

- [P] means tasks that can run in parallel with other [P] tasks.
- Numbering indicates execution order; respect dependencies in the Dependency Notes.

T001. Validate contracts for selection events and toolbar visibility [P]

- Files: `/Users/ngosangns/Github/jointjs-poc/specs/001-build-an-application/contracts/events.md`, `/Users/ngosangns/Github/jointjs-poc/specs/001-build-an-application/contracts/library-apis.md`
- Goal: Confirm there are contract-level expectations for selection events (`element:selected`, `link:selected`, `selection:changed`) and toolbar visibility rules. If missing, update the contracts file(s) to define: when selection becomes non-empty → show delete/duplicate; when empty → hide.
- Output: Updated contracts docs with explicit selection → toolbar visibility mapping; event names and payload shape.
- Dependency Notes: None.
- Example commands:
  - Edit contracts to add acceptance criteria.

T002. Add/verify selection events in diagram core library (library-level contracts)

- Files: `/Users/ngosangns/Github/jointjs-poc/lib/diagram-core/managers/EventManager.ts`, `/Users/ngosangns/Github/jointjs-poc/lib/diagram-core/managers/GraphManager.ts`, `/Users/ngosangns/Github/jointjs-poc/lib/diagram-core/DiagramEngine.ts`, `/Users/ngosangns/Github/jointjs-poc/lib/diagram-core/managers/ToolsManager.ts`
- Goal: Ensure the engine emits consistent selection lifecycle events: `selection:changed` with payload `{ elementIds: string[], linkIds: string[] }`. Confirm existing `element:selected` / `link:selected` are fired, and add `selection:cleared` if selection empties.
- Output: Selection events standardized and exported via public API.
- Dependency Notes: Requires T001 decisions to finalize event names/payloads.
- Example commands:
  - yarn test:lib

T003. Expose selection observable/API at public surface [P]

- Files: `/Users/ngosangns/Github/jointjs-poc/lib/index.ts`, `/Users/ngosangns/Github/jointjs-poc/lib/diagram-core/index.ts`
- Goal: Export `addEventListener` types and selection event names in the library public API so Angular app can subscribe.
- Output: Type-safe exports and docs.
- Dependency Notes: After T002.

T004. Angular service: bridge selection events to app state

- Files: `/Users/ngosangns/Github/jointjs-poc/src/app/services/diagram.ts`
- Goal: Subscribe to engine `selection:changed` and expose `selection$` (BehaviorSubject) with `{ hasSelection: boolean, elementIds: string[], linkIds: string[] }`.
- Output: New observable and minimal unit coverage.
- Dependency Notes: After T003.

T005. Implement toolbar visibility logic in `shape-toolbar` component

- Files: `/Users/ngosangns/Github/jointjs-poc/src/app/components/shape-toolbar/shape-toolbar.ts`, `/Users/ngosangns/Github/jointjs-poc/src/app/components/shape-toolbar/shape-toolbar.html`
- Goal: Show the Delete and Duplicate buttons only when `hasSelection === true`; hide when `false`. Remove any hover-triggered visibility logic for these two actions.
- Output: Conditional template/host bindings; CSS adjustments if needed.
- Dependency Notes: After T004.

T006. Remove hover-based triggers for delete/duplicate in canvas UI

- Files: `/Users/ngosangns/Github/jointjs-poc/src/app/components/diagram-canvas/diagram-canvas.ts`, `/Users/ngosangns/Github/jointjs-poc/src/app/components/diagram-canvas/diagram-canvas.html`, `/Users/ngosangns/Github/jointjs-poc/src/app/components/diagram-canvas/diagram-canvas.scss`
- Goal: If any hover listeners or overlays toggle delete/duplicate visibility, remove them. Keep other hover affordances intact (e.g., resizing handles).
- Output: Cleaned interaction logic; relies solely on selection state for these two actions.
- Dependency Notes: After T004.

T007. Wire toolbar actions to existing engine commands [P]

- Files: `/Users/ngosangns/Github/jointjs-poc/src/app/components/shape-toolbar/shape-toolbar.ts`, `/Users/ngosangns/Github/jointjs-poc/src/app/services/diagram.ts`
- Goal: Ensure Delete invokes engine delete on current selection; Duplicate clones current selection. Preserve keyboard shortcuts.
- Output: Verified command wiring; no visual regressions.
- Dependency Notes: After T005.

T008. Unit tests: diagram service selection stream [P]

- Files: `/Users/ngosangns/Github/jointjs-poc/lib/tests/unit/` (if reinstated) or Angular test location; prefer library tests for events payload and Angular tests for service.
- Goal: Test `selection:changed` propagation and `selection$` derivation of `hasSelection`.
- Output: Green tests.
- Dependency Notes: After T004.

T009. E2E tests: toolbar visibility and actions

- Files: `/Users/ngosangns/Github/jointjs-poc/e2e/tests/` (new spec file)
- Goal: Playwright scenario: no selection → delete/duplicate hidden; select shape → buttons visible; duplicate creates a copy; delete clears selection and hides buttons; same for link.
- Output: Passing E2E spec covering both shape and link.
- Dependency Notes: After T005 and T006.
- Example commands:
  - yarn e2e

T010. Documentation updates [P]

- Files: `/Users/ngosangns/Github/jointjs-poc/specs/001-build-an-application/quickstart.md`, `/Users/ngosangns/Github/jointjs-poc/specs/001-build-an-application/contracts/events.md`
- Goal: Document selection-driven visibility behavior and example subscription code.
- Output: Updated docs.
- Dependency Notes: After T005.

T011. Refactor styles if needed [P]

- Files: `/Users/ngosangns/Github/jointjs-poc/src/app/components/shape-toolbar/shape-toolbar.scss`, `/Users/ngosangns/Github/jointjs-poc/src/styles.scss`
- Goal: Ensure no CSS hover rules still control delete/duplicate visibility; use state classes/attributes bound to selection.
- Output: Clean CSS with state-based visibility.
- Dependency Notes: After T005.

T012. Performance sanity and regression check [P]

- Files: `/Users/ngosangns/Github/jointjs-poc/lib/scripts/perf-scenarios.ts`, project build
- Goal: Confirm no measurable regressions from event wiring; run existing perf scenarios.
- Output: Notes in PR.
- Dependency Notes: After T002–T007.

Parallelization Guidance

- [P] Group 1 (docs/contracts): T001, T010 can run in parallel with code tasks once event names are settled.
- [P] Group 2 (public API + wiring): T003, T007, T011, T012 can run in parallel after T002.
- Tests: T008 can run parallel to T005/T006 once T004 is done. T009 after UI wiring completes.

Agent Commands (examples)

```bash
# Library tests and build
yarn test:lib
yarn build

# Angular app dev
yarn start

# E2E
yarn e2e
```

Acceptance Criteria

- With no selection, delete/duplicate controls are not rendered and are not tabbable.
- Selecting a shape shows delete/duplicate; duplicate creates a single identical shape with new IDs; delete removes selected items.
- Selecting a link shows delete/duplicate; actions behave identically for links.
- Clearing selection hides the controls immediately.
- Keyboard shortcuts for delete/duplicate continue to work irrespective of toolbar visibility.

# Tasks: Tailwind Integration & Canvas Interaction Fixes

**Feature**: Add Tailwind CSS; fix shape disappearance on grid toggle; fix duplicate icon; enable shape panning

**Branch**: `001-build-an-application`  
**Dependencies**: Angular app shell, diagram core library (`lib/diagram-core`), events & API contracts  
**Parallel Execution**: Tasks marked with [P] can be executed in parallel

## Setup Tasks

### T001: Integrate Tailwind CSS into Angular app

**Files**: `/Users/ngosangns/Github/jointjs-poc/package.json`, `/Users/ngosangns/Github/jointjs-poc/tailwind.config.js`, `/Users/ngosangns/Github/jointjs-poc/postcss.config.js`, `/Users/ngosangns/Github/jointjs-poc/src/styles.scss`, `/Users/ngosangns/Github/jointjs-poc/angular.json`  
**Description**: Install and configure Tailwind for the Angular application without breaking existing SCSS.  
**Dependencies**: None  
**Implementation**:

- Add Tailwind deps: `tailwindcss postcss autoprefixer`
- Create `tailwind.config.js` with content paths under `src/**/*.html,ts`
- Create `postcss.config.js` and wire Tailwind plugins
- Add `@tailwind base; @tailwind components; @tailwind utilities;` to `src/styles.scss` (keep existing styles below)
- Ensure Angular builds with PostCSS (via default builder or config)

### T002: Align UI styles to Tailwind utility classes [P]

**Files**: `/Users/ngosangns/Github/jointjs-poc/src/app/app.html`, `/Users/ngosangns/Github/jointjs-poc/src/app/app.scss`, `/Users/ngosangns/Github/jointjs-poc/src/app/components/shape-toolbar/shape-toolbar.html`, `/Users/ngosangns/Github/jointjs-poc/src/app/components/shape-toolbar/shape-toolbar.scss`  
**Description**: Non-destructive pass: add utility classes while preserving existing SCSS to verify Tailwind is effective.  
**Dependencies**: T001  
**Implementation**:

- Add minimal Tailwind utilities for layout (flex, gaps) and colors, without deleting SCSS
- Keep selectors stable; prefer class additions for easy revert

## Test Tasks [P]

### T003: Contract tests for events (viewport, element) [P]

**File**: `/Users/ngosangns/Github/jointjs-poc/lib/tests/contract/events.spec.ts`  
**Description**: Ensure `viewport:changed`, `element:*` emit according to `contracts/events.md`.  
**Dependencies**: None  
**Implementation**:

- Assert payload shapes for `selection:changed`, `element:added|updated|removed`, `viewport:changed`

### T004: Contract tests for library APIs (grid, pan) [P]

**File**: `/Users/ngosangns/Github/jointjs-poc/lib/tests/contract/library-apis.spec.ts`  
**Description**: Validate `grid.enable(bool)`, `grid.setSpacing(n)`, `panTo(x,y)`, `setZoom(z)` per `contracts/library-apis.md`.  
**Dependencies**: None

### T005: E2E tests for grid toggle and panning [P]

**File**: `/Users/ngosangns/Github/jointjs-poc/e2e/tests/grid-and-pan.spec.ts`  
**Description**: Playwright scenarios: toggling grid does not remove shapes; canvas pans while shapes remain interactive.  
**Dependencies**: None  
**Implementation**:

- Seed 2 rectangles, toggle grid on/off, verify both remain
- Mouse-drag on empty canvas pans viewport; mouse-drag on shape moves shape (no unintended pan)

## Core Fixes (Library)

### T006: Fix grid toggle removing elements

**Files**: `/Users/ngosangns/Github/jointjs-poc/lib/diagram-core/managers/PaperManager.ts`, `/Users/ngosangns/Github/jointjs-poc/lib/diagram-core/managers/GraphManager.ts`  
**Description**: Ensure enabling/disabling grid updates only grid layer or background without reinitializing graph/paper or clearing elements.  
**Dependencies**: T003, T004 (tests should fail first)  
**Implementation**:

- Replace any paper/graph reinitialization in grid toggle with an idempotent background/grid overlay update
- Maintain reference to current `dia.Graph` and avoid `graph.resetCells([])` during grid setting changes
- Emit `viewport:changed` only if visual viewport changes

### T007: Ensure pan interactions are wired and enabled

**Files**: `/Users/ngosangns/Github/jointjs-poc/lib/diagram-core/managers/PaperManager.ts`, `/Users/ngosangns/Github/jointjs-poc/lib/diagram-core/managers/KeyboardManager.ts`  
**Description**: Enable panning via mouse-drag on empty canvas and via programmatic API `panTo`, keeping shape drag separate.  
**Dependencies**: T003, T004  
**Implementation**:

- Configure JointJS paper options: `interactive: { linkMove: true }`, `defaultInteraction: { blank: { pan: true }, element: { move: true } }` (or equivalent)
- Implement pan handlers that update internal viewport state and emit `viewport:changed`
- Ensure shape drag has priority when mousedown starts on an element; pan only on blank

### T008: Preserve elements across paper configuration updates

**Files**: `/Users/ngosangns/Github/jointjs-poc/lib/diagram-core/managers/PaperManager.ts`  
**Description**: When applying runtime changes (grid size, snap), do not recreate paper or rebind the graph.  
**Dependencies**: T006  
**Implementation**:

- Guard against paper re-creation; update options in place if supported, else update background layer only
- Add regression unit test to cover multiple toggles

## App/UI Fixes

### T009: Fix duplicate button icon

**Files**: `/Users/ngosangns/Github/jointjs-poc/src/app/components/shape-toolbar/shape-toolbar.html`, `/Users/ngosangns/Github/jointjs-poc/src/app/components/shape-toolbar/shape-toolbar.scss`  
**Description**: Replace incorrect icon with the proper duplicate/clone glyph and ensure accessibility label.  
**Dependencies**: None  
**Implementation**:

- Update the button to use the correct SVG/icon font
- Add `aria-label="Duplicate"` and a `title` attribute

### T010: Ensure canvas panning works in the app

**Files**: `/Users/ngosangns/Github/jointjs-poc/src/app/components/diagram-canvas/diagram-canvas.ts`, `/Users/ngosangns/Github/jointjs-poc/src/app/components/diagram-canvas/diagram-canvas.html`  
**Description**: Wire UI events to engine pan/zoom; avoid preventing default on blank drag.  
**Dependencies**: T007  
**Implementation**:

- Add handlers for mousedown/mousemove on blank area to delegate to engine
- Verify wheel+ctrl zoom, wheel-only pan as designed

## Validation & Performance

### T011: Unit tests for grid toggle regression

**File**: `/Users/ngosangns/Github/jointjs-poc/lib/tests/unit/grid-toggle.spec.ts`  
**Description**: Reproduce “shapes disappear when grid toggled” and assert fixed behavior.  
**Dependencies**: T006

### T012: Performance test for pan/zoom stamina [P]

**File**: `/Users/ngosangns/Github/jointjs-poc/lib/tests/performance/pan-zoom-performance.spec.ts`  
**Description**: Ensure performance targets hold while panning with 500+ elements.  
**Dependencies**: T007

## Documentation

### T013: Update quickstart and README with Tailwind and panning

**Files**: `/Users/ngosangns/Github/jointjs-poc/specs/001-build-an-application/quickstart.md`, `/Users/ngosangns/Github/jointjs-poc/specs/001-build-an-application/README.md`  
**Description**: Document Tailwind setup, grid toggle expectations, and panning behaviors.  
**Dependencies**: T001, T007, T009

## Parallel Execution Examples

### Phase 1: Setup (Parallel)

```bash
# Can run together
T001 Integrate Tailwind
T003 Contract tests for events
T004 Contract tests for library APIs
T005 E2E tests for grid & pan
```

### Phase 2: Core Fixes (Sequential where shared files)

```bash
# PaperManager is shared; apply in order
T006 Fix grid toggle removing elements
T007 Ensure pan interactions are wired
T008 Preserve elements across paper updates
```

### Phase 3: App/UI (Parallel)

```bash
T009 Fix duplicate button icon
T010 Ensure canvas panning works in the app
```

### Phase 4: Validation & Docs (Parallel)

```bash
T011 Unit tests for grid regression
T012 Pan/zoom performance test
T013 Update quickstart/README
```

## Dependencies Summary

- **T001** → T002, T013
- **T003** → T006, T007
- **T004** → T006, T007
- **T005** → (validates T006, T007, T010)
- **T006** → T008, T011
- **T007** → T010, T012, T013
- **T009** → —

## Success Criteria

- **Tailwind integrated**: Angular app builds and styles applied via utilities alongside SCSS
- **Grid toggle safe**: Toggling grid on/off never removes or resets existing shapes
- **Duplicate icon fixed**: Correct icon/label in toolbar
- **Panning works**: Mouse-drag on blank pans; dragging on shape moves the shape; programmatic `panTo` updates viewport and emits `viewport:changed`
- **Tests pass**: Contract, unit, performance, and E2E for grid & panning
