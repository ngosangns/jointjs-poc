import { DiagramEngine } from '../../diagram-core/DiagramEngine';
import { PaperManager } from '../../diagram-core/managers/PaperManager';
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
import { EventManager } from '../../diagram-core/managers/EventManager';
import { ToolsManager } from '../../diagram-core/managers/ToolsManager';

class FakePaper3 {
  public options: any;
  private _scale = { sx: 1, sy: 1 };
  private _translate = { tx: 0, ty: 0 };
  constructor(public initOptions: any) {
    this.options = { ...initOptions };
  }
  on() {}
  off() {}
  setGridSize(size: number) {
    this.options.gridSize = size;
  }
  render() {}
  scale(sx?: number) {
    if (typeof sx === 'number') this._scale = { sx, sy: sx };
    return this._scale;
  }
  translate(tx?: number, ty?: number) {
    if (typeof tx === 'number' && typeof ty === 'number') this._translate = { tx, ty };
    return this._translate;
  }
}

class PM3 extends PaperManager {
  public initialize(element: HTMLElement, _graph: any, config: any): any {
    return new FakePaper3({
      el: element,
      model: _graph,
      width: config.width,
      height: config.height,
      gridSize: config.gridSize || 10,
      drawGrid: true,
    });
  }
}

describe('Selection state stable across grid toggles', () => {
  test('selection remains after grid toggle, no cleared event', () => {
    const container = document.createElement('div');
    const em = new EventManager();
    const engine = new DiagramEngine(
      { width: 800, height: 600 },
      em,
      undefined,
      new PM3(),
      undefined,
      stubTools
    );
    engine.initializePaper(container);
    const idA = engine.addElement({
      type: 'rectangle',
      position: { x: 10, y: 10 },
      size: { width: 30, height: 20 },
    });
    const idB = engine.addElement({
      type: 'rectangle',
      position: { x: 60, y: 10 },
      size: { width: 30, height: 20 },
    });

    engine.selectElement(idA);
    engine.selectElement(idB);

    let cleared = false;
    engine.addEventListener('selection:cleared', () => {
      cleared = true;
    });

    engine.grid.toggle();
    engine.grid.toggle();

    const selected = Array.from(engine.getSelectionState());
    expect(selected).toContain(idA);
    expect(selected).toContain(idB);
    expect(cleared).toBe(false);
  });
});
