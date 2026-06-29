import { UploadCloud, Sparkles, Wand2, FileText, Plus, X, RefreshCw, PlayCircle } from 'lucide-react'
import { useGlobal } from '../context/GlobalContext'

const ImportHubModal = () => {
  const {
    showImportModal,
    setShowImportModal,
    isImporting,
    setIsImporting,
    handleAIImport,
    importText,
    setImportText,
    handleTextImport,
    steamKey,
    setSteamKey,
    steamId,
    setSteamId,
    loadGames,
    addNotification,
    setActiveVideoGuide
  } = useGlobal()

  if (!showImportModal) return null

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
      <div className="bg-[#121620] border border-slate-700 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-8">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h2 className="text-2xl font-black text-white flex items-center gap-3">
                <UploadCloud size={28} className="text-primary-400" />
                Import Hub
              </h2>
              <p className="text-slate-400 text-sm mt-1">
                Add multiple games at once using AI or text.
              </p>
            </div>
            <button
              onClick={() => !isImporting && setShowImportModal(false)}
              className="p-2 text-slate-500 hover:text-white transition"
            >
              <X size={24} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-8">
            {/* AI Vision Import */}
            <div
              onClick={!isImporting ? handleAIImport : undefined}
              className={`p-6 rounded-2xl border-2 border-dashed transition-all group relative overflow-hidden ${isImporting ? 'border-primary-500/20 bg-primary-500/5 cursor-not-allowed' : 'border-primary-500/30 hover:border-primary-500 bg-primary-500/5 hover:bg-primary-500/10 cursor-pointer'}`}
            >
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-xl bg-primary-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Sparkles size={24} className="text-primary-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">AI Vision Import</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Upload a screenshot of your Steam, Epic, or GOG library. Gemini will scan and
                  import everything.
                </p>
              </div>
              <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Wand2 size={120} />
              </div>
            </div>

            {/* Text Import */}
            <div className="p-6 rounded-2xl border-2 border-slate-700 bg-slate-800/30">
              <div className="w-12 h-12 rounded-xl bg-slate-700 flex items-center justify-center mb-4">
                <FileText size={24} className="text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Bulk Text Import</h3>
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="Paste list of games (one per line)..."
                className="w-full h-24 bg-black/40 border border-slate-700 rounded-xl p-3 text-xs text-slate-300 focus:outline-none focus:border-primary-500/50 resize-none mb-3"
              />
              <button
                onClick={handleTextImport}
                disabled={isImporting || !importText.trim()}
                className="w-full py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg transition flex items-center justify-center gap-2"
              >
                <Plus size={14} /> Import List
              </button>
            </div>
          </div>

          {/* Steam Sync Section */}
          <div className="p-6 rounded-2xl border-2 border-primary-500/30 bg-primary-500/5 mb-8">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <RefreshCw size={20} className="text-primary-400" />
              Steam Account Sync
            </h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div className="flex items-center justify-between mb-1.5 ml-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500 block">
                    Steam Web API Key
                  </label>
                  <button 
                    onClick={() => setActiveVideoGuide('steam')}
                    className="text-primary-400 hover:text-primary-300 transition hover:scale-110 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider"
                    title="Watch Guide"
                  >
                    <PlayCircle size={14} /> Guide
                  </button>
                </div>
                <input
                  type="password"
                  value={steamKey}
                  onChange={(e) => {
                    setSteamKey(e.target.value)
                    window.api.saveSetting('steamKey', e.target.value)
                  }}
                  placeholder="Enter API Key..."
                  className="w-full bg-black/40 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-primary-500/50 transition"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1.5 ml-1">
                  Steam64 ID
                </label>
                <input
                  type="text"
                  value={steamId}
                  onChange={(e) => {
                    setSteamId(e.target.value)
                    window.api.saveSetting('steamId', e.target.value)
                  }}
                  placeholder="Enter Steam64 ID..."
                  className="w-full bg-black/40 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-primary-500/50 transition"
                />
              </div>
            </div>
            <button
              onClick={async () => {
                if (!steamKey || !steamId) {
                  alert('Please enter both your Steam API Key and Steam64 ID.')
                  return
                }
                setIsImporting(true)
                try {
                  const count = await window.api.syncSteam(steamId, steamKey)
                  alert(`Successfully synced ${count} games from Steam!`)
                  await loadGames()
                  addNotification(
                    'Steam Sync Complete',
                    `Successfully synced ${count} games from your Steam library.`
                  )
                  window.api.showNotification(
                    'Steam Sync Complete',
                    `Successfully synced ${count} games from your Steam library.`
                  )
                } catch (err: any) {
                  alert(`Steam Sync Failed: ${err.message || 'Check your API key and Steam64 ID.'}`)
                } finally {
                  setIsImporting(false)
                  setShowImportModal(false)
                }
              }}
              disabled={isImporting}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg transition-all flex justify-center items-center gap-2 active:scale-[0.98]"
            >
              <RefreshCw size={20} className={isImporting ? 'animate-spin' : ''} />
              Sync Steam Library
            </button>
          </div>

          {isImporting && (
            <div className="flex items-center gap-4 p-4 bg-primary-500/10 border border-primary-500/20 rounded-xl">
              <RefreshCw size={20} className="text-primary-400 animate-spin" />
              <div>
                <p className="text-sm font-bold text-primary-300">Processing Import...</p>
                <p className="text-xs text-primary-400/70">
                  Our AI is fetching game metadata. This may take a minute.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ImportHubModal
