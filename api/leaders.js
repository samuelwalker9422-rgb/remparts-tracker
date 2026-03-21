// Vercel serverless function — QMJHL scoring leaders via HockeyTech skaters feed
// Uses lscluster.hockeytech.com/view=skaters which actually returns data (cluster.leaguestat.com view=statviewtype returns null at season end)
const UPSTREAM =
  'https://lscluster.hockeytech.com/feed/?feed=modulekit&view=skaters' +
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
    const data    = await upstream.json();
    const skaters = data?.SiteKit?.Skaters ?? [];

    // API already sorts by points; take top 10 and slim down the payload
    const leaders = skaters.slice(0, 10).map(p => ({
      player_id: p.player_id,
      name:      `${p.first_name} ${p.last_name}`,
      team_code: p.team_code,
      position:  p.position,
      gp:        Number(p.games_played),
      goals:     Number(p.goals),
      assists:   Number(p.assists),
      points:    Number(p.points),
      plusMinus: p.plus_minus,
    }));

    // Cache for 5 minutes
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    return res.status(200).json({ leaders });
  } catch (err) {
    return res.status(502).json({ error: err.message });
  }
}
