import Database from 'better-sqlite3'
import { app } from 'electron'
import path from 'path'

// This saves the database in the user's AppData folder so it doesn't get deleted when updating the app
const dbPath = path.join(app.getPath('userData'), 'tierforge.db')
export const db: any = new Database(dbPath)

export function getDbPath() {
  return dbPath
}

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
      playtime_minutes INTEGER DEFAULT 0,
      genres TEXT DEFAULT '',
      developers TEXT DEFAULT '',
      release_year TEXT DEFAULT '',
      custom_save_path TEXT DEFAULT '',
      last_played_at INTEGER DEFAULT 0,
      storyline TEXT DEFAULT ''
    );
  `)

  // Add custom_save_path column if it doesn't exist
  try {
    db.exec(`ALTER TABLE games ADD COLUMN custom_save_path TEXT DEFAULT '';`)
  } catch (e) {
    // Column already exists
  }

  // Add last_played_at column if it doesn't exist
  try {
    db.exec(`ALTER TABLE games ADD COLUMN last_played_at INTEGER DEFAULT 0;`)
  } catch (e) {
    // Column already exists
  }

  // Add storyline column if it doesn't exist
  try {
    db.exec(`ALTER TABLE games ADD COLUMN storyline TEXT DEFAULT '';`)
  } catch (e) {
    // Column already exists
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS rankings_cache (
      category_id TEXT PRIMARY KEY,
      games_json TEXT NOT NULL,
      last_updated INTEGER NOT NULL
    );
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS timeline_cache (
      franchise TEXT PRIMARY KEY,
      data_json TEXT NOT NULL
    );
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS genre_analytics (
      genre_id TEXT PRIMARY KEY,
      visit_count INTEGER DEFAULT 0,
      last_visited INTEGER
    );
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS discover_pool (
      genre_id TEXT,
      game_id TEXT,
      title TEXT,
      data_json TEXT,
      last_updated INTEGER,
      UNIQUE(genre_id, title)
    );
  `)

  // Safe migrations for existing databases
  try {
    db.exec("ALTER TABLE games ADD COLUMN notes TEXT DEFAULT ''")
  } catch (e) {
    /* Column might already exist */
  }

  try {
    db.exec("ALTER TABLE games ADD COLUMN status TEXT DEFAULT 'Backlog'")
  } catch (e) {
    /* Column might already exist */
  }

  try {
    db.exec("ALTER TABLE games ADD COLUMN executable_path TEXT DEFAULT ''")
  } catch (e) {
    /* Column might already exist */
  }

  try {
    db.exec('ALTER TABLE games ADD COLUMN playtime_minutes INTEGER DEFAULT 0')
  } catch (e) {
    /* Column might already exist */
  }

  try {
    db.exec("ALTER TABLE games ADD COLUMN genres TEXT DEFAULT ''")
  } catch (e) {
    /* Column might already exist */
  }

  try {
    db.exec("ALTER TABLE games ADD COLUMN developers TEXT DEFAULT ''")
  } catch (e) {
    /* Column might already exist */
  }

  try {
    db.exec("ALTER TABLE games ADD COLUMN release_year TEXT DEFAULT ''")
  } catch (e) {
    /* Column might already exist */
  }

  // One-time cache clear for Discover category overhaul
  try {
    db.prepare(
      'DELETE FROM rankings_cache WHERE category_id IN ("discover_trending", "discover_masterpieces", "highly_rated")'
    ).run()
    db.exec('DELETE FROM rankings_cache') // Wipe cache to fix hallucinated Steam Tag IDs and IMDb removal
  } catch (e) {
    /* Table might not exist yet */
  }

  console.log('Database initialized at:', dbPath)
}

// Function to get all games
export function getAllGames() {
  const stmt = db.prepare('SELECT * FROM games')
  return stmt.all()
}

// Function to add a game
export function addGame(
  id: string,
  title: string,
  imageUrl: string,
  executablePath: string = '',
  genres: string = '',
  developers: string = '',
  releaseYear: string = ''
) {
  const checkStmt = db.prepare('SELECT id FROM games WHERE id = ?')
  const exists = checkStmt.get(id)

  if (exists) {
    if (executablePath) {
      const updateStmt = db.prepare('UPDATE games SET executable_path = ? WHERE id = ?')
      updateStmt.run(executablePath, id)
    }
  } else {
    const stmt = db.prepare(
      'INSERT INTO games (id, title, image_url, tier, executable_path, genres, developers, release_year, storyline) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    )
    stmt.run(id, title, imageUrl, 'unranked', executablePath, genres, developers, releaseYear, '')
  }
}

// Function to update a game's tier (when you drag and drop)
export function updateGameTier(id: string, tier: string) {
  const stmt = db.prepare('UPDATE games SET tier = ? WHERE id = ?')
  stmt.run(tier, id)
}

// Function to delete a game
export function deleteGame(id: string) {
  const stmt = db.prepare('DELETE FROM games WHERE id = ?')
  stmt.run(id)
}

// Function to update notes and status
export function updateGameData(id: string, notes: string, status: string) {
  const stmt = db.prepare('UPDATE games SET notes = ?, status = ? WHERE id = ?')
  stmt.run(notes, status, id)
}

export function updateGameMetadata(
  id: string,
  genres: string,
  developers: string,
  releaseYear: string
) {
  const stmt = db.prepare(
    'UPDATE games SET genres = ?, developers = ?, release_year = ? WHERE id = ?'
  )
  stmt.run(genres, developers, releaseYear, id)
}

// Settings functions
export function getSetting(key: string) {
  const stmt = db.prepare('SELECT value FROM settings WHERE key = ?')
  const result = stmt.get(key) as any
  return result ? result.value : null
}

export function saveSetting(key: string, value: string) {
  const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)')
  stmt.run(key, value)
}

export function addPlaytime(id: string, minutes: number) {
  const stmt = db.prepare('UPDATE games SET playtime_minutes = playtime_minutes + ? WHERE id = ?')
  stmt.run(minutes, id)
}

export function getPlaytime(id: string): number {
  const stmt = db.prepare('SELECT playtime_minutes FROM games WHERE id = ?')
  const result = stmt.get(id) as any
  return result ? result.playtime_minutes || 0 : 0
}

// Rankings Cache Functions
export function getCachedRanking(categoryId: string) {
  const stmt = db.prepare('SELECT * FROM rankings_cache WHERE category_id = ?')
  const result = stmt.get(categoryId) as any
  if (result && result.last_updated) {
    const FIFTEEN_DAYS_MS = 15 * 24 * 60 * 60 * 1000
    if (Date.now() - result.last_updated > FIFTEEN_DAYS_MS) {
      return null // TTL Expired
    }
  }
  return result
}

export function updateRankingsCache(categoryId: string, gamesJson: string) {
  const stmt = db.prepare(
    'INSERT OR REPLACE INTO rankings_cache (category_id, games_json, last_updated) VALUES (?, ?, ?)'
  )
  stmt.run(categoryId, gamesJson, Date.now())
}

export function getCachedTimeline(franchise: string) {
  const stmt = db.prepare('SELECT data_json FROM timeline_cache WHERE franchise = ?')
  const result = stmt.get(franchise) as any
  return result ? JSON.parse(result.data_json) : null
}

export function checkCachedTimelineForGame(gameId: string, gameTitle: string) {
  const stmt = db.prepare('SELECT data_json FROM timeline_cache')
  const results = stmt.all() as any[]
  for (const row of results) {
    if (!row.data_json) continue
    try {
      const timeline = JSON.parse(row.data_json)
      const exists = timeline.some(
        (game: any) =>
          (game.id && game.id.toString() === gameId.toString()) ||
          (game.title && game.title.toLowerCase() === gameTitle.toLowerCase())
      )
      if (exists) {
        return timeline.map((game: any) => ({
          ...game,
          isCurrent:
            (game.id && game.id.toString() === gameId.toString()) ||
            (game.title && game.title.toLowerCase() === gameTitle.toLowerCase())
        }))
      }
    } catch (e) {
      continue
    }
  }
  return null
}

export function trackGenreVisit(genreId: string) {
  const stmt = db.prepare(`
    INSERT INTO genre_analytics (genre_id, visit_count, last_visited)
    VALUES (?, 1, ?)
    ON CONFLICT(genre_id) DO UPDATE SET
      visit_count = visit_count + 1,
      last_visited = excluded.last_visited
  `)
  stmt.run(genreId, Date.now())
}

export function getTopGenres(limit: number = 3) {
  const stmt = db.prepare('SELECT genre_id FROM genre_analytics ORDER BY visit_count DESC LIMIT ?')
  const results = stmt.all(limit) as any[]
  return results.map(r => r.genre_id)
}

export function getDiscoverPool(genreId: string) {
  const stmt = db.prepare('SELECT * FROM discover_pool WHERE genre_id = ?')
  return stmt.all(genreId) as any[]
}

export function insertDiscoverPoolBatch(genreId: string, games: any[]) {
  const stmt = db.prepare(
    'INSERT OR IGNORE INTO discover_pool (genre_id, game_id, title, data_json, last_updated) VALUES (?, ?, ?, ?, ?)'
  )
  const now = Date.now()
  const transaction = db.transaction((games) => {
    for (const game of games) {
      stmt.run(genreId, game.id?.toString() || '', game.title || '', JSON.stringify(game), now)
    }
  })
  transaction(games)
}

export function clearDiscoverPool(genreId: string) {
  const stmt = db.prepare('DELETE FROM discover_pool WHERE genre_id = ?')
  stmt.run(genreId)
}

export function saveCachedTimeline(franchise: string, data: any) {
  const stmt = db.prepare(
    'INSERT OR REPLACE INTO timeline_cache (franchise, data_json) VALUES (?, ?)'
  )
  stmt.run(franchise, JSON.stringify(data))
}

export function syncSteamGame(
  id: string,
  title: string,
  imageUrl: string,
  playtimeMinutes: number
) {
  const stmt = db.prepare(`
    INSERT INTO games (id, title, image_url, tier, status, playtime_minutes) 
    VALUES (?, ?, ?, 'unranked', 'Backlog', ?)
    ON CONFLICT(id) DO UPDATE SET 
    playtime_minutes = MAX(playtime_minutes, excluded.playtime_minutes),
    image_url = excluded.image_url
  `)
  stmt.run(id, title, imageUrl, playtimeMinutes)
}

export function clearRankingsCache(categoryId: string) {
  const stmt = db.prepare('DELETE FROM rankings_cache WHERE category_id = ?')
  stmt.run(categoryId)
}
