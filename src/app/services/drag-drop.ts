import { Injectable } from '@angular/core';
import { ShapeMetadata } from './shape-library';

export interface DragData {
  type: 'shape';
  shapeType: string;
  metadata: ShapeMetadata;
}

export interface DropPosition {
  x: number;
  y: number;
  isValid: boolean;
}

export interface DropZone {
  element: HTMLElement;
  bounds: DOMRect;
  isValid: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class DragDropService {
  private activeDragData: DragData | null = null;
  private dropZones: Map<string, DropZone> = new Map();
  private dragOverlay: HTMLElement | null = null;

  constructor() {}

  /**
   * Set active drag data (called from component's drag start handler)
   */
  setActiveDragData(dragData: DragData): void {
    this.activeDragData = dragData;
  }

  /**
   * Handle drag over canvas
   */
  handleDragOver(event: DragEvent, canvasElement: HTMLElement): boolean {
    if (!this.activeDragData) return false;

    event.preventDefault();
    event.dataTransfer!.dropEffect = 'copy';

    // Update drag overlay position
    this.updateDragOverlay(event);

    // Check if drop is valid
    const isValid = this.isValidDropZone(event, canvasElement);

    // Update visual feedback
    this.updateDropZoneFeedback(canvasElement, isValid);

    return isValid;
  }

  /**
   * Handle drag leave
   */
  handleDragLeave(event: DragEvent, canvasElement: HTMLElement): void {
    // Remove visual feedback
    this.removeDropZoneFeedback(canvasElement);
  }

  /**
   * Handle drop on canvas
   */
  handleDrop(event: DragEvent, canvasElement: HTMLElement): DropPosition | null {
    if (!this.activeDragData) return null;

    event.preventDefault();

    // Clean up drag overlay
    this.removeDragOverlay();
    this.removeDropZoneFeedback(canvasElement);

    // Calculate drop position
    const dropPosition = this.calculateDropPosition(event, canvasElement);

    if (dropPosition.isValid) {
      return dropPosition;
    }

    return null;
  }

  /**
   * Handle drag end
   */
  handleDragEnd(): void {
    this.activeDragData = null;
    this.removeDragOverlay();
  }

  /**
   * Register a drop zone
   */
  registerDropZone(id: string, element: HTMLElement): void {
    const bounds = element.getBoundingClientRect();
    this.dropZones.set(id, {
      element,
      bounds,
      isValid: true,
    });
  }

  /**
   * Unregister a drop zone
   */
  unregisterDropZone(id: string): void {
    this.dropZones.delete(id);
  }

  /**
   * Update drop zone bounds
   */
  updateDropZoneBounds(id: string): void {
    const dropZone = this.dropZones.get(id);
    if (dropZone) {
      dropZone.bounds = dropZone.element.getBoundingClientRect();
    }
  }

  /**
   * Get current drag data
   */
  getActiveDragData(): DragData | null {
    return this.activeDragData;
  }

  /**
   * Check if currently dragging
   */
  isDragging(): boolean {
    return this.activeDragData !== null;
  }

  /**
   * Create visual drag overlay
   */
  private createDragOverlay(event: DragEvent, dragData: DragData): void {
    this.removeDragOverlay(); // Remove any existing overlay

    const overlay = document.createElement('div');
    overlay.className = 'drag-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 60px;
      height: 60px;
      background: rgba(0, 123, 255, 0.8);
      border: 2px solid #007bff;
      border-radius: 8px;
      pointer-events: none;
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 12px;
      font-weight: bold;
      text-align: center;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      transform: translate(-50%, -50%);
    `;

    // Add shape icon or name
    overlay.textContent = dragData.metadata.name.substring(0, 3).toUpperCase();

    document.body.appendChild(overlay);
    this.dragOverlay = overlay;

    this.updateDragOverlay(event);
  }

  /**
   * Update drag overlay position
   */
  private updateDragOverlay(event: DragEvent): void {
    if (!this.dragOverlay) return;

    this.dragOverlay.style.left = event.clientX + 'px';
    this.dragOverlay.style.top = event.clientY + 'px';
  }

  /**
   * Remove drag overlay
   */
  private removeDragOverlay(): void {
    if (this.dragOverlay) {
      document.body.removeChild(this.dragOverlay);
      this.dragOverlay = null;
    }
  }

  /**
   * Check if drop zone is valid
   */
  private isValidDropZone(event: DragEvent, canvasElement: HTMLElement): boolean {
    const rect = canvasElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Check if within canvas bounds
    return x >= 0 && x <= rect.width && y >= 0 && y <= rect.height;
  }

  /**
   * Calculate drop position relative to canvas
   */
  private calculateDropPosition(event: DragEvent, canvasElement: HTMLElement): DropPosition {
    const rect = canvasElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const isValid = this.isValidDropZone(event, canvasElement);

    return {
      x: Math.max(0, Math.min(x, rect.width)),
      y: Math.max(0, Math.min(y, rect.height)),
      isValid,
    };
  }

  /**
   * Update visual feedback for drop zone
   */
  private updateDropZoneFeedback(canvasElement: HTMLElement, isValid: boolean): void {
    if (isValid) {
      canvasElement.classList.add('drag-over-valid');
      canvasElement.classList.remove('drag-over-invalid');
    } else {
      canvasElement.classList.add('drag-over-invalid');
      canvasElement.classList.remove('drag-over-valid');
    }
  }

  /**
   * Remove visual feedback from drop zone
   */
  private removeDropZoneFeedback(canvasElement: HTMLElement): void {
    canvasElement.classList.remove('drag-over-valid', 'drag-over-invalid');
  }

  /**
   * Convert screen coordinates to canvas coordinates
   */
  screenToCanvasCoordinates(
    screenX: number,
    screenY: number,
    canvasElement: HTMLElement
  ): { x: number; y: number } {
    const rect = canvasElement.getBoundingClientRect();
    return {
      x: screenX - rect.left,
      y: screenY - rect.top,
    };
  }

  /**
   * Convert canvas coordinates to paper coordinates (considering zoom and pan)
   */
  canvasToPaperCoordinates(canvasX: number, canvasY: number, paper: any): { x: number; y: number } {
    if (!paper) {
      return { x: canvasX, y: canvasY };
    }

    const scale = paper.scale().sx;
    const translate = paper.translate();

    return {
      x: (canvasX - translate.tx) / scale,
      y: (canvasY - translate.ty) / scale,
    };
  }

  /**
   * Apply grid snapping if enabled
   */
  applyGridSnapping(
    x: number,
    y: number,
    gridSize: number,
    gridEnabled: boolean
  ): { x: number; y: number } {
    if (!gridEnabled || gridSize <= 0) {
      return { x, y };
    }

    return {
      x: Math.round(x / gridSize) * gridSize,
      y: Math.round(y / gridSize) * gridSize,
    };
  }

  /**
   * Get final drop position with all transformations applied
   */
  getFinalDropPosition(
    event: DragEvent,
    canvasElement: HTMLElement,
    paper: any,
    gridSize: number = 10,
    gridEnabled: boolean = true
  ): DropPosition | null {
    if (!this.activeDragData) return null;

    // Convert to canvas coordinates
    const canvasCoords = this.screenToCanvasCoordinates(
      event.clientX,
      event.clientY,
      canvasElement
    );

    // Convert to paper coordinates
    const paperCoords = this.canvasToPaperCoordinates(canvasCoords.x, canvasCoords.y, paper);

    // Apply grid snapping
    const snappedCoords = this.applyGridSnapping(
      paperCoords.x,
      paperCoords.y,
      gridSize,
      gridEnabled
    );

    const isValid = this.isValidDropZone(event, canvasElement);

    return {
      x: snappedCoords.x,
      y: snappedCoords.y,
      isValid,
    };
  }
}
