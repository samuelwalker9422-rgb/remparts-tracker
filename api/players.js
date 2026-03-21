// Vercel serverless function – proxies LeagueStat skater stats to avoid CORS
const UPSTREAM =
  'https://cluster.leaguestat.com/feed/' +
  '?feed=modulekit&view=skaters' +
  '&key=f1aa699db3d81487&client_code=lhjmq&site_id=2&lang_id=1&season_id=211';

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

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  try {
    const upstream = await fetch(UPSTREAM, {
      headers: { 'User-Agent': 'remparts-tracker/1.0' },
    });

    if (!upstream.ok) throw new Error(`Upstream ${upstream.status}`);

    const data = await upstream.json();

    if (!Array.isArray(data?.SiteKit?.Skaters)) {
      throw new Error('Unexpected response shape from LeagueStat');
    }

    // Cache for 5 minutes – player totals don't change mid-game
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    return res.status(200).json(data);
  } catch (err) {
    return res.status(502).json({ error: err.message });
  }
}
