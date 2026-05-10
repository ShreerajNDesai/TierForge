import fs from 'fs';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { addGame, getSetting } from './database';
import axios from 'axios';
import * as cheerio from 'cheerio';


// Default Twitch Developer credentials (fallbacks)
const DEFAULT_CLIENT_ID = '3mejs4touc121msgxhw5mxy31medg3';
const DEFAULT_CLIENT_SECRET = 'p71goredxlcacagkigxok0vm9sx92n';

const { HowLongToBeatService } = require('howlongtobeat-ts');
const hltbService = new HowLongToBeatService();

let accessToken = '';

// Helper function to get or renew the Twitch OAuth Token
async function getAccessToken() {
  if (accessToken) return accessToken;

  const clientId = getSetting('igdb_client_id') || DEFAULT_CLIENT_ID;
  const clientSecret = getSetting('igdb_client_secret') || DEFAULT_CLIENT_SECRET;

  try {
    const response = await fetch(`https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`, {
      method: 'POST'
    });
    const data = await response.json();
    accessToken = data.access_token;
    return accessToken;
  } catch (error) {
    console.error("Error getting Twitch token:", error);
    return null;
  }
}

export async function searchGames(query: string) {
  try {
    const token = await getAccessToken();
    if (!token) return[];

    // Search IGDB: We ask specifically for the name and the vertical cover image
    const response = await fetch('https://api.igdb.com/v4/games', {
      method: 'POST',
      headers: {
        'Client-ID': getSetting('igdb_client_id') || DEFAULT_CLIENT_ID,
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      },
      // IGDB uses 'Apicalypse' query language. This searches by name and gets the cover.
      body: `search "${query}"; fields name, cover.image_id; limit 10;`
    });

    const data = await response.json();

    // Map the IGDB data to match our React Frontend expectations
    return data.map((game: any) => {
      // IGDB provides an image_id. We plug it into their URL structure to get a high-res vertical poster.
      // Changing to t_1080p per user request for highest quality!
      let imageUrl = 'https://placehold.co/150x200/2d3748/fff?text=No+Cover';
      if (game.cover && game.cover.image_id) {
        imageUrl = `https://images.igdb.com/igdb/image/upload/t_1080p/${game.cover.image_id}.jpg`;
      }

      return {
        id: game.id.toString(),
        title: game.name,
        image_url: imageUrl
      };
    });
  } catch (error) {
    console.error("Error fetching from IGDB:", error);
    return[]; 
  }
}

export async function getGameExtendedDetails(gameId: string) {
  try {
    const token = await getAccessToken();
    if (!token) return null;

    const response = await fetch('https://api.igdb.com/v4/games', {
      method: 'POST',
      headers: {
        'Client-ID': getSetting('igdb_client_id') || DEFAULT_CLIENT_ID,
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      },
      body: `where id = ${gameId}; fields rating, rating_count, summary, storyline, first_release_date, genres.name, platforms.name, screenshots.image_id, involved_companies.company.name, involved_companies.developer, involved_companies.publisher, game_modes.name, player_perspectives.name, themes.name, collection.name, game_engines.name, alternative_names.name, videos.video_id, videos.name;`
    });

    const data = await response.json();
    if (!data || data.length === 0) return null;
    
    const game = data[0];
    
    let background_url = '';
    if (game.screenshots && game.screenshots.length > 0) {
      // Pick a random screenshot every time
      const randomIndex = Math.floor(Math.random() * game.screenshots.length);
      background_url = `https://images.igdb.com/igdb/image/upload/t_1080p/${game.screenshots[randomIndex].image_id}.jpg`;
    }

    const videos = game.videos ? game.videos.map((v: any) => ({ id: v.video_id, name: v.name })) : [];
    
    let video_id = '';
    if (videos.length > 0) {
      // Prioritize "Trailer" if possible, otherwise first video
      const trailer = videos.find((v: any) => v.name.toLowerCase().includes('trailer'));
      video_id = trailer ? trailer.id : videos[0].id;
    }
    
    const year = game.first_release_date ? new Date(game.first_release_date * 1000).getFullYear().toString() : 'Unknown';
    const genres = game.genres ? game.genres.map((g: any) => g.name).join(', ') : 'Unknown Genre';
    const platforms = game.platforms ? game.platforms.map((p: any) => p.name) : [];
    
    const developers = game.involved_companies ? game.involved_companies.filter((c: any) => c.developer).map((c: any) => c.company.name).join(', ') : '-';
    const publishers = game.involved_companies ? game.involved_companies.filter((c: any) => c.publisher).map((c: any) => c.company.name).join(', ') : '-';
    const gameModes = game.game_modes ? game.game_modes.map((m: any) => m.name).join(', ') : '-';
    const perspectives = game.player_perspectives ? game.player_perspectives.map((p: any) => p.name).join(', ') : '-';
    const themes = game.themes ? game.themes.map((t: any) => t.name).join(', ') : '-';
    const series = game.collection ? game.collection.name : '-';
    const engines = game.game_engines ? game.game_engines.map((e: any) => e.name).join(', ') : '-';
    const altNames = game.alternative_names ? game.alternative_names.map((a: any) => a.name).slice(0, 3).join(', ') : '-';
    
    const gallery = game.screenshots
      ? game.screenshots.map((s: any) => `https://images.igdb.com/igdb/image/upload/t_1080p/${s.image_id}.jpg`)
      : [];

    return {
      summary: game.summary || 'No summary available.',
      storyline: game.storyline || '',
      genres,
      platforms,
      year,
      background_url,
      video_id,
      videos,
      developers,
      publishers,
      gameModes,
      perspectives,
      themes,
      series,
      engines,
      altNames,
      gallery,
      rating: game.rating ? Math.round(game.rating) : null,
      ratingCount: game.rating_count || 0
    };
  } catch (error) {
    console.error("Error fetching extended details:", error);
    return null;
  }
}

export async function getHowLongToBeat(gameName: string) {
  try {
    const results = await hltbService.search(gameName);
    if (results && results.success && results.data && results.data.length > 0) {
      const result = results.data[0];
      return {
        main: Math.round(result.mainTime / 3600) || 0,
        extra: Math.round(result.mainExtraTime / 3600) || 0,
        completionist: Math.round(result.completionistTime / 3600) || 0
      };
    }
    return null;
  } catch (error) {
    console.error("Error fetching HLTB data:", error);
    return null;
  }
}

export async function getDiscoverGames(existingIds: string[], filterType: string = 'popular', offset: number = 0) {
  try {
    const token = await getAccessToken();
    if (!token) return [];

    let whereClause = '';
    let sortClause = '';

    const now = Math.floor(Date.now() / 1000);
    const sixMonthsAgo = now - (6 * 30 * 24 * 60 * 60);

    switch(filterType) {
      case 'new':
        whereClause = `first_release_date > ${sixMonthsAgo} & first_release_date < ${now} & rating > 70`;
        sortClause = `sort first_release_date desc;`;
        break;
      case 'upcoming':
        whereClause = `first_release_date > ${now}`;
        sortClause = `sort hypes desc;`;
        break;
      case 'rpg':
        whereClause = `genres = (12) & rating > 75 & rating_count > 50`;
        sortClause = `sort rating desc;`;
        break;
      case 'shooter':
        whereClause = `genres = (5) & rating > 75 & rating_count > 50`;
        sortClause = `sort rating desc;`;
        break;
      case 'indie':
        whereClause = `genres = (32) & rating > 75 & rating_count > 50`;
        sortClause = `sort rating desc;`;
        break;
      case 'highly_rated':
        whereClause = `rating > 90 & rating_count > 300`;
        sortClause = `sort rating desc;`;
        break;
      case 'action':
        whereClause = `genres = (31) & rating > 75 & rating_count > 50`;
        sortClause = `sort rating desc;`;
        break;
      case 'adventure':
        whereClause = `genres = (31) & rating > 75 & rating_count > 50`;
        sortClause = `sort rating desc;`;
        break;
      case 'strategy':
        whereClause = `genres = (15) & rating > 75 & rating_count > 50`;
        sortClause = `sort rating desc;`;
        break;
      case 'popular':
      default:
        whereClause = `rating > 80 & rating_count > 100`;
        sortClause = `sort rating desc;`;
        break;
    }

    if (existingIds && existingIds.length > 0) {
      whereClause += ` & id != (${existingIds.join(',')})`;
    }

    const response = await fetch('https://api.igdb.com/v4/games', {
      method: 'POST',
      headers: {
        'Client-ID': getSetting('igdb_client_id') || DEFAULT_CLIENT_ID,
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      },
      body: `where ${whereClause}; fields name, cover.image_id; limit 30; offset ${offset}; ${sortClause}`
    });

    const data = await response.json();

    return data.map((game: any) => {
      let imageUrl = 'https://placehold.co/150x200/2d3748/fff?text=No+Cover';
      if (game.cover && game.cover.image_id) {
        imageUrl = `https://images.igdb.com/igdb/image/upload/t_1080p/${game.cover.image_id}.jpg`;
      }
      return {
        id: game.id.toString(),
        title: game.name,
        image_url: imageUrl
      };
    });
  } catch (error) {
    console.error("Error fetching discover games:", error);
    return [];
  }
}

export async function analyzeLibraryImage(imagePath: string, apiKey: string) {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const imageFile = fs.readFileSync(imagePath);
    const imageBase64 = imageFile.toString("base64");
    
    const mimeType = imagePath.toLowerCase().endsWith('.png') ? "image/png" : "image/jpeg";

    const prompt = `You are a precise video game data extraction tool. Look at this image and extract every playable video game title visible.

Follow these strict rules:

1. Clean for Searchability: Remove system suffixes, collection tags, or file names. If you see 'Halo: TMCC - Halo 3', clean it to just 'Halo 3'. If you see 'Essential Files' or update packs, ignore them completely.

2. Expand Acronyms: If you see 'DE', convert it to 'Definitive Edition' or leave it as the base game name.

3. No Deduplication: Extract every distinct playable game, even if they belong to the same franchise.

4. Output Format: Return EXACTLY and ONLY a raw, valid JSON array of strings.

5. Absolutely NO markdown formatting, NO backticks, and NO conversational text.

Example output:["Resident Evil 2", "Sekiro: Shadows Die Twice", "Halo Reach"]`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: imageBase64,
          mimeType: mimeType
        }
      }
    ]);

    const text = result.response.text().trim();
    
    let jsonStr = text;
    if (jsonStr.startsWith('\`\`\`json')) jsonStr = jsonStr.replace('\`\`\`json', '');
    if (jsonStr.startsWith('\`\`\`')) jsonStr = jsonStr.replace('\`\`\`', '');
    if (jsonStr.endsWith('\`\`\`')) jsonStr = jsonStr.slice(0, -3);
    
    return JSON.parse(jsonStr.trim());
  } catch (err) {
    console.error("AI Analysis failed:", err);
    return [];
  }
}

export async function bulkImportGames(gameNames: string[]) {
  for (const name of gameNames) {
    try {
      const results = await searchGames(name);
      if (results && results.length > 0) {
        const game = results[0];
        addGame(game.id, game.title, game.image_url);
      }
      await new Promise(r => setTimeout(r, 250));
    } catch (e) {
      console.error(`Failed to import ${name}:`, e);
    }
  }
}

export async function getAIRecommendations(apiKey: string, allGames: any[]) {
  try {
    // Gather user taste data from their tier placements
    const lovedGames = allGames
      .filter((g: any) => ['s', 'a'].includes((g.tier || '').toLowerCase()))
      .map((g: any) => g.title);

    const dislikedGames = allGames
      .filter((g: any) => ['f', 'dropped', 'd'].includes((g.tier || '').toLowerCase()))
      .map((g: any) => g.title);

    const ownedTitles = allGames.map((g: any) => g.title.toLowerCase());

    if (lovedGames.length === 0 && dislikedGames.length === 0) {
      return { error: 'NOT_ENOUGH_DATA', recommendations: [] };
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `You are a world-class gaming concierge AI. Analyze this user's gaming taste and recommend exactly 4 games they haven't played yet.

LOVED GAMES (S-Tier / A-Tier): ${lovedGames.length > 0 ? lovedGames.join(', ') : 'None specified'}
DISLIKED/DROPPED GAMES: ${dislikedGames.length > 0 ? dislikedGames.join(', ') : 'None specified'}
GAMES THEY ALREADY OWN (do NOT recommend these): ${ownedTitles.join(', ')}

RULES:
- Recommend exactly 4 games they DO NOT already own.
- Each recommendation must be a real, released video game.
- For each, provide a 2-sentence personalized explanation of WHY they will love it based on their specific tastes.
- Return ONLY a valid JSON array. No markdown fences, no extra text.

JSON FORMAT:
[{"title": "Game Name", "reason": "Two sentence explanation."}]`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    let jsonStr = text;
    if (jsonStr.startsWith('```json')) jsonStr = jsonStr.replace('```json', '');
    if (jsonStr.startsWith('```')) jsonStr = jsonStr.replace('```', '');
    if (jsonStr.endsWith('```')) jsonStr = jsonStr.slice(0, -3);

    const recommendations = JSON.parse(jsonStr.trim());

    // Enrich each recommendation with IGDB cover art
    const enriched: { id: any; title: string; image_url: string; reason: string }[] = [];
    for (const rec of recommendations) {
      try {
        const results = await searchGames(rec.title);
        if (results && results.length > 0) {
          const best = results[0];
          enriched.push({
            id: best.id,
            title: best.title,
            image_url: best.image_url,
            reason: rec.reason
          });
        } else {
          enriched.push({
            id: null,
            title: rec.title,
            image_url: '',
            reason: rec.reason
          });
        }
        await new Promise(r => setTimeout(r, 250));
      } catch (e) {
        enriched.push({
          id: null,
          title: rec.title,
          image_url: '',
          reason: rec.reason
        });
      }
    }

    return { error: null, recommendations: enriched };
  } catch (err) {
    console.error("AI Recommendations failed:", err);
    return { error: String(err), recommendations: [] };
  }
}

// Store ID to name mapping for CheapShark
const STORE_MAP: Record<string, string> = {
  '1': 'Steam', '2': 'GamersGate', '3': 'GreenManGaming', '7': 'GOG',
  '8': 'Origin', '11': 'Humble Store', '13': 'Uplay', '15': 'Fanatical',
  '21': 'WinGameStore', '23': 'GameBillet', '24': 'Voidu', '25': 'Epic Games',
  '27': 'Gamesplanet', '28': 'Games Republic', '29': 'SilaGames', '30': 'IndieGala',
  '31': 'Blizzard', '33': 'DLGamer', '34': 'Noctre', '35': 'DreamGame'
};

export async function getGameDeals(gameTitle: string) {
  try {
    const searchUrl = `https://www.cheapshark.com/api/1.0/deals?title=${encodeURIComponent(gameTitle)}&limit=20&sortBy=Price`;
    const res = await fetch(searchUrl);
    if (!res.ok) return [];

    const deals = await res.json();
    if (!deals || deals.length === 0) return [];

    // Filter to exact/close title matches only
    const titleLower = gameTitle.toLowerCase().replace(/[^a-z0-9]/g, '');
    const matched = deals.filter((d: any) => {
      const dealTitle = (d.title || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      return dealTitle === titleLower || dealTitle.includes(titleLower) || titleLower.includes(dealTitle);
    });

    if (matched.length === 0) return [];

    // Deduplicate by store (keep cheapest per store)
    const byStore: Record<string, any> = {};
    for (const deal of matched) {
      const storeId = deal.storeID;
      if (!byStore[storeId] || parseFloat(deal.salePrice) < parseFloat(byStore[storeId].salePrice)) {
        byStore[storeId] = deal;
      }
    }

    // Sort by price and take top 5
    const sorted = Object.values(byStore).sort((a: any, b: any) => parseFloat(a.salePrice) - parseFloat(b.salePrice)).slice(0, 5);

    return sorted.map((deal: any) => ({
      storeName: STORE_MAP[deal.storeID] || `Store #${deal.storeID}`,
      storeID: deal.storeID,
      salePrice: deal.salePrice,
      normalPrice: deal.normalPrice,
      isOnSale: deal.isOnSale === '1',
      savings: Math.round(parseFloat(deal.savings || '0')),
      dealUrl: `https://www.cheapshark.com/redirect?dealID=${deal.dealID}`
    }));
  } catch (err) {
    console.error("CheapShark error:", err);
    return [];
  }
}

export async function getGlobalRankings(rawgKey: string) {
  const base = `https://api.rawg.io/api/games?key=${rawgKey}&ordering=-added&exclude_additions=true&page_size=40`;

  try {
    // Fetch 2 pages per category for a deeper pool
    const [overallP1, overallP2, rpgP1, rpgP2, shooterP1, shooterP2, actionP1, actionP2] = await Promise.all([
      fetch(base),
      fetch(`${base}&page=2`),
      fetch(`${base}&genres=role-playing-games-rpg`),
      fetch(`${base}&genres=role-playing-games-rpg&page=2`),
      fetch(`${base}&genres=shooter`),
      fetch(`${base}&genres=shooter&page=2`),
      fetch(`${base}&genres=action`),
      fetch(`${base}&genres=action&page=2`)
    ]);

    const parseTwo = async (res1: Response, res2: Response) => {
      const extract = async (res: Response) => {
        if (!res.ok) return [];
        const data = await res.json();
        return data.results || [];
      };
      const all = [...await extract(res1), ...await extract(res2)];
      const sorted = all.sort((a: any, b: any) => b.rating - a.rating);
      return sorted.slice(0, 25).map((g: any) => ({
        id: g.id,
        title: g.name,
        img: g.background_image,
        rating: g.rating,
        ratingsCount: g.ratings_count || 0,
        genres: (g.genres || []).map((gen: any) => gen.name).slice(0, 3).join(', ')
      }));
    };

    return {
      overall: await parseTwo(overallP1, overallP2),
      rpg: await parseTwo(rpgP1, rpgP2),
      shooter: await parseTwo(shooterP1, shooterP2),
      action: await parseTwo(actionP1, actionP2)
    };
  } catch (err) {
    console.error("RAWG Rankings error:", err);
    return { overall: [], rpg: [], shooter: [], action: [] };
  }
}
// Memory cache so we don't spam IMDb/IGDB every time you click the tab
let scrapedCache: any[] =[]; 

export async function getScrapedRankings() {
  if (scrapedCache.length > 0) return scrapedCache;

  try {
    // 1. Scrape the specific IMDb List you provided
    const { data } = await axios.get('https://www.imdb.com/list/ls094943782/?sort=num_votes%2Cdesc', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      }
    });

    const $ = cheerio.load(data);
    const gameTitles: string[] =[];

    // IMDb's new list layout uses h3 tags with the class ipc-title__text
    $('h3.ipc-title__text').each((i, el) => {
      const text = $(el).text().trim();
      // Matches the format "1. The Witcher 3: Wild Hunt"
      const match = text.match(/^\d+\.\s+(.*)$/);
      if (match) {
        gameTitles.push(match[1]);
      }
    });

    // Fallback for IMDb's older classic layout just in case
    if (gameTitles.length === 0) {
      $('.lister-item-header a').each((i, el) => {
        gameTitles.push($(el).text().trim());
      });
    }

    // 2. Take the Top 20 and fetch their real IGDB posters
    const topTitles = gameTitles.slice(0, 20);
    const enrichedGames: any[] =[];

    for (let i = 0; i < topTitles.length; i++) {
      const title = topTitles[i];
      try {
        const results = await searchGames(title);
        if (results && results.length > 0) {
          enrichedGames.push({
            id: results[0].id,
            title: results[0].title,
            img: results[0].image_url,
            rating: 'IMDb', // Replaces the 5-star number
            genres: 'Critics Choice'
          });
        }
      } catch (e) {
        console.error(`Failed to fetch IGDB data for ${title}`);
      }
      // 250ms delay to respect IGDB API rate limits!
      await new Promise(r => setTimeout(r, 250)); 
    }

    scrapedCache = enrichedGames;
    return enrichedGames;
  } catch (error) {
    console.error('Error scraping IMDb:', error);
    return [];
  }
}