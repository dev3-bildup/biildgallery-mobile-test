import { ImageRepository } from './ImageRepository';
import { RemoteImageSource } from '../../api/UnsplashApi';
import { Database } from '../db/Database';
import { GalleryImage, Page } from '../../models/GalleryImage';
import { NetworkMonitor } from '../../utils/NetworkMonitor';

const FEED_KEY = '__feed__';
const searchKey = (q: string) => `search:${q.trim().toLowerCase()}`;

/**
 * Offline-first strategy:
 *  - Reads always try network first (fresher data), and on ANY failure
 *    (offline, timeout, 5xx) transparently fall back to the local SQLite
 *    cache so the UI never sees a hard error if we have something to show.
 *  - Writes (favorite toggles) apply to the local DB immediately (optimistic)
 *    and are flagged `pendingSync`; syncPendingFavorites() flushes them to
 *    the "server" (simulated here, see README) once connectivity returns.
 */
export class ImageRepositoryImpl implements ImageRepository {
  constructor(
    private readonly remote: RemoteImageSource,
    private readonly db: Database,
    private readonly network: NetworkMonitor
  ) {}

  async getFeed(page: number, perPage: number): Promise<Page<GalleryImage>> {
    return this.fetchWithFallback(
      () => this.remote.fetchPhotos(page, perPage),
      FEED_KEY,
      page,
      perPage
    );
  }

  async search(query: string, page: number, perPage: number): Promise<Page<GalleryImage>> {
    return this.fetchWithFallback(
      () => this.remote.searchPhotos(query, page, perPage),
      searchKey(query),
      page,
      perPage
    );
  }

  private async fetchWithFallback(
    networkCall: () => Promise<Page<GalleryImage>>,
    queryKey: string,
    page: number,
    perPage: number
  ): Promise<Page<GalleryImage>> {
    const online = await this.network.isOnline();
    if (online) {
      try {
        const result = await networkCall();
        await this.mergeFavoriteFlags(result.items);
        await this.db.upsertImages(result.items, queryKey, (page - 1) * perPage);
        return result;
      } catch {
        // fall through to cache
      }
    }
    const cached = await this.db.getImages(queryKey, perPage, (page - 1) * perPage);
    return { items: cached, page, hasMore: cached.length === perPage };
  }

  /** Preserve locally-set favorite state across a fresh network fetch. */
  private async mergeFavoriteFlags(items: GalleryImage[]): Promise<void> {
    const favorites = await this.db.getFavorites();
    const favoriteIds = new Set(favorites.map((f) => f.id));
    for (const item of items) {
      item.isFavorite = favoriteIds.has(item.id);
    }
  }

  async toggleFavorite(id: string): Promise<boolean> {
    const favorites = await this.db.getFavorites();
    const isCurrentlyFavorite = favorites.some((f) => f.id === id);
    const next = !isCurrentlyFavorite;
    await this.db.setFavorite(id, next, true);
    // Best-effort immediate sync; if offline, stays pendingSync=true for later.
    void this.syncPendingFavorites();
    return next;
  }

  async getFavorites(): Promise<GalleryImage[]> {
    return this.db.getFavorites();
  }

  async syncPendingFavorites(): Promise<void> {
    const online = await this.network.isOnline();
    if (!online) return;
    const pending = await this.db.getPendingSyncFavorites();
    if (pending.length === 0) return;
    // In a real backend this would POST /favorites. Simulated here since
    // Unsplash's public demo API has no per-user favorites endpoint.
    await this.db.clearPendingSync(pending.map((p) => p.id));
  }
}
