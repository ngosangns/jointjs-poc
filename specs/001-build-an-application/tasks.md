Feature: Fix grid toggle element loss; add press-and-hold/press-and-drag selection & drag behavior

Conventions:

- [P] = can run in parallel with other [P] tasks
- Paths are absolute; all commands run from repo root `/Users/ngosangns/Github/jointjs-poc`

T003. Implement grid toggle safety in library core (no element loss)

- Path: `/Users/ngosangns/Github/jointjs-poc/lib/diagram-core/managers/PaperManager.ts`, `/Users/ngosangns/Github/jointjs-poc/lib/diagram-core/DiagramEngine.ts`
- Actions:
  - Ensure grid enable/disable only mutates paper/background/grid layer, not the graph content or element collections.
  - Preserve references to `Graph` and `Paper`; avoid reinitializing collections on grid toggle.
  - Snapshot and restore viewport/pan/zoom if grid toggle triggers re-render.
  - Verify `EventManager` continues emitting selection events; do not clear selection on grid toggle.
- Dependencies: T001
- Command: `yarn build:lib && yarn test:lib -t grid-toggle-preserves-elements`

T004. Implement drag start threshold and press-hold activation in ToolsManager

- Path: `/Users/ngosangns/Github/jointjs-poc/lib/diagram-core/managers/ToolsManager.ts`, `/Users/ngosangns/Github/jointjs-poc/lib/diagram-core/managers/EventManager.ts`
- Actions:
  - Introduce config: `interaction.dragStartThresholdPx` (default 4) and `interaction.pressHoldMs` (default 200) in `DiagramEngine` options.
  - Modify element interaction handlers to:
    - On pointerdown: set `isPotentialDrag=true`, start hold timer; record origin point.
    - On pointermove: if `isPotentialDrag` and distance >= threshold, start drag; else ignore small jitter.
    - On hold timer fire without move: start drag mode; next move moves element.
    - On click (pointerup with no drag): only selection toggles; do not move.
  - Ensure keyboard modifiers (Shift multi-select) continue to work.
- Dependencies: T001, [P] with T003
- Command: `yarn build:lib && yarn test:lib -t drag-start-threshold`

T005. Expose new interaction options via public API

- Path: `/Users/ngosangns/Github/jointjs-poc/lib/diagram-core/index.ts`, `/Users/ngosangns/Github/jointjs-poc/lib/index.ts`, `/Users/ngosangns/Github/jointjs-poc/lib/diagram-core/DiagramEngine.ts`
- Actions:
  - Extend `DiagramConfig` to include `interaction?: { dragStartThresholdPx?: number; pressHoldMs?: number }`.
  - Wire options into `ToolsManager`.
  - Update typing in `lib/dist` build output as needed.
- Dependencies: T004
- Command: `yarn build:lib`

T007. Persist and validate selection state across grid toggles

- Path: `/Users/ngosangns/Github/jointjs-poc/lib/diagram-core/managers/Selection logic` (likely `EventManager.ts` or `GraphManager.ts`)
- Actions:
  - Ensure grid toggle does not emit `selection:cleared` unless user interaction clears.
  - Add unit tests to assert selection is stable across toggles.
- Dependencies: T003
- Command: `yarn test:lib -t selection stable across grid`

T008. Documentation and examples [P]

- Path: `/Users/ngosangns/Github/jointjs-poc/specs/001-build-an-application/quickstart.md`, `/Users/ngosangns/Github/jointjs-poc/lib/dist/examples`
- Actions:
  - Update `quickstart.md` with `interaction` options and recommended thresholds.
  - Add example in `dist/examples` demonstrating click-to-select vs drag-to-move.
- Dependencies: T005

Parallel execution guidance:

- run T003 and T004 in parallel; they touch different managers but coordinate via `DiagramEngine` options.
- After T004, run T005 and T007 in parallel if code touch points differ; otherwise serialize.
- 008 can run once API is exposed.

Task agent commands:

```bash
yarn build:lib
```

Test tasks (additive to the above):

T009. Unit test: Grid toggle preserves elements and viewport

- Path: `/Users/ngosangns/Github/jointjs-poc/lib/tests/unit/GridToggle.spec.ts`
- Asserts:
  - Toggling grid on/off does not remove or recreate elements/links (IDs stable).
  - Selection is not cleared by grid toggles; `selection:cleared` not emitted.
  - Viewport pan/zoom is restored after grid toggles within tolerance.
- Dependencies: T003
- Command: `npm --workspace lib run test -- -t grid-toggle-preserves-elements`

T010. Unit test: Drag start threshold and press-hold activation

- Path: `/Users/ngosangns/Github/jointjs-poc/lib/tests/unit/InteractionThreshold.spec.ts`
- Asserts:
  - Pointer move below threshold does not emit drag/move; click selects only.
  - Crossing threshold emits `element:dragging` and results in movement.
  - Press-and-hold without move for `pressHoldMs` emits `element:dragging` and movement on next move.
  - Shift multi-select still works with threshold logic.
- Dependencies: T004, T005
- Command: `npm --workspace lib run test -- -t drag-start-threshold`

T011. Unit test: Public API exposes interaction options

- Path: `/Users/ngosangns/Github/jointjs-poc/lib/tests/unit/PublicApi.spec.ts`
- Asserts:
  - `DiagramConfig['interaction']` has `dragStartThresholdPx` and `pressHoldMs` typings.
  - Creating `DiagramEngine` with `interaction` options propagates to `PaperManager`.
- Dependencies: T005
- Command: `npm --workspace lib run test -- -t interaction options`

T012. Unit test: Selection state stable across grid toggles

- Path: `/Users/ngosangns/Github/jointjs-poc/lib/tests/unit/SelectionAcrossGrid.spec.ts`
- Asserts:
  - Selecting one or more elements keeps `getSelectionState()` unchanged after grid toggles.
  - No `selection:cleared` event fires on grid toggles unless user action clears.
- Dependencies: T003, T007
- Command: `npm --workspace lib run test -- -t selection stable across grid`

Parallel execution guidance for tests:

- Run T009 and T011 in parallel; they touch separate concerns.
- Run T010 after T005; then T012 after T003/T007.

Task agent commands (tests):

```bash
npm --workspace lib run test -- -t grid-toggle-preserves-elements
npm --workspace lib run test -- -t drag-start-threshold
npm --workspace lib run test -- -t "interaction options"
npm --workspace lib run test -- -t "selection stable across grid"
```
