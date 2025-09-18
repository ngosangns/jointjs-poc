/**
 * Keyboard manager for handling keyboard shortcuts and navigation
 */

import type { dia } from '@joint/core';
import type { IEventManager } from '../interfaces';

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  action: (event: KeyboardEvent) => void;
  description: string;
}

export class KeyboardManager {
  private paper: dia.Paper | null = null;
  private graph: dia.Graph | null = null;
  private eventManager: IEventManager | null = null;
  private shortcuts: Map<string, KeyboardShortcut> = new Map();
  private isEnabled: boolean = true;
  private platform: 'mac' | 'windows' | 'linux' = 'windows';

  constructor() {
    this.detectPlatform();
  }

  /**
   * Initialize keyboard manager with paper and graph
   */
  public initialize(paper: dia.Paper, graph: dia.Graph, eventManager: IEventManager): void {
    this.paper = paper;
    this.graph = graph;
    this.eventManager = eventManager;
    this.setupDefaultShortcuts();
    this.attachEventListeners();
  }

  /**
   * Detect platform for appropriate modifier keys
   */
  private detectPlatform(): void {
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('mac')) {
      this.platform = 'mac';
    } else if (userAgent.includes('win')) {
      this.platform = 'windows';
    } else {
      this.platform = 'linux';
    }
  }

  /**
   * Setup default keyboard shortcuts
   */
  private setupDefaultShortcuts(): void {
    // Zoom shortcuts
    this.registerShortcut({
      key: '=',
      ctrlKey: true,
      action: () => this.zoomIn(),
      description: 'Zoom In',
    });

    this.registerShortcut({
      key: '-',
      ctrlKey: true,
      action: () => this.zoomOut(),
      description: 'Zoom Out',
    });

    this.registerShortcut({
      key: '0',
      ctrlKey: true,
      action: () => this.resetZoom(),
      description: 'Reset Zoom',
    });

    // History shortcuts
    this.registerShortcut({
      key: 'z',
      ctrlKey: true,
      action: () => this.undo(),
      description: 'Undo',
    });

    this.registerShortcut({
      key: 'y',
      ctrlKey: true,
      action: () => this.redo(),
      description: 'Redo',
    });

    this.registerShortcut({
      key: 'z',
      ctrlKey: true,
      shiftKey: true,
      action: () => this.redo(),
      description: 'Redo (Shift+Ctrl+Z)',
    });

    // Grid toggle
    this.registerShortcut({
      key: 'g',
      action: () => this.toggleGrid(),
      description: 'Toggle Grid',
    });

    // Delete shortcuts
    this.registerShortcut({
      key: 'Delete',
      action: () => this.deleteSelected(),
      description: 'Delete Selected',
    });

    this.registerShortcut({
      key: 'Backspace',
      action: () => this.deleteSelected(),
      description: 'Delete Selected (Backspace)',
    });

    // Navigation shortcuts - 1px movement
    this.registerShortcut({
      key: 'ArrowUp',
      action: () => this.moveSelected(0, -1),
      description: 'Move Up (1px)',
    });

    this.registerShortcut({
      key: 'ArrowDown',
      action: () => this.moveSelected(0, 1),
      description: 'Move Down (1px)',
    });

    this.registerShortcut({
      key: 'ArrowLeft',
      action: () => this.moveSelected(-1, 0),
      description: 'Move Left (1px)',
    });

    this.registerShortcut({
      key: 'ArrowRight',
      action: () => this.moveSelected(1, 0),
      description: 'Move Right (1px)',
    });

    // Navigation shortcuts - 10px movement with Shift
    this.registerShortcut({
      key: 'ArrowUp',
      shiftKey: true,
      action: () => this.moveSelected(0, -10),
      description: 'Move Up (10px)',
    });

    this.registerShortcut({
      key: 'ArrowDown',
      shiftKey: true,
      action: () => this.moveSelected(0, 10),
      description: 'Move Down (10px)',
    });

    this.registerShortcut({
      key: 'ArrowLeft',
      shiftKey: true,
      action: () => this.moveSelected(-10, 0),
      description: 'Move Left (10px)',
    });

    this.registerShortcut({
      key: 'ArrowRight',
      shiftKey: true,
      action: () => this.moveSelected(10, 0),
      description: 'Move Right (10px)',
    });

    // Pan operations with Ctrl+Arrow
    this.registerShortcut({
      key: 'ArrowUp',
      ctrlKey: true,
      action: () => this.panCanvas(0, -50),
      description: 'Pan Up',
    });

    this.registerShortcut({
      key: 'ArrowDown',
      ctrlKey: true,
      action: () => this.panCanvas(0, 50),
      description: 'Pan Down',
    });

    this.registerShortcut({
      key: 'ArrowLeft',
      ctrlKey: true,
      action: () => this.panCanvas(-50, 0),
      description: 'Pan Left',
    });

    this.registerShortcut({
      key: 'ArrowRight',
      ctrlKey: true,
      action: () => this.panCanvas(50, 0),
      description: 'Pan Right',
    });

    // Page Up/Down for zoom
    this.registerShortcut({
      key: 'PageUp',
      action: () => this.zoomIn(),
      description: 'Zoom In (Page Up)',
    });

    this.registerShortcut({
      key: 'PageDown',
      action: () => this.zoomOut(),
      description: 'Zoom Out (Page Down)',
    });

    // Home/End for fit viewport
    this.registerShortcut({
      key: 'Home',
      action: () => this.fitToViewport(),
      description: 'Fit to Viewport',
    });

    this.registerShortcut({
      key: 'End',
      action: () => this.fitToSelection(),
      description: 'Fit to Selection',
    });

    // Select all
    this.registerShortcut({
      key: 'a',
      ctrlKey: true,
      action: () => this.selectAll(),
      description: 'Select All',
    });

    // Escape to deselect
    this.registerShortcut({
      key: 'Escape',
      action: () => this.deselectAll(),
      description: 'Deselect All',
    });
  }

  /**
   * Register a keyboard shortcut
   */
  public registerShortcut(shortcut: KeyboardShortcut): void {
    const key = this.getShortcutKey(shortcut);
    this.shortcuts.set(key, shortcut);
  }

  /**
   * Unregister a keyboard shortcut
   */
  public unregisterShortcut(key: string, modifiers?: Partial<KeyboardShortcut>): boolean {
    const shortcutKey = this.getShortcutKey({ key, ...modifiers });
    return this.shortcuts.delete(shortcutKey);
  }

  /**
   * Get shortcut key string for mapping
   */
  private getShortcutKey(shortcut: Partial<KeyboardShortcut>): string {
    const parts = [];
    if (shortcut.ctrlKey) parts.push('ctrl');
    if (shortcut.shiftKey) parts.push('shift');
    if (shortcut.altKey) parts.push('alt');
    if (shortcut.metaKey) parts.push('meta');
    parts.push(shortcut.key?.toLowerCase() || '');
    return parts.join('+');
  }

  /**
   * Attach keyboard event listeners
   */
  private attachEventListeners(): void {
    if (!this.paper) return;

    const paperElement = this.paper.el;
    if (paperElement) {
      paperElement.addEventListener('keydown', this.handleKeyDown.bind(this));
      paperElement.setAttribute('tabindex', '0'); // Make focusable
    }
  }

  /**
   * Handle keydown events
   */
  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.isEnabled) return;

    const shortcutKey = this.getShortcutKey({
      key: event.key,
      ctrlKey: event.ctrlKey,
      shiftKey: event.shiftKey,
      altKey: event.altKey,
      metaKey: event.metaKey,
    });

    const shortcut = this.shortcuts.get(shortcutKey);
    if (shortcut) {
      event.preventDefault();
      event.stopPropagation();
      shortcut.action(event);
    }
  }

  /**
   * Enable/disable keyboard shortcuts
   */
  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Get all registered shortcuts
   */
  public getShortcuts(): KeyboardShortcut[] {
    return Array.from(this.shortcuts.values());
  }

  // Action methods that delegate to the engine
  private zoomIn(): void {
    this.eventManager?.emitEvent('keyboard:zoom-in', {});
  }

  private zoomOut(): void {
    this.eventManager?.emitEvent('keyboard:zoom-out', {});
  }

  private resetZoom(): void {
    this.eventManager?.emitEvent('keyboard:reset-zoom', {});
  }

  private undo(): void {
    this.eventManager?.emitEvent('keyboard:undo', {});
  }

  private redo(): void {
    this.eventManager?.emitEvent('keyboard:redo', {});
  }

  private toggleGrid(): void {
    this.eventManager?.emitEvent('keyboard:toggle-grid', {});
  }

  private deleteSelected(): void {
    this.eventManager?.emitEvent('keyboard:delete-selected', {});
  }

  private moveSelected(dx: number, dy: number): void {
    this.eventManager?.emitEvent('keyboard:move-selected', { dx, dy });
  }

  private selectAll(): void {
    this.eventManager?.emitEvent('keyboard:select-all', {});
  }

  private deselectAll(): void {
    this.eventManager?.emitEvent('keyboard:deselect-all', {});
  }

  private panCanvas(dx: number, dy: number): void {
    this.eventManager?.emitEvent('keyboard:pan-canvas', { dx, dy });
  }

  private fitToViewport(): void {
    this.eventManager?.emitEvent('keyboard:fit-viewport', {});
  }

  private fitToSelection(): void {
    this.eventManager?.emitEvent('keyboard:fit-selection', {});
  }

  /**
   * Destroy keyboard manager and clean up
   */
  public destroy(): void {
    if (this.paper?.el) {
      this.paper.el.removeEventListener('keydown', this.handleKeyDown.bind(this));
    }
    this.shortcuts.clear();
    this.paper = null;
    this.graph = null;
    this.eventManager = null;
  }
}
