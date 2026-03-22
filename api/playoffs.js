// Vercel serverless — 2026 QMJHL playoff schedule (season_id=212)
const UPSTREAM =
  'https://cluster.leaguestat.com/feed/?feed=modulekit&view=schedule' +
  '&key=f1aa699db3d81487&client_code=lhjmq&site_id=2&lang_id=1&season_id=212';

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const TZ_MAP = {
  'Canada/Eastern':      'America/Toronto',
  'Canada/Atlantic':     'America/Halifax',
  'Canada/Newfoundland': 'America/St_Johns',
};

export default async function handler(req, res) {
  for (const [k, v] of Object.entries(CORS)) res.setHeader(k, v);
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const upstream = await fetch(UPSTREAM, {
      headers: { 'User-Agent': 'remparts-tracker/1.0' },
    });
    if (!upstream.ok) throw new Error(`Upstream ${upstream.status}`);
    const data = await upstream.json();
    const raw  = data?.SiteKit?.Schedule ?? [];

    const games = raw.map(g => ({
      gameId:    g.game_id,
      date:      g.date_played,            // "2026-03-27"
      time:      g.schedule_time?.slice(0, 5) ?? null,  // "19:00"
      tz:        TZ_MAP[g.timezone] ?? 'America/Toronto',
      homeCode:  g.home_team_code,
      awayCode:  g.visiting_team_code,
      homeNick:  g.home_team_nickname,
      awayNick:  g.visiting_team_nickname,
      venue:     g.venue_name,
      final:     g.final === '1',
      homeGoals: g.final === '1' ? parseInt(g.home_goal_count, 10) : null,
      awayGoals: g.final === '1' ? parseInt(g.visiting_goal_count, 10) : null,
    }));

    // Cache 5 min – scores update live during playoffs
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    return res.status(200).json({ games });
  } catch (err) {
    return res.status(502).json({ error: err.message });
  }
}
