# Implementation Plan: Draw.io-like Diagramming Application

**Branch**: `001-build-an-application` | **Date**: 2025-09-17 | **Spec**: /Users/ngosangns/Github/jointjs-poc/specs/001-build-an-application/spec.md
**Input**: Feature specification from `/specs/001-build-an-application/spec.md`

## Execution Flow (/plan command scope)

```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type
3. Fill the Constitution Check section based on the content of the constitution document.
4. Evaluate Constitution Check section
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
5. Execute Phase 0 → research.md
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file (e.g., `CLAUDE.md` for Claude Code, `.github/copilot-instructions.md` for GitHub Copilot, or `GEMINI.md` for Gemini CLI).
7. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
8. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
9. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:

- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary

From the feature spec: build a draw.io-like diagram editor. Technical context from user: implement the diagramming core as a library in `./lib` using JointJS; the Angular app (root workspace) consumes this library to render the canvas and toolbar; persistence (save/load) is handled inside the library via IndexedDB; expose clean APIs from the library for Angular to interact with (initialize canvas, load/save diagram, commands, events).

## Technical Context

**Language/Version**: TypeScript (Angular workspace), JointJS-compatible TS/JS  
**Primary Dependencies**: JointJS; IndexedDB (via idb or native); Angular  
**Storage**: IndexedDB inside the `lib` for diagram persistence  
**Testing**: Jest (unit), Playwright (E2E)  
**Target Platform**: Web browser (desktop; basic touch)  
**Project Type**: web (frontend Angular + reusable library)  
**Performance Goals**: 60 fps typical; 30-45 fps heavy; ~3k interactive elements  
**Constraints**: Offline-capable; fast interactions; fidelity with draw.io interactions  
**Scale/Scope**: Single-user editing; collaboration out-of-scope initially

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- Library-first: PASS
- CLI interface: PASS (dev scripts only; no mandatory CLI)
- Test-first: PASS (plan includes failing contract tests)
- Integration testing: PASS (contracts + quickstart for integration)
- Versioning & Simplicity: PASS

## Project Structure

### Documentation (this feature)

```
specs/001-build-an-application/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)

```
frontend (Angular root)
├── src/app/components/diagram-canvas
└── src/app/services/diagram

lib (diagram core library)
├── diagram-core
│  ├── shapes/ links/ factories/ managers/
│  └── persistence/ (IndexedDB)
└── index.ts (public API consumed by Angular)
```

**Structure Decision**: Web application structure with Angular frontend consuming a standalone diagramming library.

## Phase 0: Outline & Research

- Completed; see `research.md` for resolved unknowns and decisions.

## Phase 1: Design & Contracts

- Completed; see `data-model.md`, `contracts/`, and `quickstart.md`.

## Phase 2: Task Planning Approach

- Use template’s strategy; tasks will be TDD-ordered, models → services → UI; parallelize independent contracts.

## Phase 3+: Future Implementation

- Out of scope for /plan.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --------- | ---------- | ------------------------------------ |
| —         | —          | —                                    |

## Progress Tracking

**Phase Status**:

- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:

- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [ ] Complexity deviations documented

---

_Based on Constitution v2.1.1 - See `/memory/constitution.md`_
