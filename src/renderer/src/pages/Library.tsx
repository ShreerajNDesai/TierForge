import { useState, useEffect } from 'react'
import * as htmlToImage from 'html-to-image'
import Tilt from 'react-parallax-tilt'
import {
  PlayCircle,
  Search,
  Clock,
  Gamepad2,
  Trophy,
  Star,
  Library as LibraryIcon,
  Grid,
  List
} from 'lucide-react'
import { useGlobal } from '../context/GlobalContext'

const Library = () => {
  const { libraryGames, suggestedGame, librarySearch, handleGameClick } = useGlobal()

  const [viewMode, setViewMode] = useState<'rows' | 'grid'>('rows')
  const filteredLibraryGames = libraryGames.filter((g: any) =>
    g.title.toLowerCase().includes(librarySearch.toLowerCase())
  )

  const statuses = [
    { id: 'Playing', title: '🎮 Currently Playing' },
    { id: 'Completed', title: '🏆 Completed' },
    { id: 'Backlog', title: '📚 The Backlog' },
    { id: 'Wishlist', title: '✨ Wishlist' },
    { id: 'Abandoned', title: '🛑 Dropped' }
  ]

  const totalGames = libraryGames.length
  const completedGames = libraryGames.filter((g: any) => g.status === 'Completed').length
  const completionRate = totalGames > 0 ? Math.round((completedGames / totalGames) * 100) : 0

  const genreCounts: Record<string, number> = {}
  libraryGames.forEach((game: any) => {
    if (game.genres && game.genres !== 'Unknown') {
      const genresList =
        typeof game.genres === 'string'
          ? game.genres.split(',')
          : Array.isArray(game.genres)
            ? game.genres
            : []
      genresList.forEach((g: string) => {
        const trimmedGenre = g.trim()
        if (trimmedGenre) {
          genreCounts[trimmedGenre] = (genreCounts[trimmedGenre] || 0) + 1
        }
      })
    }
  })

  const topGenres = Object.entries(genreCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map((g) => g[0])

  const rightPanelWidth = 2840
  const rightPanelHeight = 2160
  const safeTotalGames = Math.max(totalGames, 1)
  const cols = Math.max(
    1,
    Math.ceil(Math.sqrt((safeTotalGames * rightPanelWidth) / (rightPanelHeight * 0.75)))
  )

  const exportLibraryMosaic = async () => {
    try {
      await new Promise((r) => setTimeout(r, 100))
      const container = document.getElementById('library-mosaic-container')
      if (!container) return
      const dataUrl = await htmlToImage.toPng(container, {
        quality: 1,
        pixelRatio: 1,
        style: { opacity: '1', transform: 'none' }
      })
      await window.api.saveImage(dataUrl, 'MyLibraryMosaic.png')
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    const handleEvent = () => exportLibraryMosaic()
    window.addEventListener('trigger-export-library', handleEvent)
    return () => window.removeEventListener('trigger-export-library', handleEvent)
  }, [])

  return (
    <div className="flex-1 overflow-y-auto px-10 pb-12 pt-10 relative custom-scrollbar">
      <div className="mb-12 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-white mb-2">My Library</h1>
          <p className="text-slate-400">{libraryGames.length} games in your collection</p>
        </div>
        <div className="flex items-center bg-[#121620] border border-white/10 rounded-xl p-1 shadow-inner">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-primary-500/20 text-primary-400 shadow' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <Grid size={18} />
          </button>
          <button
            onClick={() => setViewMode('rows')}
            className={`p-2 rounded-lg transition-all ${viewMode === 'rows' ? 'bg-primary-500/20 text-primary-400 shadow' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <List size={18} />
          </button>
        </div>
      </div>

      {suggestedGame && librarySearch === '' && (
        <div
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleGameClick(suggestedGame)
          }}
          className="w-full relative rounded-2xl overflow-hidden mb-8 group cursor-pointer border border-primary-500/40 shadow-[0_0_25px_rgba(99,102,241,0.15),inset_0_1px_0_rgba(255,255,255,0.05)] hover:border-secondary-400/50 hover:shadow-[0_0_40px_rgba(139,92,246,0.25)] focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-500 focus-visible:scale-105 focus-visible:shadow-[0_0_30px_rgba(99,102,241,0.6)] transition-all duration-500"
          onClick={() => handleGameClick(suggestedGame)}
        >
          {/* Background Image */}
          <div className="absolute inset-0">
            <img
              src={suggestedGame.img || suggestedGame.image_url}
              alt=""
              className="w-full h-full object-cover scale-110 blur-sm group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0B0E14] via-[#0B0E14]/85 to-transparent"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B0E14]/60 to-transparent"></div>
          </div>

          {/* Content */}
          <div className="relative z-10 flex items-center gap-6 p-6">
            {/* Cover Art */}
            <div className="w-24 h-36 shrink-0 rounded-xl overflow-hidden border-2 border-primary-500/40 shadow-[0_0_20px_rgba(99,102,241,0.3)] group-hover:border-primary-400/60 group-hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] transition-all duration-300">
              <img
                src={suggestedGame.img || suggestedGame.image_url}
                alt={suggestedGame.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-widest bg-primary-500/20 text-primary-400 px-2.5 py-1 rounded-md border border-primary-500/30">
                  🎲 Random Pick
                </span>
              </div>
              <p className="text-slate-400 text-sm mb-1">
                Not sure what to play? Try this from your backlog:
              </p>
              <h3 className="text-3xl font-black text-white truncate group-hover:text-primary-200 transition-colors">
                {suggestedGame.title}
              </h3>
            </div>

            {/* CTA */}
            {suggestedGame.executable_path && suggestedGame.executable_path.trim() !== '' ? (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  window.api.launchGame(
                    suggestedGame.executable_path,
                    suggestedGame.id.toString(),
                    suggestedGame.title
                  )
                }}
                className="shrink-0 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:shadow-[0_0_30px_rgba(16,185,129,0.6)] hover:scale-105 transition-all flex items-center gap-2"
              >
                <PlayCircle size={18} /> Play Now
              </button>
            ) : (
              <button className="shrink-0 px-6 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-500 hover:to-secondary-500 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:shadow-[0_0_30px_rgba(99,102,241,0.6)] hover:scale-105 transition-all flex items-center gap-2">
                <Search size={16} /> View Details
              </button>
            )}
          </div>
        </div>
      )}

      <div className="space-y-4">
        {viewMode === 'rows' &&
          statuses.map((status) => {
            const gamesInStatus = libraryGames.filter(
              (g) =>
                (g.status || 'Backlog') === status.id &&
                g.title.toLowerCase().includes(librarySearch.toLowerCase())
            )
            if (gamesInStatus.length === 0) return null

            return (
              <div key={status.id} className="mb-10">
                <h2 className="text-2xl font-bold text-white mb-4">{status.title}</h2>
                <div className="flex gap-6 overflow-x-auto py-6 -my-4 scrollbar-hide px-2 custom-scrollbar">
                  {gamesInStatus.map((game) => (
                    <div
                      key={game.id}
                      tabIndex={0}
                      onClick={() => handleGameClick(game)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleGameClick(game)
                      }}
                      className="flex-shrink-0 cursor-pointer focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-500 focus-visible:scale-105 focus-visible:shadow-[0_0_30px_rgba(99,102,241,0.6)] rounded-xl transition-all relative z-0 hover:z-50"
                    >
                      <Tilt
                        glareEnable={true}
                        glareMaxOpacity={0.3}
                        glarePosition="all"
                        glareBorderRadius="0.75rem"
                        tiltMaxAngleX={10}
                        tiltMaxAngleY={10}
                        scale={1.05}
                        transitionSpeed={400}
                        className="w-48 h-72 rounded-xl"
                      >
                        <div className="w-full h-full rounded-xl overflow-hidden shadow-lg border border-white/10 group relative hover:scale-105 hover:shadow-[0_0_20px_rgba(99,102,241,0.5)] transition-all">
                          <img
                            src={game.img || game.image_url}
                            alt={game.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                            <span className="text-white font-bold text-sm truncate w-full">
                              {game.title}
                            </span>
                          </div>
                          {(game.playtime_minutes || 0) > 0 && (
                            <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1 border border-white/10">
                              <Clock size={10} className="text-primary-400" />
                              {(game.playtime_minutes || 0) >= 60
                                ? `${Math.floor(game.playtime_minutes / 60)}h ${game.playtime_minutes % 60}m`
                                : `${game.playtime_minutes}m`}
                            </div>
                          )}
                        </div>
                      </Tilt>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}

        {viewMode === 'grid' && (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-6 mt-8">
            {filteredLibraryGames.map((game: any) => (
              <div
                key={game.id}
                tabIndex={0}
                onClick={() => handleGameClick(game)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleGameClick(game)
                }}
                className="w-full aspect-[2/3] cursor-pointer focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-500 focus-visible:scale-105 focus-visible:shadow-[0_0_30px_rgba(99,102,241,0.6)] rounded-xl transition-all relative z-0 hover:z-50"
              >
                <Tilt
                  glareEnable={true}
                  glareMaxOpacity={0.3}
                  glarePosition="all"
                  glareBorderRadius="0.75rem"
                  tiltMaxAngleX={10}
                  tiltMaxAngleY={10}
                  scale={1.05}
                  transitionSpeed={400}
                  className="w-full h-full rounded-xl"
                >
                  <div className="w-full h-full rounded-xl overflow-hidden shadow-lg border border-white/10 group relative hover:scale-105 hover:shadow-[0_0_20px_rgba(99,102,241,0.5)] transition-all bg-black/50">
                    <img
                      src={game.img || game.image_url}
                      alt={game.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                      <span className="text-white font-bold text-sm truncate w-full">
                        {game.title}
                      </span>
                    </div>
                    {(game.playtime_minutes || 0) > 0 && (
                      <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1 border border-white/10">
                        <Clock size={10} className="text-primary-400" />
                        {(game.playtime_minutes || 0) >= 60
                          ? `${Math.floor(game.playtime_minutes / 60)}h ${game.playtime_minutes % 60}m`
                          : `${game.playtime_minutes}m`}
                      </div>
                    )}
                    <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-lg border border-white/10 truncate max-w-[80px]">
                      {statuses
                        .find((s) => s.id === (game.status || 'Backlog'))
                        ?.title.split(' ')[1] ||
                        game.status ||
                        'Backlog'}
                    </div>
                  </div>
                </Tilt>
              </div>
            ))}
            {filteredLibraryGames.length === 0 && (
              <div className="col-span-full py-20 text-center text-slate-500">
                <p>No games match your search.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* HIDDEN 4K MOSAIC RENDER NODE */}
      <div
        id="library-mosaic-container"
        className="fixed top-0 left-0 w-[3840px] h-[2160px] bg-[#080B10] flex overflow-hidden pointer-events-none opacity-0 -z-50"
      >
        {/* Left Panel: Profile Card */}
        <div className="w-[1000px] h-full flex flex-col items-center justify-center p-20 relative shrink-0">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-900/20 to-secondary-900/20 backdrop-blur-3xl border-r border-white/10"></div>
          <div className="relative z-10 flex flex-col items-center text-center w-full">
            <Gamepad2 className="text-primary-500 w-48 h-48 mb-8 drop-shadow-[0_0_30px_rgba(99,102,241,0.5)]" />
            <h1 className="text-[100px] font-black text-white tracking-tight leading-none mb-6 drop-shadow-2xl">
              TierForge
            </h1>
            <p className="text-[40px] text-primary-300 font-bold tracking-widest uppercase mb-20 drop-shadow-lg">
              Player Profile
            </p>

            <div className="w-full max-w-4xl bg-black/40 rounded-3xl border border-white/10 p-12 mb-10 flex flex-col gap-10 shadow-2xl backdrop-blur-md">
              <div className="flex items-center justify-between border-b border-white/10 pb-10">
                <div className="flex items-center gap-6 text-slate-300 text-[40px] font-semibold">
                  <LibraryIcon size={48} /> Total Games
                </div>
                <div className="text-[60px] font-black text-white drop-shadow-md">{totalGames}</div>
              </div>
              <div className="flex items-center justify-between border-b border-white/10 pb-10">
                <div className="flex items-center gap-6 text-slate-300 text-[40px] font-semibold">
                  <Trophy size={48} /> Completion Rate
                </div>
                <div className="text-[60px] font-black text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]">
                  {completionRate}%
                </div>
              </div>
              <div className="flex flex-col gap-6 pt-2 text-left">
                <div className="flex items-center gap-6 text-slate-300 text-[40px] font-semibold">
                  <Star size={48} /> Top Genres
                </div>
                <div className="flex flex-wrap gap-4">
                  {topGenres.map((g) => (
                    <span
                      key={g}
                      className="px-6 py-3 bg-primary-500/20 border border-primary-500/30 rounded-xl text-primary-300 text-[32px] font-bold shadow-lg"
                    >
                      {g}
                    </span>
                  ))}
                  {topGenres.length === 0 && (
                    <span className="text-slate-500 text-[32px] italic">Not enough data</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel: Mosaic Grid */}
        <div
          className="flex-1 p-8 grid gap-4 bg-gradient-to-br from-[#0B0E14] to-[#121620]"
          style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
        >
          {libraryGames.map((game: any) => (
            <div
              key={game.id}
              className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/5 bg-black/50 aspect-[3/4]"
            >
              <img
                src={game.img || game.image_url}
                alt={game.title}
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Library
