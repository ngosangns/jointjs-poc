import { Component, signal } from '@angular/core';
import { DiagramCanvasComponent } from './components/diagram-canvas/diagram-canvas';

@Component({
  selector: 'app-root',
  imports: [DiagramCanvasComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('diagram-angular-poc');
}
