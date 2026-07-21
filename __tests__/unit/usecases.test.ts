import { GetImageFeedUseCase } from '../../src/domain/usecases/GetImageFeedUseCase';
import { SearchImagesUseCase } from '../../src/domain/usecases/SearchImagesUseCase';
import { ToggleFavoriteUseCase } from '../../src/domain/usecases/ToggleFavoriteUseCase';
import { ImageRepository } from '../../src/data/repositories/ImageRepository';

function makeFakeRepo(): jest.Mocked<ImageRepository> {
  return {
    getFeed: jest.fn(),
    search: jest.fn(),
    toggleFavorite: jest.fn(),
    getFavorites: jest.fn(),
    syncPendingFavorites: jest.fn(),
  };
}

describe('GetImageFeedUseCase', () => {
  it('delegates to repository.getFeed', async () => {
    const repo = makeFakeRepo();
    repo.getFeed.mockResolvedValue({ items: [], page: 1, hasMore: false });
    const useCase = new GetImageFeedUseCase(repo);

    await useCase.execute(1, 20);

    expect(repo.getFeed).toHaveBeenCalledWith(1, 20);
  });

  it('rejects invalid page numbers', () => {
    const useCase = new GetImageFeedUseCase(makeFakeRepo());
    expect(() => useCase.execute(0)).toThrow('page must be >= 1');
  });
});

describe('SearchImagesUseCase', () => {
  it('returns an empty page without hitting the repository for blank queries', async () => {
    const repo = makeFakeRepo();
    const useCase = new SearchImagesUseCase(repo);

    const result = await useCase.execute('   ', 1, 20);

    expect(repo.search).not.toHaveBeenCalled();
    expect(result).toEqual({ items: [], page: 1, hasMore: false });
  });

  it('trims the query before delegating to the repository', async () => {
    const repo = makeFakeRepo();
    repo.search.mockResolvedValue({ items: [], page: 1, hasMore: false });
    const useCase = new SearchImagesUseCase(repo);

    await useCase.execute('  cats  ', 1, 20);

    expect(repo.search).toHaveBeenCalledWith('cats', 1, 20);
  });
});

describe('ToggleFavoriteUseCase', () => {
  it('throws for an empty imageId', () => {
    const useCase = new ToggleFavoriteUseCase(makeFakeRepo());
    expect(() => useCase.execute('')).toThrow('imageId is required');
  });

  it('delegates to repository.toggleFavorite', async () => {
    const repo = makeFakeRepo();
    repo.toggleFavorite.mockResolvedValue(true);
    const useCase = new ToggleFavoriteUseCase(repo);

    const result = await useCase.execute('img-1');

    expect(result).toBe(true);
    expect(repo.toggleFavorite).toHaveBeenCalledWith('img-1');
  });
});
