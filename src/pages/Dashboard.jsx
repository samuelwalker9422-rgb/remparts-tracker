import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, LineChart, Line, CartesianGrid
} from 'recharts';
import { useLiveScores } from '../hooks/useLiveScores';

// ── Helpers ───────────────────────────────────────────────────────────────────
function shortDate(date) {
  return new Date(date + 'T12:00:00').toLocaleDateString('en-CA', { month: 'short', day: 'numeric' });
}
function fmt(date) {
  return new Date(date + 'T12:00:00').toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric' });
}
function isoDay(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
}
function dayLabel(dateStr) {
  const today = isoDay(0), yesterday = isoDay(-1), tomorrow = isoDay(1);
  if (dateStr === today)     return 'Today';
  if (dateStr === yesterday) return 'Yesterday';
  if (dateStr === tomorrow)  return 'Tomorrow';
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric' });
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#1c1c1c', border: '1px solid #333', borderRadius: 8, padding: '0.6rem 0.9rem', fontSize: '0.8rem' }}>
      <div style={{ fontWeight: 800, marginBottom: 4 }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ color: p.color, fontWeight: 600 }}>{p.name}: {p.value}</div>
      ))}
    </div>
  );
};

// ── Timezone label map (from LeagueStat API Timezone field) ──────────────────
const TZ_LABEL = {
  'Canada/Eastern':      'ET',
  'Canada/Atlantic':     'AT',
  'Canada/Newfoundland': 'NT',
};

// ── Short name map ────────────────────────────────────────────────────────────
// API uses "City, Nickname" format
const SHORT = {
  'Moncton, Wildcats':             'MNT', 'Chicoutimi, Saguenéens':       'CHI',
  'Newfoundland, Regiment':        'NFR', 'Charlottetown, Islanders':     'CLT',
  'Québec, Remparts':              'QUÉ', 'Cape Breton, Eagles':          'CBE',
  'Halifax, Mooseheads':           'HAL', 'Saint John, Sea Dogs':         'SJN',
  'Drummondville, Voltigeurs':     'DRU', 'Rouyn-Noranda, Huskies':       'RNH',
  'Blainville-Boisbriand, Armada': 'BLV', 'Shawinigan, Cataractes':       'SHA',
  'Sherbrooke, Phœnix':            'SHB', "Val-d'Or, Foreurs":            'VDO',
  'Victoriaville, Tigres':         'VIC', 'Gatineau, Olympiques':         'GAT',
  'Baie-Comeau, Drakkar':          'BCO', 'Rimouski, Océanic':            'RIM',
};
const abbr = name => !name ? '???' : (SHORT[name] ?? name.split(/[,\s]/)[0].slice(0, 3).toUpperCase());

function fmtScorebarTime(g) {
  const raw = g.ScheduledTime; // e.g. "19:00:00"
  if (!raw) return g.GameStatusString ?? 'TBD';
  let [h, m] = raw.split(':').map(Number);
  let label = TZ_LABEL[g.Timezone] ?? '';
  // Newfoundland: subtract 30 min (API stores AT-equivalent, local NT is 30 min earlier)
  if (g.Timezone === 'Canada/Newfoundland') {
    const total = h * 60 + m - 30;
    h = Math.floor(total / 60) % 24;
    m = total % 60;
    label = 'NT';
  }
  const ampm = h >= 12 ? 'pm' : 'am';
  const h12  = h === 0 ? 12 : h > 12 ? h - 12 : h;
  const mins = m === 0 ? '' : `:${String(m).padStart(2, '0')}`;
  return `${h12}${mins} ${ampm}${label ? ` ${label}` : ''}`;
}

function gameStatus(g) {
  if (g.GameStatus === '4') return { text: 'FINAL',             cls: 'db-final' };
  if (g.GameStatus === '2') return { text: `P${g.Period} LIVE`, cls: 'db-live'  };
  if (g.GameStatus === '3') return { text: `END P${g.Period}`,  cls: 'db-int'   };
  return { text: fmtScorebarTime(g), cls: 'db-pre' };
}

// ── League Scoreboard ─────────────────────────────────────────────────────────
function LeagueScoreboard() {
  const { games, loading } = useLiveScores();

  if (loading) return (
    <div className="db-scores-loading">Loading QMJHL scores…</div>
  );

  // Group by date, sort dates
  const groups = {};
  games.forEach(g => {
    if (!groups[g.Date]) groups[g.Date] = [];
    groups[g.Date].push(g);
  });

  // Show yesterday → today → tomorrow (max 3 days)
  const relevantDates = [isoDay(-1), isoDay(0), isoDay(1)]
    .filter(d => groups[d]);

  // If no relevant dates, just show the first date available
  const showDates = relevantDates.length ? relevantDates : Object.keys(groups).slice(0, 1);

  return (
    <div className="db-scoreboard section-gap">
      {showDates.map(date => (
        <div key={date} className="db-score-group">
          <div className="db-date-label">{dayLabel(date)}</div>
          <div className="db-score-grid">
            {groups[date].map(g => {
              const { text, cls } = gameStatus(g);
              const isRem  = g.HomeLongName === 'Québec, Remparts' || g.VisitorLongName === 'Québec, Remparts';
              const isLive = g.GameStatus === '2' || g.GameStatus === '3';
              const started = g.GameStatus !== '1';
              return (
                <div key={g.ID} className={`db-game-card${isRem ? ' db-game-rem' : ''}${isLive ? ' db-game-live' : ''}`}>
                  <div className={`db-game-status ${cls}`}>
                    {isLive && <span className="sc-dot" />}
                    {text}
                  </div>
                  <div className="db-game-teams">
                    <div className="db-game-row">
                      {g.VisitorLogo && <img src={g.VisitorLogo} alt="" className="db-logo" />}
                      <span className="db-team-abbr">{abbr(g.VisitorLongName)}</span>
                      <span className="db-team-score">{started ? g.VisitorGoals : '-'}</span>
                    </div>
                    <div className="db-game-row">
                      {g.HomeLogo && <img src={g.HomeLogo} alt="" className="db-logo" />}
                      <span className="db-team-abbr">{abbr(g.HomeLongName)}</span>
                      <span className="db-team-score">{started ? g.HomeGoals : '-'}</span>
                    </div>
                  </div>
                  {isRem && <div className="db-rem-tag">REMPARTS</div>}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── League Standings (hardcoded — final 2025-26 regular season) ───────────────
const EAST = [
  { name: 'Moncton Wildcats',             abbr: 'MNT', gp: 62, w: 48, l: 10, otl: 4, pts: 100 },
  { name: 'Chicoutimi Saguenéens',        abbr: 'CHI', gp: 62, w: 47, l: 10, otl: 5, pts: 99  },
  { name: 'Newfoundland Regiment',        abbr: 'NFR', gp: 62, w: 36, l: 22, otl: 4, pts: 76  },
  { name: 'Charlottetown Islanders',      abbr: 'CLT', gp: 62, w: 33, l: 21, otl: 8, pts: 74  },
  { name: 'Québec Remparts',              abbr: 'QUÉ', gp: 62, w: 32, l: 24, otl: 5, pts: 70  },
  { name: 'Cape Breton Eagles',           abbr: 'CBE', gp: 62, w: 27, l: 22, otl:13, pts: 67  },
  { name: 'Halifax Mooseheads',           abbr: 'HAL', gp: 62, w: 29, l: 27, otl: 6, pts: 64  },
  { name: 'Saint John Sea Dogs',          abbr: 'SJN', gp: 62, w: 22, l: 35, otl: 5, pts: 49  },
  { name: 'Rimouski Océanic',             abbr: 'RIM', gp: 62, w: 18, l: 43, otl: 1, pts: 37  },
  { name: 'Baie-Comeau Drakkar',          abbr: 'BCO', gp: 62, w: 14, l: 42, otl: 6, pts: 34  },
];
const WEST = [
  { name: 'Drummondville Voltigeurs',     abbr: 'DRU', gp: 62, w: 39, l: 17, otl: 6, pts: 84 },
  { name: 'Rouyn-Noranda Huskies',        abbr: 'RNH', gp: 62, w: 38, l: 17, otl: 7, pts: 83 },
  { name: 'Blainville-Boisbriand Armada', abbr: 'BLV', gp: 62, w: 38, l: 18, otl: 6, pts: 82 },
  { name: 'Shawinigan Cataractes',        abbr: 'SHA', gp: 62, w: 33, l: 23, otl: 6, pts: 72 },
  { name: "Sherbrooke Phœnix",            abbr: 'SHB', gp: 62, w: 33, l: 24, otl: 5, pts: 71 },
  { name: "Val-d'Or Foreurs",             abbr: 'VDO', gp: 62, w: 26, l: 29, otl: 7, pts: 59 },
  { name: 'Victoriaville Tigres',         abbr: 'VIC', gp: 62, w: 23, l: 34, otl: 5, pts: 51 },
  { name: 'Gatineau Olympiques',          abbr: 'GAT', gp: 62, w: 20, l: 37, otl: 5, pts: 45 },
];

function StandingsTable({ conf, rows }) {
  return (
    <div className="db-standings">
      <div className="db-standings-title">{conf}</div>
      <table className="db-std-table">
        <thead>
          <tr>
            <th>#</th><th className="left">Team</th>
            <th>GP</th><th>W</th><th>L</th><th>OTL</th><th className="pts-col">PTS</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((t, i) => {
            const isRem = t.name === 'Québec Remparts';
            const inPlayoffs = i < 8;
            return (
              <tr key={t.abbr} className={`${isRem ? 'std-remparts' : ''}${inPlayoffs ? ' std-playoff' : ''}`}>
                <td style={{ color: 'var(--muted)', fontSize: '0.7rem' }}>{i + 1}</td>
                <td className="left">
                  <span className="std-abbr">{t.abbr}</span>
                  {i === 7 && <span className="std-cutline" title="Playoff cutline" />}
                </td>
                <td>{t.gp}</td>
                <td>{t.w}</td>
                <td>{t.l}</td>
                <td>{t.otl}</td>
                <td className="pts-col"><strong>{t.pts}</strong></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── League Scoring Leaders ────────────────────────────────────────────────────
const LEADERS = [
  { name: 'Maxim Massé',        team: 'CHI', g: 50, a: 49, pts: 99 },
  { name: 'Philippe Veilleux',  team: 'VDO', g: 42, a: 53, pts: 95 },
  { name: 'Thomas Verdon',      team: 'RNH', g: 34, a: 57, pts: 91 },
  { name: 'Justin Larose',      team: 'NFR', g: 32, a: 54, pts: 86 },
  { name: 'Nathan Leek',        team: 'CLT', g: 47, a: 36, pts: 83 },
  { name: 'Egor Shilov',        team: 'VIC', g: 32, a: 50, pts: 82 },
  { name: 'Justin Carbonneau',  team: 'BLV', g: 51, a: 29, pts: 80 },
  { name: 'Alexey Vlasov',      team: 'VIC', g: 44, a: 35, pts: 79 },
  { name: 'Félix Lacerte',      team: 'SHA', g: 36, a: 43, pts: 79 },
  { name: 'Tommy Bleyl',        team: 'MNT', g: 13, a: 66, pts: 79 },
];

function LeagueLeaders() {
  return (
    <div className="db-leaders">
      <div className="db-standings-title">Scoring Leaders · 2025-26</div>
      <table className="db-std-table">
        <thead>
          <tr>
            <th>#</th>
            <th className="left">Player</th>
            <th>Team</th><th>G</th><th>A</th>
            <th className="pts-col">PTS</th>
          </tr>
        </thead>
        <tbody>
          {LEADERS.map((p, i) => (
            <tr key={p.name} className={p.team === 'QUÉ' ? 'std-remparts' : ''}>
              <td style={{ color: i < 3 ? 'var(--red)' : 'var(--muted)', fontWeight: i < 3 ? 800 : 400, fontSize: '0.7rem' }}>{i + 1}</td>
              <td className="left" style={{ fontWeight: 600 }}>{p.name}</td>
              <td style={{ color: 'var(--muted)', fontSize: '0.72rem' }}>{p.team}</td>
              <td>{p.g}</td><td>{p.a}</td>
              <td className="pts-col"><strong>{p.pts}</strong></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function Dashboard({ onNav, teamData }) {
  const { team, skaters, schedule } = teamData;
  const completed = schedule.filter(g => g.result !== 'upcoming');
  const upcoming  = schedule.filter(g => g.result === 'upcoming');
  const nextGame  = upcoming[0];
  const recent    = [...completed].slice(-5).reverse();
  const last5     = [...completed].slice(-5);

  const sorted     = [...skaters].sort((a, b) => b.pts - a.pts);
  const topScorer  = sorted[0];
  const topGoals   = [...skaters].sort((a, b) => b.g - a.g)[0];
  const topAssists = [...skaters].sort((a, b) => b.a - a.a)[0];

  const chartData = completed.map(g => ({ name: shortDate(g.date), GF: g.gf, GA: g.ga }));
  let cumPts = 0;
  const pointsTrend = completed.map(g => {
    if (g.result === 'W') cumPts += 2;
    else if (g.result === 'OTL') cumPts += 1;
    return { name: shortDate(g.date), Points: cumPts };
  });

  const gp   = team.record.w + team.record.l + team.record.otl + (team.record.sol || 0);
  const diff = team.goalsFor - team.goalsAgainst;

  return (
    <div className="page">

      {/* ── QMJHL SCOREBOARD ────────────────────────────────────────────── */}
      <div className="espn-header">
        <div className="espn-header-bar" />
        <h2>QMJHL Scores</h2>
        <span className="subtitle">Live · Updated automatically</span>
      </div>
      <LeagueScoreboard />

      {/* ── REMPARTS HERO ────────────────────────────────────────────────── */}
      <div className="espn-header">
        <div className="espn-header-bar" />
        <h2>Québec Remparts</h2>
        <span className="subtitle">2025-26 Season · LHJMQ</span>
      </div>

      <div className="db-main-grid section-gap">

        {/* LEFT — Remparts focus */}
        <div className="db-left">
          <div className="team-hero">
            <div>
              <div className="team-hero-name">
                <span>{team.fullName} · LHJMQ</span>
                {team.name}
              </div>
              <div className="team-hero-record">
                <strong>{team.record.w}–{team.record.l}–{team.record.otl}{team.record.sol != null ? `–${team.record.sol}` : ''}</strong>
                &nbsp;·&nbsp; {gp} GP &nbsp;·&nbsp; GF/GA {team.goalsFor}/{team.goalsAgainst}&nbsp;
                <span style={{ color: diff >= 0 ? 'var(--green)' : 'var(--red)' }}>({diff >= 0 ? '+' : ''}{diff})</span>
              </div>
              <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span className={`badge badge-${team.streak?.slice(-1)}`}>{team.streak}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Current streak</span>
                <span className="db-seed-badge">🏒 5th East</span>
              </div>
            </div>
            <div className="hero-badge">
              <div className="hero-pts">{team.points}</div>
              <div className="hero-pts-label">Points</div>
            </div>
          </div>

          {/* Quick stats */}
          <div className="stat-grid stat-grid-4" style={{ marginTop: '0.75rem' }}>
            <div className="stat-card">
              <div className="stat-label">Wins</div>
              <div className="stat-val green">{team.record.w}</div>
              <div className="stat-sub">{gp > 0 ? ((team.record.w / gp) * 100).toFixed(0) : 0}% rate</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Goals For</div>
              <div className="stat-val">{team.goalsFor}</div>
              <div className="stat-sub">{gp > 0 ? (team.goalsFor / gp).toFixed(1) : 0}/gm</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Goals Against</div>
              <div className="stat-val red">{team.goalsAgainst}</div>
              <div className="stat-sub">{gp > 0 ? (team.goalsAgainst / gp).toFixed(1) : 0}/gm</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Diff</div>
              <div className="stat-val" style={{ color: diff >= 0 ? 'var(--green)' : 'var(--red)' }}>
                {diff >= 0 ? '+' : ''}{diff}
              </div>
              <div className="stat-sub">Goal diff</div>
            </div>
          </div>

          {/* Recent + Next */}
          <div className="two-col" style={{ marginTop: '0.75rem' }}>
            <div className="card">
              <h2>Last 5 Games</h2>
              {recent.map(g => (
                <div className="recent-row" key={g.id}>
                  <span className="game-date">{shortDate(g.date)}</span>
                  <span className="recent-opp">{g.home ? 'vs' : '@'} {g.opponent}</span>
                  <span className="recent-score">{g.gf}–{g.ga}</span>
                  <span className={`badge badge-${g.result}`}>{g.result}</span>
                </div>
              ))}
              <div style={{ marginTop: '0.85rem' }}>
                <h2>Form</h2>
                <div className="form-row" style={{ marginTop: '0.5rem' }}>
                  {last5.map(g => (
                    <div className="form-item" key={g.id}>
                      <span className={`badge badge-${g.result}`}>{g.result}</span>
                      <small>{g.gf}-{g.ga}</small>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {nextGame ? (
                <div className="card" style={{ borderLeft: '4px solid var(--green)' }}>
                  <h2>Next Game</h2>
                  <div className="next-opp">{nextGame.home ? 'vs' : '@'} {nextGame.opponent}</div>
                  <div className="next-details">
                    {fmt(nextGame.date)}&nbsp;·&nbsp;
                    <span className="badge badge-loc">{nextGame.home ? 'Home' : 'Away'}</span>
                  </div>
                </div>
              ) : (
                <div className="card" style={{ borderLeft: '4px solid gold' }}>
                  <h2>Next Game</h2>
                  <div style={{ color: 'gold', fontWeight: 700, marginTop: '0.3rem' }}>🏆 Playoffs</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '0.2rem' }}>5th seed · Eastern Conf</div>
                </div>
              )}
              <div className="card">
                <h2>Season Summary</h2>
                <div className="ha-row"><span className="ha-label">Home</span><span className="ha-val">{team.home.w}-{team.home.l}-{team.home.otl}-{team.home.sol || 0}</span></div>
                <div className="ha-row"><span className="ha-label">Away</span><span className="ha-val">{team.away.w}-{team.away.l}-{team.away.otl}{(team.away.sol||0)>0?`-${team.away.sol}`:''}</span></div>
                <div className="ha-row"><span className="ha-label">Points %</span><span className="ha-val">{gp > 0 ? ((team.points / (gp * 2)) * 100).toFixed(1) : 0}%</span></div>
                <div className="ha-row"><span className="ha-label">Avg GF</span><span className="ha-val" style={{ color: 'var(--green)' }}>{gp > 0 ? (team.goalsFor / gp).toFixed(2) : 0}</span></div>
                <div className="ha-row"><span className="ha-label">Avg GA</span><span className="ha-val" style={{ color: 'var(--red)' }}>{gp > 0 ? (team.goalsAgainst / gp).toFixed(2) : 0}</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT — League context */}
        <div className="db-right">
          <div className="two-col db-standings-grid">
            <StandingsTable conf="Eastern Conference" rows={EAST} />
            <StandingsTable conf="Western Conference" rows={WEST} />
          </div>
          <div style={{ marginTop: '1rem' }}>
            <LeagueLeaders />
          </div>
        </div>
      </div>

      {/* ── REMPARTS TEAM LEADERS ────────────────────────────────────────── */}
      <div className="espn-header" style={{ marginTop: '1.5rem' }}>
        <div className="espn-header-bar" />
        <h2>Remparts Leaders</h2>
        <span className="subtitle">Recent stretch stats</span>
      </div>
      <div className="leaders-grid section-gap">
        {[
          { cat: 'Points Leader', player: topScorer,  val: topScorer?.pts,  unit: 'PTS' },
          { cat: 'Goals Leader',  player: topGoals,   val: topGoals?.g,     unit: 'G'   },
          { cat: 'Assists Leader',player: topAssists, val: topAssists?.a,   unit: 'A'   },
        ].map(({ cat, player, val, unit }) => player ? (
          <div className="leader-card" key={cat}>
            {player.photo && (
              <img className="leader-photo" src={player.photo} alt={player.name}
                onError={e => { e.target.style.display = 'none'; }} />
            )}
            {!player.photo && (
              <div className="leader-photo" style={{ background: 'var(--surface3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1rem', color: 'var(--red)' }}>
                #{player.num}
              </div>
            )}
            <div className="leader-info">
              <div className="leader-cat">{cat}</div>
              <div className="leader-name">{player.name}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: '0.15rem' }}>#{player.num} · {player.pos}</div>
            </div>
            <div className="leader-val">{val}<span style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 600 }}> {unit}</span></div>
          </div>
        ) : null)}
      </div>

      {/* ── CHARTS ───────────────────────────────────────────────────────── */}
      <div className="espn-header">
        <div className="espn-header-bar" />
        <h2>Game-by-Game Charts</h2>
      </div>
      <div className="two-col section-gap">
        <div className="card">
          <h2>Goals For / Against — Per Game</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fill: '#666', fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: '#666', fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Legend wrapperStyle={{ fontSize: '0.72rem', paddingTop: 8 }} />
              <Bar dataKey="GF" fill="#00a651" radius={[3,3,0,0]} />
              <Bar dataKey="GA" fill="#cc0000" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <h2>Cumulative Points Trend</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={pointsTrend} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid stroke="#222" strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fill: '#666', fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: '#666', fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="Points" stroke="#cc0000" strokeWidth={2.5} dot={{ fill: '#cc0000', r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
