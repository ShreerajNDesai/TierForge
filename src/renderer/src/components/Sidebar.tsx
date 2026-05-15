import { Gamepad2, LayoutGrid, Bot, Wand2, Library, Trophy, BarChart2, Settings, ChevronDown, User, Clock, VolumeX, Volume2, Monitor, Cloud, LogOut, CheckSquare, Square } from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';
import { useState, useEffect } from 'react';

const Sidebar = () => {
  const { 
    activeTab, setActiveTab, 
    userName, setUserName, userAvatar, setUserAvatar,
    isMasterMenuOpen, setIsMasterMenuOpen,
    gamerTitle, totalPlaytimeMinutes,
    libraryGames, defaultMuted, setDefaultMuted,
    toggleMute
  } = useGlobal();

  const [discordStatus, setDiscordStatus] = useState({ connected: false, initialized: false });

  useEffect(() => {
    if (isMasterMenuOpen) {
      window.api.checkDiscordStatus().then(setDiscordStatus);
    }
  }, [isMasterMenuOpen]);

  const handleEditProfile = async () => {
    const newName = prompt('Enter your name:', userName);
    if (newName === null) return;
    
    const avatarPath = await window.api.browseAvatar();
    await window.api.updateUserProfile(newName, avatarPath);
    
    setUserName(newName);
    if (avatarPath) {
      // Reload setting to get base64
      window.api.getSetting('user_avatar').then((avatar: string | null) => {
        if (avatar) setUserAvatar(avatar);
      });
    }
  };

  const navItems = [
    { id: 'tierlist', label: 'Tier List', icon: LayoutGrid, color: 'indigo' },
    { id: 'discover', label: 'Discover', icon: Bot, color: 'indigo' },
    { id: 'oracle', label: 'AI Oracle', icon: Wand2, color: 'purple' },
    { id: 'library', label: 'Library', icon: Library, color: 'indigo' },
    { id: 'rankings', label: 'Rankings', icon: Trophy, color: 'yellow' },
    { id: 'statistics', label: 'Statistics', icon: BarChart2, color: 'indigo' },
    { id: 'settings', label: 'Settings', icon: Settings, color: 'indigo', marginTop: 'mt-6' },
  ];

  const backlogCount = libraryGames.filter(g => g.status === 'Backlog').length;
  const playtimeHours = Math.round(totalPlaytimeMinutes / 60);

  return (
    <aside className="w-[260px] bg-[#080B10]/95 backdrop-blur-2xl border-r border-slate-800/50 flex flex-col justify-between z-10 shrink-0">
      <div>
        <div className="flex items-center gap-3 p-8 text-2xl font-black text-white tracking-wide">
          <Gamepad2 className="text-indigo-500" size={32} />
          TierForge
        </div>
        
        <nav className="px-5 space-y-1 mt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const colorClass = item.color === 'indigo' ? 'indigo' : item.color === 'purple' ? 'purple' : 'yellow';
            
            return (
              <div 
                key={item.id}
                tabIndex={0}
                onClick={() => setActiveTab(item.id)}
                onKeyDown={(e) => { if (e.key === 'Enter') setActiveTab(item.id); }}
                className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl cursor-pointer relative overflow-hidden group transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:bg-white/10 ${item.marginTop || ''} ${isActive ? `bg-gradient-to-r from-${colorClass}-600/20 to-${colorClass === 'indigo' ? 'purple' : colorClass === 'purple' ? 'pink' : 'amber'}-600/10 text-${colorClass}-300 border border-${colorClass}-500/30 shadow-[0_0_20px_rgba(${colorClass === 'indigo' ? '99,102,241' : colorClass === 'purple' ? '168,85,247' : '234,179,8'},0.15)]` : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'}`}
              >
                {isActive && <div className={`absolute inset-0 bg-${colorClass}-500/10 group-hover:bg-${colorClass}-500/20 transition-colors`}></div>}
                <Icon size={20} className={isActive ? `text-${colorClass}-400 relative z-10` : ''} /> 
                <span className="font-semibold text-sm relative z-10">{item.label}</span>
              </div>
            );
          })}
        </nav>
      </div>
      
      {/* User Profile & Master Menu */}
      <div className="p-5 mb-2 relative">
        {isMasterMenuOpen && (
          <div className="absolute bottom-full left-5 mb-4 w-72 bg-[#0B0E14]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl z-[9999] animate-in slide-in-from-bottom-2 duration-200">
            {/* Section 1: Edit Profile */}
            <div className="flex items-center gap-3 pb-4 mb-4 border-b border-white/5">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center overflow-hidden">
                {userAvatar ? <img src={userAvatar} className="w-full h-full object-cover" /> : <User className="text-indigo-400" size={24} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-white truncate">{userName}</div>
                <button 
                  onClick={handleEditProfile}
                  className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition uppercase tracking-wider"
                >
                  Edit Profile
                </button>
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
                  <Library size={14} className="text-indigo-400" /> {backlogCount}
                </div>
              </div>
            </div>

            {/* Section 3: Quick Toggles */}
            <div className="space-y-1 mb-4">
              <button 
                onClick={() => {
                  const newVal = !defaultMuted;
                  setDefaultMuted(newVal);
                  window.api.saveSetting('defaultMuted', String(newVal));
                }}
                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition text-slate-300 hover:text-white"
              >
                <div className="flex items-center gap-2 text-xs font-semibold">
                  {defaultMuted ? <VolumeX size={14} /> : <Volume2 size={14} />} Mute Trailers
                </div>
                {defaultMuted ? <CheckSquare size={14} className="text-indigo-500" /> : <Square size={14} className="opacity-20" />}
              </button>
              <button 
                onClick={async () => {
                  const newVal = !discordStatus.connected;
                  await window.api.updateDiscordRpc(newVal);
                  window.api.saveSetting('discord_rpc', String(newVal));
                  setDiscordStatus(prev => ({ ...prev, connected: newVal }));
                }}
                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition text-slate-300 hover:text-white"
              >
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <Monitor size={14} /> Discord Presence
                </div>
                {discordStatus.connected ? <CheckSquare size={14} className="text-indigo-500" /> : <Square size={14} className="opacity-20" />}
              </button>
            </div>

            {/* Section 4: Utilities */}
            <div className="space-y-1 border-t border-white/5 pt-3">
              <button 
                onClick={() => {
                  window.api.invoke('force-cloud-backup');
                  setIsMasterMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 transition text-xs font-bold text-sky-400"
              >
                <Cloud size={14} /> Force Cloud Backup
              </button>
              <button 
                onClick={() => {
                  setActiveTab('settings');
                  setIsMasterMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 transition text-xs font-bold text-slate-400 hover:text-white"
              >
                <Settings size={14} /> Full Settings
              </button>
              <button 
                onClick={() => window.api.invoke('quit-app')}
                className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-red-500/10 transition text-xs font-bold text-red-400"
              >
                <LogOut size={14} /> Quit TierForge
              </button>
            </div>
          </div>
        )}

        <div 
          onClick={() => setIsMasterMenuOpen(!isMasterMenuOpen)}
          className={`flex items-center gap-3 p-3 rounded-2xl transition border ${isMasterMenuOpen ? 'bg-slate-800 border-indigo-500/50' : 'hover:bg-slate-800/40 border-transparent hover:border-slate-800'} cursor-pointer`}
        >
          <div className="w-11 h-11 rounded-full border-2 border-indigo-500/40 shadow-lg overflow-hidden flex items-center justify-center bg-slate-900">
            {userAvatar ? <img src={userAvatar} alt="User" className="w-full h-full object-cover" /> : <User className="text-indigo-400" size={20} />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-bold text-white flex items-center gap-2">
              <span className="truncate">{userName}</span>
              <span className="text-[9px] bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded-md font-bold uppercase border border-indigo-500/30 shrink-0">
                {gamerTitle}
              </span>
            </div>
            <div className="text-xs text-slate-400 mt-0.5 truncate">{libraryGames.length} Games • {playtimeHours}h Total</div>
          </div>
          <ChevronDown size={16} className={`text-slate-500 transition-transform ${isMasterMenuOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
