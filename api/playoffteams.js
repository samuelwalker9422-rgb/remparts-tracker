// Vercel serverless function — returns which QMJHL teams are still active in the playoffs.
// Fetches the full season_id=212 schedule (56 games, 8 Best-of-7 series).
// Active teams = have at least one game with final=0 (game not yet played).
// Eliminated teams = all their remaining games are gone (opponent reached 4 wins).
//
// Response: { activeCodes: [...], eliminatedCodes: [...], series: [...] }

const SCHEDULE_URL =
  'https://cluster.leaguestat.com/feed/' +
  '?feed=modulekit&view=schedule' +
  '&key=f1aa699db3d81487&client_code=lhjmq&site_id=2&lang_id=1' +
  '&season_id=212';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function setCors(res) {
  for (const [k, v] of Object.entries(CORS_HEADERS)) res.setHeader(k, v);
}

function code(str) { return (str ?? '').trim().toUpperCase(); }

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const upstream = await fetch(SCHEDULE_URL, {
      headers: { 'User-Agent': 'remparts-tracker/1.0' },
    });
    if (!upstream.ok) throw new Error(`Upstream ${upstream.status}`);

    const data  = await upstream.json();
    const games = data?.SiteKit?.Schedule ?? [];

    // Group games by series (home + visitor pair, canonical alphabetical key)
    const seriesMap = {};
    for (const g of games) {
      const home    = code(g.home_team_code ?? g.HomeCode);
      const visitor = code(g.visiting_team_code ?? g.VisitorCode ?? g.visitor_team_code);
      if (!home || !visitor) continue;

      const key = [home, visitor].sort().join('_');
      if (!seriesMap[key]) {
        seriesMap[key] = { teamA: home, teamB: visitor, gamesA: 0, gamesB: 0, remaining: 0 };
      }

      const isFinal = parseInt(g.final ?? g.GameStatus ?? 0, 10) === 1 ||
                      String(g.game_status ?? g.GameStatus ?? '').toLowerCase() === 'final' ||
                      (g.home_goal_count != null && g.visiting_goal_count != null && parseInt(g.final ?? 0, 10) === 1);

      if (isFinal) {
        const homeGoals    = parseInt(g.home_goal_count    ?? g.HomeGoals    ?? 0, 10);
        const visitorGoals = parseInt(g.visiting_goal_count ?? g.VisitorGoals ?? 0, 10);
        if (homeGoals > visitorGoals) seriesMap[key].gamesA++;
        else                           seriesMap[key].gamesB++;
      } else {
        seriesMap[key].remaining++;
      }
    }

    const activeCodes    = new Set();
    const eliminatedCodes = new Set();
    const seriesSummary  = [];

    for (const [, s] of Object.entries(seriesMap)) {
      const { teamA, teamB, gamesA, gamesB, remaining } = s;

      let eliminated = null;
      let active     = null;

      if (gamesA >= 4) {
        eliminated = teamB;
        active     = teamA;
      } else if (gamesB >= 4) {
        eliminated = teamA;
        active     = teamB;
      }

      if (eliminated) {
        eliminatedCodes.add(eliminated);
        activeCodes.add(active);
      } else {
        // Series still ongoing — both teams active
        activeCodes.add(teamA);
        activeCodes.add(teamB);
      }

      seriesSummary.push({
        teams: [teamA, teamB],
        wins:  { [teamA]: gamesA, [teamB]: gamesB },
        remaining,
        eliminated,
      });
    }

    // If no schedule data yet, all teams are considered active
    const allCodes = [...activeCodes];
    [...eliminatedCodes].forEach(c => activeCodes.delete(c));

    // Cache 5 min — updates after each game
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    return res.status(200).json({
      activeCodes:    [...activeCodes],
      eliminatedCodes: [...eliminatedCodes],
      series:         seriesSummary,
    });

  } catch (err) {
    return res.status(502).json({ error: err.message, activeCodes: [], eliminatedCodes: [] });
  }
}
