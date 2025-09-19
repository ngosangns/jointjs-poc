# Tasks: Enhanced Zoom and Grid Features

**Feature**: Cursor-centered zooming and grid toggle element preservation  
**Branch**: `001-build-an-application`  
**Date**: 2025-01-27  
**Status**: 🔄 IN PROGRESS

## Overview

Implement two key enhancements to improve the user experience:

1. **Cursor-centered zooming**: Zoom operations should center on the mouse cursor position instead of the paper center
2. **Grid toggle element preservation**: When toggling the grid, ensure all elements remain visible and properly positioned on the paper

## Testing Strategy

**IMPORTANT**: This task list focuses on code implementation only. Test generation is a separate phase that occurs AFTER all implementation tasks are completed and the feature is fully functional. Tests will be generated based on the implemented code and acceptance criteria.

## Task Dependencies

- **Setup tasks**: Must complete first
- **Core tasks**: Sequential implementation
- **Integration tasks**: After core implementation
- **Polish tasks [P]**: Can run in parallel after integration

## Tasks

### T001: Setup - Add Mouse Position Tracking to Paper Manager

**File**: `lib/diagram-core/managers/PaperManager.ts`  
**Dependencies**: None  
**Description**: Add mouse position tracking to capture cursor coordinates for zoom operations.

```typescript
// Add mouse position tracking
private mousePosition: { x: number; y: number } = { x: 0, y: 0 };

private setupMouseTracking(paper: dia.Paper): void {
  const paperElement = paper.el;
  if (!paperElement) return;

  paperElement.addEventListener('mousemove', (event: MouseEvent) => {
    this.mousePosition = { x: event.clientX, y: event.clientY };
  });
}
```

### T002: Setup - Add Cursor-Centered Zoom Method to Diagram Engine

**File**: `lib/diagram-core/DiagramEngine.ts`  
**Dependencies**: T001  
**Description**: Add new zoom methods that center on cursor position instead of paper center.

```typescript
// Add cursor-centered zoom methods
public zoomInAtCursor(step: number = 1.2): void {
  // TODO: Implement cursor-centered zoom in
}

public zoomOutAtCursor(step: number = 1 / 1.2): void {
  // TODO: Implement cursor-centered zoom out
}
```

### T003: Core - Implement Cursor Position to Paper Coordinates Conversion

**File**: `lib/diagram-core/DiagramEngine.ts`  
**Dependencies**: T002  
**Description**: Add method to convert screen cursor position to paper coordinates for zoom centering.

```typescript
// Add coordinate conversion method
private screenToPaperCoordinates(screenX: number, screenY: number): { x: number; y: number } {
  // TODO: Convert screen coordinates to paper coordinates
}
```

### T004: Core - Update Zoom Methods to Use Cursor Position

**File**: `lib/diagram-core/DiagramEngine.ts`  
**Dependencies**: T003  
**Description**: Modify existing zoom methods to use cursor position when available.

```typescript
// Update existing zoom methods
public zoomIn(step: number = 1.2, smooth: boolean = false, useCursor: boolean = true): void {
  // TODO: Use cursor position if useCursor is true
}
```

### T005: Core - Add Element Position Validation for Grid Toggle

**File**: `lib/diagram-core/DiagramEngine.ts`  
**Dependencies**: None  
**Description**: Add method to validate and adjust element positions when grid is toggled.

```typescript
// Add element position validation
private validateElementPositionsOnGridToggle(): void {
  // TODO: Ensure all elements remain on paper when grid is toggled
}
```

### T006: Core - Update Grid Toggle to Preserve Element Positions

**File**: `lib/diagram-core/DiagramEngine.ts`  
**Dependencies**: T005  
**Description**: Modify grid toggle functionality to maintain element positions and visibility.

```typescript
// Update grid toggle method
public grid = {
  toggle: (): boolean => {
    // TODO: Preserve element positions during grid toggle
  }
};
```

### T007: Integration - Update Diagram Service Zoom Methods

**File**: `src/app/services/diagram.ts`  
**Dependencies**: T004  
**Description**: Update diagram service to use cursor-centered zoom methods.

```typescript
// Update zoom methods in diagram service
zoomIn(factor: number = 1.2): void {
  // TODO: Use cursor-centered zoom
}

zoomOut(factor: number = 1 / 1.2): void {
  // TODO: Use cursor-centered zoom
}
```

### T008: Integration - Add Mouse Wheel Zoom Support

**File**: `lib/diagram-core/managers/PaperManager.ts`  
**Dependencies**: T004  
**Description**: Add mouse wheel event handling for cursor-centered zooming.

```typescript
// Add mouse wheel zoom support
private setupMouseWheelZoom(paper: dia.Paper, eventManager: IEventManager): void {
  // TODO: Implement mouse wheel zoom with cursor centering
}
```

### T009: Integration - Update Canvas Component Zoom Controls

**File**: `src/app/components/diagram-canvas/diagram-canvas.ts`  
**Dependencies**: T007  
**Description**: Update canvas component to support cursor-centered zoom operations.

```typescript
// Update zoom control methods
onZoomIn(): void {
  // TODO: Use cursor-centered zoom
}

onZoomOut(): void {
  // TODO: Use cursor-centered zoom
}
```

### T010: Integration - Add Grid Toggle Element Preservation

**File**: `src/app/services/diagram.ts`  
**Dependencies**: T006  
**Description**: Update grid toggle method to ensure element preservation.

```typescript
// Update grid toggle method
toggleGrid(): boolean {
  // TODO: Ensure elements remain on paper during grid toggle
}
```

### T011: Polish [P] - Add Smooth Cursor-Centered Zoom Animation

**File**: `lib/diagram-core/DiagramEngine.ts`  
**Dependencies**: T004  
**Description**: Add smooth animation support for cursor-centered zoom operations.

```typescript
// Add smooth cursor-centered zoom animation
private smoothZoomToAtCursor(paper: dia.Paper, targetScale: number, cursorPosition: { x: number; y: number }): void {
  // TODO: Implement smooth zoom animation centered on cursor
}
```

### T012: Polish [P] - Add Performance Optimization for Grid Toggle

**File**: `lib/diagram-core/DiagramEngine.ts`  
**Dependencies**: T006  
**Description**: Optimize grid toggle performance for large diagrams.

```typescript
// Add performance optimization
private optimizeGridToggleForLargeDiagrams(): void {
  // TODO: Batch operations and viewport culling for grid toggle
}
```

### T013: Core - Add Toolbar Shape Click Handler

**File**: `src/app/components/diagram-canvas/diagram-canvas.ts`  
**Dependencies**: None  
**Description**: Add click handler to toolbar shape items to add shapes to the center of the paper.

```typescript
// Add shape click handler
onShapeClick(shape: ShapeMetadata): void {
  // TODO: Calculate center position of paper and add shape
  const centerPosition = this.calculatePaperCenter();
  this.diagramService.insertShapeAtPosition(shape, centerPosition);
}

// Add method to calculate paper center
private calculatePaperCenter(): { x: number; y: number } {
  // TODO: Calculate center position based on current viewport
}
```

### T014: Core - Add Click Event to Toolbar Shape Items

**File**: `src/app/components/diagram-canvas/diagram-canvas.html`  
**Dependencies**: T013  
**Description**: Add click event handler to shape items in the toolbar.

```html
<!-- Add click handler to shape items -->
<div
  class="shape-item"
  [class.hovered]="isShapeHovered(getShapeType(shape))"
  [attr.data-shape-type]="getShapeType(shape)"
  (mouseenter)="onShapeHover(getShapeType(shape))"
  (mouseleave)="onShapeHoverEnd()"
  (click)="onShapeClick(shape)"
  [title]="shape.description"
></div>
```

### T015: Core - Implement Paper Center Calculation

**File**: `src/app/components/diagram-canvas/diagram-canvas.ts`  
**Dependencies**: T013  
**Description**: Implement method to calculate the center position of the paper viewport.

```typescript
// Implement paper center calculation
private calculatePaperCenter(): { x: number; y: number } {
  // TODO: Get paper dimensions and current pan/zoom to calculate center
  const paperSize = this.diagramService.getPaperSize();
  const currentPan = this.diagramService.getPan();
  const currentZoom = this.diagramService.getZoom();

  // Calculate center position accounting for pan and zoom
  return {
    x: (paperSize.width / 2 - currentPan.x) / currentZoom,
    y: (paperSize.height / 2 - currentPan.y) / currentZoom
  };
}
```

### T016: Integration - Add Paper Size and Pan Methods to Diagram Service

**File**: `src/app/services/diagram.ts`  
**Dependencies**: None  
**Description**: Add methods to get paper size and current pan position for center calculation.

```typescript
// Add paper size and pan methods
getPaperSize(): { width: number; height: number } {
  // TODO: Get current paper dimensions
}

getPan(): { x: number; y: number } {
  // TODO: Get current pan position
}
```

### T017: Polish [P] - Add Accessibility Support for Cursor Zoom

**File**: `src/app/components/diagram-canvas/diagram-canvas.html`  
**Dependencies**: T009  
**Description**: Add ARIA labels and keyboard alternatives for cursor-centered zoom.

```html
<!-- Add accessibility attributes -->
<button
  class="btn"
  (click)="onZoomIn()"
  [attr.aria-label]="'Zoom in at cursor position'"
  title="Zoom in at cursor position"
>
  Zoom-in
</button>
```

## Parallel Execution Examples

### Phase 1: Setup (Sequential)

```bash
# Complete setup tasks first
Task T001: Add mouse position tracking to paper manager
Task T002: Add cursor-centered zoom method to diagram engine
```

### Phase 2: Core Implementation (Sequential)

```bash
# Core tasks must be sequential due to dependencies
Task T003: Implement cursor position to paper coordinates conversion
Task T004: Update zoom methods to use cursor position
Task T005: Add element position validation for grid toggle
Task T006: Update grid toggle to preserve element positions
Task T013: Add toolbar shape click handler
Task T014: Add click event to toolbar shape items
Task T015: Implement paper center calculation
```

### Phase 3: Integration (Sequential)

```bash
# Integration tasks build on core
Task T007: Update diagram service zoom methods
Task T008: Add mouse wheel zoom support
Task T009: Update canvas component zoom controls
Task T010: Add grid toggle element preservation
Task T016: Add paper size and pan methods to diagram service
```

### Phase 4: Polish (Parallel)

```bash
# Polish tasks can run in parallel
Task T011: Add smooth cursor-centered zoom animation [P]
Task T012: Add performance optimization for grid toggle [P]
Task T017: Add accessibility support for cursor zoom [P]
```

## Implementation Notes

1. **Cursor Position Tracking**: Track mouse position relative to paper element for accurate coordinate conversion
2. **Coordinate Conversion**: Convert screen coordinates to paper coordinates accounting for zoom and pan
3. **Zoom Centering**: Calculate new pan offset to keep cursor position fixed during zoom
4. **Element Preservation**: Ensure elements remain within paper bounds when grid is toggled
5. **Toolbar Shape Addition**: Click toolbar shapes to add them to the center of the paper viewport
6. **Paper Center Calculation**: Calculate center position accounting for current pan and zoom state
7. **Performance**: Use viewport culling and batch operations for large diagrams
8. **Accessibility**: Provide keyboard alternatives and clear ARIA labels

## Success Criteria

- [ ] Zoom operations center on mouse cursor position
- [ ] Mouse wheel zoom works with cursor centering
- [ ] Grid toggle preserves all element positions
- [ ] Elements remain visible and properly positioned after grid toggle
- [ ] Clicking toolbar shape items adds shapes to center of paper
- [ ] Paper center calculation accounts for current pan and zoom
- [ ] Smooth animations for cursor-centered zoom
- [ ] Performance optimized for large diagrams
- [ ] Accessibility requirements met
- [ ] Backward compatibility maintained

## File Structure

```
lib/diagram-core/
├── DiagramEngine.ts              # T002, T003, T004, T005, T006, T011, T012
└── managers/
    └── PaperManager.ts           # T001, T008

src/app/
├── services/
│   └── diagram.ts                # T007, T010, T016
└── components/
    └── diagram-canvas/
        ├── diagram-canvas.ts     # T009, T013, T015
        └── diagram-canvas.html   # T014, T017
```

**Note**: Test files (.spec.ts) will be generated in a separate phase after implementation is complete.

---

## Technical Details

### Cursor-Centered Zooming

The cursor-centered zoom feature requires:

1. **Mouse Position Tracking**: Continuous tracking of mouse position relative to the paper element
2. **Coordinate Conversion**: Converting screen coordinates to paper coordinates accounting for current zoom and pan
3. **Zoom Calculation**: Calculating new zoom level and pan offset to keep cursor position fixed
4. **Smooth Animation**: Optional smooth transitions for better user experience

### Grid Toggle Element Preservation

The grid toggle element preservation requires:

1. **Element Position Validation**: Checking all elements remain within paper bounds
2. **Position Adjustment**: Moving elements that would go off-paper back to valid positions
3. **Viewport Preservation**: Maintaining current zoom and pan during grid toggle
4. **Performance Optimization**: Efficient handling of large numbers of elements

---

**Total Tasks**: 17  
**Sequential Tasks**: 14  
**Parallel Tasks**: 3  
**Estimated Implementation Time**: 3-4 days
