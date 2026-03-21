// Vercel serverless function – proxies LeagueStat game summary (box score)
const BASE =
  'https://cluster.leaguestat.com/feed/index.php' +
  '?feed=gc&tab=gamesummary' +
  '&key=f1aa699db3d81487&client_code=lhjmq&site_id=2&lang_id=1&fmt=json';

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

  const { game_id } = req.query;
  if (!game_id) return res.status(400).json({ error: 'game_id is required' });

  try {
    const upstream = await fetch(`${BASE}&game_id=${encodeURIComponent(game_id)}`, {
      headers: { 'User-Agent': 'remparts-tracker/1.0' },
    });
    if (!upstream.ok) throw new Error(`Upstream ${upstream.status}`);
    const data = await upstream.json();

    if (!data?.GC?.Gamesummary) throw new Error('Unexpected response shape');

    // Live games: short cache; final games: cache longer
    const isLive = data.GC.Gamesummary.meta?.final !== '1';
    res.setHeader('Cache-Control',
      isLive
        ? 's-maxage=30, stale-while-revalidate=60'
        : 's-maxage=3600, stale-while-revalidate=86400'
    );
    return res.status(200).json(data);
  } catch (err) {
    return res.status(502).json({ error: err.message });
  }
}
