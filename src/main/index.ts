import { app, shell, BrowserWindow, ipcMain, dialog, Notification, Tray, nativeImage } from 'electron'
import { join, basename } from 'path'
import { exec } from 'child_process'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { initDB, getAllGames, addGame, updateGameTier, deleteGame, updateGameData, getSetting, saveSetting, addPlaytime, getPlaytime, clearRankingsCache, getDbPath, db } from './database'
import { scanLocalGames } from './scanner'
import { 
  searchGames, 
  getGameExtendedDetails, 
  getHowLongToBeat, 
  getDiscoverGames,
  analyzeLibraryImage, 
  bulkImportGames, 
  getAIRecommendations,
  getAICompatibility,
  getAIBacklogCure,
  getGameDeals, 
  getGlobalRankings, 
  getScrapedRankings, 
  getCachedRankings,
  getSmartAIPlayOrder,
  syncSteamLibrary,
  getSteamAppDetails,
  getDisplaySteamTags,
  generateGamerProfile,
  backfillMissingMetadata,
  getSteamAchievements
} from './api'
import { GDRIVE_CLIENT_ID, GDRIVE_CLIENT_SECRET, GDRIVE_REDIRECT_URI, GDRIVE_SCOPE } from './driveConfig'
import { initDiscord, setBrowsingStatus, setPlayingStatus, disconnectDiscord, getDiscordStatus } from './discord'
import { backupGameSave, getExeNameFromManifest } from './ludusavi'

export async function getValidDriveToken(): Promise<string | null> {
  const clientId = GDRIVE_CLIENT_ID;
  const clientSecret = GDRIVE_CLIENT_SECRET;
  const refreshToken = getSetting('gdrive_refresh_token');
  const expiry = Number(getSetting('gdrive_token_expiry') || '0');
  let accessToken = getSetting('gdrive_access_token');

  if (!accessToken || !refreshToken) return null;

  // Refresh if expired or about to expire
  if (Date.now() > expiry - 60000) {
    try {
      const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId!,
          client_secret: clientSecret!,
          refresh_token: refreshToken,
          grant_type: 'refresh_token'
        })
      });
      const data = await res.json();
      if (data.access_token) {
        accessToken = data.access_token;
        saveSetting('gdrive_access_token', accessToken!);
        saveSetting('gdrive_token_expiry', String(Date.now() + (data.expires_in || 3600) * 1000));
      } else {
        return null;
      }
    } catch {
      return null;
    }
  }
  return accessToken;
}

function sendDesktopNotification(title: string, body: string) {
  if (Notification.isSupported()) {
    new Notification({ title, body }).show();
  }
}

let tray: Tray | null = null;
let trayWindow: BrowserWindow | null = null;
let mainWindow: BrowserWindow | null = null;
let isQuitting = false;

function showAndRestoreMainWindow() {
  if (mainWindow) {
    mainWindow.show();
    mainWindow.focus();
    mainWindow.webContents.send('app-restored');
  }
}

function createTrayWindow(): void {
  trayWindow = new BrowserWindow({
    width: 320,
    height: 450,
    show: false,
    frame: false,
    transparent: true,
    resizable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  });

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    trayWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}#/tray`);
  } else {
    trayWindow.loadFile(join(__dirname, '../renderer/index.html'), { hash: 'tray' });
  }

  trayWindow.on('blur', () => {
    trayWindow?.hide();
  });
}

function createWindow(): void {
  // Create the browser window.
  mainWindow = new BrowserWindow({
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
    mainWindow!.maximize()
    mainWindow!.show()
  })

  mainWindow.on('close', (event) => {
    // Hide to tray instead of quitting
    if (!isQuitting) {
      event.preventDefault();
      mainWindow!.hide();
    }
  });

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

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  initDB();

  createTrayWindow();

  // Initialize Tray
  tray = new Tray(nativeImage.createFromPath(join(__dirname, '../../resources/icon.png')));
  tray.setToolTip('TierForge Gaming Dashboard');
  
  tray.on('click', () => {
    showAndRestoreMainWindow();
  });

  tray.on('right-click', () => {
    if (!tray || !trayWindow) return;
    
    if (trayWindow.isVisible()) {
      trayWindow.hide();
    } else {
      const { x, y, width, height } = tray.getBounds();
      const trayWidth = trayWindow.getBounds().width;
      const trayHeight = trayWindow.getBounds().height;
      const { screen } = require('electron');
      const primaryDisplay = screen.getPrimaryDisplay();
      const workArea = primaryDisplay.workArea;

      // Calculate x position to center above tray icon
      let xPos = Math.round(x + (width / 2) - (trayWidth / 2));
      // Keep within screen bounds
      if (xPos < workArea.x) xPos = workArea.x;
      if (xPos + trayWidth > workArea.x + workArea.width) xPos = workArea.x + workArea.width - trayWidth;

      // Calculate y position above tray
      let yPos = Math.round(y - trayHeight - 10);
      // If taskbar is at top, put below
      if (yPos < workArea.y) yPos = Math.round(y + height + 10);

      trayWindow.setPosition(xPos, yPos, false);
      trayWindow.show();
      trayWindow.focus();
    }
  });

  // tray.on('double-click') can remain or be removed, since click already handles it. Let's just remove double-click to avoid conflicts.

  // Initialize Discord RPC if enabled
  const isDiscordEnabled = getSetting('discord_rpc') !== 'false'; // Defaults to true
  if (isDiscordEnabled) {
    initDiscord();
    const totalGames = getAllGames().length;
    setBrowsingStatus(totalGames);
  }

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

  // 5.5 Uninstall Game
  ipcMain.handle('uninstall-game', async (_, gameId, executablePath) => {
    try {
      const fs = require('fs');
      const { shell } = require('electron');
      
      if (!executablePath) return false;

      // 1. Steam Protocol
      if (executablePath.startsWith('steam://')) {
        const appIdMatch = executablePath.match(/steam:\/\/rungameid\/(\d+)/i);
        if (appIdMatch && appIdMatch[1]) {
          const appId = appIdMatch[1];
          await shell.openExternal(`steam://uninstall/${appId}`);
          deleteGame(gameId);
          return true;
        }
      }

      // 2. Native OS Fallback
      if (fs.existsSync(executablePath)) {
        // Open Add/Remove Programs on Windows
        if (process.platform === 'win32') {
          await shell.openExternal('ms-settings:appsfeatures');
        }
        
        // Reveal the game folder to the user
        shell.showItemInFolder(executablePath);
        
        // Remove from the local DB so it disappears from TierForge
        deleteGame(gameId);
        return true;
      }
      return false;
    } catch (e) {
      console.error('Failed to uninstall game', e);
      return false;
    }
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

  ipcMain.handle('get-tray-data', () => {
    const games = getAllGames();
    const installedGames = games.filter((g: any) => g.executable_path && g.executable_path.trim() !== '');
    const recentGames = [...installedGames].sort((a: any, b: any) => (b.last_played_at || 0) - (a.last_played_at || 0)).slice(0, 5);
    const backlogGames = installedGames.filter((g: any) => g.status === 'Backlog');
    const discordEnabled = getSetting('discord_rpc') !== 'false';
    
    return {
      recentGames,
      installedGames,
      backlogGames,
      discordEnabled
    };
  });

  ipcMain.handle('hide-tray-window', () => {
    if (trayWindow) trayWindow.hide();
  });

  ipcMain.handle('quit-app', () => {
    isQuitting = true;
    app.quit();
  });

  ipcMain.handle('show-main-window', () => {
    showAndRestoreMainWindow();
  });

  ipcMain.handle('force-cloud-backup', async () => {
    sendDesktopNotification('Cloud Backup', 'Starting background backup of recently played games...');
    const games = getAllGames().filter((g: any) => g.executable_path && g.last_played_at > 0).sort((a: any, b: any) => b.last_played_at - a.last_played_at).slice(0, 3);
    if (games.length === 0) {
      sendDesktopNotification('Cloud Backup', 'No recently played games found to backup.');
      return;
    }
    let successCount = 0;
    for (const game of games) {
      const success = await backupGameSave(game.title, game.custom_save_path || '', getValidDriveToken);
      if (success) successCount++;
    }
    sendDesktopNotification('Cloud Backup', `Successfully backed up ${successCount}/${games.length} recent games.`);
    return true;
  });

  // Game launcher with automatic playtime tracking
  ipcMain.handle('show-notification', (_, title, body) => {
    sendDesktopNotification(title, body);
    return true;
  });

  ipcMain.handle('launch-game', async (_, exePath: string, gameId: string, gameTitle: string) => {
    let exeName = basename(exePath);

    if (exePath.startsWith('steam://')) {
      shell.openExternal(exePath);
      const manifestExe = await getExeNameFromManifest(gameTitle);
      if (manifestExe) {
        exeName = manifestExe;
      } else {
        const startTime = Date.now();
        db.prepare('UPDATE games SET last_played_at = ? WHERE id = ?').run(startTime, gameId);
        const isDiscordEnabled = getSetting('discord_rpc') !== 'false';
        if (isDiscordEnabled) {
          setPlayingStatus(gameTitle, startTime);
        }
        if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('game-started', gameId);
        return true;
      }
    } else {
      exec(`"${exePath}"`, (err) => {
        if (err) console.error('Launch error:', err)
      });
    }

    const startTime = Date.now()
    
    db.prepare('UPDATE games SET last_played_at = ? WHERE id = ?').run(startTime, gameId);

    // Update Discord Status
    const isDiscordEnabled = getSetting('discord_rpc') !== 'false';
    if (isDiscordEnabled) {
      setPlayingStatus(gameTitle, startTime);
    }

    // Notify frontend: game started — always target mainWindow explicitly
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('game-started', gameId)

    let hasActuallyStarted = false;

    // Poll for process termination every 3 seconds
    const pollInterval = setInterval(() => {
      exec(`tasklist /FI "IMAGENAME eq ${exeName}" /NH`, (err, stdout) => {
        const isRunning = !err && stdout.toLowerCase().includes(exeName.toLowerCase());
        
        if (isRunning) {
          hasActuallyStarted = true;
        } else if (hasActuallyStarted && !isRunning) {
          clearInterval(pollInterval)

          const elapsedMs = Date.now() - startTime
          const elapsedMinutes = Math.max(1, Math.round(elapsedMs / 60000))

          addPlaytime(gameId, elapsedMinutes)

          const totalPlaytime = getPlaytime(gameId)

          // Revert Discord Status
          if (isDiscordEnabled) {
            const totalGames = getAllGames().length;
            setBrowsingStatus(totalGames);
          }

          sendDesktopNotification('Game Session Ended', `Logged ${elapsedMinutes} minutes in your library.`);

          // Notify frontend: game stopped — always target mainWindow explicitly
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('game-stopped', gameId, totalPlaytime);
          }
          sendDesktopNotification('Cloud Save Sync', `☁️ Syncing Cloud Save for ${gameTitle}...`);

          // Trigger Cloud Backup Engine
          const dbRow = db.prepare('SELECT custom_save_path FROM games WHERE id = ?').get(gameId) as { custom_save_path?: string };
          const customSavePath = dbRow ? dbRow.custom_save_path || '' : '';
          
          backupGameSave(gameTitle, customSavePath, getValidDriveToken).then(success => {
            if (success) sendDesktopNotification('Cloud Save Sync', `✅ Cloud Save Sync Complete for ${gameTitle}`);
            else sendDesktopNotification('Cloud Save Sync', `⚠️ Cloud Save Sync skipped or failed for ${gameTitle}`);
          });
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

  ipcMain.handle('update-discord-rpc', (_, isEnabled: boolean) => {
    if (isEnabled) {
      initDiscord();
      const totalGames = getAllGames().length;
      setBrowsingStatus(totalGames);
    } else {
      disconnectDiscord();
    }
    return true;
  });

  ipcMain.handle('check-discord-status', () => {
    return getDiscordStatus();
  });

  ipcMain.handle('update-user-profile', (_, username: string, avatarPath: string | null) => {
    saveSetting('user_name', username);
    if (avatarPath) {
      try {
        const fs = require('fs');
        const buffer = fs.readFileSync(avatarPath);
        const extension = avatarPath.toLowerCase().endsWith('.jpg') || avatarPath.toLowerCase().endsWith('.jpeg') ? 'jpeg' : 'png';
        const base64 = `data:image/${extension};base64,${buffer.toString('base64')}`;
        saveSetting('user_avatar', base64);
      } catch (e) {
        console.error('Failed to read avatar image', e);
      }
    }
    return true;
  });

  ipcMain.handle('browse-avatar', async () => {
    const res = await dialog.showOpenDialog({ filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg'] }] });
    return res.filePaths[0] || null;
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

  ipcMain.handle('get-ai-recommendations', async (_, vibe: string = '', deepCuts: boolean = false) => {
    const apiKey = getSetting('geminiKey');
    if (!apiKey) return { error: 'NO_API_KEY', recommendations: [] };
    const allGames = getAllGames();
    return await getAIRecommendations(apiKey, allGames, vibe, deepCuts);
  });

  ipcMain.handle('get-ai-compatibility', async (_, targetGame: string) => {
    const apiKey = getSetting('geminiKey');
    if (!apiKey) return { error: 'NO_API_KEY', score: 0, review: '' };
    const allGames = getAllGames();
    return await getAICompatibility(apiKey, allGames, targetGame);
  });

  ipcMain.handle('get-ai-backlog-cure', async () => {
    const apiKey = getSetting('geminiKey');
    if (!apiKey) return { error: 'NO_API_KEY', title: '', reason: '' };
    const allGames = getAllGames();
    return await getAIBacklogCure(apiKey, allGames);
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
    return await getSmartAIPlayOrder(_gameId, gameTitle, key);
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

  ipcMain.handle('get-steam-achievements', async (_, appId) => {
    const apiKey = getSetting('steamKey');
    const steamId = getSetting('steamId');
    if (!apiKey || !steamId) return null;
    return await getSteamAchievements(appId, steamId, apiKey);
  });

  ipcMain.handle('get-gamer-profile', async (_, statsJson: string) => {
    const apiKey = getSetting('geminiKey');
    if (!apiKey) return 'No Gemini API Key found in settings. Please add one to generate your profile.';
    return await generateGamerProfile(statsJson, apiKey);
  });

  ipcMain.handle('backfill-metadata', async () => {
    return await backfillMissingMetadata();
  });

  ipcMain.handle('save-image', async (_, dataUrl: string, defaultPath: string) => {
    const win = BrowserWindow.getFocusedWindow();
    if (!win) return false;
    
    const { canceled, filePath } = await dialog.showSaveDialog(win, {
      title: 'Save Image',
      defaultPath: defaultPath,
      filters: [{ name: 'Images', extensions: ['png'] }]
    });

    if (canceled || !filePath) return false;

    try {
      const base64Data = dataUrl.replace(/^data:image\/png;base64,/, "");
      require('fs').writeFileSync(filePath, base64Data, 'base64');
      return true;
    } catch (e) {
      console.error('Failed to save image', e);
      return false;
    }
  });

  ipcMain.handle('set-custom-save-path', async (_, gameId) => {
    try {
      const result = await dialog.showOpenDialog({
        properties: ['openDirectory']
      });
      if (result.canceled || result.filePaths.length === 0) return false;
      const selectedPath = result.filePaths[0];
      
      db.prepare('UPDATE games SET custom_save_path = ? WHERE id = ?').run(selectedPath, gameId);
      return selectedPath;
    } catch (e) {
      console.error('Failed to set custom save path', e);
      return false;
    }
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
    if (win) {
      win.hide();
    }
  });

  // Backup System
  ipcMain.handle('browse-backup-folder', async () => {
    const result = await dialog.showOpenDialog({
      title: 'Choose Cloud Sync / Backup Folder',
      properties: ['openDirectory'],
      buttonLabel: 'Select Folder'
    });
    if (result.canceled || result.filePaths.length === 0) return null;
    return result.filePaths[0];
  });

  ipcMain.handle('manual-backup', async () => {
    try {
      const fs = require('fs');
      const path = require('path');
      const backupFolder = getSetting('backup_folder');
      if (!backupFolder || !fs.existsSync(backupFolder)) return { success: false, message: 'No backup folder configured.' };
      const dbSrc = getDbPath();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const backupName = `tierforge_backup_${timestamp}.db`;
      const latestName = 'tierforge_latest.db';
      fs.copyFileSync(dbSrc, path.join(backupFolder, backupName));
      fs.copyFileSync(dbSrc, path.join(backupFolder, latestName));
      return { success: true, message: `Backup saved as ${backupName}` };
    } catch (e) {
      return { success: false, message: String(e) };
    }
  });

  ipcMain.handle('restore-backup', async () => {
    try {
      const fs = require('fs');
      const result = await dialog.showOpenDialog({
        title: 'Select TierForge Backup File',
        filters: [{ name: 'SQLite Database', extensions: ['db'] }],
        properties: ['openFile'],
        buttonLabel: 'Restore This Backup'
      });
      if (result.canceled || result.filePaths.length === 0) return { success: false, message: 'Cancelled.' };
      const backupFile = result.filePaths[0];
      const dbDest = getDbPath();
      fs.copyFileSync(backupFile, dbDest);
      return { success: true, message: 'Backup restored. Restart the app to load it.' };
    } catch (e) {
      return { success: false, message: String(e) };
    }
  });

  ipcMain.handle('get-backup-info', async () => {
    try {
      const fs = require('fs');
      const path = require('path');
      const backupFolder = getSetting('backup_folder');
      if (!backupFolder || !fs.existsSync(backupFolder)) return null;
      const latestPath = path.join(backupFolder, 'tierforge_latest.db');
      if (!fs.existsSync(latestPath)) return { folder: backupFolder, lastBackup: null, count: 0 };
      const stats = fs.statSync(latestPath);
      const backups = fs.readdirSync(backupFolder)
        .filter((f: string) => f.startsWith('tierforge_backup_') && f.endsWith('.db'));
      return { folder: backupFolder, lastBackup: stats.mtime.toISOString(), count: backups.length };
    } catch (e) {
      return null;
    }
  });

  // --- Google Drive API Backup ---
  ipcMain.handle('google-drive-auth', async () => {
    try {
      const clientId = GDRIVE_CLIENT_ID;
      const clientSecret = GDRIVE_CLIENT_SECRET;
      const redirectUri = GDRIVE_REDIRECT_URI;
      if (!clientId || !clientSecret) return { success: false, message: 'Google Drive is not configured for this build.' };

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(GDRIVE_SCOPE)}&access_type=offline&prompt=consent`;

      // Start a tiny local server to catch the OAuth callback
      const http = require('http');
      return new Promise((resolve) => {
        const server = http.createServer(async (req: any, res: any) => {
          const url = new URL(req.url, 'http://localhost:19847');
          const code = url.searchParams.get('code');
          if (code) {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end('<html><body style="background:#0B0E14;color:#fff;font-family:sans-serif;display:flex;justify-content:center;align-items:center;height:100vh;"><h1>✅ Connected! You can close this tab.</h1></body></html>');
            server.close();

            // Exchange code for tokens
            try {
              const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                  code,
                  client_id: clientId,
                  client_secret: clientSecret,
                  redirect_uri: redirectUri,
                  grant_type: 'authorization_code'
                })
              });
              const tokens = await tokenRes.json();
              if (tokens.access_token) {
                saveSetting('gdrive_access_token', tokens.access_token);
                if (tokens.refresh_token) saveSetting('gdrive_refresh_token', tokens.refresh_token);
                saveSetting('gdrive_token_expiry', String(Date.now() + (tokens.expires_in || 3600) * 1000));
                resolve({ success: true, message: 'Google Drive connected!' });
              } else {
                resolve({ success: false, message: 'Failed to get access token.' });
              }
            } catch (err) {
              resolve({ success: false, message: 'Token exchange failed.' });
            }
          } else {
            res.writeHead(400);
            res.end('Missing code');
            server.close();
            resolve({ success: false, message: 'Authorization cancelled.' });
          }
        });
        server.listen(19847, () => {
          shell.openExternal(authUrl);
        });
        // Timeout after 2 minutes
        setTimeout(() => { try { server.close(); } catch(_) {} resolve({ success: false, message: 'Authorization timed out.' }); }, 120000);
      });
    } catch (e) {
      return { success: false, message: String(e) };
    }
  });

  ipcMain.handle('backup-to-drive', async () => {
    try {
      const fs = require('fs');
      const token = await getValidDriveToken();
      if (!token) return { success: false, message: 'Not connected to Google Drive.' };

      const dbSrc = getDbPath();
      const fileBuffer = fs.readFileSync(dbSrc);
      const fileName = 'tierforge_latest.db';

      // Check if file already exists on Drive
      const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=name='${fileName}'+and+trashed=false&fields=files(id,name)`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const searchData = await searchRes.json();
      const existingFile = searchData.files && searchData.files.length > 0 ? searchData.files[0] : null;

      if (existingFile) {
        // Update existing file
        const updateRes = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${existingFile.id}?uploadType=media`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/octet-stream' },
          body: fileBuffer
        });
        if (updateRes.ok) {
          saveSetting('last_cloud_backup', new Date().toISOString());
          return { success: true, message: 'Backup updated on Google Drive.' };
        }
        return { success: false, message: 'Failed to update backup on Drive.' };
      } else {
        // Create new file
        const metadata = JSON.stringify({ name: fileName, mimeType: 'application/octet-stream' });
        const boundary = '---tierforge_boundary';
        const body = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n--${boundary}\r\nContent-Type: application/octet-stream\r\n\r\n`;
        const ending = `\r\n--${boundary}--`;
        const bodyBuffer = Buffer.concat([Buffer.from(body), fileBuffer, Buffer.from(ending)]);
        
        const createRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': `multipart/related; boundary=${boundary}` },
          body: bodyBuffer
        });
        if (createRes.ok) {
          saveSetting('last_cloud_backup', new Date().toISOString());
          return { success: true, message: 'Backup created on Google Drive.' };
        }
        return { success: false, message: 'Failed to create backup on Drive.' };
      }
    } catch (e) {
      return { success: false, message: String(e) };
    }
  });

  ipcMain.handle('restore-from-drive', async () => {
    try {
      const fs = require('fs');
      const token = await getValidDriveToken();
      if (!token) return { success: false, message: 'Not connected to Google Drive.' };

      const fileName = 'tierforge_latest.db';
      const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=name='${fileName}'+and+trashed=false&fields=files(id,name,modifiedTime)`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const searchData = await searchRes.json();
      if (!searchData.files || searchData.files.length === 0) return { success: false, message: 'No backup found on Google Drive.' };

      const fileId = searchData.files[0].id;
      const downloadRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!downloadRes.ok) return { success: false, message: 'Failed to download backup from Drive.' };

      const buffer = Buffer.from(await downloadRes.arrayBuffer());
      const dbDest = getDbPath();
      fs.writeFileSync(dbDest, buffer);
      return { success: true, message: 'Backup restored from Google Drive. Restart the app to load it.' };
    } catch (e) {
      return { success: false, message: String(e) };
    }
  });

  ipcMain.handle('check-drive-connection', async () => {
    const token = await getValidDriveToken();
    if (!token) return { connected: false };
    try {
      const res = await fetch('https://www.googleapis.com/drive/v3/about?fields=user', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        return { connected: true, email: data.user?.emailAddress || 'Connected' };
      }
      return { connected: false };
    } catch {
      return { connected: false };
    }
  });

  ipcMain.handle('disconnect-drive', () => {
    saveSetting('gdrive_access_token', '');
    saveSetting('gdrive_refresh_token', '');
    saveSetting('gdrive_token_expiry', '');
    return true;
  });

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('before-quit', () => {
  isQuitting = true;
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  // Silent auto-backup on close
  try {
    const fs = require('fs');
    const path = require('path');
    const backupFolder = getSetting('backup_folder');
    if (backupFolder && fs.existsSync(backupFolder)) {
      const dbSrc = getDbPath();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const backupName = `tierforge_backup_${timestamp}.db`;
      const latestName = 'tierforge_latest.db';
      fs.copyFileSync(dbSrc, path.join(backupFolder, backupName));
      fs.copyFileSync(dbSrc, path.join(backupFolder, latestName));
      
      // Keep only the last 10 timestamped backups
      const backups = fs.readdirSync(backupFolder)
        .filter((f: string) => f.startsWith('tierforge_backup_') && f.endsWith('.db'))
        .sort()
        .reverse();
      for (let i = 10; i < backups.length; i++) {
        fs.unlinkSync(path.join(backupFolder, backups[i]));
      }
      console.log('Auto-backup saved to:', backupFolder);
    }
  } catch (e) {
    console.error('Auto-backup failed:', e);
  }

  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

ipcMain.handle('get-scraped-rankings', async (_, categoryId) => {
    return await getScrapedRankings(categoryId || 'overall');
  });