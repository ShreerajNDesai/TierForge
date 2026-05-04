import { useState, useEffect, useRef } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { 
  Gamepad2, LayoutGrid, Trophy, Bot, BarChart2, Settings, 
  Search, Bell, Download, Upload, Filter, ArrowUpDown, Plus, Trash2, RefreshCw,
  Library, ChevronDown, Minus, Square, X, Crown, Star, Diamond, Menu, Grid, List,
  PlayCircle, Volume2, VolumeX
} from 'lucide-react';

const emptyData = {
  tiers: {
    s: { id: 's', title: 'S-Tier', sub: 'Masterpiece', color: 'bg-rose-500', items:[] },
    a: { id: 'a', title: 'A-Tier', sub: 'Excellent', color: 'bg-orange-500', items:[] },
    b: { id: 'b', title: 'B-Tier', sub: 'Great', color: 'bg-yellow-500', items:[] },
    c: { id: 'c', title: 'C-Tier', sub: 'Good', color: 'bg-green-500', items:[] },
  },
  collection:[]
};

export default function App() {
  const [data, setData] = useState<any>(emptyData);
  const [searchQuery, setSearchQuery] = useState('');
  const[searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
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
      const gameObj = { id: game.id, title: game.title, img: game.image_url, notes: game.notes || '', status: game.status || 'Backlog' };
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
  },[]);

  const handleSearch = async (e: any) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.length > 2) {
      setIsSearching(true);
      const results = await window.api.searchGames(query);
      setSearchResults(results);
      setIsSearching(false);
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
    setIsMuted(true);
    setCurrentVideoId('');
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
            GameTrack
          </div>
          
          <nav className="px-5 space-y-1 mt-2">
            <div 
              onClick={() => setActiveTab('tierlist')}
              className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl cursor-pointer relative overflow-hidden group transition ${activeTab === 'tierlist' ? 'bg-gradient-to-r from-indigo-600/20 to-purple-600/10 text-indigo-300 border border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.15)]' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'}`}
            >
              {activeTab === 'tierlist' && <div className="absolute inset-0 bg-indigo-500/10 group-hover:bg-indigo-500/20 transition-colors"></div>}
              <LayoutGrid size={20} className={activeTab === 'tierlist' ? 'text-indigo-400 relative z-10' : ''} /> <span className="font-semibold text-sm relative z-10">Tier List</span>
            </div>
            <div className="flex items-center gap-4 px-5 py-3.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 rounded-2xl cursor-pointer transition mt-1 border border-transparent">
              <Library size={20} /> <span className="font-medium text-sm">Library</span>
            </div>
            <div className="flex items-center gap-4 px-5 py-3.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 rounded-2xl cursor-pointer transition border border-transparent">
              <Trophy size={20} /> <span className="font-medium text-sm">Rankings</span>
            </div>
            <div className="flex items-center gap-4 px-5 py-3.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 rounded-2xl cursor-pointer transition border border-transparent">
              <Bot size={20} /> <span className="font-medium text-sm">AI Discover</span>
            </div>
            <div className="flex items-center gap-4 px-5 py-3.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 rounded-2xl cursor-pointer transition border border-transparent">
              <BarChart2 size={20} /> <span className="font-medium text-sm">Statistics</span>
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
        <header className="h-20 flex items-center justify-between px-10 shrink-0">
          <div className="flex-1"></div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center relative w-72 group">
              <Search className="absolute left-3.5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={16} />
              <input 
                type="text" 
                value={searchQuery}
                onChange={handleSearch}
                placeholder="Search games..." 
                className="w-full bg-[#121620]/80 border border-slate-700/50 text-sm rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-indigo-500/50 focus:bg-[#151924]/90 text-slate-200 placeholder-slate-500 transition shadow-inner"
              />
              {searchResults.length > 0 && (
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
                              <Plus size={16} className="ml-auto text-indigo-400" />
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
            
            <div className="flex items-center gap-5 text-slate-400">
              <div className="relative cursor-pointer hover:text-white transition">
                <Bell size={18} />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-purple-500 rounded-full border border-[#0B0E14]"></span>
              </div>
              <BarChart2 size={18} className="cursor-pointer hover:text-white transition" />
            </div>
            
            <div className="flex items-center gap-4 pl-6 border-l border-slate-800/80 text-slate-500">
              <Minus size={16} className="cursor-pointer hover:text-white transition" />
              <Square size={12} className="cursor-pointer hover:text-white transition" />
              <X size={16} className="cursor-pointer hover:text-white transition" />
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

                <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-medium border border-slate-700/80 text-slate-300 hover:bg-slate-800/80 hover:text-white transition">
                  <Download size={16} /> Import List
                </button>
                <button 
                  onClick={handleScanPC}
                  disabled={isScanning}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold transition shadow-lg relative overflow-hidden group ${
                    isScanning 
                      ? 'bg-indigo-500/20 text-indigo-400 cursor-not-allowed border border-indigo-500/30' 
                      : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-indigo-500/25 border border-indigo-400/30'
                  }`}
                >
                  <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors"></div>
                  {isScanning ? (
                    <><RefreshCw size={16} className="animate-spin relative z-10" /> <span className="relative z-10">Scanning...</span></>
                  ) : (
                    <><Download size={16} className="relative z-10" /> <span className="relative z-10">Scan PC Games</span></>
                  )}
                </button>
              </div>
            </div>

            {/* TIER ROWS */}
            <div className="space-y-4 mb-12 px-1">
              {Object.values(data.tiers).map((tier: any) => {
                let TierIcon = Crown;
                if (tier.id === 'a') TierIcon = Star;
                if (tier.id === 'b') TierIcon = Diamond;
                if (tier.id === 'c') TierIcon = LayoutGrid;
                
                let gradientBg = "bg-gradient-to-br from-[#F43F5E] to-[#E11D48]";
                if (tier.id === 'a') gradientBg = "bg-gradient-to-br from-[#F97316] to-[#EA580C]";
                if (tier.id === 'b') gradientBg = "bg-gradient-to-br from-[#EAB308] to-[#CA8A04]";
                if (tier.id === 'c') gradientBg = "bg-gradient-to-br from-[#10B981] to-[#059669]";
                
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
                  <button className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-[13px] font-medium border border-slate-700/80 text-slate-300 hover:bg-slate-800/80 transition">
                    <Filter size={14} /> Filter
                  </button>
                  <button className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-[13px] font-medium border border-slate-700/80 text-slate-300 hover:bg-slate-800/80 transition">
                    <ArrowUpDown size={14} /> Sort <ChevronDown size={14} className="ml-1 text-slate-500" />
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
                    {data.collection.map((item: any, index: number) => (
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
              </div>
            </div>
          </div>
        )}

        </main>
      </div>

      {/* GAME DETAILS MODAL */}
      {selectedGame && (
        <div className="fixed inset-0 z-[200] flex overflow-hidden">
          {/* Background Layer */}
          {(bgMode === 'video' || isVideoMode) && gameDetails?.video_id ? (
            <div className="absolute inset-0 pointer-events-none bg-black overflow-hidden flex justify-center items-center">
              <iframe
                ref={iframeRef}
                style={{ width: '100vw', height: '56.25vw', minHeight: '100vh', minWidth: '177.77vh', transform: 'scale(1.35)' }}
                src={`https://www.youtube.com/embed/${currentVideoId}?start=10&autoplay=1&mute=1&controls=0&loop=1&playlist=${currentVideoId}&modestbranding=1&showinfo=0&rel=0&disablekb=1&enablejsapi=1`}
                allow="autoplay; encrypted-media"
                frameBorder="0"
              />
            </div>
          ) : (
            <div 
              className="absolute inset-0 bg-cover bg-center bg-[#0B0E14]" 
              style={{ backgroundImage: `url(${gameDetails?.background_url || selectedGame.img})` }} 
            />
          )}
          {/* Blur/Dark Overlay */}
          {!isVideoMode && <div className="absolute inset-0 bg-black/20 backdrop-blur-[0px]" />}

          {/* Content Container */}
          {!isVideoMode && (
            <div className="relative z-10 w-full h-full p-16 flex gap-16 overflow-y-auto">
              {/* Left Column */}
              <div className="flex flex-col gap-6 shrink-0">
              <img src={selectedGame.img} alt={selectedGame.title} className="w-80 rounded-2xl shadow-2xl border border-white/10" />
              <div className="w-full space-y-2">
                <label className="text-xs font-bold text-white/50 uppercase tracking-wider pl-1">Play Status</label>
                <select 
                  value={gameDetails?.status || 'Backlog'}
                  onChange={(e) => handleSaveGameData('status', e.target.value)}
                  className="w-full bg-black/40 border border-white/20 text-white text-base rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 backdrop-blur-md shadow-lg transition"
                >
                  <option value="Backlog" className="bg-[#0B0E14]">Backlog</option>
                  <option value="Playing" className="bg-[#0B0E14]">Playing</option>
                  <option value="Completed" className="bg-[#0B0E14]">Completed</option>
                  <option value="Abandoned" className="bg-[#0B0E14]">Abandoned</option>
                </select>
              </div>
            </div>

            {/* Right Column */}
            <div className="flex-1 flex flex-col pt-8">
              <h2 className="text-6xl font-black text-white tracking-tight mb-4 drop-shadow-2xl">{selectedGame.title}</h2>
              
              <div className="flex items-center gap-4 text-xl font-medium text-white/70 mb-12">
                <span className="bg-white/10 px-3 py-1 rounded-lg border border-white/10 backdrop-blur-sm">{gameDetails ? gameDetails.year : '...'}</span>
                <span>{gameDetails ? gameDetails.genres : 'Loading details...'}</span>
              </div>

              <div className="flex-1 flex flex-col gap-6 max-w-5xl">
                
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

                {/* Story */}
                <div className="bg-black/30 border border-white/10 backdrop-blur-md rounded-2xl p-6 shadow-inner">
                  <h3 className="text-sm font-bold text-white/70 tracking-wide mb-3">Story</h3>
                  <p className="text-slate-300 text-base leading-relaxed">
                    {gameDetails ? gameDetails.summary : 'Loading from IGDB...'}
                  </p>
                </div>
              </div>
            </div>
            </div>
          )}

          {/* Controls */}
          <div className="absolute top-8 right-8 z-50 flex items-center gap-4">
            {gameDetails?.video_id && (
              <>
                <button 
                  onClick={toggleMute}
                  className="p-4 bg-black/20 hover:bg-white/10 border border-white/10 rounded-full text-white/70 hover:text-white backdrop-blur-md transition-all shadow-xl"
                  title={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? <VolumeX size={28} /> : <Volume2 size={28} />}
                </button>
                {isVideoMode ? (
                  <button 
                    onClick={() => setIsVideoMode(false)}
                    className="flex items-center gap-3 px-6 py-4 bg-white/20 hover:bg-white/30 border border-white/20 rounded-full text-white font-bold backdrop-blur-md transition-all shadow-xl"
                  >
                    <List size={28} />
                    <span className="text-lg">Show Details</span>
                  </button>
                ) : (
                  <>
                    <button 
                      onClick={() => {
                        setCurrentVideoId(gameDetails.video_id);
                        setIsVideoMode(true);
                      }}
                      className="flex items-center gap-3 px-6 py-4 bg-black/20 hover:bg-white/10 border border-white/10 rounded-full text-white/70 hover:text-white font-bold backdrop-blur-md transition-all shadow-xl"
                    >
                      <PlayCircle size={28} />
                      <span className="text-lg">Watch Trailer</span>
                    </button>
                    {gameDetails.videos && gameDetails.videos.find((v: any) => v.name.toLowerCase().includes('gameplay')) && (
                      <button 
                        onClick={() => {
                          const gameplay = gameDetails.videos.find((v: any) => v.name.toLowerCase().includes('gameplay'));
                          setCurrentVideoId(gameplay.id);
                          setIsVideoMode(true);
                        }}
                        className="flex items-center gap-3 px-6 py-4 bg-indigo-600/80 hover:bg-indigo-500 border border-indigo-400/30 rounded-full text-white font-bold backdrop-blur-md transition-all shadow-xl"
                      >
                        <Gamepad2 size={28} />
                        <span className="text-lg">Watch Gameplay</span>
                      </button>
                    )}
                  </>
                )}
              </>
            )}
            <button 
              onClick={() => setSelectedGame(null)}
              className="p-4 bg-black/20 hover:bg-white/10 border border-white/10 rounded-full text-white/70 hover:text-white backdrop-blur-md transition-all shadow-xl"
            >
              <X size={28} />
            </button>
          </div>
        </div>
      )}

    </DragDropContext>

  );
}