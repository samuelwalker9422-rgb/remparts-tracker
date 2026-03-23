// Vercel serverless function – Remparts regular season + playoff schedule
const BASE =
  'https://cluster.leaguestat.com/feed/' +
  '?feed=modulekit&view=schedule' +
  '&key=f1aa699db3d81487&client_code=lhjmq&site_id=2&lang_id=1&team_id=9';

const UPSTREAM_REG     = BASE + '&season_id=211';
const UPSTREAM_PLAYOFF = BASE + '&season_id=212';

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

function mapGame(g, i, isPlayoff = false) {
  const isHome   = g.home_team_code === 'Que';
  const opponent = isHome ? g.visiting_team_nickname : g.home_team_nickname;
  const remGF    = isHome ? parseInt(g.home_goal_count, 10)     : parseInt(g.visiting_goal_count, 10);
  const remGA    = isHome ? parseInt(g.visiting_goal_count, 10) : parseInt(g.home_goal_count, 10);
  const final    = g.final === '1';
  const ot       = g.overtime === '1';
  const so       = g.shootout === '1';

  let result = 'upcoming';
  if (final) {
    if (remGF > remGA)   result = 'W';
    else if (ot || so)   result = 'OTL';
    else                 result = 'L';
  }

  const entry = {
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

  if (isPlayoff) {
    entry.gameNum = i + 1;   // sequential game number within the series (1–7)
    entry.series  = g.game_letter ?? null;  // API series identifier (e.g. "D")
  }

  return entry;
}

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const [regRes, poRes] = await Promise.all([
      fetch(UPSTREAM_REG,     { headers: { 'User-Agent': 'remparts-tracker/1.0' } }),
      fetch(UPSTREAM_PLAYOFF, { headers: { 'User-Agent': 'remparts-tracker/1.0' } }),
    ]);

    if (!regRes.ok) throw new Error(`Regular season upstream ${regRes.status}`);
    if (!poRes.ok)  throw new Error(`Playoff upstream ${poRes.status}`);

    const [regData, poData] = await Promise.all([regRes.json(), poRes.json()]);

    const rawReg = regData?.SiteKit?.Schedule ?? [];
    const rawPo  = poData?.SiteKit?.Schedule  ?? [];

    const games        = rawReg.map((g, i) => mapGame(g, i, false));
    // NOTE: The leaguestat API (season_id=212) returns ALL Remparts playoff games dynamically
    // as they are scheduled — including Round 2, 3, and Memorial Cup games. Round 2+ matchups
    // will appear automatically in playoffGames once Round 1 series conclude and pairings are set.
    // No code changes required to support future rounds.
    const playoffGames = rawPo.map((g, i)  => mapGame(g, i, true));

    // Cache 5 min – results appear within minutes of game end
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    return res.status(200).json({ games, playoffGames });
  } catch (err) {
    return res.status(502).json({ error: err.message });
  }
}
