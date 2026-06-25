import {
  Gamepad2,
  LayoutGrid,
  Compass,
  Wand2,
  Library,
  Trophy,
  BarChart2,
  Settings,
  ChevronDown,
  User,
  Clock,
  VolumeX,
  Volume2,
  Monitor,
  Cloud,
  LogOut,
  CheckSquare,
  Square
} from 'lucide-react'
import { useGlobal } from '../context/GlobalContext'
import { useState, useEffect } from 'react'

const Sidebar = () => {
  const {
    activeTab,
    setActiveTab,
    userName,
    setUserName,
    userAvatar,
    setUserAvatar,
    isMasterMenuOpen,
    setIsMasterMenuOpen,
    libraryGames,
    defaultMuted,
    setDefaultMuted
  } = useGlobal()

  const [discordStatus, setDiscordStatus] = useState({ connected: false, initialized: false })
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [tempName, setTempName] = useState(userName)

  useEffect(() => {
    if (isMasterMenuOpen) {
      window.api.checkDiscordStatus().then(setDiscordStatus)
    }
  }, [isMasterMenuOpen])



  const navItems = [
    { id: 'tierlist', label: 'Tier List', icon: LayoutGrid, activeBorder: 'border-rose-500/30', activeText: 'text-rose-300', activeIcon: 'text-rose-400', activeBg: 'bg-gradient-to-r from-rose-600/20 to-pink-600/10 shadow-[0_0_20px_rgba(244,63,94,0.15)]', hoverBg: 'bg-rose-500/10', groupHover: 'group-hover:bg-rose-500/20' },
    { id: 'library', label: 'Library', icon: Library, activeBorder: 'border-emerald-500/30', activeText: 'text-emerald-300', activeIcon: 'text-emerald-400', activeBg: 'bg-gradient-to-r from-emerald-600/20 to-teal-600/10 shadow-[0_0_20px_rgba(16,185,129,0.15)]', hoverBg: 'bg-emerald-500/10', groupHover: 'group-hover:bg-emerald-500/20' },
    { id: 'oracle', label: 'AI Oracle', icon: Wand2, activeBorder: 'border-purple-500/30', activeText: 'text-purple-300', activeIcon: 'text-purple-400', activeBg: 'bg-gradient-to-r from-purple-600/20 to-pink-600/10 shadow-[0_0_20px_rgba(168,85,247,0.15)]', hoverBg: 'bg-purple-500/10', groupHover: 'group-hover:bg-purple-500/20' },
    { id: 'discover', label: 'Discover', icon: Compass, activeBorder: 'border-cyan-500/30', activeText: 'text-cyan-300', activeIcon: 'text-cyan-400', activeBg: 'bg-gradient-to-r from-cyan-600/20 to-blue-600/10 shadow-[0_0_20px_rgba(6,182,212,0.15)]', hoverBg: 'bg-cyan-500/10', groupHover: 'group-hover:bg-cyan-500/20' },
    { id: 'rankings', label: 'Rankings', icon: Trophy, activeBorder: 'border-amber-500/30', activeText: 'text-amber-300', activeIcon: 'text-amber-400', activeBg: 'bg-gradient-to-r from-amber-600/20 to-yellow-600/10 shadow-[0_0_20px_rgba(245,158,11,0.15)]', hoverBg: 'bg-amber-500/10', groupHover: 'group-hover:bg-amber-500/20' },
    { id: 'statistics', label: 'Statistics', icon: BarChart2, activeBorder: 'border-blue-500/30', activeText: 'text-blue-300', activeIcon: 'text-blue-400', activeBg: 'bg-gradient-to-r from-blue-600/20 to-indigo-600/10 shadow-[0_0_20px_rgba(59,130,246,0.15)]', hoverBg: 'bg-blue-500/10', groupHover: 'group-hover:bg-blue-500/20' },
    { id: 'settings', label: 'Settings', icon: Settings, activeBorder: 'border-slate-500/30', activeText: 'text-slate-300', activeIcon: 'text-slate-400', activeBg: 'bg-gradient-to-r from-slate-600/20 to-gray-600/10 shadow-[0_0_20px_rgba(100,116,139,0.15)]', hoverBg: 'bg-slate-500/10', groupHover: 'group-hover:bg-slate-500/20', marginTop: 'mt-6' }
  ]

  const backlogCount = libraryGames.filter((g) => g.status === 'Backlog').length
  
  // Calculate total playtime
  const playtimeHours = Math.round(libraryGames.reduce((acc, game) => acc + (game.playtime_minutes || 0), 0) / 60)

  return (
    <aside className="w-[280px] bg-slate-950/40 backdrop-blur-3xl border-r border-white/5 flex flex-col justify-between z-10 shrink-0">
      <div>
        <div className="flex items-center gap-3 p-8 text-2xl font-black text-white tracking-wide">
          <Gamepad2 className="text-primary-500" size={32} />
          TierForge
        </div>

        <nav className="px-5 space-y-1 mt-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id

            return (
              <div
                key={item.id}
                tabIndex={0}
                onClick={() => setActiveTab(item.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setActiveTab(item.id)
                }}
                className={`flex items-center gap-4 px-5 py-3.5 rounded-xl cursor-pointer relative overflow-hidden group transition-all duration-300 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20 ${item.marginTop || ''} ${isActive ? `${item.activeBg} ${item.activeText} border ${item.activeBorder} shadow-lg` : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'}`}
              >
                {isActive && (
                  <div
                    className={`absolute inset-0 ${item.hoverBg} ${item.groupHover} transition-colors`}
                  ></div>
                )}
                <Icon
                  size={20}
                  className={`relative z-10 ${isActive ? item.activeIcon : ''}`}
                />
                <span className="font-semibold text-sm relative z-10">{item.label}</span>
              </div>
            )
          })}
        </nav>
      </div>

      {/* User Profile & Master Menu */}
      <div className="p-5 mb-2 relative">
        {isMasterMenuOpen && (
          <div className="absolute bottom-full left-5 mb-4 w-72 bg-[#0B0E14]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl z-[9999] animate-in slide-in-from-bottom-2 duration-200">
            {/* Section 1: Edit Profile */}
            <div className="flex items-center gap-3 pb-4 mb-4 border-b border-white/5">
              <div 
                className="w-12 h-12 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center overflow-hidden cursor-pointer group relative shrink-0"
                onClick={async () => {
                  const avatarPath = await window.api.browseAvatar()
                  if (avatarPath) {
                    await window.api.updateUserProfile(userName, avatarPath)
                    window.api.getSetting('user_avatar').then((avatar: string | null) => {
                      if (avatar) setUserAvatar(avatar)
                    })
                  }
                }}
              >
                {userAvatar ? (
                  <img src={userAvatar} className="w-full h-full object-cover group-hover:opacity-30 transition" />
                ) : (
                  <User className="text-primary-400 group-hover:opacity-30 transition" size={24} />
                )}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-[8px] font-bold text-white bg-black/40 text-center leading-tight">
                  CHANGE<br/>AVATAR
                </div>
              </div>
              <div className="flex-1 min-w-0">
                {isEditingProfile ? (
                  <div className="flex flex-col gap-1.5">
                    <input 
                      type="text" 
                      value={tempName}
                      onChange={e => setTempName(e.target.value)}
                      onKeyDown={async e => {
                         if (e.key === 'Enter') {
                           await window.api.updateUserProfile(tempName, null)
                           setUserName(tempName)
                           setIsEditingProfile(false)
                         }
                      }}
                      className="w-full bg-black/40 border border-primary-500/50 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-primary-400"
                      autoFocus
                    />
                    <div className="flex gap-3 mt-0.5">
                       <button onClick={async () => {
                           await window.api.updateUserProfile(tempName, null)
                           setUserName(tempName)
                           setIsEditingProfile(false)
                       }} className="text-[10px] text-emerald-400 hover:text-emerald-300 font-black uppercase tracking-wider">Save</button>
                       <button onClick={() => setIsEditingProfile(false)} className="text-[10px] text-slate-400 hover:text-slate-300 font-bold uppercase tracking-wider">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="text-sm font-bold text-white truncate">{userName}</div>
                    <button
                      onClick={() => {
                        setTempName(userName)
                        setIsEditingProfile(true)
                      }}
                      className="text-[10px] font-bold text-primary-400 hover:text-primary-300 transition uppercase tracking-wider mt-0.5 block"
                    >
                      Edit Name
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Section 2: Quick Stats */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                <div className="text-slate-500 text-[10px] font-bold uppercase mb-1">Playtime</div>
                <div className="text-sm font-black text-white flex items-center gap-1.5">
                  <Clock size={14} className="text-sky-400" /> {playtimeHours}h
                </div>
              </div>
              <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                <div className="text-slate-500 text-[10px] font-bold uppercase mb-1">Backlog</div>
                <div className="text-sm font-black text-white flex items-center gap-1.5">
                  <Library size={14} className="text-primary-400" /> {backlogCount}
                </div>
              </div>
            </div>

            {/* Section 3: Quick Toggles */}
            <div className="space-y-1 mb-4">
              <button
                onClick={() => {
                  const newVal = !defaultMuted
                  setDefaultMuted(newVal)
                  window.api.saveSetting('defaultMuted', String(newVal))
                }}
                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition text-slate-300 hover:text-white"
              >
                <div className="flex items-center gap-2 text-xs font-semibold">
                  {defaultMuted ? <VolumeX size={14} /> : <Volume2 size={14} />} Mute Trailers
                </div>
                {defaultMuted ? (
                  <CheckSquare size={14} className="text-primary-500" />
                ) : (
                  <Square size={14} className="opacity-20" />
                )}
              </button>
              <button
                onClick={async () => {
                  const newVal = !discordStatus.connected
                  await window.api.updateDiscordRpc(newVal)
                  window.api.saveSetting('discord_rpc', String(newVal))
                  setDiscordStatus((prev) => ({ ...prev, connected: newVal }))
                }}
                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition text-slate-300 hover:text-white"
              >
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <Monitor size={14} /> Discord Presence
                </div>
                {discordStatus.connected ? (
                  <CheckSquare size={14} className="text-primary-500" />
                ) : (
                  <Square size={14} className="opacity-20" />
                )}
              </button>
            </div>

            {/* Section 4: Utilities */}
            <div className="space-y-1 border-t border-white/5 pt-3">
              <button
                onClick={() => {
                  window.api.forceCloudBackup()
                  setIsMasterMenuOpen(false)
                }}
                className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 transition text-xs font-bold text-sky-400"
              >
                <Cloud size={14} /> Force Cloud Backup
              </button>
              <button
                onClick={() => {
                  setActiveTab('settings')
                  setIsMasterMenuOpen(false)
                }}
                className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 transition text-xs font-bold text-slate-400 hover:text-white"
              >
                <Settings size={14} /> Full Settings
              </button>
              <button
                onClick={() => window.api.quitApp()}
                className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-red-500/10 transition text-xs font-bold text-red-400"
              >
                <LogOut size={14} /> Quit TierForge
              </button>
            </div>
          </div>
        )}

        <div
          onClick={() => setIsMasterMenuOpen(!isMasterMenuOpen)}
          className={`flex items-center gap-3 p-3 rounded-2xl transition border ${isMasterMenuOpen ? 'bg-slate-800 border-primary-500/50' : 'hover:bg-slate-800/40 border-transparent hover:border-slate-800'} cursor-pointer`}
        >
          <div className="w-11 h-11 rounded-full border-2 border-primary-500/40 shadow-lg overflow-hidden flex items-center justify-center bg-slate-900">
            {userAvatar ? (
              <img src={userAvatar} alt="User" className="w-full h-full object-cover" />
            ) : (
              <User className="text-primary-400" size={20} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-bold text-white flex items-center gap-2">
              <span className="truncate">{userName}</span>
            </div>
            <div className="text-xs text-slate-400 mt-0.5 truncate">
              {libraryGames.length} Games • {playtimeHours}h Total
            </div>
          </div>
          <ChevronDown
            size={16}
            className={`text-slate-500 transition-transform ${isMasterMenuOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
