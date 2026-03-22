// Vercel serverless function — all QMJHL players (skaters + goalies) for fantasy draft
// All 625 players live in view=skaters — goalies have position='G' in the same array.
// There is no separate goalie endpoint in this API.
// Returns: player_id, name, team_code, team_name, position (F/D/G), api_position,
//          jersey_number, gp, g, a, pts, plus_minus, ppg, ppa, shg, pim, photo_url
//          Goalies: wins/gaa/sv_pct are null (not available from this endpoint)

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

const photo = id => `https://assets.leaguestat.com/lhjmq/240x240/${id}.jpg`;

function int(v) { return parseInt(v, 10) || 0; }

function normalizePos(apiPos) {
  if (apiPos === 'D') return 'D';
  if (apiPos === 'G') return 'G';
  return 'F';  // C, LW, RW, W, F
}

function mapPlayer(p) {
  const rawNum = p.jersey_number || p.tp_jersey_number || '';
  return {
    player_id:     p.player_id,
    name:          `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim(),
    team_code:     (p.team_code ?? '').toUpperCase(),
    team_name:     p.team_name ?? '',
    position:      normalizePos(p.position),
    api_position:  p.position,   // raw (C, LW, RW, D, G) — useful for line slot validation
    jersey_number: rawNum ? parseInt(rawNum, 10) : null,
    photo_url:     photo(p.player_id),
    gp:            int(p.games_played),
    g:             int(p.goals),
    a:             int(p.assists),
    pts:           int(p.points),
    plus_minus:    int(p.plus_minus),
    ppg:           int(p.power_play_goals),
    ppa:           int(p.power_play_assists),
    shg:           int(p.short_handed_goals),
    pim:           int(p.penalty_minutes),
    // Goalie season stats are not available in this endpoint
    wins:   null,
    gaa:    null,
    sv_pct: null,
  };
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
    const raw  = data?.SiteKit?.Skaters ?? [];

    // Partition — sort skaters by pts desc, goalies by gp desc
    const skaters = raw.filter(p => p.position !== 'G').map(mapPlayer);
    const goalies  = raw.filter(p => p.position === 'G').map(mapPlayer);

    skaters.sort((a, b) => b.pts - a.pts || b.g - a.g);
    goalies.sort((a, b) => b.gp  - a.gp);

    const players = [...skaters, ...goalies];

    // Cache 10 min — totals stable between games
    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=1200');
    return res.status(200).json({
      players,
      total:        players.length,
      total_skaters: skaters.length,
      total_goalies: goalies.length,
    });

  } catch (err) {
    return res.status(502).json({ error: err.message });
  }
}
