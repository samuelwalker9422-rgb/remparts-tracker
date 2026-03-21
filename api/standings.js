// Vercel serverless function — computes QMJHL standings from schedule results
// The view=standings API returns null at season end; we compute from raw game data instead.

const SCHEDULE_URL =
  'https://lscluster.hockeytech.com/feed/?feed=modulekit&view=schedule' +
  '&key=f1aa699db3d81487&client_code=lhjmq&site_id=2&lang_id=1';

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Team code → short 3-letter abbreviation for display
const ABBR = {
  NFL: 'NFL', Mon: 'MTN', Cha: 'CLT', Hal: 'HAL', Chi: 'CHI', SJ: 'SJD',
  Rim: 'RIM', CB: 'CBE', BaC: 'BCO', Dru: 'DRU', Rou: 'RNH', BLB: 'ARM',
  Sha: 'SHA', Sher: 'PHX', VdO: 'VDO', Vic: 'VIC', Gat: 'OLY', Que: 'QUÉ',
};

function sortTeams(arr) {
  return arr.sort((a, b) =>
    b.pts - a.pts ||
    b.row - a.row ||
    b.w   - a.w   ||
    (b.gf - b.ga) - (a.gf - a.ga)
  );
}

export default async function handler(req, res) {
  for (const [k, v] of Object.entries(CORS)) res.setHeader(k, v);
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const upstream = await fetch(SCHEDULE_URL, {
      headers: { 'User-Agent': 'remparts-tracker/1.0' },
    });
    if (!upstream.ok) throw new Error(`Upstream ${upstream.status}`);
    const data  = await upstream.json();
    const games = data?.SiteKit?.Schedule ?? [];

    const teams = {}; // keyed by team code string

    function getTeam(code, name, nickname, division) {
      if (!teams[code]) {
        teams[code] = {
          code, name, nickname, division,
          abbr: ABBR[code] ?? code,
          gp: 0, w: 0, l: 0, otl: 0, pts: 0, gf: 0, ga: 0, row: 0,
        };
      }
      return teams[code];
    }

    for (const g of games) {
      if (g.final !== '1') continue; // skip unplayed/in-progress

      const hg = parseInt(g.home_goal_count, 10);
      const vg = parseInt(g.visiting_goal_count, 10);
      const ot = g.overtime  === '1';
      const so = g.shootout  === '1';
      const hWon = hg > vg;

      const home = getTeam(g.home_team_code,     g.home_team_name,     g.home_team_nickname,     g.home_team_division_long);
      const away = getTeam(g.visiting_team_code, g.visiting_team_name, g.visiting_team_nickname, g.visiting_team_division_long);

      home.gp++; away.gp++;
      home.gf += hg; home.ga += vg;
      away.gf += vg; away.ga += hg;

      const winner = hWon ? home : away;
      const loser  = hWon ? away : home;

      winner.w++;
      winner.pts += 2;
      if (!so) winner.row++; // ROW = regulation + overtime wins

      if (ot || so) {
        loser.otl++;
        loser.pts += 1;
      } else {
        loser.l++;
      }
    }

    const east = [], west = [];
    for (const t of Object.values(teams)) {
      if (t.division === 'Eastern Conference') east.push(t);
      else west.push(t);
    }

    sortTeams(east);
    sortTeams(west);

    // Cache for 5 minutes — refresh quickly after games end
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    return res.status(200).json({ east, west });
  } catch (err) {
    return res.status(502).json({ error: err.message });
  }
}
