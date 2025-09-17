/**
 * Utility functions for the diagram library
 */

import { DiagramElement, DiagramLink } from '../types';

/**
 * Generate a unique ID for diagram elements
 */
export function generateId(): string {
  return `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Validate diagram element configuration
 */
export function validateElement(element: Partial<DiagramElement>): boolean {
  return (
    !!element.position &&
    typeof element.position.x === 'number' &&
    typeof element.position.y === 'number' &&
    !!element.size &&
    typeof element.size.width === 'number' &&
    typeof element.size.height === 'number'
  );
}

/**
 * Validate diagram link configuration
 */
export function validateLink(link: Partial<DiagramLink>): boolean {
  return (
    !!link.source &&
    !!link.target &&
    (typeof link.source === 'string' || typeof link.source === 'number') &&
    (typeof link.target === 'string' || typeof link.target === 'number')
  );
}

/**
 * Calculate distance between two points
 */
export function calculateDistance(
  point1: { x: number; y: number },
  point2: { x: number; y: number }
): number {
  const dx = point2.x - point1.x;
  const dy = point2.y - point1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Check if a point is within a rectangle
 */
export function isPointInRect(
  point: { x: number; y: number },
  rect: { x: number; y: number; width: number; height: number }
): boolean {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
}

/**
 * Deep clone an object
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime()) as unknown as T;
  }

  if (obj instanceof Array) {
    return obj.map((item) => deepClone(item)) as unknown as T;
  }

  const cloned = {} as T;
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }

  return cloned;
}
