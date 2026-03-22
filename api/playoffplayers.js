// Vercel serverless function — QMJHL playoff player stats (season_id=212)
// Same shape as /api/allplayers but for the playoff season.
// Returns empty players array until games are scored (stats lag ~hours after each game).

const UPSTREAM =
  'https://cluster.leaguestat.com/feed/' +
  '?feed=modulekit&view=skaters' +
  '&key=f1aa699db3d81487&client_code=lhjmq&site_id=2&lang_id=1&season_id=212';

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
function normalizePos(p) { return p === 'D' ? 'D' : p === 'G' ? 'G' : 'F'; }

function mapPlayer(p) {
  const rawNum = p.jersey_number || p.tp_jersey_number || '';
  return {
    player_id:     p.player_id,
    name:          `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim(),
    team_code:     (p.team_code ?? '').toUpperCase(),
    team_name:     p.team_name ?? '',
    position:      normalizePos(p.position),
    api_position:  p.position,
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

    const skaters = raw.filter(p => p.position !== 'G').map(mapPlayer);
    const goalies  = raw.filter(p => p.position === 'G').map(mapPlayer);
    skaters.sort((a, b) => b.pts - a.pts || b.g - a.g);
    goalies.sort((a, b) => b.gp - a.gp);
    const players = [...skaters, ...goalies];

    // Cache 5 min during playoffs — stats update after each game
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    return res.status(200).json({
      players,
      total:         players.length,
      total_skaters: skaters.length,
      total_goalies: goalies.length,
      season:        '2025-26 Playoffs',
    });

  } catch (err) {
    return res.status(502).json({ error: err.message });
  }
}
