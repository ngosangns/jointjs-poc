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
import { DragDropService } from '../../services/drag-drop';
import { DropZoneService } from '../../services/drop-zone';
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
  canUndo: boolean = false;
  canRedo: boolean = false;
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
    private dragDropService: DragDropService,
    private dropZoneService: DropZoneService,
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

      this.updateHistoryState();
      this.setupEventListeners();
      this.setupDragDropHandlers();

      // Listen to window resize and resize diagram based on container size
      window.addEventListener('resize', this.onWindowResize, { passive: true });

      // Initialize grid state
      this.isGridEnabled = this.diagramService.isGridEnabled();
      this.currentZoom = this.diagramService.getZoom();
    }
  }

  ngOnDestroy(): void {
    this.diagramService.destroy();
    this.dropZoneService.clearAllDropZones();
    window.removeEventListener('resize', this.onWindowResize as any);
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

  onShapeDragStart(event: DragEvent, shapeType: string): void {
    if (!event.dataTransfer) return;

    const shapeMetadata = this.shapeLibraryService.getShapeMetadata(shapeType);
    if (!shapeMetadata) return;

    const dragData = {
      type: 'shape' as const,
      shapeType: shapeType,
      metadata: shapeMetadata,
    };

    // Set drag data
    event.dataTransfer.setData('application/json', JSON.stringify(dragData));

    // Set drag effect
    event.dataTransfer.effectAllowed = 'copy';

    // Set active drag data in service
    this.dragDropService.setActiveDragData(dragData);

    // Add visual feedback
    if (event.target instanceof HTMLElement) {
      event.target.classList.add('dragging');
    }
  }

  onShapeDragEnd(event: DragEvent): void {
    // Remove visual feedback
    if (event.target instanceof HTMLElement) {
      event.target.classList.remove('dragging');
    }
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
  private updateHistoryState(): void {
    setTimeout(() => {
      this.canUndo = this.diagramService.canUndo();
      this.canRedo = this.diagramService.canRedo();
      this.cdr.detectChanges();
    }, 0);
  }

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
      this.updateHistoryState();
    });

    // Setup mouse wheel zoom
    this.setupMouseWheelZoom();

    // Setup drag-to-pan
    this.setupDragToPan();

    // Setup performance monitoring
    this.setupPerformanceMonitoring();
  }

  private setupDragDropHandlers(): void {
    const container = this.diagramContainer.nativeElement;

    // Register canvas as drop zone
    this.dropZoneService.registerDropZone('canvas', container, {
      gridSnap: this.isGridEnabled,
      gridSize: this.diagramService.getGridSize(),
    });

    // Handle drag over
    container.addEventListener('dragover', (event: DragEvent) => {
      const isValid = this.dragDropService.handleDragOver(event, container);
      if (isValid) {
        event.preventDefault();
      }
    });

    // Handle drag leave
    container.addEventListener('dragleave', (event: DragEvent) => {
      this.dragDropService.handleDragLeave(event, container);
    });

    // Handle drop
    container.addEventListener('drop', (event: DragEvent) => {
      const dropPosition = this.dragDropService.handleDrop(event, container);
      if (dropPosition && dropPosition.isValid) {
        this.handleShapeDrop(dropPosition);
      }
    });

    // Handle drag end
    container.addEventListener('dragend', () => {
      this.dragDropService.handleDragEnd();
    });
  }

  private handleShapeDrop(dropPosition: { x: number; y: number }): void {
    const dragData = this.dragDropService.getActiveDragData();
    if (!dragData || dragData.type !== 'shape') {
      return;
    }

    try {
      // Get paper for coordinate transformation
      const engine = this.diagramService.getEngine();
      const paper = engine.getPaper();

      if (!paper) {
        console.error('Paper not available for drop operation');
        return;
      }

      // Convert canvas coordinates to paper coordinates
      const paperCoords = this.dragDropService.canvasToPaperCoordinates(
        dropPosition.x,
        dropPosition.y,
        paper
      );

      // Apply grid snapping if enabled
      const finalCoords = this.dragDropService.applyGridSnapping(
        paperCoords.x,
        paperCoords.y,
        this.diagramService.getGridSize(),
        this.isGridEnabled
      );

      // Create shape at position
      const shapeId = (engine as any).addShapeAtPosition(dragData.shapeType, finalCoords, {
        properties: {
          label: {
            text: dragData.metadata.name,
          },
        },
      });
      // Update history state
      this.updateHistoryState();
    } catch (error) {
      console.error('Error creating shape from drag-drop:', error);
    }
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

  private setupDragToPan(): void {
    const container = this.diagramContainer.nativeElement;
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let startPan = { x: 0, y: 0 };

    container.addEventListener('mousedown', (event: MouseEvent) => {
      // Only pan with middle mouse button or right mouse button
      if (event.button === 1 || event.button === 2) {
        event.preventDefault();
        isDragging = true;
        this.isPanning = true;
        startX = event.clientX;
        startY = event.clientY;
        startPan = { ...this.currentPan };

        // Change cursor
        container.style.cursor = 'grabbing';
      }
    });

    container.addEventListener('mousemove', (event: MouseEvent) => {
      if (isDragging) {
        event.preventDefault();
        const dx = event.clientX - startX;
        const dy = event.clientY - startY;

        this.diagramService.panTo(startPan.x + dx, startPan.y + dy);
      }
    });

    container.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        this.isPanning = false;
        container.style.cursor = 'default';
      }
    });

    container.addEventListener('mouseleave', () => {
      if (isDragging) {
        isDragging = false;
        this.isPanning = false;
        container.style.cursor = 'default';
      }
    });

    // Prevent context menu on right click
    container.addEventListener('contextmenu', (event: MouseEvent) => {
      event.preventDefault();
    });
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
    this.updateHistoryState();
  }

  onClearDiagram(): void {
    this.diagramService.clear();
    this.updateHistoryState();
  }

  onExportData(): void {
    const data = this.diagramService.exportData();
    alert('Check console for diagram data');
  }

  onUndo(): void {
    this.diagramService.undo();
    this.updateHistoryState();
  }

  onRedo(): void {
    this.diagramService.redo();
    this.updateHistoryState();
  }

  onZoomIn(): void {
    this.diagramService.zoomIn();
  }

  onZoomOut(): void {
    this.diagramService.zoomOut();
  }

  onToggleGrid(): void {
    this.isGridEnabled = this.diagramService.toggleGrid();
    // Update drop zone grid settings
    this.dropZoneService.updateDropZoneGrid(
      'canvas',
      this.isGridEnabled,
      this.diagramService.getGridSize()
    );
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
    this.updateHistoryState();
    this.updateSelectionState();
  }

  onMoveSelected(dx: number, dy: number): void {
    this.diagramService.moveSelected(dx, dy);
    this.updateHistoryState();
  }

  onSetZoom(zoom: number): void {
    this.diagramService.setZoom(zoom);
  }

  onSetGridSize(size: number): void {
    this.diagramService.setGridSize(size);
    // Update drop zone grid settings
    this.dropZoneService.updateDropZoneGrid('canvas', this.isGridEnabled, size);
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
