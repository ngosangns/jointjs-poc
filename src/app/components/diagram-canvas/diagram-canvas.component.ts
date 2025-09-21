import { CommonModule, DecimalPipe } from '@angular/common';
import {
  type AfterViewInit,
  ChangeDetectorRef,
  Component,
  type ElementRef,
  type OnDestroy,
  type OnInit,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DiagramService } from '../../services/diagram.service';
import {
  type ShapeCategory,
  ShapeLibraryService,
  type ShapeMetadataService,
} from '../../services/shape-library.service';

@Component({
  selector: 'app-diagram-canvas',
  standalone: true,
  imports: [DecimalPipe, CommonModule, FormsModule],
  providers: [DiagramService],
  templateUrl: './diagram-canvas.component.html',
  styleUrl: './diagram-canvas.component.scss',
})
export class DiagramCanvasComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('diagramContainer', { static: true }) diagramContainer!: ElementRef<HTMLDivElement>;

  // Diagram state
  currentZoom: number = 1;
  isGridEnabled: boolean = true;

  // Shape toolbar state
  categories: ShapeCategory[] = [];
  selectedCategory: string = 'basic';
  searchQuery: string = '';
  filteredShapes: ShapeMetadataService[] = [];
  hoveredShape: string | null = null;

  private resizeRafId: number | null = null;
  private lastContainerSize: { width: number; height: number } = { width: 0, height: 0 };
  private onWindowResize = () => {
    const container = this.diagramContainer?.nativeElement;
    if (!container) return;
    const targetWidth = Math.max(0, Math.round(container.clientWidth));
    const targetHeight = Math.max(0, Math.round(container.clientHeight));
    if (
      targetWidth === this.lastContainerSize.width &&
      targetHeight === this.lastContainerSize.height
    ) {
      return;
    }
    this.lastContainerSize = { width: targetWidth, height: targetHeight };
    if (this.resizeRafId != null) cancelAnimationFrame(this.resizeRafId);
    this.resizeRafId = requestAnimationFrame(() => {
      this.resizeRafId = null;
      this.diagramService.resizeDiagram(targetWidth, targetHeight);
    });
  };

  constructor(
    private diagramService: DiagramService,
    private cdr: ChangeDetectorRef,
    private shapeLibraryService: ShapeLibraryService
  ) { }

  ngOnInit(): void {
    // Initialize shape library
    this.categories = this.shapeLibraryService.getCategories();
    this.updateFilteredShapes();
  }

  ngAfterViewInit(): void {
    // Initialize and attach diagram based on container size
    if (this.diagramContainer?.nativeElement) {
      const container = this.diagramContainer.nativeElement;
      const { clientWidth, clientHeight } = container;

      this.diagramService.initialize({
        width: Math.max(0, clientWidth),
        height: Math.max(0, clientHeight),
        gridSize: 10,
        interactive: true,
      });

      this.diagramService.attachToElement(container);

      // Expose diagram engine to window for E2E tests
      (window as any).diagramEngine = this.diagramService.getEngine();

      // Cache current size
      this.lastContainerSize = { width: clientWidth, height: clientHeight };

      this.setupEventListeners();

      // Listen to window resize and resize diagram based on container size
      window.addEventListener('resize', this.onWindowResize, { passive: true });

      // Initialize grid state
      this.isGridEnabled = this.diagramService.isGridEnabled();
      this.currentZoom = this.diagramService.getZoom();
    }
  }

  ngOnDestroy(): void {
    this.diagramService.destroy();
    window.removeEventListener('resize', this.onWindowResize);
    if (this.resizeRafId != null) {
      cancelAnimationFrame(this.resizeRafId);
      this.resizeRafId = null;
    }
  }

  // Shape toolbar methods
  updateFilteredShapes(): void {
    if (this.searchQuery.trim()) {
      this.filteredShapes = this.shapeLibraryService.searchShapes(this.searchQuery);
    } else {
      this.filteredShapes = this.shapeLibraryService.getShapesByCategory(this.selectedCategory);
    }
    this.cdr.detectChanges();
  }

  onCategorySelect(categoryId: string): void {
    this.selectedCategory = categoryId;
    this.searchQuery = ''; // Clear search when switching categories
    this.updateFilteredShapes();
  }

  onSearchChange(): void {
    this.updateFilteredShapes();
  }

  onShapeHover(shapeType: string): void {
    this.hoveredShape = shapeType;
  }

  onShapeHoverEnd(): void {
    this.hoveredShape = null;
  }

  getShapeIconClass(shape: ShapeMetadataService): string {
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

  getCategoryIconClass(category: ShapeCategory): string {
    const iconMap: Record<string, string> = {
      shapes: 'icon-shapes',
      flow: 'icon-flow',
      uml: 'icon-uml',
      network: 'icon-network',
    };

    return iconMap[category.icon] || 'icon-shapes';
  }

  isShapeHovered(shapeType: string): boolean {
    return this.hoveredShape === shapeType;
  }


  getShapeType(shape: ShapeMetadataService): string {
    return shape.name.toLowerCase().replace(/\s+/g, '-');
  }

  // Add shape click handler
  onShapeClick(shape: ShapeMetadataService): void {
    // Calculate center position of paper and add shape
    const centerPosition = this.diagramService.getCenterPosition();
    this.diagramService.insertShapeAtPosition(shape, centerPosition);
  }

  // Diagram methods

  private setupEventListeners(): void {
    // Listen for viewport changes to update zoom display
    this.diagramService.addEventListener('viewport:changed', (event: any) => {
      this.currentZoom = event.data.zoom;
      this.cdr.detectChanges();
    });
  }



  onClearDiagram(): void {
    this.diagramService.clear();
  }


  onZoomIn(): void {
    // Use cursor-centered zoom
    this.diagramService.zoomIn();
  }

  onZoomOut(): void {
    // Use cursor-centered zoom
    this.diagramService.zoomOut();
  }

  onToggleGrid(): void {
    this.isGridEnabled = this.diagramService.toggleGrid();
  }

  // Search methods
  clearSearch(): void {
    this.searchQuery = '';
    this.onSearchChange();
  }

  // Category methods
  getCategoryShapeCount(categoryId: string): number {
    return this.shapeLibraryService.getShapesByCategory(categoryId).length;
  }

}
