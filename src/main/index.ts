import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { initDB } from './database'
import { searchGames, getGameExtendedDetails } from './api'
import { getAllGames, addGame, updateGameTier, deleteGame, updateGameData } from './database'
import { scanLocalGames } from './scanner'

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
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

  // 8. Scan PC for Steam Games
  ipcMain.handle('scan-pc', async () => {
    const games = scanLocalGames();
    console.log(`Found ${games.length} games locally.`);
    
    for (const gameName of games) {
      try {
        console.log(`Searching IGDB for: ${gameName}`);
        const results = await searchGames(gameName);
        if (results && results.length > 0) {
          // Prefer an exact match if available, otherwise fallback to the first result
          let bestHit = results[0];
          const exactMatch = results.find(
            (r: any) => r.title.toLowerCase() === gameName.toLowerCase()
          );
          
          if (exactMatch) {
            bestHit = exactMatch;
          }
          
          addGame(bestHit.id, bestHit.title, bestHit.image_url);
        }
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (err) {
        console.error(`Failed to process scanned game ${gameName}:`, err);
      }
    }
    return true;
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
