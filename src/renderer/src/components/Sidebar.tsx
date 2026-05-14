import { Gamepad2, LayoutGrid, Bot, Wand2, Library, Trophy, BarChart2, Settings, ChevronDown } from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';

const Sidebar = () => {
  const { activeTab, setActiveTab } = useGlobal();

  const navItems = [
    { id: 'tierlist', label: 'Tier List', icon: LayoutGrid, color: 'indigo' },
    { id: 'discover', label: 'Discover', icon: Bot, color: 'indigo' },
    { id: 'oracle', label: 'AI Oracle', icon: Wand2, color: 'purple' },
    { id: 'library', label: 'Library', icon: Library, color: 'indigo' },
    { id: 'rankings', label: 'Rankings', icon: Trophy, color: 'yellow' },
    { id: 'statistics', label: 'Statistics', icon: BarChart2, color: 'indigo' },
    { id: 'settings', label: 'Settings', icon: Settings, color: 'indigo', marginTop: 'mt-6' },
  ];

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
      
      {/* User Profile */}
      <div className="p-5 mb-2">
        <div className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-800/40 cursor-pointer transition border border-transparent hover:border-slate-800">
          <img src="https://i.pravatar.cc/150?img=33" alt="User" className="w-11 h-11 rounded-full border-2 border-indigo-500/40 shadow-lg" />
          <div className="flex-1">
            <div className="text-[13px] font-bold text-white flex items-center gap-2">
              PixelPlayer <span className="text-[9px] bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded-md font-bold uppercase border border-purple-500/30">Pro</span>
            </div>
            <div className="text-xs text-slate-400 mt-0.5">Level 24</div>
          </div>
          <ChevronDown size={16} className="text-slate-500" />
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
