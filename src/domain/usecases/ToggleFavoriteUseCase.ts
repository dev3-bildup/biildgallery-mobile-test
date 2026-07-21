import { ImageRepository } from '../../data/repositories/ImageRepository';

export class ToggleFavoriteUseCase {
  constructor(private readonly repository: ImageRepository) {}

  execute(imageId: string): Promise<boolean> {
    if (!imageId) throw new Error('imageId is required');
    return this.repository.toggleFavorite(imageId);
  }
}
