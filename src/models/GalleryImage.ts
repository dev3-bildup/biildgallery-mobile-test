/**
 * Core domain entity. Deliberately decoupled from the Unsplash API's DTO shape
 * so the rest of the app never depends on a specific vendor's response format.
 */
export interface GalleryImage {
  id: string;
  description: string;
  thumbUrl: string;
  smallUrl: string;
  fullUrl: string;
  width: number;
  height: number;
  authorName: string;
  color: string | null;
  createdAt: string;
  isFavorite: boolean;
  /** Local-only field: true if this row only exists in cache (pending sync) */
  pendingSync?: boolean;
}

export interface Page<T> {
  items: T[];
  page: number;
  hasMore: boolean;
}
