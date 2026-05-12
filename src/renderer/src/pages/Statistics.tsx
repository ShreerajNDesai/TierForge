import { useState, useEffect } from 'react';
import { BarChart2, Trophy, Check, Library, CheckCircle, Target, Crown, Gamepad2, Wrench, Sparkles, RefreshCw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, AreaChart, Area } from 'recharts';
import { useGlobal } from '../context/GlobalContext';

const Statistics = () => {
  const { libraryGames, handleGameClick, setLibraryGames } = useGlobal();
  const [aiProfile, setAiProfile] = useState<string | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isBackfilling, setIsBackfilling] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const checkBackfill = async () => {
      if (!libraryGames || libraryGames.length === 0) return;
      
      const needsBackfill = libraryGames.some((g: any) => !g.release_year || g.release_year === '' || !g.genres || g.genres === '');
      
      if (needsBackfill && !isBackfilling) {
        setIsBackfilling(true);
        try {
          await window.api.backfillMetadata();
          const updatedGames = await window.api.getAllGames();
          if (isMounted && typeof setLibraryGames === 'function') {
            setLibraryGames(updatedGames);
          }
        } catch (err) {
          console.error('Failed to backfill metadata:', err);
        } finally {
          if (isMounted) setIsBackfilling(false);
        }
      }
    };
    
    checkBackfill();
    return () => { isMounted = false; };
  }, [libraryGames, isBackfilling, setLibraryGames]);

  const totalGames = libraryGames.length;
  const completedGames = libraryGames.filter((g: any) => g.status === 'Completed').length;
  const completionRate = Math.round((completedGames / (totalGames || 1)) * 100);
  const sTierCount = libraryGames.filter((g: any) => g.tier === 's').length;
  const playingCount = libraryGames.filter((g: any) => g.status === 'Playing').length;
  const backlogCount = libraryGames.filter((g: any) => (g.status || 'Backlog') === 'Backlog').length;
  const droppedCount = libraryGames.filter((g: any) => g.status === 'Abandoned' || g.status === 'Dropped').length;

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

  const dustyMasterpieces = libraryGames.filter((g: any) => g.tier === 's' && (g.status || 'Backlog') === 'Backlog');
  const completedList = libraryGames.filter((g: any) => g.status === 'Completed');

  const genreCounts: Record<string, number> = {};
  libraryGames.forEach((game: any) => {
    if (game.genres && game.genres !== 'Unknown') {
      const genresList = typeof game.genres === 'string' ? game.genres.split(',') : (Array.isArray(game.genres) ? game.genres : []);
      genresList.forEach((g: string) => {
        const trimmedGenre = g.trim();
        if (trimmedGenre) {
          genreCounts[trimmedGenre] = (genreCounts[trimmedGenre] || 0) + 1;
        }
      });
    }
  });

  const topGenres = Object.entries(genreCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));
    
  const maxGenreCount = topGenres.length > 0 ? topGenres[0].count : 1;

  // Studio Loyalty Calculation
  const studioCounts: Record<string, number> = {};
  libraryGames.forEach((game: any) => {
    if (game.developers && typeof game.developers === 'string') {
      const devs = game.developers.split(',');
      devs.forEach((d: string) => {
        const trimmed = d.trim();
        if (trimmed && trimmed !== '-') {
          studioCounts[trimmed] = (studioCounts[trimmed] || 0) + 1;
        }
      });
    }
  });

  const topStudios = Object.entries(studioCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));
    
  const maxStudioCount = topStudios.length > 0 ? topStudios[0].count : 1;

  // Era/Decade Data Calculation
  const yearCounts: Record<string, number> = {};
  libraryGames.forEach((game: any) => {
    if (game.release_year && game.release_year !== 'Unknown') {
      yearCounts[game.release_year] = (yearCounts[game.release_year] || 0) + 1;
    }
  });

  const eraData = Object.entries(yearCounts)
    .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
    .map(([year, count]) => ({ year, count }));

  const handleGenerateProfile = async () => {
    setIsProfileLoading(true);
    const statsObj = {
      completionRate: `${completionRate}%`,
      totalGames,
      topGenres: topGenres.map(g => g.name),
      topStudios: topStudios.map(s => s.name)
    };
    try {
      const profile = await window.api.getGamerProfile(JSON.stringify(statsObj));
      setAiProfile(profile);
    } catch (e) {
      console.error(e);
      setAiProfile("Failed to generate AI profile. The Oracle is currently sleeping.");
    } finally {
      setIsProfileLoading(false);
    }
  };

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

      {/* AI Gamer Roast / Profile Banner */}
      <div className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-500/30 rounded-2xl p-6 mb-8 flex items-center justify-between">
        <div className="flex-1 mr-6">
          <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
            <Sparkles size={20} className="text-purple-400" />
            AI Gamer Profile
          </h2>
          {aiProfile ? (
            <p className="text-purple-200/80 italic leading-relaxed text-sm">{aiProfile}</p>
          ) : (
            <p className="text-slate-400 text-sm">Let the AI Oracle analyze your library and roast your gaming habits (lovingly).</p>
          )}
        </div>
        <div className="shrink-0 flex items-center">
          {aiProfile ? (
            <button
              onClick={handleGenerateProfile}
              disabled={isProfileLoading}
              className="p-3 rounded-full bg-white/5 hover:bg-white/10 text-purple-400 transition-colors border border-white/10"
              title="Regenerate Profile"
            >
              <RefreshCw size={18} className={isProfileLoading ? "animate-spin" : ""} />
            </button>
          ) : (
            <button
              onClick={handleGenerateProfile}
              disabled={isProfileLoading}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 font-bold transition-colors border border-purple-500/50"
            >
              {isProfileLoading ? (
                <><RefreshCw size={18} className="animate-spin" /> Analyzing...</>
              ) : (
                <><Sparkles size={18} /> Generate Profile</>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-white/5 to-transparent border border-white/10 rounded-2xl p-6 backdrop-blur-md">
          <div className="flex items-center gap-2 mb-2">
            <Library size={20} className="text-blue-400"/>
            <p className="text-slate-400 text-sm font-medium">Total Games</p>
          </div>
          <p className="text-5xl font-black bg-gradient-to-r from-blue-400 to-blue-200 bg-clip-text text-transparent">{totalGames}</p>
        </div>
        <div className="bg-gradient-to-br from-white/5 to-transparent border border-white/10 rounded-2xl p-6 backdrop-blur-md">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle size={20} className="text-green-400"/>
            <p className="text-slate-400 text-sm font-medium">Completed</p>
          </div>
          <p className="text-5xl font-black bg-gradient-to-r from-green-400 to-green-200 bg-clip-text text-transparent">{completedGames}</p>
        </div>
        <div className="bg-gradient-to-br from-white/5 to-transparent border border-white/10 rounded-2xl p-6 backdrop-blur-md">
          <div className="flex items-center gap-2 mb-2">
            <Target size={20} className="text-purple-400"/>
            <p className="text-slate-400 text-sm font-medium">Completion Rate</p>
          </div>
          <p className="text-5xl font-black bg-gradient-to-r from-purple-400 to-purple-200 bg-clip-text text-transparent">{completionRate}<span className="text-3xl ml-1 text-purple-400/80">%</span></p>
        </div>
        <div className="bg-gradient-to-br from-white/5 to-transparent border border-white/10 rounded-2xl p-6 backdrop-blur-md">
          <div className="flex items-center gap-2 mb-2">
            <Crown size={20} className="text-rose-400"/>
            <p className="text-slate-400 text-sm font-medium">S-Tier Masterpieces</p>
          </div>
          <p className="text-5xl font-black bg-gradient-to-r from-rose-400 to-rose-200 bg-clip-text text-transparent">{sTierCount}</p>
        </div>
      </div>

      {/* Library Health Progress Bar */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md mb-8">
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

      {/* 3-Column Charts */}
      <div className="relative grid grid-cols-3 gap-6 mb-8">
        {isBackfilling && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#121620]/80 backdrop-blur-sm rounded-2xl">
            <RefreshCw className="animate-spin text-indigo-400 mb-4" size={32}/>
            <p className="text-white font-bold">Syncing Historical Metadata...</p>
            <p className="text-slate-400 text-sm">Upgrading your library with genres and studio data.</p>
          </div>
        )}
        {/* Tier Distribution Bar Chart */}
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

        {/* Favorite Genres */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md h-96 flex flex-col">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <Gamepad2 className="text-indigo-400"/> Favorite Genres
          </h3>
          <div className="flex-1 flex flex-col gap-4 justify-center">
            {topGenres.length > 0 ? topGenres.map((genre, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-24 text-sm font-medium text-slate-300 truncate" title={genre.name}>{genre.name}</div>
                <div className="flex-1 h-3 bg-slate-800/80 rounded-full overflow-hidden border border-white/5">
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 rounded-full"
                    style={{ width: `${(genre.count / maxGenreCount) * 100}%` }}
                  ></div>
                </div>
                <div className="w-16 text-right text-xs font-bold text-slate-400">{genre.count}</div>
              </div>
            )) : (
              <div className="flex items-center justify-center h-full text-slate-500 text-sm">No genre data yet</div>
            )}
          </div>
        </div>

        {/* Studio Loyalty */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md h-96 flex flex-col">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <Wrench className="text-cyan-400" size={20}/> Studio Loyalty
          </h3>
          <div className="flex-1 flex flex-col gap-4 justify-center">
            {topStudios.length > 0 ? topStudios.map((studio, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-24 text-sm font-medium text-slate-300 truncate" title={studio.name}>{studio.name}</div>
                <div className="flex-1 h-3 bg-slate-800/80 rounded-full overflow-hidden border border-white/5">
                  <div 
                    className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 rounded-full"
                    style={{ width: `${(studio.count / maxStudioCount) * 100}%` }}
                  ></div>
                </div>
                <div className="w-16 text-right text-xs font-bold text-slate-400">{studio.count}</div>
              </div>
            )) : (
              <div className="flex items-center justify-center h-full text-slate-500 text-sm">No studio data yet</div>
            )}
          </div>
        </div>
      </div>

      {/* Era/Decade Area Chart */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md mb-8 h-80">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-purple-400"></div>
          Release Eras
        </h3>
        {eraData.length > 0 ? (
          <ResponsiveContainer width="100%" height="85%">
            <AreaChart data={eraData}>
              <defs>
                <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="year" stroke="#CBD5E1" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#475569" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip
                cursor={{ stroke: 'rgba(255,255,255,0.1)' }}
                contentStyle={{ background: '#1E293B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', fontSize: '13px' }}
                itemStyle={{ color: '#CBD5E1' }}
              />
              <Area type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorUv)" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-slate-500 text-sm">No release year data available</div>
        )}
      </div>

      {/* Unplayed S-Tier Warning */}
      {dustyMasterpieces.length > 0 && (
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
      )}

      {/* Trophy Cabinet — Hall of Fame */}
      {completedList.length > 0 && (
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
      )}
    </div>
  );
};

export default Statistics;