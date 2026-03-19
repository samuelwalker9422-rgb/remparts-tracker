// Vercel serverless function – proxies LeagueStat scorebar to avoid CORS
const UPSTREAM =
  'https://cluster.leaguestat.com/feed/' +
  '?feed=modulekit&view=scorebar' +
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

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  try {
    const upstream = await fetch(UPSTREAM, {
      headers: { 'User-Agent': 'remparts-tracker/1.0' },
    });

    if (!upstream.ok) throw new Error(`Upstream ${upstream.status}`);

    const data = await upstream.json();

    // Sanity-check the shape useLiveScores.js expects
    if (!Array.isArray(data?.SiteKit?.Scorebar)) {
      throw new Error('Unexpected response shape from LeagueStat');
    }

    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');
    return res.status(200).json(data);
  } catch (err) {
    // CORS headers are already set above, so the browser can read this error
    return res.status(502).json({ error: err.message });
  }
}
