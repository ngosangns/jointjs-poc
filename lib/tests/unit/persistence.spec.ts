import { IndexedDbStore } from '../../diagram-core/persistence';

describe('Persistence (IndexedDbStore)', () => {
  it('can be constructed and exposes save/load methods', async () => {
    const store = new IndexedDbStore({ dbName: 'test-db', storeName: 'docs' });
    expect(typeof store.save).toBe('function');
    expect(typeof store.load).toBe('function');
  });
});


