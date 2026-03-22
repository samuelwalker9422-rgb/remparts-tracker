// Vercel serverless function — all QMJHL players (skaters + goalies) for fantasy draft
// Returns: player_id, name, team_code, team_name, position (F/D/G), jersey_number,
//          gp, g, a, pts, plus_minus, ppg, ppa, shg, pim, photo_id
//          Goalies also get: wins, gaa, sv_pct (g/a/pts/ppg/ppa/shg/pim → 0)

const BASE =
  'https://cluster.leaguestat.com/feed/' +
  '?feed=modulekit&key=f1aa699db3d81487&client_code=lhjmq&site_id=2&lang_id=1&season_id=211';

const UPSTREAM_SKATERS = BASE + '&view=skaters';
const UPSTREAM_GOALIES = BASE + '&view=goalies';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function setCors(res) {
  for (const [k, v] of Object.entries(CORS_HEADERS)) res.setHeader(k, v);
}

const photo = id => `https://assets.leaguestat.com/lhjmq/240x240/${id}.jpg`;

function int(v)   { return parseInt(v,  10) || 0; }
function float(v) { return parseFloat(v)    || 0; }

function normalizePos(apiPos) {
  if (apiPos === 'D') return 'D';
  if (apiPos === 'G') return 'G';
  return 'F';  // C, LW, RW, W, F
}

function mapSkater(p) {
  const rawNum = p.jersey_number || p.tp_jersey_number || '';
  return {
    player_id:    p.player_id,
    name:         `${p.first_name} ${p.last_name}`.trim(),
    team_code:    (p.team_code ?? '').toUpperCase(),
    team_name:    p.team_name ?? '',
    position:     normalizePos(p.position),
    api_position: p.position,   // raw value (C, LW, RW, D) — useful for line assignment
    jersey_number: rawNum ? parseInt(rawNum, 10) : null,
    photo_id:     p.player_id,
    photo_url:    photo(p.player_id),
    gp:           int(p.games_played),
    g:            int(p.goals),
    a:            int(p.assists),
    pts:          int(p.points),
    plus_minus:   int(p.plus_minus),
    ppg:          int(p.power_play_goals),
    ppa:          int(p.power_play_assists),
    shg:          int(p.short_handed_goals),
    pim:          int(p.penalty_minutes),
    // Goalie-specific fields are null for skaters
    wins:   null,
    gaa:    null,
    sv_pct: null,
  };
}

function mapGoalie(p) {
  const rawNum = p.jersey_number || p.tp_jersey_number || '';
  return {
    player_id:    p.player_id,
    name:         `${p.first_name} ${p.last_name}`.trim(),
    team_code:    (p.team_code ?? '').toUpperCase(),
    team_name:    p.team_name ?? '',
    position:     'G',
    api_position: 'G',
    jersey_number: rawNum ? parseInt(rawNum, 10) : null,
    photo_id:     p.player_id,
    photo_url:    photo(p.player_id),
    gp:           int(p.games_played),
    g:            0,
    a:            0,
    pts:          0,
    plus_minus:   0,
    ppg:          0,
    ppa:          0,
    shg:          0,
    pim:          0,
    wins:         int(p.wins),
    gaa:          float(p.goals_against_average),
    sv_pct:       float(p.save_percentage),
  };
}

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const [skatersRes, goaliesRes] = await Promise.all([
      fetch(UPSTREAM_SKATERS, { headers: { 'User-Agent': 'remparts-tracker/1.0' } }),
      fetch(UPSTREAM_GOALIES, { headers: { 'User-Agent': 'remparts-tracker/1.0' } }),
    ]);

    if (!skatersRes.ok) throw new Error(`Skaters upstream ${skatersRes.status}`);
    if (!goaliesRes.ok) throw new Error(`Goalies upstream ${goaliesRes.status}`);

    const [skatersData, goaliesData] = await Promise.all([
      skatersRes.json(),
      goaliesRes.json(),
    ]);

    const rawSkaters = skatersData?.SiteKit?.Skaters ?? [];
    const rawGoalies = goaliesData?.SiteKit?.Goalies  ?? [];

    const skaters = rawSkaters
      .filter(p => p.position !== 'G')   // guard: exclude any misrouted goalies
      .map(mapSkater);

    const goalies = rawGoalies.map(mapGoalie);

    // Sort: skaters by pts desc, goalies by wins desc — then merge
    skaters.sort((a, b) => b.pts - a.pts || b.g - a.g);
    goalies.sort((a, b) => b.wins - a.wins || b.gp - a.gp);

    const players = [...skaters, ...goalies];

    // Cache 10 min — totals stable between games
    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=1200');
    return res.status(200).json({ players, total: players.length });

  } catch (err) {
    return res.status(502).json({ error: err.message });
  }
}
