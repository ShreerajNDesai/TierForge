import { app, shell, BrowserWindow, Notification } from 'electron'
import * as fs from 'fs'
import * as path from 'path'
import { getSetting, saveSetting } from '../database'

export class TierForgeAPI {
  gameLaunchCallbacks: Function[] = []
  gameCloseCallbacks: Function[] = []
  sidebarTabs: any[] = []

  onGameLaunch(callback: (gameId: string, gameTitle: string) => void) {
    this.gameLaunchCallbacks.push(callback)
  }

  onGameClose(callback: (gameId: string, playtime: number) => void) {
    this.gameCloseCallbacks.push(callback)
  }

  addContextMenuItem(label: string, _onClick: () => void) {
    // Stub for now. A complete implementation would require adding to the Electron Tray or context menus dynamically.
    console.log(`Plugin registered context menu item: ${label}`)
  }

  registerSidebarTab(id: string, icon: string, label: string) {
    this.sidebarTabs.push({ id, icon, label })
  }

  injectCSS(cssString: string) {
    BrowserWindow.getAllWindows().forEach((win) => {
      win.webContents.insertCSS(cssString)
    })
  }

  showNotification(title: string, body: string) {
    if (Notification.isSupported()) {
      new Notification({ title, body }).show()
    }
  }
}

export class PluginManager {
  private pluginsDir: string
  private loadedPlugins: any[] = []
  public api: TierForgeAPI

  constructor() {
    this.pluginsDir = path.join(app.getPath('userData'), 'plugins')
    this.api = new TierForgeAPI()
    this.init()
  }

  init() {
    if (!fs.existsSync(this.pluginsDir)) {
      fs.mkdirSync(this.pluginsDir, { recursive: true })
    }
  }

  loadPlugins() {
    console.log('\n--- PLUGIN ENGINE STARTING ---')
    console.log('Scanning directory:', this.pluginsDir)

    this.loadedPlugins = []
    this.api = new TierForgeAPI() // reset API state

    if (!fs.existsSync(this.pluginsDir)) {
      console.log('Plugins directory not found. Creating it...')
      fs.mkdirSync(this.pluginsDir, { recursive: true })
    }

    const items = fs.readdirSync(this.pluginsDir)
    
    for (const item of items) {
      const itemPath = path.join(this.pluginsDir, item)
      const stat = fs.statSync(itemPath)
      
      let pluginPath = ''
      if (stat.isFile() && item.endsWith('.js')) {
        pluginPath = itemPath
        console.log('Found file:', item)
      } else if (stat.isDirectory()) {
        const indexPath = path.join(itemPath, 'index.js')
        if (fs.existsSync(indexPath)) {
          pluginPath = indexPath
          console.log('Found file:', path.join(item, 'index.js'))
        }
      }

      if (pluginPath) {
        try {
          // CRITICAL NODE FIX: Clear require cache for reloading fresh changes
          delete require.cache[require.resolve(pluginPath)]
          let rawPlugin = require(pluginPath)
          // Handle ES module default exports wrapping
          const plugin = rawPlugin.default || rawPlugin

          console.log('Plugin exports keys:', Object.keys(plugin))

          // Support both a nested metadata object and flat exports
          const meta = plugin.metadata || plugin

          if (!meta.name || !meta.version || !meta.author || typeof plugin.activate !== 'function') {
            throw new Error(`Missing metadata or activate() function. Keys found: ${Object.keys(plugin).join(', ')}`)
          }

          // Check disabled state
          const disabledPluginsStr = getSetting('disabled_plugins') || '[]'
          const disabledPlugins = JSON.parse(disabledPluginsStr)
          
          const isEnabled = !disabledPlugins.includes(meta.name)
          
          this.loadedPlugins.push({
            name: meta.name,
            version: meta.version || '1.0.0',
            author: meta.author || 'Unknown',
            enabled: isEnabled,
            path: pluginPath
          })

          if (isEnabled) {
            plugin.activate(this.api)
          }
          
          console.log('✅ Loaded plugin:', meta.name)
        } catch (error) {
          console.error('❌ Failed to load plugin:', item, error)
        }
      }
    }

    // Broadcast UI updates for tabs
    this.broadcastUiUpdate()
  }

  getLoadedPlugins() {
    return this.loadedPlugins
  }

  togglePlugin(name: string, enabled: boolean) {
    const disabledPluginsStr = getSetting('disabled_plugins') || '[]'
    let disabledPlugins = JSON.parse(disabledPluginsStr)
    
    if (enabled) {
      disabledPlugins = disabledPlugins.filter((p: string) => p !== name)
    } else {
      if (!disabledPlugins.includes(name)) {
        disabledPlugins.push(name)
      }
    }
    
    saveSetting('disabled_plugins', JSON.stringify(disabledPlugins))

    const plugin = this.loadedPlugins.find(p => p.name === name)
    if (plugin) {
      plugin.enabled = enabled
    }
  }

  openPluginsFolder() {
    shell.showItemInFolder(this.pluginsDir)
  }

  broadcastUiUpdate() {
    BrowserWindow.getAllWindows().forEach((win) => {
      win.webContents.send('plugin-ui-update', this.api.sidebarTabs)
    })
  }

  triggerGameLaunch(gameId: string, gameTitle: string) {
    this.api.gameLaunchCallbacks.forEach(cb => {
      try { cb(gameId, gameTitle) } catch (e) { console.error('Plugin Error onGameLaunch:', e) }
    })
  }

  triggerGameClose(gameId: string, playtime: number) {
    this.api.gameCloseCallbacks.forEach(cb => {
      try { cb(gameId, playtime) } catch (e) { console.error('Plugin Error onGameClose:', e) }
    })
  }
}

export const pluginManager = new PluginManager()
