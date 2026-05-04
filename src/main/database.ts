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
      status TEXT DEFAULT 'Backlog'
    );
  `);
  
  // Safe migrations for existing databases
  try {
    db.exec("ALTER TABLE games ADD COLUMN notes TEXT DEFAULT ''");
  } catch (e) { /* Column might already exist */ }
  
  try {
    db.exec("ALTER TABLE games ADD COLUMN status TEXT DEFAULT 'Backlog'");
  } catch (e) { /* Column might already exist */ }
  
  console.log('Database initialized at:', dbPath);
}

// Function to get all games
export function getAllGames() {
  const stmt = db.prepare('SELECT * FROM games');
  return stmt.all();
}

// Function to add a game
export function addGame(id: string, title: string, imageUrl: string) {
  const stmt = db.prepare('INSERT OR IGNORE INTO games (id, title, image_url, tier) VALUES (?, ?, ?, ?)');
  stmt.run(id, title, imageUrl, 'unranked');
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