import React, { useState } from 'react';
import { Trophy, RefreshCw, Crown, Diamond, Gamepad2, Star, Search, X, ChevronDown } from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';

const Rankings = () => {
  const {
    rankingsLoading,
    setRankingsLoading,
    globalRankings,
    setGlobalRankings,
    rankingsGenre,
    setRankingsGenre,
    handleGameClick
  } = useGlobal();

  const [showMegaMenu, setShowMegaMenu] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setRankingsLoading(true);
    try {
      await window.api.clearRankingsCache(rankingsGenre);
      const data = await window.api.getCachedRankings(rankingsGenre);
      setGlobalRankings((prev: any) => ({
        ...(prev || {}),
        [rankingsGenre]: data
      }));
    } catch (err) {
      console.error("Failed to refresh rankings:", err);
    } finally {
      setIsRefreshing(false);
      setRankingsLoading(false);
    }
  };

  const mainstreamFilters = [
    { key: 'overall', label: '👑 Overall', icon: Crown },
    { key: 'action', label: '⚔️ Action', icon: Gamepad2 },
    { key: 'adventure', label: '🧭 Adventure', icon: Diamond },
    { key: 'horror', label: '👻 Horror', icon: Star },
    { key: 'sci_fi', label: '🚀 Sci-Fi', icon: Gamepad2 },
    { key: 'family', label: '👨‍👩‍👧‍👦 Family', icon: Star }
  ];

  const hardcoreGenres = [
    'Action-Adventure', 'Action RPG', 'Artillery', 'Auto Battler', 'Battle Royale', 
    'Beat em up', 'Board Game', 'Card Game', 'Casual', 'City Builder', 
    'Construction and Management Simulation', 'CRPG', 'Dungeon Crawl', 'Educational', 
    'Fighting', 'FPS', 'Gacha', 'Grand Strategy', 'Graphic Adventure', 'Hack and Slash', 
    'Hero Shooter', 'Hidden Object', 'Idle', 'Interactive Movie', 'JRPG', 
    'Life Simulation', 'Light Gun Shooter', 'MMORPG', 'MOBA', 'Monster-taming', 
    'Music', 'Narrative', 'Open World', 'Party', 'Physics', 'Pinball', 
    'Platformer', 'Point-and-Click', 'Puzzle', 'Puzzle-Platformer', 'Racing', 
    'RTS', 'RTT', 'Rhythm', 'Roguelike', 'Roguelite', 'RPG', 'Sandbox', 
    'Shmup', 'Shooter', 'Simulation', 'Social Deduction', 'Soulslike', 'Sports', 
    'Stealth', 'Strategy', 'Survival', 'Survival Horror', 'Tactical RPG', 
    'Text Adventure', 'TPS', 'Tower Defense', 'Traditional Puzzle', 'Trivia', 
    'TBS', 'TBT', 'Typing', 'Vehicle Simulation', 'Visual Novel', 'Wargame'
  ];

  const currentRankingList = globalRankings ? globalRankings[rankingsGenre] : [];

  const handleGenreSelect = (key: string) => {
    setRankingsGenre(key);
    setShowMegaMenu(false);
  };

  if (rankingsLoading && (!globalRankings || !globalRankings[rankingsGenre])) {
    return (
      <div className="flex flex-col items-center justify-center py-20 flex-1">
        <RefreshCw size={48} className="text-yellow-400 animate-spin mb-4" />
        <p className="text-white text-xl font-bold mb-2">Initial Data Fetch...</p>
        <p className="text-slate-400 text-sm max-w-xs text-center">We're scraping current leaderboards and enriching them with IGDB art. This first load takes about 5-10 seconds.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-10 pb-12 pt-10 relative custom-scrollbar">
      {/* Mega Menu Overlay */}
      {showMegaMenu && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-10">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-xl transition-all"
            onClick={() => setShowMegaMenu(false)}
          />
          <div className="relative w-full max-w-5xl max-h-[80vh] bg-slate-900/80 border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h2 className="text-2xl font-black text-white flex items-center gap-3">
                <Search className="text-yellow-400" /> Browse Hardcore Genres
              </h2>
              <button 
                onClick={() => setShowMegaMenu(false)}
                className="p-2 hover:bg-white/10 rounded-full transition"
              >
                <X size={24} className="text-slate-400" />
              </button>
            </div>
            <div className="p-8 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {hardcoreGenres.map(genre => (
                  <button
                    key={genre}
                    onClick={() => handleGenreSelect(genre.toLowerCase())}
                    className={`px-4 py-3 rounded-xl text-left text-sm font-bold transition-all border ${
                      rankingsGenre === genre.toLowerCase()
                        ? 'bg-yellow-600 border-yellow-400 text-white'
                        : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {genre}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-8 flex items-end">
        <div>
          <h1 className="text-4xl font-black text-white mb-2 flex items-center gap-3">
            <Trophy className="text-yellow-400" size={36}/> Global Hall of Fame
          </h1>
          <p className="text-slate-400 text-[15px]">The highest user-rated games — scraped live from critic leaderboards and cached locally.</p>
        </div>
        <button 
          onClick={handleRefresh} 
          disabled={isRefreshing || rankingsLoading} 
          className="ml-auto flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-bold text-slate-300 transition-all disabled:opacity-50"
        >
          <RefreshCw size={16} className={isRefreshing ? "animate-spin text-indigo-400" : ""} /> 
          {isRefreshing ? "Scraping fresh data..." : "Refresh Rankings"}
        </button>
      </div>

      {/* Genre Filter Pills */}
      <div className="flex gap-3 mb-10 overflow-x-auto pb-4 no-scrollbar items-center">
        {mainstreamFilters.map(genre => (
          <button
            key={genre.key}
            onClick={() => setRankingsGenre(genre.key)}
            className={`px-5 py-2.5 rounded-full font-semibold text-sm whitespace-nowrap transition-all ${
              rankingsGenre === genre.key
                ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]'
                : 'bg-[#121620] border border-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            {genre.label}
          </button>
        ))}
        <button
          onClick={() => setShowMegaMenu(true)}
          className="px-5 py-2.5 rounded-full font-bold text-sm bg-indigo-900/40 border border-indigo-700/50 text-indigo-200 hover:bg-indigo-900/60 transition-all whitespace-nowrap flex items-center gap-2"
        >
          <Search size={16} /> Browse All Genres <ChevronDown size={16} />
        </button>
      </div>

      {currentRankingList && currentRankingList.length >= 3 && (
        <>
          {/* Podium — Top 3 */}
          <div className="flex gap-6 mb-16 items-end justify-center">
            {[1, 0, 2].map(podiumIdx => {
              const game = currentRankingList[podiumIdx];
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
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${medalColor} flex items-center justify-center font-black text-lg shadow-xl mb-3 border-4 border-[#0B0E14]`}>
                    {podiumIdx === 0 ? <Crown size={22} /> : `#${podiumIdx + 1}`}
                  </div>
                  <div className={`relative w-full rounded-2xl overflow-hidden border-2 ${medalBorder} transition-all group-hover:scale-[1.03]`}>
                    <img src={game.img} alt={game.title} className={`w-full ${isFirst ? 'h-80' : 'h-64'} object-cover group-hover:scale-105 transition-transform duration-500`} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <p className={`text-white font-black ${isFirst ? 'text-xl' : 'text-base'} truncate mb-1`}>{game.title}</p>
                      <p className="text-slate-400 text-xs truncate mb-2">{game.genres}</p>
                      <div className="flex items-center gap-1.5">
                        <Star size={14} className="text-yellow-400" fill="currentColor" />
                        <span className="text-yellow-400 font-black text-sm">Critics Choice</span>
                      </div>
                    </div>
                  </div>
                  <span className={`mt-3 text-xs font-black uppercase tracking-widest ${podiumIdx === 0 ? 'text-yellow-400' : podiumIdx === 1 ? 'text-slate-400' : 'text-amber-600'}`}>{rankLabel}</span>
                </div>
              );
            })}
          </div>

          {/* Cinematic Leaderboard List — Rank 4+ */}
          <div className="space-y-6">
            {currentRankingList.slice(3).map((game: any, i: number) => {
              const rank = i + 4;
              return (
                <div
                  key={game.id}
                  onClick={async () => {
                    const matches = await window.api.searchGames(game.title);
                    if (matches && matches.length > 0) handleGameClick(matches[0]);
                  }}
                  className="group relative h-32 w-full overflow-hidden rounded-2xl border border-white/5 hover:border-yellow-500/40 cursor-pointer transition-all hover:scale-[1.01] hover:shadow-2xl"
                >
                  {/* Atmospheric Backdrop */}
                  <div className="absolute inset-0 overflow-hidden">
                    <img 
                      src={game.img} 
                      className="w-full h-full object-cover blur-md scale-110 opacity-20 transition-transform duration-700 group-hover:scale-100" 
                      alt=""
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/60 to-transparent" />
                  </div>

                  {/* Rank Watermark */}
                  <div className="absolute left-6 inset-y-0 flex items-center pointer-events-none">
                    <span className="text-8xl font-black text-white/5 italic">#{rank}</span>
                  </div>

                  {/* Foreground Content */}
                  <div className="relative h-full flex items-center px-8 gap-8">
                    {/* Vertical Poster */}
                    <div className="relative h-24 w-18 shrink-0 rounded-lg overflow-hidden border border-white/10 shadow-lg group-hover:border-yellow-500/50 transition">
                      <img src={game.img} className="h-full w-full object-cover" alt={game.title} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-2xl font-black text-white group-hover:text-yellow-200 transition-colors truncate">
                        {game.title}
                      </h3>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-slate-400 text-sm font-medium uppercase tracking-wider">{game.genres}</span>
                        <div className="flex items-center gap-1.5 bg-yellow-500/10 px-2 py-0.5 rounded-md border border-yellow-500/20">
                          <Star size={12} className="text-yellow-400" fill="currentColor" />
                          <span className="text-yellow-400 font-bold text-xs">Hall of Fame</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Hint */}
                    <div className="hidden md:flex items-center gap-2 text-slate-500 group-hover:text-white transition">
                      <span className="text-xs font-bold uppercase tracking-tighter">View Details</span>
                      <Search size={16} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default Rankings;
