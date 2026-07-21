import { ImageRepositoryImpl } from '../../src/data/repositories/ImageRepositoryImpl';
import { Database } from '../../src/data/db/Database';
import { RemoteImageSource } from '../../src/api/UnsplashApi';
import { NetworkMonitor } from '../../src/utils/NetworkMonitor';
import { makeImages } from '../fixtures/imageFixtures';

function makeFakeDb(): jest.Mocked<Database> {
  return {
    open: jest.fn(),
    upsertImages: jest.fn(),
    getImages: jest.fn(),
    setFavorite: jest.fn(),
    getFavorites: jest.fn().mockResolvedValue([]),
    getPendingSyncFavorites: jest.fn().mockResolvedValue([]),
    clearPendingSync: jest.fn(),
  } as unknown as jest.Mocked<Database>;
}

describe('ImageRepositoryImpl (offline-first behavior)', () => {
  let remote: jest.Mocked<RemoteImageSource>;
  let db: jest.Mocked<Database>;
  let network: jest.Mocked<NetworkMonitor>;
  let repo: ImageRepositoryImpl;

  beforeEach(() => {
    remote = { fetchPhotos: jest.fn(), searchPhotos: jest.fn() };
    db = makeFakeDb();
    network = { isOnline: jest.fn() };
    repo = new ImageRepositoryImpl(remote, db, network);
  });

  it('fetches from network and caches results when online', async () => {
    network.isOnline.mockResolvedValue(true);
    const images = makeImages(3);
    remote.fetchPhotos.mockResolvedValue({ items: images, page: 1, hasMore: true });

    const result = await repo.getFeed(1, 20);

    expect(remote.fetchPhotos).toHaveBeenCalledWith(1, 20);
    expect(db.upsertImages).toHaveBeenCalledWith(images, '__feed__', 0);
    expect(result.items).toHaveLength(3);
  });

  it('falls back to cache when offline', async () => {
    network.isOnline.mockResolvedValue(false);
    const cached = makeImages(2, 'cached');
    db.getImages.mockResolvedValue(cached);

    const result = await repo.getFeed(1, 20);

    expect(remote.fetchPhotos).not.toHaveBeenCalled();
    expect(result.items).toEqual(cached);
  });

  it('falls back to cache when the network call throws', async () => {
    network.isOnline.mockResolvedValue(true);
    remote.fetchPhotos.mockRejectedValue(new Error('timeout'));
    const cached = makeImages(1, 'cached');
    db.getImages.mockResolvedValue(cached);

    const result = await repo.getFeed(1, 20);

    expect(result.items).toEqual(cached);
  });

  it('preserves locally-favorited state when merging fresh network results', async () => {
    network.isOnline.mockResolvedValue(true);
    const images = makeImages(2);
    remote.fetchPhotos.mockResolvedValue({ items: images, page: 1, hasMore: false });
    db.getFavorites.mockResolvedValue([{ ...images[0], isFavorite: true }]);

    const result = await repo.getFeed(1, 20);

    expect(result.items[0].isFavorite).toBe(true);
    expect(result.items[1].isFavorite).toBe(false);
  });

  it('toggleFavorite flips state optimistically and marks pendingSync', async () => {
    db.getFavorites.mockResolvedValue([]);
    network.isOnline.mockResolvedValue(false);

    const result = await repo.toggleFavorite('img-1');

    expect(result).toBe(true);
    expect(db.setFavorite).toHaveBeenCalledWith('img-1', true, true);
  });

  it('syncPendingFavorites is a no-op when offline', async () => {
    network.isOnline.mockResolvedValue(false);
    await repo.syncPendingFavorites();
    expect(db.getPendingSyncFavorites).not.toHaveBeenCalled();
  });

  it('syncPendingFavorites clears pending flags for cached favorites when online', async () => {
    network.isOnline.mockResolvedValue(true);
    const pending = makeImages(2, 'pending');
    db.getPendingSyncFavorites.mockResolvedValue(pending);

    await repo.syncPendingFavorites();

    expect(db.clearPendingSync).toHaveBeenCalledWith(['pending-0', 'pending-1']);
  });
});
