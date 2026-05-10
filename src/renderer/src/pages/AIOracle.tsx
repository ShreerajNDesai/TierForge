import React from 'react';
import { Wand2, Sparkles, RefreshCw, Gamepad2, Plus } from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';

const AIOracle = () => {
  const {
    oracleLoading,
    oracleRecs,
    oracleError,
    setOracleLoading,
    setOracleError,
    setOraclePhase,
    setOracleRecs,
    oraclePhase,
    handleGameClick,
    loadGames
  } = useGlobal();

  return (
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
  );
};

export default AIOracle;
