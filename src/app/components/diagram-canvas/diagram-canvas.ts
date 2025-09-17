import { Component, ElementRef, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import { DiagramService } from '../../services/diagram';
import { DiagramElement, DiagramLink } from 'lib';

@Component({
  selector: 'app-diagram-canvas',
  standalone: true,
  imports: [],
  providers: [DiagramService],
  templateUrl: './diagram-canvas.html',
  styleUrl: './diagram-canvas.scss',
})
export class DiagramCanvasComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('diagramContainer', { static: true }) diagramContainer!: ElementRef<HTMLDivElement>;

  constructor(private diagramService: DiagramService) {}

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
    }
  }

  ngOnDestroy(): void {
    this.diagramService.destroy();
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
    console.log('Diagram data:', data);
    alert('Check console for diagram data');
  }
}
