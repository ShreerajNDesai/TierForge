import { contextBridge } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { ipcRenderer } from 'electron'

// Custom APIs for renderer
const api = {
  searchGames: (query: string) => ipcRenderer.invoke('search-games', query),
  getAllGames: () => ipcRenderer.invoke('get-all-games'),
  addGame: (id: string, title: string, imageUrl: string) => ipcRenderer.invoke('add-game', id, title, imageUrl),
  updateGameTier: (id: string, tier: string) => ipcRenderer.invoke('update-game-tier', id, tier),
  deleteGame: (id: string) => ipcRenderer.invoke('delete-game', id),
  uninstallGame: (id: string, executablePath: string) => ipcRenderer.invoke('uninstall-game', id, executablePath),
  scanPC: () => ipcRenderer.invoke('scan-pc'),
  getExtendedDetails: (id: string) => ipcRenderer.invoke('get-extended-details', id),
  updateGameData: (id: string, notes: string, status: string) => ipcRenderer.invoke('update-game-data', id, notes, status),
  getTimeToBeat: (name: string) => ipcRenderer.invoke('get-time-to-beat', name),
  getDiscoverGames: (filterType: string, offset: number) => ipcRenderer.invoke('get-discover-games', filterType, offset),
  launchGame: (path: string, gameId: string, gameTitle: string) => ipcRenderer.invoke('launch-game', path, gameId, gameTitle),
  getPlaytime: (gameId: string) => ipcRenderer.invoke('get-playtime', gameId),
  onGameStarted: (callback: (gameId: string) => void) => {
    ipcRenderer.on('game-started', (_, gameId) => callback(gameId));
    return () => ipcRenderer.removeAllListeners('game-started');
  },
  onGameStopped: (callback: (gameId: string, totalPlaytime: number) => void) => {
    ipcRenderer.on('game-stopped', (_, gameId, totalPlaytime) => callback(gameId, totalPlaytime));
    return () => ipcRenderer.removeAllListeners('game-stopped');
  },
  getSetting: (key: string) => ipcRenderer.invoke('get-setting', key),
  saveSetting: (key: string, value: string) => ipcRenderer.invoke('save-setting', key, value),
  updateDiscordRpc: (isEnabled: boolean) => ipcRenderer.invoke('update-discord-rpc', isEnabled),
  checkDiscordStatus: () => ipcRenderer.invoke('check-discord-status'),
  updateUserProfile: (username: string, avatarPath: string | null) => ipcRenderer.invoke('update-user-profile', username, avatarPath),
  browseAvatar: () => ipcRenderer.invoke('browse-avatar'),
  browseImage: () => ipcRenderer.invoke('browse-image'),
  analyzeImage: (imagePath: string, apiKey: string) => ipcRenderer.invoke('analyze-image', imagePath, apiKey),
  bulkImportText: (text: string) => ipcRenderer.invoke('bulk-import-text', text),
  getAIRecommendations: (vibe?: string, deepCuts?: boolean) => ipcRenderer.invoke('get-ai-recommendations', vibe, deepCuts),
  getAICompatibility: (targetGame: string) => ipcRenderer.invoke('get-ai-compatibility', targetGame),
  getAIBacklogCure: () => ipcRenderer.invoke('get-ai-backlog-cure'),
  
  // Window Controls
  windowMinimize: () => ipcRenderer.invoke('window-minimize'),
  windowMaximize: () => ipcRenderer.invoke('window-maximize'),
  windowClose: () => ipcRenderer.invoke('window-close'),
  getGameDeals: (title: string) => ipcRenderer.invoke('get-game-deals', title),
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url),
  getScrapedRankings: (category: string) => ipcRenderer.invoke('get-scraped-rankings', category),
  getGlobalRankings: () => ipcRenderer.invoke('get-global-rankings'),
  getCachedRankings: (categoryId: string) => ipcRenderer.invoke('get-cached-rankings', categoryId),
  clearRankingsCache: (categoryId: string) => ipcRenderer.invoke('clear-rankings-cache', categoryId),
  getAIPlayOrder: (gameId: string, gameTitle: string) => ipcRenderer.invoke('get-ai-play-order', gameId, gameTitle),
  syncSteam: (steamId: string, apiKey: string) => ipcRenderer.invoke('sync-steam', steamId, apiKey),
  showNotification: (title: string, body: string) => ipcRenderer.invoke('show-notification', title, body),
  getSteamDetails: (steamId: string) => ipcRenderer.invoke('get-steam-details', steamId),
  getSteamTags: () => ipcRenderer.invoke('get-steam-tags'),
  getSteamAchievements: (appId: string) => ipcRenderer.invoke('get-steam-achievements', appId),
  getGamerProfile: (statsJson: string) => ipcRenderer.invoke('get-gamer-profile', statsJson),
  backfillMetadata: () => ipcRenderer.invoke('backfill-metadata'),
  saveImage: (dataUrl: string, defaultPath: string) => ipcRenderer.invoke('save-image', dataUrl, defaultPath),
  browseBackupFolder: () => ipcRenderer.invoke('browse-backup-folder'),
  manualBackup: () => ipcRenderer.invoke('manual-backup'),
  restoreBackup: () => ipcRenderer.invoke('restore-backup'),
  getBackupInfo: () => ipcRenderer.invoke('get-backup-info'),
  googleDriveAuth: () => ipcRenderer.invoke('google-drive-auth'),
  backupToDrive: () => ipcRenderer.invoke('backup-to-drive'),
  restoreFromDrive: () => ipcRenderer.invoke('restore-from-drive'),
  checkDriveConnection: () => ipcRenderer.invoke('check-drive-connection'),
  disconnectDrive: () => ipcRenderer.invoke('disconnect-drive'),
  setCustomSavePath: (gameId: string) => ipcRenderer.invoke('set-custom-save-path', gameId),
  getTrayData: () => ipcRenderer.invoke('get-tray-data'),
  hideTrayWindow: () => ipcRenderer.invoke('hide-tray-window'),
  quitApp: () => ipcRenderer.invoke('quit-app'),
  showMainWindow: () => ipcRenderer.invoke('show-main-window'),
  forceCloudBackup: () => ipcRenderer.invoke('force-cloud-backup'),
  onAppRestored: (callback: () => void) => {
    ipcRenderer.on('app-restored', () => callback());
    return () => ipcRenderer.removeAllListeners('app-restored');
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
