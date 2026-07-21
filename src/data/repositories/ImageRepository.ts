import { GalleryImage, Page } from '../../models/GalleryImage';

/**
 * Domain-facing contract. ViewModels/UseCases depend on this interface only,
 * never on Database or UnsplashApi directly -> easy to unit test with a fake.
 */
export interface ImageRepository {
  getFeed(page: number, perPage: number): Promise<Page<GalleryImage>>;
  search(query: string, page: number, perPage: number): Promise<Page<GalleryImage>>;
  toggleFavorite(id: string): Promise<boolean>;
  getFavorites(): Promise<GalleryImage[]>;
  syncPendingFavorites(): Promise<void>;
}
