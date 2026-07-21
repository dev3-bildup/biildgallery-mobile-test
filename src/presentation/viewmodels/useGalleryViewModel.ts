import { useCallback, useEffect, useRef, useState } from 'react';
import { GalleryImage } from '../../models/GalleryImage';
import { GetImageFeedUseCase } from '../../domain/usecases/GetImageFeedUseCase';
import { SearchImagesUseCase } from '../../domain/usecases/SearchImagesUseCase';
import { ToggleFavoriteUseCase } from '../../domain/usecases/ToggleFavoriteUseCase';
import { debounce } from '../../utils/debounce';

export type GalleryStatus = 'idle' | 'loading' | 'loadingMore' | 'refreshing' | 'error' | 'ready';

export interface GalleryViewState {
  images: GalleryImage[];
  status: GalleryStatus;
  errorMessage: string | null;
  hasMore: boolean;
  searchQuery: string;
}

export interface GalleryViewModel extends GalleryViewState {
  loadNextPage: () => void;
  refresh: () => void;
  setSearchQuery: (q: string) => void;
  toggleFavorite: (id: string) => Promise<void>;
}

const PER_PAGE = 20;

/**
 * MVVM ViewModel implemented as a custom hook. Holds all UI state and talks
 * only to use cases (never directly to repository/api/db), so it can be
 * unit-tested by injecting fake use cases -- no React Native rendering
 * required. See __tests__/unit/useGalleryViewModel.test.ts.
 */
export function useGalleryViewModel(
  getFeed: GetImageFeedUseCase,
  search: SearchImagesUseCase,
  toggleFavoriteUseCase: ToggleFavoriteUseCase
): GalleryViewModel {
  const [state, setState] = useState<GalleryViewState>({
    images: [],
    status: 'idle',
    errorMessage: null,
    hasMore: true,
    searchQuery: '',
  });

  const pageRef = useRef(1);
  const queryRef = useRef('');
  const requestIdRef = useRef(0);

  const load = useCallback(
    async (opts: { page: number; query: string; mode: 'initial' | 'loadingMore' | 'refreshing' }) => {
      const requestId = ++requestIdRef.current;
      setState((s) => ({ ...s, status: opts.mode === 'initial' ? 'loading' : opts.mode, errorMessage: null }));

      try {
        const result = opts.query
          ? await search.execute(opts.query, opts.page, PER_PAGE)
          : await getFeed.execute(opts.page, PER_PAGE);

        if (requestId !== requestIdRef.current) return; // stale response, a newer request superseded it

        setState((s) => ({
          images: opts.mode === 'loadingMore' ? [...s.images, ...result.items] : result.items,
          status: 'ready',
          errorMessage: null,
          hasMore: result.hasMore,
          searchQuery: opts.query,
        }));
        pageRef.current = opts.page;
      } catch (err) {
        if (requestId !== requestIdRef.current) return;
        setState((s) => ({
          ...s,
          status: 'error',
          errorMessage: err instanceof Error ? err.message : 'Something went wrong',
        }));
      }
    },
    [getFeed, search]
  );

  useEffect(() => {
    load({ page: 1, query: '', mode: 'initial' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const debouncedSearch = useRef(
    debounce((q: string) => {
      queryRef.current = q;
      load({ page: 1, query: q, mode: 'initial' });
    }, 400)
  ).current;

  const setSearchQuery = useCallback(
    (q: string) => {
      setState((s) => ({ ...s, searchQuery: q }));
      debouncedSearch(q);
    },
    [debouncedSearch]
  );

  const loadNextPage = useCallback(() => {
    if (state.status === 'loading' || state.status === 'loadingMore' || !state.hasMore) return;
    load({ page: pageRef.current + 1, query: queryRef.current, mode: 'loadingMore' });
  }, [load, state.status, state.hasMore]);

  const refresh = useCallback(() => {
    load({ page: 1, query: queryRef.current, mode: 'refreshing' });
  }, [load]);

  const toggleFavorite = useCallback(
    async (id: string) => {
      const isFav = await toggleFavoriteUseCase.execute(id);
      setState((s) => ({
        ...s,
        images: s.images.map((img) => (img.id === id ? { ...img, isFavorite: isFav } : img)),
      }));
    },
    [toggleFavoriteUseCase]
  );

  return { ...state, loadNextPage, refresh, setSearchQuery, toggleFavorite };
}
