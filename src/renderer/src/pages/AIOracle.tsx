import { useState } from 'react'
import {
  Wand2,
  Sparkles,
  RefreshCw,
  Gamepad2,
  Plus,
  Gem,
  Search,
  Stethoscope,
  Compass,
  ArrowRight
} from 'lucide-react'
import { useGlobal } from '../context/GlobalContext'
import { TransientScroll } from '../components/TransientScroll';

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
  } = useGlobal()

  const [activeTab, setActiveTab] = useState<'oracle' | 'advisor' | 'therapist'>('oracle')

  // Oracle Vibe Search
  const [vibeText, setVibeText] = useState('')
  const [deepCuts, setDeepCuts] = useState(false)

  // Advisor
  const [advisorTarget, setAdvisorTarget] = useState('')
  const [advisorResult, setAdvisorResult] = useState<{ score: number; review: string } | null>(null)

  // Therapist
  const [therapistResult, setTherapistResult] = useState<{
    title: string
    reason: string
    gameInfo: any
  } | null>(null)

  const renderTabs = () => (
    <div className="flex items-center gap-4 mb-8 bg-[#121620] p-1.5 rounded-2xl w-fit border border-white/5">
      <button
        onClick={() => {
          setActiveTab('oracle')
          setOracleError(null)
        }}
        className={`px-6 py-2.5 rounded-xl font-bold text-sm transition ${activeTab === 'oracle' ? 'bg-secondary-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
      >
        <div className="flex items-center gap-2">
          <Wand2 size={16} /> Vibe Search
        </div>
      </button>
      <button
        onClick={() => {
          setActiveTab('advisor')
          setOracleError(null)
        }}
        className={`px-6 py-2.5 rounded-xl font-bold text-sm transition ${activeTab === 'advisor' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
      >
        <div className="flex items-center gap-2">
          <Compass size={16} /> Advisor
        </div>
      </button>
      <button
        onClick={() => {
          setActiveTab('therapist')
          setOracleError(null)
        }}
        className={`px-6 py-2.5 rounded-xl font-bold text-sm transition ${activeTab === 'therapist' ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
      >
        <div className="flex items-center gap-2">
          <Stethoscope size={16} /> Backlog Therapist
        </div>
      </button>
    </div>
  )

  return (
    <TransientScroll className="flex-1 overflow-y-auto px-10 pb-12 pt-10 relative custom-scrollbar">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-3">
          <div className="p-3 bg-secondary-500/20 text-secondary-400 rounded-2xl">
            <Wand2 size={28} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-white tracking-tight">AI Oracle</h1>
            <p className="text-slate-400 text-[15px]">Advanced AI gaming intelligence tools</p>
          </div>
        </div>
      </div>

      {renderTabs()}

      {oracleError && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-6 py-4 rounded-2xl mb-8 max-w-3xl flex items-center gap-3">
          <div className="font-bold">Error:</div>
          <div>
            {oracleError === 'NO_API_KEY'
              ? 'Please set your Gemini API Key in Settings first.'
              : oracleError === 'NOT_ENOUGH_DATA'
                ? 'Rank some games in your Tier List first so the Oracle can learn your tastes!'
                : oracleError === 'EMPTY_BACKLOG'
                  ? 'Your backlog is empty! Go add some games first.'
                  : oracleError}
          </div>
        </div>
      )}

      {/* Loading State */}
      {oracleLoading && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="relative mb-8">
            <div className="w-28 h-28 rounded-full border-4 border-secondary-500/30 border-t-secondary-500 animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles size={36} className="text-secondary-400 animate-pulse" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white mb-3 animate-pulse">{oraclePhase}</h2>
          <p className="text-slate-500 text-sm">Processing quantum gaming matrices...</p>
        </div>
      )}

      {/* -------------------- ORACLE TAB (Vibe Search) -------------------- */}
      {activeTab === 'oracle' && !oracleLoading && oracleRecs.length === 0 && (
        <div className="flex flex-col items-center justify-center py-6 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4">
          {/* Main 1-Click Generation */}
          <div className="w-full flex flex-col items-center mb-8 pb-8 border-b border-white/10">
            <div className="relative mb-6">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-secondary-600/20 to-pink-600/20 border border-secondary-500/30 flex items-center justify-center">
                <Wand2 size={40} className="text-secondary-400" />
              </div>
              <div
                className="absolute inset-0 w-24 h-24 rounded-full bg-secondary-500/10 animate-ping"
                style={{ animationDuration: '3s' }}
              ></div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">
              Ready to discover your next obsession?
            </h2>
            <p className="text-slate-400 text-center mb-8 max-w-md">
              The Oracle analyzes your S-Tier favorites and Dropped games to find perfect matches
              you've never played.
            </p>

            <button
              onClick={async () => {
                setOracleLoading(true)
                setOracleError(null)
                setOraclePhase('Analyzing your gaming tastes...')
                setTimeout(() => setOraclePhase('Consulting the Oracle...'), 2000)
                setTimeout(() => setOraclePhase('Searching the multiverse of games...'), 4500)
                const result = await window.api.getAIRecommendations('', deepCuts)
                setOracleLoading(false)
                if (result.error) setOracleError(result.error)
                else setOracleRecs(result.recommendations)
              }}
              className="group relative px-10 py-4 bg-gradient-to-r from-secondary-600 to-pink-600 text-white font-bold text-lg rounded-2xl shadow-[0_0_30px_rgba(168,85,247,0.3)] hover:shadow-[0_0_40px_rgba(168,85,247,0.5)] transition-all overflow-hidden flex justify-center items-center gap-3 w-full"
            >
              <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors"></div>
              <Sparkles size={22} /> Generate Recommendations
            </button>
          </div>

          <div className="w-full flex items-center justify-between bg-gradient-to-r from-[#121620] to-[#151a28] border border-slate-700/50 hover:border-blue-500/40 rounded-2xl p-5 mb-8 transition">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/20 text-blue-400 rounded-xl">
                <Gem size={22} />
              </div>
              <div>
                <h3 className="text-white font-bold text-[15px]">Deep Cuts Only</h3>
                <p className="text-slate-500 text-sm">
                  Applies to all Oracle searches: ignore AAA games and find hidden indie gems.
                </p>
              </div>
            </div>
            <button
              onClick={() => setDeepCuts(!deepCuts)}
              className={`w-14 h-7 rounded-full relative transition-colors ${deepCuts ? 'bg-blue-500' : 'bg-slate-700'}`}
            >
              <div
                className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform ${deepCuts ? 'translate-x-7' : 'translate-x-0'}`}
              ></div>
            </button>
          </div>

          {/* Vibe Search Alternative */}
          <div className="w-full bg-[#121620]/50 border border-white/5 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Search size={18} className="text-secondary-400" /> The "Vibe" Search
            </h3>
            <p className="text-slate-400 text-sm mb-4">
              Or tell the Oracle exactly what you're in the mood for to narrow down the search.
            </p>

            <div className="w-full relative mb-4">
              <textarea
                value={vibeText}
                onChange={(e) => setVibeText(e.target.value)}
                placeholder="e.g. 'I just had a stressful day at work. I want a relaxing sci-fi game under 10 hours.'"
                className="w-full bg-[#0B0E14] border border-secondary-500/30 rounded-2xl p-4 text-slate-200 focus:outline-none focus:border-secondary-500 focus:ring-1 focus:ring-secondary-500 resize-none h-24 text-[14px] leading-relaxed shadow-inner"
              />
            </div>

            <button
              onClick={async () => {
                if (!vibeText.trim()) return
                setOracleLoading(true)
                setOracleError(null)
                setOraclePhase('Analyzing your gaming tastes and vibe...')
                setTimeout(() => setOraclePhase('Searching the multiverse...'), 3000)
                const result = await window.api.getAIRecommendations(vibeText, deepCuts)
                setOracleLoading(false)
                if (result.error) setOracleError(result.error)
                else setOracleRecs(result.recommendations)
              }}
              disabled={!vibeText.trim()}
              className="w-full px-6 py-3.5 bg-white/5 hover:bg-white/10 disabled:opacity-50 text-white font-bold rounded-xl border border-white/10 transition flex items-center justify-center gap-2"
            >
              Generate Vibe Matches
            </button>
          </div>
        </div>
      )}

      {/* Vibe Results */}
      {activeTab === 'oracle' && !oracleLoading && oracleRecs.length > 0 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <Sparkles size={24} className="text-secondary-400" /> Vibe Matches
            </h2>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setOracleRecs([])
                  setOracleError(null)
                  setVibeText('')
                  setDeepCuts(false)
                }}
                className="flex items-center gap-2 px-5 py-2.5 font-bold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition"
              >
                Clear Search
              </button>
              <button
                onClick={async () => {
                  setOracleRecs([])
                  setOracleLoading(true)
                  setOracleError(null)
                  setOraclePhase('Consulting the Oracle again...')
                  setTimeout(() => setOraclePhase('Searching the multiverse...'), 3000)
                  const result = await window.api.getAIRecommendations(vibeText, deepCuts)
                  setOracleLoading(false)
                  if (result.error) setOracleError(result.error)
                  else setOracleRecs(result.recommendations)
                }}
                className="flex items-center gap-2 px-5 py-2.5 font-bold text-secondary-300 hover:text-secondary-200 bg-secondary-500/10 hover:bg-secondary-500/20 border border-secondary-500/20 rounded-xl transition"
              >
                <RefreshCw size={16} /> Reroll Matches
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {oracleRecs.map((rec, index) => (
              <div
                key={index}
                className="group flex flex-col bg-[#0f121a]/90 backdrop-blur-xl border border-white/10 hover:border-secondary-500/50 rounded-[2rem] overflow-hidden shadow-2xl hover:shadow-[0_20px_50px_rgba(168,85,247,0.2)] hover:-translate-y-1.5 transition-all duration-300 h-full relative"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-secondary-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                <div className="w-full h-60 relative overflow-hidden shrink-0">
                  {rec.image_url ? (
                    <img
                      src={rec.image_url}
                      alt={rec.title}
                      className="w-full h-full object-cover group-hover:scale-105 group-hover:rotate-1 transition-transform duration-700 ease-out"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-slate-900 to-[#0f121a] flex items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjIiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] opacity-50"></div>
                      <Gamepad2 size={48} className="text-white/10" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0f121a] via-[#0f121a]/60 to-transparent"></div>
                  
                  <div className="absolute top-5 left-5 z-10">
                    <span className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest bg-black/50 backdrop-blur-md text-white px-3.5 py-1.5 rounded-full border border-white/20 shadow-lg">
                      <Sparkles size={12} className="text-secondary-400" /> Match #{index + 1}
                    </span>
                  </div>
                </div>
                
                <div className="p-8 pt-2 flex flex-col flex-1 relative z-10">
                  <h3 className="text-3xl font-black text-white mb-5 group-hover:text-secondary-300 transition-colors tracking-tight leading-tight">
                    {rec.title}
                  </h3>
                  
                  <div className="relative flex-1 mb-8">
                    <div className="absolute -top-6 -left-3 text-7xl text-secondary-500/10 font-serif leading-none select-none">
                      "
                    </div>
                    <p className="text-slate-300 text-[15px] leading-[1.8] italic relative z-10">
                      {rec.reason}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-3 mt-auto">
                    <button
                      onClick={async () => {
                        if (rec.id) {
                          await window.api.addGame(String(rec.id), rec.title, rec.image_url)
                          loadGames()
                          setOracleRecs((prev) => prev.filter((_, i) => i !== index))
                        }
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-5 py-4 bg-gradient-to-r from-secondary-600 to-indigo-600 hover:from-secondary-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] border border-white/10 transition-all active:scale-[0.98]"
                    >
                      <Plus size={18} /> Add to Backlog
                    </button>
                    {rec.id && (
                      <button
                        onClick={() =>
                          handleGameClick({
                            id: rec.id,
                            title: rec.title,
                            img: rec.image_url,
                            image_url: rec.image_url
                          })
                        }
                        className="px-6 py-4 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white font-bold rounded-xl border border-white/10 transition-all active:scale-[0.98]"
                      >
                        Details
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* -------------------- ADVISOR TAB -------------------- */}
      {activeTab === 'advisor' && !oracleLoading && !advisorResult && (
        <div className="flex flex-col items-center justify-center py-10 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4">
          <h2 className="text-2xl font-bold text-white mb-3">Should I Buy This?</h2>
          <p className="text-slate-400 text-center mb-10">
            Type a game you're thinking about buying. The AI Advisor calculates a compatibility
            score based on your unique Tier List history.
          </p>

          <div className="w-full flex gap-3 mb-8">
            <input
              type="text"
              value={advisorTarget}
              onChange={(e) => setAdvisorTarget(e.target.value)}
              placeholder="e.g. 'Elden Ring'"
              className="flex-1 bg-[#121620] border border-emerald-500/30 rounded-2xl px-5 py-4 text-slate-200 focus:outline-none focus:border-emerald-500 font-bold text-lg shadow-inner"
            />
            <button
              onClick={async () => {
                setOracleLoading(true)
                setOracleError(null)
                setOraclePhase('Calculating Compatibility Matrix...')
                const result = await window.api.getAICompatibility(advisorTarget)
                setOracleLoading(false)
                if (result.error) setOracleError(result.error)
                else setAdvisorResult(result)
              }}
              disabled={!advisorTarget.trim()}
              className="px-10 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl disabled:opacity-50 transition shadow-[0_0_20px_rgba(5,150,105,0.3)] flex items-center gap-2"
            >
              Analyze <ArrowRight size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Advisor Results */}
      {activeTab === 'advisor' && !oracleLoading && advisorResult && (
        <div className="flex flex-col items-center justify-center py-10 max-w-3xl mx-auto animate-in fade-in zoom-in-95">
          <div className="bg-gradient-to-b from-[#121620] to-[#151a28] border border-emerald-500/30 rounded-3xl p-10 w-full shadow-[0_0_50px_rgba(5,150,105,0.1)] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-500"></div>

            <div className="flex flex-col md:flex-row items-center gap-10">
              <div className="flex flex-col items-center justify-center relative shrink-0">
                <svg className="w-48 h-48 transform -rotate-90">
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="transparent"
                    className="text-slate-800"
                  />
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="transparent"
                    strokeDasharray="552.9"
                    strokeDashoffset={552.9 - (552.9 * advisorResult.score) / 100}
                    className="text-emerald-500 drop-shadow-[0_0_10px_rgba(16,185,129,0.8)] transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-5xl font-black text-white drop-shadow-md">
                    {advisorResult.score}%
                  </span>
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest mt-1">
                    Match
                  </span>
                </div>
              </div>

              <div className="flex-1">
                <h3 className="text-3xl font-black text-white mb-2">{advisorTarget}</h3>
                <div className="w-16 h-1 bg-emerald-500/50 rounded-full mb-6"></div>
                <p className="text-slate-300 text-[17px] leading-relaxed italic border-l-4 border-emerald-500/30 pl-5 py-2">
                  "{advisorResult.review}"
                </p>
              </div>
            </div>

            <div className="mt-10 flex justify-center">
              <button
                onClick={() => {
                  setAdvisorResult(null)
                  setAdvisorTarget('')
                }}
                className="px-8 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl border border-white/10 transition"
              >
                Analyze Another Game
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------- THERAPIST TAB -------------------- */}
      {activeTab === 'therapist' && !oracleLoading && !therapistResult && (
        <div className="flex flex-col items-center justify-center py-10 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4">
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-amber-600/20 to-orange-600/20 border border-amber-500/30 flex items-center justify-center mb-6 relative">
            <Stethoscope size={50} className="text-amber-400" />
            <div className="absolute -bottom-2 -right-2 bg-amber-600 w-10 h-10 rounded-full flex items-center justify-center border-4 border-[#0B0E14]">
              <Gamepad2 size={20} className="text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-black text-white mb-4 text-center">The Backlog Therapist</h2>
          <p className="text-slate-400 text-center mb-10 text-lg leading-relaxed max-w-lg">
            Suffering from decision paralysis? Hand your backlog to the Therapist and it will select
            the <strong className="text-amber-400">single best game</strong> you need to start
            playing tonight.
          </p>

          <button
            onClick={async () => {
              setOracleLoading(true)
              setOracleError(null)
              setOraclePhase('Scanning your dusty backlog...')
              setTimeout(() => setOraclePhase('Therapist is making a diagnosis...'), 2500)
              const result = await window.api.getAIBacklogCure()
              setOracleLoading(false)
              if (result.error) setOracleError(result.error)
              else setTherapistResult(result)
            }}
            className="group relative px-10 py-5 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-black text-xl rounded-2xl shadow-[0_0_40px_rgba(245,158,11,0.3)] hover:shadow-[0_0_50px_rgba(245,158,11,0.5)] transition-all flex items-center gap-3 hover:scale-105"
          >
            Cure my Decision Paralysis <Sparkles size={24} />
          </button>
        </div>
      )}

      {/* Therapist Results */}
      {activeTab === 'therapist' && !oracleLoading && therapistResult && (
        <div className="flex flex-col items-center justify-center py-10 max-w-4xl mx-auto animate-in fade-in zoom-in-95">
          <div className="bg-gradient-to-br from-[#121620] to-[#151a28] border border-amber-500/40 rounded-[2rem] overflow-hidden shadow-[0_0_60px_rgba(245,158,11,0.15)] flex flex-col md:flex-row w-full">
            {/* Image Side */}
            <div className="w-full md:w-[40%] h-64 md:h-auto relative">
              {therapistResult.gameInfo?.image_url ? (
                <img
                  src={therapistResult.gameInfo.image_url}
                  alt={therapistResult.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                  <Gamepad2 size={64} className="text-slate-600" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#121620] md:bg-gradient-to-r md:from-transparent to-[#121620]"></div>
            </div>

            {/* Content Side */}
            <div className="flex-1 p-10 flex flex-col justify-center">
              <div className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-400 font-bold px-3 py-1.5 rounded-lg mb-4 text-sm w-fit border border-amber-500/30">
                <Stethoscope size={16} /> Diagnosis: Play This Now
              </div>
              <h3 className="text-4xl font-black text-white mb-6 leading-tight">
                {therapistResult.title}
              </h3>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8 relative">
                <div className="absolute -top-3 -left-2 text-6xl text-amber-500/20 font-serif">
                  "
                </div>
                <p className="text-slate-300 text-lg leading-relaxed relative z-10 italic">
                  {therapistResult.reason}
                </p>
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={() => {
                    setTherapistResult(null)
                  }}
                  className="px-6 py-3.5 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl border border-white/10 transition"
                >
                  Back
                </button>
                <button
                  onClick={async () => {
                    setTherapistResult(null)
                    setOracleLoading(true)
                    setOracleError(null)
                    setOraclePhase('Scanning your dusty backlog again...')
                    setTimeout(() => setOraclePhase('Therapist is making a new diagnosis...'), 2500)
                    const result = await window.api.getAIBacklogCure()
                    setOracleLoading(false)
                    if (result.error) setOracleError(result.error)
                    else setTherapistResult(result)
                  }}
                  className="px-6 py-3.5 flex items-center gap-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-bold rounded-xl border border-amber-500/20 transition"
                >
                  <RefreshCw size={16} /> I'm not feeling it, pick another
                </button>
                {therapistResult.gameInfo?.id && (
                  <button
                    onClick={() =>
                      handleGameClick({
                        id: therapistResult.gameInfo.id,
                        title: therapistResult.title,
                        img: therapistResult.gameInfo.image_url,
                        image_url: therapistResult.gameInfo.image_url
                      })
                    }
                    className="px-8 py-3.5 bg-amber-600 hover:bg-amber-500 text-white font-black rounded-xl shadow-lg transition"
                  >
                    View Details
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </TransientScroll>
  )
}

export default AIOracle
