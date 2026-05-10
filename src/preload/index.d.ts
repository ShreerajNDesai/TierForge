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
      scanPC: () => Promise<boolean>;
      getExtendedDetails: (id: string) => Promise<any>;
      updateGameData: (id: string, notes: string, status: string) => Promise<boolean>;
      getTimeToBeat: (name: string) => Promise<any>;
      getDiscoverGames: (filterType: string, offset: number) => Promise<any[]>;
      launchGame: (path: string, gameId: string) => Promise<boolean>;
      getPlaytime: (gameId: string) => Promise<number>;
      onGameStarted: (callback: (gameId: string) => void) => () => void;
      onGameStopped: (callback: (gameId: string, totalPlaytime: number) => void) => () => void;
      getSetting: (key: string) => Promise<string | null>;
      saveSetting: (key: string, value: string) => Promise<boolean>;
      browseImage: () => Promise<string | null>;
      analyzeImage: (imagePath: string, apiKey: string) => Promise<string[]>;
      bulkImportText: (text: string) => Promise<string[]>;
      getAIRecommendations: () => Promise<{ error: string | null; recommendations: any[] }>;
      getScrapedRankings: () => Promise<any>;
      
      // Window Controls
      windowMinimize: () => Promise<void>;
      windowMaximize: () => Promise<void>;
      windowClose: () => Promise<void>;
      getGameDeals: (title: string) => Promise<any[]>;
      openExternal: (url: string) => Promise<boolean>;
      getGlobalRankings: () => Promise<any>;
    }
  }
}