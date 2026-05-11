const clientId = '3mejs4touc121msgxhw5mxy31medg3';
const clientSecret = 'p71goredxlcacagkigxok0vm9sx92n';

async function testNew() {
  const authRes = await fetch('https://id.twitch.tv/oauth2/token?client_id=' + clientId + '&client_secret=' + clientSecret + '&grant_type=client_credentials', { method: 'POST' });
  const token = (await authRes.json()).access_token;
  const headers = { 'Client-ID': clientId, 'Authorization': 'Bearer ' + token, 'Accept': 'application/json' };

  const now = Math.floor(Date.now() / 1000); 
  const sixMonthsAgo = now - (6 * 30 * 24 * 60 * 60);

  const res = await fetch('https://api.igdb.com/v4/games', { 
    method: 'POST', 
    headers, 
    body: 'where first_release_date > ' + sixMonthsAgo + ' & first_release_date < ' + now + ' & game_type = (0,8,9); fields name, total_rating_count; sort total_rating_count desc; limit 20;' 
  });
  console.log('New Releases (Top):', (await res.json()).map(g => g.name).join(', '));
  
  const res2 = await fetch('https://api.igdb.com/v4/games', { 
    method: 'POST', 
    headers, 
    body: 'where first_release_date > ' + now + ' & game_type = (0,8,9); fields name, hypes; sort hypes desc; limit 20;' 
  });
  console.log('Upcoming (Top):', (await res2.json()).map(g => g.name).join(', '));
}
testNew();
