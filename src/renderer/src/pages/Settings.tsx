import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Sparkles, Trophy, Gamepad2, CloudUpload, FolderOpen, RefreshCw, Download, Check, AlertTriangle, Clock, Shield, Cloud, LogIn, LogOut } from 'lucide-react';
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

  const [backupFolder, setBackupFolder] = useState<string>('');
  const [backupInfo, setBackupInfo] = useState<{ folder: string; lastBackup: string | null; count: number } | null>(null);
  const [backupStatus, setBackupStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [restoreStatus, setRestoreStatus] = useState<'idle' | 'restoring' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  // Google Drive
  const [driveConnected, setDriveConnected] = useState(false);
  const [driveEmail, setDriveEmail] = useState('');
  const [driveStatus, setDriveStatus] = useState<'idle' | 'connecting' | 'backing_up' | 'restoring' | 'success' | 'error'>('idle');
  const [driveMessage, setDriveMessage] = useState('');

  useEffect(() => {
    window.api.getSetting('backup_folder').then((val) => {
      if (val) setBackupFolder(val);
    });
    window.api.getBackupInfo().then(setBackupInfo);
    window.api.checkDriveConnection().then((res) => {
      setDriveConnected(res.connected);
      if (res.email) setDriveEmail(res.email);
    });
  }, []);

  const handleBrowseFolder = async () => {
    const folder = await window.api.browseBackupFolder();
    if (folder) {
      setBackupFolder(folder);
      await window.api.saveSetting('backup_folder', folder);
      const info = await window.api.getBackupInfo();
      setBackupInfo(info);
    }
  };

  const handleManualBackup = async () => {
    setBackupStatus('saving');
    const result = await window.api.manualBackup();
    if (result.success) {
      setBackupStatus('success');
      setStatusMessage(result.message);
      const info = await window.api.getBackupInfo();
      setBackupInfo(info);
    } else {
      setBackupStatus('error');
      setStatusMessage(result.message);
    }
    setTimeout(() => setBackupStatus('idle'), 3000);
  };

  const handleRestore = async () => {
    setRestoreStatus('restoring');
    const result = await window.api.restoreBackup();
    if (result.success) {
      setRestoreStatus('success');
      setStatusMessage(result.message);
    } else {
      setRestoreStatus('error');
      setStatusMessage(result.message);
    }
    setTimeout(() => setRestoreStatus('idle'), 4000);
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' at ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex-1 overflow-y-auto px-10 pb-12 pt-10 relative custom-scrollbar">
      <h1 className="text-[34px] font-extrabold text-white mb-10 flex items-center gap-4 tracking-tight leading-none">
        Settings
      </h1>
      
      <div className="max-w-3xl space-y-8">

        {/* General Settings */}
        <div className="bg-[#121620] border border-slate-700/60 rounded-3xl p-8 shadow-xl">
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
          </div>
        </div>

        {/* Offline Folder Backup */}
        <div className="bg-[#121620] border border-emerald-500/20 rounded-3xl p-8 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-500"></div>
          
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
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Backup Folder</label>
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
                Tip: Choose a folder inside Google Drive, Dropbox, or OneDrive to automatically sync backups to the cloud.
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
                      <span className="flex items-center gap-1"><Clock size={12} /> {backupInfo.lastBackup ? formatDate(backupInfo.lastBackup) : 'No backup yet'}</span>
                      <span className="text-slate-600">•</span>
                      <span>{backupInfo.count} snapshot{backupInfo.count !== 1 ? 's' : ''} saved</span>
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
                {backupStatus === 'saving' ? <RefreshCw size={16} className="animate-spin" /> : 
                 backupStatus === 'success' ? <Check size={16} /> : <CloudUpload size={16} />}
                {backupStatus === 'saving' ? 'Backing up...' : 
                 backupStatus === 'success' ? 'Backup Saved!' : 'Backup Now'}
              </button>
              <button
                onClick={handleRestore}
                disabled={restoreStatus === 'restoring'}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 bg-amber-600/10 hover:bg-amber-600/20 text-amber-400 font-bold text-sm rounded-xl border border-amber-500/30 transition disabled:opacity-40"
              >
                {restoreStatus === 'restoring' ? <RefreshCw size={16} className="animate-spin" /> :
                 restoreStatus === 'success' ? <Check size={16} /> : <Download size={16} />}
                {restoreStatus === 'restoring' ? 'Restoring...' :
                 restoreStatus === 'success' ? 'Restored! Restart App' : 'Restore from Backup'}
              </button>
            </div>

            {/* Status Feedback */}
            {(backupStatus === 'success' || backupStatus === 'error' || restoreStatus === 'success' || restoreStatus === 'error') && (
              <div className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${
                (backupStatus === 'success' || restoreStatus === 'success') 
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' 
                  : 'bg-red-500/10 border border-red-500/30 text-red-400'
              }`}>
                {(backupStatus === 'success' || restoreStatus === 'success') ? <Check size={16} /> : <AlertTriangle size={16} />}
                {statusMessage}
              </div>
            )}

            {/* Disconnect */}
            {backupFolder && (
              <button
                onClick={async () => {
                  setBackupFolder('');
                  setBackupInfo(null);
                  await window.api.saveSetting('backup_folder', '');
                }}
                className="text-xs text-slate-500 hover:text-red-400 transition ml-1"
              >
                Disconnect backup folder
              </button>
            )}
          </div>
        </div>

        {/* Google Drive API */}
        <div className="bg-[#121620] border border-blue-500/20 rounded-3xl p-8 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-cyan-400"></div>
          
          <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-3">
            <Cloud size={22} className="text-blue-400" />
            Google Drive
          </h2>
          <p className="text-slate-400 text-sm mb-6 pb-4 border-b border-slate-700/50">
            Securely back up your entire library directly to your Google account. One click to connect, fully automatic.
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
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      await window.api.disconnectDrive();
                      setDriveConnected(false);
                      setDriveEmail('');
                    }}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-red-400 hover:bg-red-500/10 rounded-lg transition"
                  >
                    <LogOut size={14} /> Disconnect
                  </button>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={async () => {
                      setDriveStatus('backing_up');
                      const result = await window.api.backupToDrive();
                      setDriveStatus(result.success ? 'success' : 'error');
                      setDriveMessage(result.message);
                      setTimeout(() => setDriveStatus('idle'), 3000);
                    }}
                    disabled={driveStatus === 'backing_up'}
                    className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 font-bold text-sm rounded-xl border border-blue-500/30 transition disabled:opacity-40"
                  >
                    {driveStatus === 'backing_up' ? <RefreshCw size={16} className="animate-spin" /> : <CloudUpload size={16} />}
                    {driveStatus === 'backing_up' ? 'Uploading...' : 'Backup to Cloud'}
                  </button>
                  <button
                    onClick={async () => {
                      setDriveStatus('restoring');
                      const result = await window.api.restoreFromDrive();
                      setDriveStatus(result.success ? 'success' : 'error');
                      setDriveMessage(result.message);
                      setTimeout(() => setDriveStatus('idle'), 4000);
                    }}
                    disabled={driveStatus === 'restoring'}
                    className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 bg-amber-600/10 hover:bg-amber-600/20 text-amber-400 font-bold text-sm rounded-xl border border-amber-500/30 transition disabled:opacity-40"
                  >
                    {driveStatus === 'restoring' ? <RefreshCw size={16} className="animate-spin" /> : <Download size={16} />}
                    {driveStatus === 'restoring' ? 'Downloading...' : 'Restore from Cloud'}
                  </button>
                </div>
              </>
            ) : (
              <button
                onClick={async () => {
                  setDriveStatus('connecting');
                  setDriveMessage('');
                  const result = await window.api.googleDriveAuth();
                  if (result.success) {
                    setDriveStatus('success');
                    setDriveMessage(result.message);
                    const conn = await window.api.checkDriveConnection();
                    setDriveConnected(conn.connected);
                    if (conn.email) setDriveEmail(conn.email);
                  } else {
                    setDriveStatus('error');
                    setDriveMessage(result.message);
                  }
                  setTimeout(() => setDriveStatus('idle'), 3000);
                }}
                disabled={driveStatus === 'connecting'}
                className="w-full flex items-center justify-center gap-3 px-6 py-5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-base rounded-2xl transition shadow-[0_0_30px_rgba(59,130,246,0.25)] hover:shadow-[0_0_40px_rgba(59,130,246,0.4)] disabled:opacity-50"
              >
                {driveStatus === 'connecting' ? <RefreshCw size={20} className="animate-spin" /> : <LogIn size={20} />}
                {driveStatus === 'connecting' ? 'Opening Google Sign-In...' : 'Connect Google Drive'}
              </button>
            )}

            {/* Drive Status Feedback */}
            {(driveStatus === 'success' || driveStatus === 'error') && (
              <div className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${
                driveStatus === 'success' 
                  ? 'bg-blue-500/10 border border-blue-500/30 text-blue-400' 
                  : 'bg-red-500/10 border border-red-500/30 text-red-400'
              }`}>
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
    </div>
  );
};

export default Settings;
