import { CommonModule, DecimalPipe } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit, signal } from '@angular/core';
import { DiagramService } from '../../services/diagram.service';
import { ShapeLibraryService, type ShapeMetadata } from '../../services/shape-library.service';

@Component({
  selector: 'app-toolbar',
  standalone: true,
  imports: [CommonModule, DecimalPipe],
  templateUrl: './toolbar.component.html',
  styleUrl: './toolbar.component.scss',
})
export class ToolbarComponent implements OnInit, OnDestroy {
  // Toolbar state
  currentMode = signal<'select' | 'pan'>('select');

  // Diagram state
  currentZoom: number = 1;

  // Shape toolbar state
  allShapes: ShapeMetadata[] = [];
  hoveredShape: string | null = null;

  // Tool definitions
  tools = [
    {
      id: 'select' as const,
      name: 'Select',
      icon: 'cursor-pointer',
      description: 'Select and move elements',
    },
    {
      id: 'pan' as const,
      name: 'Pan',
      icon: 'hand',
      description: 'Pan the canvas',
    },
  ];

  constructor(
    private diagramService: DiagramService,
    private cdr: ChangeDetectorRef,
    private shapeLibraryService: ShapeLibraryService
  ) {}

  ngOnInit(): void {
    // Initialize shape library
    this.allShapes = this.shapeLibraryService.getAllShapes();

    // Initialize toolbar mode with error handling
    if (this.diagramService.isInitialized()) {
      try {
        this.currentMode.set(this.diagramService.getToolbarMode());
        this.currentZoom = this.diagramService.getZoom();
      } catch (error) {
        console.warn('Error getting toolbar mode, using default select mode');
        this.currentMode.set('select');
      }
    } else {
      console.warn('Diagram engine not initialized yet, using default select mode');
      this.currentMode.set('select');
    }

    // Listen for toolbar mode changes from the diagram service
    this.setupToolbarModeListener();
  }

  ngOnDestroy(): void {
    // Cleanup is handled by the diagram service
  }

  /**
   * Handle tool selection
   */
  onToolSelect(toolId: 'select' | 'pan'): void {
    // Always update the UI state first
    this.currentMode.set(toolId);

    // Try to update the diagram engine if it's initialized
    if (this.diagramService.isInitialized()) {
      try {
        this.diagramService.setToolbarMode(toolId);
      } catch (error) {
        console.warn('Error setting toolbar mode:', error);
      }
    } else {
      console.warn('Cannot set toolbar mode - diagram engine not initialized yet');
    }
  }

  /**
   * Check if a tool is active
   */
  isToolActive(toolId: string): boolean {
    return this.currentMode() === toolId;
  }

  /**
   * Get tool icon class
   */
  getToolIconClass(tool: any): string {
    return `tool-icon ${tool.icon}`;
  }

  /**
   * Get tool button class
   */
  getToolButtonClass(tool: any): string {
    const baseClass = 'tool-button';
    const activeClass = this.isToolActive(tool.id) ? 'active' : '';
    return `${baseClass} ${activeClass}`.trim();
  }

  /**
   * Shape-related methods
   */
  onShapeHover(shapeType: string): void {
    this.hoveredShape = shapeType;
  }

  onShapeHoverEnd(): void {
    this.hoveredShape = null;
  }

  getShapeIconClass(shape: ShapeMetadata): string {
    // Map shape types to icon classes
    const iconMap: Record<string, string> = {
      rectangle: 'icon-rectangle',
      circle: 'icon-circle',
    };

    return iconMap[shape.icon] || 'icon-rectangle';
  }

  isShapeHovered(shapeType: string): boolean {
    return this.hoveredShape === shapeType;
  }

  getShapeType(shape: ShapeMetadata): string {
    return shape.name.toLowerCase().replace(/\s+/g, '-');
  }

  onShapeClick(shape: ShapeMetadata): void {
    if (this.diagramService.isInitialized()) {
      try {
        // Calculate center position of paper in local coordinates and add shape
        const centerPosition = this.diagramService.getCenterPosition();

        // Use the new method that supports ports if the shape has ports
        if (shape.hasPorts) {
          this.diagramService.insertShapeWithPortsAtPosition(shape, centerPosition);
        } else {
          this.diagramService.insertShapeAtPosition(shape, centerPosition);
        }
      } catch (error) {
        console.error('Error adding shape:', error);
      }
    }
  }

  /**
   * Canvas tools methods
   */

  onZoomIn(): void {
    // Use cursor-centered zoom
    this.diagramService.zoomIn();
    this.currentZoom = this.diagramService.getZoom();
    this.cdr.detectChanges();
  }

  onZoomOut(): void {
    // Use cursor-centered zoom
    this.diagramService.zoomOut();
    this.currentZoom = this.diagramService.getZoom();
    this.cdr.detectChanges();
  }

  /**
   * Setup listener for toolbar mode changes
   */
  private setupToolbarModeListener(): void {
    if (this.diagramService.isInitialized()) {
      try {
        const toolbar = this.diagramService.getToolbarManager();
        if (toolbar) {
          toolbar.addModeChangeListener((event: any) => {
            this.currentMode.set(event.mode);
          });
        }
      } catch (error) {
        console.warn('Error setting up toolbar mode listener:', error);
      }
    } else {
      console.warn('Could not setup toolbar mode listener - diagram engine not initialized yet');
      // Retry after a short delay to allow the diagram engine to initialize
      setTimeout(() => {
        this.setupToolbarModeListener();
      }, 100);
    }
  }
}
