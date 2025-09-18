import { IndexedDbStore, type PersistedDocument } from '../persistence';

export interface PersistenceManagerOptions {
  dbName?: string;
  storeName?: string;
  version?: number;
}

export interface PersistenceAdapter {
  save(doc: PersistedDocument): Promise<void>;
  load(id: string): Promise<PersistedDocument | undefined>;
}

export class PersistenceManager {
  private readonly store: PersistenceAdapter;

  constructor(optionsOrAdapter: PersistenceManagerOptions | PersistenceAdapter = {}) {
    if (
      typeof (optionsOrAdapter as any).save === 'function' &&
      typeof (optionsOrAdapter as any).load === 'function'
    ) {
      this.store = optionsOrAdapter as PersistenceAdapter;
    } else {
      this.store = new IndexedDbStore(optionsOrAdapter as PersistenceManagerOptions);
    }
  }

  async saveDocument(documentId: string, payload: unknown): Promise<void> {
    const doc: PersistedDocument = {
      id: documentId,
      updatedAt: Date.now(),
      payload,
    };
    await this.store.save(doc);
  }

  async loadDocument<TPayload = unknown>(documentId: string): Promise<TPayload | undefined> {
    const doc = await this.store.load(documentId);
    return (doc?.payload as TPayload) ?? undefined;
  }
}
