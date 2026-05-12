import { Client } from 'discord-rpc';

// Using a placeholder/default Discord Client ID
// (Developers should ideally replace this with their own from Discord Developer Portal)
const clientId = '1503747419811221604'; // Replace with a real Discord Client ID
let rpc: Client | null = null;
let rpcReady = false;

export function initDiscord() {
  if (rpc) return;

  rpc = new Client({ transport: 'ipc' });

  rpc.on('ready', () => {
    rpcReady = true;
    console.log('Discord RPC ready!');
  });

  rpc.login({ clientId }).catch((err) => {
    console.log('Failed to connect to Discord RPC (Discord might be closed):', err.message);
    rpc = null;
  });
}

export function setBrowsingStatus(gameCount: number) {
  if (!rpc || !rpcReady) return;

  rpc.setActivity({
    details: 'Organizing Library',
    state: `${gameCount} Games`,
    startTimestamp: new Date(),
    largeImageKey: 'icon', // Requires an asset named 'icon' uploaded to Discord Developer Portal
    largeImageText: 'TierForge',
    instance: false,
  }).catch(console.error);
}

export function setPlayingStatus(gameTitle: string, startTime: number) {
  if (!rpc || !rpcReady) return;

  rpc.setActivity({
    details: `Playing ${gameTitle}`,
    startTimestamp: new Date(startTime),
    largeImageKey: 'icon',
    largeImageText: 'TierForge',
    instance: false,
  }).catch(console.error);
}

export function disconnectDiscord() {
  if (!rpc) return;
  
  try {
    if (rpcReady) {
      rpc.clearActivity().catch(() => {});
    }
    rpc.destroy().catch(() => {});
  } catch (err) {
    // Ignore destruction errors
  }
  
  rpc = null;
  rpcReady = false;
  console.log('Discord RPC disconnected.');
}

export function getDiscordStatus() {
  return {
    connected: rpc !== null && rpcReady,
    initialized: rpc !== null
  };
}
