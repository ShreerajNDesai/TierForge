import fs from 'fs';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { addGame, getSetting, getCachedRanking, updateRankingsCache, clearRankingsCache } from './database';
import { BrowserWindow } from 'electron';

const DEFAULT_CLIENT_ID = '3mejs4touc121msgxhw5mxy31medg3';
const DEFAULT_CLIENT_SECRET = 'p71goredxlcacagkigxok0vm9sx92n';

const { HowLongToBeatService } = require('howlongtobeat-ts');
const hltbService = new HowLongToBeatService();

let accessToken = '';

async function getAccessToken() {
  if (accessToken) return accessToken;
  const clientId = getSetting('igdb_client_id') || DEFAULT_CLIENT_ID;
  const clientSecret = getSetting('igdb_client_secret') || DEFAULT_CLIENT_SECRET;
  try {
    const response = await fetch('https://id.twitch.tv/oauth2/token?client_id=' + clientId + '&client_secret=' + clientSecret + '&grant_type=client_credentials', { method: 'POST' });
    const data = await response.json();
    accessToken = data.access_token;
    return accessToken;
  } catch (error) { return null; }
}

export async function searchGames(query: string) {
  try {
    const token = await getAccessToken();
    if (!token) return [];
    const cleanQuery = query.replace(/[™®©]/g, '').trim();
    const queryLower = cleanQuery.toLowerCase();
    const response = await fetch('https://api.igdb.com/v4/games', {
      method: 'POST',
      headers: { 'Client-ID': getSetting('igdb_client_id') || DEFAULT_CLIENT_ID, 'Authorization': 'Bearer ' + token, 'Accept': 'application/json' },
      body: 'search "' + cleanQuery + '"; fields name, cover.image_id, follows, rating_count; where parent_game = null; limit 20;'
    });
    const data = await response.json();
    if (!Array.isArray(data)) return [];
    const sortedData = data.sort((a: any, b: any) => {
      const aName = (a.name || '').toLowerCase();
      const bName = (b.name || '').toLowerCase();
      const aExact = aName === queryLower;
      const bExact = bName === queryLower;
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      const aPop = (a.follows || 0) + (a.rating_count || 0);
      const bPop = (b.follows || 0) + (b.rating_count || 0);
      return bPop - aPop;
    });
    return sortedData.map((game: any) => {
      let imageUrl = 'https://placehold.co/150x200/2d3748/fff?text=No+Cover';
      if (game.cover && game.cover.image_id) imageUrl = 'https://images.igdb.com/igdb/image/upload/t_1080p/' + game.cover.image_id + '.jpg';
      return { id: game.id.toString(), title: game.name, image_url: imageUrl };
    });
  } catch (error) { return []; }
}

export async function getGameExtendedDetails(gameId: string) {
  try {
    const token = await getAccessToken();
    if (!token) return null;
    const response = await fetch('https://api.igdb.com/v4/games', {
      method: 'POST',
      headers: { 'Client-ID': getSetting('igdb_client_id') || DEFAULT_CLIENT_ID, 'Authorization': 'Bearer ' + token, 'Accept': 'application/json' },
      body: 'where id = ' + gameId + '; fields rating, rating_count, summary, storyline, first_release_date, genres.name, platforms.name, screenshots.image_id, involved_companies.company.name, involved_companies.developer, involved_companies.publisher, game_modes.name, player_perspectives.name, themes.name, collection.name, collection.games.name, collection.games.cover.image_id, collection.games.first_release_date, dlcs.name, dlcs.cover.image_id, dlcs.first_release_date, expansions.name, expansions.cover.image_id, expansions.first_release_date, game_engines.name, alternative_names.name, videos.video_id, videos.name;'
    });
    const data = await response.json();
    if (!data || data.length === 0) return null;
    const game = data[0];
    const mapMiniGame = (g: any) => ({
      id: g.id.toString(), title: g.name,
      img: g.cover ? 'https://images.igdb.com/igdb/image/upload/t_cover_big/' + g.cover.image_id + '.jpg' : 'https://placehold.co/150x200/2d3748/fff?text=No+Cover',
      year: g.first_release_date ? new Date(g.first_release_date * 1000).getFullYear() : 9999
    });
    const dlcList = [...(game.dlcs || []), ...(game.expansions || [])].map(mapMiniGame).sort((a, b) => a.year - b.year);
    const seriesList = (game.collection?.games || []).map(mapMiniGame).sort((a, b) => a.year - b.year);
    let background_url = '';
    if (game.screenshots && game.screenshots.length > 0) background_url = 'https://images.igdb.com/igdb/image/upload/t_1080p/' + game.screenshots[Math.floor(Math.random() * game.screenshots.length)].image_id + '.jpg';
    const videos = game.videos ? game.videos.map((v: any) => ({ id: v.video_id, name: v.name })) : [];
    let video_id = '';
    if (videos.length > 0) { const trailer = videos.find((v: any) => v.name.toLowerCase().includes('trailer')); video_id = trailer ? trailer.id : videos[0].id; }
    return {
      summary: game.summary || 'No summary available.', storyline: game.storyline || '',
      genres: game.genres ? game.genres.map((g: any) => g.name).join(', ') : 'Unknown',
      platforms: game.platforms ? game.platforms.map((p: any) => p.name) : [],
      year: game.first_release_date ? new Date(game.first_release_date * 1000).getFullYear().toString() : 'Unknown',
      background_url, video_id, videos,
      developers: game.involved_companies ? game.involved_companies.filter((c: any) => c.developer).map((c: any) => c.company.name).join(', ') : '-',
      publishers: game.involved_companies ? game.involved_companies.filter((c: any) => c.publisher).map((c: any) => c.company.name).join(', ') : '-',
      gameModes: game.game_modes ? game.game_modes.map((m: any) => m.name).join(', ') : '-',
      perspectives: game.player_perspectives ? game.player_perspectives.map((p: any) => p.name).join(', ') : '-',
      themes: game.themes ? game.themes.map((t: any) => t.name).join(', ') : '-',
      series: game.collection ? game.collection.name : '-', seriesName: game.collection?.name || '',
      seriesList, dlcList, engines: game.game_engines ? game.game_engines.map((e: any) => e.name).join(', ') : '-',
      altNames: game.alternative_names ? game.alternative_names.map((a: any) => a.name).slice(0, 3).join(', ') : '-',
      gallery: game.screenshots ? game.screenshots.map((s: any) => 'https://images.igdb.com/igdb/image/upload/t_1080p/' + s.image_id + '.jpg') : [],
      rating: game.rating ? Math.round(game.rating) : null, ratingCount: game.rating_count || 0
    };
  } catch (error) { return null; }
}

export async function getHowLongToBeat(gameName: string) {
  try {
    const results = await hltbService.search(gameName);
    if (results && results.success && results.data && results.data.length > 0) {
      const result = results.data[0];
      return { main: Math.round(result.mainTime / 3600) || 0, extra: Math.round(result.mainExtraTime / 3600) || 0, completionist: Math.round(result.completionistTime / 3600) || 0 };
    }
    return null;
  } catch (error) { return null; }
}

// SCRAPER CONSTANTS
const IMDB_MAP: Record<string, string> = {
  overall: 'https://www.imdb.com/search/title/?title_type=video_game&num_votes=5000,&sort=user_rating,desc',
  action: 'https://www.imdb.com/search/title/?title_type=video_game&genres=action&num_votes=5000,&sort=user_rating,desc',
  adventure: 'https://www.imdb.com/search/title/?title_type=video_game&genres=adventure&num_votes=5000,&sort=user_rating,desc',
  horror: 'https://www.imdb.com/search/title/?title_type=video_game&genres=horror&num_votes=5000,&sort=user_rating,desc',
  sci_fi: 'https://www.imdb.com/search/title/?title_type=video_game&genres=sci-fi&num_votes=5000,&sort=user_rating,desc',
  family: 'https://www.imdb.com/search/title/?title_type=video_game&genres=family&num_votes=5000,&sort=user_rating,desc'
};

const STEAM_TAG_MAP: Record<string, string> = {
  'action': '19', 'action-adventure': '4106', 'action rpg': '4231', 'adventure': '21', 'artillery': '4667', 'auto battler': '1716', 'battle royale': '1769', 'beat em up': '4150', 'board game': '1738', 'card game': '1666', 'casual': '597', 'city builder': '4328', 'construction and management simulation': '12472', 'crpg': '4474', 'dungeon crawl': '1720', 'educational': '1036', 'fighting': '1743', 'fps': '1663', 'gacha': '11132', 'grand strategy': '1751', 'graphic adventure': '4342', 'hack and slash': '1646', 'hero shooter': '12140', 'hidden object': '1730', 'horror': '1667', 'idle': '1115', 'interactive movie': '4255', 'jrpg': '4434', 'life simulation': '4436', 'light gun shooter': '12057', 'mmorpg': '1754', 'moba': '1707', 'monster-taming': '12386', 'music': '1621', 'narrative': '1742', 'open world': '1695', 'party': '17428', 'physics': '3964', 'pinball': '4057', 'platformer': '1625', 'point-and-click': '1698', 'puzzle': '1664', 'puzzle-platformer': '29914', 'racing': '699', 'rts': '1670', 'rtt': '25085', 'rhythm': '1752', 'roguelike': '1716', 'roguelite': '3959', 'rpg': '122', 'sandbox': '1697', 'shmup': '1641', 'shooter': '1770', 'simulation': '599', 'social deduction': '2551', 'soulslike': '4252', 'sports': '701', 'stealth': '1687', 'strategy': '9', 'survival': '1662', 'survival horror': '3971', 'tactical rpg': '1717', 'text adventure': '1756', 'tps': '1693', 'tower defense': '1669', 'traditional puzzle': '4148', 'trivia': '1702', 'tbs': '1677', 'tbt': '14139', 'typing': '1110', 'vehicle simulation': '5931', 'visual novel': '3799', 'wargame': '4684'
};

const IGDB_GENRE_MAP: Record<string, string> = {
  'rpg': 'genres = (12)', 'shooter': 'genres = (5)', 'indie': 'genres = (32)', 'action': 'genres = (31)', 'adventure': 'genres = (31)',
  'strategy': 'genres = (15)', 'fighting': 'genres = (4)', 'racing': 'genres = (10)', 'sports': 'genres = (14)', 'simulation': 'genres = (13)',
  'platformer': 'genres = (8)', 'puzzle': 'genres = (9)', 'hack_and_slash': 'genres = (25)', 'arcade': 'genres = (33)', 'visual_novel': 'genres = (34)',
  'card_game': 'genres = (35)', 'moba': 'genres = (36)', 'point_and_click': 'genres = (2)', 'music': 'genres = (7)', 'tactical': 'genres = (24)',
  'quiz_trivia': 'genres = (26)', 'pinball': 'genres = (30)', 'horror': 'themes = (19)', 'fantasy': 'themes = (20)', 'sci_fi': 'themes = (18)',
  'stealth': 'themes = (28)', 'survival': 'themes = (21)', 'open_world': 'keywords = (1001, 131, 237, 239)', 'soulslike': 'keywords = (14620, 14619, 14618)',
  'metroidvania': 'keywords = (122, 1025, 411)', 'roguelike': 'keywords = (1102, 1101, 102)', 'jrpg': 'keywords = (1460, 202, 401)', 'beat_em_up': 'keywords = (226, 439)'
};

// HELPER SCRAPER FUNCTIONS
async function scrapeBrowser(url: string, selector: string): Promise<string[]> {
  return new Promise((resolve) => {
    const win = new BrowserWindow({ show: false, width: 1280, height: 1000, webPreferences: { offscreen: true, nodeIntegration: false, contextIsolation: true } });
    win.loadURL(url, { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36' });
    win.webContents.on('did-finish-load', async () => {
      await new Promise(r => setTimeout(r, 2000));
      try {
        const titles = await win.webContents.executeJavaScript('(function() { return Array.from(document.querySelectorAll("' + selector + '")).map(el => el.innerText.trim().replace(/^\\d+\\.\\s+/, "")).filter(text => text.length > 0 && !text.includes("Top 200") && !text.includes("Recently viewed")); })()');
        win.destroy();
        resolve(titles || []);
      } catch (error) { win.destroy(); resolve([]); }
    });
    win.webContents.on('did-fail-load', () => { win.destroy(); resolve([]); });
  });
}

async function scrapeSteamDiscover(url: string): Promise<string[]> {
  return new Promise((resolve) => {
    const win = new BrowserWindow({ show: false, width: 1280, height: 1000, webPreferences: { offscreen: true, nodeIntegration: false, contextIsolation: true } });
    win.loadURL(url, { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36' });
    win.webContents.on('did-finish-load', async () => {
      await new Promise(r => setTimeout(r, 2000));
      try {
        const titles = await win.webContents.executeJavaScript('Array.from(document.querySelectorAll("#search_resultsRows .search_result_row .title")).map(el => el.innerText.trim()).filter(text => { const lower = text.toLowerCase(); return text.length > 0 && !lower.includes("bundle") && !lower.includes("pack") && !lower.includes("collection") && !lower.includes("season pass") && !lower.includes("expansion") && !lower.includes("dlc") && !lower.includes("franchise"); })');
        win.destroy();
        resolve(titles || []);
      } catch (error) { win.destroy(); resolve([]); }
    });
    win.webContents.on('did-fail-load', () => { win.destroy(); resolve([]); });
  });
}

// MAIN EXPORTED FUNCTIONS
export async function getDiscoverGames(existingIds: string[], filterType: string = 'trending', offset: number = 0) {
  try {
    const token = await getAccessToken();
    if (!token) return [];
    if ((filterType === 'trending' || filterType === 'popular') && offset === 0) {
      const cacheKey = 'discover_trending';
      const cached = getCachedRanking(cacheKey);
      if (cached) return JSON.parse(cached.games_json).filter((g: any) => !existingIds.includes(g.id.toString()));
      const url = 'https://store.steampowered.com/search/?filter=popularnew&category1=998&ignore_preferences=1&supportedlang=english&ndl=1';
      const titles = await scrapeSteamDiscover(url);
      if (titles && titles.length > 0) {
        const uniqueTitles = [...new Set(titles)].slice(0, 40);
        const enriched: any[] = [];
        for (const title of uniqueTitles) {
          const results = await searchGames(title);
          if (results && results.length > 0) enriched.push(results[0]);
          await new Promise(r => setTimeout(r, 250));
        }
        const finalArray = enriched.filter(g => !existingIds.includes(g.id.toString()));
        updateRankingsCache(cacheKey, JSON.stringify(finalArray));
        return finalArray.slice(0, 30);
      }
    }
    if (filterType === 'highly_rated' && offset === 0) clearRankingsCache('discover_highly_rated');
    else { const cached = getCachedRanking('discover_' + filterType); if (cached && offset === 0) return JSON.parse(cached.games_json).filter((g: any) => !existingIds.includes(g.id.toString())); }
    let whereClause = ''; let sortClause = ''; let limit = 30;
    const now = Math.floor(Date.now() / 1000); const sixMonthsAgo = now - (6 * 30 * 24 * 60 * 60);
    const isGenre = !!IGDB_GENRE_MAP[filterType.toLowerCase()];
    switch(filterType) {
      case 'new': whereClause = 'first_release_date > ' + sixMonthsAgo + ' & first_release_date < ' + now + ' & rating > 70'; sortClause = 'sort first_release_date desc;'; break;
      case 'upcoming': whereClause = 'first_release_date > ' + now; sortClause = 'sort hypes desc;'; break;
      case 'highly_rated': whereClause = 'rating > 85 & rating_count > 200 & parent_game = null'; sortClause = 'sort rating desc;'; break;
      default:
        if (isGenre) { whereClause = IGDB_GENRE_MAP[filterType.toLowerCase()] + ' & rating > 75 & rating_count > 50'; limit = 100; }
        else { whereClause = 'rating > 80 & rating_count > 100'; sortClause = 'sort rating desc;'; }
        break;
    }
    if (existingIds && existingIds.length > 0) whereClause += ' & id != (' + existingIds.join(',') + ')';
    const response = await fetch('https://api.igdb.com/v4/games', { method: 'POST', headers: { 'Client-ID': getSetting('igdb_client_id') || DEFAULT_CLIENT_ID, 'Authorization': 'Bearer ' + token, 'Accept': 'application/json' }, body: 'where ' + whereClause + '; fields name, cover.image_id; limit ' + limit + '; offset ' + offset + '; ' + sortClause });
    let data = await response.json();
    if (isGenre && Array.isArray(data)) { data = data.sort(() => 0.5 - Math.random()); data = data.slice(0, 30); }
    if (!Array.isArray(data)) return [];
    const result = data.map((game: any) => {
      let imageUrl = 'https://placehold.co/150x200/2d3748/fff?text=No+Cover';
      if (game.cover && game.cover.image_id) imageUrl = 'https://images.igdb.com/igdb/image/upload/t_1080p/' + game.cover.image_id + '.jpg';
      return { id: game.id.toString(), title: game.name, image_url: imageUrl };
    });
    if (offset === 0 && result.length > 0) updateRankingsCache('discover_' + filterType, JSON.stringify(result));
    return result;
  } catch (error) { return []; }
}

export async function getSmartAIPlayOrder(gameTitle: string, apiKey: string) {
  try {
    const token = await getAccessToken();
    if (!token) return [];

    // 1. Initialize Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // 2. Ask Gemini for the true franchise name
    const prefixPrompt = `What is the core franchise name for the video game '${gameTitle}'? (Examples: 'Resident Evil 4' -> 'Resident Evil', 'Grand Theft Auto V' -> 'Grand Theft Auto', 'Assassin's Creed Valhalla' -> 'Assassin's Creed'). Return ONLY the core franchise string. No extra text, no markdown.`;
    const prefixResult = await model.generateContent(prefixPrompt);
    const franchisePrefix = prefixResult.response.text().trim();

    // 3. Now perform the broad IGDB search using this perfect prefix
    const response = await fetch('https://api.igdb.com/v4/games', {
      method: 'POST',
      headers: { 'Client-ID': getSetting('igdb_client_id') || DEFAULT_CLIENT_ID, 'Authorization': 'Bearer ' + token, 'Accept': 'application/json' },
      body: `search "${franchisePrefix}"; fields name, follows, rating_count, alternative_names.name; where parent_game = null; limit 50;`
    });
    const data = await response.json();
    if (!Array.isArray(data)) return [];

    const rawDatabaseNames = data.map((g: any) => {
      let altNames = '';
      if (g.alternative_names && g.alternative_names.length > 0) {
        altNames = ` [AKA: ${g.alternative_names.map((a: any) => a.name).join(', ')}]`;
      }
      return `${g.name}${altNames}`;
    });

    const prompt = `You are a strict video game archivist. We need the Canon Story Chronological Play Order for the '${franchisePrefix}' franchise.

Here are the raw database entries currently existing up to 2026: ${JSON.stringify(rawDatabaseNames)}.

INSTRUCTIONS:
1. Use the Alternative Titles (inside the brackets) to help deduce where the game belongs in the chronological story order.
2. Filter out all DLCs, bundles, multiplayer spin-offs, and pachinko/mobile games.
3. TRANSLATE weird regional database names into standard, clean Western titles. If a remake exists that replaces the original story, just use the clean base name (e.g., "Resident Evil 4").
4. Order the final clean list CHRONOLOGICALLY by in-universe story (e.g., prequels first).
5. CRITICAL: When constructing the final chronological JSON array, output only the exact Main Title (the text before the brackets). Do not include the Alternative Titles in the final output.

Return ONLY a raw JSON array of strings containing the perfectly clean game titles. No markdown, no extra text.`;

    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) return [];
    
    const cleanTitles: string[] = JSON.parse(match[0]);
    const enriched: any[] = [];
    
    for (const cleanTitle of cleanTitles) {
      try {
        const results = await searchGames(cleanTitle);
        if (results && results.length > 0) {
          const bestMatch = results[0];
          enriched.push({ 
            id: bestMatch.id, 
            title: cleanTitle, 
            img: bestMatch.image_url, 
            isCurrent: cleanTitle.toLowerCase() === gameTitle.toLowerCase() || 
                       bestMatch.title.toLowerCase() === gameTitle.toLowerCase() || 
                       (gameTitle.toLowerCase().includes(franchisePrefix.toLowerCase()) && gameTitle.toLowerCase().includes(cleanTitle.toLowerCase().replace(/[0-9]/g, '').trim()))
          });
        }
        await new Promise(r => setTimeout(r, 250));
      } catch (e) {}
    }
    return enriched;
  } catch (err) { return []; }
}

export async function analyzeLibraryImage(imagePath: string, apiKey: string) {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      tools: [{ googleSearch: {} }] as any
    });
    const imageFile = fs.readFileSync(imagePath);
    const imageBase64 = imageFile.toString('base64');
    const mimeType = imagePath.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
    const result = await model.generateContent(['Return raw JSON array of titles from this image.', { inlineData: { data: imageBase64, mimeType: mimeType } }]);
    return JSON.parse(result.response.text().trim().replace(/```json|```/g, ''));
  } catch (err) { return []; }
}

export async function bulkImportGames(gameNames: string[]) {
  for (const name of gameNames) {
    try {
      const results = await searchGames(name);
      if (results && results.length > 0) addGame(results[0].id, results[0].title, results[0].image_url);
      await new Promise(r => setTimeout(r, 250));
    } catch (e) {}
  }
}

export async function getAIRecommendations(apiKey: string, allGames: any[]) {
  try {
    const lovedGames = allGames.filter((g: any) => ['s', 'a'].includes((g.tier || '').toLowerCase())).map((g: any) => g.title);
    const dislikedGames = allGames.filter((g: any) => ['f', 'dropped', 'd'].includes((g.tier || '').toLowerCase())).map((g: any) => g.title);
    if (lovedGames.length === 0 && dislikedGames.length === 0) return { error: 'NOT_ENOUGH_DATA', recommendations: [] };
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      tools: [{ googleSearch: {} }] as any
    });
    const prompt = 'Analyze user tastes: Loved: ' + lovedGames.join(', ') + ', Disliked: ' + dislikedGames.join(', ') + '. Recommend 4 games. Return JSON.';
    const result = await model.generateContent(prompt);
    const recommendations = JSON.parse(result.response.text().trim().replace(/```json|```/g, ''));
    const enriched: any[] = [];
    for (const rec of recommendations) {
      const results = await searchGames(rec.title);
      if (results && results.length > 0) enriched.push({ ...results[0], reason: rec.reason });
      else enriched.push({ id: null, title: rec.title, image_url: '', reason: rec.reason });
      await new Promise(r => setTimeout(r, 250));
    }
    return { error: null, recommendations: enriched };
  } catch (err) { return { error: String(err), recommendations: [] }; }
}

const STORE_MAP: Record<string, string> = {
  '1': 'Steam', '2': 'GamersGate', '3': 'GreenManGaming', '7': 'GOG', '8': 'Origin', '11': 'Humble Store', '13': 'Uplay', '15': 'Fanatical', '21': 'WinGameStore', '23': 'GameBillet', '24': 'Voidu', '25': 'Epic Games', '27': 'Gamesplanet', '28': 'Games Republic', '29': 'SilaGames', '30': 'IndieGala', '31': 'Blizzard', '33': 'DLGamer', '34': 'Noctre', '35': 'DreamGame'
};

export async function getGameDeals(gameTitle: string) {
  try {
    const searchUrl = 'https://www.cheapshark.com/api/1.0/deals?title=' + encodeURIComponent(gameTitle) + '&limit=20&sortBy=Price';
    const res = await fetch(searchUrl);
    const deals = await res.json();
    const titleLower = gameTitle.toLowerCase().replace(/[^a-z0-9]/g, '');
    const matched = deals.filter((d: any) => { const dealTitle = (d.title || '').toLowerCase().replace(/[^a-z0-9]/g, ''); return dealTitle === titleLower || dealTitle.includes(titleLower) || titleLower.includes(dealTitle); });
    const byStore: Record<string, any> = {};
    for (const deal of matched) { const storeId = deal.storeID; if (!byStore[storeId] || parseFloat(deal.salePrice) < parseFloat(byStore[storeId].salePrice)) byStore[storeId] = deal; }
    const sorted = Object.values(byStore).sort((a: any, b: any) => parseFloat(a.salePrice) - parseFloat(b.salePrice)).slice(0, 5);
    return sorted.map((deal: any) => ({ storeName: STORE_MAP[deal.storeID] || 'Store #' + deal.storeID, storeID: deal.storeID, salePrice: deal.salePrice, normalPrice: deal.normalPrice, isOnSale: deal.isOnSale === '1', savings: Math.round(parseFloat(deal.savings || '0')), dealUrl: 'https://www.cheapshark.com/redirect?dealID=' + deal.dealID }));
  } catch (err) { return []; }
}

export async function getScrapedRankings(category: string): Promise<any[]> {
  const cleanCategory = category.toLowerCase().trim();
  const cached = getCachedRanking(cleanCategory);
  if (cached) { const data = JSON.parse(cached.games_json); if (data && data.length > 0) return data; }
  let titles: string[] = [];
  if (IMDB_MAP[cleanCategory]) titles = await scrapeBrowser(IMDB_MAP[cleanCategory], 'h3.ipc-title__text, .lister-item-header a');
  else if (STEAM_TAG_MAP[cleanCategory]) titles = await scrapeBrowser('https://store.steampowered.com/search/?tags=' + STEAM_TAG_MAP[cleanCategory] + '&filter=topsellers&category1=998', '#search_resultsRows .search_result_row .title');
  else titles = await scrapeBrowser(IMDB_MAP.overall, 'h3.ipc-title__text, .lister-item-header a');
  if (!titles || titles.length === 0) return [];
  const uniqueTitles = [...new Set(titles)].slice(0, 20);
  const enriched: any[] = [];
  for (const title of uniqueTitles) {
    const results = await searchGames(title);
    if (results && results.length > 0) enriched.push({ id: results[0].id, title: results[0].title, img: results[0].image_url, rating: 'Critics Choice', genres: category.toUpperCase() });
    await new Promise(r => setTimeout(r, 200));
  }
  if (enriched.length > 0) updateRankingsCache(cleanCategory, JSON.stringify(enriched));
  return enriched;
}

export async function getCachedRankings(categoryId: string) { return await getScrapedRankings(categoryId); }
export async function getGlobalRankings() { return { overall: await getScrapedRankings('overall'), rpg: await getScrapedRankings('rpg'), shooter: await getScrapedRankings('shooter'), action: await getScrapedRankings('action') }; }
