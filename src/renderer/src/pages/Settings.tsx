import { useState, useEffect } from 'react'
import {
  Settings as SettingsIcon,
  Sparkles,
  Trophy,
  Gamepad2,
  CloudUpload,
  FolderOpen,
  RefreshCw,
  Download,
  Check,
  AlertTriangle,
  Clock,
  Shield,
  Cloud,
  LogIn,
  LogOut,
  Puzzle
} from 'lucide-react'
import { useGlobal } from '../context/GlobalContext'

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
  } = useGlobal()

  const [backupFolder, setBackupFolder] = useState<string>('')
  const [backupInfo, setBackupInfo] = useState<{
    folder: string
    lastBackup: string | null
    count: number
  } | null>(null)
  const [backupStatus, setBackupStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle')
  const [restoreStatus, setRestoreStatus] = useState<'idle' | 'restoring' | 'success' | 'error'>(
    'idle'
  )
  const [statusMessage, setStatusMessage] = useState('')
  const [discordRpcEnabled, setDiscordRpcEnabled] = useState(true)

  // Google Drive
  const [driveConnected, setDriveConnected] = useState(false)
  const [driveEmail, setDriveEmail] = useState('')
  const [driveStatus, setDriveStatus] = useState<
    'idle' | 'connecting' | 'backing_up' | 'restoring' | 'success' | 'error'
  >('idle')
  const [driveMessage, setDriveMessage] = useState('')
  const [lastCloudBackup, setLastCloudBackup] = useState<string | null>(null)
  const [discordStatus, setDiscordStatus] = useState<{ connected: boolean; initialized: boolean }>({
    connected: false,
    initialized: false
  })
  const [appVersion, setAppVersion] = useState<string>('Loading...')
  const [plugins, setPlugins] = useState<any[]>([])
  const [pluginStatus, setPluginStatus] = useState<string>('')

  const { updateStatus, updateProgress, appTheme, changeTheme } = useGlobal()

  useEffect(() => {
    window.api.getAppVersion().then(setAppVersion)
    window.api.getLoadedPlugins().then(setPlugins)
    window.api.getSetting('backup_folder').then((val) => {
      if (val) setBackupFolder(val)
    })
    window.api.getBackupInfo().then(setBackupInfo)
    window.api.checkDriveConnection().then((res) => {
      setDriveConnected(res.connected)
      if (res.email) setDriveEmail(res.email)
    })
    window.api.getSetting('last_cloud_backup').then((val) => {
      if (val) setLastCloudBackup(val)
    })
    window.api.getSetting('discord_rpc').then((val) => {
      setDiscordRpcEnabled(val !== 'false')
    })

    const interval = setInterval(() => {
      window.api.checkDiscordStatus().then(setDiscordStatus)
    }, 5000)
    window.api.checkDiscordStatus().then(setDiscordStatus)

    const removeListener = window.api.onSettingUpdated((data: { key: string; value: string }) => {
      if (data.key === 'discord_rpc') {
        setDiscordRpcEnabled(data.value === 'true' || data.value === (true as unknown as string))
      }
    })

    return () => {
      clearInterval(interval)
      if (removeListener) removeListener()
    }
  }, [])

  const handleBrowseFolder = async () => {
    const folder = await window.api.browseBackupFolder()
    if (folder) {
      setBackupFolder(folder)
      await window.api.saveSetting('backup_folder', folder)
      const info = await window.api.getBackupInfo()
      setBackupInfo(info)
    }
  }

  const handleManualBackup = async () => {
    setBackupStatus('saving')
    const result = await window.api.manualBackup()
    if (result.success) {
      setBackupStatus('success')
      setStatusMessage(result.message)
      const info = await window.api.getBackupInfo()
      setBackupInfo(info)
    } else {
      setBackupStatus('error')
      setStatusMessage(result.message)
    }
    setTimeout(() => setBackupStatus('idle'), 3000)
  }

  const handleRestore = async () => {
    setRestoreStatus('restoring')
    const result = await window.api.restoreBackup()
    if (result.success) {
      setRestoreStatus('success')
      setStatusMessage(result.message)
    } else {
      setRestoreStatus('error')
      setStatusMessage(result.message)
    }
    setTimeout(() => setRestoreStatus('idle'), 4000)
  }

  const togglePlugin = async (name: string, enabled: boolean) => {
    await window.api.togglePlugin(name, enabled)
    const updated = await window.api.getLoadedPlugins()
    setPlugins(updated)
  }

  const reloadPlugins = async () => {
    setPluginStatus('Reloading...')
    await window.api.reloadPlugins()
    const updated = await window.api.getLoadedPlugins()
    setPlugins(updated)
    setPluginStatus('Reloaded successfully!')
    setTimeout(() => setPluginStatus(''), 3000)
  }

  const openPluginsFolder = () => {
    window.api.openPluginsFolder()
  }

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return (
      d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
      ' at ' +
      d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    )
  }

  return (
    <div className="flex-1 overflow-y-auto px-10 pb-12 pt-10 relative custom-scrollbar">
      <h1 className="text-[34px] font-extrabold text-white mb-10 flex items-center gap-4 tracking-tight leading-none">
        Settings
      </h1>

      <div className="max-w-3xl space-y-8">
        {/* General Settings */}
        <div className="bg-[#121620] border border-slate-700/60 rounded-3xl p-8 shadow-xl">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3 pb-4 border-b border-slate-700/50">
            <SettingsIcon size={22} className="text-primary-400" />
            General Settings
          </h2>

          <div className="space-y-8">
            <div className="flex flex-col gap-4 max-w-md">
              <div>
                <label className="text-sm font-semibold text-slate-300 block mb-1">
                  Cinematic Background Mode
                </label>
                <p className="text-xs text-slate-500 mb-3">
                  Choose whether the cinematic modal plays a live YouTube trailer or shows a
                  high-res image.
                </p>
              </div>

              <div className="flex bg-slate-800/50 p-1.5 rounded-xl border border-slate-700/50">
                <button
                  onClick={() => {
                    setBgMode('video')
                    localStorage.setItem('bgMode', 'video')
                  }}
                  className={`flex-1 py-3 text-sm font-semibold rounded-lg transition ${bgMode === 'video' ? 'bg-primary-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Live Video Trailer
                </button>
                <button
                  onClick={() => {
                    setBgMode('image')
                    localStorage.setItem('bgMode', 'image')
                  }}
                  className={`flex-1 py-3 text-sm font-semibold rounded-lg transition ${bgMode === 'image' ? 'bg-primary-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  High-Res Image
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-4 max-w-md pt-6 border-t border-slate-700/50">
              <div>
                <label className="text-sm font-semibold text-slate-300 block mb-1">
                  Default Video Sound
                </label>
                <p className="text-xs text-slate-500 mb-3">
                  Choose whether background trailers start with sound on or muted by default.
                </p>
              </div>

              <div className="flex bg-slate-800/50 p-1.5 rounded-xl border border-slate-700/50">
                <button
                  onClick={() => {
                    setDefaultMuted(false)
                    localStorage.setItem('defaultMuted', 'false')
                  }}
                  className={`flex-1 py-3 text-sm font-semibold rounded-lg transition ${!defaultMuted ? 'bg-primary-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Sound On
                </button>
                <button
                  onClick={() => {
                    setDefaultMuted(true)
                    localStorage.setItem('defaultMuted', 'true')
                  }}
                  className={`flex-1 py-3 text-sm font-semibold rounded-lg transition ${defaultMuted ? 'bg-primary-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Muted
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-6 pt-6 border-t border-slate-700/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${discordRpcEnabled ? 'bg-[#5865F2]/20 text-[#5865F2]' : 'bg-slate-800 text-slate-500'}`}
                  >
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                      <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2758-3.68-.2758-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1971.3728.2914a.077.077 0 01-.0066.1277 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z" />
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-bold text-white uppercase tracking-wider">
                        Discord RPC
                      </label>
                      {discordRpcEnabled && (
                        <span
                          className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter border ${
                            discordStatus.connected
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                              : 'bg-red-500/10 border-red-500/30 text-red-400'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${discordStatus.connected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`}
                          ></span>
                          {discordStatus.connected ? 'Active' : 'Offline'}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Show library stats and current game on your profile.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={async () => {
                      const newValue = !discordRpcEnabled
                      setDiscordRpcEnabled(newValue)
                      await window.api.saveSetting('discord_rpc', String(newValue))
                      await window.api.updateDiscordRpc(newValue)
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 ${discordRpcEnabled ? 'bg-[#5865F2]' : 'bg-slate-700'}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${discordRpcEnabled ? 'translate-x-6' : 'translate-x-1'}`}
                    />
                  </button>
                </div>
              </div>

              {discordRpcEnabled && !discordStatus.connected && (
                <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-4 flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center gap-3">
                    <AlertTriangle size={16} className="text-amber-400 shrink-0" />
                    <p className="text-[11px] text-slate-400 leading-tight">
                      Discord connection failed. Make sure the Discord app is running on your
                      desktop.
                    </p>
                  </div>
                  <button
                    onClick={async () => {
                      await window.api.updateDiscordRpc(true)
                    }}
                    className="shrink-0 flex items-center gap-1.5 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all border border-slate-600/50 hover:scale-105 active:scale-95"
                  >
                    <RefreshCw
                      size={12}
                      className={
                        discordStatus.initialized && !discordStatus.connected ? 'animate-spin' : ''
                      }
                    />
                    Retry Connection
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Offline Folder Backup */}
        <div className="bg-[#121620] border border-slate-700/60 rounded-3xl p-8 shadow-xl relative overflow-hidden">
          <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-3">
            <Shield size={22} className="text-emerald-400" />
            Offline Folder Backup
          </h2>
          <p className="text-slate-400 text-sm mb-6 pb-4 border-b border-slate-700/50">
            Use a synced folder (Google Drive, Dropbox, OneDrive) for passive cloud sync.
          </p>

          <div className="space-y-6">
            {/* Folder Picker */}
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Backup Folder
              </label>
              <div className="flex gap-3">
                <div className="flex-1 bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-sm text-slate-300 flex items-center gap-3 overflow-hidden">
                  <FolderOpen size={18} className="text-emerald-400 shrink-0" />
                  <span className="truncate">{backupFolder || 'No folder selected'}</span>
                </div>
                <button
                  onClick={handleBrowseFolder}
                  className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition shadow-lg"
                >
                  Browse
                </button>
              </div>
              <p className="text-[11px] text-slate-500 mt-2 ml-1">
                Tip: Choose a folder inside Google Drive, Dropbox, or OneDrive to automatically sync
                backups to the cloud.
              </p>
            </div>

            {/* Backup Status Dashboard */}
            {backupInfo && (
              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                    <CloudUpload size={24} className="text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white flex items-center gap-2">
                      Auto-Backup Active
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    </div>
                    <div className="text-xs text-slate-400 mt-1 flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Clock size={12} />{' '}
                        {backupInfo.lastBackup
                          ? formatDate(backupInfo.lastBackup)
                          : 'No backup yet'}
                      </span>
                      <span className="text-slate-600">•</span>
                      <span>
                        {backupInfo.count} snapshot{backupInfo.count !== 1 ? 's' : ''} saved
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleManualBackup}
                disabled={!backupFolder || backupStatus === 'saving'}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 font-bold text-sm rounded-xl border border-emerald-500/30 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {backupStatus === 'saving' ? (
                  <RefreshCw size={16} className="animate-spin" />
                ) : backupStatus === 'success' ? (
                  <Check size={16} />
                ) : (
                  <CloudUpload size={16} />
                )}
                {backupStatus === 'saving'
                  ? 'Backing up...'
                  : backupStatus === 'success'
                    ? 'Backup Saved!'
                    : 'Backup Now'}
              </button>
              <button
                onClick={handleRestore}
                disabled={restoreStatus === 'restoring'}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 bg-amber-600/10 hover:bg-amber-600/20 text-amber-400 font-bold text-sm rounded-xl border border-amber-500/30 transition disabled:opacity-40"
              >
                {restoreStatus === 'restoring' ? (
                  <RefreshCw size={16} className="animate-spin" />
                ) : restoreStatus === 'success' ? (
                  <Check size={16} />
                ) : (
                  <Download size={16} />
                )}
                {restoreStatus === 'restoring'
                  ? 'Restoring...'
                  : restoreStatus === 'success'
                    ? 'Restored! Restart App'
                    : 'Restore from Backup'}
              </button>
            </div>

            {/* Status Feedback */}
            {(backupStatus === 'success' ||
              backupStatus === 'error' ||
              restoreStatus === 'success' ||
              restoreStatus === 'error') && (
              <div
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${
                  backupStatus === 'success' || restoreStatus === 'success'
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                    : 'bg-red-500/10 border border-red-500/30 text-red-400'
                }`}
              >
                {backupStatus === 'success' || restoreStatus === 'success' ? (
                  <Check size={16} />
                ) : (
                  <AlertTriangle size={16} />
                )}
                {statusMessage}
              </div>
            )}

            {/* Disconnect */}
            {backupFolder && (
              <button
                onClick={async () => {
                  setBackupFolder('')
                  setBackupInfo(null)
                  await window.api.saveSetting('backup_folder', '')
                }}
                className="text-xs text-slate-500 hover:text-red-400 transition ml-1"
              >
                Disconnect backup folder
              </button>
            )}
          </div>
        </div>

        {/* Google Drive API */}
        <div className="bg-[#121620] border border-slate-700/60 rounded-3xl p-8 shadow-xl relative overflow-hidden">
          <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-3">
            <Cloud size={22} className="text-blue-400" />
            Google Drive
          </h2>
          <p className="text-slate-400 text-sm mb-6 pb-4 border-b border-slate-700/50">
            Securely back up your entire library directly to your Google account. One click to
            connect, fully automatic.
          </p>

          <div className="space-y-6">
            {/* Connection State */}
            {driveConnected ? (
              <>
                <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                      <Check size={24} className="text-emerald-400" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white flex items-center gap-2">
                        Connected to Google Drive
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{driveEmail}</p>
                      {lastCloudBackup && (
                        <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                          <Clock size={10} /> Last backup: {formatDate(lastCloudBackup)}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      await window.api.disconnectDrive()
                      setDriveConnected(false)
                      setDriveEmail('')
                    }}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-red-400 hover:bg-red-500/10 rounded-lg transition"
                  >
                    <LogOut size={14} /> Disconnect
                  </button>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={async () => {
                      setDriveStatus('backing_up')
                      const result = await window.api.backupToDrive()
                      setDriveStatus(result.success ? 'success' : 'error')
                      setDriveMessage(result.message)
                      if (result.success) setLastCloudBackup(new Date().toISOString())
                      setTimeout(() => setDriveStatus('idle'), 3000)
                    }}
                    disabled={driveStatus === 'backing_up'}
                    className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 font-bold text-sm rounded-xl border border-blue-500/30 transition disabled:opacity-40"
                  >
                    {driveStatus === 'backing_up' ? (
                      <RefreshCw size={16} className="animate-spin" />
                    ) : (
                      <CloudUpload size={16} />
                    )}
                    {driveStatus === 'backing_up' ? 'Uploading...' : 'Backup to Cloud'}
                  </button>
                  <button
                    onClick={async () => {
                      setDriveStatus('restoring')
                      const result = await window.api.restoreFromDrive()
                      setDriveStatus(result.success ? 'success' : 'error')
                      setDriveMessage(result.message)
                      setTimeout(() => setDriveStatus('idle'), 4000)
                    }}
                    disabled={driveStatus === 'restoring'}
                    className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 bg-amber-600/10 hover:bg-amber-600/20 text-amber-400 font-bold text-sm rounded-xl border border-amber-500/30 transition disabled:opacity-40"
                  >
                    {driveStatus === 'restoring' ? (
                      <RefreshCw size={16} className="animate-spin" />
                    ) : (
                      <Download size={16} />
                    )}
                    {driveStatus === 'restoring' ? 'Downloading...' : 'Restore from Cloud'}
                  </button>
                </div>
              </>
            ) : (
              <button
                onClick={async () => {
                  setDriveStatus('connecting')
                  setDriveMessage('')
                  const result = await window.api.googleDriveAuth()
                  if (result.success) {
                    setDriveStatus('success')
                    setDriveMessage(result.message)
                    const conn = await window.api.checkDriveConnection()
                    setDriveConnected(conn.connected)
                    if (conn.email) setDriveEmail(conn.email)
                  } else {
                    setDriveStatus('error')
                    setDriveMessage(result.message)
                  }
                  setTimeout(() => setDriveStatus('idle'), 3000)
                }}
                disabled={driveStatus === 'connecting'}
                className="w-full flex items-center justify-center gap-3 px-6 py-5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-base rounded-2xl transition shadow-[0_0_30px_rgba(59,130,246,0.25)] hover:shadow-[0_0_40px_rgba(59,130,246,0.4)] disabled:opacity-50"
              >
                {driveStatus === 'connecting' ? (
                  <RefreshCw size={20} className="animate-spin" />
                ) : (
                  <LogIn size={20} />
                )}
                {driveStatus === 'connecting'
                  ? 'Opening Google Sign-In...'
                  : 'Connect Google Drive'}
              </button>
            )}

            {/* Drive Status Feedback */}
            {(driveStatus === 'success' || driveStatus === 'error') && (
              <div
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${
                  driveStatus === 'success'
                    ? 'bg-blue-500/10 border border-blue-500/30 text-blue-400'
                    : 'bg-red-500/10 border border-red-500/30 text-red-400'
                }`}
              >
                {driveStatus === 'success' ? <Check size={16} /> : <AlertTriangle size={16} />}
                {driveMessage}
              </div>
            )}
          </div>
        </div>

        {/* API Keys */}
        <div className="bg-[#121620] border border-slate-700/60 rounded-3xl p-8 shadow-xl">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3 pb-4 border-b border-slate-700/50">
            🔑 API Keys
          </h2>

          <div className="space-y-8">
            <div className="flex flex-col gap-4 max-w-md">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles size={18} className="text-secondary-400" />
                <label className="text-sm font-semibold text-slate-300 block">Gemini API Key</label>
              </div>
              <p className="text-xs text-slate-500 mb-1">
                Required for AI Vision imports. Your key is stored securely in your local database.
              </p>

              <input
                type="password"
                value={geminiKey}
                onChange={(e) => {
                  setGeminiKey(e.target.value)
                  window.api.saveSetting('geminiKey', e.target.value)
                }}
                placeholder="Enter Gemini API Key..."
                className="w-full bg-slate-800/50 border border-slate-700/50 text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-secondary-500/50 text-slate-200 placeholder-slate-600 transition"
              />
            </div>

            <div className="flex flex-col gap-4 max-w-md pt-6 border-t border-slate-700/50">
              <div className="flex items-center gap-2 mb-1">
                <Trophy size={18} className="text-yellow-400" />
                <label className="text-sm font-semibold text-slate-300 block">
                  RAWG.io API Key
                </label>
              </div>
              <p className="text-xs text-slate-500 mb-1">
                Required for the Global Rankings page. Get a free key at rawg.io/apidocs.
              </p>

              <input
                type="password"
                value={rawgKey}
                onChange={(e) => {
                  setRawgKey(e.target.value)
                  window.api.saveSetting('rawg_key', e.target.value)
                }}
                placeholder="Enter RAWG.io API Key..."
                className="w-full bg-slate-800/50 border border-slate-700/50 text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-yellow-500/50 text-slate-200 placeholder-slate-600 transition"
              />
            </div>

            <div className="flex flex-col gap-4 max-w-md pt-6 border-t border-slate-700/50">
              <div className="flex items-center gap-2 mb-1">
                <Gamepad2 size={18} className="text-primary-400" />
                <label className="text-sm font-semibold text-slate-300 block">
                  IGDB (Twitch) API Integration
                </label>
              </div>
              <p className="text-xs text-slate-500 mb-1">
                Required for game search and cinematic details. Create an app at dev.twitch.tv.
              </p>

              <div className="space-y-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1.5 ml-1">
                    Client ID
                  </span>
                  <input
                    type="password"
                    value={igdbClientId}
                    onChange={(e) => {
                      setIgdbClientId(e.target.value)
                      window.api.saveSetting('igdb_client_id', e.target.value)
                    }}
                    placeholder="Enter IGDB Client ID..."
                    className="w-full bg-slate-800/50 border border-slate-700/50 text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-primary-500/50 text-slate-200 placeholder-slate-600 transition"
                  />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1.5 ml-1">
                    Client Secret
                  </span>
                  <input
                    type="password"
                    value={igdbClientSecret}
                    onChange={(e) => {
                      setIgdbClientSecret(e.target.value)
                      window.api.saveSetting('igdb_client_secret', e.target.value)
                    }}
                    placeholder="Enter IGDB Client Secret..."
                    className="w-full bg-slate-800/50 border border-slate-700/50 text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-primary-500/50 text-slate-200 placeholder-slate-600 transition"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Extensions & Plugins */}
        <div className="bg-[#121620] border border-slate-700/60 rounded-3xl p-8 shadow-xl">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-700/50">
            <h2 className="text-xl font-bold text-white flex items-center gap-3">
              <Puzzle size={22} className="text-purple-400" />
              Extensions & Plugins
            </h2>
            <div className="flex gap-3">
              <button
                onClick={openPluginsFolder}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700/50 transition flex items-center gap-2"
              >
                <FolderOpen size={14} /> Open Folder
              </button>
              <button
                onClick={reloadPlugins}
                className="px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 font-bold text-xs rounded-xl border border-purple-500/30 transition flex items-center gap-2"
              >
                <RefreshCw size={14} className={pluginStatus === 'Reloading...' ? 'animate-spin' : ''} />
                Reload Engine
              </button>
            </div>
          </div>
          
          {pluginStatus && (
            <div className="mb-4 text-xs font-semibold text-purple-400 animate-in fade-in flex items-center gap-2">
              <Check size={14} /> {pluginStatus}
            </div>
          )}

          <div className="space-y-4">
            {plugins.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-sm border border-dashed border-slate-700/50 rounded-2xl bg-slate-800/20">
                No plugins found. Drop .js files in the plugins folder and click Reload Engine.
              </div>
            ) : (
              plugins.map((plugin, idx) => (
                <div key={idx} className="flex items-center justify-between bg-slate-800/30 border border-slate-700/50 p-4 rounded-2xl">
                  <div>
                    <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                      {plugin.name} 
                      <span className="text-[10px] bg-slate-700 px-2 py-0.5 rounded-full text-slate-400 font-mono tracking-wider">v{plugin.version}</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">By {plugin.author}</p>
                    <p className="text-[10px] text-slate-600 mt-1 font-mono truncate max-w-sm">{plugin.path}</p>
                  </div>
                  <button
                    onClick={() => togglePlugin(plugin.name, !plugin.enabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 ${plugin.enabled ? 'bg-purple-500' : 'bg-slate-700'}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${plugin.enabled ? 'translate-x-6' : 'translate-x-1'}`}
                    />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Appearance & Theming */}
        <div className="bg-[#121620] border border-slate-700/60 rounded-3xl p-8 shadow-xl">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3 pb-4 border-b border-slate-700/50">
            🎨 Appearance & Theming
          </h2>
          <div className="flex items-center gap-6">
            {[
              {
                id: 'default',
                bg: 'bg-gradient-to-br from-indigo-500 to-purple-500',
                name: 'Default'
              },
              {
                id: 'cyberpunk',
                bg: 'bg-gradient-to-br from-yellow-500 to-amber-500',
                name: 'Cyberpunk'
              },
              {
                id: 'matrix',
                bg: 'bg-gradient-to-br from-emerald-500 to-teal-500',
                name: 'Matrix'
              },
              { id: 'sith', bg: 'bg-gradient-to-br from-rose-500 to-red-500', name: 'Sith' }
            ].map((theme) => (
              <div key={theme.id} className="flex flex-col items-center gap-2">
                <button
                  onClick={() => changeTheme(theme.id)}
                  title={theme.name}
                  className={`w-12 h-12 rounded-full cursor-pointer hover:scale-110 transition-all ${theme.bg} ${
                    appTheme === theme.id
                      ? 'ring-4 ring-white/50 shadow-[0_0_20px_rgba(255,255,255,0.5)]'
                      : 'border-2 border-transparent hover:border-white/20'
                  }`}
                />
                <span className="text-xs font-bold text-slate-400">{theme.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* App Updates */}
        <div className="bg-[#121620] border border-slate-700/60 rounded-3xl p-8 shadow-xl">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3 pb-4 border-b border-slate-700/50">
            <RefreshCw size={24} className="text-emerald-400" />
            App Updates
          </h2>
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-sm font-bold text-slate-300 block mb-1">Current Version</span>
                <span className="text-xs text-slate-500 font-mono">v{appVersion}</span>
              </div>

              {updateStatus === 'idle' && (
                <button
                  onClick={() => window.api.checkForUpdates()}
                  className="px-6 py-3 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 font-bold text-sm rounded-xl border border-emerald-500/30 transition"
                >
                  Check for Updates
                </button>
              )}

              {updateStatus === 'downloading' && (
                <div className="w-64">
                  <div className="flex justify-between text-xs text-emerald-400 font-bold mb-1">
                    <span>Downloading...</span>
                    <span>{Math.round(updateProgress)}%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2">
                    <div
                      className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${updateProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {updateStatus === 'ready' && (
                <button
                  onClick={() => window.api.installUpdate()}
                  className="px-6 py-3 bg-emerald-500 text-white font-bold text-sm rounded-xl hover:bg-emerald-400 transition shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                >
                  Restart & Install
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings
