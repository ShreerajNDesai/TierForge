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
  scanPC: () => ipcRenderer.invoke('scan-pc'),
  getExtendedDetails: (id: string) => ipcRenderer.invoke('get-extended-details', id),
  updateGameData: (id: string, notes: string, status: string) => ipcRenderer.invoke('update-game-data', id, notes, status),
  
  // Window Controls
  windowMinimize: () => ipcRenderer.invoke('window-minimize'),
  windowMaximize: () => ipcRenderer.invoke('window-maximize'),
  windowClose: () => ipcRenderer.invoke('window-close')
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
