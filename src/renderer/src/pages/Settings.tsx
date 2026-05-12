import { Settings as SettingsIcon, Sparkles, Trophy, Gamepad2 } from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';

const Settings = () => {
  const {
    bgMode,
    setBgMode,
    defaultMuted,
    setDefaultMuted,
    geminiKey,
    setGeminiKey,
    rawgKey,
    setRawgKey,
    igdbClientId,
    setIgdbClientId,
    igdbClientSecret,
    setIgdbClientSecret
  } = useGlobal();

  return (
    <div className="flex-1 overflow-y-auto px-10 pb-12 pt-10 relative custom-scrollbar">
      <h1 className="text-[34px] font-extrabold text-white mb-10 flex items-center gap-4 tracking-tight leading-none">
        Settings
      </h1>
      
      <div className="max-w-3xl bg-[#121620] border border-slate-700/60 rounded-3xl p-8 shadow-xl">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3 pb-4 border-b border-slate-700/50">
          <SettingsIcon size={22} className="text-indigo-400" />
          General Settings
        </h2>
        
        <div className="space-y-8">
          <div className="flex flex-col gap-4 max-w-md">
            <div>
              <label className="text-sm font-semibold text-slate-300 block mb-1">Cinematic Background Mode</label>
              <p className="text-xs text-slate-500 mb-3">Choose whether the cinematic modal plays a live YouTube trailer or shows a high-res image.</p>
            </div>
            
            <div className="flex bg-slate-800/50 p-1.5 rounded-xl border border-slate-700/50">
              <button
                onClick={() => {
                  setBgMode('video');
                  localStorage.setItem('bgMode', 'video');
                }}
                className={`flex-1 py-3 text-sm font-semibold rounded-lg transition ${bgMode === 'video' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Live Video Trailer
              </button>
              <button
                onClick={() => {
                  setBgMode('image');
                  localStorage.setItem('bgMode', 'image');
                }}
                className={`flex-1 py-3 text-sm font-semibold rounded-lg transition ${bgMode === 'image' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
              >
                High-Res Image
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-4 max-w-md pt-6 border-t border-slate-700/50">
            <div>
              <label className="text-sm font-semibold text-slate-300 block mb-1">Default Video Sound</label>
              <p className="text-xs text-slate-500 mb-3">Choose whether background trailers start with sound on or muted by default.</p>
            </div>
            
            <div className="flex bg-slate-800/50 p-1.5 rounded-xl border border-slate-700/50">
              <button
                onClick={() => {
                  setDefaultMuted(false);
                  localStorage.setItem('defaultMuted', 'false');
                }}
                className={`flex-1 py-3 text-sm font-semibold rounded-lg transition ${!defaultMuted ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Sound On
              </button>
              <button
                onClick={() => {
                  setDefaultMuted(true);
                  localStorage.setItem('defaultMuted', 'true');
                }}
                className={`flex-1 py-3 text-sm font-semibold rounded-lg transition ${defaultMuted ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Muted
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-4 max-w-md pt-6 border-t border-slate-700/50">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={18} className="text-purple-400" />
              <label className="text-sm font-semibold text-slate-300 block">Gemini API Key</label>
            </div>
            <p className="text-xs text-slate-500 mb-1">Required for AI Vision imports. Your key is stored securely in your local database.</p>
            
            <input 
              type="password" 
              value={geminiKey}
              onChange={(e) => {
                setGeminiKey(e.target.value);
                window.api.saveSetting('geminiKey', e.target.value);
              }}
              placeholder="Enter Gemini API Key..." 
              className="w-full bg-slate-800/50 border border-slate-700/50 text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500/50 text-slate-200 placeholder-slate-600 transition"
            />
          </div>


          <div className="flex flex-col gap-4 max-w-md pt-6 border-t border-slate-700/50">
            <div className="flex items-center gap-2 mb-1">
              <Trophy size={18} className="text-yellow-400" />
              <label className="text-sm font-semibold text-slate-300 block">RAWG.io API Key</label>
            </div>
            <p className="text-xs text-slate-500 mb-1">Required for the Global Rankings page. Get a free key at rawg.io/apidocs.</p>
            
            <input 
              type="password" 
              value={rawgKey}
              onChange={(e) => {
                setRawgKey(e.target.value);
                window.api.saveSetting('rawg_key', e.target.value);
              }}
              placeholder="Enter RAWG.io API Key..." 
              className="w-full bg-slate-800/50 border border-slate-700/50 text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-yellow-500/50 text-slate-200 placeholder-slate-600 transition"
            />
          </div>

          <div className="flex flex-col gap-4 max-w-md pt-6 border-t border-slate-700/50">
            <div className="flex items-center gap-2 mb-1">
              <Gamepad2 size={18} className="text-indigo-400" />
              <label className="text-sm font-semibold text-slate-300 block">IGDB (Twitch) API Integration</label>
            </div>
            <p className="text-xs text-slate-500 mb-1">Required for game search and cinematic details. Create an app at dev.twitch.tv.</p>
            
            <div className="space-y-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1.5 ml-1">Client ID</span>
                <input 
                  type="password" 
                  value={igdbClientId}
                  onChange={(e) => {
                    setIgdbClientId(e.target.value);
                    window.api.saveSetting('igdb_client_id', e.target.value);
                  }}
                  placeholder="Enter IGDB Client ID..." 
                  className="w-full bg-slate-800/50 border border-slate-700/50 text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500/50 text-slate-200 placeholder-slate-600 transition"
                />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1.5 ml-1">Client Secret</span>
                <input 
                  type="password" 
                  value={igdbClientSecret}
                  onChange={(e) => {
                    setIgdbClientSecret(e.target.value);
                    window.api.saveSetting('igdb_client_secret', e.target.value);
                  }}
                  placeholder="Enter IGDB Client Secret..." 
                  className="w-full bg-slate-800/50 border border-slate-700/50 text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500/50 text-slate-200 placeholder-slate-600 transition"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
