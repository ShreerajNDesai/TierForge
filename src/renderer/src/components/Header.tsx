import React, { useState, useRef, useEffect } from 'react'
import {
  Search,
  Check,
  Plus,
  UploadCloud,
  RefreshCw,
  Download,
  Bell,
  BarChart2,
  Minus,
  Square,
  X,
  Camera,
  Image as ImageIcon,
  ChevronDown,
  Cpu,
  HardDrive,
  Database,
  Activity
} from 'lucide-react'
import { Droppable, Draggable } from '@hello-pangea/dnd'
import { useGlobal } from '../context/GlobalContext'

const Header = () => {
  const {
    activeTab,
    setActiveTab,
    librarySearch,
    setLibrarySearch,
    searchQuery,
    handleSearch,
    searchResults,
    handleAddGame,
    data,
    setShowImportModal,
    setGeminiKey,
    handleScanPC,
    isScanning,
    notifications,
    setNotifications,
    libraryGames
  } = useGlobal()

  const [showExportMenu, setShowExportMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showSystemMonitor, setShowSystemMonitor] = useState(false)
  const [sysStats, setSysStats] = useState<any>(null)

  const exportMenuRef = useRef<HTMLDivElement>(null)
  const notificationsRef = useRef<HTMLDivElement>(null)
  const systemMonitorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    if (showSystemMonitor) {
      window.api.getSystemStats().then(setSysStats)
      interval = setInterval(() => {
        window.api.getSystemStats().then(setSysStats)
      }, 2000)
    } else {
      setSysStats(null)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [showSystemMonitor])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false)
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false)
      }
      if (systemMonitorRef.current && !systemMonitorRef.current.contains(event.target as Node)) {
        setShowSystemMonitor(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleExportClick = (type: 'tierlist' | 'library') => {
    setShowExportMenu(false)
    if (activeTab !== type) {
      setActiveTab(type)
    }
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent(`trigger-export-${type}`))
    }, 150)
  }

  return (
    <header
      className="h-20 flex items-center justify-between px-10 shrink-0"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      {/* Search Box - Left */}
      <div
        className="flex items-center"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <div className="flex items-center relative w-72 group">
          <Search
            className="absolute left-3.5 text-slate-500 group-focus-within:text-primary-400 transition-colors"
            size={16}
          />
          <input
            type="text"
            value={activeTab === 'library' ? librarySearch : searchQuery}
            onChange={(e) => {
              if (activeTab === 'library') {
                setLibrarySearch(e.target.value)
              } else {
                handleSearch(e)
              }
            }}
            placeholder={activeTab === 'library' ? 'Search your library...' : 'Search games...'}
            className="w-full bg-[#121620]/80 border border-slate-700/50 text-sm rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-primary-500/50 focus:bg-[#151924]/90 text-slate-200 placeholder-slate-500 transition shadow-inner"
          />
          {searchResults.length > 0 && activeTab !== 'library' && activeTab !== 'discover' && (
            <Droppable droppableId="search-results" isDropDisabled={true}>
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="absolute top-14 left-0 w-full bg-[#121620] border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-[100]"
                >
                  {searchResults.map((game, index) => (
                    <Draggable
                      key={`search-${game.id}`}
                      draggableId={`search-${game.id}`}
                      index={index}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          onClick={() => handleAddGame(game)}
                          className={`flex items-center gap-3 p-3 transition-colors ${
                            snapshot.isDragging
                              ? 'bg-slate-800 shadow-2xl border border-primary-400 rounded-lg z-[200]'
                              : 'hover:bg-slate-800 bg-[#121620] cursor-pointer'
                          }`}
                        >
                          <img
                            src={game.image_url}
                            alt={game.title}
                            className="w-8 h-12 object-cover rounded pointer-events-none"
                          />
                          <span className="font-medium text-sm text-slate-200">{game.title}</span>
                          {data.collection.some((g: any) => g.id === game.id.toString()) ||
                          Object.values(data.tiers).some((tier: any) =>
                            tier.items.some((g: any) => g.id === game.id.toString())
                          ) ? (
                            <Check size={16} className="ml-auto text-green-400" />
                          ) : (
                            <Plus size={16} className="ml-auto text-primary-400" />
                          )}
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          )}
        </div>
      </div>

      {/* Action Buttons - Right */}
      <div
        className="flex items-center gap-6"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <div className="flex items-center gap-5 text-slate-400">
          <button
            onClick={async () => {
              const key = await window.api.getSetting('geminiKey')
              if (key) setGeminiKey(key)
              setShowImportModal(true)
            }}
            className="flex items-center gap-2 px-3 py-1.5 bg-primary-500/20 text-primary-300 hover:bg-primary-500/30 hover:text-primary-200 rounded-lg text-sm font-medium transition"
          >
            <UploadCloud size={16} /> Import Hub
          </button>

          <div className="relative" ref={exportMenuRef}>
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                showExportMenu
                  ? 'bg-secondary-500/30 text-secondary-200'
                  : 'bg-secondary-500/20 text-secondary-300 hover:bg-secondary-500/30 hover:text-secondary-200'
              }`}
            >
              <Camera size={16} /> Export Hub{' '}
              <ChevronDown
                size={14}
                className={`transition-transform ${showExportMenu ? 'rotate-180' : ''}`}
              />
            </button>

            {showExportMenu && (
              <div className="absolute top-full right-0 mt-2 w-56 bg-[#151924] border border-slate-700/80 rounded-xl shadow-2xl py-2 z-[200]">
                <button
                  onClick={() => handleExportClick('tierlist')}
                  className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-primary-500/20 hover:text-primary-300 flex items-center gap-3 transition-colors"
                >
                  <Camera size={16} className="text-primary-400" /> Export Tier List
                </button>
                <button
                  onClick={() => handleExportClick('library')}
                  className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-secondary-500/20 hover:text-secondary-300 flex items-center gap-3 transition-colors"
                >
                  <ImageIcon size={16} className="text-secondary-400" /> Export Library Mosaic
                </button>
              </div>
            )}
          </div>
          <button
            onClick={handleScanPC}
            disabled={isScanning}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition relative overflow-hidden group ${
              isScanning
                ? 'bg-secondary-500/20 text-secondary-400 cursor-not-allowed border border-secondary-500/30'
                : 'bg-gradient-to-r from-primary-500 to-secondary-600 text-white border border-primary-400/30'
            }`}
          >
            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors"></div>
            {isScanning ? (
              <>
                <RefreshCw size={14} className="animate-spin relative z-10" />{' '}
                <span className="relative z-10">Scanning...</span>
              </>
            ) : (
              <>
                <Download size={14} className="relative z-10" />{' '}
                <span className="relative z-10">Scan PC</span>
              </>
            )}
          </button>
          <div className="relative" ref={notificationsRef}>
            <div
              className="cursor-pointer hover:text-white transition"
              onClick={() => {
                setShowNotifications(!showNotifications)
                if (!showNotifications && notifications.some((n) => !n.read)) {
                  setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
                }
              }}
            >
              <Bell size={18} />
              {notifications.some((n) => !n.read) && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-[#0B0E14]"></span>
              )}
            </div>

            {showNotifications && (
              <div className="absolute top-12 right-0 w-80 bg-[#121620]/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden z-[9999] flex flex-col">
                <div className="p-4 border-b border-white/5 bg-white/5 flex justify-between items-center">
                  <h3 className="text-white font-bold">Notifications</h3>
                </div>
                <div className="max-h-96 overflow-y-auto custom-scrollbar">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-sm">
                      No new notifications
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`p-4 border-b border-white/5 hover:bg-white/5 transition flex flex-col gap-1 ${n.read ? 'opacity-70' : ''}`}
                      >
                        <h4 className="text-sm font-bold text-white">{n.title}</h4>
                        <p className="text-xs text-slate-400 leading-snug">{n.message}</p>
                        <span className="text-[10px] text-slate-500 mt-1">
                          {n.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="relative" ref={systemMonitorRef}>
            <div
              className={`cursor-pointer transition ${showSystemMonitor ? 'text-primary-400' : 'text-slate-400 hover:text-white'}`}
              onClick={() => setShowSystemMonitor(!showSystemMonitor)}
            >
              <BarChart2 size={18} />
            </div>

            {showSystemMonitor && (
              <div className="absolute top-12 right-0 w-80 bg-[#121620]/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden z-[9999] flex flex-col">
                {/* Session Stats */}
                <div className="p-4 border-b border-white/5">
                  <h3 className="text-white font-bold mb-3">🎮 Session Stats</h3>
                  <div className="mb-4">
                    <span className="text-xs text-slate-400">App Uptime</span>
                    <p className="text-sm font-medium text-slate-200">
                      {sysStats
                        ? `Online for ${sysStats.uptime.hours}h ${sysStats.uptime.minutes}m`
                        : 'Loading...'}
                    </p>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">Library Health</span>
                      <span className="text-slate-300">
                        {libraryGames.filter((g) => g.status === 'Completed').length} /{' '}
                        {
                          libraryGames.filter(
                            (g) => g.status === 'Backlog' || g.status === 'Completed'
                          ).length
                        }{' '}
                        Completed
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5">
                      <div
                        className="bg-primary-500 h-1.5 rounded-full"
                        style={{
                          width: `${Math.round((libraryGames.filter((g) => g.status === 'Completed').length / Math.max(1, libraryGames.filter((g) => g.status === 'Backlog' || g.status === 'Completed').length)) * 100)}%`
                        }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Hardware Telemetry */}
                <div className="p-4 bg-white/5">
                  <h3 className="text-white font-bold mb-4">💻 System Monitor</h3>

                  {sysStats ? (
                    <div className="space-y-4">
                      {/* CPU */}
                      <div>
                        <div className="flex justify-between text-xs mb-1 items-center">
                          <div className="flex items-center gap-1.5 text-slate-300">
                            <Cpu size={12} className="text-blue-400" /> CPU
                          </div>
                          <span
                            className={
                              sysStats.cpu.percent > 85 ? 'text-rose-400' : 'text-slate-400'
                            }
                          >
                            {sysStats.cpu.percent}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-1.5 rounded-full transition-all ${sysStats.cpu.percent > 85 ? 'bg-rose-500' : 'bg-blue-500'}`}
                            style={{ width: `${sysStats.cpu.percent}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* RAM */}
                      <div>
                        <div className="flex justify-between text-xs mb-1 items-center">
                          <div className="flex items-center gap-1.5 text-slate-300">
                            <Activity size={12} className="text-emerald-400" /> RAM
                          </div>
                          <span
                            className={
                              sysStats.ram.percent > 85 ? 'text-rose-400' : 'text-slate-400'
                            }
                          >
                            {sysStats.ram.usedGB}GB / {sysStats.ram.totalGB}GB
                          </span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-1.5 rounded-full transition-all ${sysStats.ram.percent > 85 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                            style={{ width: `${sysStats.ram.percent}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Disk */}
                      <div>
                        <div className="flex justify-between text-xs mb-1 items-center">
                          <div className="flex items-center gap-1.5 text-slate-300">
                            <HardDrive size={12} className="text-secondary-400" /> C: Drive
                          </div>
                          <span
                            className={
                              sysStats.disk.percent > 85 ? 'text-rose-400' : 'text-slate-400'
                            }
                          >
                            {sysStats.disk.freeGB}GB Free
                          </span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-1.5 rounded-full transition-all ${sysStats.disk.percent > 85 ? 'bg-rose-500' : 'bg-secondary-500'}`}
                            style={{ width: `${sysStats.disk.percent}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-slate-500 text-sm py-4 animate-pulse">
                      Gathering telemetry...
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 pl-6 border-l border-slate-800/80 text-slate-500">
          <div
            className="p-2 rounded-lg cursor-pointer hover:bg-slate-700/50 hover:text-white transition"
            onClick={() => window.api.windowMinimize()}
          >
            <Minus size={20} />
          </div>
          <div
            className="p-2 rounded-lg cursor-pointer hover:bg-slate-700/50 hover:text-white transition"
            onClick={() => window.api.windowMaximize()}
          >
            <Square size={16} />
          </div>
          <div
            className="p-2 rounded-lg cursor-pointer hover:bg-red-500/20 hover:text-red-400 transition"
            onClick={() => window.api.windowClose()}
          >
            <X size={20} />
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
