import { ImageRepository } from '../../data/repositories/ImageRepository';
import { Page, GalleryImage } from '../../models/GalleryImage';

export class SearchImagesUseCase {
  constructor(private readonly repository: ImageRepository) {}

  execute(query: string, page: number, perPage = 20): Promise<Page<GalleryImage>> {
    const trimmed = query.trim();
    if (trimmed.length === 0) {
      return Promise.resolve({ items: [], page, hasMore: false });
    }
    return this.repository.search(trimmed, page, perPage);
  }
}
