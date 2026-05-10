import React, { useState, useEffect, useRef, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { 
  Gamepad2, LayoutGrid, Trophy, Bot, BarChart2, Settings, 
  Search, Bell, Download, Filter, ArrowUpDown, Plus, Check, Trash2, RefreshCw,
  Library, ChevronDown, Minus, Square, X, Crown, Star, Diamond, Menu, Grid, List,
  PlayCircle, Volume2, VolumeX, Clock, UploadCloud, FileText, Sparkles,
  ThumbsDown, Skull, Ban, Wand2, ExternalLink, Tag, Monitor
} from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const emptyData = {
  tiers: {
    s: { id: 's', title: 'S-Tier', sub: 'Masterpiece', color: 'bg-rose-500', items:[] },
    a: { id: 'a', title: 'A-Tier', sub: 'Excellent', color: 'bg-orange-500', items:[] },
    b: { id: 'b', title: 'B-Tier', sub: 'Great', color: 'bg-yellow-500', items:[] },
    c: { id: 'c', title: 'C-Tier', sub: 'Good', color: 'bg-green-500', items:[] },
    d: { id: 'd', title: 'D-Tier', sub: 'Mediocre', color: 'bg-sky-500', items:[] },
    f: { id: 'f', title: 'F-Tier', sub: 'Terrible', color: 'bg-red-800', items:[] },
    dropped: { id: 'dropped', title: 'Dropped', sub: 'Not For Me', color: 'bg-slate-600', items:[] },
  },
  collection:[]
};

export default function App() {
  const [data, setData] = useState<any>(emptyData);
  const [searchQuery, setSearchQuery] = useState('');
  const[searchResults, setSearchResults] = useState<any[]>([]);
  
  // NEW: State to track if the user is currently holding a game
  const[isDraggingItem, setIsDraggingItem] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedGame, setSelectedGame] = useState<any>(null);
  const [gameDetails, setGameDetails] = useState<any>(null);
  const [isVideoMode, setIsVideoMode] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [currentVideoId, setCurrentVideoId] = useState<string>('');
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [activeTab, setActiveTab] = useState('tierlist');
  const [bgMode, setBgMode] = useState<'video'|'image'>((localStorage.getItem('bgMode') as 'video'|'image') || 'video');
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

  // AI Oracle state
  const [oracleRecs, setOracleRecs] = useState<any[]>([]);
  const [oracleLoading, setOracleLoading] = useState(false);
  const [oracleError, setOracleError] = useState<string | null>(null);
  const [oraclePhase, setOraclePhase] = useState('');

  // Playtime tracking state
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

    // Listen for real-time game tracking events from backend
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

  // Listen for YouTube iframe API messages to detect age-restricted videos
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
    if (activeTab === 'rankings' && rankingsGenre === 'imdb' && scrapedRankings.length === 0) {
      setRankingsLoading(true);
      window.api.getScrapedRankings().then((data: any[]) => {
        setScrapedRankings(data);
        setRankingsLoading(false);
      }).catch(() => setRankingsLoading(false));
    }
  }, [activeTab, rankingsGenre]);

  // Right-click acts as a universal "dismiss/close" action
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
    if (activeTab === 'rankings' && !globalRankings && !rankingsLoading) {
      setRankingsLoading(true);
      window.api.getGlobalRankings().then((data: any) => {
        if (!data.error) setGlobalRankings(data);
        setRankingsLoading(false);
      }).catch(() => setRankingsLoading(false));
    }
  }, [activeTab]);

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

  const handleDiscoverScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 100 && !isDiscoverLoading && hasMoreDiscover) {
      setDiscoverOffset(prev => prev + 30);
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
    
    // Fetch playtime from database
    window.api.getPlaytime(game.id.toString()).then((pt: number) => setGamePlaytime(pt));
    
    // Fetch deals if game is not installed
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

  // NEW: Triggered the moment you pick up a game
  const onDragStart = () => {
    setIsDraggingItem(true);
  };

  // Triggered when you drop a game
  const onDragEnd = async (result: any) => {
    setIsDraggingItem(false); // Hide the trash bin immediately
    
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

    // NEW: Did they drop it in the trash bin?
    if (destination.droppableId === 'trash') {
      setData((prev: any) => {
        const newData = { ...prev };
        if (source.droppableId === 'collection') newData.collection = sourceList;
        else newData.tiers[source.droppableId].items = sourceList;
        return newData;
      });
      // Delete from local database
      await window.api.deleteGame(movedItem.id);
      return; 
    }

    // Normal dragging logic (between tiers)
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

  return (
    <DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className="flex h-screen text-slate-200 font-sans relative overflow-hidden" style={{ background: 'radial-gradient(circle at top right, #1a1638 0%, #0B0E14 40%)' }}>
      
      {/* SIDEBAR */}
      <aside className="w-[260px] bg-[#080B10]/95 backdrop-blur-2xl border-r border-slate-800/50 flex flex-col justify-between z-10 shrink-0">
        <div>
          <div className="flex items-center gap-3 p-8 text-2xl font-black text-white tracking-wide">
            <Gamepad2 className="text-indigo-500" size={32} />
            TierForge
          </div>
          
          <nav className="px-5 space-y-1 mt-2">
            <div 
              onClick={() => setActiveTab('tierlist')}
              className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl cursor-pointer relative overflow-hidden group transition ${activeTab === 'tierlist' ? 'bg-gradient-to-r from-indigo-600/20 to-purple-600/10 text-indigo-300 border border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.15)]' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'}`}
            >
              {activeTab === 'tierlist' && <div className="absolute inset-0 bg-indigo-500/10 group-hover:bg-indigo-500/20 transition-colors"></div>}
              <LayoutGrid size={20} className={activeTab === 'tierlist' ? 'text-indigo-400 relative z-10' : ''} /> <span className="font-semibold text-sm relative z-10">Tier List</span>
            </div>
            <div 
              onClick={() => setActiveTab('discover')}
              className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl cursor-pointer relative overflow-hidden group transition ${activeTab === 'discover' ? 'bg-gradient-to-r from-indigo-600/20 to-purple-600/10 text-indigo-300 border border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.15)]' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'}`}
            >
              {activeTab === 'discover' && <div className="absolute inset-0 bg-indigo-500/10 group-hover:bg-indigo-500/20 transition-colors"></div>}
              <Bot size={20} className={activeTab === 'discover' ? 'text-indigo-400 relative z-10' : ''} /> <span className="font-semibold text-sm relative z-10">Discover</span>
            </div>
            <div 
              onClick={() => setActiveTab('oracle')}
              className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl cursor-pointer relative overflow-hidden group transition mt-1 ${activeTab === 'oracle' ? 'bg-gradient-to-r from-purple-600/20 to-pink-600/10 text-purple-300 border border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.15)]' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'}`}
            >
              {activeTab === 'oracle' && <div className="absolute inset-0 bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors"></div>}
              <Wand2 size={20} className={activeTab === 'oracle' ? 'text-purple-400 relative z-10' : ''} /> <span className="font-semibold text-sm relative z-10">AI Oracle</span>
            </div>
            <div 
              onClick={() => setActiveTab('library')}
              className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl cursor-pointer relative overflow-hidden group transition mt-1 ${activeTab === 'library' ? 'bg-gradient-to-r from-indigo-600/20 to-purple-600/10 text-indigo-300 border border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.15)]' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'}`}
            >
              {activeTab === 'library' && <div className="absolute inset-0 bg-indigo-500/10 group-hover:bg-indigo-500/20 transition-colors"></div>}
              <Library size={20} className={activeTab === 'library' ? 'text-indigo-400 relative z-10' : ''} /> <span className="font-semibold text-sm relative z-10">Library</span>
            </div>
            <div 
              onClick={() => setActiveTab('rankings')}
              className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl cursor-pointer relative overflow-hidden group transition mt-1 ${activeTab === 'rankings' ? 'bg-gradient-to-r from-yellow-600/20 to-amber-600/10 text-yellow-300 border border-yellow-500/30 shadow-[0_0_20px_rgba(234,179,8,0.15)]' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'}`}
            >
              {activeTab === 'rankings' && <div className="absolute inset-0 bg-yellow-500/10 group-hover:bg-yellow-500/20 transition-colors"></div>}
              <Trophy size={20} className={activeTab === 'rankings' ? 'text-yellow-400 relative z-10' : ''} /> <span className="font-semibold text-sm relative z-10">Rankings</span>
            </div>
            <div 
              onClick={() => setActiveTab('statistics')}
              className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl cursor-pointer relative overflow-hidden group transition mt-1 ${activeTab === 'statistics' ? 'bg-gradient-to-r from-indigo-600/20 to-purple-600/10 text-indigo-300 border border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.15)]' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'}`}
            >
              {activeTab === 'statistics' && <div className="absolute inset-0 bg-indigo-500/10 group-hover:bg-indigo-500/20 transition-colors"></div>}
              <BarChart2 size={20} className={activeTab === 'statistics' ? 'text-indigo-400 relative z-10' : ''} /> <span className="font-semibold text-sm relative z-10">Statistics</span>
            </div>
            <div 
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl cursor-pointer relative overflow-hidden group transition mt-6 ${activeTab === 'settings' ? 'bg-gradient-to-r from-indigo-600/20 to-purple-600/10 text-indigo-300 border border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.15)]' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'}`}
            >
              {activeTab === 'settings' && <div className="absolute inset-0 bg-indigo-500/10 group-hover:bg-indigo-500/20 transition-colors"></div>}
              <Settings size={20} className={activeTab === 'settings' ? 'text-indigo-400 relative z-10' : ''} /> <span className="font-medium text-sm relative z-10">Settings</span>
            </div>
          </nav>
        </div>
        
        {/* User Profile */}
        <div className="p-5 mb-2">
          <div className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-800/40 cursor-pointer transition border border-transparent hover:border-slate-800">
            <img src="https://i.pravatar.cc/150?img=33" alt="User" className="w-11 h-11 rounded-full border-2 border-indigo-500/40 shadow-lg" />
            <div className="flex-1">
              <div className="text-[13px] font-bold text-white flex items-center gap-2">
                PixelPlayer <span className="text-[9px] bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded-md font-bold uppercase border border-purple-500/30">Pro</span>
              </div>
              <div className="text-xs text-slate-400 mt-0.5">Level 24</div>
            </div>
            <ChevronDown size={16} className="text-slate-500" />
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        
        {/* HEADER */}
        <header className="h-20 flex items-center justify-between px-10 shrink-0" style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}>
          {/* Search Box - Left */}
          <div className="flex items-center" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
            <div className="flex items-center relative w-72 group">
              <Search className="absolute left-3.5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={16} />
              <input 
                type="text" 
                value={activeTab === 'library' ? librarySearch : searchQuery}
                onChange={(e) => {
                  if (activeTab === 'library') {
                    setLibrarySearch(e.target.value);
                  } else {
                    handleSearch(e);
                  }
                }}
                placeholder={activeTab === 'library' ? "Search your library..." : "Search games..."} 
                className="w-full bg-[#121620]/80 border border-slate-700/50 text-sm rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-indigo-500/50 focus:bg-[#151924]/90 text-slate-200 placeholder-slate-500 transition shadow-inner"
              />
              {searchResults.length > 0 && activeTab !== 'library' && (
                <Droppable droppableId="search-results" isDropDisabled={true}>
                  {(provided) => (
                    <div 
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="absolute top-14 left-0 w-full bg-[#121620] border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-[100]"
                    >
                      {searchResults.map((game, index) => (
                        <Draggable key={`search-${game.id}`} draggableId={`search-${game.id}`} index={index}>
                          {(provided, snapshot) => (
                            <div 
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              onClick={() => handleAddGame(game)}
                              className={`flex items-center gap-3 p-3 transition-colors ${
                                snapshot.isDragging ? 'bg-slate-800 shadow-2xl border border-indigo-400 rounded-lg z-[200]' : 'hover:bg-slate-800 bg-[#121620] cursor-pointer'
                              }`}
                            >
                              <img src={game.image_url} alt={game.title} className="w-8 h-12 object-cover rounded pointer-events-none" />
                              <span className="font-medium text-sm text-slate-200">{game.title}</span>
                              {data.collection.some((g: any) => g.id === game.id.toString()) || 
                               Object.values(data.tiers).some((tier: any) => tier.items.some((g: any) => g.id === game.id.toString())) ? (
                                <Check size={16} className="ml-auto text-green-400" />
                              ) : (
                                <Plus size={16} className="ml-auto text-indigo-400" />
                              )}
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              )}
            </div>
          </div>

          {/* Action Buttons - Right */}
          <div className="flex items-center gap-6" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
            <div className="flex items-center gap-5 text-slate-400">
              <button 
                onClick={async () => {
                  const key = await window.api.getSetting('geminiKey');
                  if (key) setGeminiKey(key);
                  setShowImportModal(true);
                }}
                className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 hover:text-indigo-200 rounded-lg text-sm font-medium transition"
              >
                <UploadCloud size={16} /> Import Hub
              </button>
              <button 
                onClick={handleScanPC}
                disabled={isScanning}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition relative overflow-hidden group ${
                  isScanning 
                    ? 'bg-purple-500/20 text-purple-400 cursor-not-allowed border border-purple-500/30' 
                    : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white border border-indigo-400/30'
                }`}
              >
                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors"></div>
                {isScanning ? (
                  <><RefreshCw size={14} className="animate-spin relative z-10" /> <span className="relative z-10">Scanning...</span></>
                ) : (
                  <><Download size={14} className="relative z-10" /> <span className="relative z-10">Scan PC</span></>
                )}
              </button>
              <div className="relative cursor-pointer hover:text-white transition">
                <Bell size={18} />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-purple-500 rounded-full border border-[#0B0E14]"></span>
              </div>
              <BarChart2 size={18} className="cursor-pointer hover:text-white transition" />
            </div>
            
            <div className="flex items-center gap-2 pl-6 border-l border-slate-800/80 text-slate-500">
              <div className="p-2 rounded-lg cursor-pointer hover:bg-slate-700/50 hover:text-white transition" onClick={() => window.api.windowMinimize()}>
                <Minus size={20} />
              </div>
              <div className="p-2 rounded-lg cursor-pointer hover:bg-slate-700/50 hover:text-white transition" onClick={() => window.api.windowMaximize()}>
                <Square size={16} />
              </div>
              <div className="p-2 rounded-lg cursor-pointer hover:bg-red-500/20 hover:text-red-400 transition" onClick={() => window.api.windowClose()}>
                <X size={20} />
              </div>
            </div>
          </div>
        </header>

        {/* SCROLLABLE CONTENT */}
        {activeTab === 'tierlist' && (
          <div className="flex-1 overflow-y-auto px-10 pb-12 pt-6 relative custom-scrollbar">
            
            {/* PAGE TITLE & ACTIONS */}
            <div className="flex justify-between items-end mb-10 px-1">
              <div>
                <h1 className="text-[34px] font-extrabold text-white flex items-center gap-4 tracking-tight leading-none mb-2">
                  Tier List <span className="text-[10px] bg-indigo-500/10 text-indigo-300 px-2.5 py-1 rounded-md font-semibold border border-indigo-500/20 tracking-wide uppercase align-middle relative -top-1">Drag & Drop to Rank</span>
                </h1>
                <p className="text-slate-400 text-[15px]">Create your ultimate game rankings</p>
              </div>
              
              <div className="flex items-center gap-3">
                {/* Inline Trash Bin */}
                <Droppable droppableId="trash">
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex items-center gap-2 px-4 py-2.5 mr-2 rounded-xl border-2 transition-colors duration-200 ${
                        isDraggingItem ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                      } ${
                        snapshot.isDraggingOver 
                          ? 'bg-red-500/20 border-red-500 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.3)]' 
                          : 'border-slate-700 border-dashed text-slate-400 bg-slate-800/30'
                      }`}
                    >
                      <Trash2 size={16} className={`transition-transform ${snapshot.isDraggingOver ? 'animate-bounce' : ''}`} />
                      <span className="text-[13px] font-bold tracking-wide">Drop to Delete</span>
                      <div className="hidden">{provided.placeholder}</div>
                    </div>
                  )}
                </Droppable>
              </div>
            </div>

            {/* TIER ROWS */}
            <div className="space-y-4 mb-12 px-1">
              {Object.values(data.tiers).map((tier: any) => {
                let TierIcon = Crown;
                if (tier.id === 'a') TierIcon = Star;
                if (tier.id === 'b') TierIcon = Diamond;
                if (tier.id === 'c') TierIcon = LayoutGrid;
                if (tier.id === 'd') TierIcon = ThumbsDown;
                if (tier.id === 'f') TierIcon = Skull;
                if (tier.id === 'dropped') TierIcon = Ban;
                
                let gradientBg = "bg-gradient-to-br from-[#F43F5E] to-[#E11D48]";
                if (tier.id === 'a') gradientBg = "bg-gradient-to-br from-[#F97316] to-[#EA580C]";
                if (tier.id === 'b') gradientBg = "bg-gradient-to-br from-[#EAB308] to-[#CA8A04]";
                if (tier.id === 'c') gradientBg = "bg-gradient-to-br from-[#10B981] to-[#059669]";
                if (tier.id === 'd') gradientBg = "bg-gradient-to-br from-[#0EA5E9] to-[#0284C7]";
                if (tier.id === 'f') gradientBg = "bg-gradient-to-br from-[#991B1B] to-[#7F1D1D]";
                if (tier.id === 'dropped') gradientBg = "bg-gradient-to-br from-[#475569] to-[#334155]";
                
                return (
                <div key={tier.id} className="flex bg-[#12151E] rounded-2xl border border-slate-700/50 shadow-xl overflow-hidden min-h-[145px] relative group">
                  {/* Subtle outer glow on hover */}
                  <div className="absolute inset-0 border border-indigo-500/0 group-hover:border-indigo-500/30 rounded-2xl transition-all duration-300 pointer-events-none"></div>
                  
                  <div className={`${gradientBg} w-[150px] p-6 flex flex-col justify-center relative overflow-hidden shrink-0 z-10 rounded-l-2xl shadow-[4px_0_25px_rgba(0,0,0,0.25)] border-r border-white/10`}>
                    <TierIcon className="absolute -right-4 -bottom-4 w-[110px] h-[110px] text-white opacity-10 rotate-[15deg] pointer-events-none" />
                    <h2 className="text-3xl font-black text-white tracking-tight drop-shadow-sm relative z-10 leading-none mb-1">{tier.title}</h2>
                    <p className="text-[13px] font-semibold text-white/90 drop-shadow-sm relative z-10">{tier.sub}</p>
                  </div>
                  
                  <Droppable droppableId={tier.id} direction="horizontal">
                    {(provided, snapshot) => (
                      <div ref={provided.innerRef} {...provided.droppableProps} className={`flex-1 flex flex-wrap items-center p-4 gap-4 relative ${snapshot.isDraggingOver ? 'bg-indigo-500/5' : ''}`}>
                        {tier.items.length === 0 && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-4">
                            <div className="w-full h-full rounded-xl border-2 border-dashed border-slate-700/60 flex items-center justify-center">
                              <span className="text-slate-500/80 text-[13px] font-medium tracking-wide">Drop game here</span>
                            </div>
                          </div>
                        )}
                        {tier.items.map((item: any, index: number) => (
                          <Draggable key={item.id} draggableId={item.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}
                                onClick={() => handleGameClick(item)}
                                className={`flex-shrink-0 w-[100px] h-[145px] rounded-[10px] overflow-hidden border border-slate-700/80 shadow-[0_4px_12px_rgba(0,0,0,0.3)] transition-colors duration-200 cursor-pointer ${
                                  snapshot.isDragging 
                                    ? 'shadow-2xl border-indigo-400 z-[100]' 
                                    : 'hover:border-slate-400 hover:shadow-lg'
                                }`}
                              >
                                <img src={item.img} alt={item.title} className="w-full h-full object-cover pointer-events-none" />
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                  
                  <div className="w-14 shrink-0 flex items-center justify-center border-l border-slate-700/40 text-slate-600 bg-[#0E1118]/50">
                    <Menu size={18} className="hover:text-slate-300 cursor-grab active:cursor-grabbing transition-colors" />
                  </div>
                </div>
              )})}
            </div>

            {/* COLLECTION AREA */}
            <div className="px-1 mb-10 bg-transparent">
              <div className="flex justify-between items-end mb-6">
                <div className="flex items-center gap-3">
                  <h3 className="text-[17px] font-extrabold text-white tracking-tight">Game Collection</h3>
                  <span className="bg-indigo-500/20 text-indigo-300 text-[11px] px-2.5 py-0.5 rounded-md font-bold border border-indigo-500/20">{data.collection.length}</span>
                </div>
                
                <div className="flex items-center gap-2.5">
                  <button onClick={handleFilterClick} className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-[13px] font-medium border transition ${filterStatus !== 'All' ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300' : 'border-slate-700/80 text-slate-300 hover:bg-slate-800/80'}`}>
                    <Filter size={14} /> {filterStatus === 'All' ? 'Filter' : filterStatus}
                  </button>
                  <button onClick={handleSortClick} className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-[13px] font-medium border transition ${sortOrder !== 'none' ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300' : 'border-slate-700/80 text-slate-300 hover:bg-slate-800/80'}`}>
                    <ArrowUpDown size={14} /> {sortOrder === 'none' ? 'Sort' : sortOrder === 'asc' ? 'A-Z' : 'Z-A'}
                  </button>
                  <div className="flex items-center border border-slate-700/80 rounded-lg p-0.5 ml-1 bg-[#121620]/50">
                    <button className="p-1.5 bg-slate-700/80 text-white rounded-md shadow-sm"><Grid size={15} /></button>
                    <button className="p-1.5 text-slate-400 hover:text-white rounded-md transition"><List size={15} /></button>
                  </div>
                </div>
              </div>

              <Droppable droppableId="collection" direction="horizontal">
                {(provided, snapshot) => (
                  <div ref={provided.innerRef} {...provided.droppableProps} className={`flex flex-wrap gap-[18px] min-h-[190px] p-2 -ml-2 rounded-2xl transition-colors ${snapshot.isDraggingOver ? 'bg-indigo-500/5' : ''}`}>
                    {filteredAndSortedCollection.map((item: any, index: number) => (
                      <Draggable key={item.id} draggableId={item.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}
                            onClick={() => handleGameClick(item)}
                            className={`flex-shrink-0 w-[115px] h-[170px] rounded-[10px] overflow-hidden border border-slate-700/80 shadow-lg transition-colors duration-200 cursor-pointer ${
                              snapshot.isDragging 
                                ? 'shadow-2xl border-indigo-400 z-[100]' 
                                : 'hover:border-slate-400 hover:shadow-[0_8px_20px_rgba(0,0,0,0.4)]'
                            }`}
                          >
                            <img src={item.img} alt={item.title} className="w-full h-full object-cover pointer-events-none" />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    
                    {/* ADD GAME PLACEHOLDER CARD / SCAN PC TRIGGER */}
                    <div 
                      onClick={handleScanPC}
                      className={`w-[115px] h-[170px] rounded-[10px] border-2 border-dashed flex flex-col items-center justify-center transition shadow-sm ${
                        isScanning
                          ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-400 cursor-not-allowed'
                          : 'border-slate-700/80 text-slate-500 hover:text-indigo-400 hover:border-indigo-500/50 hover:bg-indigo-500/5 cursor-pointer'
                      }`}
                    >
                      {isScanning ? (
                        <>
                          <RefreshCw size={24} className="mb-2 opacity-80 animate-spin" />
                          <span className="text-[12px] font-semibold tracking-wide text-center px-2 leading-tight">Scanning<br/>PC...</span>
                        </>
                      ) : (
                        <>
                          <Plus size={24} className="mb-2 opacity-80" />
                          <span className="text-[12px] font-semibold tracking-wide">Scan PC Games</span>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </Droppable>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="flex-1 overflow-y-auto px-10 pb-12 pt-10 relative custom-scrollbar">
            <h1 className="text-[34px] font-extrabold text-white mb-10 flex items-center gap-4 tracking-tight leading-none">
              Settings
            </h1>
            
            <div className="max-w-3xl bg-[#121620] border border-slate-700/60 rounded-3xl p-8 shadow-xl">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3 pb-4 border-b border-slate-700/50">
                <Settings size={22} className="text-indigo-400" />
                General Settings
              </h2>
              
              <div className="space-y-8">
                <div className="flex flex-col gap-4 max-w-md">
                  <div>
                    <label className="text-sm font-semibold text-slate-300 block mb-1">Cinematic Background Mode</label>
                    <p className="text-xs text-slate-500 mb-3">Choose whether the cinematic modal plays a live YouTube trailer or shows a high-res image.</p>
                  </div>
                  
                  <div className="flex bg-slate-800/50 p-1.5 rounded-xl border border-slate-700/50">
                    <button
                      onClick={() => {
                        setBgMode('video');
                        localStorage.setItem('bgMode', 'video');
                      }}
                      className={`flex-1 py-3 text-sm font-semibold rounded-lg transition ${bgMode === 'video' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      Live Video Trailer
                    </button>
                    <button
                      onClick={() => {
                        setBgMode('image');
                        localStorage.setItem('bgMode', 'image');
                      }}
                      className={`flex-1 py-3 text-sm font-semibold rounded-lg transition ${bgMode === 'image' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      High-Res Image
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-4 max-w-md pt-6 border-t border-slate-700/50">
                  <div>
                    <label className="text-sm font-semibold text-slate-300 block mb-1">Default Video Sound</label>
                    <p className="text-xs text-slate-500 mb-3">Choose whether background trailers start with sound on or muted by default.</p>
                  </div>
                  
                  <div className="flex bg-slate-800/50 p-1.5 rounded-xl border border-slate-700/50">
                    <button
                      onClick={() => {
                        setDefaultMuted(false);
                        localStorage.setItem('defaultMuted', 'false');
                      }}
                      className={`flex-1 py-3 text-sm font-semibold rounded-lg transition ${!defaultMuted ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      Sound On
                    </button>
                    <button
                      onClick={() => {
                        setDefaultMuted(true);
                        localStorage.setItem('defaultMuted', 'true');
                      }}
                      className={`flex-1 py-3 text-sm font-semibold rounded-lg transition ${defaultMuted ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      Muted
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-4 max-w-md pt-6 border-t border-slate-700/50">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles size={18} className="text-purple-400" />
                    <label className="text-sm font-semibold text-slate-300 block">Gemini API Key</label>
                  </div>
                  <p className="text-xs text-slate-500 mb-1">Required for AI Vision imports. Your key is stored securely in your local database.</p>
                  
                  <input 
                    type="password" 
                    value={geminiKey}
                    onChange={(e) => {
                      setGeminiKey(e.target.value);
                      window.api.saveSetting('geminiKey', e.target.value);
                    }}
                    placeholder="Enter Gemini API Key..." 
                    className="w-full bg-slate-800/50 border border-slate-700/50 text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500/50 text-slate-200 placeholder-slate-600 transition"
                  />
                </div>


                <div className="flex flex-col gap-4 max-w-md pt-6 border-t border-slate-700/50">
                  <div className="flex items-center gap-2 mb-1">
                    <Trophy size={18} className="text-yellow-400" />
                    <label className="text-sm font-semibold text-slate-300 block">RAWG.io API Key</label>
                  </div>
                  <p className="text-xs text-slate-500 mb-1">Required for the Global Rankings page. Get a free key at rawg.io/apidocs.</p>
                  
                  <input 
                    type="password" 
                    value={rawgKey}
                    onChange={(e) => {
                      setRawgKey(e.target.value);
                      window.api.saveSetting('rawg_key', e.target.value);
                    }}
                    placeholder="Enter RAWG.io API Key..." 
                    className="w-full bg-slate-800/50 border border-slate-700/50 text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-yellow-500/50 text-slate-200 placeholder-slate-600 transition"
                  />
                </div>

                <div className="flex flex-col gap-4 max-w-md pt-6 border-t border-slate-700/50">
                  <div className="flex items-center gap-2 mb-1">
                    <Gamepad2 size={18} className="text-indigo-400" />
                    <label className="text-sm font-semibold text-slate-300 block">IGDB (Twitch) API Integration</label>
                  </div>
                  <p className="text-xs text-slate-500 mb-1">Required for game search and cinematic details. Create an app at dev.twitch.tv.</p>
                  
                  <div className="space-y-3">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1.5 ml-1">Client ID</span>
                      <input 
                        type="password" 
                        value={igdbClientId}
                        onChange={(e) => {
                          setIgdbClientId(e.target.value);
                          window.api.saveSetting('igdb_client_id', e.target.value);
                        }}
                        placeholder="Enter IGDB Client ID..." 
                        className="w-full bg-slate-800/50 border border-slate-700/50 text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500/50 text-slate-200 placeholder-slate-600 transition"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1.5 ml-1">Client Secret</span>
                      <input 
                        type="password" 
                        value={igdbClientSecret}
                        onChange={(e) => {
                          setIgdbClientSecret(e.target.value);
                          window.api.saveSetting('igdb_client_secret', e.target.value);
                        }}
                        placeholder="Enter IGDB Client Secret..." 
                        className="w-full bg-slate-800/50 border border-slate-700/50 text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500/50 text-slate-200 placeholder-slate-600 transition"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* RANKINGS PAGE */}
        {activeTab === 'rankings' && (
          <div className="flex-1 overflow-y-auto px-10 pb-12 pt-10 relative custom-scrollbar">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-4xl font-black text-white mb-2 flex items-center gap-3">
                <Trophy className="text-yellow-400" size={36}/> Players' Choice Hall of Fame
              </h1>
              <p className="text-slate-400 text-[15px]">The highest user-rated games of all time — powered by millions of RAWG.io community votes.</p>
            </div>

            {!rawgKey ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Trophy size={64} className="text-slate-600 mb-4" />
                <h2 className="text-xl font-bold text-white mb-2">RAWG API Key Required</h2>
                <p className="text-slate-400 text-sm mb-4">Go to Settings and add your free RAWG.io API key to unlock global rankings.</p>
                <button onClick={() => setActiveTab('settings')} className="px-6 py-3 bg-yellow-600 hover:bg-yellow-500 text-white font-bold rounded-xl transition">
                  Open Settings
                </button>
              </div>
            ) : rankingsLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <RefreshCw size={48} className="text-yellow-400 animate-spin mb-4" />
                <p className="text-slate-300 text-lg font-semibold">Loading global rankings...</p>
              </div>
            ) : globalRankings ? (
              <>
                {/* Genre Filter Pills */}
                <div className="flex gap-3 mb-10">
                  {[
                    { key: 'overall', label: '👑 All Games', icon: Crown },
                    { key: 'rpg', label: '🗡️ RPGs', icon: Diamond },
                    { key: 'shooter', label: '🔫 Shooters', icon: Gamepad2 },
                    { key: 'action', label: '⚔️ Action', icon: Gamepad2 },
                    { key: 'imdb', label: '🎬 IMDb Top 20', icon: Star } // NEW SCRAPED PILL
                  ].map(genre => (
                    <button
                      key={genre.key}
                      onClick={() => setRankingsGenre(genre.key)}
                      className={`px-6 py-3 rounded-xl font-bold text-sm transition-all ${
                        rankingsGenre === genre.key
                          ? 'bg-gradient-to-r from-yellow-600 to-amber-600 text-white shadow-[0_0_20px_rgba(234,179,8,0.3)] scale-105'
                          : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {genre.label}
                    </button>
                  ))}
                </div>

                {/* Podium — Top 3 */}
                {globalRankings[rankingsGenre] && globalRankings[rankingsGenre].length >= 3 && (
                  <div className="flex gap-6 mb-10 items-end justify-center">
                    {[1, 0, 2].map(podiumIdx => {
                      const game = globalRankings[rankingsGenre][podiumIdx];
                      if (!game) return null;
                      const isFirst = podiumIdx === 0;
                      const medalColor = podiumIdx === 0 ? 'from-yellow-400 to-amber-500' : podiumIdx === 1 ? 'from-slate-300 to-slate-400' : 'from-amber-700 to-amber-800';
                      const medalBorder = podiumIdx === 0 ? 'border-yellow-500/60 shadow-[0_0_30px_rgba(234,179,8,0.3)]' : podiumIdx === 1 ? 'border-slate-400/40 shadow-[0_0_20px_rgba(148,163,184,0.2)]' : 'border-amber-700/40 shadow-[0_0_15px_rgba(180,83,9,0.15)]';
                      const rankLabel = podiumIdx === 0 ? '1st' : podiumIdx === 1 ? '2nd' : '3rd';
                      return (
                        <div
                          key={game.id}
                          onClick={async () => {
                            const matches = await window.api.searchGames(game.title);
                            if (matches && matches.length > 0) handleGameClick(matches[0]);
                          }}
                          className={`relative cursor-pointer group flex flex-col items-center ${isFirst ? 'w-64' : 'w-52'}`}
                        >
                          {/* Medal */}
                          <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${medalColor} flex items-center justify-center font-black text-lg shadow-xl mb-3 border-4 border-[#0B0E14]`}>
                            {podiumIdx === 0 ? <Crown size={22} /> : `#${podiumIdx + 1}`}
                          </div>

                          {/* Card */}
                          <div className={`relative w-full rounded-2xl overflow-hidden border-2 ${medalBorder} transition-all group-hover:scale-[1.03]`}>
                            <img src={game.img} alt={game.title} className={`w-full ${isFirst ? 'h-80' : 'h-64'} object-cover group-hover:scale-105 transition-transform duration-500`} />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>
                            
                            {/* Bottom info */}
                            <div className="absolute bottom-0 left-0 right-0 p-4">
                              <p className={`text-white font-black ${isFirst ? 'text-xl' : 'text-base'} truncate mb-1`}>{game.title}</p>
                              <p className="text-slate-400 text-xs truncate mb-2">{game.genres}</p>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  <Star size={14} className="text-yellow-400" fill="currentColor" />
                                  <span className="text-yellow-400 font-black text-sm">{game.rating.toFixed(2)}</span>
                                  <span className="text-slate-500 text-xs">/ 5</span>
                                </div>
                                <span className="text-[10px] text-slate-500 font-medium">{(game.ratingsCount || 0).toLocaleString()} votes</span>
                              </div>
                            </div>
                          </div>

                          {/* Rank label */}
                          <span className={`mt-3 text-xs font-black uppercase tracking-widest ${podiumIdx === 0 ? 'text-yellow-400' : podiumIdx === 1 ? 'text-slate-400' : 'text-amber-600'}`}>{rankLabel}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Leaderboard List — Rank 4+ */}
                <div className="space-y-2">
                  {(globalRankings[rankingsGenre] || []).slice(3).map((game: any, i: number) => {
                    const rank = i + 4;
                    const ratingPercent = (game.rating / 5) * 100;
                    return (
                      <div
                        key={game.id}
                        onClick={async () => {
                          const matches = await window.api.searchGames(game.title);
                          if (matches && matches.length > 0) handleGameClick(matches[0]);
                        }}
                        className="group flex items-center gap-5 bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 hover:border-yellow-500/20 rounded-xl px-5 py-3 cursor-pointer transition-all hover:shadow-[0_0_15px_rgba(234,179,8,0.05)]"
                      >
                        {/* Rank Number */}
                        <span className={`text-2xl font-black w-10 text-center shrink-0 ${rank <= 5 ? 'text-yellow-400/60' : 'text-slate-600'}`}>
                          {rank}
                        </span>

                        {/* Cover */}
                        <img src={game.img} alt={game.title} className="w-16 h-10 object-cover rounded-lg shrink-0 border border-white/10 group-hover:border-yellow-500/30 transition" />

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-bold text-[15px] truncate group-hover:text-yellow-200 transition-colors">{game.title}</p>
                          <p className="text-slate-500 text-xs truncate">{game.genres}</p>
                        </div>

                        {/* Rating Bar */}
                        <div className="w-32 shrink-0">
                          <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                            <div 
                              className="h-full rounded-full bg-gradient-to-r from-yellow-500 to-amber-400 transition-all"
                              style={{ width: `${ratingPercent}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Score */}
                        <div className="flex items-center gap-1.5 shrink-0 w-20 justify-end">
                          <Star size={13} className="text-yellow-400" fill="currentColor" />
                          <span className="text-yellow-400 font-black text-sm">{game.rating.toFixed(2)}</span>
                        </div>

                        {/* Votes */}
                        <span className="text-[11px] text-slate-500 font-medium shrink-0 w-20 text-right">{(game.ratingsCount || 0).toLocaleString()} votes</span>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : null}
          </div>
        )}

        {/* DISCOVER PAGE */}
        {activeTab === 'discover' && (
          <div 
            onScroll={handleDiscoverScroll}
            className="flex-1 overflow-y-auto px-10 pb-12 pt-6 relative custom-scrollbar"
          >
            <div className="flex justify-between items-end mb-6 px-1">
              <div>
                <h1 className="text-[34px] font-extrabold text-white flex items-center gap-4 tracking-tight leading-none mb-2">
                  Discover <span className="text-[10px] bg-indigo-500/10 text-indigo-300 px-2.5 py-1 rounded-md font-semibold border border-indigo-500/20 tracking-wide uppercase align-middle relative -top-1">Find new games</span>
                </h1>
                <p className="text-slate-400 text-[15px]">Explore the IGDB database for your next adventure</p>
              </div>
            </div>

            {/* Filter Row */}
            <div className="flex gap-3 overflow-x-auto pb-4 mb-6 flex-nowrap custom-scrollbar">
              {[
                { id: 'popular', label: '🔥 Top Rated' },
                { id: 'highly_rated', label: '🏆 Masterpieces' },
                { id: 'new', label: '✨ New Releases' },
                { id: 'upcoming', label: '📅 Upcoming' },
                { id: 'action', label: '⚔️ Action' },
                { id: 'adventure', label: '🗺️ Adventure' },
                { id: 'rpg', label: '🗡️ RPGs' },
                { id: 'shooter', label: '🔫 Shooters' },
                { id: 'strategy', label: '♟️ Strategy' },
                { id: 'indie', label: '💎 Indie Gems' }
              ].map(filter => (
                <button
                  key={filter.id}
                  onClick={() => {
                    setDiscoverFilter(filter.id);
                    setDiscoverOffset(0);
                    setHasMoreDiscover(true);
                  }}
                  className={`px-5 py-2.5 rounded-full font-semibold text-sm whitespace-nowrap shrink-0 transition-all ${
                    discoverFilter === filter.id 
                      ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]' 
                      : 'bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-5 gap-6">
              {(isDiscoverLoading && discoverOffset === 0) ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="animate-pulse bg-white/5 rounded-2xl h-72 border border-white/5"></div>
                ))
              ) : (
                <>
                  {discoverGames.map(game => (
                    <div 
                      key={game.id} 
                      onClick={() => handleGameClick(game)}
                      className="group relative cursor-pointer"
                    >
                      <div className="w-full h-72 rounded-2xl overflow-hidden shadow-lg border border-slate-700/50 group-hover:border-indigo-500/50 transition duration-300 relative">
                        <img src={game.image_url} alt={game.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                          {data.collection.some((g: any) => g.id === game.id.toString()) || 
                           Object.values(data.tiers).some((tier: any) => tier.items.some((g: any) => g.id === game.id.toString())) ? (
                            <div className="ml-auto bg-green-500/20 p-1.5 rounded-full border border-green-500/40">
                              <Check size={20} className="text-green-400" />
                            </div>
                          ) : (
                            <Plus size={24} className="text-white hover:text-indigo-400 transition ml-auto" onClick={(e) => { e.stopPropagation(); handleAddGame(game); }} />
                          )}
                        </div>
                      </div>
                      <div className="mt-3 text-center">
                        <h3 className="text-sm font-semibold text-slate-200 group-hover:text-indigo-300 transition line-clamp-1">{game.title}</h3>
                      </div>
                    </div>
                  ))}
                  {isDiscoverLoading && discoverOffset > 0 && (
                    Array.from({ length: 5 }).map((_, i) => (
                      <div key={`loading-more-${i}`} className="animate-pulse bg-white/5 rounded-2xl h-72 border border-white/5"></div>
                    ))
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {activeTab === 'library' && (
          <div className="flex-1 overflow-y-auto px-10 pb-12 pt-10 relative custom-scrollbar">
            <div className="mb-12">
              <h1 className="text-4xl font-black text-white mb-2">My Library</h1>
              <p className="text-slate-400">{libraryGames.length} games in your collection</p>
            </div>
            
            {suggestedGame && librarySearch === '' && (
              <div className="w-full relative rounded-2xl overflow-hidden mb-8 group cursor-pointer border border-indigo-500/40 shadow-[0_0_25px_rgba(99,102,241,0.15),inset_0_1px_0_rgba(255,255,255,0.05)] hover:border-purple-400/50 hover:shadow-[0_0_40px_rgba(139,92,246,0.25)] transition-all duration-500" onClick={() => handleGameClick(suggestedGame)}>
                {/* Background Image */}
                <div className="absolute inset-0">
                  <img src={suggestedGame.img || suggestedGame.image_url} alt="" className="w-full h-full object-cover scale-110 blur-sm group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#0B0E14] via-[#0B0E14]/85 to-transparent"></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0B0E14]/60 to-transparent"></div>
                </div>

                {/* Content */}
                <div className="relative z-10 flex items-center gap-6 p-6">
                  {/* Cover Art */}
                  <div className="w-24 h-36 shrink-0 rounded-xl overflow-hidden border-2 border-indigo-500/40 shadow-[0_0_20px_rgba(99,102,241,0.3)] group-hover:border-indigo-400/60 group-hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] transition-all duration-300">
                    <img src={suggestedGame.img || suggestedGame.image_url} alt={suggestedGame.title} className="w-full h-full object-cover" />
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest bg-indigo-500/20 text-indigo-400 px-2.5 py-1 rounded-md border border-indigo-500/30">🎲 Random Pick</span>
                    </div>
                    <p className="text-slate-400 text-sm mb-1">Not sure what to play? Try this from your backlog:</p>
                    <h3 className="text-3xl font-black text-white truncate group-hover:text-indigo-200 transition-colors">{suggestedGame.title}</h3>
                  </div>

                  {/* CTA */}
                  {suggestedGame.executable_path && suggestedGame.executable_path.trim() !== '' ? (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        window.api.launchGame(suggestedGame.executable_path, suggestedGame.id.toString());
                      }}
                      className="shrink-0 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:shadow-[0_0_30px_rgba(16,185,129,0.6)] hover:scale-105 transition-all flex items-center gap-2"
                    >
                      <PlayCircle size={18} /> Play Now
                    </button>
                  ) : (
                    <button 
                      className="shrink-0 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:shadow-[0_0_30px_rgba(99,102,241,0.6)] hover:scale-105 transition-all flex items-center gap-2"
                    >
                      <Search size={16} /> View Details
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-4">
              {[
                { id: 'Playing', title: '🎮 Currently Playing' },
                { id: 'Completed', title: '🏆 Completed' },
                { id: 'Backlog', title: '📚 The Backlog' },
                { id: 'Abandoned', title: '🛑 Dropped' }
              ].map(status => {
                const gamesInStatus = libraryGames.filter(g => 
                  (g.status || 'Backlog') === status.id && 
                  g.title.toLowerCase().includes(librarySearch.toLowerCase())
                );
                if (gamesInStatus.length === 0) return null;
                
                return (
                  <div key={status.id} className="mb-10">
                    <h2 className="text-2xl font-bold text-white mb-4">{status.title}</h2>
                    <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-hide pt-2 px-2 custom-scrollbar">
                      {gamesInStatus.map(game => (
                        <div 
                          key={game.id} 
                          onClick={() => handleGameClick(game)}
                          className="flex-shrink-0 w-48 h-72 rounded-xl overflow-hidden shadow-lg border border-white/10 cursor-pointer group relative hover:scale-105 hover:shadow-[0_0_20px_rgba(99,102,241,0.5)] transition-all"
                        >
                          <img src={game.img || game.image_url} alt={game.title} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                            <span className="text-white font-bold text-sm truncate w-full">{game.title}</span>
                          </div>
                          {(game.playtime_minutes || 0) > 0 && (
                            <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1 border border-white/10">
                              <Clock size={10} className="text-indigo-400" />
                              {(game.playtime_minutes || 0) >= 60 
                                ? `${Math.floor(game.playtime_minutes / 60)}h ${game.playtime_minutes % 60}m`
                                : `${game.playtime_minutes}m`
                              }
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STATISTICS PAGE */}
        {activeTab === 'statistics' && (() => {
          const totalGames = libraryGames.length;
          const completedGames = libraryGames.filter((g: any) => g.status === 'Completed').length;
          const completionRate = Math.round((completedGames / (totalGames || 1)) * 100);
          const sTierCount = libraryGames.filter((g: any) => g.tier === 's').length;
          const playingCount = libraryGames.filter((g: any) => g.status === 'Playing').length;
          const backlogCount = libraryGames.filter((g: any) => (g.status || 'Backlog') === 'Backlog').length;
          const droppedCount = libraryGames.filter((g: any) => g.status === 'Abandoned' || g.status === 'Dropped').length;

          const statusData = [
            { name: 'Playing', value: playingCount },
            { name: 'Backlog', value: backlogCount },
            { name: 'Completed', value: completedGames },
            { name: 'Dropped', value: droppedCount },
          ].filter(s => s.value > 0);

          const STATUS_COLORS: Record<string, string> = { Playing: '#06B6D4', Backlog: '#A855F7', Completed: '#22C55E', Dropped: '#EF4444' };

          const tierData = [
            { name: 'S', count: sTierCount, color: '#F43F5E' },
            { name: 'A', count: libraryGames.filter((g: any) => g.tier === 'a').length, color: '#F97316' },
            { name: 'B', count: libraryGames.filter((g: any) => g.tier === 'b').length, color: '#EAB308' },
            { name: 'C', count: libraryGames.filter((g: any) => g.tier === 'c').length, color: '#10B981' },
            { name: 'D', count: libraryGames.filter((g: any) => g.tier === 'd').length, color: '#0EA5E9' },
            { name: 'F', count: libraryGames.filter((g: any) => g.tier === 'f').length, color: '#991B1B' },
            { name: 'Drop', count: libraryGames.filter((g: any) => g.tier === 'dropped').length, color: '#475569' },
            { name: 'None', count: libraryGames.filter((g: any) => !g.tier || g.tier === 'unranked').length, color: '#64748B' },
          ];

          return (
          <div className="flex-1 overflow-y-auto px-10 pb-12 pt-10 relative custom-scrollbar">
            <div className="flex items-center gap-4 mb-10">
              <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-2xl">
                <BarChart2 size={28} />
              </div>
              <div>
                <h1 className="text-4xl font-black text-white tracking-tight">My Gamer Card</h1>
                <p className="text-slate-400 text-[15px]">A visual breakdown of your gaming journey</p>
              </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-4 gap-6 mb-8">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
                <p className="text-slate-400 text-sm font-medium mb-2">Total Games</p>
                <p className="text-4xl font-black text-white">{totalGames}</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
                <p className="text-slate-400 text-sm font-medium mb-2">Completed</p>
                <p className="text-4xl font-black text-green-400">{completedGames}</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
                <p className="text-slate-400 text-sm font-medium mb-2">Completion Rate</p>
                <p className="text-4xl font-black text-purple-400">{completionRate}<span className="text-2xl">%</span></p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
                <p className="text-slate-400 text-sm font-medium mb-2">S-Tier Masterpieces</p>
                <p className="text-4xl font-black text-rose-400">{sTierCount}</p>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-2 gap-6">
              {/* Pie Chart */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md h-96">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                  Games by Status
                </h3>
                {statusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="85%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={110}
                        paddingAngle={5}
                        strokeWidth={0}
                      >
                        {statusData.map((entry, i) => (
                          <Cell key={i} fill={STATUS_COLORS[entry.name] || '#64748B'} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ background: '#1E293B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', fontSize: '13px' }}
                        itemStyle={{ color: '#CBD5E1' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[85%] text-slate-500 text-sm">No status data yet</div>
                )}
                <div className="flex flex-wrap gap-4 mt-2 justify-center">
                  {statusData.map((s, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-slate-400">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: STATUS_COLORS[s.name] }}></div>
                      {s.name} ({s.value})
                    </div>
                  ))}
                </div>
              </div>

              {/* Bar Chart */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md h-96">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-rose-400"></div>
                  Tier Distribution
                </h3>
                <ResponsiveContainer width="100%" height="85%">
                  <BarChart data={tierData}>
                    <XAxis dataKey="name" stroke="#CBD5E1" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#475569" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip
                      cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                      contentStyle={{ background: '#1E293B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', fontSize: '13px' }}
                      itemStyle={{ color: '#CBD5E1' }}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {tierData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Library Health Progress Bar */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md mt-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                  Library Health
                </h3>
                <div className="flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1.5 text-emerald-400"><div className="w-2 h-2 rounded-full bg-emerald-500"></div>Completed ({completedGames})</span>
                  <span className="flex items-center gap-1.5 text-cyan-400"><div className="w-2 h-2 rounded-full bg-cyan-500"></div>Playing ({playingCount})</span>
                  <span className="flex items-center gap-1.5 text-purple-400"><div className="w-2 h-2 rounded-full bg-purple-500"></div>Backlog ({backlogCount})</span>
                  <span className="flex items-center gap-1.5 text-red-400"><div className="w-2 h-2 rounded-full bg-red-500"></div>Dropped ({droppedCount})</span>
                </div>
              </div>
              <div className="relative w-full h-8 bg-slate-800/80 rounded-full overflow-hidden border border-white/5">
                {totalGames > 0 && (
                  <div className="absolute inset-0 flex h-full">
                    <div 
                      className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-700"
                      style={{ width: `${(completedGames / totalGames) * 100}%` }}
                    ></div>
                    <div 
                      className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 transition-all duration-700"
                      style={{ width: `${(playingCount / totalGames) * 100}%` }}
                    ></div>
                    <div 
                      className="h-full bg-gradient-to-r from-purple-500 to-purple-400 transition-all duration-700"
                      style={{ width: `${(backlogCount / totalGames) * 100}%` }}
                    ></div>
                    <div 
                      className="h-full bg-gradient-to-r from-red-500 to-red-400 transition-all duration-700"
                      style={{ width: `${(droppedCount / totalGames) * 100}%` }}
                    ></div>
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-bold text-white drop-shadow-lg">
                    {completionRate}% Complete
                  </span>
                </div>
              </div>
            </div>

            {/* Unplayed S-Tier Warning */}
            {(() => {
              const dustyMasterpieces = libraryGames.filter((g: any) => g.tier === 's' && (g.status || 'Backlog') === 'Backlog');
              if (dustyMasterpieces.length === 0) return null;
              return (
                <div className="mt-8 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-2xl p-5 flex items-center gap-4 shadow-[0_0_25px_rgba(245,158,11,0.08)]">
                  <div className="p-3 bg-amber-500/20 rounded-xl shrink-0">
                    <Trophy size={24} className="text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-amber-300 font-bold text-sm">⚠️ Warning: You have {dustyMasterpieces.length} Masterpiece{dustyMasterpieces.length > 1 ? 's' : ''} collecting dust!</p>
                    <p className="text-amber-400/60 text-xs mt-1">
                      {dustyMasterpieces.map((g: any) => g.title).join(', ')} — ranked S-Tier but still sitting in your Backlog.
                    </p>
                  </div>
                </div>
              );
            })()}

            {/* Trophy Cabinet — Hall of Fame */}
            {(() => {
              const completedList = libraryGames.filter((g: any) => g.status === 'Completed');
              if (completedList.length === 0) return null;
              return (
                <div className="mt-8">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Trophy size={20} className="text-yellow-400" />
                    Trophy Cabinet
                    <span className="text-xs text-slate-500 font-normal ml-2">Your Hall of Fame</span>
                  </h3>
                  <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                    {completedList.map((game: any) => (
                      <div
                        key={game.id}
                        onClick={() => handleGameClick({ id: game.id, title: game.title, img: game.image_url, image_url: game.image_url })}
                        className="flex-shrink-0 w-36 cursor-pointer group relative"
                      >
                        <div className="w-36 h-52 rounded-xl overflow-hidden border-2 border-yellow-500/30 shadow-[0_0_15px_rgba(234,179,8,0.15)] group-hover:border-yellow-400/60 group-hover:shadow-[0_0_25px_rgba(234,179,8,0.3)] transition-all duration-300">
                          <img src={game.image_url} alt={game.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3 rounded-xl">
                            <span className="text-white font-bold text-xs truncate w-full">{game.title}</span>
                          </div>
                        </div>
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center shadow-lg border-2 border-[#0B0E14]">
                          <Check size={12} className="text-black" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
          );
        })()}

        {/* AI ORACLE PAGE */}
        {activeTab === 'oracle' && (
          <div className="flex-1 overflow-y-auto px-10 pb-12 pt-10 relative custom-scrollbar">
            {/* Header */}
            <div className="mb-10">
              <div className="flex items-center gap-4 mb-3">
                <div className="p-3 bg-purple-500/20 text-purple-400 rounded-2xl">
                  <Wand2 size={28} />
                </div>
                <div>
                  <h1 className="text-4xl font-black text-white tracking-tight">AI Oracle</h1>
                  <p className="text-slate-400 text-[15px]">Personalized game recommendations powered by Gemini AI</p>
                </div>
              </div>
            </div>

            {/* Generate Button */}
            {!oracleLoading && oracleRecs.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="relative mb-8">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-500/30 flex items-center justify-center">
                    <Wand2 size={48} className="text-purple-400" />
                  </div>
                  <div className="absolute inset-0 w-32 h-32 rounded-full bg-purple-500/10 animate-ping" style={{ animationDuration: '3s' }}></div>
                </div>
                <h2 className="text-2xl font-bold text-white mb-3">Ready to discover your next obsession?</h2>
                <p className="text-slate-400 text-center max-w-md mb-8">The AI Oracle analyzes your S-Tier favorites and Dropped games to find perfect matches you've never played.</p>
                {oracleError && (
                  <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-6 py-3 rounded-xl mb-6 text-sm max-w-md text-center">
                    {oracleError === 'NO_API_KEY' ? 'Please set your Gemini API Key in Settings first.' : 
                     oracleError === 'NOT_ENOUGH_DATA' ? 'Rank some games in your Tier List first so the Oracle can learn your tastes!' : 
                     `Error: ${oracleError}`}
                  </div>
                )}
                <button
                  onClick={async () => {
                    setOracleLoading(true);
                    setOracleError(null);
                    setOraclePhase('Analyzing your gaming tastes...');
                    setTimeout(() => setOraclePhase('Consulting the Oracle...'), 2000);
                    setTimeout(() => setOraclePhase('Searching the multiverse of games...'), 4500);
                    setTimeout(() => setOraclePhase('Fetching cover art...'), 7000);
                    const result = await window.api.getAIRecommendations();
                    setOracleLoading(false);
                    if (result.error) {
                      setOracleError(result.error);
                    } else {
                      setOracleRecs(result.recommendations);
                    }
                  }}
                  className="group relative px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-lg rounded-2xl shadow-[0_0_30px_rgba(168,85,247,0.3)] hover:shadow-[0_0_40px_rgba(168,85,247,0.5)] transition-all overflow-hidden"
                >
                  <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors"></div>
                  <span className="relative z-10 flex items-center gap-3">
                    <Sparkles size={22} />
                    Generate Recommendations
                  </span>
                </button>
              </div>
            )}

            {/* Loading State */}
            {oracleLoading && (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="relative mb-8">
                  <div className="w-28 h-28 rounded-full border-4 border-purple-500/30 border-t-purple-500 animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Wand2 size={36} className="text-purple-400 animate-pulse" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-white mb-3 animate-pulse">{oraclePhase}</h2>
                <p className="text-slate-500 text-sm">This may take a moment while the AI works its magic</p>
              </div>
            )}

            {/* Results */}
            {!oracleLoading && oracleRecs.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-white flex items-center gap-3">
                    <Sparkles size={20} className="text-purple-400" />
                    Curated For You
                  </h2>
                  <button
                    onClick={() => {
                      setOracleRecs([]);
                      setOracleError(null);
                    }}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition"
                  >
                    <RefreshCw size={14} /> Generate Again
                  </button>
                </div>

                {oracleRecs.map((rec, index) => (
                  <div
                    key={index}
                    className="group flex bg-gradient-to-r from-[#121620] to-[#151a28] border border-slate-700/50 hover:border-purple-500/40 rounded-2xl overflow-hidden shadow-xl hover:shadow-[0_0_30px_rgba(168,85,247,0.1)] transition-all duration-300"
                  >
                    {/* Poster */}
                    <div className="w-44 h-60 shrink-0 relative overflow-hidden">
                      {rec.image_url ? (
                        <img src={rec.image_url} alt={rec.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-purple-900/30 to-slate-900 flex items-center justify-center">
                          <Gamepad2 size={40} className="text-slate-600" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#121620]/50"></div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 p-6 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-[10px] font-bold uppercase tracking-widest bg-purple-500/20 text-purple-400 px-2.5 py-1 rounded-md border border-purple-500/30">AI Pick #{index + 1}</span>
                        </div>
                        <h3 className="text-2xl font-black text-white mb-3 group-hover:text-purple-200 transition-colors">{rec.title}</h3>
                        <p className="text-slate-400 text-[15px] leading-relaxed">{rec.reason}</p>
                      </div>
                      <div className="flex items-center gap-3 mt-5">
                        <button
                          onClick={async () => {
                            if (rec.id) {
                              await window.api.addGame(String(rec.id), rec.title, rec.image_url);
                              loadGames();
                              setOracleRecs(prev => prev.filter((_, i) => i !== index));
                            }
                          }}
                          className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm rounded-xl shadow-lg transition"
                        >
                          <Plus size={16} /> Add to Backlog
                        </button>
                        <button
                          onClick={() => rec.id && handleGameClick({ id: rec.id, title: rec.title, img: rec.image_url, image_url: rec.image_url })}
                          className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white font-medium text-sm rounded-xl border border-white/10 transition"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        </main>
      </div>

      {/* GAME DETAILS MODAL */}
      {selectedGame && (
        <div className="fixed inset-0 z-[200] flex overflow-hidden">
          {/* Background Layer */}
          {(bgMode === 'video' || isVideoMode) && gameDetails?.video_id && !videoError ? (
            <div className="absolute inset-0 pointer-events-none bg-black overflow-hidden flex justify-center items-center">
              <iframe
                ref={iframeRef}
                style={{ width: '100vw', height: '56.25vw', minHeight: '100vh', minWidth: '177.77vh', transform: 'scale(1.35)' }}
                src={`https://www.youtube.com/embed/${currentVideoId}?start=10&autoplay=1&mute=${defaultMuted ? 1 : 0}&controls=0&loop=1&playlist=${currentVideoId}&modestbranding=1&showinfo=0&rel=0&disablekb=1&enablejsapi=1`}
                allow="autoplay; encrypted-media"
                frameBorder="0"
                onLoad={(e) => {
                  // Detect age-restricted videos by checking if iframe navigated to a consent page
                  try {
                    const iframe = e.target as HTMLIFrameElement;
                    // Set a timeout to check if the video actually played
                    setTimeout(() => {
                      if (iframe && iframe.contentWindow) {
                        iframe.contentWindow.postMessage('{"event":"listening"}', '*');
                      }
                    }, 2000);
                  } catch (_) { /* cross-origin, expected */ }
                }}
                onError={() => setVideoError(true)}
              />
            </div>
          ) : (
            <div 
              className="absolute inset-0 bg-cover bg-center bg-[#0B0E14]" 
              style={{ backgroundImage: `url(${gameDetails?.background_url || selectedGame.img || selectedGame.image_url})` }} 
            />
          )}
          {/* Blur/Dark Overlay */}
          {(!isVideoMode || videoError) && <div className="absolute inset-0 bg-black/20 backdrop-blur-[0px]" />}

          {/* Content Container */}
          {!isVideoMode && (
            <div className="relative z-10 w-full h-full p-16 flex gap-16 overflow-hidden">
              {/* Left Column - sticky, no scroll */}
              <div className="flex flex-col gap-6 shrink-0 self-start sticky top-0">
              <img src={selectedGame.img || selectedGame.image_url} alt={selectedGame.title} className="w-80 rounded-2xl shadow-2xl border border-white/10" />
              
              {selectedGame.executable_path && selectedGame.executable_path !== '' && (
                runningGameId === selectedGame.id.toString() ? (
                  <div className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black text-lg rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.5)] flex justify-center items-center gap-3 tracking-widest uppercase border border-emerald-400/50 animate-pulse cursor-not-allowed">
                    <Gamepad2 size={22} className="animate-bounce" /> Game Running...
                  </div>
                ) : (
                  <button onClick={() => window.api.launchGame(selectedGame.executable_path, selectedGame.id.toString())} className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-lg rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.5)] hover:scale-105 transition-transform flex justify-center items-center gap-3 tracking-widest uppercase border border-indigo-400/50">
                    <Gamepad2 size={22} /> Play Game
                  </button>
                )
              )}

              {/* Playtime Badge */}
              <div className="w-full flex items-center justify-center gap-2 py-2.5 bg-white/5 border border-white/10 rounded-xl">
                <Clock size={16} className="text-indigo-400" />
                <span className="text-sm font-semibold text-slate-300">
                  {gamePlaytime > 0 
                    ? (gamePlaytime >= 60 
                        ? `${Math.floor(gamePlaytime / 60)}h ${gamePlaytime % 60}m played`
                        : `${gamePlaytime}m played`)
                    : 'No playtime tracked yet'
                  }
                </span>
              </div>

              <div className="w-full space-y-2">
                <label className="text-xs font-bold text-white/50 uppercase tracking-wider pl-1">Play Status</label>
                <div className="relative">
                  <div 
                    onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                    className="w-full flex items-center justify-between bg-black/40 border border-white/20 text-white text-base rounded-xl px-4 py-3 cursor-pointer hover:bg-black/60 hover:border-indigo-500/50 backdrop-blur-md shadow-lg transition"
                  >
                    <span>{gameDetails?.status || 'Backlog'}</span>
                    <ChevronDown size={18} className={`transition-transform duration-200 ${isStatusDropdownOpen ? 'rotate-180 text-indigo-400' : 'text-slate-400'}`} />
                  </div>
                  
                  {isStatusDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-[#0B0E14]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.5)] overflow-hidden z-[300] flex flex-col py-1">
                      {['Backlog', 'Playing', 'Completed', 'Abandoned'].map(status => (
                        <div 
                          key={status}
                          onClick={() => {
                            handleSaveGameData('status', status);
                            setIsStatusDropdownOpen(false);
                          }}
                          className={`px-4 py-3 text-sm cursor-pointer transition flex items-center gap-2 ${
                            (gameDetails?.status || 'Backlog') === status 
                              ? 'bg-indigo-600/20 text-indigo-300 font-semibold border-l-2 border-indigo-500' 
                              : 'text-slate-300 hover:bg-white/5 hover:text-white border-l-2 border-transparent'
                          }`}
                        >
                          {status}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex-1 flex flex-col pt-8 overflow-y-auto pr-2 custom-scrollbar">
              <h2 className="text-6xl font-black text-white tracking-tight mb-4 drop-shadow-2xl">{selectedGame.title}</h2>
              
              <div className="flex items-center gap-4 text-xl font-medium text-white/70 mb-12">
                <span className="bg-white/10 px-3 py-1 rounded-lg border border-white/10 backdrop-blur-sm">{gameDetails ? gameDetails.year : '...'}</span>
                {gameDetails?.rating && (
                  <span className="flex items-center gap-1.5 bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-lg border border-indigo-500/30 backdrop-blur-sm">
                    <Star size={18} className="fill-indigo-400" />
                    {gameDetails.rating}/100 <span className="text-sm text-indigo-400/70 ml-1">({gameDetails.ratingCount})</span>
                  </span>
                )}
                <span>{gameDetails ? gameDetails.genres : 'Loading details...'}</span>
              </div>

              {/* Platforms */}
              {gameDetails?.platforms && gameDetails.platforms.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-8">
                  {gameDetails.platforms.map((platform: string, idx: number) => {
                    const isPC = /PC|Windows|Mac|Linux/i.test(platform);
                    const isConsole = /PlayStation|Xbox|Nintendo|Switch/i.test(platform);
                    
                    return (
                      <div 
                        key={idx}
                        className="flex items-center gap-2 px-3 py-1.5 bg-white/5 backdrop-blur-md border border-white/10 rounded-full text-xs font-bold text-white/80"
                      >
                        {isPC ? <Monitor size={14} className="text-sky-400" /> : isConsole ? <Gamepad2 size={14} className="text-indigo-400" /> : null}
                        {platform}
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex-1 flex flex-col gap-6 max-w-5xl">
                
                {/* Time to Beat */}
                {timeToBeat && (
                  <div className="flex gap-4 mb-2">
                    {timeToBeat.main > 0 && (
                      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-3 flex items-center gap-3 shadow-sm">
                        <Clock className="text-indigo-400" size={18} />
                        <span className="text-sm font-semibold text-white/90">Main Story: <span className="text-indigo-300">{timeToBeat.main} hrs</span></span>
                      </div>
                    )}
                    {timeToBeat.extra > 0 && (
                      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-3 flex items-center gap-3 shadow-sm">
                        <Clock className="text-indigo-400" size={18} />
                        <span className="text-sm font-semibold text-white/90">Main + Sides: <span className="text-indigo-300">{timeToBeat.extra} hrs</span></span>
                      </div>
                    )}
                    {timeToBeat.completionist > 0 && (
                      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-3 flex items-center gap-3 shadow-sm">
                        <Clock className="text-indigo-400" size={18} />
                        <span className="text-sm font-semibold text-white/90">Completionist: <span className="text-indigo-300">{timeToBeat.completionist} hrs</span></span>
                      </div>
                    )}
                  </div>
                )}

                {/* Best Available Deals */}
                {(!selectedGame.executable_path || selectedGame.executable_path.trim() === '') && gameDeals.length > 0 && (
                  <div className="bg-black/30 border border-white/10 backdrop-blur-md rounded-2xl p-5 shadow-inner">
                    <h3 className="text-sm font-bold text-white/70 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <Tag size={14} className="text-emerald-400" />
                      Best Available Deals
                    </h3>
                    <div className="flex gap-3 flex-wrap">
                      {gameDeals.map((deal, i) => (
                        <button
                          key={i}
                          onClick={() => window.api.openExternal(deal.dealUrl)}
                          className="group flex flex-col items-center bg-white/5 hover:bg-white/10 border border-white/10 hover:border-emerald-500/40 rounded-xl px-4 py-3 transition-all hover:shadow-[0_0_15px_rgba(16,185,129,0.15)] min-w-[120px]"
                        >
                          <span className="text-xs font-bold text-white mb-1 flex items-center gap-1.5">
                            {deal.storeName}
                            <ExternalLink size={10} className="text-slate-500 group-hover:text-emerald-400 transition-colors" />
                          </span>
                          <span className="text-lg font-black text-emerald-400">${deal.salePrice}</span>
                          {deal.isOnSale && deal.savings > 0 && (
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="text-[10px] text-slate-500 line-through">${deal.normalPrice}</span>
                              <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/30">-{deal.savings}%</span>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Details Grid */}
                <div className="bg-black/30 border border-white/10 backdrop-blur-md rounded-2xl p-6 shadow-inner">
                  <div className="grid grid-cols-4 gap-6 mb-6">
                    <div>
                      <h4 className="text-xs font-bold text-white/50 uppercase mb-2">Main Developers</h4>
                      <p className="text-sm text-indigo-300 leading-snug">{gameDetails ? gameDetails.developers : '-'}</p>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white/50 uppercase mb-2">Publishers</h4>
                      <p className="text-sm text-indigo-300 leading-snug">{gameDetails ? gameDetails.publishers : '-'}</p>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white/50 uppercase mb-2">Game Modes</h4>
                      <p className="text-sm text-indigo-300 leading-snug">{gameDetails ? gameDetails.gameModes : '-'}</p>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white/50 uppercase mb-2">Perspectives</h4>
                      <p className="text-sm text-indigo-300 leading-snug">{gameDetails ? gameDetails.perspectives : '-'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-6 pt-6 border-t border-white/10">
                    <div>
                      <h4 className="text-xs font-bold text-white/50 uppercase mb-2">Themes</h4>
                      <p className="text-sm text-indigo-300 leading-snug">{gameDetails ? gameDetails.themes : '-'}</p>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white/50 uppercase mb-2">Series</h4>
                      <p className="text-sm text-indigo-300 leading-snug">{gameDetails ? gameDetails.series : '-'}</p>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white/50 uppercase mb-2">Game Engine</h4>
                      <p className="text-sm text-indigo-300 leading-snug">{gameDetails ? gameDetails.engines : '-'}</p>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white/50 uppercase mb-2">Alt Titles</h4>
                      <p className="text-sm text-indigo-300 leading-snug">{gameDetails ? gameDetails.altNames : '-'}</p>
                    </div>
                  </div>
                </div>

                {/* Story / Storyline */}
                <div className="bg-black/30 border border-white/10 backdrop-blur-md rounded-2xl p-6 shadow-inner">
                  <h3 className="text-sm font-bold text-white/70 tracking-wide mb-3">Overview</h3>
                  <p className="text-slate-300 text-base leading-relaxed">
                    {gameDetails ? gameDetails.summary : 'Loading from IGDB...'}
                  </p>
                  {gameDetails?.storyline && gameDetails.storyline !== gameDetails.summary && (
                    <>
                      <h3 className="text-sm font-bold text-white/70 tracking-wide mt-5 mb-3">Storyline</h3>
                      <p className="text-slate-300 text-base leading-relaxed">{gameDetails.storyline}</p>
                    </>
                  )}
                </div>

                {/* Image Gallery */}
                {gameDetails?.gallery && gameDetails.gallery.length > 0 && (
                  <div className="bg-black/30 border border-white/10 backdrop-blur-md rounded-2xl p-6 shadow-inner">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-bold text-white/70 tracking-wide">Screenshots</h3>
                      <span className="text-xs text-white/30 font-mono">{galleryIndex + 1} / {gameDetails.gallery.length}</span>
                    </div>

                    {/* Main Image */}
                    <div className="relative rounded-xl overflow-hidden mb-3 aspect-video bg-black/40">
                      <img
                        key={galleryIndex}
                        src={gameDetails.gallery[galleryIndex]}
                        alt={`Screenshot ${galleryIndex + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {/* Prev/Next Arrows */}
                      <button
                        onClick={() => setGalleryIndex(i => (i - 1 + gameDetails.gallery.length) % gameDetails.gallery.length)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/80 border border-white/10 rounded-full text-white backdrop-blur-md transition"
                      >
                        <ChevronDown size={20} className="rotate-90" />
                      </button>
                      <button
                        onClick={() => setGalleryIndex(i => (i + 1) % gameDetails.gallery.length)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/80 border border-white/10 rounded-full text-white backdrop-blur-md transition"
                      >
                        <ChevronDown size={20} className="-rotate-90" />
                      </button>
                    </div>

                    {/* Thumbnail Strip */}
                    <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
                      {gameDetails.gallery.map((url: string, idx: number) => (
                        <img
                          key={idx}
                          src={url}
                          alt={`Thumb ${idx + 1}`}
                          onClick={() => setGalleryIndex(idx)}
                          className={`h-14 w-24 object-cover rounded-lg cursor-pointer shrink-0 border-2 transition ${
                            idx === galleryIndex ? 'border-indigo-500 opacity-100 shadow-[0_0_12px_rgba(99,102,241,0.6)]' : 'border-transparent opacity-50 hover:opacity-80'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            </div>
          )}

          {/* Controls */}
          <div 
            className="absolute top-8 right-8 z-[9999] flex items-center gap-4"
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          >
            {gameDetails?.video_id && (
              <>
                {(bgMode === 'video' || isVideoMode) && !videoError && (
                  <button 
                    onClick={toggleMute}
                    className="p-4 bg-black/20 hover:bg-white/10 border border-white/10 rounded-full text-white/70 hover:text-white backdrop-blur-md transition-all shadow-xl"
                    title={isMuted ? "Unmute" : "Mute"}
                  >
                    {isMuted ? <VolumeX size={28} /> : <Volume2 size={28} />}
                  </button>
                )}
                {isVideoMode && !videoError ? (
                  <>
                    <button 
                      onClick={() => setIsVideoMode(false)}
                      className="flex items-center gap-3 px-6 py-4 bg-white/20 hover:bg-white/30 border border-white/20 rounded-full text-white font-bold backdrop-blur-md transition-all shadow-xl"
                    >
                      <List size={28} />
                      <span className="text-lg">Show Details</span>
                    </button>
                    <button 
                      onClick={() => window.api.openExternal(`https://www.youtube.com/watch?v=${currentVideoId}`)}
                      className="flex items-center gap-3 px-6 py-4 bg-red-600/80 hover:bg-red-500 border border-red-400/30 rounded-full text-white font-bold backdrop-blur-md transition-all shadow-xl"
                    >
                      <ExternalLink size={28} />
                      <span className="text-lg">Watch on YouTube</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      onClick={() => {
                        if (videoError) {
                          window.api.openExternal(`https://www.youtube.com/watch?v=${gameDetails.video_id}`);
                        } else {
                          setCurrentVideoId(gameDetails.video_id);
                          setIsVideoMode(true);
                        }
                      }}
                      className="flex items-center gap-3 px-6 py-4 bg-black/20 hover:bg-white/10 border border-white/10 rounded-full text-white/70 hover:text-white font-bold backdrop-blur-md transition-all shadow-xl"
                    >
                      {videoError ? <ExternalLink size={28} /> : <PlayCircle size={28} />}
                      <span className="text-lg">{videoError ? 'Watch on YouTube' : 'Watch Trailer'}</span>
                    </button>
                    {gameDetails.videos && gameDetails.videos.find((v: any) => v.name.toLowerCase().includes('gameplay')) && (
                      <button 
                        onClick={() => {
                          const gameplay = gameDetails.videos.find((v: any) => v.name.toLowerCase().includes('gameplay'));
                          if (videoError) {
                            window.api.openExternal(`https://www.youtube.com/watch?v=${gameplay.id}`);
                          } else {
                            setCurrentVideoId(gameplay.id);
                            setIsVideoMode(true);
                          }
                        }}
                        className="flex items-center gap-3 px-6 py-4 bg-indigo-600/80 hover:bg-indigo-500 border border-indigo-400/30 rounded-full text-white font-bold backdrop-blur-md transition-all shadow-xl"
                      >
                        {videoError ? <ExternalLink size={28} /> : <Gamepad2 size={28} />}
                        <span className="text-lg">{videoError ? 'Gameplay on YouTube' : 'Watch Gameplay'}</span>
                      </button>
                    )}
                  </>
                )}
              </>
            )}
            <button 
              onClick={() => {
                setSelectedGame(null);
                setTimeToBeat(null);
              }}
              className="p-4 bg-black/20 hover:bg-white/10 border border-white/10 rounded-full text-white/70 hover:text-white backdrop-blur-md transition-all shadow-xl"
            >
              <X size={28} />
            </button>
          </div>
        </div>
      )}

      {/* IMPORT MODAL */}
      {showImportModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-10">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xl" onClick={() => !isImporting && setShowImportModal(false)}></div>
          
          <div className="relative w-full max-w-5xl bg-[#121620]/95 border border-slate-700/50 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col">
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/5">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-2xl">
                  <UploadCloud size={28} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white tracking-wide">Ultimate Import Hub</h2>
                  <p className="text-slate-400 text-sm">Bulk import games using AI Vision or plain text</p>
                </div>
              </div>
              {!isImporting && (
                <button onClick={() => setShowImportModal(false)} className="text-slate-500 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-xl transition">
                  <X size={24} />
                </button>
              )}
            </div>

            <div className="p-8 flex gap-8">
              {/* Left Column: AI Vision */}
              <div className="flex-1 flex flex-col gap-4 border-r border-white/5 pr-8">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles size={20} className="text-purple-400" />
                  <h3 className="text-lg font-bold text-white">AI Vision Import</h3>
                </div>
                
                <div 
                  onClick={() => !isImporting && handleAIImport()}
                  className={`flex-1 min-h-[250px] mt-2 border-2 border-dashed ${isImporting ? 'border-slate-800 bg-black/20 cursor-not-allowed' : 'border-purple-500/30 hover:border-purple-400 bg-purple-500/5 hover:bg-purple-500/10 cursor-pointer'} rounded-2xl flex flex-col items-center justify-center gap-4 transition-all group`}
                >
                  {isImporting ? (
                    <RefreshCw size={48} className="text-purple-400 animate-spin" />
                  ) : (
                    <>
                      <div className="p-4 bg-purple-500/20 text-purple-400 rounded-full group-hover:scale-110 transition-transform">
                        <UploadCloud size={32} />
                      </div>
                      <div className="text-center">
                        <p className="text-white font-medium mb-1">Click to browse Library Image</p>
                        <p className="text-slate-500 text-sm">JPG, PNG supported</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Right Column: Text Import */}
              <div className="flex-1 flex flex-col gap-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileText size={20} className="text-indigo-400" />
                  <h3 className="text-lg font-bold text-white">Bulk Text Paste</h3>
                </div>
                
                <textarea 
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder="Paste games here, separated by commas or new lines...&#10;e.g.&#10;God of War&#10;Elden Ring&#10;Minecraft" 
                  className="flex-1 w-full bg-black/30 border border-slate-700/50 text-sm rounded-xl px-4 py-4 focus:outline-none focus:border-indigo-500/50 text-slate-200 placeholder-slate-600 transition resize-none custom-scrollbar min-h-[250px]"
                  disabled={isImporting}
                />
                
                <button 
                  onClick={handleTextImport}
                  disabled={isImporting || !importText.trim()}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold rounded-xl shadow-lg transition-colors flex justify-center items-center gap-2 mt-2"
                >
                  {isImporting ? <RefreshCw size={20} className="animate-spin" /> : <Check size={20} />}
                  {isImporting ? 'Importing Games...' : 'Import Text'}
                </button>
              </div>
            </div>
            
            {isImporting && (
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                <RefreshCw size={48} className="text-indigo-500 animate-spin mb-4" />
                <h3 className="text-2xl font-bold text-white mb-2">Processing Import...</h3>
                <p className="text-slate-400">Searching IGDB and fetching covers. Please wait.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </DragDropContext>
  );
}