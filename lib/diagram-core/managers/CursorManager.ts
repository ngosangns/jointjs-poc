import { dia } from '@joint/core';
import { ICursorManager } from '../interfaces';

/**
 * CursorManager quản lý cursor trên viewport (paper) của diagram editor
 */
export class CursorManager implements ICursorManager {
  private paper: dia.Paper | null = null;
  private currentCursor: string = 'default';
  private defaultCursor: string = 'default';
  private modeCursors: Map<string, string> = new Map();
  private temporaryCursor: string | null = null;
  private isMouseOverPaper: boolean = false;
  private paperElement: HTMLElement | null = null;
  private viewportState: 'idle' | 'panning' | 'zooming' | 'element-moving' = 'idle';
  private interactionMode: { pan: boolean; zoom: boolean; elementMove: boolean } = {
    pan: false,
    zoom: false,
    elementMove: false
  };

  constructor() {
    // Thiết lập cursor mặc định cho các mode khác nhau
    this.modeCursors.set('select', 'default');
    this.modeCursors.set('pan', 'grab');
    this.modeCursors.set('panning', 'grabbing');
    this.modeCursors.set('zoom', 'zoom-in');
    this.modeCursors.set('zooming', 'zoom-in');
    this.modeCursors.set('draw', 'crosshair');
    this.modeCursors.set('resize', 'nw-resize');
    this.modeCursors.set('move', 'move');
    this.modeCursors.set('element-moving', 'move');
  }

  /**
   * Khởi tạo cursor manager với paper instance
   */
  public initialize(paper: dia.Paper): void {
    this.paper = paper;
    this.paperElement = paper.el as HTMLElement;

    if (this.paperElement) {
      this.setupEventListeners();
      // Override the disabled default cursor and set initial cursor
      this.setCursor(this.defaultCursor);
      // Apply cursor for current interaction mode
      this.updateCursorBasedOnInteractionMode();
    }
  }

  /**
   * Thiết lập event listeners cho paper
   */
  private setupEventListeners(): void {
    if (!this.paperElement || !this.paper) return;

    // Mouse enter/leave events
    this.paperElement.addEventListener('mouseenter', this.handleMouseEnter.bind(this));
    this.paperElement.addEventListener('mouseleave', this.handleMouseLeave.bind(this));

    // Prevent context menu to avoid cursor issues
    this.paperElement.addEventListener('contextmenu', (e) => e.preventDefault());

    // Paper events for cursor management
    this.paper.on('element:mouseenter', this.handleElementMouseEnter.bind(this));
    this.paper.on('element:mouseleave', this.handleElementMouseLeave.bind(this));
    this.paper.on('link:mouseenter', this.handleLinkMouseEnter.bind(this));
    this.paper.on('link:mouseleave', this.handleLinkMouseLeave.bind(this));

    // Pan events
    this.paper.on('blank:pointerdown', this.handlePanStart.bind(this));
    this.paper.on('blank:pointermove', this.handlePanMove.bind(this));
    this.paper.on('blank:pointerup', this.handlePanEnd.bind(this));
  }

  /**
   * Xử lý khi mouse enter vào paper
   */
  private handleMouseEnter(): void {
    this.isMouseOverPaper = true;
    this.onMouseEnter();
  }

  /**
   * Xử lý khi mouse leave khỏi paper
   */
  private handleMouseLeave(): void {
    this.isMouseOverPaper = false;
    this.updateCursorBasedOnInteractionMode();
  }

  /**
   * Đặt cursor cho paper
   */
  public setCursor(cursor: string): void {
    if (!this.paperElement) return;

    this.currentCursor = cursor;
    this.paperElement.style.cursor = cursor;
  }

  /**
   * Lấy cursor hiện tại
   */
  public getCursor(): string {
    return this.currentCursor;
  }

  /**
   * Reset cursor về mặc định
   */
  public resetCursor(): void {
    this.setCursor(this.defaultCursor);
  }

  /**
   * Đặt cursor mặc định
   */
  public setDefaultCursor(cursor: string): void {
    this.defaultCursor = cursor;
  }

  /**
   * Lấy cursor mặc định
   */
  public getDefaultCursor(): string {
    return this.defaultCursor;
  }

  /**
   * Đặt cursor cho một mode cụ thể
   */
  public setCursorForMode(mode: string, cursor: string): void {
    this.modeCursors.set(mode, cursor);
  }

  /**
   * Lấy cursor cho một mode cụ thể
   */
  public getCursorForMode(mode: string): string | undefined {
    return this.modeCursors.get(mode);
  }

  /**
   * Áp dụng cursor cho mode hiện tại
   */
  public applyCursorForMode(mode: string): void {
    const cursor = this.getCursorForMode(mode);
    if (cursor) {
      this.setCursor(cursor);
    } else {
      this.resetCursor();
    }
  }

  /**
   * Xử lý khi mouse enter vào paper
   */
  public onMouseEnter(): void {
    // Có thể override để thêm logic tùy chỉnh
  }

  /**
   * Xử lý khi mouse leave khỏi paper
   */
  public onMouseLeave(): void {
    // Restore cursor based on current interaction mode instead of default
    this.updateCursorBasedOnInteractionMode();
  }

  /**
   * Xử lý khi mode thay đổi
   */
  public onModeChange(mode: string): void {
    if (this.isMouseOverPaper) {
      this.applyCursorForMode(mode);
    }
  }

  /**
   * Kiểm tra xem mouse có đang over paper không
   */
  public isMouseOver(): boolean {
    return this.isMouseOverPaper;
  }

  /**
   * Thêm cursor tùy chỉnh cho interaction state
   */
  public setCursorForInteraction(interaction: string, cursor: string): void {
    this.setCursorForMode(interaction, cursor);
  }

  /**
   * Áp dụng cursor cho interaction hiện tại
   */
  public applyCursorForInteraction(interaction: string): void {
    this.applyCursorForMode(interaction);
  }

  /**
   * Tạm thời thay đổi cursor (ví dụ: khi hover element)
   */
  public setTemporaryCursor(cursor: string): void {
    this.setCursor(cursor);
  }

  /**
   * Khôi phục cursor trước đó
   */
  public restoreCursor(mode?: string): void {
    if (mode) {
      this.applyCursorForMode(mode);
    } else {
      this.resetCursor();
    }
  }

  /**
   * Xử lý khi mouse enter vào element
   */
  private handleElementMouseEnter(): void {
    // Chỉ hiển thị pointer cursor khi ở select mode
    // Khi ở pan mode, hiển thị cursor resize khi hover element
    if (this.interactionMode.pan) {
      // Khi ở pan mode, hiển thị cursor resize khi hover element
      this.setTemporaryCursor('nw-resize');
    } else {
      // Khi ở select mode, hiển thị pointer cursor
      this.setTemporaryCursor('pointer');
    }
  }

  /**
   * Xử lý khi mouse leave khỏi element
   */
  private handleElementMouseLeave(): void {
    this.restoreCursor();
  }

  /**
   * Xử lý khi mouse enter vào link
   */
  private handleLinkMouseEnter(): void {
    // Tương tự như element, hiển thị cursor phù hợp với mode
    if (this.interactionMode.pan) {
      // Khi ở pan mode, hiển thị cursor resize khi hover link
      this.setTemporaryCursor('nw-resize');
    } else {
      this.setTemporaryCursor('pointer');
    }
  }

  /**
   * Xử lý khi mouse leave khỏi link
   */
  private handleLinkMouseLeave(): void {
    this.restoreCursor();
  }

  /**
   * Xử lý khi bắt đầu pan
   */
  private handlePanStart(): void {
    if (this.getCursorForMode('pan') === 'grab') {
      this.setTemporaryCursor('grabbing');
    }
  }

  /**
   * Xử lý khi đang pan
   */
  private handlePanMove(): void {
    // Cursor đã được set trong handlePanStart
  }

  /**
   * Xử lý khi kết thúc pan
   */
  private handlePanEnd(): void {
    this.restoreCursor();
  }

  /**
   * Handle interaction mode changes from viewport
   */
  onInteractionModeChange(mode: { pan: boolean; zoom: boolean; elementMove: boolean }): void {
    this.interactionMode = { ...mode };
    this.updateCursorBasedOnInteractionMode();
  }

  /**
   * Handle pan start
   */
  onPanStart(): void {
    this.onViewportStateChange('panning');
  }

  /**
   * Handle pan end
   */
  onPanEnd(): void {
    this.onViewportStateChange('idle');
  }

  /**
   * Handle zoom start
   */
  onZoomStart(): void {
    this.onViewportStateChange('zooming');
  }

  /**
   * Handle zoom end
   */
  onZoomEnd(): void {
    this.onViewportStateChange('idle');
  }

  /**
   * Handle element move start
   */
  onElementMoveStart(): void {
    this.onViewportStateChange('element-moving');
  }

  /**
   * Handle element move end
   */
  onElementMoveEnd(): void {
    this.onViewportStateChange('idle');
  }

  /**
   * Handle viewport state changes
   */
  onViewportStateChange(state: 'idle' | 'panning' | 'zooming' | 'element-moving'): void {
    this.viewportState = state;
    this.updateCursorBasedOnViewportState();
  }

  /**
   * Get current viewport state
   */
  getCurrentViewportState(): 'idle' | 'panning' | 'zooming' | 'element-moving' {
    return this.viewportState;
  }

  /**
   * Update cursor based on current interaction mode
   */
  private updateCursorBasedOnInteractionMode(): void {
    if (this.viewportState === 'idle') {
      // Only update cursor when not actively interacting
      if (this.interactionMode.pan) {
        this.applyCursorForMode('pan');
      } else if (this.interactionMode.zoom) {
        this.applyCursorForMode('zooming');
      } else if (this.interactionMode.elementMove) {
        this.applyCursorForMode('element-moving');
      } else {
        this.applyCursorForMode('select');
      }
    }
  }

  /**
   * Update cursor based on current viewport state
   */
  private updateCursorBasedOnViewportState(): void {
    switch (this.viewportState) {
      case 'panning':
        this.applyCursorForMode('panning');
        break;
      case 'zooming':
        this.applyCursorForMode('zooming');
        break;
      case 'element-moving':
        this.applyCursorForMode('element-moving');
        break;
      case 'idle':
        this.updateCursorBasedOnInteractionMode();
        break;
    }
  }

  /**
   * Hủy cursor manager và cleanup
   */
  public destroy(): void {
    if (this.paperElement) {
      this.paperElement.removeEventListener('mouseenter', this.handleMouseEnter.bind(this));
      this.paperElement.removeEventListener('mouseleave', this.handleMouseLeave.bind(this));
    }

    if (this.paper) {
      this.paper.off('element:mouseenter', this.handleElementMouseEnter.bind(this));
      this.paper.off('element:mouseleave', this.handleElementMouseLeave.bind(this));
      this.paper.off('link:mouseenter', this.handleLinkMouseEnter.bind(this));
      this.paper.off('link:mouseleave', this.handleLinkMouseLeave.bind(this));
      this.paper.off('blank:pointerdown', this.handlePanStart.bind(this));
      this.paper.off('blank:pointermove', this.handlePanMove.bind(this));
      this.paper.off('blank:pointerup', this.handlePanEnd.bind(this));
    }

    this.paper = null;
    this.paperElement = null;
    this.modeCursors.clear();
    this.isMouseOverPaper = false;
  }
}
