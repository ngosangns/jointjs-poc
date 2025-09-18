import type { Shape } from '../interfaces';

export function validateElementModel(element: Shape): boolean {
  if (!element.id) return false;
  if (!element.type) return false;
  if (!element.geometry) return false;
  if (element.geometry.width < 0 || element.geometry.height < 0) return false;
  return true;
}
