/**
 * Main export file for diagram-core library
 */

// Main engine
export { DiagramEngine } from './DiagramEngine';

// Interfaces
export * from './interfaces';

// Managers
export * from './managers';

// Factories
export * from './factories';

// Re-export types for convenience
export * from '../types';
export * from '../utils';

// Public re-export of interaction option shape for docs/discovery
export type { DiagramConfig } from '../types';
