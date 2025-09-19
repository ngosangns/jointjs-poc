# Contracts

**Status**: ✅ All contracts implemented and validated

This directory describes the expected behavior of the library APIs and events. Contract tests live under `lib/tests/contract` and validate the implemented features.

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
