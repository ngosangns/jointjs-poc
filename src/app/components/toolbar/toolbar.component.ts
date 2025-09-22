import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DiagramService } from '../../services/diagram.service';

@Component({
  selector: 'app-toolbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toolbar.component.html',
  styleUrl: './toolbar.component.scss',
})
export class ToolbarComponent implements OnInit, OnDestroy {
  // Toolbar state
  currentMode = signal<'select' | 'pan'>('select');

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

  constructor(private diagramService: DiagramService) {}

  ngOnInit(): void {
    // Initialize toolbar mode with error handling
    if (this.diagramService.isInitialized()) {
      try {
        this.currentMode.set(this.diagramService.getToolbarMode());
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
   * Setup listener for toolbar mode changes
   */
  private setupToolbarModeListener(): void {
    if (this.diagramService.isInitialized()) {
      try {
        const toolbarManager = this.diagramService.getToolbarManager();
        if (toolbarManager) {
          toolbarManager.addModeChangeListener((event: any) => {
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
