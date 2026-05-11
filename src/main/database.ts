import Database from 'better-sqlite3';
import { app } from 'electron';
import path from 'path';

// This saves the database in the user's AppData folder so it doesn't get deleted when updating the app
const dbPath = path.join(app.getPath('userData'), 'tierforge.db');
const db = new Database(dbPath);

export function initDB() {
  // Create the table if it doesn't exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS games (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      image_url TEXT,
      tier TEXT DEFAULT 'unranked',
      notes TEXT DEFAULT '',
      status TEXT DEFAULT 'Backlog',
      executable_path TEXT DEFAULT '',
      playtime_minutes INTEGER DEFAULT 0
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS rankings_cache (
      category_id TEXT PRIMARY KEY,
      games_json TEXT NOT NULL,
      last_updated INTEGER NOT NULL
    );
  `);
  
  // Safe migrations for existing databases
  try {
    db.exec("ALTER TABLE games ADD COLUMN notes TEXT DEFAULT ''");
  } catch (e) { /* Column might already exist */ }
  
  try {
    db.exec("ALTER TABLE games ADD COLUMN status TEXT DEFAULT 'Backlog'");
  } catch (e) { /* Column might already exist */ }
  
  try {
    db.exec("ALTER TABLE games ADD COLUMN executable_path TEXT DEFAULT ''");
  } catch (e) { /* Column might already exist */ }
  
  try {
    db.exec("ALTER TABLE games ADD COLUMN playtime_minutes INTEGER DEFAULT 0");
  } catch (e) { /* Column might already exist */ }
  
  // One-time cache clear for Discover category overhaul
  try {
    db.prepare('DELETE FROM rankings_cache WHERE category_id IN ("discover_trending", "discover_masterpieces", "highly_rated")').run();
    db.exec("DELETE FROM rankings_cache"); // Wipe cache to fix hallucinated Steam Tag IDs and IMDb removal
  } catch (e) { /* Table might not exist yet */ }
  
  console.log('Database initialized at:', dbPath);
}

// Function to get all games
export function getAllGames() {
  const stmt = db.prepare('SELECT * FROM games');
  return stmt.all();
}

// Function to add a game
export function addGame(id: string, title: string, imageUrl: string, executablePath: string = '') {
  const checkStmt = db.prepare('SELECT id FROM games WHERE id = ?');
  const exists = checkStmt.get(id);

  if (exists) {
    if (executablePath) {
      const updateStmt = db.prepare('UPDATE games SET executable_path = ? WHERE id = ?');
      updateStmt.run(executablePath, id);
    }
  } else {
    const stmt = db.prepare('INSERT INTO games (id, title, image_url, tier, executable_path) VALUES (?, ?, ?, ?, ?)');
    stmt.run(id, title, imageUrl, 'unranked', executablePath);
  }
}

// Function to update a game's tier (when you drag and drop)
export function updateGameTier(id: string, tier: string) {
  const stmt = db.prepare('UPDATE games SET tier = ? WHERE id = ?');
  stmt.run(tier, id);
}

// Function to delete a game
export function deleteGame(id: string) {
  const stmt = db.prepare('DELETE FROM games WHERE id = ?');
  stmt.run(id);
}

// Function to update notes and status
export function updateGameData(id: string, notes: string, status: string) {
  const stmt = db.prepare('UPDATE games SET notes = ?, status = ? WHERE id = ?');
  stmt.run(notes, status, id);
}

// Settings functions
export function getSetting(key: string) {
  const stmt = db.prepare('SELECT value FROM settings WHERE key = ?');
  const result = stmt.get(key) as any;
  return result ? result.value : null;
}

export function saveSetting(key: string, value: string) {
  const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
  stmt.run(key, value);
}

export function addPlaytime(id: string, minutes: number) {
  const stmt = db.prepare('UPDATE games SET playtime_minutes = playtime_minutes + ? WHERE id = ?');
  stmt.run(minutes, id);
}

export function getPlaytime(id: string): number {
  const stmt = db.prepare('SELECT playtime_minutes FROM games WHERE id = ?');
  const result = stmt.get(id) as any;
  return result ? (result.playtime_minutes || 0) : 0;
}

// Rankings Cache Functions
export function getCachedRanking(categoryId: string) {
  const stmt = db.prepare('SELECT * FROM rankings_cache WHERE category_id = ?');
  return stmt.get(categoryId) as any;
}

export function updateRankingsCache(categoryId: string, gamesJson: string) {
  const stmt = db.prepare('INSERT OR REPLACE INTO rankings_cache (category_id, games_json, last_updated) VALUES (?, ?, ?)');
  stmt.run(categoryId, gamesJson, Date.now());
}

export function syncSteamGame(id: string, title: string, imageUrl: string, playtimeMinutes: number) {
  const stmt = db.prepare(`
    INSERT INTO games (id, title, image_url, tier, status, playtime_minutes) 
    VALUES (?, ?, ?, 'unranked', 'Backlog', ?)
    ON CONFLICT(id) DO UPDATE SET 
    playtime_minutes = MAX(playtime_minutes, excluded.playtime_minutes),
    image_url = excluded.image_url
  `);
  stmt.run(id, title, imageUrl, playtimeMinutes);
}

export function clearRankingsCache(categoryId: string) {
  const stmt = db.prepare('DELETE FROM rankings_cache WHERE category_id = ?');
  stmt.run(categoryId);
}