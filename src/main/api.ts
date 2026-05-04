// Replace these with your actual Twitch Developer credentials
const CLIENT_ID = '3mejs4touc121msgxhw5mxy31medg3';
const CLIENT_SECRET = 'p71goredxlcacagkigxok0vm9sx92n';

let accessToken = '';

// Helper function to get or renew the Twitch OAuth Token
async function getAccessToken() {
  if (accessToken) return accessToken;

  try {
    const response = await fetch(`https://id.twitch.tv/oauth2/token?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&grant_type=client_credentials`, {
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
        'Client-ID': CLIENT_ID,
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
        'Client-ID': CLIENT_ID,
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      },
      body: `where id = ${gameId}; fields summary, first_release_date, genres.name, screenshots.image_id, involved_companies.company.name, involved_companies.developer, involved_companies.publisher, game_modes.name, player_perspectives.name, themes.name, collection.name, game_engines.name, alternative_names.name, videos.video_id, videos.name;`
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
    
    const developers = game.involved_companies ? game.involved_companies.filter((c: any) => c.developer).map((c: any) => c.company.name).join(', ') : '-';
    const publishers = game.involved_companies ? game.involved_companies.filter((c: any) => c.publisher).map((c: any) => c.company.name).join(', ') : '-';
    const gameModes = game.game_modes ? game.game_modes.map((m: any) => m.name).join(', ') : '-';
    const perspectives = game.player_perspectives ? game.player_perspectives.map((p: any) => p.name).join(', ') : '-';
    const themes = game.themes ? game.themes.map((t: any) => t.name).join(', ') : '-';
    const series = game.collection ? game.collection.name : '-';
    const engines = game.game_engines ? game.game_engines.map((e: any) => e.name).join(', ') : '-';
    const altNames = game.alternative_names ? game.alternative_names.map((a: any) => a.name).slice(0, 3).join(', ') : '-';
    
    return {
      summary: game.summary || 'No summary available.',
      genres,
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
      altNames
    };
  } catch (error) {
    console.error("Error fetching extended details:", error);
    return null;
  }
}