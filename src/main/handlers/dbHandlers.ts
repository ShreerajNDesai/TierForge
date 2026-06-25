import { ipcMain, BrowserWindow } from 'electron'
import {
  getAllGames,
  addGame,
  updateGameTier,
  deleteGame,
  updateGameData,
  getSetting,
  saveSetting,
  getPlaytime
} from '../database'

export function registerDbHandlers() {
  ipcMain.handle('get-all-games', () => {
    return getAllGames()
  })

  ipcMain.handle('add-game', (_, id, title, imageUrl) => {
    addGame(id, title, imageUrl)
    return true
  })

  ipcMain.handle('update-game-tier', (_, id, tier) => {
    updateGameTier(id, tier)
    return true
  })

  ipcMain.handle('delete-game', (_, id) => {
    deleteGame(id)
    return true
  })

  ipcMain.handle('update-game-data', (_, id, notes, status) => {
    updateGameData(id, notes, status)
    return true
  })

  ipcMain.handle('get-setting', (_, key) => {
    return getSetting(key)
  })

  ipcMain.handle('save-setting', (_, key, value) => {
    saveSetting(key, value)
    BrowserWindow.getAllWindows().forEach((win) => {
      win.webContents.send('setting-updated', { key, value })
    })
    return true
  })

  ipcMain.handle('get-playtime', (_, gameId) => {
    return getPlaytime(gameId)
  })
}
