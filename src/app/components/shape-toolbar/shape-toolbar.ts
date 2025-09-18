import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, type OnDestroy, type OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DiagramService } from '../../services/diagram';
import type { ShapeCategory, ShapeMetadata } from '../../services/shape-library';
import { ShapeLibraryService } from '../../services/shape-library';

@Component({
  selector: 'app-shape-toolbar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './shape-toolbar.html',
  styleUrl: './shape-toolbar.scss',
})
export class ShapeToolbarComponent implements OnInit, OnDestroy {
  categories: ShapeCategory[] = [];
  selectedCategory: string = 'basic';
  searchQuery: string = '';
  filteredShapes: ShapeMetadata[] = [];
  hoveredShape: string | null = null;

  constructor(
    private shapeLibraryService: ShapeLibraryService,
    private cdr: ChangeDetectorRef,
    public diagramService: DiagramService
  ) {}

  ngOnInit(): void {
    this.categories = this.shapeLibraryService.getCategories();
    this.updateFilteredShapes();
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  /**
   * Update filtered shapes based on selected category and search query
   */
  updateFilteredShapes(): void {
    if (this.searchQuery.trim()) {
      this.filteredShapes = this.shapeLibraryService.searchShapes(this.searchQuery);
    } else {
      this.filteredShapes = this.shapeLibraryService.getShapesByCategory(this.selectedCategory);
    }
    this.cdr.detectChanges();
  }

  /**
   * Handle category selection
   */
  onCategorySelect(categoryId: string): void {
    this.selectedCategory = categoryId;
    this.searchQuery = ''; // Clear search when switching categories
    this.updateFilteredShapes();
  }

  /**
   * Handle search input
   */
  onSearchChange(): void {
    this.updateFilteredShapes();
  }

  /**
   * Handle shape drag start
   */
  onShapeDragStart(event: DragEvent, shapeType: string): void {
    if (!event.dataTransfer) return;

    const shapeMetadata = this.shapeLibraryService.getShapeMetadata(shapeType);
    if (!shapeMetadata) return;

    // Set drag data
    event.dataTransfer.setData(
      'application/json',
      JSON.stringify({
        type: 'shape',
        shapeType: shapeType,
        metadata: shapeMetadata,
      })
    );

    // Set drag effect
    event.dataTransfer.effectAllowed = 'copy';

    // Add visual feedback
    if (event.target instanceof HTMLElement) {
      event.target.classList.add('dragging');
    }
  }

  /**
   * Handle shape drag end
   */
  onShapeDragEnd(event: DragEvent): void {
    // Remove visual feedback
    if (event.target instanceof HTMLElement) {
      event.target.classList.remove('dragging');
    }
  }

  /**
   * Handle shape hover
   */
  onShapeHover(shapeType: string): void {
    this.hoveredShape = shapeType;
  }

  /**
   * Handle shape hover end
   */
  onShapeHoverEnd(): void {
    this.hoveredShape = null;
  }

  onDuplicateSelection(): void {
    this.diagramService.duplicateSelected(20, 20);
  }

  /**
   * Get shape icon class for display
   */
  getShapeIconClass(shape: ShapeMetadata): string {
    // Map shape types to icon classes
    const iconMap: Record<string, string> = {
      rectangle: 'icon-rectangle',
      circle: 'icon-circle',
      ellipse: 'icon-ellipse',
      polygon: 'icon-polygon',
      path: 'icon-path',
      diamond: 'icon-diamond',
      parallelogram: 'icon-parallelogram',
      stickman: 'icon-stickman',
      folder: 'icon-folder',
      router: 'icon-router',
      server: 'icon-server',
      database: 'icon-database',
      cloud: 'icon-cloud',
      firewall: 'icon-firewall',
    };

    return iconMap[shape.icon] || 'icon-rectangle';
  }

  /**
   * Get category icon class for display
   */
  getCategoryIconClass(category: ShapeCategory): string {
    const iconMap: Record<string, string> = {
      shapes: 'icon-shapes',
      flow: 'icon-flow',
      uml: 'icon-uml',
      network: 'icon-network',
    };

    return iconMap[category.icon] || 'icon-shapes';
  }

  /**
   * Check if a shape is currently hovered
   */
  isShapeHovered(shapeType: string): boolean {
    return this.hoveredShape === shapeType;
  }

  /**
   * Get keyboard shortcut display text
   */
  getShortcutText(shape: ShapeMetadata): string {
    return shape.shortcut ? `(${shape.shortcut})` : '';
  }

  /**
   * Get shape type from shape metadata
   */
  getShapeType(shape: ShapeMetadata): string {
    return shape.name.toLowerCase().replace(/\s+/g, '-');
  }
}
