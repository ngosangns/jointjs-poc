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
import type { DiagramElement } from 'lib';
import { DiagramService } from '../../services/diagram';
import {
  type ShapeCategory,
  ShapeLibraryService,
  type ShapeMetadata,
} from '../../services/shape-library';

@Component({
  selector: 'app-diagram-canvas',
  standalone: true,
  imports: [DecimalPipe, CommonModule, FormsModule],
  providers: [DiagramService],
  templateUrl: './diagram-canvas.html',
  styleUrl: './diagram-canvas.scss',
})
export class DiagramCanvasComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('diagramContainer', { static: true }) diagramContainer!: ElementRef<HTMLDivElement>;

  // Diagram state
  currentZoom: number = 1;
  currentPan: { x: number; y: number } = { x: 0, y: 0 };
  isGridEnabled: boolean = true;
  selectedCount: number = 0;
  isPanning: boolean = false;
  performanceStats: any = null;

  // Shape toolbar state
  categories: ShapeCategory[] = [];
  selectedCategory: string = 'basic';
  searchQuery: string = '';
  filteredShapes: ShapeMetadata[] = [];
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
  ) {}

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

  getShortcutText(shape: ShapeMetadata): string {
    return shape.shortcut ? `(${shape.shortcut})` : '';
  }

  getShapeType(shape: ShapeMetadata): string {
    return shape.name.toLowerCase().replace(/\s+/g, '-');
  }

  // Diagram methods

  private setupEventListeners(): void {
    // Listen for viewport changes to update zoom and pan display
    this.diagramService.addEventListener('viewport:changed', (event: any) => {
      this.currentZoom = event.data.zoom;
      this.currentPan = event.data.pan;
      this.cdr.detectChanges();
    });

    // Listen for selection changes
    this.diagramService.addEventListener('element:selected', () => {
      this.updateSelectionState();
    });

    this.diagramService.addEventListener('canvas:clicked', () => {
      this.updateSelectionState();
    });

    // Listen for shape creation events
    this.diagramService.addEventListener('shape:created', (event: any) => {
      // Shape created event handled
    });

    // Setup mouse wheel zoom
    this.setupMouseWheelZoom();

    // Setup performance monitoring
    this.setupPerformanceMonitoring();
  }

  private setupMouseWheelZoom(): void {
    const container = this.diagramContainer.nativeElement;

    container.addEventListener(
      'wheel',
      (event: WheelEvent) => {
        event.preventDefault();

        const delta = event.deltaY;
        if (delta < 0) {
          this.diagramService.zoomIn();
        } else {
          this.diagramService.zoomOut();
        }
      },
      { passive: false }
    );
  }

  private setupPerformanceMonitoring(): void {
    // Update performance stats every 5 seconds
    setInterval(() => {
      this.performanceStats = this.diagramService.getPerformanceStats();
      this.cdr.detectChanges();
    }, 5000);
  }

  private updateSelectionState(): void {
    setTimeout(() => {
      this.selectedCount = this.diagramService.getSelectedElements().length;
      this.cdr.detectChanges();
    }, 0);
  }

  onAddElement(): void {
    const randomId = 'element_' + Date.now();
    const element: DiagramElement = {
      id: randomId,
      type: 'rectangle',
      position: {
        x: Math.random() * 400 + 50,
        y: Math.random() * 300 + 50,
      },
      size: { width: 80, height: 50 },
      properties: {
        body: { fill: '#9b59b6', stroke: '#8e44ad' },
        label: { text: 'New', fill: 'white' },
      },
    };

    this.diagramService.addElement(element);
  }

  onClearDiagram(): void {
    this.diagramService.clear();
  }

  onExportData(): void {
    const data = this.diagramService.exportData();
    alert('Check console for diagram data');
  }

  onZoomIn(): void {
    this.diagramService.zoomIn();
  }

  onZoomOut(): void {
    this.diagramService.zoomOut();
  }

  onToggleGrid(): void {
    this.isGridEnabled = this.diagramService.toggleGrid();
  }

  onZoomToFit(): void {
    this.diagramService.zoomToFit();
  }

  onZoomToSelection(): void {
    this.diagramService.zoomToSelection();
  }

  onSelectAll(): void {
    this.diagramService.selectAll();
    this.updateSelectionState();
  }

  onDeselectAll(): void {
    this.diagramService.deselectAll();
    this.updateSelectionState();
  }

  onDeleteSelected(): void {
    this.diagramService.deleteSelected();
    this.updateSelectionState();
  }

  onMoveSelected(dx: number, dy: number): void {
    this.diagramService.moveSelected(dx, dy);
  }

  onSetZoom(zoom: number): void {
    this.diagramService.setZoom(zoom);
  }

  onSetGridSize(size: number): void {
    this.diagramService.setGridSize(size);
  }

  onPanTo(x: number, y: number): void {
    this.diagramService.panTo(x, y);
  }

  onFitToViewport(): void {
    this.diagramService.fitToViewport();
  }

  onSmoothZoom(zoom: number): void {
    // Note: Smooth transitions are handled internally by the engine
    this.diagramService.setZoom(zoom);
  }

  onSmoothPanTo(x: number, y: number): void {
    this.diagramService.panTo(x, y, true); // Enable smooth transition
  }

  onTogglePerformanceOptimizations(): void {
    const currentStats = this.diagramService.getPerformanceStats();
    this.diagramService.setPerformanceOptimizations({
      viewportCulling: !currentStats.viewportCullingEnabled,
      batchOperations: !currentStats.batchOperationsEnabled,
    });
  }
}
