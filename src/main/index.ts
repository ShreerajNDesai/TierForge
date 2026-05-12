import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join, basename } from 'path'
import { exec } from 'child_process'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { initDB, getAllGames, addGame, updateGameTier, deleteGame, updateGameData, getSetting, saveSetting, addPlaytime, getPlaytime, clearRankingsCache } from './database'
import { scanLocalGames } from './scanner'
import { 
  searchGames, 
  getGameExtendedDetails, 
  getHowLongToBeat, 
  getDiscoverGames,
  analyzeLibraryImage, 
  bulkImportGames, 
  getAIRecommendations, 
  getGameDeals, 
  getGlobalRankings, 
  getScrapedRankings, 
  getCachedRankings,
  getSmartAIPlayOrder,
  syncSteamLibrary,
  getSteamAppDetails,
  getDisplaySteamTags,
  generateGamerProfile,
  backfillMissingMetadata
} from './api'

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    frame: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.maximize()
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  initDB();

  // --- IPC LISTENERS (The Backend receiving messages) ---
  
  // 1. Search RAWG API
  ipcMain.handle('search-games', async (_, query) => {
    return await searchGames(query);
  });

  // 2. Get all games from Database
  ipcMain.handle('get-all-games', () => {
    return getAllGames();
  });

  // 3. Add a game to Database
  ipcMain.handle('add-game', (_, id, title, imageUrl) => {
    addGame(id, title, imageUrl);
    return true;
  });

  // 4. Update a game's tier (Drag & Drop)
  ipcMain.handle('update-game-tier', (_, id, tier) => {
    updateGameTier(id, tier);
    return true;
  });

  // 5. Delete a game
  ipcMain.handle('delete-game', (_, id) => {
    deleteGame(id);
    return true;
  });

  // 6. Get extended details
  ipcMain.handle('get-extended-details', async (_, id) => {
    return await getGameExtendedDetails(id);
  });

  // 7. Update game data
  ipcMain.handle('update-game-data', (_, id, notes, status) => {
    updateGameData(id, notes, status);
    return true;
  });

  ipcMain.handle('get-time-to-beat', (_, name) => {
    return getHowLongToBeat(name);
  });

  ipcMain.handle('get-discover-games', async (_, filterType, offset) => {
    const localIds = getAllGames().map((g: any) => g.id);
    return await getDiscoverGames(localIds, filterType, offset);
  });

  // 8. Scan PC for Steam Games
  ipcMain.handle('scan-pc', async () => {
    const games = scanLocalGames();
    console.log(`Found ${games.length} games locally.`);
    
    for (const game of games) {
      try {
        console.log(`Searching IGDB for: ${game.name}`);
        const results = await searchGames(game.name);
        if (results && results.length > 0) {
          // Prefer an exact match if available, otherwise fallback to the first result
          let bestHit = results[0];
          const exactMatch = results.find(
            (r: any) => r.title.toLowerCase() === game.name.toLowerCase()
          );
          
          if (exactMatch) {
            bestHit = exactMatch;
          }
          
          addGame(bestHit.id, bestHit.title, bestHit.image_url, game.path);
        }
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (err) {
        console.error(`Failed to process scanned game ${game.name}:`, err);
      }
    }
    return true;
  });

  // Game launcher with automatic playtime tracking
  ipcMain.handle('launch-game', async (_, exePath: string, gameId: string) => {
    const win = BrowserWindow.getFocusedWindow()
    const exeName = basename(exePath)

    // Launch the game
    exec(`"${exePath}"`, (err) => {
      if (err) console.error('Launch error:', err)
    })

    const startTime = Date.now()

    // Notify frontend: game started
    if (win) win.webContents.send('game-started', gameId)

    // Poll for process termination every 3 seconds
    const pollInterval = setInterval(() => {
      exec(`tasklist /FI "IMAGENAME eq ${exeName}" /NH`, (err, stdout) => {
        if (err || !stdout.toLowerCase().includes(exeName.toLowerCase())) {
          clearInterval(pollInterval)

          const elapsedMs = Date.now() - startTime
          const elapsedMinutes = Math.max(1, Math.round(elapsedMs / 60000))

          addPlaytime(gameId, elapsedMinutes)

          const totalPlaytime = getPlaytime(gameId)

          // Notify frontend: game stopped
          if (win) win.webContents.send('game-stopped', gameId, totalPlaytime)
        }
      })
    }, 3000)

    return true
  })

  ipcMain.handle('get-playtime', (_, gameId: string) => {
    return getPlaytime(gameId)
  })

  ipcMain.handle('get-setting', (_, key) => {
    return getSetting(key);
  });

  ipcMain.handle('save-setting', (_, key, value) => {
    saveSetting(key, value);
    return true;
  });

  ipcMain.handle('browse-image', async () => {
    const res = await dialog.showOpenDialog({ filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg'] }] });
    return res.filePaths[0] || null;
  });

  ipcMain.handle('analyze-image', async (_, imagePath, apiKey) => {
    const games = await analyzeLibraryImage(imagePath, apiKey);
    if (games && games.length > 0) {
      await bulkImportGames(games);
      return games;
    }
    return [];
  });

  ipcMain.handle('bulk-import-text', async (_, text: string) => {
    const games = text.split(/[\n,]+/).map(g => g.trim()).filter(g => g.length > 0);
    if (games.length > 0) {
      await bulkImportGames(games);
      return games;
    }
    return [];
  });

  ipcMain.handle('get-ai-recommendations', async () => {
    const apiKey = getSetting('geminiKey');
    if (!apiKey) return { error: 'NO_API_KEY', recommendations: [] };
    const allGames = getAllGames();
    return await getAIRecommendations(apiKey, allGames);
  });

  ipcMain.handle('get-game-deals', async (_, title: string) => {
    return await getGameDeals(title);
  });

  ipcMain.handle('open-external', async (_, url: string) => {
    await shell.openExternal(url);
    return true;
  });

  ipcMain.handle('get-global-rankings', async () => {
    return await getGlobalRankings();
  });

  ipcMain.handle('get-cached-rankings', async (_, categoryId) => {
    return await getCachedRankings(categoryId);
  });

  ipcMain.handle('clear-rankings-cache', (_, categoryId) => {
    clearRankingsCache(categoryId);
    return true;
  });

  ipcMain.handle('get-ai-play-order', async (_, _gameId, gameTitle) => {
    const key = getSetting('geminiKey');
    if (!key) throw new Error('No Gemini API Key found in settings.');
    return await getSmartAIPlayOrder(gameTitle, key);
  });

  ipcMain.handle('sync-steam', async (_, steamId, apiKey) => {
    return await syncSteamLibrary(steamId, apiKey);
  });

  ipcMain.handle('get-steam-details', async (_, steamId) => {
    return await getSteamAppDetails(steamId);
  });

  ipcMain.handle('get-steam-tags', async () => {
    return await getDisplaySteamTags();
  });

  ipcMain.handle('get-gamer-profile', async (_, statsJson: string) => {
    const apiKey = getSetting('geminiKey');
    if (!apiKey) return 'No Gemini API Key found in settings. Please add one to generate your profile.';
    return await generateGamerProfile(statsJson, apiKey);
  });

  ipcMain.handle('backfill-metadata', async () => {
    return await backfillMissingMetadata();
  });

  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  // --- WINDOW CONTROLS ---
  ipcMain.handle('window-minimize', () => {
    const win = BrowserWindow.getFocusedWindow();
    if (win) win.minimize();
  });

  ipcMain.handle('window-maximize', () => {
    const win = BrowserWindow.getFocusedWindow();
    if (win) {
      if (win.isMaximized()) {
        win.restore();
      } else {
        win.maximize();
      }
    }
  });

  ipcMain.handle('window-close', () => {
    const win = BrowserWindow.getFocusedWindow();
    if (win) win.close();
  });

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

ipcMain.handle('get-scraped-rankings', async (_, categoryId) => {
    return await getScrapedRankings(categoryId || 'overall');
  });