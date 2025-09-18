import type { DiagramConfig } from '../../types';
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

class FakePaper {
  public options: any;
  constructor(opts: any) {
    this.options = opts;
  }
  on() {}
  off() {}
  scale() {
    return { sx: 1, sy: 1 };
  }
  translate() {
    return { tx: 0, ty: 0 };
  }
}

class PM extends PaperManager {
  public initialize(element: HTMLElement, graph: any, config: any): any {
    return new FakePaper({
      el: element,
      model: graph,
      width: config.width,
      height: config.height,
      interaction: {
        dragStartThresholdPx: config.interaction?.dragStartThresholdPx ?? 4,
        pressHoldMs: config.interaction?.pressHoldMs ?? 200,
      },
    });
  }
}

describe('Public API interaction options', () => {
  test('DiagramConfig includes interaction typing', () => {
    const cfg: DiagramConfig = {
      width: 100,
      height: 100,
      interaction: { dragStartThresholdPx: 7, pressHoldMs: 250 },
    };
    expect(cfg.interaction?.dragStartThresholdPx).toBe(7);
    expect(cfg.interaction?.pressHoldMs).toBe(250);
  });

  test('interaction options propagate to PaperManager', () => {
    const container = document.createElement('div');
    const engine = new DiagramEngine(
      { width: 200, height: 200, interaction: { dragStartThresholdPx: 9, pressHoldMs: 333 } },
      undefined,
      undefined,
      new PM(),
      undefined,
      stubTools
    );
    engine.initializePaper(container);
    const paper: any = engine.getPaper();
    expect(paper.options.interaction.dragStartThresholdPx).toBe(9);
    expect(paper.options.interaction.pressHoldMs).toBe(333);
  });
});
