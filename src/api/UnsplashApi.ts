import { ApiClient } from './ApiClient';
import { GalleryImage, Page } from '../models/GalleryImage';

interface UnsplashPhotoDto {
  id: string;
  description: string | null;
  alt_description: string | null;
  width: number;
  height: number;
  color: string | null;
  created_at: string;
  urls: { thumb: string; small: string; full: string; regular: string };
  user: { name: string };
}

export interface RemoteImageSource {
  fetchPhotos(page: number, perPage: number): Promise<Page<GalleryImage>>;
  searchPhotos(query: string, page: number, perPage: number): Promise<Page<GalleryImage>>;
}

/**
 * Concrete data source hitting the Unsplash public API.
 * Implements RemoteImageSource so it can be swapped/mocked via DI.
 */
export class UnsplashApi implements RemoteImageSource {
  constructor(private readonly client: ApiClient) {}

  async fetchPhotos(page: number, perPage = 20): Promise<Page<GalleryImage>> {
    const dtos = await this.client.get<UnsplashPhotoDto[]>('/photos', { page, per_page: perPage });
    return {
      items: dtos.map(this.toDomain),
      page,
      hasMore: dtos.length === perPage,
    };
  }

  async searchPhotos(query: string, page: number, perPage = 20): Promise<Page<GalleryImage>> {
    const result = await this.client.get<{ results: UnsplashPhotoDto[]; total_pages: number }>(
      '/search/photos',
      { query, page, per_page: perPage }
    );
    return {
      items: result.results.map(this.toDomain),
      page,
      hasMore: page < result.total_pages,
    };
  }

  private toDomain = (dto: UnsplashPhotoDto): GalleryImage => ({
    id: dto.id,
    description: dto.description ?? dto.alt_description ?? 'Untitled',
    thumbUrl: dto.urls.thumb,
    smallUrl: dto.urls.small,
    fullUrl: dto.urls.regular ?? dto.urls.full,
    width: dto.width,
    height: dto.height,
    authorName: dto.user.name,
    color: dto.color,
    createdAt: dto.created_at,
    isFavorite: false,
  });
}
