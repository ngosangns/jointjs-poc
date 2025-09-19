# Contracts

**Status**: ✅ All contracts implemented and validated

This directory describes the expected behavior of the library APIs and events. These contracts define the public interface that the implementation must satisfy. Contract validation occurs through manual testing and integration verification after implementation is complete.

## ✅ Implemented Contracts

- **Library APIs**: ✅ create/load/save/export/import; element/link CRUD; grouping; layers; view
- **Events**: ✅ selection; element/link added/updated/removed; viewport; document saved/loaded
- **Shape Toolbar**: ✅ Click-to-insert shapes at viewport center with visual feedback
- **Performance**: ✅ Viewport culling, batch operations, autosave optimization
- **Accessibility**: ✅ WCAG 2.1 AA compliance with keyboard navigation

## Current Implementation

The contracts are now fully implemented in:

- `src/app/services/diagram.ts` - Main DiagramService API
- `src/app/components/shape-toolbar/` - Shape toolbar component
- `lib/diagram-core/` - Enhanced JointJS integration library

## Testing Strategy

**IMPORTANT**: These contracts define the expected behavior and API surface. Automated tests for these contracts will be generated AFTER the implementation is complete and validated. The contracts serve as the specification for what the implementation must provide, not as test generation templates.
