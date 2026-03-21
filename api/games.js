// Vercel serverless function – Remparts schedule/results in the app's data format
const UPSTREAM =
  'https://cluster.leaguestat.com/feed/' +
  '?feed=modulekit&view=schedule' +
  '&key=f1aa699db3d81487&client_code=lhjmq&site_id=2&lang_id=1&season_id=211&team_id=9';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// API timezone strings → IANA zones used by the app
const TZ_MAP = {
  'Canada/Eastern':      'America/Toronto',
  'Canada/Atlantic':     'America/Halifax',
  'Canada/Newfoundland': 'America/St_Johns',
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
    const data  = await upstream.json();
    const raw   = data?.SiteKit?.Schedule ?? [];

    const games = raw.map((g, i) => {
      const isHome   = g.home_team_code === 'Que';
      const opponent = isHome ? g.visiting_team_nickname : g.home_team_nickname;
      const remGF    = isHome ? parseInt(g.home_goal_count, 10)     : parseInt(g.visiting_goal_count, 10);
      const remGA    = isHome ? parseInt(g.visiting_goal_count, 10) : parseInt(g.home_goal_count, 10);
      const final    = g.final === '1';
      const ot       = g.overtime === '1';
      const so       = g.shootout === '1';

      let result = 'upcoming';
      if (final) {
        if (remGF > remGA)       result = 'W';
        else if (ot || so)       result = 'OTL';
        else                     result = 'L';
      }

      return {
        id:       i + 1,
        date:     g.date_played,
        time:     g.schedule_time?.slice(0, 5) ?? null,   // "19:00:00" → "19:00"
        tz:       TZ_MAP[g.timezone] ?? 'America/Toronto',
        opponent,
        home:     isHome,
        gf:       final ? remGF : null,
        ga:       final ? remGA : null,
        result,
        gameId:   g.game_id,
      };
    });

    // Cache 5 min – results appear within minutes of game end
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    return res.status(200).json({ games });
  } catch (err) {
    return res.status(502).json({ error: err.message });
  }
}
