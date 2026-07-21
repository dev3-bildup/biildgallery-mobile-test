/**
 * Minimal in-memory stand-in for expo-sqlite's async API, used only in
 * Jest (native module isn't available in the test environment). Mirrors
 * just enough surface area (execAsync/runAsync/getAllAsync/withTransactionAsync)
 * for Database.ts to operate against a real in-memory "table".
 */
class FakeStatement {
  constructor(store) {
    this.store = store;
  }
}

function matchesWhere(row, sql, params) {
  // Extremely small SQL "interpreter" tailored to the queries Database.ts issues.
  if (sql.includes('WHERE queryKey = ?')) {
    return row.queryKey === params[0];
  }
  if (sql.includes('WHERE isFavorite = 1')) {
    return row.isFavorite === 1;
  }
  if (sql.includes('WHERE pendingSync = 1')) {
    return row.pendingSync === 1;
  }
  return true;
}

class FakeDb {
  constructor() {
    this.rows = new Map();
  }

  async execAsync() {
    return undefined;
  }

  async withTransactionAsync(cb) {
    await cb();
  }

  async runAsync(sql, params) {
    if (sql.startsWith('INSERT INTO images')) {
      const [
        id, description, thumbUrl, smallUrl, fullUrl, width, height,
        authorName, color, createdAt, isFavorite, pendingSync, pageOrder, queryKey,
      ] = params;
      this.rows.set(id, {
        id, description, thumbUrl, smallUrl, fullUrl, width, height,
        authorName, color, createdAt, isFavorite, pendingSync, pageOrder, queryKey,
      });
      return { changes: 1 };
    }
    if (sql.startsWith('UPDATE images SET isFavorite')) {
      const [isFavorite, pendingSync, id] = params;
      const row = this.rows.get(id);
      if (row) {
        row.isFavorite = isFavorite;
        row.pendingSync = pendingSync;
      }
      return { changes: row ? 1 : 0 };
    }
    if (sql.startsWith('UPDATE images SET pendingSync = 0')) {
      for (const id of params) {
        const row = this.rows.get(id);
        if (row) row.pendingSync = 0;
      }
      return { changes: params.length };
    }
    return { changes: 0 };
  }

  async getAllAsync(sql, params) {
    let rows = Array.from(this.rows.values()).filter((r) => matchesWhere(r, sql, params));
    if (sql.includes('ORDER BY pageOrder ASC')) {
      rows = rows.sort((a, b) => a.pageOrder - b.pageOrder);
      const limit = params[params.length - 2];
      const offset = params[params.length - 1];
      rows = rows.slice(offset, offset + limit);
    }
    if (sql.includes('ORDER BY createdAt DESC')) {
      rows = rows.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    }
    return rows;
  }
}

module.exports = {
  openDatabaseAsync: async () => new FakeDb(),
};
