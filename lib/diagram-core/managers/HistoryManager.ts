export interface HistoryManagerOptions<TSnapshot> {
  createSnapshot: () => TSnapshot;
  restoreSnapshot: (snapshot: TSnapshot) => void;
  limit?: number;
}

export class HistoryManager<TSnapshot = unknown> {
  private readonly createSnapshot: () => TSnapshot;
  private readonly restoreSnapshot: (snapshot: TSnapshot) => void;
  private readonly limit: number;
  private undoStack: TSnapshot[] = [];
  private redoStack: TSnapshot[] = [];

  constructor(options: HistoryManagerOptions<TSnapshot>) {
    this.createSnapshot = options.createSnapshot;
    this.restoreSnapshot = options.restoreSnapshot;
    this.limit = Math.max(1, options.limit ?? 100);
  }

  push(): void {
    const snapshot = this.createSnapshot();
    this.undoStack.push(snapshot);
    if (this.undoStack.length > this.limit) {
      this.undoStack.shift();
    }
    this.redoStack = [];
  }

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  undo(): void {
    if (!this.canUndo()) return;
    const current = this.createSnapshot();
    const prev = this.undoStack.pop() as TSnapshot;
    this.redoStack.push(current);
    this.restoreSnapshot(prev);
  }

  redo(): void {
    if (!this.canRedo()) return;
    const current = this.createSnapshot();
    const next = this.redoStack.pop() as TSnapshot;
    this.undoStack.push(current);
    this.restoreSnapshot(next);
  }

  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
  }

  peekUndo(): TSnapshot | undefined {
    return this.undoStack[this.undoStack.length - 1];
  }

  peekRedo(): TSnapshot | undefined {
    return this.redoStack[this.redoStack.length - 1];
  }
}
