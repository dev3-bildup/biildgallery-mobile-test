import { ImageRepository } from '../../data/repositories/ImageRepository';
import { GalleryImage } from '../../models/GalleryImage';

export class GetFavoritesUseCase {
  constructor(private readonly repository: ImageRepository) {}

  execute(): Promise<GalleryImage[]> {
    return this.repository.getFavorites();
  }
}
