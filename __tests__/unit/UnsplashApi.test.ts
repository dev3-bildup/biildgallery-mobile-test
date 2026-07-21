import { UnsplashApi } from '../../src/api/UnsplashApi';
import { ApiClient } from '../../src/api/ApiClient';

jest.mock('../../src/api/ApiClient');

describe('UnsplashApi', () => {
  let client: jest.Mocked<ApiClient>;
  let api: UnsplashApi;

  beforeEach(() => {
    client = new ApiClient('base', 'key') as jest.Mocked<ApiClient>;
    api = new UnsplashApi(client);
  });

  it('maps feed DTOs to domain GalleryImage objects', async () => {
    client.get = jest.fn().mockResolvedValue([
      {
        id: 'abc',
        description: null,
        alt_description: 'a cat',
        width: 100,
        height: 200,
        color: '#fff',
        created_at: '2026-01-01',
        urls: { thumb: 't', small: 's', full: 'f', regular: 'r' },
        user: { name: 'Alice' },
      },
    ]);

    const result = await api.fetchPhotos(1, 20);

    expect(result.items).toEqual([
      {
        id: 'abc',
        description: 'a cat',
        thumbUrl: 't',
        smallUrl: 's',
        fullUrl: 'r',
        width: 100,
        height: 200,
        authorName: 'Alice',
        color: '#fff',
        createdAt: '2026-01-01',
        isFavorite: false,
      },
    ]);
    expect(client.get).toHaveBeenCalledWith('/photos', { page: 1, per_page: 20 });
  });

  it('sets hasMore=false when fewer results than perPage are returned', async () => {
    client.get = jest.fn().mockResolvedValue([]);
    const result = await api.fetchPhotos(3, 20);
    expect(result.hasMore).toBe(false);
    expect(result.page).toBe(3);
  });

  it('maps search results using total_pages for hasMore', async () => {
    client.get = jest.fn().mockResolvedValue({
      results: [],
      total_pages: 5,
    });
    const result = await api.searchPhotos('cats', 2, 20);
    expect(result.hasMore).toBe(true);

    client.get = jest.fn().mockResolvedValue({ results: [], total_pages: 2 });
    const last = await api.searchPhotos('cats', 2, 20);
    expect(last.hasMore).toBe(false);
  });
});
