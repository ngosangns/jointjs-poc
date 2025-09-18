/**
 * Tools manager for handling JointJS element and link tools
 */

import { dia, elementTools, linkTools } from '@joint/core';
import type { IToolsManager } from '../interfaces';

export class ToolsManager implements IToolsManager {
  private elementToolsRegistry: Map<string, dia.ToolView[]> = new Map();
  private linkToolsRegistry: Map<string, dia.ToolView[]> = new Map();
  private paper: dia.Paper | null = null;
  private gridEnabled: boolean = true;
  private gridSize: number = 10;

  /**
   * Initialize tools manager with paper instance
   */
  public initialize(paper: dia.Paper): void {
    this.paper = paper;
    this.registerDefaultTools();
    this.setupToolEvents();
    const currentGrid = paper.options.gridSize as number | undefined;
    if (typeof currentGrid === 'number') this.gridSize = currentGrid;
  }

  /**
   * Register default element and link tools with enhanced functionality
   */
  private registerDefaultTools(): void {
    // Default element tools (no delete/duplicate buttons; keep boundary only)
    const defaultElementTools = [
      new elementTools.Boundary({
        padding: 8,
        useModelGeometry: true,
        markup: [
          {
            tagName: 'rect',
            selector: 'body',
            attributes: {
              fill: 'none',
              stroke: '#3498db',
              'stroke-width': 2,
              'stroke-dasharray': '4,4',
              'pointer-events': 'none',
            },
          },
        ],
      }),
    ];
    this.elementToolsRegistry.set('default', defaultElementTools);

    // Default link tools (no remove tool)
    const defaultLinkTools = [
      new linkTools.Vertices({
        redundancyRemoval: false,
        snapRadius: 10,
        vertexAdding: true,
      }),
      new linkTools.Segments(),
      new linkTools.SourceArrowhead(),
      new linkTools.TargetArrowhead(),
      new linkTools.Boundary({
        padding: 10,
      }),
    ];
    this.linkToolsRegistry.set('default', defaultLinkTools);
  }

  /**
   * Setup tool-related events
   */
  private setupToolEvents(): void {
    if (!this.paper) return;

    // Show tools on element hover
    this.paper.on('element:mouseenter', (elementView: dia.ElementView) => {
      this.showElementTools(elementView, 'default');
    });

    // Keep tools visible during element interaction
    this.paper.on('element:pointerdown', (elementView: dia.ElementView) => {
      this.showElementTools(elementView, 'default');
    });

    // Hide tools on element leave (with delay to allow tool interaction)
    this.paper.on('element:mouseleave', (elementView: dia.ElementView) => {
      // Add a small delay to allow users to interact with tools
      setTimeout(() => {
        this.hideElementTools(elementView);
      }, 150);
    });

    // Show tools on link hover
    this.paper.on('link:mouseenter', (linkView: dia.LinkView) => {
      this.showLinkTools(linkView, 'default');
    });

    // Hide tools on link leave
    this.paper.on('link:mouseleave', (linkView: dia.LinkView) => {
      setTimeout(() => {
        this.hideLinkTools(linkView);
      }, 150);
    });

    // Hide all tools when clicking on blank area
    this.paper.on('blank:pointerdown', () => {
      this.hideAllTools();
    });
  }

  /**
   * Register custom element tools
   */
  public registerElementTools(name: string, tools: dia.ToolView[]): void {
    this.elementToolsRegistry.set(name, tools);
  }

  /**
   * Register custom link tools
   */
  public registerLinkTools(name: string, tools: dia.ToolView[]): void {
    this.linkToolsRegistry.set(name, tools);
  }

  /**
   * Show element tools
   */
  public showElementTools(elementView: dia.ElementView, toolsName: string = 'default'): void {
    const tools = this.elementToolsRegistry.get(toolsName);
    if (tools) {
      const toolsView = new dia.ToolsView({ tools });
      elementView.addTools(toolsView);
    }
  }

  /**
   * Hide element tools
   */
  public hideElementTools(elementView: dia.ElementView): void {
    elementView.removeTools();
  }

  /**
   * Show link tools
   */
  public showLinkTools(linkView: dia.LinkView, toolsName: string = 'default'): void {
    const tools = this.linkToolsRegistry.get(toolsName);
    if (tools) {
      const toolsView = new dia.ToolsView({ tools });
      linkView.addTools(toolsView);
    }
  }

  /**
   * Hide link tools
   */
  public hideLinkTools(linkView: dia.LinkView): void {
    linkView.removeTools();
  }

  /**
   * Show all tools on paper
   */
  public showAllTools(): void {
    if (this.paper) {
      this.paper.showTools();
    }
  }

  /**
   * Hide all tools on paper
   */
  public hideAllTools(): void {
    if (this.paper) {
      this.paper.hideTools();
    }
  }

  /** Enhanced Grid controls with better visual feedback */
  public setGridEnabled(enabled: boolean) {
    this.gridEnabled = enabled;
    if (this.paper) {
      // Update grid visibility without recreating or clearing cells
      this.paper.options.drawGrid = !!enabled;
      if (enabled) this.paper.setGridSize(this.gridSize);
      // Redraw background grid layer only
      try {
        (this.paper as any).drawGrid({ color: '#e9ecef' });
      } catch {
        // Fallback to render if drawGrid not available
        this.paper.render();
      }
    }
  }

  public setGridSize(size: number) {
    this.gridSize = Math.max(1, size);
    if (this.paper && this.gridEnabled) {
      this.paper.setGridSize(this.gridSize);
      try {
        (this.paper as any).drawGrid({ color: '#e9ecef' });
      } catch {
        this.paper.render();
      }
    }
  }

  public getGridEnabled(): boolean {
    return this.gridEnabled;
  }

  public getGridSize(): number {
    return this.gridSize;
  }

  public toggleGrid(): boolean {
    this.setGridEnabled(!this.gridEnabled);
    return this.gridEnabled;
  }

  /**
   * Remove all tools from paper
   */
  public removeAllTools(): void {
    if (this.paper) {
      this.paper.removeTools();
    }
  }

  /**
   * Create custom element tool
   */
  public createElementTool(
    type: 'Remove' | 'Boundary' | 'Button',
    options: any = {}
  ): dia.ToolView {
    switch (type) {
      case 'Remove':
        return new elementTools.Remove(options);
      case 'Boundary':
        return new elementTools.Boundary(options);
      case 'Button':
        return new elementTools.Button(options);
      default:
        throw new Error(`Unknown element tool type: ${type}`);
    }
  }

  /**
   * Create custom link tool
   */
  public createLinkTool(
    type: 'Vertices' | 'Segments' | 'SourceArrowhead' | 'TargetArrowhead' | 'Remove' | 'Boundary',
    options: any = {}
  ): dia.ToolView {
    switch (type) {
      case 'Vertices':
        return new linkTools.Vertices(options);
      case 'Segments':
        return new linkTools.Segments(options);
      case 'SourceArrowhead':
        return new linkTools.SourceArrowhead(options);
      case 'TargetArrowhead':
        return new linkTools.TargetArrowhead(options);
      case 'Remove':
        return new linkTools.Remove(options);
      case 'Boundary':
        return new linkTools.Boundary(options);
      default:
        throw new Error(`Unknown link tool type: ${type}`);
    }
  }

  /**
   * Get registered element tools
   */
  public getElementTools(name: string): dia.ToolView[] | undefined {
    return this.elementToolsRegistry.get(name);
  }

  /**
   * Get registered link tools
   */
  public getLinkTools(name: string): dia.ToolView[] | undefined {
    return this.linkToolsRegistry.get(name);
  }

  /**
   * Get all registered element tool names
   */
  public getElementToolNames(): string[] {
    return Array.from(this.elementToolsRegistry.keys());
  }

  /**
   * Get all registered link tool names
   */
  public getLinkToolNames(): string[] {
    return Array.from(this.linkToolsRegistry.keys());
  }

  /**
   * Unregister element tools
   */
  public unregisterElementTools(name: string): boolean {
    return this.elementToolsRegistry.delete(name);
  }

  /**
   * Unregister link tools
   */
  public unregisterLinkTools(name: string): boolean {
    return this.linkToolsRegistry.delete(name);
  }

  /**
   * Destroy tools manager and clean up
   */
  public destroy(): void {
    if (this.paper) {
      this.paper.off('element:mouseenter');
      this.paper.off('element:mouseleave');
      this.paper.off('link:mouseenter');
      this.paper.off('link:mouseleave');
      this.paper.off('blank:pointerdown');
      this.removeAllTools();
    }
    this.elementToolsRegistry.clear();
    this.linkToolsRegistry.clear();
    this.paper = null;
  }
}
