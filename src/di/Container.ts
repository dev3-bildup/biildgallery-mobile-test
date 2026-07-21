import { ApiClient } from '../api/ApiClient';
import { UnsplashApi } from '../api/UnsplashApi';
import { Database } from '../data/db/Database';
import { ImageRepository } from '../data/repositories/ImageRepository';
import { ImageRepositoryImpl } from '../data/repositories/ImageRepositoryImpl';
import { ExpoNetworkMonitor, NetworkMonitor } from '../utils/NetworkMonitor';
import { GetImageFeedUseCase } from '../domain/usecases/GetImageFeedUseCase';
import { SearchImagesUseCase } from '../domain/usecases/SearchImagesUseCase';
import { ToggleFavoriteUseCase } from '../domain/usecases/ToggleFavoriteUseCase';
import { GetFavoritesUseCase } from '../domain/usecases/GetFavoritesUseCase';
import { SyncFavoritesUseCase } from '../domain/usecases/SyncFavoritesUseCase';

export interface AppDependencies {
  imageRepository: ImageRepository;
  networkMonitor: NetworkMonitor;
  database: Database;
  useCases: {
    getImageFeed: GetImageFeedUseCase;
    searchImages: SearchImagesUseCase;
    toggleFavorite: ToggleFavoriteUseCase;
    getFavorites: GetFavoritesUseCase;
    syncFavorites: SyncFavoritesUseCase;
  };
}

/**
 * Composition root. This is the ONLY place concrete implementations are
 * wired to their interfaces. Screens/ViewModels receive `AppDependencies`
 * (or individual use cases) via React Context (see AppProviders.tsx) or
 * direct construction in tests -- nothing below `di/` imports from here,
 * which keeps the dependency graph acyclic and mockable.
 */
export function buildContainer(config: { unsplashAccessKey: string; unsplashBaseUrl: string }): AppDependencies {
  const apiClient = new ApiClient(config.unsplashBaseUrl, config.unsplashAccessKey);
  const remoteSource = new UnsplashApi(apiClient);
  const db = new Database();
  const networkMonitor: NetworkMonitor = new ExpoNetworkMonitor();
  const imageRepository: ImageRepository = new ImageRepositoryImpl(remoteSource, db, networkMonitor);

  return {
    imageRepository,
    networkMonitor,
    database: db,
    useCases: {
      getImageFeed: new GetImageFeedUseCase(imageRepository),
      searchImages: new SearchImagesUseCase(imageRepository),
      toggleFavorite: new ToggleFavoriteUseCase(imageRepository),
      getFavorites: new GetFavoritesUseCase(imageRepository),
      syncFavorites: new SyncFavoritesUseCase(imageRepository),
    },
  };
}
