import { DiagramEngine } from '../../diagram-core/DiagramEngine';
import { PersistenceManager } from '../../diagram-core/managers/PersistenceManager';

class InMemoryPersistence extends PersistenceManager {
  constructor() {
    super({
      save: async (doc: any) => {
        InMemoryPersistence.mem.set(doc.id, doc);
      },
      load: async (id: string) => InMemoryPersistence.mem.get(id),
    } as any);
  }
  static mem = new Map<string, any>();
}

describe('Contract: Library APIs', () => {
  it('create elements/links, save, clear, load back', async () => {
    const persistence = new InMemoryPersistence();
    const engine = new DiagramEngine(
      { width: 800, height: 600 },
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      { persistence }
    );

    const elementA = engine.addElement({
      type: 'rectangle',
      position: { x: 10, y: 10 },
      size: { width: 80, height: 40 },
    } as any);
    const elementB = engine.addElement({
      type: 'rectangle',
      position: { x: 200, y: 10 },
      size: { width: 80, height: 40 },
    } as any);
    const linkId = engine.addLink({ source: elementA as any, target: elementB as any } as any);

    const before = engine.getDiagramData();
    expect(before.elements.length).toBeGreaterThanOrEqual(2);
    expect(before.links.length).toBeGreaterThanOrEqual(1);

    await engine.save('doc1');
    engine.clear();
    expect(engine.getDiagramData().elements.length).toBe(0);

    await engine.load('doc1');
    const after = engine.getDiagramData();
    expect(after.elements.length).toBe(before.elements.length);
    expect(after.links.length).toBe(before.links.length);
    expect(after).toBeTruthy();
  });

  it('undo/redo reverts last change', () => {
    const engine = new DiagramEngine({ width: 800, height: 600 });
    const id = engine.addElement({
      type: 'rectangle',
      position: { x: 10, y: 10 },
      size: { width: 10, height: 10 },
    } as any);
    expect(engine.getDiagramData().elements.length).toBe(1);
    engine.removeElement(id);
    expect(engine.getDiagramData().elements.length).toBe(0);
    engine.undo();
    expect(engine.getDiagramData().elements.length).toBe(1);
    engine.redo();
    expect(engine.getDiagramData().elements.length).toBe(0);
  });
});
