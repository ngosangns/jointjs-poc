import { DiagramEngine } from '../..//diagram-core/DiagramEngine';
import { PaperManager } from '../../diagram-core/managers/PaperManager';
import { EventManager } from '../../diagram-core/managers/EventManager';
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

class FakePaper {
  public options: any;
  private _scale = { sx: 1, sy: 1 };
  private _translate = { tx: 0, ty: 0 };
  constructor(public initOptions: any) {
    this.options = { ...initOptions };
  }
  on(_event: string, _cb: any) {}
  off() {}
  setGridSize(size: number) {
    this.options.gridSize = size;
  }
  render() {}
  scale(sx: number) {
    if (typeof sx === 'number') {
      this._scale = { sx, sy: sx };
    }
    return this._scale;
  }
  translate(tx?: number, ty?: number) {
    if (typeof tx === 'number' && typeof ty === 'number') {
      this._translate = { tx, ty };
    }
    return this._translate;
  }
}

class FakePaperManager extends PaperManager {
  public initialize(element: HTMLElement, _graph: any, config: any): any {
    const opts = {
      el: element,
      model: _graph,
      width: config.width,
      height: config.height,
      gridSize: config.gridSize || 10,
      drawGrid: true,
      interactive: config.interactive !== false,
      background: config.background || { color: '#f8f9fa' },
    };
    return new FakePaper(opts) as any;
  }
  public setGrid(paper: any, enabled: boolean, gridSize?: number): void {
    paper.options.drawGrid = !!enabled;
    if (typeof gridSize === 'number') paper.setGridSize(gridSize);
  }
}

describe('Grid toggle preserves elements and viewport', () => {
  test('toggle grid does not remove elements and preserves viewport', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    const engine = new DiagramEngine(
      { width: 800, height: 600, gridSize: 10 },
      new EventManager(),
      undefined,
      new FakePaperManager(),
      undefined,
      stubTools
    );

    engine.initializePaper(container);

    // Add two elements
    const id1 = engine.addElement({
      type: 'rectangle',
      position: { x: 100, y: 100 },
      size: { width: 80, height: 40 },
    });
    const id2 = engine.addElement({
      type: 'rectangle',
      position: { x: 300, y: 200 },
      size: { width: 80, height: 40 },
    });

    const beforeIds = engine.getAllElements().map((el: any) => String(el.id));
    expect(beforeIds).toContain(id1);
    expect(beforeIds).toContain(id2);

    // Set a viewport state
    const paper: any = engine.getPaper();
    paper.scale(1.5);
    paper.translate(42, 17);
    const beforeScale = paper.scale().sx;
    const beforeTranslate = paper.translate();

    // Toggle grid a few times
    engine.grid.toggle();
    engine.grid.toggle();
    engine.grid.enable(true);
    engine.grid.setSpacing(20);

    // Elements remain
    const afterIds = engine.getAllElements().map((el: any) => String(el.id));
    expect(afterIds).toContain(id1);
    expect(afterIds).toContain(id2);

    // Viewport preserved
    const afterScale = paper.scale().sx;
    const afterTranslate = paper.translate();
    expect(afterScale).toBeCloseTo(beforeScale, 5);
    expect(afterTranslate).toEqual(beforeTranslate);
  });

  test('selection not cleared by grid toggles', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    const eventManager = new EventManager();
    const engine = new DiagramEngine(
      { width: 800, height: 600, gridSize: 10 },
      eventManager,
      undefined,
      new FakePaperManager(),
      undefined,
      stubTools
    );
    engine.initializePaper(container);

    const id = engine.addElement({
      type: 'rectangle',
      position: { x: 50, y: 50 },
      size: { width: 40, height: 30 },
    });
    engine.selectElement(id);

    let cleared = false;
    engine.addEventListener('selection:cleared', () => {
      cleared = true;
    });

    engine.grid.toggle();
    engine.grid.toggle();

    expect(cleared).toBe(false);
    const selection = Array.from(engine.getSelectionState());
    expect(selection).toContain(id);
  });
});
