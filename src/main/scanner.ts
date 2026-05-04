import fs from 'fs';
import path from 'path';

// Common filters to ignore steam tools and redistributed packages
const IGNORE_KEYWORDS = [
  'Steamworks', 'Proton', 'Redistributable', 'SteamVR', 'Server', 'Dedicated',
  'Tools', 'Linux Runtime', 'Steam Client', 'AntiCheat', 'BattlEye', 'EasyAntiCheat'
];

const STEAM_PATH = 'C:\\Program Files (x86)\\Steam\\steamapps';

const COMMON_GAME_DIRS = [
  'C:\\Games',
  'D:\\Games',
  'E:\\Games',
  'C:\\Program Files\\Epic Games',
  'C:\\Program Files\\EA Games',
  'C:\\XboxGames',
  'C:\\Program Files (x86)\\GOG Galaxy\\Games'
];

export function scanLocalGames(): string[] {
  const games: Set<string> = new Set(); // Use a Set to avoid duplicates

  // 1. Scan Steam
  if (fs.existsSync(STEAM_PATH)) {
    try {
      const files = fs.readdirSync(STEAM_PATH);
      for (const file of files) {
        if (file.startsWith('appmanifest_') && file.endsWith('.acf')) {
          const filePath = path.join(STEAM_PATH, file);
          const content = fs.readFileSync(filePath, 'utf-8');
          
          // Match the "name" field
          const match = content.match(/"name"\s+"([^"]+)"/);
          if (match && match[1]) {
            const gameName = match[1];
            
            // Filter out tools
            const isTool = IGNORE_KEYWORDS.some(keyword => gameName.includes(keyword));
            if (!isTool) {
              games.add(gameName);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error scanning Steam directory:', error);
    }
  } else {
    console.warn(`Steam path not found at: ${STEAM_PATH}`);
  }

  // 2. Scan other common directories
  for (const dir of COMMON_GAME_DIRS) {
    if (fs.existsSync(dir)) {
      try {
        const items = fs.readdirSync(dir, { withFileTypes: true });
        for (const item of items) {
          if (item.isDirectory()) {
            const gameName = item.name;
            // Ignore hidden folders or obvious non-games
            if (!gameName.startsWith('.') && !IGNORE_KEYWORDS.some(k => gameName.includes(k))) {
              games.add(gameName);
            }
          }
        }
      } catch (error) {
        console.error(`Error scanning directory ${dir}:`, error);
      }
    }
  }

  return Array.from(games);
}
