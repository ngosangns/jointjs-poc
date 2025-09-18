export { DiagramEngine } from './diagram-core/DiagramEngine';
export * from './diagram-core/interfaces';
export * from './diagram-core/managers';
export type {
  DiagramConfig,
  ElementConfig,
  LinkConfig,
  DiagramElement,
  DiagramLink,
  DiagramData,
  DiagramEvent,
  DiagramEventType,
} from './types';
// Selection event names for convenience
export const SelectionEvents = {
  Changed: 'selection:changed',
  Cleared: 'selection:cleared',
} as const;
export {
  generateId,
  validateElement,
  validateLink,
  calculateDistance,
  isPointInRect,
  deepClone,
} from './utils';

export const VERSION = '1.0.0';

import { DiagramEngine } from './diagram-core/DiagramEngine';
import { DiagramConfig } from './types';

export function createDiagramEngine(config: DiagramConfig): DiagramEngine {
  return new DiagramEngine(config);
}
