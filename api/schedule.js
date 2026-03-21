// Vercel serverless function – returns a game_id → flo_core_event_id map
// Used to build FloHockey watch links on game cards without fetching full box scores
const UPSTREAM =
  'https://cluster.leaguestat.com/feed/' +
  '?feed=modulekit&view=schedule' +
  '&key=f1aa699db3d81487&client_code=lhjmq&site_id=2&lang_id=1';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function setCors(res) {
  for (const [k, v] of Object.entries(CORS_HEADERS)) res.setHeader(k, v);
}

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const upstream = await fetch(UPSTREAM, {
      headers: { 'User-Agent': 'remparts-tracker/1.0' },
    });
    if (!upstream.ok) throw new Error(`Upstream ${upstream.status}`);
    const data = await upstream.json();

    const games = data?.SiteKit?.Schedule ?? [];

    // Return a slim map: game_id → flo_core_event_id (skip blank entries)
    const links = {};
    for (const g of games) {
      if (g.game_id && g.flo_core_event_id) {
        links[g.game_id] = g.flo_core_event_id;
      }
    }

    // Cache for 1 hour — schedule doesn't change during the day
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=7200');
    return res.status(200).json({ links });
  } catch (err) {
    return res.status(502).json({ error: err.message });
  }
}
