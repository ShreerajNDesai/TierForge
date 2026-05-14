import fs from 'fs';
import path from 'path';
import https from 'https';
import os from 'os';
import AdmZip from 'adm-zip';

const MANIFEST_URL = 'https://raw.githubusercontent.com/mtkennerly/ludusavi-manifest/master/data/manifest.json';
let manifestCache: any = null;

// Parse paths replacing variables
export function resolveWindowsPath(rawPath: string): string {
  let resolved = rawPath;
  const userProfile = process.env.USERPROFILE || os.homedir();
  const localAppData = process.env.LOCALAPPDATA || path.join(userProfile, 'AppData', 'Local');
  const appData = process.env.APPDATA || path.join(userProfile, 'AppData', 'Roaming');
  const homeDrive = process.env.HOMEDRIVE || 'C:';
  const osUserName = os.userInfo().username;

  resolved = resolved.replace(/%USERPROFILE%/gi, userProfile);
  resolved = resolved.replace(/%LOCALAPPDATA%/gi, localAppData);
  resolved = resolved.replace(/%APPDATA%/gi, appData);
  resolved = resolved.replace(/<home>/gi, userProfile);
  resolved = resolved.replace(/<osUserName>/gi, osUserName);
  resolved = resolved.replace(/<winAppData>/gi, appData);
  resolved = resolved.replace(/<winLocalAppData>/gi, localAppData);
  resolved = resolved.replace(/<winPublic>/gi, path.join(homeDrive, '\\Users\\Public'));
  resolved = resolved.replace(/<winDocuments>/gi, path.join(userProfile, 'Documents'));
  resolved = resolved.replace(/<winVideo>/gi, path.join(userProfile, 'Videos'));

  return resolved.replace(/\//g, '\\');
}

export async function fetchLudusaviManifest() {
  if (manifestCache) return manifestCache;
  
  return new Promise((resolve, reject) => {
    https.get(MANIFEST_URL, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          manifestCache = JSON.parse(data);
          resolve(manifestCache);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

export async function findGameSavePath(gameTitle: string): Promise<string | null> {
  try {
    const manifest: any = await fetchLudusaviManifest();
    
    let gameData = manifest[gameTitle];
    if (!gameData) {
      const key = Object.keys(manifest).find(k => k.toLowerCase() === gameTitle.toLowerCase());
      if (key) gameData = manifest[key];
    }

    if (!gameData || !gameData.files) return null;

    for (const key of Object.keys(gameData.files)) {
      const rawPath = key;
      if (rawPath.toLowerCase().includes('<win') || rawPath.toLowerCase().includes('%') || rawPath.toLowerCase().includes('<home>')) {
        return resolveWindowsPath(rawPath);
      }
    }

    return null;
  } catch (error) {
    console.error('Ludusavi resolution error', error);
    return null;
  }
}

export async function backupGameSave(gameTitle: string, customPath: string, getToken: () => Promise<string | null>) {
  try {
    console.log(`Starting backup for ${gameTitle}`);
    
    let savePath = customPath;
    if (!savePath || savePath.trim() === '') {
      savePath = await findGameSavePath(gameTitle) || '';
    }

    if (!savePath) {
      console.log(`No save path found for ${gameTitle}`);
      return false;
    }

    if (savePath.includes('<StoreUserId>')) {
        savePath = savePath.split('<StoreUserId>')[0];
    }
    
    if (!fs.existsSync(savePath)) {
      console.log(`Save path does not exist: ${savePath}`);
      return false;
    }

    const token = await getToken();
    if (!token) {
      console.log('No Google Drive token available. Skipping cloud backup.');
      return false;
    }

    const tempZipPath = path.join(os.tmpdir(), `${gameTitle.replace(/[^a-z0-9]/gi, '_')}_Save.zip`);
    
    try {
      const zip = new AdmZip();
      const stat = fs.statSync(savePath);
      if (stat.isDirectory()) {
        zip.addLocalFolder(savePath);
      } else {
        zip.addLocalFile(savePath);
      }
      zip.writeZip(tempZipPath);
    } catch (e) {
      console.error('adm-zip error:', e);
      return false;
    }

    console.log(`Zipped to ${tempZipPath}`);

    // Google Drive Upload Logic
    const fileName = path.basename(tempZipPath);
    const folderName = 'TierForge Cloud Saves';

    // 1. Find or create the TierForge Cloud Saves folder
    let folderId = null;
    const folderSearchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=name='${folderName}'+and+mimeType='application/vnd.google-apps.folder'+and+trashed=false&fields=files(id)`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const folderSearchData = await folderSearchRes.json();
    
    if (folderSearchData.files && folderSearchData.files.length > 0) {
      folderId = folderSearchData.files[0].id;
    } else {
      const createFolderRes = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: folderName, mimeType: 'application/vnd.google-apps.folder' })
      });
      const createFolderData = await createFolderRes.json();
      folderId = createFolderData.id;
    }

    // 2. Check if the backup zip already exists in this folder
    const fileSearchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=name='${fileName}'+and+'${folderId}'+in+parents+and+trashed=false&fields=files(id)`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const fileSearchData = await fileSearchRes.json();
    const existingFile = fileSearchData.files && fileSearchData.files.length > 0 ? fileSearchData.files[0] : null;

    const fileBuffer = fs.readFileSync(tempZipPath);

    if (existingFile) {
      // Overwrite existing file
      await fetch(`https://www.googleapis.com/upload/drive/v3/files/${existingFile.id}?uploadType=media`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/zip' },
        body: fileBuffer
      });
    } else {
      // Create new file
      const metadata = JSON.stringify({ name: fileName, parents: [folderId] });
      const boundary = '---tierforge_boundary';
      const body = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n--${boundary}\r\nContent-Type: application/zip\r\n\r\n`;
      const ending = `\r\n--${boundary}--`;
      const bodyBuffer = Buffer.concat([Buffer.from(body), fileBuffer, Buffer.from(ending)]);
      
      await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': `multipart/related; boundary=${boundary}` },
        body: bodyBuffer
      });
    }

    fs.unlinkSync(tempZipPath);
    console.log(`Backup completed for ${gameTitle}`);
    return true;
  } catch (error) {
    console.error(`Backup failed for ${gameTitle}`, error);
    return false;
  }
}
