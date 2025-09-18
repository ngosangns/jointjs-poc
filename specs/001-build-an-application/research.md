# Research: Draw.io-like Diagramming Application

## Decisions

- Testing Stack: Unit with Jest; Integration/E2E with Playwright.
- Performance Targets: Smooth pan/zoom at 60 fps for typical diagrams; acceptable 30-45 fps for heavy cases. Target up to 3,000 elements interactive, 10,000 elements view-only.
- Touch Scope: Desktop primary; basic touch (pan/zoom/select) supported; advanced gestures (multi-touch rotate) deferred.
- Accessibility: Aim for WCAG 2.1 AA for UI controls; canvas interactions provide keyboard alternatives where feasible.
- Import/Export: Import draw.io XML v4+; Export PNG, SVG, PDF. Additional imports (Visio, SVG parse) deferred.
- Autosave: Every 5 seconds of idle or after 20 atomic operations (whichever first). Recovery on reload via latest autosave.
- IndexedDB: One database `diagram_core` with stores: `documents`, `history`, `assets`. Versioned schema (v1).
- CLI Exposure: Not required for end-users; provide dev scripts via package.json.

## Rationale

- Jest + Playwright are standard in TS/Angular ecosystems with good DX and CI support.
- 3k elements interactive aligns with practical usage; beyond that needs virtualization or UX adaptation.
- Basic touch ensures tablet usability without complicating MVP scope.
- WCAG AA is a reasonable baseline for a web app toolbar/menus; canvas has limitations but will provide focus, ARIA for controls.
- Draw.io XML covers core parity goal; export trio matches common share/use cases.
- Autosave balance reduces data loss while avoiding constant writes.
- IndexedDB schema separates documents, history, and binary assets for flexibility and performance.
- Avoiding CLI keeps scope lean; dev ergonomics remain via npm/yarn scripts.

## Alternatives Considered

- Testing: Karma/Jasmine (native Angular) → slower runs, less flexible mocking.
- Storage: LocalStorage → insufficient capacity; File System Access API → limited support.
- Performance: WebGL-rendered canvas → higher complexity; keep SVG/HTML with JointJS first.
- Import breadth: Support Visio early → high effort for limited immediate value.

## Unknowns Resolved

- Testing tooling: RESOLVED (Jest, Playwright)
- Performance targets: RESOLVED (3k interactive, fps goals)
- Touch scope: RESOLVED (basic touch only)
- Accessibility targets: RESOLVED (WCAG 2.1 AA for UI)
- Formats beyond draw.io: RESOLVED (deferred)
- Autosave policy: RESOLVED (5s/20 ops)
- CLI exposure: RESOLVED (not required)
