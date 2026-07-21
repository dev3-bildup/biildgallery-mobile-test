import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useGalleryViewModel } from '../../src/presentation/viewmodels/useGalleryViewModel';
import { GetImageFeedUseCase } from '../../src/domain/usecases/GetImageFeedUseCase';
import { SearchImagesUseCase } from '../../src/domain/usecases/SearchImagesUseCase';
import { ToggleFavoriteUseCase } from '../../src/domain/usecases/ToggleFavoriteUseCase';
import { makeImages } from '../fixtures/imageFixtures';

function makeUseCases() {
  const getFeed = { execute: jest.fn() } as unknown as jest.Mocked<GetImageFeedUseCase>;
  const search = { execute: jest.fn() } as unknown as jest.Mocked<SearchImagesUseCase>;
  const toggleFavorite = { execute: jest.fn() } as unknown as jest.Mocked<ToggleFavoriteUseCase>;
  return { getFeed, search, toggleFavorite };
}

describe('useGalleryViewModel', () => {
  it('loads the first page on mount', async () => {
    const { getFeed, search, toggleFavorite } = makeUseCases();
    const images = makeImages(20);
    getFeed.execute.mockResolvedValue({ items: images, page: 1, hasMore: true });

    const { result } = renderHook(() => useGalleryViewModel(getFeed, search, toggleFavorite));

    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.images).toHaveLength(20);
    expect(getFeed.execute).toHaveBeenCalledWith(1, 20);
  });

  it('appends results on loadNextPage', async () => {
    const { getFeed, search, toggleFavorite } = makeUseCases();
    getFeed.execute
      .mockResolvedValueOnce({ items: makeImages(20, 'p1'), page: 1, hasMore: true })
      .mockResolvedValueOnce({ items: makeImages(20, 'p2'), page: 2, hasMore: false });

    const { result } = renderHook(() => useGalleryViewModel(getFeed, search, toggleFavorite));
    await waitFor(() => expect(result.current.status).toBe('ready'));

    act(() => result.current.loadNextPage());

    await waitFor(() => expect(result.current.images).toHaveLength(40));
    expect(result.current.hasMore).toBe(false);
  });

  it('sets an error state without clearing existing images when a later page fails', async () => {
    const { getFeed, search, toggleFavorite } = makeUseCases();
    getFeed.execute
      .mockResolvedValueOnce({ items: makeImages(20), page: 1, hasMore: true })
      .mockRejectedValueOnce(new Error('network down'));

    const { result } = renderHook(() => useGalleryViewModel(getFeed, search, toggleFavorite));
    await waitFor(() => expect(result.current.status).toBe('ready'));

    act(() => result.current.loadNextPage());

    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.images).toHaveLength(20); // previous page preserved
    expect(result.current.errorMessage).toBe('network down');
  });

  it('toggleFavorite updates only the affected image', async () => {
    const { getFeed, search, toggleFavorite } = makeUseCases();
    const images = makeImages(2);
    getFeed.execute.mockResolvedValue({ items: images, page: 1, hasMore: false });
    toggleFavorite.execute.mockResolvedValue(true);

    const { result } = renderHook(() => useGalleryViewModel(getFeed, search, toggleFavorite));
    await waitFor(() => expect(result.current.status).toBe('ready'));

    await act(async () => {
      await result.current.toggleFavorite('img-0');
    });

    expect(result.current.images.find((i) => i.id === 'img-0')?.isFavorite).toBe(true);
    expect(result.current.images.find((i) => i.id === 'img-1')?.isFavorite).toBe(false);
  });
});
