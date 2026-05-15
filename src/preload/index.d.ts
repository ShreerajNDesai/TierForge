import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      searchGames: (query: string) => Promise<any[]>;
      getAllGames: () => Promise<any[]>;
      addGame: (id: string, title: string, imageUrl: string) => Promise<boolean>;
      updateGameTier: (id: string, tier: string) => Promise<boolean>;
      deleteGame: (id: string) => Promise<boolean>;
      uninstallGame: (id: string, executablePath: string) => Promise<boolean>;
      scanPC: () => Promise<boolean>;
      getExtendedDetails: (id: string) => Promise<any>;
      updateGameData: (id: string, notes: string, status: string) => Promise<boolean>;
      getTimeToBeat: (name: string) => Promise<any>;
      getDiscoverGames: (filterType: string, offset: number) => Promise<any[]>;
      launchGame: (path: string, gameId: string, gameTitle: string) => Promise<boolean>;
      getPlaytime: (gameId: string) => Promise<number>;
      onGameStarted: (callback: (gameId: string) => void) => () => void;
      onGameStopped: (callback: (gameId: string, totalPlaytime: number) => void) => () => void;
      getSetting: (key: string) => Promise<string | null>;
      saveSetting: (key: string, value: string) => Promise<boolean>;
      updateDiscordRpc: (isEnabled: boolean) => Promise<boolean>;
      checkDiscordStatus: () => Promise<{ connected: boolean; initialized: boolean }>;
      updateUserProfile: (username: string, avatarPath: string | null) => Promise<boolean>;
      browseAvatar: () => Promise<string | null>;
      browseImage: () => Promise<string | null>;
      analyzeImage: (imagePath: string, apiKey: string) => Promise<string[]>;
      bulkImportText: (text: string) => Promise<string[]>;
      getAIRecommendations: (vibe?: string, deepCuts?: boolean) => Promise<{ error: string | null; recommendations: any[] }>;
      getAICompatibility: (targetGame: string) => Promise<{ error: string | null; score: number; review: string }>;
      getAIBacklogCure: () => Promise<{ error: string | null; title: string; reason: string; gameInfo: any }>;
      getScrapedRankings: (category: string) => Promise<any[]>;
      getCachedRankings: (categoryId: string) => Promise<any[]>;
      clearRankingsCache: (categoryId: string) => Promise<boolean>;
      getAIPlayOrder: (gameId: string, gameTitle: string, forceRefresh?: boolean) => Promise<any[]>;
      checkCachedTimeline: (gameId: string, gameTitle: string) => Promise<any[] | null>;
      showNotification: (title: string, body: string) => Promise<boolean>;
      syncSteam: (steamId: string, apiKey: string) => Promise<number>;
      getSteamDetails: (steamId: string) => Promise<any>;
      getSteamTags: () => Promise<any[]>;
      getSteamAchievements: (appId: string) => Promise<any>;
      getGamerProfile: (statsJson: string) => Promise<string>;
      backfillMetadata: () => Promise<boolean>;
      saveImage: (dataUrl: string, defaultPath: string) => Promise<boolean>;
      browseBackupFolder: () => Promise<string | null>;
      manualBackup: () => Promise<{ success: boolean; message: string }>;
      restoreBackup: () => Promise<{ success: boolean; message: string }>;
      getBackupInfo: () => Promise<{ folder: string; lastBackup: string | null; count: number } | null>;
      googleDriveAuth: () => Promise<{ success: boolean; message: string }>;
      backupToDrive: () => Promise<{ success: boolean; message: string }>;
      restoreFromDrive: () => Promise<{ success: boolean; message: string }>;
      checkDriveConnection: () => Promise<{ connected: boolean; email?: string }>;
      disconnectDrive: () => Promise<boolean>;
      setCustomSavePath: (gameId: string) => Promise<string | false>;
      
      // Window Controls
      windowMinimize: () => Promise<void>;
      windowMaximize: () => Promise<void>;
      windowClose: () => Promise<void>;
      getGameDeals: (title: string) => Promise<any[]>;
      openExternal: (url: string) => Promise<boolean>;
      getGlobalRankings: () => Promise<any>;
      getTrayData: () => Promise<{ recentGames: any[], installedGames: any[], backlogGames: any[], discordEnabled: boolean }>;
      hideTrayWindow: () => Promise<void>;
      quitApp: () => Promise<void>;
      showMainWindow: () => Promise<void>;
      forceCloudBackup: () => Promise<boolean>;
      onAppRestored: (callback: () => void) => () => void;
    }
  }
}