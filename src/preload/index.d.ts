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
    }
  }
}