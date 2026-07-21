import { ImageRepository } from '../../data/repositories/ImageRepository';

export class SyncFavoritesUseCase {
  constructor(private readonly repository: ImageRepository) {}

  execute(): Promise<void> {
    return this.repository.syncPendingFavorites();
  }
}
