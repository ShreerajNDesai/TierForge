import React, { useState, useEffect } from 'react'
import {
  Gamepad2,
  Clock,
  ChevronDown,
  Star,
  Monitor,
  Tag,
  ExternalLink,
  PlayCircle,
  Volume2,
  VolumeX,
  X,
  Sparkles,
  Trash2,
  RefreshCw,
  AlertTriangle,
  Cloud
} from 'lucide-react'
import Tilt from 'react-parallax-tilt'
import { useGlobal } from '../context/GlobalContext'

const CinematicModal = () => {
  const {
    data,
    selectedGame,
    setSelectedGame,
    gameDetails,
    bgMode,
    isVideoMode,
    setIsVideoMode,
    videoError,
    setVideoError,
    iframeRef,
    currentVideoId,
    setCurrentVideoId,
    defaultMuted,
    runningGameId,
    gamePlaytime,
    isStatusDropdownOpen,
    setIsStatusDropdownOpen,
    handleSaveGameData,
    timeToBeat,
    gameDeals,
    galleryIndex,
    setGalleryIndex,
    isMuted,
    toggleMute,
    setTimeToBeat,
    handleGameClick,
    setLibraryGames
  } = useGlobal()

  const [aiTimeline, setAiTimeline] = useState<any[] | null>(null)
  const [isTimelineLoading, setIsTimelineLoading] = useState(false)
  const [isRefreshingTimeline, setIsRefreshingTimeline] = useState(false)
  const [steamDetails, setSteamDetails] = useState<any>(null)
  const [achievements, setAchievements] = useState<any>(null)
  const [isUninstalling, setIsUninstalling] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string
    message: string
    confirmText: string
    isDanger?: boolean
    onConfirm: () => void
  } | null>(null)
  const [alertDialog, setAlertDialog] = useState<{ title: string; message: string } | null>(null)

  const gameplayVideoRaw = gameDetails?.videos?.find((v: any) =>
    v.name.toLowerCase().includes('gameplay')
  )
  const gameplayVideo = gameplayVideoRaw?.id !== gameDetails?.video_id ? gameplayVideoRaw : null
  const isWatchingGameplay = gameplayVideo && currentVideoId === gameplayVideo.id
  const youtubeUrl = `https://www.youtube.com/watch?v=${currentVideoId}`

  const isInLibrary = React.useMemo(() => {
    if (!selectedGame || !data) return false
    const gameId = selectedGame.id.toString()
    if (data.collection.some((g: any) => g.id.toString() === gameId)) return true
    for (const tierKey in data.tiers) {
      if (data.tiers[tierKey].items.some((g: any) => g.id.toString() === gameId)) return true
    }
    return false
  }, [selectedGame, data])

  useEffect(() => {
    setAiTimeline(null)
    setSteamDetails(null)
    setAchievements(null)

    if (selectedGame) {
      window.api
        .checkCachedTimeline(selectedGame.id.toString(), selectedGame.title)
        .then((cachedTimeline) => {
          if (cachedTimeline) {
            setAiTimeline(cachedTimeline)
          }
        })
        .catch((err) => console.error('Failed to check cached timeline:', err))
    }
  }, [selectedGame])

  useEffect(() => {
    if (gameDetails?.steamId) {
      window.api
        .getSteamDetails(gameDetails.steamId)
        .then(setSteamDetails)
        .catch(() => setSteamDetails(null))
      window.api
        .getSteamAchievements(gameDetails.steamId)
        .then(setAchievements)
        .catch(() => setAchievements(null))
    } else {
      setSteamDetails(null)
      setAchievements(null)
    }
  }, [gameDetails])

  if (!selectedGame) return null

  return (
    <div className="fixed inset-0 z-[200] flex overflow-hidden">
      {/* Background Layer */}
      {(bgMode === 'video' || isVideoMode) && currentVideoId && !videoError ? (
        <div className="absolute inset-0 pointer-events-none bg-black overflow-hidden flex justify-center items-center">
          <iframe
            ref={iframeRef}
            style={{
              width: '100vw',
              height: '56.25vw',
              minHeight: '100vh',
              minWidth: '177.77vh',
              transform: 'scale(1.35)'
            }}
            src={`https://www.youtube.com/embed/${currentVideoId}?start=10&autoplay=1&mute=${defaultMuted ? 1 : 0}&controls=0&loop=1&playlist=${currentVideoId}&modestbranding=1&showinfo=0&rel=0&disablekb=1&enablejsapi=1`}
            allow="autoplay; encrypted-media"
            frameBorder="0"
            onLoad={(e) => {
              try {
                const iframe = e.target as HTMLIFrameElement
                setTimeout(() => {
                  if (iframe && iframe.contentWindow) {
                    iframe.contentWindow.postMessage('{"event":"listening"}', '*')
                  }
                }, 2000)
              } catch (_) {
                /* cross-origin, expected */
              }
            }}
            onError={() => setVideoError(true)}
          />
        </div>
      ) : (
        <div
          className="absolute inset-0 bg-cover bg-center bg-[#0B0E14]"
          style={{
            backgroundImage: `url(${gameDetails?.background_url || selectedGame.img || selectedGame.image_url})`
          }}
        />
      )}

      {/* Blur/Dark Overlay */}
      {(!isVideoMode || videoError) && (
        <div className="absolute inset-0 bg-black/20 backdrop-blur-[0px]" />
      )}

      {/* Content Container */}
      {!isVideoMode && (
        <div className="relative z-10 w-full h-full p-16 flex gap-16 overflow-hidden">
          {/* Left Column - scrollable */}
          <div className="w-[352px] px-4 -mx-4 pt-4 -mt-4 flex flex-col gap-6 shrink-0 self-start h-full overflow-y-auto custom-scrollbar pb-8">
            <Tilt
              glareEnable={true}
              glareMaxOpacity={0.3}
              glarePosition="all"
              glareBorderRadius="1rem"
              tiltMaxAngleX={10}
              tiltMaxAngleY={10}
              scale={1.05}
              transitionSpeed={400}
              className="rounded-2xl"
            >
              <img
                src={selectedGame.img || selectedGame.image_url}
                alt={selectedGame.title}
                className="w-80 rounded-2xl shadow-2xl border border-white/10"
              />
            </Tilt>

            {selectedGame.executable_path &&
              selectedGame.executable_path !== '' &&
              (runningGameId === selectedGame.id.toString() ? (
                <button
                  onClick={() => window.api.stopGameTracking(selectedGame.id.toString())}
                  className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-lg rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.5)] flex justify-center items-center gap-3 tracking-widest uppercase border border-emerald-400/50 animate-pulse transition-transform hover:scale-105 group"
                >
                  <Gamepad2 size={22} className="animate-bounce group-hover:hidden" />
                  <X size={22} className="hidden group-hover:block" />
                  <span className="group-hover:hidden">Game Running...</span>
                  <span className="hidden group-hover:block text-sm">Stop Tracking</span>
                </button>
              ) : (
                <button
                  onClick={() =>
                    window.api.launchGame(
                      selectedGame.executable_path,
                      selectedGame.id.toString(),
                      selectedGame.title
                    )
                  }
                  className="w-full py-3.5 bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-500 hover:to-secondary-500 text-white font-black text-lg rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.5)] hover:scale-105 transition-transform flex justify-center items-center gap-3 tracking-widest uppercase border border-primary-400/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:bg-white/10"
                >
                  <Gamepad2 size={22} /> Play Game
                </button>
              ))}

            <button
              onClick={async () => {
                const newPath = await window.api.setCustomSavePath(selectedGame.id.toString())
                if (newPath) {
                  alert(`Linked save folder: ${newPath}`)
                }
              }}
              className="w-full py-2.5 bg-black/40 border border-white/20 hover:border-primary-500/50 hover:bg-primary-500/10 text-slate-300 font-semibold text-sm rounded-xl flex justify-center items-center gap-2 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              <Cloud size={16} /> Link Save Folder
            </button>

            {/* Playtime Badge */}
            <div className="w-full flex items-center justify-center gap-2 py-2.5 bg-white/5 border border-white/10 rounded-xl">
              <Clock size={16} className="text-primary-400" />
              <span className="text-sm font-semibold text-slate-300">
                {gamePlaytime > 0
                  ? gamePlaytime >= 60
                    ? `${Math.floor(gamePlaytime / 60)}h ${gamePlaytime % 60}m played`
                    : `${gamePlaytime}m played`
                  : 'No playtime tracked yet'}
              </span>
            </div>

            <div className="w-full space-y-2">
              <label className="text-xs font-bold text-white/50 uppercase tracking-wider pl-1">
                Play Status
              </label>
              <div className="relative">
                <div
                  onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                  className="w-full flex items-center justify-between bg-black/40 border border-white/20 text-white text-base rounded-xl px-4 py-3 cursor-pointer hover:bg-black/60 hover:border-primary-500/50 backdrop-blur-md shadow-lg transition"
                >
                  <span>{!isInLibrary ? '-' : gameDetails?.status || 'Backlog'}</span>
                  <ChevronDown
                    size={18}
                    className={`transition-transform duration-200 ${isStatusDropdownOpen ? 'rotate-180 text-primary-400' : 'text-slate-400'}`}
                  />
                </div>

                {isStatusDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-[#0B0E14]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.5)] overflow-hidden z-[300] flex flex-col py-1">
                    {['Backlog', 'Playing', 'Completed', 'Abandoned', 'Wishlist'].map((status) => (
                      <div
                        key={status}
                        onClick={() => {
                          handleSaveGameData('status', status)
                          setIsStatusDropdownOpen(false)
                        }}
                        className={`px-4 py-3 text-sm cursor-pointer transition flex items-center gap-2 ${
                          (gameDetails?.status || 'Backlog') === status
                            ? 'bg-primary-600/20 text-primary-300 font-semibold border-l-2 border-primary-500'
                            : 'text-slate-300 hover:bg-white/5 hover:text-white border-l-2 border-transparent'
                        }`}
                      >
                        {status}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Danger Zone */}
            {isInLibrary && (
              <div className="w-full space-y-2">
                <label className="text-xs font-bold text-red-500/80 uppercase tracking-wider pl-1">
                  Danger Zone
                </label>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => {
                      setConfirmDialog({
                        title: 'Remove from Library',
                        message: `Are you sure you want to remove ${selectedGame.title} from your TierForge library? This action cannot be undone.`,
                        confirmText: 'Remove Game',
                        isDanger: true,
                        onConfirm: async () => {
                          try {
                            setLibraryGames((prev) =>
                              prev.filter((g) => g.id.toString() !== selectedGame.id.toString())
                            )
                            await window.api.deleteGame(selectedGame.id.toString())
                            setSelectedGame(null)
                          } catch (err) {
                            setAlertDialog({
                              title: 'Error',
                              message: 'Failed to remove the game. Please try again later.'
                            })
                          }
                        }
                      })
                    }}
                    className="w-full flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl px-4 py-2.5 font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:bg-white/10"
                  >
                    <Trash2 size={16} /> Remove from Library
                  </button>
                  {selectedGame.executable_path && selectedGame.executable_path.trim() !== '' && (
                    <button
                      onClick={() => {
                        setConfirmDialog({
                          title: 'Uninstall PC Game',
                          message: `Are you sure you want to trigger the uninstaller for ${selectedGame.title}?`,
                          confirmText: 'Open Uninstaller',
                          isDanger: true,
                          onConfirm: async () => {
                            setIsUninstalling(true)
                            try {
                              const success = await window.api.uninstallGame(
                                selectedGame.id.toString(),
                                selectedGame.executable_path
                              )
                              setTimeout(() => {
                                setIsUninstalling(false)
                                if (success) {
                                  setLibraryGames((prev) =>
                                    prev.filter(
                                      (g) => g.id.toString() !== selectedGame.id.toString()
                                    )
                                  )
                                  setSelectedGame(null)
                                } else {
                                  setAlertDialog({
                                    title: 'Uninstall Failed',
                                    message:
                                      'Failed to launch the uninstaller. The path may be invalid or protected.'
                                  })
                                }
                              }, 2000)
                            } catch (err) {
                              setIsUninstalling(false)
                              setAlertDialog({
                                title: 'Uninstall Failed',
                                message:
                                  'An unexpected error occurred while trying to launch the uninstaller.'
                              })
                            }
                          }
                        })
                      }}
                      disabled={isUninstalling}
                      className="w-full flex items-center justify-center gap-2 bg-red-900/40 hover:bg-red-600/40 text-red-300 border border-red-600/50 rounded-xl px-4 py-2.5 font-black uppercase tracking-wider text-xs transition shadow-[0_0_15px_rgba(220,38,38,0.2)] disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:bg-white/10"
                    >
                      {isUninstalling ? (
                        <RefreshCw size={16} className="animate-spin" />
                      ) : (
                        <Trash2 size={16} />
                      )}
                      {isUninstalling ? 'Opening Uninstaller...' : 'Uninstall PC Game'}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 flex flex-col pt-8 overflow-y-auto pr-2 custom-scrollbar">
            <h2 className="text-6xl font-black text-white tracking-tight mb-4 drop-shadow-2xl">
              {selectedGame.title}
            </h2>

            <div className="flex items-center gap-4 text-xl font-medium text-white/70 mb-12">
              <span className="bg-white/10 px-3 py-1 rounded-lg border border-white/10 backdrop-blur-sm">
                {gameDetails ? gameDetails.year : '...'}
              </span>

              {gameDetails?.rating && (
                <span className="flex items-center gap-1.5 bg-primary-500/20 text-primary-300 px-3 py-1 rounded-lg border border-primary-500/30 backdrop-blur-sm">
                  <Star size={18} className="fill-primary-400" />
                  {gameDetails.rating}/100{' '}
                  <span className="text-sm text-primary-400/70 ml-1">
                    ({gameDetails.ratingCount})
                  </span>
                </span>
              )}
              <span>{gameDetails ? gameDetails.genres : 'Loading details...'}</span>
            </div>

            {/* Platforms */}
            {gameDetails?.platforms && gameDetails.platforms.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-8">
                {gameDetails.platforms.map((platform: string, idx: number) => {
                  const isPC = /PC|Windows|Mac|Linux/i.test(platform)
                  const isConsole = /PlayStation|Xbox|Nintendo|Switch/i.test(platform)

                  return (
                    <div
                      key={idx}
                      className="flex items-center gap-2 px-3 py-1.5 bg-white/5 backdrop-blur-md border border-white/10 rounded-full text-xs font-bold text-white/80"
                    >
                      {isPC ? (
                        <Monitor size={14} className="text-sky-400" />
                      ) : isConsole ? (
                        <Gamepad2 size={14} className="text-primary-400" />
                      ) : null}
                      {platform}
                    </div>
                  )
                })}
              </div>
            )}

            <div className="flex-1 flex flex-col gap-6 max-w-5xl">
              {/* Time to Beat */}
              {timeToBeat && (
                <div className="flex gap-4 mb-2">
                  {timeToBeat.main > 0 && (
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-3 flex items-center gap-3 shadow-sm">
                      <Clock className="text-primary-400" size={18} />
                      <span className="text-sm font-semibold text-white/90">
                        Main Story: <span className="text-primary-300">{timeToBeat.main} hrs</span>
                      </span>
                    </div>
                  )}
                  {timeToBeat.extra > 0 && (
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-3 flex items-center gap-3 shadow-sm">
                      <Clock className="text-primary-400" size={18} />
                      <span className="text-sm font-semibold text-white/90">
                        Main + Sides:{' '}
                        <span className="text-primary-300">{timeToBeat.extra} hrs</span>
                      </span>
                    </div>
                  )}
                  {timeToBeat.completionist > 0 && (
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-3 flex items-center gap-3 shadow-sm">
                      <Clock className="text-primary-400" size={18} />
                      <span className="text-sm font-semibold text-white/90">
                        Completionist:{' '}
                        <span className="text-primary-300">{timeToBeat.completionist} hrs</span>
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Best Available Deals */}
              {(!selectedGame.executable_path || selectedGame.executable_path.trim() === '') &&
                gameDeals.length > 0 && (
                  <div className="bg-black/30 border border-white/10 backdrop-blur-md rounded-2xl p-5 shadow-inner">
                    <h3 className="text-sm font-bold text-white/70 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <Tag size={14} className="text-emerald-400" />
                      Best Available Deals
                    </h3>
                    <div className="flex gap-3 flex-wrap">
                      {gameDeals.map((deal, i) => (
                        <button
                          key={i}
                          onClick={() => window.api.openExternal(deal.dealUrl)}
                          className="group flex flex-col items-center bg-white/5 hover:bg-white/10 border border-white/10 hover:border-emerald-500/40 rounded-xl px-4 py-3 transition-all hover:shadow-[0_0_15px_rgba(16,185,129,0.15)] min-w-[120px]"
                        >
                          <span className="text-xs font-bold text-white mb-1 flex items-center gap-1.5">
                            {deal.storeName}
                            <ExternalLink
                              size={10}
                              className="text-slate-500 group-hover:text-emerald-400 transition-colors"
                            />
                          </span>
                          <span className="text-lg font-black text-emerald-400">
                            ${deal.salePrice}
                          </span>
                          {deal.isOnSale && deal.savings > 0 && (
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="text-[10px] text-slate-500 line-through">
                                ${deal.normalPrice}
                              </span>
                              <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/30">
                                -{deal.savings}%
                              </span>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

              {/* Details Grid */}
              <div className="bg-black/30 border border-white/10 backdrop-blur-md rounded-2xl p-6 shadow-inner">
                <div className="grid grid-cols-5 gap-6 mb-6">
                  <div>
                    <h4 className="text-xs font-bold text-white/50 uppercase mb-2">
                      Main Developers
                    </h4>
                    <p className="text-sm text-primary-300 leading-snug">
                      {gameDetails ? gameDetails.developers : '-'}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white/50 uppercase mb-2">Publishers</h4>
                    <p className="text-sm text-primary-300 leading-snug">
                      {gameDetails ? gameDetails.publishers : '-'}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white/50 uppercase mb-2">Game Modes</h4>
                    <p className="text-sm text-primary-300 leading-snug">
                      {gameDetails ? gameDetails.gameModes : '-'}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white/50 uppercase mb-2">Multiplayer</h4>
                    <p className="text-sm text-primary-300 leading-snug">
                      {gameDetails ? gameDetails.multiplayer : '-'}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white/50 uppercase mb-2">Perspectives</h4>
                    <p className="text-sm text-primary-300 leading-snug">
                      {gameDetails ? gameDetails.perspectives : '-'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-6 pt-6 border-t border-white/10">
                  <div>
                    <h4 className="text-xs font-bold text-white/50 uppercase mb-2">Themes</h4>
                    <p className="text-sm text-primary-300 leading-snug">
                      {gameDetails ? gameDetails.themes : '-'}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white/50 uppercase mb-2">Series</h4>
                    <p className="text-sm text-primary-300 leading-snug">
                      {gameDetails ? gameDetails.series : '-'}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white/50 uppercase mb-2">Game Engine</h4>
                    <p className="text-sm text-primary-300 leading-snug">
                      {gameDetails ? gameDetails.engines : '-'}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white/50 uppercase mb-2">Alt Titles</h4>
                    <p className="text-sm text-primary-300 leading-snug">
                      {gameDetails ? gameDetails.altNames : '-'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Story / Storyline */}
              <div className="bg-black/30 border border-white/10 backdrop-blur-md rounded-2xl p-6 shadow-inner">
                <h3 className="text-sm font-bold text-white/70 tracking-wide mb-3">Overview</h3>
                <p className="text-slate-300 text-base leading-relaxed">
                  {gameDetails ? gameDetails.summary : 'Loading from IGDB...'}
                </p>
                {(gameDetails?.storyline || selectedGame?.storyline) &&
                  gameDetails?.storyline !== gameDetails?.summary && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-500">
                      <h3 className="text-sm font-bold text-white/70 tracking-wide mt-5 mb-3">
                        Storyline
                      </h3>
                      <p className="text-slate-300 text-base leading-relaxed">
                        {gameDetails?.storyline || selectedGame?.storyline}
                      </p>
                    </div>
                  )}
              </div>

              {/* Steam PC Requirements */}
              {steamDetails?.pcRequirements && (
                <div className="bg-black/30 border border-white/10 backdrop-blur-md rounded-2xl p-6 shadow-inner">
                  <h3 className="text-sm font-bold text-white/70 uppercase tracking-wider mb-6 flex items-center gap-2">
                    <Monitor size={14} className="text-sky-400" />
                    Can My PC Run This?
                  </h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-white/5 border border-white/10 rounded-xl p-5 backdrop-blur-sm">
                      <h4 className="text-xs font-black text-slate-500 uppercase mb-4 tracking-widest border-b border-white/5 pb-2">
                        Minimum Requirements
                      </h4>
                      <div
                        className="text-[11px] leading-relaxed text-slate-400 steam-specs-container"
                        dangerouslySetInnerHTML={{ __html: steamDetails.pcRequirements.minimum }}
                      />
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-xl p-5 backdrop-blur-sm">
                      <h4 className="text-xs font-black text-primary-400/70 uppercase mb-4 tracking-widest border-b border-white/5 pb-2">
                        Recommended Specs
                      </h4>
                      <div
                        className="text-[11px] leading-relaxed text-slate-400 steam-specs-container"
                        dangerouslySetInnerHTML={{
                          __html: steamDetails.pcRequirements.recommended
                        }}
                      />
                    </div>
                  </div>
                  <style>{`
                    .steam-specs-container ul { list-style: none; padding: 0; }
                    .steam-specs-container li { margin-bottom: 6px; }
                    .steam-specs-container strong { color: #94a3b8; font-weight: 800; margin-right: 4px; }
                    .steam-specs-container br { display: none; }
                  `}</style>
                </div>
              )}

              {/* Steam Achievements */}
              {achievements && achievements.total > 0 && (
                <div className="bg-black/30 border border-white/10 backdrop-blur-md rounded-2xl p-6 shadow-inner mb-6">
                  <h3 className="text-sm font-bold text-white/70 tracking-wide mb-4">
                    Steam Achievements ({achievements.unlocked} / {achievements.total})
                  </h3>

                  <div className="w-full h-2 bg-slate-800 rounded-full mb-2 overflow-hidden flex">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full transition-all duration-1000 ease-out"
                      style={{ width: `${achievements.percentage}%` }}
                    />
                  </div>
                  <div className="text-xs font-bold text-cyan-400 text-right mb-4">
                    {achievements.percentage}% Unlocked
                  </div>

                  <div className="flex gap-3 overflow-x-auto custom-scrollbar pt-4 pb-2">
                    {[...achievements.list]
                      .sort((a, b) => (b.achieved ? 1 : 0) - (a.achieved ? 1 : 0))
                      .map((ach: any, idx: number) => (
                        <div key={idx} className="group relative shrink-0">
                          <div
                            className={`w-16 h-16 rounded-xl overflow-hidden ${ach.achieved ? 'border-2 border-cyan-400/80 shadow-[0_0_15px_rgba(34,211,238,0.5)]' : 'border border-white/10'}`}
                          >
                            <img
                              src={ach.icon}
                              alt={ach.name}
                              className={`w-full h-full object-cover transition-all ${ach.achieved ? 'opacity-100' : 'grayscale contrast-50 opacity-40'}`}
                            />
                          </div>
                          {/* Tooltip */}
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-[#0B0E14]/95 backdrop-blur-xl border border-white/20 rounded-xl p-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[400] shadow-2xl">
                            <h4 className="text-xs font-bold text-white mb-1 leading-tight">
                              {ach.name}
                            </h4>
                            <p className="text-[10px] text-slate-400 leading-snug">
                              {ach.description}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Image Gallery */}
              {gameDetails?.gallery && gameDetails.gallery.length > 0 && (
                <div className="bg-black/30 border border-white/10 backdrop-blur-md rounded-2xl p-6 shadow-inner">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-white/70 tracking-wide">Screenshots</h3>
                    <span className="text-xs text-white/30 font-mono">
                      {galleryIndex + 1} / {gameDetails.gallery.length}
                    </span>
                  </div>

                  {/* Main Image */}
                  <div className="relative rounded-xl overflow-hidden mb-3 aspect-video bg-black/40">
                    <img
                      key={galleryIndex}
                      src={gameDetails.gallery[galleryIndex]}
                      alt={`Screenshot ${galleryIndex + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {/* Prev/Next Arrows */}
                    <button
                      onClick={() =>
                        setGalleryIndex(
                          (i) => (i - 1 + gameDetails.gallery.length) % gameDetails.gallery.length
                        )
                      }
                      className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/80 border border-white/10 rounded-full text-white backdrop-blur-md transition"
                    >
                      <ChevronDown size={20} className="rotate-90" />
                    </button>
                    <button
                      onClick={() => setGalleryIndex((i) => (i + 1) % gameDetails.gallery.length)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/80 border border-white/10 rounded-full text-white backdrop-blur-md transition"
                    >
                      <ChevronDown size={20} className="-rotate-90" />
                    </button>
                  </div>

                  {/* Thumbnail Strip */}
                  <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
                    {gameDetails.gallery.map((url: string, idx: number) => (
                      <img
                        key={idx}
                        src={url}
                        alt={`Thumb ${idx + 1}`}
                        onClick={() => setGalleryIndex(idx)}
                        className={`h-14 w-24 object-cover rounded-lg cursor-pointer shrink-0 border-2 transition ${
                          idx === galleryIndex
                            ? 'border-primary-500 opacity-100 shadow-[0_0_12px_rgba(99,102,241,0.6)]'
                            : 'border-transparent opacity-50 hover:opacity-80'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Series Timeline & AI Canon Order */}
              <div className="mt-4">
                {!aiTimeline && (
                  <div className="flex items-center justify-end mb-4">
                    <button
                      onClick={async () => {
                        setIsTimelineLoading(true)
                        try {
                          const result = await window.api.getAIPlayOrder(
                            selectedGame.id.toString(),
                            selectedGame.title
                          )
                          setAiTimeline(result)
                        } catch (err) {
                          console.error('AI Timeline failed:', err)
                        } finally {
                          setIsTimelineLoading(false)
                        }
                      }}
                      disabled={isTimelineLoading}
                      className="px-6 py-3 bg-gradient-to-r from-secondary-600/80 to-pink-600/80 hover:from-secondary-500 hover:to-pink-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)] border border-secondary-400/50 rounded-xl text-sm font-black tracking-wide flex items-center gap-2 transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                    >
                      <Sparkles size={18} className={isTimelineLoading ? 'animate-pulse' : ''} />
                      {isTimelineLoading
                        ? 'Consulting lore archives...'
                        : '✨ Generate Canon Play Order'}
                    </button>
                  </div>
                )}

                {isTimelineLoading && (
                  <div className="flex gap-4 overflow-x-auto pb-4 items-center">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div
                        key={i}
                        className="w-24 h-36 rounded-xl bg-white/5 animate-pulse shrink-0 border border-white/10"
                      />
                    ))}
                  </div>
                )}

                {aiTimeline && (
                  <div className="mb-8 bg-black/40 border border-secondary-500/20 rounded-2xl p-6 shadow-inner relative overflow-hidden">
                    <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-secondary-400 to-pink-500 mb-6 flex items-center gap-3">
                      <Sparkles size={24} className="text-secondary-400" /> Canon Story Play Order
                      <button
                        onClick={async () => {
                          setIsRefreshingTimeline(true)
                          const res = await window.api.getAIPlayOrder(
                            selectedGame.id.toString(),
                            selectedGame.title,
                            true
                          )
                          setAiTimeline(res)
                          setIsRefreshingTimeline(false)
                        }}
                        disabled={isRefreshingTimeline}
                        className="ml-auto flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-bold text-slate-300 transition-all"
                      >
                        <RefreshCw
                          size={14}
                          className={isRefreshingTimeline ? 'animate-spin text-secondary-400' : ''}
                        />
                        {isRefreshingTimeline ? 'Updating Lore...' : 'Refresh Timeline'}
                      </button>
                    </h3>
                    <div className="flex gap-4 overflow-x-auto py-4 -my-2 custom-scrollbar items-start">
                      {aiTimeline.map((miniGame: any) => (
                        <div
                          key={miniGame.id}
                          className="flex flex-col gap-2 shrink-0 w-28 group relative z-0 hover:z-50"
                          onClick={() => handleGameClick(miniGame)}
                        >
                          <img
                            src={miniGame.img}
                            className={`w-28 h-40 rounded-xl object-cover cursor-pointer transition-all duration-300 ${
                              miniGame.isCurrent
                                ? 'border-4 border-secondary-500 shadow-[0_0_20px_rgba(168,85,247,0.6)] scale-110 opacity-100'
                                : 'opacity-60 hover:opacity-100 border border-white/10 hover:border-white/30 hover:scale-105'
                            }`}
                            alt={miniGame.title}
                          />
                          <span
                            className={`text-xs font-black text-center mt-1 ${miniGame.isCurrent ? 'text-secondary-400' : 'text-slate-400 group-hover:text-white transition-colors'}`}
                          >
                            {miniGame.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Remakes & Remasters */}
              {gameDetails?.upgradesList && gameDetails.upgradesList.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-lg font-bold text-white/80 mb-4 mt-6">Remakes & Remasters</h3>
                  <div className="flex gap-4 overflow-x-auto py-4 -my-2 custom-scrollbar items-start">
                    {gameDetails.upgradesList.map((miniGame: any) => (
                      <div
                        key={miniGame.id}
                        className="flex flex-col gap-2 shrink-0 w-24 group relative z-0 hover:z-50"
                        onClick={() => handleGameClick(miniGame)}
                      >
                        <img
                          src={miniGame.img}
                          className="w-24 h-36 rounded-xl object-cover cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-[0_0_15px_rgba(255,255,255,0.2)] border border-white/10"
                          alt={miniGame.title}
                        />
                        <span className="text-[10px] font-black text-center text-slate-500">
                          {miniGame.year === 9999 ? 'TBA' : miniGame.year}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* DLCs & Expansions */}
              {gameDetails?.dlcList && gameDetails.dlcList.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-lg font-bold text-white/80 mb-4">DLCs & Expansions</h3>
                  <div className="flex gap-4 overflow-x-auto py-4 -my-2 custom-scrollbar items-start">
                    {gameDetails.dlcList.map((miniGame: any) => (
                      <div
                        key={miniGame.id}
                        className="flex flex-col gap-2 shrink-0 w-24 group relative z-0 hover:z-50"
                        onClick={() => handleGameClick(miniGame)}
                      >
                        <img
                          src={miniGame.img}
                          className="w-24 h-36 rounded-xl object-cover cursor-pointer transition-all duration-300 opacity-60 hover:opacity-100 border border-white/10 hover:border-white/30"
                          alt={miniGame.title}
                        />
                        <span className="text-[10px] font-black text-center text-slate-500">
                          {miniGame.year === 9999 ? 'TBA' : miniGame.year}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Related Games */}
              {gameDetails?.seriesList && gameDetails.seriesList.length > 1 && (
                <div className="">
                  <h3 className="text-lg font-bold text-white/80">
                    {gameDetails.seriesName} (Related Games)
                  </h3>
                  <div className="flex gap-4 overflow-x-auto py-4 -my-2 custom-scrollbar items-start">
                    {gameDetails.seriesList.map((miniGame: any) => {
                      return (
                        <div
                          key={miniGame.id}
                          className="flex flex-col gap-2 shrink-0 w-24 group relative z-0 hover:z-50"
                          onClick={() => handleGameClick(miniGame)}
                        >
                          <img
                            src={miniGame.img}
                            className="w-24 h-36 rounded-xl object-cover cursor-pointer transition-all duration-300 opacity-60 hover:opacity-100 border border-white/10 hover:border-white/30"
                            alt={miniGame.title}
                          />
                          <span className="text-[10px] font-black text-center text-slate-500">
                            {miniGame.year === 9999 ? 'TBA' : miniGame.year}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div
        className="absolute top-8 right-8 z-[9999] flex items-center gap-4"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        {gameDetails?.video_id && !videoError && (
          <div className="flex items-center gap-3">
            {/* Volume Button (Left) */}
            <button
              onClick={toggleMute}
              className="p-3.5 bg-[#181C25]/90 hover:bg-white/10 text-white backdrop-blur-md border border-white/5 rounded-2xl transition shadow-2xl"
            >
              {isMuted ? (
                <VolumeX size={20} className="text-red-400" />
              ) : (
                <Volume2 size={20} className="text-emerald-400" />
              )}
            </button>

            {isVideoMode ? (
              <>
                <button
                  onClick={() => setIsVideoMode(false)}
                  className="flex items-center gap-2.5 px-5 py-3.5 bg-[#181C25]/90 hover:bg-white/10 text-white backdrop-blur-md border border-white/5 rounded-2xl text-sm font-bold transition shadow-2xl"
                >
                  <ChevronDown size={18} className="rotate-90" />
                  Back to Details
                </button>
                {gameplayVideo && (
                  <button
                    onClick={() => {
                      if (isWatchingGameplay) {
                        setCurrentVideoId(gameDetails.video_id)
                      } else {
                        setCurrentVideoId(gameplayVideo.id)
                      }
                    }}
                    className="flex items-center gap-2.5 px-5 py-3.5 bg-[#181C25]/90 hover:bg-white/10 text-white backdrop-blur-md border border-white/5 rounded-2xl text-sm font-bold transition shadow-2xl"
                  >
                    {isWatchingGameplay ? (
                      <PlayCircle size={18} className="text-primary-400" />
                    ) : (
                      <Gamepad2 size={18} className="text-primary-400" />
                    )}
                    {isWatchingGameplay ? 'Switch to Trailer' : 'Switch to Gameplay'}
                  </button>
                )}
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    setCurrentVideoId(gameDetails.video_id)
                    setIsVideoMode(true)
                  }}
                  className="flex items-center gap-2.5 px-5 py-3.5 bg-[#181C25]/90 hover:bg-white/10 text-white backdrop-blur-md border border-white/5 rounded-2xl text-sm font-bold transition shadow-2xl"
                >
                  <PlayCircle size={18} className="text-primary-400" />
                  Watch Trailer
                </button>
                {gameplayVideo && (
                  <button
                    onClick={() => {
                      setCurrentVideoId(gameplayVideo.id)
                      setIsVideoMode(true)
                    }}
                    className="flex items-center gap-2.5 px-5 py-3.5 bg-[#181C25]/90 hover:bg-white/10 text-white backdrop-blur-md border border-white/5 rounded-2xl text-sm font-bold transition shadow-2xl"
                  >
                    <Gamepad2 size={18} className="text-primary-400" />
                    Watch Gameplay
                  </button>
                )}
              </>
            )}

            {/* YouTube Link Button */}
            {isVideoMode && (
              <button
                onClick={() => window.api.openExternal(youtubeUrl)}
                className="flex items-center gap-2.5 px-5 py-3.5 bg-[#181C25]/90 backdrop-blur-md border border-white/5 rounded-2xl text-sm font-bold text-white hover:bg-white/10 transition shadow-2xl"
              >
                <ExternalLink size={18} />
                Open in YouTube
              </button>
            )}
          </div>
        )}

        <button
          onClick={() => {
            setSelectedGame(null)
            setTimeToBeat(null)
          }}
          className="p-3.5 bg-[#181C25]/90 hover:bg-red-500/20 text-white hover:text-red-400 backdrop-blur-md border border-white/5 rounded-2xl shadow-2xl transition"
        >
          <X size={24} />
        </button>
      </div>

      {/* Custom Confirmation Modal */}
      {confirmDialog && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0B0E14] border border-white/10 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] max-w-md w-full p-6 flex flex-col gap-4 mx-4">
            <div className="flex items-center gap-3">
              {confirmDialog.isDanger ? (
                <AlertTriangle className="text-red-500" size={28} />
              ) : (
                <AlertTriangle className="text-primary-400" size={28} />
              )}
              <h2 className="text-xl font-bold text-white">{confirmDialog.title}</h2>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">{confirmDialog.message}</p>
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setConfirmDialog(null)}
                className="px-5 py-2.5 rounded-xl font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  confirmDialog.onConfirm()
                  setConfirmDialog(null)
                }}
                className={`px-5 py-2.5 rounded-xl font-black tracking-wide shadow-lg transition ${
                  confirmDialog.isDanger
                    ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 hover:border-red-500/50'
                    : 'bg-primary-600 hover:bg-primary-500 text-white'
                }`}
              >
                {confirmDialog.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Alert Modal */}
      {alertDialog && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0B0E14] border border-white/10 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] max-w-md w-full p-6 flex flex-col gap-4 mx-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="text-amber-500" size={28} />
              <h2 className="text-xl font-bold text-white">{alertDialog.title}</h2>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">{alertDialog.message}</p>
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setAlertDialog(null)}
                className="px-5 py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-xl font-black tracking-wide shadow-lg transition"
              >
                Okay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CinematicModal
