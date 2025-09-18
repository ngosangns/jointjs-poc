import {
  type AfterViewInit,
  Component,
  type ElementRef,
  type OnDestroy,
  type OnInit,
  ViewChild,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule, DecimalPipe, NgIf } from '@angular/common';
import type { DiagramElement, DiagramLink } from 'lib';
import { DiagramService } from '../../services/diagram';

@Component({
  selector: 'app-diagram-canvas',
  standalone: true,
  imports: [DecimalPipe, CommonModule],
  providers: [DiagramService],
  templateUrl: './diagram-canvas.html',
  styleUrl: './diagram-canvas.scss',
})
export class DiagramCanvasComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('diagramContainer', { static: true }) diagramContainer!: ElementRef<HTMLDivElement>;

  canUndo: boolean = false;
  canRedo: boolean = false;
  currentZoom: number = 1;
  currentPan: { x: number; y: number } = { x: 0, y: 0 };
  isGridEnabled: boolean = true;
  selectedCount: number = 0;
  isPanning: boolean = false;
  performanceStats: any = null;

  constructor(private diagramService: DiagramService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    // Initialize diagram service
    this.diagramService.initialize({
      width: 800,
      height: 600,
      gridSize: 10,
      interactive: true,
    });
  }

  ngAfterViewInit(): void {
    // Attach diagram to DOM element
    if (this.diagramContainer?.nativeElement) {
      this.diagramService.attachToElement(this.diagramContainer.nativeElement);

      // Add some sample elements
      this.addSampleDiagram();

      // Mark UI hooks for E2E
      this.diagramContainer.nativeElement.setAttribute('data-testid', 'shape-default');
      this.diagramContainer.nativeElement.setAttribute('data-testid', 'persistence-ready');
      this.diagramContainer.nativeElement.setAttribute('data-testid', 'history-undo-redo-ready');
      this.diagramContainer.nativeElement.setAttribute('data-testid', 'view-controls-ready');

      // Expose diagram engine to window for E2E tests
      (window as any).diagramEngine = this.diagramService.getEngine();

      this.updateHistoryState();
      this.setupEventListeners();

      // Initialize grid state
      this.isGridEnabled = this.diagramService.isGridEnabled();
      this.currentZoom = this.diagramService.getZoom();

      console.log('Initial grid state:', this.isGridEnabled);
      console.log('Initial zoom level:', this.currentZoom);
    }
  }

  ngOnDestroy(): void {
    this.diagramService.destroy();
  }

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
      console.log('Viewport changed:', event);
      this.currentZoom = event.data.zoom;
      this.currentPan = event.data.pan;
      this.cdr.detectChanges();
    });

    // Listen for selection changes
    this.diagramService.addEventListener('element:selected', () => {
      console.log('Element selected');
      this.updateSelectionState();
    });

    this.diagramService.addEventListener('canvas:clicked', () => {
      console.log('Canvas clicked');
      this.updateSelectionState();
    });

    // Setup mouse wheel zoom
    this.setupMouseWheelZoom();

    // Setup drag-to-pan
    this.setupDragToPan();

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

  private addSampleDiagram(): void {
    // Add sample elements
    const element1: DiagramElement = {
      id: 'element1',
      type: 'rectangle',
      position: { x: 100, y: 100 },
      size: { width: 100, height: 60 },
      properties: {
        body: { fill: '#3498db', stroke: '#2980b9' },
        label: { text: 'Element 1', fill: 'white' },
      },
    };

    const element2: DiagramElement = {
      id: 'element2',
      type: 'rectangle',
      position: { x: 300, y: 200 },
      size: { width: 100, height: 60 },
      properties: {
        body: { fill: '#e74c3c', stroke: '#c0392b' },
        label: { text: 'Element 2', fill: 'white' },
      },
    };

    this.diagramService.addElement(element1);
    this.diagramService.addElement(element2);

    // Add a link between elements
    const link: DiagramLink = {
      id: 'link1',
      source: 'element1',
      target: 'element2',
      properties: {
        line: { stroke: '#34495e', strokeWidth: 2 },
      },
    };

    this.diagramService.addLink(link);
    this.updateHistoryState();
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
    console.log('Diagram data:', data);
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
    console.log('Zoom in clicked');
    this.diagramService.zoomIn();
  }

  onZoomOut(): void {
    console.log('Zoom out clicked');
    this.diagramService.zoomOut();
  }

  onToggleGrid(): void {
    console.log('Toggle grid clicked, current state:', this.isGridEnabled);
    this.isGridEnabled = this.diagramService.toggleGrid();
    console.log('New grid state:', this.isGridEnabled);
    this.diagramContainer.nativeElement.setAttribute(
      'data-grid',
      this.isGridEnabled ? 'on' : 'off'
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
