import { DiagramEngine } from '../../diagram-core/DiagramEngine';
import { PaperManager } from '../../diagram-core/managers/PaperManager';
import { EventManager } from '../../diagram-core/managers/EventManager';

class FakeEvt {
  constructor(public clientX: number, public clientY: number, public buttons: number = 1) {}
}

class FakePaper2 {
  public options: any;
  private listeners = new Map<string, Function[]>();
  constructor(opts: any) {
    this.options = opts;
  }
  on(event: string, cb: any) {
    const arr = this.listeners.get(event) || [];
    arr.push(cb);
    this.listeners.set(event, arr);
  }
  off() {}
  emit(event: string, ...args: any[]) {
    (this.listeners.get(event) || []).forEach((cb) => cb(...args));
  }
  setGridSize() {}
  render() {}
  scale() {
    return { sx: 1, sy: 1 };
  }
  translate() {
    return { tx: 0, ty: 0 };
  }
}

class FakePaperManager2 extends PaperManager {
  public initialize(element: HTMLElement, _graph: any, config: any): any {
    return new FakePaper2({
      el: element,
      model: _graph,
      width: config.width,
      height: config.height,
      gridSize: config.gridSize || 10,
      drawGrid: true,
      interactive: config.interactive !== false,
      background: config.background || { color: '#f8f9fa' },
      interaction: {
        dragStartThresholdPx: config.interaction?.dragStartThresholdPx ?? 4,
        pressHoldMs: config.interaction?.pressHoldMs ?? 200,
      },
    }) as any;
  }
}

const stubTools: any = {
  initialize: () => {},
  registerElementTools: () => {},
  registerLinkTools: () => {},
  showElementTools: () => {},
  hideElementTools: () => {},
  showLinkTools: () => {},
  hideLinkTools: () => {},
  showAllTools: () => {},
  hideAllTools: () => {},
  removeAllTools: () => {},
  createElementTool: () => ({} as any),
  createLinkTool: () => ({} as any),
  getElementTools: () => undefined,
  getLinkTools: () => undefined,
  getElementToolNames: () => [],
  getLinkToolNames: () => [],
  unregisterElementTools: () => true,
  unregisterLinkTools: () => true,
  destroy: () => {},
  setGridEnabled: () => {},
  setGridSize: () => {},
  getGridEnabled: () => true,
  getGridSize: () => 10,
  toggleGrid: () => true,
};

describe('Interaction thresholds', () => {
  test('below threshold does not drag; click selects only', () => {
    const container = document.createElement('div');
    const em = new EventManager();
    const engine = new DiagramEngine(
      { width: 800, height: 600, interaction: { dragStartThresholdPx: 10 } },
      em,
      undefined,
      new FakePaperManager2(),
      undefined,
      stubTools
    );
    engine.initializePaper(container);
    const paper: any = engine.getPaper();

    const id = engine.addElement({
      type: 'rectangle',
      position: { x: 100, y: 100 },
      size: { width: 50, height: 30 },
    });

    let dragging = false;
    engine.addEventListener('element:dragging', () => {
      dragging = true;
    });

    // Simulate pointerdown -> small move -> pointerup
    paper.emit('element:pointerdown', { model: { id } }, new FakeEvt(10, 10, 1));
    paper.emit('element:pointermove', { model: { id } }, new FakeEvt(17, 14, 1)); // dist < 10
    paper.emit('element:pointerup', { model: { id } }, new FakeEvt(17, 14, 1));

    expect(dragging).toBe(false);
    expect(Array.from(engine.getSelectionState())).toContain(id);
  });

  test('crossing threshold triggers dragging', () => {
    const container = document.createElement('div');
    const em = new EventManager();
    const engine = new DiagramEngine(
      { width: 800, height: 600, interaction: { dragStartThresholdPx: 5 } },
      em,
      undefined,
      new FakePaperManager2(),
      undefined,
      stubTools
    );
    engine.initializePaper(container);
    const paper: any = engine.getPaper();
    const id = engine.addElement({
      type: 'rectangle',
      position: { x: 0, y: 0 },
      size: { width: 20, height: 20 },
    });

    let dragging = false;
    engine.addEventListener('element:dragging', () => {
      dragging = true;
    });

    paper.emit('element:pointerdown', { model: { id } }, new FakeEvt(0, 0, 1));
    paper.emit('element:pointermove', { model: { id } }, new FakeEvt(6, 0, 1)); // dist > 5
    expect(dragging).toBe(true);
  });

  test('press-hold triggers dragging without movement', async () => {
    jest.useFakeTimers();
    const container = document.createElement('div');
    const em = new EventManager();
    const engine = new DiagramEngine(
      { width: 800, height: 600, interaction: { pressHoldMs: 100 } },
      em,
      undefined,
      new FakePaperManager2(),
      undefined,
      stubTools
    );
    engine.initializePaper(container);
    const paper: any = engine.getPaper();
    const id = engine.addElement({
      type: 'rectangle',
      position: { x: 0, y: 0 },
      size: { width: 20, height: 20 },
    });

    let dragging = false;
    engine.addEventListener('element:dragging', () => {
      dragging = true;
    });

    paper.emit('element:pointerdown', { model: { id } }, new FakeEvt(0, 0, 1));
    jest.advanceTimersByTime(100);
    expect(dragging).toBe(true);
    jest.useRealTimers();
  });
});
