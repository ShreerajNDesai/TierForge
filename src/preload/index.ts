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
  launchGame: (path: string, gameId: string) => ipcRenderer.invoke('launch-game', path, gameId),
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
  getSteamDetails: (steamId: string) => ipcRenderer.invoke('get-steam-details', steamId),
  getSteamTags: () => ipcRenderer.invoke('get-steam-tags'),
  getGamerProfile: (statsJson: string) => ipcRenderer.invoke('get-gamer-profile', statsJson),
  backfillMetadata: () => ipcRenderer.invoke('backfill-metadata'),
  saveImage: (dataUrl: string, defaultPath: string) => ipcRenderer.invoke('save-image', dataUrl, defaultPath)
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
