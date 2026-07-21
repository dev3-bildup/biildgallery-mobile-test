import * as SQLite from 'expo-sqlite';
import { GalleryImage } from '../../models/GalleryImage';

const DB_NAME = 'bildgallery.db';

/**
 * Owns the SQLite connection and schema. All raw SQL lives here so the
 * repository layer above stays free of persistence details (Single
 * Responsibility / testable in isolation via the mock in __tests__/mocks).
 */
export class Database {
  private db: SQLite.SQLiteDatabase | null = null;

  async open(): Promise<void> {
    if (this.db) return;
    this.db = await SQLite.openDatabaseAsync(DB_NAME);
    await this.db.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS images (
        id TEXT PRIMARY KEY NOT NULL,
        description TEXT,
        thumbUrl TEXT,
        smallUrl TEXT,
        fullUrl TEXT,
        width INTEGER,
        height INTEGER,
        authorName TEXT,
        color TEXT,
        createdAt TEXT,
        isFavorite INTEGER DEFAULT 0,
        pendingSync INTEGER DEFAULT 0,
        pageOrder INTEGER,
        queryKey TEXT DEFAULT '__feed__'
      );
      CREATE INDEX IF NOT EXISTS idx_images_query ON images(queryKey, pageOrder);
      CREATE INDEX IF NOT EXISTS idx_images_favorite ON images(isFavorite);
    `);
  }

  private assertOpen(): SQLite.SQLiteDatabase {
    if (!this.db) throw new Error('Database not opened. Call open() first.');
    return this.db;
  }

  async upsertImages(images: GalleryImage[], queryKey: string, pageOffset: number): Promise<void> {
    const db = this.assertOpen();
    await db.withTransactionAsync(async () => {
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        await db.runAsync(
          `INSERT INTO images (id, description, thumbUrl, smallUrl, fullUrl, width, height, authorName, color, createdAt, isFavorite, pendingSync, pageOrder, queryKey)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET
             description=excluded.description, thumbUrl=excluded.thumbUrl, smallUrl=excluded.smallUrl,
             fullUrl=excluded.fullUrl, pageOrder=excluded.pageOrder, queryKey=excluded.queryKey`,
          [
            img.id,
            img.description,
            img.thumbUrl,
            img.smallUrl,
            img.fullUrl,
            img.width,
            img.height,
            img.authorName,
            img.color,
            img.createdAt,
            img.isFavorite ? 1 : 0,
            0,
            pageOffset + i,
            queryKey,
          ]
        );
      }
    });
  }

  async getImages(queryKey: string, limit: number, offset: number): Promise<GalleryImage[]> {
    const db = this.assertOpen();
    const rows = await db.getAllAsync<Record<string, unknown>>(
      `SELECT * FROM images WHERE queryKey = ? ORDER BY pageOrder ASC LIMIT ? OFFSET ?`,
      [queryKey, limit, offset]
    );
    return rows.map(rowToImage);
  }

  async setFavorite(id: string, isFavorite: boolean, pendingSync: boolean): Promise<void> {
    const db = this.assertOpen();
    await db.runAsync(`UPDATE images SET isFavorite = ?, pendingSync = ? WHERE id = ?`, [
      isFavorite ? 1 : 0,
      pendingSync ? 1 : 0,
      id,
    ]);
  }

  async getFavorites(): Promise<GalleryImage[]> {
    const db = this.assertOpen();
    const rows = await db.getAllAsync<Record<string, unknown>>(
      `SELECT * FROM images WHERE isFavorite = 1 ORDER BY createdAt DESC`
    );
    return rows.map(rowToImage);
  }

  async getPendingSyncFavorites(): Promise<GalleryImage[]> {
    const db = this.assertOpen();
    const rows = await db.getAllAsync<Record<string, unknown>>(
      `SELECT * FROM images WHERE pendingSync = 1`
    );
    return rows.map(rowToImage);
  }

  async clearPendingSync(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    const db = this.assertOpen();
    const placeholders = ids.map(() => '?').join(',');
    await db.runAsync(`UPDATE images SET pendingSync = 0 WHERE id IN (${placeholders})`, ids);
  }
}

function rowToImage(row: Record<string, unknown>): GalleryImage {
  return {
    id: row.id as string,
    description: row.description as string,
    thumbUrl: row.thumbUrl as string,
    smallUrl: row.smallUrl as string,
    fullUrl: row.fullUrl as string,
    width: Number(row.width),
    height: Number(row.height),
    authorName: row.authorName as string,
    color: (row.color as string) ?? null,
    createdAt: row.createdAt as string,
    isFavorite: Number(row.isFavorite) === 1,
    pendingSync: Number(row.pendingSync) === 1,
  };
}
