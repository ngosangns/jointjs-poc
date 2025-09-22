import { CommonModule } from '@angular/common';
import {
  type AfterViewInit,
  ChangeDetectorRef,
  Component,
  type ElementRef,
  type OnDestroy,
  ViewChild,
} from '@angular/core';
import { DiagramService } from '../../services/diagram.service';
import { ToolbarComponent } from '../toolbar/toolbar.component';

@Component({
  selector: 'app-diagram-canvas',
  standalone: true,
  imports: [CommonModule, ToolbarComponent],
  providers: [DiagramService],
  templateUrl: './diagram-canvas.component.html',
  styleUrl: './diagram-canvas.component.scss',
})
export class DiagramCanvasComponent implements AfterViewInit, OnDestroy {
  @ViewChild('diagramContainer', { static: true }) diagramContainer!: ElementRef<HTMLDivElement>;

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
    private cdr: ChangeDetectorRef
  ) {}

  async ngAfterViewInit(): Promise<void> {
    // Initialize and attach diagram based on container size
    if (this.diagramContainer?.nativeElement) {
      const container = this.diagramContainer.nativeElement;
      const { clientWidth, clientHeight } = container;

      await this.diagramService.initialize({
        width: Math.max(0, clientWidth),
        height: Math.max(0, clientHeight),
        interactive: true,
      });

      this.diagramService.attachToElement(container);

      // Cache current size
      this.lastContainerSize = { width: clientWidth, height: clientHeight };

      // Listen to window resize and resize diagram based on container size
      window.addEventListener('resize', this.onWindowResize, { passive: true });
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
}
