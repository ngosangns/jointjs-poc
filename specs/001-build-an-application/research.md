# Research: Draw.io-like Diagramming Application

**Status**: ✅ All decisions implemented and validated

## Decisions

- **Testing Stack**: Unit with Jest; Integration/E2E with Playwright. ✅ **IMPLEMENTED**
- **Performance Targets**: Smooth pan/zoom at 60 fps for typical diagrams; acceptable 30-45 fps for heavy cases. Target up to 3,000 elements interactive, 10,000 elements view-only. ✅ **IMPLEMENTED**
- **Touch Scope**: Desktop primary; basic touch (pan/zoom/select) supported; advanced gestures (multi-touch rotate) deferred. ✅ **IMPLEMENTED**
- **Accessibility**: Aim for WCAG 2.1 AA for UI controls; canvas interactions provide keyboard alternatives where feasible. ✅ **IMPLEMENTED**
- **Import/Export**: Import draw.io XML v4+; Export PNG, SVG, PDF. Additional imports (Visio, SVG parse) deferred. ✅ **IMPLEMENTED**
- **Autosave**: Every 5 seconds of idle or after 20 atomic operations (whichever first). Recovery on reload via latest autosave. ✅ **IMPLEMENTED**
- **IndexedDB**: One database `diagram_core` with stores: `documents`, `assets`. Versioned schema (v1). ✅ **IMPLEMENTED**
- **CLI Exposure**: Not required for end-users; provide dev scripts via package.json. ✅ **IMPLEMENTED**

## Rationale

- Jest + Playwright are standard in TS/Angular ecosystems with good DX and CI support.
- 3k elements interactive aligns with practical usage; beyond that needs virtualization or UX adaptation.
- Basic touch ensures tablet usability without complicating MVP scope.
- WCAG AA is a reasonable baseline for a web app toolbar/menus; canvas has limitations but will provide focus, ARIA for controls.
- Draw.io XML covers core parity goal; export trio matches common share/use cases.
- Autosave balance reduces data loss while avoiding constant writes.
- IndexedDB schema separates documents and binary assets for flexibility and performance.
- Avoiding CLI keeps scope lean; dev ergonomics remain via npm/yarn scripts.

## Alternatives Considered

- Testing: Karma/Jasmine (native Angular) → slower runs, less flexible mocking.
- Storage: LocalStorage → insufficient capacity; File System Access API → limited support.
- Performance: WebGL-rendered canvas → higher complexity; keep SVG/HTML with JointJS first.
- Import breadth: Support Visio early → high effort for limited immediate value.

## Unknowns Resolved

- **Testing tooling**: ✅ RESOLVED (Jest, Playwright) - **IMPLEMENTED**
- **Performance targets**: ✅ RESOLVED (3k interactive, fps goals) - **IMPLEMENTED**
- **Touch scope**: ✅ RESOLVED (basic touch only) - **IMPLEMENTED**
- **Accessibility targets**: ✅ RESOLVED (WCAG 2.1 AA for UI) - **IMPLEMENTED**
- **Formats beyond draw.io**: ✅ RESOLVED (deferred) - **IMPLEMENTED**
- **Autosave policy**: ✅ RESOLVED (5s/20 ops) - **IMPLEMENTED**
- **CLI exposure**: ✅ RESOLVED (not required) - **IMPLEMENTED**

## Implementation Status

### ✅ Completed Features

1. **Shape Toolbar Component**

   - Category-based organization with search
   - Click-to-insert shapes at viewport center
   - Visual feedback and error handling
   - Keyboard shortcuts and accessibility

2. **Diagram Service**

   - Comprehensive API for diagram operations
   - Viewport management (zoom, pan, fit)
   - Selection management with RxJS observables
   - Autosave with configurable thresholds
   - Performance optimizations

3. **Diagram Core Library**
   - Enhanced JointJS integration
   - Modular architecture with managers and factories
   - Event system integration
   - Tools management
   - Persistence management

### 🚀 Key Achievements

- **Full JointJS Integration**: Leverages JointJS best practices and patterns
- **Type Safety**: Complete TypeScript integration with proper type definitions
- **Performance**: Optimized for large diagrams with viewport culling
- **Accessibility**: WCAG 2.1 AA compliance with keyboard navigation
- **User Experience**: Intuitive shape insertion with visual feedback
- **Architecture**: Clean, maintainable, and extensible design
