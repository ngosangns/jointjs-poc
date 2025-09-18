export interface PersistedDocument {
  id: string;
  updatedAt: number;
  payload: unknown;
}

export interface IndexedDbStoreOptions {
  dbName?: string;
  storeName?: string;
  version?: number;
}

export class IndexedDbStore {
  private readonly dbName: string;
  private readonly storeName: string;
  private readonly version: number;

  constructor(options: IndexedDbStoreOptions = {}) {
    this.dbName = options.dbName ?? 'diagram-db';
    this.storeName = options.storeName ?? 'documents';
    this.version = options.version ?? 1;
  }

  async save(doc: PersistedDocument): Promise<void> {
    const db = await this.open();
    const tx = db.transaction(this.storeName, 'readwrite');
    await tx.store.put(doc);
    await tx.done;
  }

  async load(id: string): Promise<PersistedDocument | undefined> {
    const db = await this.open();
    const result = await db.get(this.storeName, id);
    return result as PersistedDocument | undefined;
  }

  private async open(): Promise<any> {
    const { openDB } = await import('idb');
    return openDB(this.dbName, this.version, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('documents')) {
          db.createObjectStore('documents', { keyPath: 'id' });
        }
      },
    });
  }
}
