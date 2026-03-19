// Vercel serverless function – proxies LeagueStat scorebar to avoid CORS
export default async function handler(req, res) {
  const url =
    'https://cluster.leaguestat.com/feed/' +
    '?feed=modulekit&view=scorebar' +
    '&key=f1aa699db3d81487&client_code=lhjmq&site_id=2&lang_id=1';

  try {
    const upstream = await fetch(url);
    if (!upstream.ok) throw new Error(`Upstream ${upstream.status}`);
    const data = await upstream.json();
    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json(data);
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
}
