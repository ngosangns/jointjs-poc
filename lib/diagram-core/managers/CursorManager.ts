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
  private isMouseOverPaper: boolean = false;
  private paperElement: HTMLElement | null = null;

  constructor() {
    // Thiết lập cursor mặc định cho các mode khác nhau
    this.modeCursors.set('select', 'default');
    this.modeCursors.set('pan', 'grab');
    this.modeCursors.set('panning', 'grabbing');
    this.modeCursors.set('zoom', 'zoom-in');
    this.modeCursors.set('draw', 'crosshair');
    this.modeCursors.set('resize', 'nw-resize');
    this.modeCursors.set('move', 'move');
  }

  /**
   * Khởi tạo cursor manager với paper instance
   */
  public initialize(paper: dia.Paper): void {
    this.paper = paper;
    this.paperElement = paper.el as HTMLElement;
    
    if (this.paperElement) {
      this.setupEventListeners();
      this.setCursor(this.defaultCursor);
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
    this.onMouseLeave();
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
    // Reset cursor khi mouse leave
    this.setCursor('default');
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
    this.setTemporaryCursor('pointer');
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
    this.setTemporaryCursor('pointer');
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