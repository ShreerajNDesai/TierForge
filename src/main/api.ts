import fs from 'fs';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { addGame, getSetting, getCachedRanking, updateRankingsCache, clearRankingsCache, syncSteamGame, getAllGames, updateGameMetadata, getCachedTimeline, saveCachedTimeline, db } from './database';
import { BrowserWindow, shell } from 'electron';

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
      body: 'search "' + cleanQuery + '"; fields name, cover.image_id, rating_count, total_rating_count, first_release_date, genres.name, involved_companies.company.name; where game_type = (0,8,9); limit 40;'
    });
    const data = await response.json();
    if (!Array.isArray(data)) return [];
    const sortedData = data.sort((a: any, b: any) => {
      const aName = (a.name || '').toLowerCase();
      const bName = (b.name || '').toLowerCase();
      const aExact = aName === queryLower;
      const bExact = bName === queryLower;
      
      // 1. Prioritize exact matches over fuzzy matches
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      
      // 2. TIE-BREAKER: If both are exact matches (e.g. Original vs Remake), prioritize the NEWEST game
      if (aExact && bExact) {
        const aDate = a.first_release_date || 0;
        const bDate = b.first_release_date || 0;
        return bDate - aDate; // Sorts newest to oldest
      }
      
      // 3. If neither is exact, fallback to massive popularity
      const aPop = (a.total_rating_count || a.rating_count || 0);
      const bPop = (b.total_rating_count || b.rating_count || 0);
      return bPop - aPop;
    });
    return sortedData.map((game: any) => {
      let imageUrl = 'https://placehold.co/150x200/2d3748/fff?text=No+Cover';
      if (game.cover && game.cover.image_id) imageUrl = 'https://images.igdb.com/igdb/image/upload/t_1080p/' + game.cover.image_id + '.jpg';
      const genres = game.genres ? game.genres.map((g: any) => g.name).join(', ') : '';
      const developers = game.involved_companies ? game.involved_companies.map((c: any) => c.company.name).join(', ') : '';
      const releaseYear = game.first_release_date ? new Date(game.first_release_date * 1000).getFullYear().toString() : '';
      return { id: game.id.toString(), title: game.name, image_url: imageUrl, genres, developers, release_year: releaseYear };
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
      body: 'where id = ' + gameId + '; fields rating, rating_count, summary, storyline, first_release_date, genres.name, platforms.name, screenshots.image_id, involved_companies.company.name, involved_companies.developer, involved_companies.publisher, game_modes.name, player_perspectives.name, themes.name, collections.name, collections.games.name, collections.games.cover.image_id, collections.games.first_release_date, collections.games.game_type, dlcs.name, dlcs.cover.image_id, dlcs.first_release_date, expansions.name, expansions.cover.image_id, expansions.first_release_date, game_engines.name, alternative_names.name, videos.video_id, videos.name, multiplayer_modes.onlinecoop, multiplayer_modes.onlinemax, multiplayer_modes.offlinecoop, multiplayer_modes.offlinemax, age_ratings.category, age_ratings.rating, age_ratings.rating_cover_url, websites.url, websites.category, external_games.category, external_games.external_game_source, external_games.uid;'
    });
    const data = await response.json();
    if (!data || data.length === 0) return null;
    const game = data[0];

    // Persist storyline to database if available
    if (game.storyline) {
      try {
        db.prepare('UPDATE games SET storyline = ? WHERE id = ?').run(game.storyline, gameId.toString());
      } catch (e) {}
    }

    let steamId = null;
    if (game.external_games && Array.isArray(game.external_games)) {
      const steamEntry = game.external_games.find((eg: any) => eg.category === 1 || eg.external_game_source === 1);
      if (steamEntry && steamEntry.uid) {
        steamId = steamEntry.uid;
      }
    }

    const mapMiniGame = (g: any) => ({
      id: g.id.toString(), title: g.name,
      img: g.cover ? 'https://images.igdb.com/igdb/image/upload/t_cover_big/' + g.cover.image_id + '.jpg' : 'https://placehold.co/150x200/2d3748/fff?text=No+Cover',
      year: g.first_release_date ? new Date(g.first_release_date * 1000).getFullYear() : 9999
    });
    const dlcList = [...(game.dlcs || []), ...(game.expansions || [])].map(mapMiniGame).sort((a, b) => a.year - b.year);
    const seriesList = (game.collections?.[0]?.games || [])
      .filter((g: any) => g.game_type === undefined || [0, 8, 9].includes(g.game_type))
      .map(mapMiniGame)
      .sort((a: any, b: any) => a.year - b.year);
    let background_url = '';
    if (game.screenshots && game.screenshots.length > 0) background_url = 'https://images.igdb.com/igdb/image/upload/t_1080p/' + game.screenshots[Math.floor(Math.random() * game.screenshots.length)].image_id + '.jpg';
    const videos = game.videos ? game.videos.map((v: any) => ({ id: v.video_id, name: v.name })) : [];
    let video_id = '';
    if (videos.length > 0) { const trailer = videos.find((v: any) => v.name.toLowerCase().includes('trailer')); video_id = trailer ? trailer.id : videos[0].id; }
    
    let multiplayer = '-';
    if (game.multiplayer_modes && game.multiplayer_modes.length > 0) {
      const mode = game.multiplayer_modes[0];
      const modesList: string[] = [];
      if (mode.onlinecoop) modesList.push(`Online Co-op (Max: ${mode.onlinemax || '?'})`);
      if (mode.offlinecoop) modesList.push(`Local Co-op (Max: ${mode.offlinemax || '?'})`);
      if (modesList.length > 0) multiplayer = modesList.join(' | ');
      else multiplayer = 'Multiplayer Supported';
    }

    const websites = game.websites ? game.websites.map((w: any) => ({ url: w.url, category: w.category })) : [];
    
    let ageRating = null;
    if (game.age_ratings && game.age_ratings.length > 0) {
      ageRating = game.age_ratings.find((r: any) => r.category === 1) || game.age_ratings.find((r: any) => r.category === 2) || game.age_ratings[0];
    }

    return {
      steamId,
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
      series: game.collections ? game.collections.map((c: any) => c.name).join(', ') : '-', seriesName: game.collections?.[0]?.name || '',
      seriesList, dlcList, engines: game.game_engines ? game.game_engines.map((e: any) => e.name).join(', ') : '-',
      altNames: game.alternative_names ? game.alternative_names.map((a: any) => a.name).slice(0, 3).join(', ') : '-',
      gallery: game.screenshots ? game.screenshots.map((s: any) => 'https://images.igdb.com/igdb/image/upload/t_1080p/' + s.image_id + '.jpg') : [],
      rating: game.rating ? Math.round(game.rating) : null, ratingCount: game.rating_count || 0,
      multiplayer, websites, ageRating
    };
  } catch (error) { return null; }
}

export async function getSteamAppDetails(steamId: string) {
  try {
    const res = await fetch(`https://store.steampowered.com/api/appdetails?appids=${steamId}`);
    const data = await res.json();
    if (data[steamId] && data[steamId].success) {
      const appData = data[steamId].data;
      return {
        pcRequirements: appData.pc_requirements ? {
          minimum: appData.pc_requirements.minimum || '',
          recommended: appData.pc_requirements.recommended || ''
        } : null
      };
    }
    return null;
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

let cachedSteamTags: Record<string, string> | null = null;
let cachedDisplayTags: { id: string, label: string }[] | null = null;

export async function fetchSteamTags() {
  if (cachedSteamTags) return cachedSteamTags;
  try {
    const res = await fetch('https://store.steampowered.com/tagdata/populartags/english', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0 Safari/537.36',
        'Referer': 'https://store.steampowered.com/',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });
    const data = await res.json();
    cachedSteamTags = {};
    cachedDisplayTags = [];
    for (const tag of data) {
      if (tag.name) {
        const normalized = tag.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        cachedSteamTags[normalized] = tag.tagid.toString();
        cachedDisplayTags.push({ id: normalized, label: tag.name });
      }
    }
    return cachedSteamTags;
  } catch (error) {
    return {};
  }
}

export async function getDisplaySteamTags() {
  if (!cachedDisplayTags) await fetchSteamTags();
  return cachedDisplayTags || [];
}

const IGDB_GENRE_MAP: Record<string, string> = {
  'pinball': 'genres = (30)', 'adventure': 'genres = (31)', 'indie': 'genres = (32)', 'arcade': 'genres = (33)',
  'visual_novel': 'genres = (34)', 'card_board_game': 'genres = (35)', 'moba': 'genres = (36)', 'point_and_click': 'genres = (2)',
  'fighting': 'genres = (4)', 'shooter': 'genres = (5)', 'music': 'genres = (7)', 'platform': 'genres = (8)',
  'puzzle': 'genres = (9)', 'racing': 'genres = (10)', 'rts': 'genres = (11)', 'rpg': 'genres = (12)',
  'simulator': 'genres = (13)', 'sport': 'genres = (14)', 'strategy': 'genres = (15)', 'tbs': 'genres = (16)',
  'tactical': 'genres = (24)', 'hack_and_slash': 'genres = (25)', 'quiz_trivia': 'genres = (26)',
  'action': 'themes = (1)', 'fantasy': 'themes = (17)', 'sci_fi': 'themes = (18)', 'horror': 'themes = (19)',
  'thriller': 'themes = (20)', 'survival': 'themes = (21)', 'historical': 'themes = (22)', 'stealth': 'themes = (23)',
  'comedy': 'themes = (27)', 'business': 'themes = (28)', 'drama': 'themes = (31)', 'non_fiction': 'themes = (32)',
  'sandbox': 'themes = (33)', 'educational': 'themes = (34)', 'kids': 'themes = (35)', 'open_world': 'themes = (38)',
  'warfare': 'themes = (39)', 'party': 'themes = (40)', '4x': 'themes = (41)', 'erotic': 'themes = (42)',
  'mystery': 'themes = (43)', 'romance': 'themes = (44)'
};

// HELPER SCRAPER FUNCTIONS
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

async function fetchSteamTrending(offset: number): Promise<string[]> {
  try {
    const res = await fetch(`https://store.steampowered.com/search/results/?query&start=${offset}&count=100&filter=popularnew&category1=998&infinite=1`);
    const data = await res.json();
    if (!data || !data.results_html) return [];
    const html = data.results_html;
    const titles: string[] = [];
    const regex = /<span class="title">([^<]+)<\/span>/g;
    let match;
    while ((match = regex.exec(html)) !== null) {
      titles.push(match[1]);
    }
    return titles.filter(text => { const lower = text.toLowerCase(); return text.length > 0 && !lower.includes("bundle") && !lower.includes("pack") && !lower.includes("collection") && !lower.includes("season pass") && !lower.includes("expansion") && !lower.includes("dlc") && !lower.includes("franchise"); });
  } catch(e) {
    return [];
  }
}

const discoverSteamTitlesCache: Record<string, string[]> = {};

// MAIN EXPORTED FUNCTIONS
export async function getDiscoverGames(existingIds: string[], filterType: string = 'trending', offset: number = 0) {
  try {
    const token = await getAccessToken();
    if (!token) return [];

    if (filterType.startsWith('steamtag_')) {
      const cacheKey = offset === 0 ? 'discover_' + filterType : null;
      if (cacheKey) {
        const cached = getCachedRanking(cacheKey);
        if (cached) return JSON.parse(cached.games_json).filter((g: any) => !existingIds.includes(g.id.toString()));
      }

      if (offset === 0 || !discoverSteamTitlesCache[filterType]) {
        const rawTag = filterType.replace('steamtag_', '');
        const tags = await fetchSteamTags();
        const tagId = tags[rawTag] || '';
        
        let titles: string[] = [];
        for (let i = 0; i < 2; i++) {
          let steamUrl = '';
          if (tagId) steamUrl = `https://store.steampowered.com/search/results/?query&start=${i * 100}&count=100&tags=${tagId}&category1=998&ignore_preferences=1&supportedlang=english&infinite=1`;
          else steamUrl = `https://store.steampowered.com/search/results/?term=${encodeURIComponent(rawTag)}&start=${i * 100}&count=100&category1=998&ignore_preferences=1&supportedlang=english&infinite=1`;

          try {
            const res = await fetch(steamUrl);
            const data = await res.json();
            if (data && data.results_html) {
              const regex = /<span class="title">([^<]+)<\/span>/g;
              let match;
              while ((match = regex.exec(data.results_html)) !== null) {
                titles.push(match[1]);
              }
            }
          } catch (e) {}
        }

        titles = titles.filter(text => { const lower = text.toLowerCase(); return text.length > 0 && !lower.includes("bundle") && !lower.includes("pack") && !lower.includes("collection") && !lower.includes("season pass") && !lower.includes("expansion") && !lower.includes("dlc") && !lower.includes("franchise"); });
        discoverSteamTitlesCache[filterType] = [...new Set(titles)].sort(() => 0.5 - Math.random());
      }

      const shuffledTitles = discoverSteamTitlesCache[filterType] || [];
      const startIndex = Math.floor(offset * 1.5); // Read a larger chunk to account for IGDB dropoffs
      const titlesChunk = shuffledTitles.slice(startIndex, startIndex + 50);

      if (!titlesChunk || titlesChunk.length === 0) return [];

      const enriched: any[] = [];
      for (const title of titlesChunk) {
        if (enriched.length >= 30) break;
        const results = await searchGames(title);
        if (results && results.length > 0 && !existingIds.includes(results[0].id.toString())) {
          enriched.push(results[0]);
        }
        await new Promise(r => setTimeout(r, 250));
      }

      if (cacheKey && enriched.length > 0) updateRankingsCache(cacheKey, JSON.stringify(enriched));
      return enriched;
    }

    if (filterType === 'trending' || filterType === 'popular') {
      const cacheKey = offset === 0 ? 'discover_trending' : null;
      if (cacheKey) {
        const cached = getCachedRanking(cacheKey);
        if (cached) return JSON.parse(cached.games_json).filter((g: any) => !existingIds.includes(g.id.toString()));
      }
      
      if (offset === 0 || !discoverSteamTitlesCache['trending']) {
        let allTitles: string[] = [];
        for (let i = 0; i < 2; i++) {
          const titles = await fetchSteamTrending(i * 100);
          allTitles = allTitles.concat(titles);
        }
        discoverSteamTitlesCache['trending'] = [...new Set(allTitles)];
      }

      const trendingTitles = discoverSteamTitlesCache['trending'] || [];
      const startIndex = Math.floor(offset * 1.5);
      const titlesChunk = trendingTitles.slice(startIndex, startIndex + 50);

      if (!titlesChunk || titlesChunk.length === 0) return [];

      const enriched: any[] = [];
      for (const title of titlesChunk) {
        if (enriched.length >= 30) break;
        const results = await searchGames(title);
        if (results && results.length > 0 && !existingIds.includes(results[0].id.toString())) {
          enriched.push(results[0]);
        }
        await new Promise(r => setTimeout(r, 250));
      }

      if (cacheKey && enriched.length > 0) updateRankingsCache(cacheKey, JSON.stringify(enriched));
      return enriched;
    }
    
    if (filterType === 'highly_rated' && offset === 0) clearRankingsCache('discover_highly_rated');
    else { const cached = getCachedRanking('discover_' + filterType); if (cached && offset === 0) return JSON.parse(cached.games_json).filter((g: any) => !existingIds.includes(g.id.toString())); }
    
    let whereClause = ''; let sortClause = ''; let limit = 30;
    const now = Math.floor(Date.now() / 1000); const sixMonthsAgo = now - (6 * 30 * 24 * 60 * 60);
    const isGenre = !!IGDB_GENRE_MAP[filterType.toLowerCase()];
    
    switch(filterType) {
      case 'new': whereClause = 'first_release_date > ' + sixMonthsAgo + ' & first_release_date < ' + now + ' & game_type = (0,8,9) & total_rating_count > 0'; sortClause = 'sort total_rating_count desc;'; break;
      case 'upcoming': whereClause = 'first_release_date > ' + now + ' & game_type = (0,8,9)'; sortClause = 'sort hypes desc;'; break;
      case 'highly_rated': whereClause = 'rating > 85 & rating_count > 200 & game_type = (0,8,9)'; sortClause = 'sort rating desc;'; break;
      default:
        if (isGenre) { whereClause = IGDB_GENRE_MAP[filterType.toLowerCase()] + ' & rating > 60 & rating_count > 10 & game_type = (0,8,9)'; sortClause = 'sort total_rating_count desc;'; limit = 200; }
        else { whereClause = 'rating > 80 & rating_count > 100 & game_type = (0,8,9)'; sortClause = 'sort rating desc;'; }
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

export async function getSmartAIPlayOrder(gameId: string, gameTitle: string, apiKey: string, forceRefresh: boolean = false) {
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

    // 3. Check Database Cache
    const cachedTimeline = getCachedTimeline(franchisePrefix);
    let baseTimeline: any[] = [];

    if (cachedTimeline && !forceRefresh) {
      baseTimeline = cachedTimeline;
    } else {
      // 4. Perform the broad IGDB search using this perfect prefix
      const response = await fetch('https://api.igdb.com/v4/games', {
        method: 'POST',
        headers: { 'Client-ID': getSetting('igdb_client_id') || DEFAULT_CLIENT_ID, 'Authorization': 'Bearer ' + token, 'Accept': 'application/json' },
        body: `search "${franchisePrefix}"; fields name, rating_count, total_rating_count, alternative_names.name; where game_type = (0,8,9); limit 50;`
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
      
      for (const cleanTitle of cleanTitles) {
        try {
          const results = await searchGames(cleanTitle);
          if (results && results.length > 0) {
            const bestMatch = results[0];
            baseTimeline.push({ 
              id: bestMatch.id, 
              title: cleanTitle, 
              img: bestMatch.image_url
            });
          }
          await new Promise(r => setTimeout(r, 250));
        } catch (e) {}
      }

      // Save raw timeline to cache
      if (baseTimeline.length > 0) {
        saveCachedTimeline(franchisePrefix, baseTimeline);
      }
    }

    // 5. Dynamically Re-Highlight - Strict ID and Exact Title matching
    const finalTimeline = baseTimeline.map((game: any) => ({
      ...game,
      isCurrent: (game.id && game.id.toString() === gameId.toString()) || 
                 (game.title.toLowerCase() === gameTitle.toLowerCase())
    }));

    return finalTimeline;
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

export async function getAIRecommendations(apiKey: string, allGames: any[], vibe: string = '', deepCuts: boolean = false) {
  try {
    const lovedGames = allGames.filter((g: any) => ['s', 'a'].includes((g.tier || '').toLowerCase())).map((g: any) => g.title);
    const dislikedGames = allGames.filter((g: any) => ['f', 'dropped', 'd'].includes((g.tier || '').toLowerCase())).map((g: any) => g.title);
    if (lovedGames.length === 0 && dislikedGames.length === 0) return { error: 'NOT_ENOUGH_DATA', recommendations: [] };
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      tools: [{ googleSearch: {} }] as any
    });
    let promptText = `Analyze user tastes: Loved: ${lovedGames.join(', ')}, Disliked: ${dislikedGames.join(', ')}. Recommend 4 games they would enjoy.`;
    if (vibe) promptText += ` The user is specifically in the mood for: "${vibe}". Find games matching this vibe.`;
    if (deepCuts) promptText += ` IGNORE all mainstream AAA games. Only recommend hidden gems, obscure titles, or highly-rated indie games.`;
    
    const prompt = promptText + ` Return ONLY a JSON array of objects. Each object must have "title" (string) and "reason" (string).`;
    const result = await model.generateContent(prompt);
    const parsed = JSON.parse(result.response.text().trim().replace(/```json|```|```javascript/gi, ''));
    const recommendations = Array.isArray(parsed) ? parsed : (parsed.recommendations || parsed.games || []);
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

export async function getAICompatibility(apiKey: string, allGames: any[], targetGame: string) {
  try {
    const lovedGames = allGames.filter((g: any) => ['s', 'a'].includes((g.tier || '').toLowerCase())).map((g: any) => g.title);
    const dislikedGames = allGames.filter((g: any) => ['f', 'dropped', 'd'].includes((g.tier || '').toLowerCase())).map((g: any) => g.title);
    if (!targetGame) return { error: 'NO_GAME_PROVIDED', score: 0, review: '' };
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash', tools: [{ googleSearch: {} }] as any });
    
    const prompt = `The user is considering buying "${targetGame}". Their favorite games are: ${lovedGames.join(', ')}. Games they disliked or dropped: ${dislikedGames.join(', ')}. 
    Analyze compatibility. Return ONLY a JSON object with: 
    "score" (integer number from 0 to 100), 
    "review" (a short personalized review explaining why they will or won't like it based on their specific tastes).`;
    
    const result = await model.generateContent(prompt);
    const parsed = JSON.parse(result.response.text().trim().replace(/```json|```|```javascript/gi, ''));
    return { error: null, score: parsed.score || 0, review: parsed.review || '' };
  } catch (err) {
    return { error: String(err), score: 0, review: '' };
  }
}

export async function getAIBacklogCure(apiKey: string, allGames: any[]) {
  try {
    const backlogGames = allGames.filter((g: any) => g.status === 'Backlog').map((g: any) => g.title);
    if (backlogGames.length === 0) return { error: 'EMPTY_BACKLOG', title: '', reason: '' };
    
    const lovedGames = allGames.filter((g: any) => ['s', 'a'].includes((g.tier || '').toLowerCase())).map((g: any) => g.title);
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash', tools: [{ googleSearch: {} }] as any });
    
    const prompt = `The user has decision paralysis. Here is their backlog: ${backlogGames.join(', ')}. 
    Here are their all-time favorite games: ${lovedGames.join(', ')}. 
    Pick the SINGLE BEST game from their backlog that they need to play tonight. Hype them up. 
    Return ONLY a JSON object with "title" (the exact game name) and "reason" (the hype text).`;
    
    const result = await model.generateContent(prompt);
    const parsed = JSON.parse(result.response.text().trim().replace(/```json|```|```javascript/gi, ''));
    
    const searchRes = await searchGames(parsed.title);
    const gameInfo = searchRes && searchRes.length > 0 ? searchRes[0] : { id: null, title: parsed.title, image_url: '' };
    
    return { error: null, title: parsed.title, reason: parsed.reason, gameInfo };
  } catch (err) {
    return { error: String(err), title: '', reason: '' };
  }
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
    
    const matched = deals.filter((d: any) => {
      const rawDealTitle = (d.title || '').toLowerCase();
      const dealTitleAlpha = rawDealTitle.replace(/[^a-z0-9]/g, '');
      
      // 1. Strict Negative Filter: Reject any deal that is obviously a DLC, Soundtrack, or Upgrade
      const junkWords = ['dlc', 'soundtrack', 'upgrade', 'season pass', 'expansion', 'artbook', 'pack', 'bonus', 'bundle'];
      if (junkWords.some(word => rawDealTitle.includes(word))) {
        return false;
      }

      // 2. Exact Alphanumeric Match: Prevents "GameName: DLC" from passing just because it includes "GameName"
      // We also allow a slight exception for "Game of the Year" or "Standard Edition" suffixes if needed, 
      // but exact alphanumeric match is the safest for base games.
      return dealTitleAlpha === titleLower || 
             dealTitleAlpha === titleLower + 'edition' || 
             dealTitleAlpha === titleLower + 'standardedition' ||
             dealTitleAlpha === titleLower + 'gameoftheyearedition';
    });
    const byStore: Record<string, any> = {};
    for (const deal of matched) { const storeId = deal.storeID; if (!byStore[storeId] || parseFloat(deal.salePrice) < parseFloat(byStore[storeId].salePrice)) byStore[storeId] = deal; }
    const sorted = Object.values(byStore).sort((a: any, b: any) => parseFloat(a.salePrice) - parseFloat(b.salePrice)).slice(0, 5);
    return sorted.map((deal: any) => ({ storeName: STORE_MAP[deal.storeID] || 'Store #' + deal.storeID, storeID: deal.storeID, salePrice: deal.salePrice, normalPrice: deal.normalPrice, isOnSale: deal.isOnSale === '1', savings: Math.round(parseFloat(deal.savings || '0')), dealUrl: 'https://www.cheapshark.com/redirect?dealID=' + deal.dealID }));
  } catch (err) { return []; }
}

export async function syncSteamLibrary(steamId: string, apiKey: string) {
  try {
    const res = await fetch(`http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${apiKey}&steamid=${steamId}&include_appinfo=1&include_played_free_games=1&format=json`);
    const data: any = await res.json();
    if (data.response && data.response.games) {
      const games = data.response.games;
      for (const game of games) {
        const imageUrl = `https://steamcdn-a.akamaihd.net/steam/apps/${game.appid}/library_600x900.jpg`;
        syncSteamGame(game.appid.toString(), game.name, imageUrl, game.playtime_forever);
      }
      return games.length;
    }
    return 0;
  } catch (error) {
    return 0;
  }
}

export async function getScrapedRankings(category: string): Promise<any[]> {
  const cleanCategory = category.toLowerCase().trim();
  const cached = getCachedRanking(cleanCategory);
  if (cached) { const data = JSON.parse(cached.games_json); if (data && data.length > 0) return data; }
  
  const tags = await fetchSteamTags();
  const reqNormalized = cleanCategory.replace(/[^a-z0-9]/g, '');
  
  let steamUrl = '';
  if (reqNormalized === 'overall' || reqNormalized === 'allgames') {
    steamUrl = 'https://store.steampowered.com/search/?category1=998&ignore_preferences=1&supportedlang=english&ndl=1';
  } else if (tags[reqNormalized]) {
    steamUrl = `https://store.steampowered.com/search/?tags=${tags[reqNormalized]}&category1=998&ignore_preferences=1&supportedlang=english&ndl=1`;
  } else {
    steamUrl = `https://store.steampowered.com/search/?term=${encodeURIComponent(category)}&category1=998&ignore_preferences=1&supportedlang=english&ndl=1`;
  }
  
  const titles = await scrapeSteamDiscover(steamUrl);
  if (!titles || titles.length === 0) return [];
  
  const uniqueTitles = [...new Set(titles)].slice(0, 20);
  const enriched: any[] = [];
  for (const title of uniqueTitles) {
    const results = await searchGames(title);
    if (results && results.length > 0) enriched.push({ id: results[0].id, title: results[0].title, img: results[0].image_url, rating: 'Steam', genres: category });
    await new Promise(r => setTimeout(r, 200));
  }
  if (enriched.length > 0) updateRankingsCache(cleanCategory, JSON.stringify(enriched));
  return enriched;
}

export async function getCachedRankings(categoryId: string) { return await getScrapedRankings(categoryId); }
export async function getGlobalRankings() { return { overall: await getScrapedRankings('overall'), rpg: await getScrapedRankings('rpg'), shooter: await getScrapedRankings('shooter'), action: await getScrapedRankings('action') }; }

export async function generateGamerProfile(statsJson: string, apiKey: string) {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const prompt = `You are a witty, slightly sarcastic, but complimentary video game expert. Analyze these player stats: ${statsJson}. Write a 3-sentence 'Gamer Profile' that playfully roasts their backlog size, completion rate, and their favorite genres/studios, but ultimately hypes up their taste in games. No markdown.`;
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (err) {
    return 'Could not generate profile. The AI needs a breather (or a valid API key).';
  }
}

export async function backfillMissingMetadata() {
  const games = getAllGames() as any[];
  const missingGames = games.filter((g: any) => !g.release_year || g.release_year === '');
  
  for (const game of missingGames) {
    const details = await getGameExtendedDetails(game.id);
    if (details) {
      updateGameMetadata(game.id, details.genres || '', details.developers || '', details.year || '');
    }
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  return true;
}

export async function getSteamAchievements(appId: string, steamId: string, apiKey: string) {
  try {
    const schemaRes = await fetch(`https://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v2/?key=${apiKey}&appid=${appId}`);
    const schemaData = await schemaRes.json();
    
    const playerRes = await fetch(`https://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v0001/?appid=${appId}&key=${apiKey}&steamid=${steamId}`);
    const playerData = await playerRes.json();

    if (!schemaData?.game?.availableGameStats?.achievements || !playerData?.playerstats?.achievements) {
      return null;
    }

    const playerAchMap = new Map();
    playerData.playerstats.achievements.forEach((ach: any) => {
      playerAchMap.set(ach.apiname, ach);
    });

    let unlocked = 0;
    const list = schemaData.game.availableGameStats.achievements.map((ach: any) => {
      const pAch = playerAchMap.get(ach.name);
      const isAchieved = pAch && pAch.achieved === 1;
      if (isAchieved) unlocked++;
      
      return {
        name: ach.displayName,
        description: ach.description || '',
        icon: isAchieved ? ach.icon : ach.icongray,
        achieved: isAchieved,
        unlockTime: pAch ? pAch.unlocktime : 0
      };
    });

    const total = list.length;
    return {
      total,
      unlocked,
      percentage: total > 0 ? Math.round((unlocked / total) * 100) : 0,
      list
    };
  } catch (err) {
    return null;
  }
}
