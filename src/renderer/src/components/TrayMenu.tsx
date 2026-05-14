import { useEffect, useState } from 'react';
import { Gamepad2, Play, Search, Cloud, AppWindow, MessageSquare, ChevronRight } from 'lucide-react';

export default function TrayMenu() {
  const [data, setData] = useState<any>({
    recentGames: [],
    installedGames: [],
    backlogGames: [],
    discordEnabled: false
  });
  const [showAllGames, setShowAllGames] = useState(false);

  useEffect(() => {
    loadData();
    // In a real app we might want to poll or listen to updates, but for now loading on mount is fine
  }, []);

  const loadData = async () => {
    const res = await window.api.getTrayData();
    setData(res);
  };

  const handleLaunch = async (path: string, gameId: string, title: string) => {
    await window.api.launchGame(path, gameId, title);
    window.api.hideTrayWindow();
  };

  const handleSurpriseMe = async () => {
    if (data.backlogGames && data.backlogGames.length > 0) {
      const randomGame = data.backlogGames[Math.floor(Math.random() * data.backlogGames.length)];
      await window.api.launchGame(randomGame.executable_path, randomGame.id, randomGame.title);
      window.api.hideTrayWindow();
    } else {
      window.api.showNotification('Surprise Me', 'No installed Backlog games found!');
      window.api.hideTrayWindow();
    }
  };

  const handleToggleDiscord = async () => {
    const newState = !data.discordEnabled;
    await window.api.updateDiscordRpc(newState);
    await window.api.saveSetting('discord_rpc', String(newState));
    setData({ ...data, discordEnabled: newState });
  };

  const handleScan = async () => {
    window.api.showNotification('Scanner', 'Scanning PC for new games...');
    window.api.hideTrayWindow();
    await window.api.scanPC();
    window.api.showNotification('Scanner', `Scan Complete!`);
  };

  const handleForceBackup = async () => {
    window.api.hideTrayWindow();
    await window.api.forceCloudBackup();
  };

  const openApp = () => {
    window.api.hideTrayWindow();
    window.api.showMainWindow();
  };

  const quitApp = () => {
    window.api.quitApp();
  };

  return (
    <div className="w-full h-full bg-[#0B0E14]/90 backdrop-blur-xl border border-white/10 rounded-2xl flex flex-col p-2 text-sm text-slate-300 shadow-2xl overflow-hidden no-scrollbar selection:bg-indigo-500/30">
      
      {!showAllGames ? (
        <>
          {data.recentGames.length > 0 && (
            <div className="mb-2">
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">Recently Played</div>
              {data.recentGames.map((game: any) => (
                <button
                  key={game.id}
                  onClick={() => handleLaunch(game.executable_path, game.id, game.title)}
                  className="w-full text-left px-3 py-2 flex items-center gap-3 hover:bg-indigo-500/20 hover:text-white rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 group"
                >
                  <div className="w-6 h-6 rounded overflow-hidden flex-shrink-0 bg-slate-800">
                    {game.image_url && <img src={game.image_url} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <span className="truncate font-medium">{game.title}</span>
                  <Play size={14} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-indigo-400" />
                </button>
              ))}
              <div className="border-t border-white/10 my-1 mx-2" />
            </div>
          )}

          <div className="flex flex-col gap-0.5">
            <button
              onClick={handleSurpriseMe}
              className="w-full text-left px-3 py-2.5 flex items-center gap-3 hover:bg-purple-500/20 hover:text-purple-300 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
            >
              <Gamepad2 size={16} className="text-purple-400" />
              <span className="font-semibold">🎲 Surprise Me!</span>
            </button>

            {data.installedGames.length > 0 && (
              <button
                onClick={() => setShowAllGames(true)}
                className="w-full text-left px-3 py-2.5 flex items-center gap-3 hover:bg-white/10 hover:text-white rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <AppWindow size={16} className="text-slate-400" />
                <span>All Installed Games</span>
                <ChevronRight size={16} className="ml-auto opacity-50" />
              </button>
            )}

            <div className="border-t border-white/10 my-1 mx-2" />

            <button
              onClick={handleToggleDiscord}
              className="w-full text-left px-3 py-2.5 flex items-center gap-3 hover:bg-[#5865F2]/20 hover:text-white rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5865F2]"
            >
              <MessageSquare size={16} className={data.discordEnabled ? "text-[#5865F2]" : "text-slate-500"} />
              <span>Share to Discord</span>
              <div className={`ml-auto w-8 h-4 rounded-full p-0.5 transition-colors ${data.discordEnabled ? 'bg-[#5865F2]' : 'bg-slate-700'}`}>
                <div className={`w-3 h-3 rounded-full bg-white transition-transform ${data.discordEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
              </div>
            </button>

            <div className="border-t border-white/10 my-1 mx-2" />

            <button
              onClick={handleScan}
              className="w-full text-left px-3 py-2.5 flex items-center gap-3 hover:bg-blue-500/20 hover:text-blue-300 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <Search size={16} className="text-blue-400" />
              <span>Scan PC for New Games</span>
            </button>

            <button
              onClick={handleForceBackup}
              className="w-full text-left px-3 py-2.5 flex items-center gap-3 hover:bg-emerald-500/20 hover:text-emerald-300 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <Cloud size={16} className="text-emerald-400" />
              <span>Force Cloud Backup</span>
            </button>

            <div className="border-t border-white/10 my-1 mx-2" />

            <div className="flex items-center gap-1 mt-1">
              <button
                onClick={openApp}
                className="flex-1 text-center px-3 py-2 hover:bg-white/10 hover:text-white rounded-lg transition-colors font-medium text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                Open TierForge
              </button>
              <button
                onClick={quitApp}
                className="flex-1 text-center px-3 py-2 hover:bg-red-500/20 hover:text-red-400 rounded-lg transition-colors font-medium text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              >
                Quit
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-col h-full">
          <button
            onClick={() => setShowAllGames(false)}
            className="px-3 py-2 flex items-center gap-2 hover:bg-white/10 hover:text-white rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white mb-2"
          >
            <ChevronRight size={16} className="rotate-180" />
            <span className="font-medium">Back</span>
          </button>
          
          <div className="flex-1 overflow-y-auto no-scrollbar pb-2">
            {data.installedGames.map((game: any) => (
              <button
                key={game.id}
                onClick={() => handleLaunch(game.executable_path, game.id, game.title)}
                className="w-full text-left px-3 py-2 flex items-center gap-3 hover:bg-indigo-500/20 hover:text-white rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 group"
              >
                <div className="w-6 h-6 rounded overflow-hidden flex-shrink-0 bg-slate-800">
                  {game.image_url && <img src={game.image_url} alt="" className="w-full h-full object-cover" />}
                </div>
                <span className="truncate font-medium">{game.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
