import Database from 'better-sqlite3';
import path from 'path';
import type { Prospect, ProspectInput, ProspectStatus, DashboardStats } from './types';

const DB_PATH = path.join(process.cwd(), 'helpme.db');

let db: Database.Database | null = null;

function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    initDb(db);
  }
  return db;
}

function initDb(database: Database.Database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS prospects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      company TEXT NOT NULL DEFAULT '',
      type TEXT NOT NULL DEFAULT 'commerçant',
      email TEXT NOT NULL DEFAULT '',
      phone TEXT NOT NULL DEFAULT '',
      city TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'À contacter',
      notes TEXT NOT NULL DEFAULT '',
      follow_up_date TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
}

export function getAllProspects(): Prospect[] {
  const database = getDb();
  return database.prepare('SELECT * FROM prospects ORDER BY updated_at DESC').all() as Prospect[];
}

export function getProspectById(id: number): Prospect | null {
  const database = getDb();
  return database.prepare('SELECT * FROM prospects WHERE id = ?').get(id) as Prospect | null;
}

export function createProspect(input: ProspectInput): Prospect {
  const database = getDb();
  const stmt = database.prepare(`
    INSERT INTO prospects (name, company, type, email, phone, city, status, notes, follow_up_date)
    VALUES (@name, @company, @type, @email, @phone, @city, @status, @notes, @follow_up_date)
  `);
  const result = stmt.run({
    name: input.name,
    company: input.company || '',
    type: input.type || 'commerçant',
    email: input.email || '',
    phone: input.phone || '',
    city: input.city || '',
    status: input.status || 'À contacter',
    notes: input.notes || '',
    follow_up_date: input.follow_up_date || null,
  });
  return getProspectById(result.lastInsertRowid as number)!;
}

export function updateProspect(id: number, input: Partial<ProspectInput & { status: ProspectStatus }>): Prospect | null {
  const database = getDb();
  const existing = getProspectById(id);
  if (!existing) return null;

  const updated = { ...existing, ...input };
  database.prepare(`
    UPDATE prospects
    SET name = @name, company = @company, type = @type, email = @email,
        phone = @phone, city = @city, status = @status, notes = @notes,
        follow_up_date = @follow_up_date, updated_at = datetime('now')
    WHERE id = @id
  `).run({
    id,
    name: updated.name,
    company: updated.company,
    type: updated.type,
    email: updated.email,
    phone: updated.phone,
    city: updated.city,
    status: updated.status,
    notes: updated.notes,
    follow_up_date: updated.follow_up_date,
  });
  return getProspectById(id);
}

export function deleteProspect(id: number): boolean {
  const database = getDb();
  const result = database.prepare('DELETE FROM prospects WHERE id = ?').run(id);
  return result.changes > 0;
}

export function importProspects(prospects: ProspectInput[]): { inserted: number; errors: string[] } {
  const database = getDb();
  const stmt = database.prepare(`
    INSERT INTO prospects (name, company, type, email, phone, city, status, notes, follow_up_date)
    VALUES (@name, @company, @type, @email, @phone, @city, @status, @notes, @follow_up_date)
  `);

  let inserted = 0;
  const errors: string[] = [];

  const insertMany = database.transaction((rows: ProspectInput[]) => {
    for (const row of rows) {
      try {
        stmt.run({
          name: row.name || 'Inconnu',
          company: row.company || '',
          type: row.type || 'commerçant',
          email: row.email || '',
          phone: row.phone || '',
          city: row.city || '',
          status: row.status || 'À contacter',
          notes: row.notes || '',
          follow_up_date: row.follow_up_date || null,
        });
        inserted++;
      } catch (e) {
        errors.push(`Erreur pour ${row.name}: ${e}`);
      }
    }
  });

  insertMany(prospects);
  return { inserted, errors };
}

export function getDashboardStats(): DashboardStats {
  const database = getDb();

  const total = (database.prepare('SELECT COUNT(*) as count FROM prospects').get() as { count: number }).count;

  const statusRows = database.prepare(
    'SELECT status, COUNT(*) as count FROM prospects GROUP BY status'
  ).all() as { status: string; count: number }[];

  const typeRows = database.prepare(
    'SELECT type, COUNT(*) as count FROM prospects GROUP BY type'
  ).all() as { type: string; count: number }[];

  const cityRows = database.prepare(
    'SELECT city, COUNT(*) as count FROM prospects WHERE city != "" GROUP BY city ORDER BY count DESC LIMIT 5'
  ).all() as { city: string; count: number }[];

  const clients = (database.prepare(
    "SELECT COUNT(*) as count FROM prospects WHERE status = 'Client'"
  ).get() as { count: number }).count;

  const byStatus: Record<string, number> = {
    'À contacter': 0, 'Contacté': 0, 'Intéressé': 0, 'Client': 0, 'Perdu': 0
  };
  for (const row of statusRows) byStatus[row.status] = row.count;

  const byType: Record<string, number> = { producteur: 0, 'commerçant': 0 };
  for (const row of typeRows) byType[row.type] = row.count;

  return {
    total,
    byStatus: byStatus as DashboardStats['byStatus'],
    byType: byType as DashboardStats['byType'],
    conversionRate: total > 0 ? Math.round((clients / total) * 100) : 0,
    topCities: cityRows,
  };
}
