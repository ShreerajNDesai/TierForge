import { useEffect } from 'react';
import * as htmlToImage from 'html-to-image';
import { Crown, Star, Diamond, LayoutGrid, ThumbsDown, Skull, Ban, Trash2, Menu, Filter, ArrowUpDown, Grid, List, Plus, RefreshCw } from 'lucide-react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { useGlobal } from '../context/GlobalContext';

const TierList = () => {
  const exportTierList = async () => {
    try {
      // Small delay to ensure rendering is complete if we just switched tabs
      await new Promise(r => setTimeout(r, 100));
      const container = document.getElementById('tierlist-container');
      if (!container) return;
      const dataUrl = await htmlToImage.toPng(container, { 
        quality: 1, 
        pixelRatio: 2, 
        backgroundColor: '#0B0E14'
      });
      await window.api.saveImage(dataUrl, 'MyTierList.png');
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const handleEvent = () => exportTierList();
    window.addEventListener('trigger-export-tierlist', handleEvent);
    return () => window.removeEventListener('trigger-export-tierlist', handleEvent);
  }, []);
  const {
    data,
    isDraggingItem,
    handleGameClick,
    filterStatus,
    handleFilterClick,
    sortOrder,
    handleSortClick,
    filteredAndSortedCollection,
    handleScanPC,
    isScanning
  } = useGlobal();

  return (
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
      <div id="tierlist-container" className="space-y-4 mb-12 p-6 bg-[#0B0E14] rounded-2xl">
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
          )
        })}
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
  );
};

export default TierList;
