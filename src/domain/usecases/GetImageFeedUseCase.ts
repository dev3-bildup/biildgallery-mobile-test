import { ImageRepository } from '../../data/repositories/ImageRepository';
import { Page, GalleryImage } from '../../models/GalleryImage';

export class GetImageFeedUseCase {
  constructor(private readonly repository: ImageRepository) {}

  execute(page: number, perPage = 20): Promise<Page<GalleryImage>> {
    if (page < 1) throw new Error('page must be >= 1');
    return this.repository.getFeed(page, perPage);
  }
}
