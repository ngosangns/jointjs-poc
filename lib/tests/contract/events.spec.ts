import { DiagramEngine } from '../../diagram-core/DiagramEngine';
class InMemoryPersistence {
  static mem = new Map<string, any>();
  async saveDocument(documentId: string, payload: unknown): Promise<void> {
    InMemoryPersistence.mem.set(documentId, { id: documentId, payload, updatedAt: Date.now() });
  }
  async loadDocument<T = unknown>(documentId: string): Promise<T | undefined> {
    return InMemoryPersistence.mem.get(documentId)?.payload as T | undefined;
  }
}

describe('Contract: Events', () => {
  it('emits document:saved and document:loaded', async () => {
    const engine = new DiagramEngine(
      { width: 400, height: 300 },
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      { persistence: new InMemoryPersistence() as any }
    );
    const saved: string[] = [];
    const loaded: string[] = [];
    engine.addEventListener('document:saved', (e: any) => saved.push(e.data.id));
    engine.addEventListener('document:loaded', (e: any) => loaded.push(e.data.id));
    await (engine as any).save('doc');
    await (engine as any).load('doc');
    expect(saved).toContain('doc');
    expect(loaded).toContain('doc');
  });
});
