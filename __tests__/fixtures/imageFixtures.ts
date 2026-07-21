import { GalleryImage } from '../../src/models/GalleryImage';

export function makeImage(overrides: Partial<GalleryImage> = {}): GalleryImage {
  return {
    id: 'img-1',
    description: 'A mountain landscape',
    thumbUrl: 'https://example.com/thumb.jpg',
    smallUrl: 'https://example.com/small.jpg',
    fullUrl: 'https://example.com/full.jpg',
    width: 1200,
    height: 800,
    authorName: 'Jane Doe',
    color: '#336699',
    createdAt: '2026-01-01T00:00:00Z',
    isFavorite: false,
    ...overrides,
  };
}

export function makeImages(count: number, prefix = 'img'): GalleryImage[] {
  return Array.from({ length: count }, (_, i) => makeImage({ id: `${prefix}-${i}` }));
}
