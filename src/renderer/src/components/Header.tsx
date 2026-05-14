import React, { useState, useRef, useEffect } from 'react';
import { Search, Check, Plus, UploadCloud, RefreshCw, Download, Bell, BarChart2, Minus, Square, X, Camera, Image as ImageIcon, ChevronDown } from 'lucide-react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { useGlobal } from '../context/GlobalContext';

const Header = () => {
  const {
    activeTab,
    setActiveTab,
    librarySearch,
    setLibrarySearch,
    searchQuery,
    handleSearch,
    searchResults,
    handleAddGame,
    data,
    setShowImportModal,
    setGeminiKey,
    handleScanPC,
    isScanning,
    notifications,
    setNotifications
  } = useGlobal();

  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExportClick = (type: 'tierlist' | 'library') => {
    setShowExportMenu(false);
    if (activeTab !== type) {
      setActiveTab(type);
    }
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent(`trigger-export-${type}`));
    }, 150);
  };

  return (
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
          {searchResults.length > 0 && activeTab !== 'library' && activeTab !== 'discover' && (
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

          <div className="relative" ref={exportMenuRef}>
            <button 
              onClick={() => setShowExportMenu(!showExportMenu)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                showExportMenu ? 'bg-purple-500/30 text-purple-200' : 'bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 hover:text-purple-200'
              }`}
            >
              <Camera size={16} /> Export Hub <ChevronDown size={14} className={`transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
            </button>

            {showExportMenu && (
              <div className="absolute top-full right-0 mt-2 w-56 bg-[#151924] border border-slate-700/80 rounded-xl shadow-2xl py-2 z-[200]">
                <button 
                  onClick={() => handleExportClick('tierlist')}
                  className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-indigo-500/20 hover:text-indigo-300 flex items-center gap-3 transition-colors"
                >
                  <Camera size={16} className="text-indigo-400" /> Export Tier List
                </button>
                <button 
                  onClick={() => handleExportClick('library')}
                  className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-purple-500/20 hover:text-purple-300 flex items-center gap-3 transition-colors"
                >
                  <ImageIcon size={16} className="text-purple-400" /> Export Library Mosaic
                </button>
              </div>
            )}
          </div>
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
          <div className="relative" ref={notificationsRef}>
            <div 
              className="cursor-pointer hover:text-white transition"
              onClick={() => {
                setShowNotifications(!showNotifications);
                if (!showNotifications && notifications.some(n => !n.read)) {
                  setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                }
              }}
            >
              <Bell size={18} />
              {notifications.some(n => !n.read) && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-purple-500 rounded-full border border-[#0B0E14]"></span>
              )}
            </div>
            
            {showNotifications && (
              <div className="absolute top-12 right-0 w-80 bg-[#121620]/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden z-[9999] flex flex-col">
                <div className="p-4 border-b border-white/5 bg-white/5 flex justify-between items-center">
                  <h3 className="text-white font-bold">Notifications</h3>
                </div>
                <div className="max-h-96 overflow-y-auto custom-scrollbar">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-sm">
                      No new notifications
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} className={`p-4 border-b border-white/5 hover:bg-white/5 transition flex flex-col gap-1 ${n.read ? 'opacity-70' : ''}`}>
                        <h4 className="text-sm font-bold text-white">{n.title}</h4>
                        <p className="text-xs text-slate-400 leading-snug">{n.message}</p>
                        <span className="text-[10px] text-slate-500 mt-1">{n.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
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
  );
};

export default Header;
