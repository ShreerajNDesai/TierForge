import React, { useState, useEffect, useMemo } from 'react';
import { Check, Plus, Search, ChevronDown } from 'lucide-react';
import Tilt from 'react-parallax-tilt';
import { useGlobal } from '../context/GlobalContext';

const Discover = () => {
  const {
    discoverFilter,
    setDiscoverFilter,
    setDiscoverOffset,
    setHasMoreDiscover,
    isDiscoverLoading,
    discoverGames,
    discoverOffset,
    handleGameClick,
    data,
    handleAddGame,
    hasMoreDiscover,
    searchQuery,
    setSearchQuery
  } = useGlobal();

  const [showGenreMenu, setShowGenreMenu] = useState(false);
  const [tagSearch, setTagSearch] = useState('');
  const [dynamicTags, setDynamicTags] = useState<{id: string, label: string}[]>([]);
  const [discoverSearchResults, setDiscoverSearchResults] = useState<any[]>([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [previousFilter, setPreviousFilter] = useState<string>('trending');

  const handleDiscoverScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 100 && !isDiscoverLoading && hasMoreDiscover) {
      setDiscoverOffset(prev => prev + 30);
    }
  };

  const primaryFilters = [
    { id: 'trending', label: '🔥 Trending' },
    { id: 'highly_rated', label: '🏆 Masterpieces' },
    { id: 'new', label: '✨ New Releases' },
    { id: 'upcoming', label: '📅 Upcoming' },
    { id: 'rpg', label: '🗡️ RPGs' },
    { id: 'shooter', label: '🔫 Shooters' },
    { id: 'indie', label: '💎 Indie' }
  ];

  const igdbGenres = [
    { id: 'pinball', label: 'Pinball' },
    { id: 'adventure', label: 'Adventure' },
    { id: 'indie', label: 'Indie' },
    { id: 'arcade', label: 'Arcade' },
    { id: 'visual_novel', label: 'Visual Novel' },
    { id: 'card_board_game', label: 'Card & Board Game' },
    { id: 'moba', label: 'MOBA' },
    { id: 'point_and_click', label: 'Point-and-click' },
    { id: 'fighting', label: 'Fighting' },
    { id: 'shooter', label: 'Shooter' },
    { id: 'music', label: 'Music' },
    { id: 'platform', label: 'Platform' },
    { id: 'puzzle', label: 'Puzzle' },
    { id: 'racing', label: 'Racing' },
    { id: 'rts', label: 'Real Time Strategy (RTS)' },
    { id: 'rpg', label: 'Role-playing (RPG)' },
    { id: 'simulator', label: 'Simulator' },
    { id: 'sport', label: 'Sport' },
    { id: 'strategy', label: 'Strategy' },
    { id: 'tbs', label: 'Turn-based strategy (TBS)' },
    { id: 'tactical', label: 'Tactical' },
    { id: 'hack_and_slash', label: 'Hack and slash/Beat \'em up' },
    { id: 'quiz_trivia', label: 'Quiz/Trivia' },
    { id: 'action', label: 'Action' },
    { id: 'fantasy', label: 'Fantasy' },
    { id: 'sci_fi', label: 'Science fiction' },
    { id: 'horror', label: 'Horror' },
    { id: 'thriller', label: 'Thriller' },
    { id: 'survival', label: 'Survival' },
    { id: 'historical', label: 'Historical' },
    { id: 'stealth', label: 'Stealth' },
    { id: 'comedy', label: 'Comedy' },
    { id: 'business', label: 'Business' },
    { id: 'drama', label: 'Drama' },
    { id: 'non_fiction', label: 'Non-fiction' },
    { id: 'sandbox', label: 'Sandbox' },
    { id: 'educational', label: 'Educational' },
    { id: 'kids', label: 'Kids' },
    { id: 'open_world', label: 'Open world' },
    { id: 'warfare', label: 'Warfare' },
    { id: 'party', label: 'Party' },
    { id: '4x', label: '4X' },
    { id: 'erotic', label: 'Erotic' },
    { id: 'mystery', label: 'Mystery' },
    { id: 'romance', label: 'Romance' }
  ];

  useEffect(() => {
    window.api.getSteamTags().then((steamTags: {id: string, label: string}[]) => {
      const merged = [...igdbGenres];
      const igdbLabels = new Set(igdbGenres.map(g => g.label.toLowerCase()));
      
      steamTags.forEach(tag => {
        if (!igdbLabels.has(tag.label.toLowerCase())) {
          merged.push({ id: 'steamtag_' + tag.id, label: tag.label });
        }
      });
      setDynamicTags(merged);
    });
  }, []);

  const handleFilterSelect = (id: string) => {
    setDiscoverFilter(id);
    if (searchQuery) {
      setSearchQuery('');
    }
    setDiscoverOffset(0);
    setHasMoreDiscover(true);
    setShowGenreMenu(false);
    setTagSearch('');
  };

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (searchQuery.length > 2) {
      setIsSearchLoading(true);
      if (discoverFilter !== 'search') {
        setPreviousFilter(discoverFilter);
        setDiscoverFilter('search');
      }
      
      timeoutId = setTimeout(() => {
        window.api.searchGames(searchQuery).then(results => {
          setDiscoverSearchResults(results);
          setIsSearchLoading(false);
        });
      }, 500); // debounce search
    } else if (searchQuery.length === 0 && discoverFilter === 'search') {
      setDiscoverFilter(previousFilter);
      setDiscoverSearchResults([]);
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [searchQuery, discoverFilter, previousFilter]);

  const filteredTags = useMemo(() => {
    if (!tagSearch.trim()) return dynamicTags;
    return dynamicTags.filter(t => t.label.toLowerCase().includes(tagSearch.toLowerCase()));
  }, [dynamicTags, tagSearch]);

  return (
    <div 
      onScroll={handleDiscoverScroll}
      className="flex-1 overflow-y-auto px-10 pb-12 pt-6 relative custom-scrollbar"
    >
      <div className="flex justify-between items-end mb-6 px-1">
        <div>
          <h1 className="text-[34px] font-extrabold text-white flex items-center gap-4 tracking-tight leading-none mb-2">
            Discover <span className="text-[10px] bg-indigo-500/10 text-indigo-300 px-2.5 py-1 rounded-md font-semibold border border-indigo-500/20 tracking-wide uppercase align-middle relative -top-1">Find new games</span>
          </h1>
          <p className="text-slate-400 text-[15px]">Explore for your next adventure</p>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex gap-3 overflow-x-auto pb-4 mb-2 flex-nowrap no-scrollbar items-center">
        {primaryFilters.map(filter => (
          <button
            key={filter.id}
            onClick={() => handleFilterSelect(filter.id)}
            className={`px-5 py-2.5 rounded-full font-semibold text-sm whitespace-nowrap shrink-0 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:bg-white/10 ${
              discoverFilter === filter.id 
                ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]' 
                : 'bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300'
            }`}
          >
            {filter.label}
          </button>
        ))}
        
        <button 
          onClick={() => setShowGenreMenu(!showGenreMenu)} 
          className={`px-5 py-2.5 rounded-full font-bold text-sm transition-all flex items-center gap-2 shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:bg-white/10 ${
            showGenreMenu 
              ? 'bg-indigo-500 text-white border-indigo-400' 
              : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/30'
          }`}
        >
          <Search size={16} /> Browse All Genres <ChevronDown size={16} className={`transition-transform duration-300 ${showGenreMenu ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Mega Menu Dropdown */}
      {showGenreMenu && (
        <div className="w-full bg-[#121620]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-8 mb-8 shadow-2xl z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="sticky top-0 mb-6 bg-[#121620] pb-2 z-10">
            <div className="relative w-full max-w-lg">
              <Search className="absolute left-3 top-3 text-slate-500" size={18} />
              <input 
                type="text" 
                placeholder="Search hundreds of Steam tags and IGDB genres..." 
                value={tagSearch} 
                onChange={(e) => setTagSearch(e.target.value)} 
                className="w-full bg-black/40 border border-white/10 text-white rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-indigo-500 transition" 
              />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
            {filteredTags.map(genre => {
              const isSteam = genre.id.startsWith('steamtag_');
              return (
                <button
                  key={genre.id}
                  onClick={() => handleFilterSelect(genre.id)}
                  className={`px-4 py-2.5 rounded-xl text-left text-xs font-bold transition-all border focus:outline-none focus:ring-2 focus:ring-white focus:bg-white/10 ${
                    discoverFilter === genre.id
                      ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg'
                      : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span className={isSteam ? 'text-sky-300' : ''}>{genre.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-5 gap-6">
        {(isDiscoverLoading && discoverOffset === 0 && searchQuery.length <= 2) || isSearchLoading ? (
          Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-white/5 rounded-2xl h-72 border border-white/5"></div>
          ))
        ) : (
          <>
            {(searchQuery.length > 2 ? discoverSearchResults : discoverGames).map(game => (
              <div 
                key={game.id} 
                tabIndex={0}
                onClick={() => handleGameClick(game)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleGameClick(game); }}
                className="group relative cursor-pointer focus:outline-none focus:ring-4 focus:ring-indigo-500 focus:scale-105 focus:shadow-[0_0_30px_rgba(99,102,241,0.6)] rounded-2xl transition-all relative z-0 hover:z-50"
              >
                <Tilt
                  glareEnable={true}
                  glareMaxOpacity={0.3}
                  glarePosition="all"
                  glareBorderRadius="1rem"
                  tiltMaxAngleX={10}
                  tiltMaxAngleY={10}
                  scale={1.05}
                  transitionSpeed={400}
                  className="w-full h-72 rounded-2xl"
                >
                  <div className="w-full h-full rounded-2xl overflow-hidden shadow-lg border border-slate-700/50 group-hover:border-indigo-500/50 transition duration-300 relative">
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
                </Tilt>
                <div className="mt-3 text-center">
                  <h3 className="text-sm font-semibold text-slate-200 group-hover:text-indigo-300 transition line-clamp-1">{game.title}</h3>
                </div>
              </div>
            ))}
            {isDiscoverLoading && discoverOffset > 0 && searchQuery.length <= 2 && (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={`loading-more-${i}`} className="animate-pulse bg-white/5 rounded-2xl h-72 border border-white/5"></div>
              ))
            )}
            {searchQuery.length > 2 && discoverSearchResults.length === 0 && !isSearchLoading && (
              <div className="col-span-5 flex flex-col items-center justify-center py-20 text-slate-400">
                <Search size={48} className="mb-4 opacity-20" />
                <p className="text-xl font-semibold">No games found for "{searchQuery}"</p>
                <p className="text-sm mt-2 opacity-60">Try adjusting your search terms</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Discover;
