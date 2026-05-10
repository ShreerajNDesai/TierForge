import React from 'react';
import { BarChart2, Trophy, Check } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useGlobal } from '../context/GlobalContext';

const Statistics = () => {
  const { libraryGames, handleGameClick } = useGlobal();

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

  const dustyMasterpieces = libraryGames.filter((g: any) => g.tier === 's' && (g.status || 'Backlog') === 'Backlog');
  const completedList = libraryGames.filter((g: any) => g.status === 'Completed');

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
