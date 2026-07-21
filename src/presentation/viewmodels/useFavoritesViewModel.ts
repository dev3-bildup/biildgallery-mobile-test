import { useCallback, useEffect, useState } from 'react';
import { GalleryImage } from '../../models/GalleryImage';
import { GetFavoritesUseCase } from '../../domain/usecases/GetFavoritesUseCase';
import { ToggleFavoriteUseCase } from '../../domain/usecases/ToggleFavoriteUseCase';
import { SyncFavoritesUseCase } from '../../domain/usecases/SyncFavoritesUseCase';

export interface FavoritesViewModel {
  favorites: GalleryImage[];
  isLoading: boolean;
  errorMessage: string | null;
  refresh: () => void;
  removeFavorite: (id: string) => Promise<void>;
}

export function useFavoritesViewModel(
  getFavorites: GetFavoritesUseCase,
  toggleFavorite: ToggleFavoriteUseCase,
  syncFavorites: SyncFavoritesUseCase
): FavoritesViewModel {
  const [favorites, setFavorites] = useState<GalleryImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      await syncFavorites.execute();
      const result = await getFavorites.execute();
      setFavorites(result);
      setErrorMessage(null);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to load favorites');
    } finally {
      setIsLoading(false);
    }
  }, [getFavorites, syncFavorites]);

  useEffect(() => {
    load();
  }, [load]);

  const removeFavorite = useCallback(
    async (id: string) => {
      await toggleFavorite.execute(id);
      setFavorites((prev) => prev.filter((f) => f.id !== id));
    },
    [toggleFavorite]
  );

  return { favorites, isLoading, errorMessage, refresh: load, removeFavorite };
}
