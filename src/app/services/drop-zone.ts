import { Injectable } from '@angular/core';

export interface DropZoneBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DropZoneConfig {
  id: string;
  element: HTMLElement;
  bounds: DropZoneBounds;
  isValid: boolean;
  gridSnap?: boolean;
  gridSize?: number;
}

@Injectable({
  providedIn: 'root',
})
export class DropZoneService {
  private dropZones: Map<string, DropZoneConfig> = new Map();
  private activeDropZone: string | null = null;

  constructor() {}

  /**
   * Register a drop zone
   */
  registerDropZone(
    id: string,
    element: HTMLElement,
    options: { gridSnap?: boolean; gridSize?: number } = {}
  ): void {
    const bounds = this.getElementBounds(element);

    this.dropZones.set(id, {
      id,
      element,
      bounds,
      isValid: true,
      gridSnap: options.gridSnap || false,
      gridSize: options.gridSize || 10,
    });
  }

  /**
   * Unregister a drop zone
   */
  unregisterDropZone(id: string): void {
    this.dropZones.delete(id);
    if (this.activeDropZone === id) {
      this.activeDropZone = null;
    }
  }

  /**
   * Update drop zone bounds (call when element is resized or moved)
   */
  updateDropZoneBounds(id: string): void {
    const dropZone = this.dropZones.get(id);
    if (dropZone) {
      dropZone.bounds = this.getElementBounds(dropZone.element);
    }
  }

  /**
   * Check if a point is within any valid drop zone
   */
  isPointInDropZone(
    x: number,
    y: number
  ): { zoneId: string; position: { x: number; y: number } } | null {
    for (const [zoneId, zone] of this.dropZones) {
      if (!zone.isValid) continue;

      const { x: zoneX, y: zoneY, width, height } = zone.bounds;

      if (x >= zoneX && x <= zoneX + width && y >= zoneY && y <= zoneY + height) {
        // Calculate relative position within the zone
        const relativeX = x - zoneX;
        const relativeY = y - zoneY;

        // Apply grid snapping if enabled
        let finalX = relativeX;
        let finalY = relativeY;

        if (zone.gridSnap && zone.gridSize) {
          finalX = this.snapToGrid(relativeX, zone.gridSize);
          finalY = this.snapToGrid(relativeY, zone.gridSize);
        }

        return {
          zoneId,
          position: { x: finalX, y: finalY },
        };
      }
    }

    return null;
  }

  /**
   * Get the active drop zone
   */
  getActiveDropZone(): string | null {
    return this.activeDropZone;
  }

  /**
   * Set the active drop zone
   */
  setActiveDropZone(zoneId: string | null): void {
    this.activeDropZone = zoneId;
  }

  /**
   * Get drop zone configuration
   */
  getDropZone(id: string): DropZoneConfig | undefined {
    return this.dropZones.get(id);
  }

  /**
   * Get all drop zones
   */
  getAllDropZones(): DropZoneConfig[] {
    return Array.from(this.dropZones.values());
  }

  /**
   * Enable/disable a drop zone
   */
  setDropZoneValid(id: string, isValid: boolean): void {
    const dropZone = this.dropZones.get(id);
    if (dropZone) {
      dropZone.isValid = isValid;
    }
  }

  /**
   * Update grid settings for a drop zone
   */
  updateDropZoneGrid(id: string, gridSnap: boolean, gridSize: number): void {
    const dropZone = this.dropZones.get(id);
    if (dropZone) {
      dropZone.gridSnap = gridSnap;
      dropZone.gridSize = gridSize;
    }
  }

  /**
   * Convert screen coordinates to drop zone coordinates
   */
  screenToDropZoneCoordinates(
    screenX: number,
    screenY: number,
    zoneId: string
  ): { x: number; y: number } | null {
    const dropZone = this.dropZones.get(zoneId);
    if (!dropZone) return null;

    const { x: zoneX, y: zoneY } = dropZone.bounds;
    const relativeX = screenX - zoneX;
    const relativeY = screenY - zoneY;

    // Apply grid snapping if enabled
    let finalX = relativeX;
    let finalY = relativeY;

    if (dropZone.gridSnap && dropZone.gridSize) {
      finalX = this.snapToGrid(relativeX, dropZone.gridSize);
      finalY = this.snapToGrid(relativeY, dropZone.gridSize);
    }

    return { x: finalX, y: finalY };
  }

  /**
   * Convert drop zone coordinates to screen coordinates
   */
  dropZoneToScreenCoordinates(
    zoneX: number,
    zoneY: number,
    zoneId: string
  ): { x: number; y: number } | null {
    const dropZone = this.dropZones.get(zoneId);
    if (!dropZone) return null;

    const { x: screenX, y: screenY } = dropZone.bounds;
    return {
      x: screenX + zoneX,
      y: screenY + zoneY,
    };
  }

  /**
   * Check if coordinates are within drop zone bounds
   */
  isWithinDropZoneBounds(x: number, y: number, zoneId: string): boolean {
    const dropZone = this.dropZones.get(zoneId);
    if (!dropZone) return false;

    const { x: zoneX, y: zoneY, width, height } = dropZone.bounds;
    return x >= zoneX && x <= zoneX + width && y >= zoneY && y <= zoneY + height;
  }

  /**
   * Get drop zone bounds with padding
   */
  getDropZoneBoundsWithPadding(zoneId: string, padding: number = 0): DropZoneBounds | null {
    const dropZone = this.dropZones.get(zoneId);
    if (!dropZone) return null;

    const { x, y, width, height } = dropZone.bounds;
    return {
      x: x - padding,
      y: y - padding,
      width: width + padding * 2,
      height: height + padding * 2,
    };
  }

  /**
   * Clear all drop zones
   */
  clearAllDropZones(): void {
    this.dropZones.clear();
    this.activeDropZone = null;
  }

  /**
   * Get element bounds from DOM element
   */
  private getElementBounds(element: HTMLElement): DropZoneBounds {
    const rect = element.getBoundingClientRect();
    return {
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height,
    };
  }

  /**
   * Snap coordinate to grid
   */
  private snapToGrid(coordinate: number, gridSize: number): number {
    return Math.round(coordinate / gridSize) * gridSize;
  }

  /**
   * Validate drop zone bounds
   */
  private validateBounds(bounds: DropZoneBounds): boolean {
    return bounds.width > 0 && bounds.height > 0;
  }

  /**
   * Get drop zone statistics for debugging
   */
  getDropZoneStats(): {
    totalZones: number;
    validZones: number;
    activeZone: string | null;
    zones: Array<{ id: string; bounds: DropZoneBounds; isValid: boolean }>;
  } {
    const zones = Array.from(this.dropZones.values());
    const validZones = zones.filter((zone) => zone.isValid);

    return {
      totalZones: zones.length,
      validZones: validZones.length,
      activeZone: this.activeDropZone,
      zones: zones.map((zone) => ({
        id: zone.id,
        bounds: zone.bounds,
        isValid: zone.isValid,
      })),
    };
  }
}
