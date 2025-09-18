import type { Diagram } from '../interfaces';

export function validateDiagramModel(diagram: Diagram): boolean {
  if (!diagram.id) return false;
  if (!Array.isArray(diagram.pages)) return false;
  return true;
}
