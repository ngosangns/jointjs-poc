# Tasks: Pan (Translate), Move Shapes, and Links Features

**Feature**: Enhanced pan/zoom and shape movement capabilities  
**Branch**: `001-build-an-application`  
**Date**: 2025-01-27  
**Dependencies**: Core diagram engine, JointJS integration, event system

## Overview

This task list implements comprehensive pan (translate), shape movement, and link manipulation features for the draw.io-like diagramming application. The implementation follows TDD principles with contract tests first, then core functionality, and finally integration.

## Task Dependencies

```
Setup → Contract Tests → Core Implementation → Integration → Polish
  ↓           ↓              ↓                ↓          ↓
T001      T002-T003      T004-T010        T011-T013   T014-T015
```

## Artifacts Used

- Plan: `/Users/ngosangns/Github/jointjs-poc/specs/001-build-an-application/plan.md`
- Data Model: `/Users/ngosangns/Github/jointjs-poc/specs/001-build-an-application/data-model.md`
- Contracts: `/Users/ngosangns/Github/jointjs-poc/specs/001-build-an-application/contracts/{events.md,library-apis.md}`
- Quickstart: `/Users/ngosangns/Github/jointjs-poc/specs/001-build-an-application/quickstart.md`

## Conventions

- [P] means can run in parallel with other [P] tasks.
- Paths are absolute.
- Use TDD: write/enable tests before implementation.

---

### T001. Setup enhanced pan/zoom and movement test infrastructure [P]

- **Path(s)**:
  - `/Users/ngosangns/Github/jointjs-poc/lib/tests/contract/pan-zoom-movement.spec.ts` (new)
  - `/Users/ngosangns/Github/jointjs-poc/e2e/tests/pan-zoom-movement.spec.ts` (new)
- **Actions**:
  - Create contract test file for pan/zoom and movement APIs
  - Create E2E test file for user interaction scenarios
  - Set up test data with multiple shapes and links for movement testing
  - Define performance benchmarks (60fps for pan, <100ms for shape movement)
- **Commands**:
  - `yarn test:lib -- -t "pan-zoom-movement"`
  - `yarn e2e -- -g "pan zoom movement"`

### T002. Add contract tests for pan/zoom API compliance [P]

- **Path(s)**:
  - `/Users/ngosangns/Github/jointjs-poc/lib/tests/contract/pan-zoom-movement.spec.ts`
  - **Contracts**: `/Users/ngosangns/Github/jointjs-poc/specs/001-build-an-application/contracts/library-apis.md`
- **Actions**:
  - Test `zoomIn()`, `zoomOut()`, `setZoom(z)` methods
  - Test `panTo(x,y)`, `fitToViewport()` methods
  - Verify zoom bounds (0.1x to 5x) and smooth transitions
  - Test `viewport:changed` event emission with correct payload shape
- **Commands**:
  - `yarn test:lib -- -t "pan zoom API"`
- **Notes**: Tests should fail before implementation, ensuring TDD compliance.

### T003. Add contract tests for shape and link movement [P]

- **Path(s)**:
  - `/Users/ngosangns/Github/jointjs-poc/lib/tests/contract/pan-zoom-movement.spec.ts`
  - **Contracts**: `/Users/ngosangns/Github/jointjs-poc/specs/001-build-an-application/contracts/events.md`
- **Actions**:
  - Test `moveSelectedElements(dx, dy)` method
  - Test individual shape movement via `updateShape(id, { geometry })`
  - Test link movement and vertex manipulation
  - Verify `element:updated` events with geometry changes
  - Test movement constraints (bounds checking, grid snapping)
- **Commands**:
  - `yarn test:lib -- -t "shape link movement"`
- **Notes**: Ensure events emit correct payload shapes per contracts.

### T004. Enhance pan/zoom implementation in DiagramEngine

- **Path(s)**:
  - `/Users/ngosangns/Github/jointjs-poc/lib/diagram-core/DiagramEngine.ts`
  - `/Users/ngosangns/Github/jointjs-poc/lib/diagram-core/managers/PaperManager.ts`
- **Actions**:
  - Implement `panTo(x: number, y: number)` method
  - Implement `fitToViewport(padding?: number)` method
  - Add zoom bounds checking (0.1x to 5x)
  - Enhance `emitViewportChanged()` to emit `{ zoom, pan }` instead of `{ scale, translate }`
  - Add smooth transition support for pan/zoom operations
- **Dependencies**: T002 (contract tests)
- **Notes**: Update existing zoom methods to use consistent event payload format.

### T005. Implement advanced shape movement with constraints

- **Path(s)**:
  - `/Users/ngosangns/Github/jointjs-poc/lib/diagram-core/DiagramEngine.ts`
  - `/Users/ngosangns/Github/jointjs-poc/lib/diagram-core/managers/GraphManager.ts`
- **Actions**:
  - Enhance `moveSelectedElements(dx, dy)` with bounds checking
  - Add grid snapping support for moved elements
  - Implement `moveElement(id, dx, dy)` for individual element movement
  - Add collision detection for overlapping elements
  - Ensure moved elements stay within page bounds
- **Dependencies**: T003 (contract tests)
- **Notes**: Integrate with existing ToolsManager for grid settings.

### T006. Implement link movement and vertex manipulation

- **Path(s)**:
  - `/Users/ngosangns/Github/jointjs-poc/lib/diagram-core/DiagramEngine.ts`
  - `/Users/ngosangns/Github/jointjs-poc/lib/diagram-core/links/CustomLinks.ts`
- **Actions**:
  - Add `moveLinkVertex(linkId, vertexIndex, x, y)` method
  - Add `addLinkVertex(linkId, x, y)` and `removeLinkVertex(linkId, vertexIndex)` methods
  - Implement link routing updates when source/target elements move
  - Add link movement constraints (maintain connection validity)
- **Dependencies**: T003 (contract tests)
- **Notes**: Ensure links update automatically when connected elements move.

### T007. Add keyboard navigation and movement shortcuts

- **Path(s)**:
  - `/Users/ngosangns/Github/jointjs-poc/lib/diagram-core/managers/KeyboardManager.ts`
- **Actions**:
  - Implement arrow key movement (1px, 10px with Shift)
  - Add Page Up/Down for zoom, Home/End for fit viewport
  - Add Ctrl+Arrow for pan operations
  - Implement keyboard-based element selection and movement
- **Dependencies**: T004, T005 (core movement)
- **Notes**: Ensure accessibility compliance with WCAG 2.1 AA.

### T008. Implement touch gesture support for pan/zoom

- **Path(s)**:
  - `/Users/ngosangns/Github/jointjs-poc/lib/diagram-core/managers/PaperManager.ts`
  - `/Users/ngosangns/Github/jointjs-poc/lib/diagram-core/DiagramEngine.ts`
- **Actions**:
  - Add touch event handlers for pan gestures
  - Implement pinch-to-zoom with touch
  - Add touch-based element selection and movement
  - Ensure smooth touch interactions (60fps target)
- **Dependencies**: T004 (pan/zoom core)
- **Notes**: Basic touch support only, advanced gestures deferred.

### T009. Add movement history and undo/redo support

- **Path(s)**:
  - `/Users/ngosangns/Github/jointjs-poc/lib/diagram-core/managers/HistoryManager.ts`
  - `/Users/ngosangns/Github/jointjs-poc/lib/diagram-core/DiagramEngine.ts`
- **Actions**:
  - Track pan/zoom operations in history
  - Track shape and link movement operations
  - Implement granular undo/redo for movement operations
  - Add batch operation support for multiple element moves
- **Dependencies**: T005, T006 (movement core)
- **Notes**: Integrate with existing history system.

### T010. Implement performance optimizations for large diagrams

- **Path(s)**:
  - `/Users/ngosangns/Github/jointjs-poc/lib/diagram-core/DiagramEngine.ts`
  - `/Users/ngosangns/Github/jointjs-poc/lib/diagram-core/managers/PaperManager.ts`
- **Actions**:
  - Add viewport culling for off-screen elements during pan
  - Implement movement batching for multiple elements
  - Add performance monitoring for pan/zoom operations
  - Optimize event emission frequency during continuous operations
- **Dependencies**: T004, T005 (core functionality)
- **Notes**: Target 60fps for 3k elements, 30fps for 10k elements.

### T011. Integrate pan/zoom with Angular canvas component

- **Path(s)**:
  - `/Users/ngosangns/Github/jointjs-poc/src/app/components/diagram-canvas/diagram-canvas.ts`
  - `/Users/ngosangns/Github/jointjs-poc/src/app/services/diagram.ts`
- **Actions**:
  - Add mouse wheel zoom support
  - Implement drag-to-pan functionality
  - Add zoom controls to UI toolbar
  - Expose pan/zoom state in component
- **Dependencies**: T004 (pan/zoom core)
- **Notes**: Update existing service methods to use new API.

### T012. Add shape movement UI controls and feedback

- **Path(s)**:
  - `/Users/ngosangns/Github/jointjs-poc/src/app/components/diagram-canvas/diagram-canvas.html`
  - `/Users/ngosangns/Github/jointjs-poc/src/app/components/diagram-canvas/diagram-canvas.scss`
- **Actions**:
  - Add visual feedback for selected elements during movement
  - Implement drag handles for shape resizing
  - Add movement constraints visualization (grid, bounds)
  - Show element coordinates during movement
- **Dependencies**: T005 (shape movement core)
- **Notes**: Enhance existing canvas UI with movement indicators.

### T013. Create comprehensive E2E tests for user interactions

- **Path(s)**:
  - `/Users/ngosangns/Github/jointjs-poc/e2e/tests/pan-zoom-movement.spec.ts`
- **Actions**:
  - Test mouse wheel zoom and drag-to-pan
  - Test touch gestures on mobile devices
  - Test keyboard navigation and shortcuts
  - Test shape selection and movement workflows
  - Test link manipulation and vertex editing
  - Verify performance under load (3k+ elements)
- **Dependencies**: T011, T012 (UI integration)
- **Commands**:
  - `yarn e2e -- -g "pan zoom movement"`

### T014. Add unit tests for movement algorithms and constraints

- **Path(s)**:
  - `/Users/ngosangns/Github/jointjs-poc/lib/tests/unit/movement.spec.ts` (new)
  - `/Users/ngosangns/Github/jointjs-poc/lib/tests/unit/pan-zoom.spec.ts` (new)
- **Actions**:
  - Test bounds checking algorithms
  - Test grid snapping calculations
  - Test collision detection logic
  - Test performance optimization functions
  - Test edge cases (empty selections, invalid coordinates)
- **Dependencies**: T010 (performance optimizations)
- **Commands**:
  - `yarn test:lib -- -t "movement algorithms"`

### T015. Performance testing and optimization validation

- **Path(s)**:
  - `/Users/ngosangns/Github/jointjs-poc/lib/scripts/perf-scenarios.ts`
- **Actions**:
  - Add performance test scenarios for pan/zoom with large diagrams
  - Test movement performance with 3k+ elements
  - Validate 60fps target for typical operations
  - Add memory usage monitoring during operations
  - Create performance regression tests
- **Dependencies**: T014 (unit tests)
- **Commands**:
  - `yarn test:perf`

## Parallel Execution Examples

### Phase 1: Contract Tests (can run in parallel)

```bash
# Terminal 1
yarn test:lib -- -t "pan zoom API"

# Terminal 2
yarn test:lib -- -t "shape link movement"

# Terminal 3
yarn e2e -- -g "pan zoom movement"
```

### Phase 2: Core Implementation (sequential due to shared files)

```bash
# Must run in order due to DiagramEngine.ts modifications
yarn test:lib -- -t "pan zoom API" && \
yarn test:lib -- -t "shape link movement" && \
# Then implement T004, T005, T006 sequentially
```

### Phase 3: Integration (can run in parallel)

```bash
# Terminal 1
# Implement T011 (Angular integration)

# Terminal 2
# Implement T012 (UI controls)

# Terminal 3
# Implement T013 (E2E tests)
```

## Success Criteria

- [ ] All contract tests pass
- [ ] Pan/zoom operations achieve 60fps with 3k elements
- [ ] Shape movement respects grid snapping and bounds
- [ ] Link movement maintains connection validity
- [ ] Touch gestures work smoothly on mobile devices
- [ ] Keyboard navigation is fully accessible
- [ ] Movement operations are properly undoable
- [ ] E2E tests cover all user interaction scenarios
- [ ] Performance targets met under load testing

## Notes

- Follow TDD approach: contract tests must fail initially
- Maintain backward compatibility with existing API
- Ensure all events follow contract specifications
- Performance is critical for user experience
- Accessibility compliance required for keyboard navigation
- Touch support should be basic but functional
