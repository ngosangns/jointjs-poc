export { DiagramEngine } from './diagram-core/DiagramEngine';
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
