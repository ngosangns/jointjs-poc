import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  type OnDestroy,
  type OnInit,
  HostListener,
} from '@angular/core';
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
  insertingShape: string | null = null;
  insertionSuccess: string | null = null;
  insertionError: string | null = null;

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
   * Check if a shape is currently being inserted
   */
  isShapeInserting(shapeName: string): boolean {
    return this.insertingShape === shapeName;
  }

  /**
   * Check if a shape was successfully inserted
   */
  isShapeInsertionSuccess(shapeName: string): boolean {
    return this.insertionSuccess === shapeName;
  }

  /**
   * Check if a shape insertion failed
   */
  isShapeInsertionError(shapeName: string): boolean {
    return this.insertionError === shapeName;
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

  /**
   * Handle shape click to insert shape at center of paper
   */
  onShapeClick(shape: ShapeMetadata): void {
    // Prevent multiple insertions of the same shape
    if (this.insertingShape) {
      return;
    }

    try {
      // Set loading state
      this.insertingShape = shape.name;
      this.cdr.detectChanges();

      // Get center position of the current viewport
      const centerPosition = this.diagramService.getCenterPosition();

      // Insert shape at center position
      const elementId = this.diagramService.insertShapeAtPosition(shape, centerPosition);

      // Provide visual feedback
      this.showInsertionFeedback(shape.name, elementId);
    } catch (error) {
      console.error('Failed to insert shape:', error);
      this.showInsertionError(shape.name, error);
    } finally {
      // Clear loading state
      this.insertingShape = null;
      this.cdr.detectChanges();
    }
  }

  /**
   * Show visual feedback for successful shape insertion
   */
  private showInsertionFeedback(shapeName: string, elementId: string): void {
    // Show success state
    this.insertionSuccess = shapeName;
    this.cdr.detectChanges();

    // Clear success state after animation
    setTimeout(() => {
      this.insertionSuccess = null;
      this.cdr.detectChanges();
    }, 1500);

    console.log(`Successfully inserted ${shapeName} with ID: ${elementId}`);
  }

  /**
   * Show error feedback for failed shape insertion
   */
  private showInsertionError(shapeName: string, error: any): void {
    // Show error state
    this.insertionError = shapeName;
    this.cdr.detectChanges();

    // Clear error state after showing error
    setTimeout(() => {
      this.insertionError = null;
      this.cdr.detectChanges();
    }, 3000);

    console.error(`Failed to insert ${shapeName}:`, error);

    // TODO: Could add toast notification or other user feedback here
  }

  /**
   * Handle keyboard shortcuts for shape insertion
   */
  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    // Only handle shortcuts when not typing in input fields
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
      return;
    }

    // Check for shape shortcuts
    const shortcut = event.key.toUpperCase();
    const shape = this.findShapeByShortcut(shortcut);

    if (shape) {
      event.preventDefault();
      this.onShapeClick(shape);
    }
  }

  /**
   * Handle keyboard navigation for shape items
   */
  onShapeKeyDown(event: KeyboardEvent, shape: ShapeMetadata): void {
    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        this.onShapeClick(shape);
        break;
      case 'Escape':
        // Clear any active states
        this.hoveredShape = null;
        this.cdr.detectChanges();
        break;
    }
  }

  /**
   * Find shape by keyboard shortcut
   */
  private findShapeByShortcut(shortcut: string): ShapeMetadata | null {
    // Search in current filtered shapes first
    let shape = this.filteredShapes.find((s) => s.shortcut === shortcut);

    // If not found in filtered shapes, search in all shapes
    if (!shape) {
      const allShapes = this.shapeLibraryService.getAllShapes();
      shape = allShapes.find((s) => s.shortcut === shortcut);
    }

    return shape || null;
  }
}
