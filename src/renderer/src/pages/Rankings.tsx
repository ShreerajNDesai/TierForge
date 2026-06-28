import { useState, useEffect } from 'react'
import { Trophy, RefreshCw, Crown, Star, Search, ChevronDown, Settings } from 'lucide-react'
import { TransientScroll } from '../components/TransientScroll'
import Tilt from 'react-parallax-tilt'
import { useGlobal } from '../context/GlobalContext'

const Rankings = () => {
  const {
    rankingsLoading,
    setRankingsLoading,
    globalRankings,
    setGlobalRankings,
    rankingsGenre,
    setRankingsGenre,
    handleGameClick
  } = useGlobal()

  const [showMegaMenu, setShowMegaMenu] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [dynamicGenres, setDynamicGenres] = useState<{ id: string; label: string }[]>([])
  const [tagSearch, setTagSearch] = useState('')

  useEffect(() => {
    window.api.getSteamTags().then(setDynamicGenres)
  }, [])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    setRankingsLoading(true)
    try {
      await window.api.clearRankingsCache(rankingsGenre)
      const data = await window.api.getCachedRankings(rankingsGenre)
      setGlobalRankings((prev: any) => ({
        ...(prev || {}),
        [rankingsGenre]: data
      }))
    } catch (err) {
      console.error('Failed to refresh rankings:', err)
    } finally {
      setIsRefreshing(false)
      setRankingsLoading(false)
    }
  }

  const mainstreamFilters = [
    { key: 'overall', label: '👑 Overall' },
    { key: 'action', label: '⚔️ Action' },
    { key: 'adventure', label: '🧭 Adventure' },
    { key: 'rpg', label: '🗡️ RPGs' },
    { key: 'shooter', label: '🔫 Shooters' },
    { key: 'open_world', label: '🌍 Open World' },
    { key: 'horror', label: '👻 Horror' },
    { key: 'indie', label: '💎 Indie' }
  ]

  const currentRankingList = globalRankings ? globalRankings[rankingsGenre] : []

  const handleGenreSelect = (key: string) => {
    setRankingsGenre(key)
    setShowMegaMenu(false)
    setTagSearch('')
  }

  const filteredTags = dynamicGenres.filter((t) =>
    t.label.toLowerCase().includes(tagSearch.toLowerCase())
  )

  const showLoader = rankingsLoading && (!globalRankings || !globalRankings[rankingsGenre])

  return (
    <TransientScroll className="flex-1 overflow-y-auto px-10 pb-12 pt-10 relative custom-scrollbar">
      {/* Header */}
      <div className="mb-8 flex items-end">
        <div>
          <h1 className="text-4xl font-black text-white mb-2 flex items-center gap-3">
            <Trophy className="text-yellow-400" size={36} /> Global Hall of Fame
          </h1>
          <p className="text-slate-400 text-[15px]">
            The highest rated games scraped live from critic leaderboards.
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing || rankingsLoading}
          className="ml-auto flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-bold text-slate-300 transition-all disabled:opacity-50"
        >
          <RefreshCw size={16} className={isRefreshing ? 'animate-spin text-primary-400' : ''} />
          {isRefreshing ? 'Scraping fresh data...' : 'Refresh Rankings'}
        </button>
      </div>

      {/* Genre Filter Pills */}
      <div className="flex gap-3 overflow-x-auto py-4 -my-2 mb-2 flex-nowrap no-scrollbar items-center">
        {mainstreamFilters.map((genre) => (
          <button
            key={genre.key}
            onClick={() => setRankingsGenre(genre.key)}
            className={`px-5 py-2.5 rounded-full font-semibold text-sm whitespace-nowrap shrink-0 transition-all ${
              rankingsGenre === genre.key
                ? 'bg-primary-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]'
                : 'bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300'
            }`}
          >
            {genre.label}
          </button>
        ))}
        <button
          onClick={() => setShowMegaMenu(!showMegaMenu)}
          className={`px-5 py-2.5 rounded-full font-bold text-sm transition-all flex items-center gap-2 shrink-0 ${
            showMegaMenu
              ? 'bg-primary-500 text-white border-primary-400'
              : 'bg-primary-500/20 text-primary-300 border border-primary-500/30 hover:bg-primary-500/30'
          }`}
        >
          <Search size={16} /> Browse All Genres{' '}
          <ChevronDown
            size={16}
            className={`transition-transform duration-300 ${showMegaMenu ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {/* Mega Menu Dropdown */}
      {showMegaMenu && (
        <div className="w-full bg-[#121620]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-8 mb-8 shadow-2xl z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="sticky top-0 mb-6 bg-[#121620] pb-2 z-10">
            <div className="relative w-full max-w-lg">
              <Search className="absolute left-3 top-3 text-slate-500" size={18} />
              <input
                type="text"
                placeholder="Search hundreds of Steam tags and IGDB genres..."
                value={tagSearch}
                onChange={(e) => setTagSearch(e.target.value)}
                className="w-full bg-black/40 border border-white/10 text-white rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-primary-500 transition"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
            {filteredTags.map((genre) => {
              const isSteam = genre.id.startsWith('steamtag_')
              return (
                <button
                  key={genre.id}
                  onClick={() => handleGenreSelect(genre.id)}
                  className={`px-4 py-2.5 rounded-xl text-left text-xs font-bold transition-all border ${
                    rankingsGenre === genre.id
                      ? 'bg-primary-600 border-primary-400 text-white shadow-lg'
                      : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span className={isSteam ? 'text-sky-300' : ''}>{genre.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {showLoader ? (
        <div className="flex flex-col items-center justify-center py-32 flex-1">
          <RefreshCw size={48} className="text-yellow-400 animate-spin mb-4" />
          <p className="text-white text-xl font-bold mb-2">Fetching Rankings...</p>
          <p className="text-slate-400 text-sm max-w-xs text-center">
            This takes a few seconds.
          </p>
        </div>
      ) : (
        currentRankingList &&
        currentRankingList.length >= 3 && (
          <>
            {/* Podium — Top 3 */}
            <div className="flex gap-6 mb-16 items-end justify-center">
              {[1, 0, 2].map((podiumIdx) => {
                const game = currentRankingList[podiumIdx]
                if (!game) return null
                const isFirst = podiumIdx === 0
                const medalColor =
                  podiumIdx === 0
                    ? 'from-yellow-400 to-amber-500'
                    : podiumIdx === 1
                      ? 'from-slate-300 to-slate-400'
                      : 'from-amber-700 to-amber-800'
                const medalBorder =
                  podiumIdx === 0
                    ? 'border-yellow-500/60 shadow-[0_0_30px_rgba(234,179,8,0.3)]'
                    : podiumIdx === 1
                      ? 'border-slate-400/40 shadow-[0_0_20px_rgba(148,163,184,0.2)]'
                      : 'border-amber-700/40 shadow-[0_0_15px_rgba(180,83,9,0.15)]'
                const rankLabel = podiumIdx === 0 ? '1st' : podiumIdx === 1 ? '2nd' : '3rd'
                return (
                  <div
                    key={game.id}
                    tabIndex={0}
                    onClick={async () => {
                      const matches = await window.api.searchGames(game.title)
                      if (matches && matches.length > 0) handleGameClick(matches[0])
                    }}
                    onKeyDown={async (e) => {
                      if (e.key === 'Enter') {
                        const matches = await window.api.searchGames(game.title)
                        if (matches && matches.length > 0) handleGameClick(matches[0])
                      }
                    }}
                    className={`relative cursor-pointer group flex flex-col items-center focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-500 focus-visible:scale-105 focus-visible:shadow-[0_0_30px_rgba(99,102,241,0.6)] transition-all relative z-0 hover:z-50 ${isFirst ? 'w-64' : 'w-52'}`}
                  >
                    <div
                      className={`w-12 h-12 rounded-full bg-gradient-to-br ${medalColor} flex items-center justify-center font-black text-lg shadow-xl mb-3 border-4 border-[#0B0E14]`}
                    >
                      {podiumIdx === 0 ? <Crown size={22} /> : `#${podiumIdx + 1}`}
                    </div>
                    <Tilt
                      glareEnable={true}
                      glareMaxOpacity={0.3}
                      glarePosition="all"
                      glareBorderRadius="1rem"
                      tiltMaxAngleX={10}
                      tiltMaxAngleY={10}
                      scale={1.05}
                      transitionSpeed={400}
                      className="w-full rounded-2xl"
                    >
                      <div
                        className={`relative w-full rounded-2xl overflow-hidden border-2 ${medalBorder} transition-all group-hover:scale-[1.03]`}
                      >
                        <img
                          src={game.img}
                          alt={game.title}
                          className={`w-full ${isFirst ? 'h-80' : 'h-64'} object-cover group-hover:scale-105 transition-transform duration-500`}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <p
                            className={`text-white font-black ${isFirst ? 'text-xl' : 'text-base'} truncate mb-1`}
                          >
                            {game.title}
                          </p>
                          <p className="text-slate-400 text-xs truncate mb-2">{game.genres}</p>
                          <div className="flex items-center gap-1.5">
                            <Star size={14} className="text-yellow-400" fill="currentColor" />
                            <span className="text-sky-400 font-black text-sm">
                              Overwhelmingly Positive
                            </span>
                          </div>
                        </div>
                      </div>
                    </Tilt>
                    <span
                      className={`mt-3 text-xs font-black uppercase tracking-widest ${podiumIdx === 0 ? 'text-yellow-400' : podiumIdx === 1 ? 'text-slate-400' : 'text-amber-600'}`}
                    >
                      {rankLabel}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Cinematic Leaderboard List — Rank 4+ */}
            <div className="space-y-6">
              {currentRankingList.slice(3).map((game: any, i: number) => {
                const rank = i + 4
                return (
                  <div
                    key={game.id}
                    tabIndex={0}
                    onClick={async () => {
                      const matches = await window.api.searchGames(game.title)
                      if (matches && matches.length > 0) handleGameClick(matches[0])
                    }}
                    onKeyDown={async (e) => {
                      if (e.key === 'Enter') {
                        const matches = await window.api.searchGames(game.title)
                        if (matches && matches.length > 0) handleGameClick(matches[0])
                      }
                    }}
                    className="group relative h-32 w-full overflow-hidden rounded-2xl border border-white/5 hover:border-yellow-500/40 cursor-pointer transition-all hover:scale-[1.01] hover:shadow-2xl focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-500 focus-visible:scale-105 focus-visible:shadow-[0_0_30px_rgba(99,102,241,0.6)] relative z-0 hover:z-50"
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
                      <Tilt
                        glareEnable={true}
                        glareMaxOpacity={0.3}
                        glarePosition="all"
                        glareBorderRadius="0.5rem"
                        tiltMaxAngleX={10}
                        tiltMaxAngleY={10}
                        scale={1.05}
                        transitionSpeed={400}
                        className="shrink-0 rounded-lg"
                      >
                        <div className="relative h-24 w-18 shrink-0 rounded-lg overflow-hidden border border-white/10 shadow-lg group-hover:border-yellow-500/50 transition">
                          <img
                            src={game.img}
                            className="h-full w-full object-cover"
                            alt={game.title}
                          />
                        </div>
                      </Tilt>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-2xl font-black text-white group-hover:text-yellow-200 transition-colors truncate">
                          {game.title}
                        </h3>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-slate-400 text-sm font-medium uppercase tracking-wider">
                            {game.genres}
                          </span>
                          <div className="flex items-center gap-1.5 bg-yellow-500/10 px-2 py-0.5 rounded-md border border-yellow-500/20">
                            <Star size={12} className="text-yellow-400" fill="currentColor" />
                            <span className="text-yellow-400 font-bold text-xs">Hall of Fame</span>
                          </div>
                        </div>
                      </div>

                      {/* Action Hint */}
                      <div className="hidden md:flex items-center gap-2 text-slate-500 group-hover:text-white transition">
                        <span className="text-xs font-bold uppercase tracking-tighter">
                          View Details
                        </span>
                        <Search size={16} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )
      )}
    </TransientScroll>
  )
}

export default Rankings
