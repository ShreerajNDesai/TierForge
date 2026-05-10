import React, { createContext, useContext, useState, useEffect, useRef, useMemo, ReactNode } from 'react';

const emptyData = {
  tiers: {
    s: { id: 's', title: 'S-Tier', sub: 'Masterpiece', color: 'bg-rose-500', items: [] },
    a: { id: 'a', title: 'A-Tier', sub: 'Excellent', color: 'bg-orange-500', items: [] },
    b: { id: 'b', title: 'B-Tier', sub: 'Great', color: 'bg-yellow-500', items: [] },
    c: { id: 'c', title: 'C-Tier', sub: 'Good', color: 'bg-green-500', items: [] },
    d: { id: 'd', title: 'D-Tier', sub: 'Mediocre', color: 'bg-sky-500', items: [] },
    f: { id: 'f', title: 'F-Tier', sub: 'Terrible', color: 'bg-red-800', items: [] },
    dropped: { id: 'dropped', title: 'Dropped', sub: 'Not For Me', color: 'bg-slate-600', items: [] },
  },
  collection: []
};

interface GlobalContextType {
  data: any;
  setData: React.Dispatch<React.SetStateAction<any>>;
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  searchResults: any[];
  setSearchResults: React.Dispatch<React.SetStateAction<any[]>>;
  isDraggingItem: boolean;
  setIsDraggingItem: React.Dispatch<React.SetStateAction<boolean>>;
  isScanning: boolean;
  setIsScanning: React.Dispatch<React.SetStateAction<boolean>>;
  selectedGame: any;
  setSelectedGame: React.Dispatch<React.SetStateAction<any>>;
  gameDetails: any;
  setGameDetails: React.Dispatch<React.SetStateAction<any>>;
  isVideoMode: boolean;
  setIsVideoMode: React.Dispatch<React.SetStateAction<boolean>>;
  isMuted: boolean;
  setIsMuted: React.Dispatch<React.SetStateAction<boolean>>;
  currentVideoId: string;
  setCurrentVideoId: React.Dispatch<React.SetStateAction<string>>;
  activeTab: string;
  setActiveTab: React.Dispatch<React.SetStateAction<string>>;
  bgMode: 'video' | 'image';
  setBgMode: React.Dispatch<React.SetStateAction<'video' | 'image'>>;
  sortOrder: 'none' | 'asc' | 'desc';
  setSortOrder: React.Dispatch<React.SetStateAction<'none' | 'asc' | 'desc'>>;
  filterStatus: 'All' | 'Playing' | 'Completed' | 'Backlog';
  setFilterStatus: React.Dispatch<React.SetStateAction<'All' | 'Playing' | 'Completed' | 'Backlog'>>;
  isStatusDropdownOpen: boolean;
  setIsStatusDropdownOpen: React.Dispatch<React.SetStateAction<boolean>>;
  galleryIndex: number;
  setGalleryIndex: React.Dispatch<React.SetStateAction<number>>;
  timeToBeat: any;
  setTimeToBeat: React.Dispatch<React.SetStateAction<any>>;
  discoverGames: any[];
  setDiscoverGames: React.Dispatch<React.SetStateAction<any[]>>;
  discoverFilter: string;
  setDiscoverFilter: React.Dispatch<React.SetStateAction<string>>;
  isDiscoverLoading: boolean;
  setIsDiscoverLoading: React.Dispatch<React.SetStateAction<boolean>>;
  discoverOffset: number;
  setDiscoverOffset: React.Dispatch<React.SetStateAction<number>>;
  hasMoreDiscover: boolean;
  setHasMoreDiscover: React.Dispatch<React.SetStateAction<boolean>>;
  defaultMuted: boolean;
  setDefaultMuted: React.Dispatch<React.SetStateAction<boolean>>;
  libraryGames: any[];
  setLibraryGames: React.Dispatch<React.SetStateAction<any[]>>;
  librarySearch: string;
  setLibrarySearch: React.Dispatch<React.SetStateAction<string>>;
  suggestedGame: any;
  setSuggestedGame: React.Dispatch<React.SetStateAction<any>>;
  showImportModal: boolean;
  setShowImportModal: React.Dispatch<React.SetStateAction<boolean>>;
  importText: string;
  setImportText: React.Dispatch<React.SetStateAction<string>>;
  isImporting: boolean;
  setIsImporting: React.Dispatch<React.SetStateAction<boolean>>;
  geminiKey: string;
  setGeminiKey: React.Dispatch<React.SetStateAction<string>>;
  rawgKey: string;
  setRawgKey: React.Dispatch<React.SetStateAction<string>>;
  igdbClientId: string;
  setIgdbClientId: React.Dispatch<React.SetStateAction<string>>;
  igdbClientSecret: string;
  setIgdbClientSecret: React.Dispatch<React.SetStateAction<string>>;
  globalRankings: any;
  setGlobalRankings: React.Dispatch<React.SetStateAction<any>>;
  rankingsLoading: boolean;
  setRankingsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  rankingsGenre: string;
  setRankingsGenre: React.Dispatch<React.SetStateAction<string>>;
  scrapedRankings: any[];
  setScrapedRankings: React.Dispatch<React.SetStateAction<any[]>>;
  oracleRecs: any[];
  setOracleRecs: React.Dispatch<React.SetStateAction<any[]>>;
  oracleLoading: boolean;
  setOracleLoading: React.Dispatch<React.SetStateAction<boolean>>;
  oracleError: string | null;
  setOracleError: React.Dispatch<React.SetStateAction<string | null>>;
  oraclePhase: string;
  setOraclePhase: React.Dispatch<React.SetStateAction<string>>;
  runningGameId: string | null;
  setRunningGameId: React.Dispatch<React.SetStateAction<string | null>>;
  gamePlaytime: number;
  setGamePlaytime: React.Dispatch<React.SetStateAction<number>>;
  gameDeals: any[];
  setGameDeals: React.Dispatch<React.SetStateAction<any[]>>;
  videoError: boolean;
  setVideoError: React.Dispatch<React.SetStateAction<boolean>>;
  iframeRef: React.RefObject<HTMLIFrameElement>;

  loadGames: () => Promise<void>;
  handleGameClick: (game: any) => Promise<void>;
  handleSearch: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleAddGame: (game: any) => Promise<void>;
  handleScanPC: () => Promise<void>;
  handleSaveGameData: (field: 'notes' | 'status', value: string) => Promise<void>;
  onDragStart: () => void;
  onDragEnd: (result: any) => Promise<void>;
  handleAIImport: () => Promise<void>;
  handleTextImport: () => Promise<void>;
  handleSortClick: () => void;
  handleFilterClick: () => void;
  toggleMute: () => void;
  filteredAndSortedCollection: any[];
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

export const GlobalProvider = ({ children }: { children: ReactNode }) => {
  const [data, setData] = useState<any>(emptyData);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isDraggingItem, setIsDraggingItem] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedGame, setSelectedGame] = useState<any>(null);
  const [gameDetails, setGameDetails] = useState<any>(null);
  const [isVideoMode, setIsVideoMode] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [currentVideoId, setCurrentVideoId] = useState<string>('');
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [activeTab, setActiveTab] = useState('tierlist');
  const [bgMode, setBgMode] = useState<'video' | 'image'>((localStorage.getItem('bgMode') as 'video' | 'image') || 'video');
  const [sortOrder, setSortOrder] = useState<'none' | 'asc' | 'desc'>('none');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Playing' | 'Completed' | 'Backlog'>('All');
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [timeToBeat, setTimeToBeat] = useState<any>(null);
  const [discoverGames, setDiscoverGames] = useState<any[]>([]);
  const [discoverFilter, setDiscoverFilter] = useState('popular');
  const [isDiscoverLoading, setIsDiscoverLoading] = useState(false);
  const [discoverOffset, setDiscoverOffset] = useState(0);
  const [hasMoreDiscover, setHasMoreDiscover] = useState(true);
  const [defaultMuted, setDefaultMuted] = useState<boolean>(localStorage.getItem('defaultMuted') === 'true');
  const [libraryGames, setLibraryGames] = useState<any[]>([]);
  const [librarySearch, setLibrarySearch] = useState('');
  const [suggestedGame, setSuggestedGame] = useState<any>(null);

  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [geminiKey, setGeminiKey] = useState('');
  const [rawgKey, setRawgKey] = useState('');
  const [igdbClientId, setIgdbClientId] = useState('');
  const [igdbClientSecret, setIgdbClientSecret] = useState('');
  const [globalRankings, setGlobalRankings] = useState<any>(null);
  const [rankingsLoading, setRankingsLoading] = useState(false);
  const [rankingsGenre, setRankingsGenre] = useState('overall');
  const [scrapedRankings, setScrapedRankings] = useState<any[]>([]);

  const [oracleRecs, setOracleRecs] = useState<any[]>([]);
  const [oracleLoading, setOracleLoading] = useState(false);
  const [oracleError, setOracleError] = useState<string | null>(null);
  const [oraclePhase, setOraclePhase] = useState('');

  const [runningGameId, setRunningGameId] = useState<string | null>(null);
  const [gamePlaytime, setGamePlaytime] = useState<number>(0);
  const [gameDeals, setGameDeals] = useState<any[]>([]);
  const [videoError, setVideoError] = useState(false);

  useEffect(() => {
    window.api.getSetting('geminiKey').then((key: string | null) => {
      if (key) setGeminiKey(key);
    });
    window.api.getSetting('rawg_key').then((key: string | null) => {
      if (key) setRawgKey(key);
    });
    window.api.getSetting('igdb_client_id').then((key: string | null) => {
      if (key) setIgdbClientId(key);
    });
    window.api.getSetting('igdb_client_secret').then((key: string | null) => {
      if (key) setIgdbClientSecret(key);
    });

    const cleanupStarted = window.api.onGameStarted((gameId: string) => {
      setRunningGameId(gameId);
    });
    const cleanupStopped = window.api.onGameStopped((gameId: string, totalPlaytime: number) => {
      setRunningGameId(null);
      setGamePlaytime(totalPlaytime);
      loadGames();
    });

    return () => {
      cleanupStarted();
      cleanupStopped();
    };
  }, []);

  useEffect(() => {
    const handleYTMessage = (e: MessageEvent) => {
      try {
        if (typeof e.data === 'string' && e.data.includes('"event":"onError"')) {
          setVideoError(true);
        }
        if (typeof e.data === 'string') {
          const parsed = JSON.parse(e.data);
          if (parsed?.event === 'onError' || parsed?.info === 150 || parsed?.info === 100) {
            setVideoError(true);
          }
        }
      } catch (_) { /* not a YT message */ }
    };
    window.addEventListener('message', handleYTMessage);
    return () => window.removeEventListener('message', handleYTMessage);
  }, []);

  useEffect(() => {
    if (activeTab === 'rankings') {
      const fetchRanking = async () => {
        // If we already have this genre in globalRankings, don't trigger loading unless it's empty
        if (globalRankings && globalRankings[rankingsGenre]) return;

        setRankingsLoading(true);
        try {
          const data = await window.api.getCachedRankings(rankingsGenre);
          setGlobalRankings((prev: any) => ({
            ...(prev || {}),
            [rankingsGenre]: data
          }));
        } catch (err) {
          console.error("Failed to fetch rankings:", err);
        } finally {
          setRankingsLoading(false);
        }
      };
      fetchRanking();
    }
  }, [activeTab, rankingsGenre]);

  useEffect(() => {
    const handleRightClick = (e: MouseEvent) => {
      e.preventDefault();
      if (showImportModal && !isImporting) {
        setShowImportModal(false);
      } else if (selectedGame) {
        setSelectedGame(null);
        setTimeToBeat(null);
      } else if (isStatusDropdownOpen) {
        setIsStatusDropdownOpen(false);
      } else if (searchResults.length > 0 || searchQuery) {
        setSearchQuery('');
        setSearchResults([]);
        setLibrarySearch('');
      }
    };
    window.addEventListener('contextmenu', handleRightClick);
    return () => window.removeEventListener('contextmenu', handleRightClick);
  }, [showImportModal, isImporting, selectedGame, isStatusDropdownOpen, searchResults, searchQuery]);

  const loadGames = async () => {
    const dbGames = await window.api.getAllGames();
    const newData = JSON.parse(JSON.stringify(emptyData));

    dbGames.forEach((game: any) => {
      const gameObj = { id: game.id, title: game.title, img: game.image_url, notes: game.notes || '', status: game.status || 'Backlog', executable_path: game.executable_path || '' };
      if (game.tier === 'unranked' || !newData.tiers[game.tier]) {
        newData.collection.push(gameObj);
      } else {
        newData.tiers[game.tier].items.push(gameObj);
      }
    });
    setData(newData);
  };

  useEffect(() => {
    loadGames();
  }, []);

  useEffect(() => {
    if (activeTab === 'library' || activeTab === 'statistics') {
      window.api.getAllGames().then((games: any[]) => {
        setLibraryGames(games);
        const backlogGames = games.filter(g => (g.status || 'Backlog') === 'Backlog');
        const installedBacklog = backlogGames.filter(g => g.executable_path && g.executable_path.trim() !== '');
        const pool = installedBacklog.length > 0 ? installedBacklog : backlogGames;
        if (pool.length > 0) {
          const randomGame = pool[Math.floor(Math.random() * pool.length)];
          setSuggestedGame(randomGame);
        } else {
          setSuggestedGame(null);
        }
      });
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'discover') {
      setIsDiscoverLoading(true);
      window.api.getDiscoverGames(discoverFilter, discoverOffset).then((games: any) => {
        if (discoverOffset === 0) {
          setDiscoverGames(games);
        } else {
          setDiscoverGames(prev => [...prev, ...games]);
        }
        setHasMoreDiscover(games.length === 30);
        setIsDiscoverLoading(false);
      });
    }
  }, [activeTab, discoverFilter, discoverOffset]);

  const filteredAndSortedCollection = useMemo(() => {
    let result = [...data.collection];
    if (filterStatus !== 'All') {
      result = result.filter(item => item.status === filterStatus);
    }
    if (sortOrder === 'asc') {
      result.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortOrder === 'desc') {
      result.sort((a, b) => b.title.localeCompare(a.title));
    }
    return result;
  }, [data.collection, filterStatus, sortOrder]);

  const handleSortClick = () => {
    if (sortOrder === 'none') setSortOrder('asc');
    else if (sortOrder === 'asc') setSortOrder('desc');
    else setSortOrder('none');
  };

  const handleFilterClick = () => {
    if (filterStatus === 'All') setFilterStatus('Playing');
    else if (filterStatus === 'Playing') setFilterStatus('Completed');
    else if (filterStatus === 'Completed') setFilterStatus('Backlog');
    else setFilterStatus('All');
  };

  const toggleMute = () => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      const func = isMuted ? 'unMute' : 'mute';
      iframeRef.current.contentWindow.postMessage(`{"event":"command","func":"${func}","args":""}`, '*');
      setIsMuted(!isMuted);
    }
  };

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.length > 2) {
      const results = await window.api.searchGames(query);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };

  const handleAddGame = async (game: any) => {
    await window.api.addGame(game.id, game.title, game.image_url);
    setSearchQuery('');
    setSearchResults([]);
    loadGames();
  };

  const handleScanPC = async () => {
    setIsScanning(true);
    await window.api.scanPC();
    await loadGames();
    setIsScanning(false);
  };

  const handleGameClick = async (game: any) => {
    setSelectedGame(game);
    setGameDetails(null);
    setIsVideoMode(false);
    setIsMuted(defaultMuted);
    setCurrentVideoId('');
    setTimeToBeat(null);
    setGamePlaytime(0);
    setGameDeals([]);
    setVideoError(false);

    window.api.getPlaytime(game.id.toString()).then((pt: number) => setGamePlaytime(pt));

    if (!game.executable_path || game.executable_path.trim() === '') {
      window.api.getGameDeals(game.title).then((deals: any[]) => setGameDeals(deals || []));
    }
    window.api.getTimeToBeat(game.title).then(setTimeToBeat).catch(() => setTimeToBeat(null));

    const details = await window.api.getExtendedDetails(game.id);
    if (details) {
      setCurrentVideoId(details.video_id);
      setGameDetails({ ...game, ...details, notes: game.notes, status: game.status });
    } else {
      setGameDetails({ ...game, summary: 'No details found.', genres: 'Unknown', year: 'Unknown', background_url: '' });
    }
  };

  const handleSaveGameData = async (field: 'notes' | 'status', value: string) => {
    if (!gameDetails) return;
    const newDetails = { ...gameDetails, [field]: value };
    setGameDetails(newDetails);

    setData((prev: any) => {
      const newData = JSON.parse(JSON.stringify(prev));
      const collGame = newData.collection.find((g: any) => g.id === gameDetails.id);
      if (collGame) collGame[field] = value;
      Object.values(newData.tiers).forEach((tier: any) => {
        const tierGame = tier.items.find((g: any) => g.id === gameDetails.id);
        if (tierGame) tierGame[field] = value;
      });
      return newData;
    });

    await window.api.updateGameData(
      gameDetails.id,
      field === 'notes' ? value : gameDetails.notes,
      field === 'status' ? value : gameDetails.status
    );
  };

  const onDragStart = () => {
    setIsDraggingItem(true);
  };

  const onDragEnd = async (result: any) => {
    setIsDraggingItem(false);

    const { source, destination } = result;
    if (!destination) return;

    if (source.droppableId === 'search-results') {
      if (destination.droppableId === 'search-results' || destination.droppableId === 'trash') return;

      const game = searchResults[source.index];
      const newItem = { id: game.id.toString(), title: game.title, img: game.image_url };

      setData((prev: any) => {
        const newData = { ...prev, tiers: { ...prev.tiers } };
        if (destination.droppableId === 'collection') {
          newData.collection = [...prev.collection];
          newData.collection.splice(destination.index, 0, newItem);
        } else {
          newData.tiers[destination.droppableId] = { ...prev.tiers[destination.droppableId] };
          newData.tiers[destination.droppableId].items = [...prev.tiers[destination.droppableId].items];
          newData.tiers[destination.droppableId].items.splice(destination.index, 0, newItem);
        }
        return newData;
      });

      setSearchResults([]);
      setSearchQuery('');

      await window.api.addGame(game.id.toString(), game.title, game.image_url);
      const newTier = destination.droppableId === 'collection' ? 'unranked' : destination.droppableId;
      if (newTier !== 'unranked') {
        await window.api.updateGameTier(game.id.toString(), newTier);
      }
      return;
    }

    let sourceList = source.droppableId === 'collection' ? Array.from(data.collection) : Array.from(data.tiers[source.droppableId].items);
    const [movedItem]: any = sourceList.splice(source.index, 1);

    if (destination.droppableId === 'trash') {
      setData((prev: any) => {
        const newData = { ...prev };
        if (source.droppableId === 'collection') newData.collection = sourceList;
        else newData.tiers[source.droppableId].items = sourceList;
        return newData;
      });
      await window.api.deleteGame(movedItem.id);
      return;
    }

    let destList = destination.droppableId === 'collection' ? Array.from(data.collection) : Array.from(data.tiers[destination.droppableId].items);

    if (source.droppableId === destination.droppableId) {
      sourceList.splice(destination.index, 0, movedItem);
      destList = sourceList;
    } else {
      destList.splice(destination.index, 0, movedItem);
    }

    setData((prev: any) => {
      const newData = { ...prev };
      if (source.droppableId === 'collection') newData.collection = sourceList;
      else newData.tiers[source.droppableId].items = sourceList;

      if (destination.droppableId === 'collection') newData.collection = destList;
      else newData.tiers[destination.droppableId].items = destList;
      return newData;
    });

    const newTier = destination.droppableId === 'collection' ? 'unranked' : destination.droppableId;
    await window.api.updateGameTier(movedItem.id, newTier);
  };

  const handleAIImport = async () => {
    const imagePath = await window.api.browseImage();
    if (imagePath) {
      if (!geminiKey) {
        alert('Please enter your Gemini API Key first.');
        return;
      }
      setIsImporting(true);
      await window.api.analyzeImage(imagePath, geminiKey);
      await loadGames();
      setIsImporting(false);
      setShowImportModal(false);
    }
  };

  const handleTextImport = async () => {
    if (!importText.trim()) return;
    setIsImporting(true);
    await window.api.bulkImportText(importText);
    await loadGames();
    setIsImporting(false);
    setShowImportModal(false);
    setImportText('');
  };

  const value = {
    data, setData, searchQuery, setSearchQuery, searchResults, setSearchResults,
    isDraggingItem, setIsDraggingItem, isScanning, setIsScanning,
    selectedGame, setSelectedGame, gameDetails, setGameDetails,
    isVideoMode, setIsVideoMode, isMuted, setIsMuted, currentVideoId, setCurrentVideoId,
    activeTab, setActiveTab, bgMode, setBgMode, sortOrder, setSortOrder,
    filterStatus, setFilterStatus, isStatusDropdownOpen, setIsStatusDropdownOpen,
    galleryIndex, setGalleryIndex, timeToBeat, setTimeToBeat,
    discoverGames, setDiscoverGames, discoverFilter, setDiscoverFilter,
    isDiscoverLoading, setIsDiscoverLoading, discoverOffset, setDiscoverOffset,
    hasMoreDiscover, setHasMoreDiscover, defaultMuted, setDefaultMuted,
    libraryGames, setLibraryGames, librarySearch, setLibrarySearch,
    suggestedGame, setSuggestedGame, showImportModal, setShowImportModal,
    importText, setImportText, isImporting, setIsImporting,
    geminiKey, setGeminiKey, rawgKey, setRawgKey, igdbClientId, setIgdbClientId,
    igdbClientSecret, setIgdbClientSecret, globalRankings, setGlobalRankings,
    rankingsLoading, setRankingsLoading, rankingsGenre, setRankingsGenre,
    scrapedRankings, setScrapedRankings, oracleRecs, setOracleRecs,
    oracleLoading, setOracleLoading, oracleError, setOracleError,
    oraclePhase, setOraclePhase, runningGameId, setRunningGameId,
    gamePlaytime, setGamePlaytime, gameDeals, setGameDeals,
    videoError, setVideoError, iframeRef,
    loadGames, handleGameClick, handleSearch, handleAddGame,
    handleScanPC, handleSaveGameData, onDragStart, onDragEnd,
    handleAIImport, handleTextImport, handleSortClick, handleFilterClick, toggleMute,
    filteredAndSortedCollection
  };

  return (
    <GlobalContext.Provider value={value}>
      {children}
    </GlobalContext.Provider>
  );
};

export const useGlobal = () => {
  const context = useContext(GlobalContext);
  if (context === undefined) {
    throw new Error('useGlobal must be used within a GlobalProvider');
  }
  return context;
};
