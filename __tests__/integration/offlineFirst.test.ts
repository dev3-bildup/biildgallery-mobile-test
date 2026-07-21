import { Database } from '../../src/data/db/Database';
import { ImageRepositoryImpl } from '../../src/data/repositories/ImageRepositoryImpl';
import { RemoteImageSource } from '../../src/api/UnsplashApi';
import { NetworkMonitor } from '../../src/utils/NetworkMonitor';
import { makeImages } from '../fixtures/imageFixtures';

/**
 * Unlike the unit tests (which mock Database), this test exercises the real
 * Database class against the in-memory expo-sqlite mock, so it verifies the
 * actual SQL upsert/query round-trip alongside the repository's fallback
 * logic. This is the closest thing to an end-to-end test of "offline-first"
 * without a device/emulator.
 */
describe('Offline-first integration: Database + ImageRepositoryImpl', () => {
  let db: Database;
  let remote: jest.Mocked<RemoteImageSource>;
  let network: jest.Mocked<NetworkMonitor> & { setOnline: (v: boolean) => void };
  let repo: ImageRepositoryImpl;

  beforeEach(async () => {
    db = new Database();
    await db.open();
    remote = { fetchPhotos: jest.fn(), searchPhotos: jest.fn() };

    let online = true;
    network = {
      isOnline: jest.fn(async () => online),
      setOnline: (v: boolean) => {
        online = v;
      },
    };
    repo = new ImageRepositoryImpl(remote, db, network);
  });

  it('serves cached data after going offline once the feed has been fetched while online', async () => {
    const images = makeImages(5);
    remote.fetchPhotos.mockResolvedValue({ items: images, page: 1, hasMore: false });

    // 1. Online: fetch and implicitly cache the feed.
    const onlineResult = await repo.getFeed(1, 20);
    expect(onlineResult.items).toHaveLength(5);

    // 2. Go offline.
    network.setOnline(false);
    remote.fetchPhotos.mockRejectedValue(new Error('should not be called while offline'));

    const offlineResult = await repo.getFeed(1, 20);
    expect(offlineResult.items.map((i) => i.id)).toEqual(images.map((i) => i.id));
  });

  it('persists a favorite toggle locally while offline and syncs once back online', async () => {
    const images = makeImages(1);
    remote.fetchPhotos.mockResolvedValue({ items: images, page: 1, hasMore: false });
    await repo.getFeed(1, 20);

    network.setOnline(false);
    const isFav = await repo.toggleFavorite(images[0].id);
    expect(isFav).toBe(true);

    // Still offline: favorite is recorded locally and visible via getFavorites.
    const favoritesWhileOffline = await repo.getFavorites();
    expect(favoritesWhileOffline).toHaveLength(1);
    expect(favoritesWhileOffline[0].id).toBe(images[0].id);

    // Back online: pending sync flushes without throwing.
    network.setOnline(true);
    await expect(repo.syncPendingFavorites()).resolves.not.toThrow();
  });

  it('preserves favorite state when the same feed is re-fetched from the network', async () => {
    const images = makeImages(3);
    remote.fetchPhotos.mockResolvedValue({ items: images, page: 1, hasMore: false });
    await repo.getFeed(1, 20);
    await repo.toggleFavorite(images[1].id);

    const refreshed = await repo.getFeed(1, 20);
    const favorited = refreshed.items.find((i) => i.id === images[1].id);
    expect(favorited?.isFavorite).toBe(true);
  });
});
