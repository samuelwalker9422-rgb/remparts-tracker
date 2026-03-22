import { useState, useEffect, useRef } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, LineChart, Line, CartesianGrid
} from 'recharts';
import { useLiveScores }        from '../hooks/useLiveScores';
import { useLiveLeaders }       from '../hooks/useLiveLeaders';
import { useStandings }         from '../hooks/useStandings';
import { useGameLinks }         from '../hooks/useGameLinks';
import { useRempartsSchedule }  from '../hooks/useRempartsSchedule';
import BoxScoreModal       from '../components/BoxScoreModal';

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

// ── Game-time formatter for /api/games schedule entries (IANA timezone keys) ─
const SCHED_TZ_LABEL = { 'America/Toronto': 'ET', 'America/Halifax': 'AT', 'America/St_Johns': 'NT' };
function fmtSchedTime(time, tz) {
  if (!time || !tz) return null;
  let [h, m] = time.split(':').map(Number);
  if (tz === 'America/St_Johns') { const t = h * 60 + m - 30; h = Math.floor(t / 60) % 24; m = t % 60; }
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12  = h === 0 ? 12 : h > 12 ? h - 12 : h;
  const mins = m === 0 ? '' : `:${String(m).padStart(2, '0')}`;
  return `${h12}${mins} ${ampm} ${SCHED_TZ_LABEL[tz] ?? tz}`;
}

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

function gameStatus(g, elapsedSec = 0) {
  if (g.GameStatus === '4') return { text: 'FINAL',       cls: 'db-final' };
  if (g.GameStatus === '2') {
    let clockText = 'LIVE';
    if (g.GameClock) {
      const [mm, ss] = g.GameClock.split(':').map(Number);
      let total = mm * 60 + ss - elapsedSec;
      if (total < 0) total = 0;
      const dm = Math.floor(total / 60);
      const ds = total % 60;
      clockText = `${dm}:${String(ds).padStart(2, '0')}`;
    }
    return { text: `P${g.Period} · ${clockText}`, cls: 'db-live' };
  }
  if (g.GameStatus === '3') return { text: `END P${g.Period}`, cls: 'db-int' };
  return { text: fmtScorebarTime(g), cls: 'db-pre' };
}

// ── League Scoreboard ─────────────────────────────────────────────────────────
function LeagueScoreboard({ games, loading }) {
  const [, setTick]      = useState(0);
  const fetchedAtRef     = useRef(Date.now());
  const [activeGame, setActiveGame] = useState(null);
  const gameLinks   = useGameLinks();

  // Reset the reference timestamp whenever fresh API data arrives
  useEffect(() => { fetchedAtRef.current = Date.now(); }, [games]);

  // 1-second ticker while any game is live so the clock counts down smoothly
  const hasLive = games.some(g => g.GameStatus === '2');
  useEffect(() => {
    if (!hasLive) return;
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, [hasLive]);

  if (loading) return (
    <div className="db-scores-loading">Loading QMJHL scores…</div>
  );

  const elapsedSec = Math.floor((Date.now() - fetchedAtRef.current) / 1000);

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
    <>
      {activeGame && (
        <BoxScoreModal
          gameId={activeGame.ID}
          onClose={() => setActiveGame(null)}
        />
      )}
      <div className="db-scoreboard section-gap">
        {showDates.map(date => (
          <div key={date} className="db-score-group">
            <div className="db-date-label">{dayLabel(date)}</div>
            <div className="db-score-grid">
              {groups[date].map(g => {
                const { text, cls } = gameStatus(g, elapsedSec);
                const isRem     = g.HomeLongName === 'Québec, Remparts' || g.VisitorLongName === 'Québec, Remparts';
                const isLive    = g.GameStatus === '2' || g.GameStatus === '3';
                const started   = g.GameStatus !== '1';
                const clickable = g.GameStatus !== '1';
                const floUrl    = gameLinks[String(g.ID)];
                return (
                  <div
                    key={g.ID}
                    className={`db-game-card${isRem ? ' db-game-rem' : ''}${isLive ? ' db-game-live' : ''}${clickable ? ' db-game-clickable' : ''}`}
                    onClick={clickable ? () => setActiveGame(g) : undefined}
                    title={clickable ? 'Click for box score' : undefined}
                  >
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
                    <div className="db-game-footer">
                      {clickable && <span className="db-game-tap">Box score ›</span>}
                      {floUrl && (
                        <a
                          href={floUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="db-flo-btn"
                          onClick={e => e.stopPropagation()}
                          title="Watch on FloHockey"
                        >
                          📺 Watch
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

// ── League Standings ──────────────────────────────────────────────────────────
function StandingsTable({ conf, rows, loading }) {
  const shortConf = conf === 'Eastern Conference' ? 'Eastern' : 'Western';
  return (
    <div className="db-standings">
      <div className="db-standings-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {shortConf}
        {loading
          ? <span style={{ fontSize: '0.65rem', color: 'var(--muted)', fontWeight: 400 }}>Loading…</span>
          : <span style={{ fontSize: '0.6rem', background: 'var(--red)', color: '#fff', borderRadius: 4, padding: '1px 5px', fontWeight: 700, letterSpacing: '0.04em' }}>LIVE</span>
        }
      </div>
      <table className="db-std-table">
        <thead>
          <tr>
            <th>#</th><th className="left">Team</th>
            <th>GP</th><th>W</th><th>L</th><th>OTL</th><th className="pts-col">PTS</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((t, i) => {
            const isRem      = t.name?.includes('Remparts') || t.code === 'Que' || t.nickname === 'Remparts';
            const inPlayoffs = i < 8;
            const displayAbbr = t.abbr ?? t.code ?? '???';
            return (
              <tr key={t.code ?? i} className={`${isRem ? 'std-remparts' : ''}${inPlayoffs ? ' std-playoff' : ''}`}>
                <td style={{ color: 'var(--muted)', fontSize: '0.7rem' }}>{i + 1}</td>
                <td className="left">
                  <span className="std-abbr">{displayAbbr}</span>
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
function LeagueLeaders({ leaders, loading }) {

  return (
    <div className="db-leaders">
      <div className="db-standings-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        Scoring Leaders
        {loading
          ? <span style={{ fontSize: '0.65rem', color: 'var(--muted)', fontWeight: 400 }}>Loading…</span>
          : <span style={{ fontSize: '0.6rem', background: 'var(--red)', color: '#fff', borderRadius: 4, padding: '1px 5px', fontWeight: 700, letterSpacing: '0.04em' }}>LIVE</span>
        }
      </div>
      <table className="db-std-table">
        <thead>
          <tr>
            <th>#</th>
            <th className="left">Player</th>
            <th>Team</th><th>GP</th><th>G</th><th>A</th>
            <th className="pts-col">PTS</th>
          </tr>
        </thead>
        <tbody>
          {leaders.map((p, i) => {
            const code  = (p.team_code ?? '').toUpperCase();
            const isRem = code === 'QUE' || code === 'QUÉ' || p.name?.includes('Remparts');
            return (
              <tr key={p.player_id ?? p.name} className={isRem ? 'std-remparts' : ''}>
                <td style={{ color: i < 3 ? 'var(--red)' : 'var(--muted)', fontWeight: i < 3 ? 800 : 400, fontSize: '0.7rem' }}>{i + 1}</td>
                <td className="left" style={{ fontWeight: 600 }}>{p.name}</td>
                <td style={{ color: 'var(--muted)', fontSize: '0.72rem' }}>{p.team_code}</td>
                <td style={{ color: 'var(--muted)' }}>{p.gp}</td>
                <td>{p.goals}</td><td>{p.assists}</td>
                <td className="pts-col"><strong>{p.points}</strong></td>
              </tr>
            );
          })}
          {!loading && leaders.length === 0 && (
            <tr><td colSpan={7} style={{ color: 'var(--muted)', fontSize: '0.8rem', textAlign: 'center', padding: '0.75rem' }}>No data available</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function Dashboard({ onNav, teamData }) {
  const { team, skaters, schedule } = teamData;

  // ── Live data hooks ────────────────────────────────────────────────────────
  const { east: liveEast, west: liveWest, loading: standingsLoading, refresh: refreshStandings } = useStandings();
  const { leaders, loading: leadersLoading, refresh: refreshLeaders, setLiveMode }               = useLiveLeaders();

  // ── Cross-hook coordination: when a game ends → refresh standings + leaders
  const { games, loading: scoresLoading, error: scoresError, lastFinishedAt } = useLiveScores();
  useEffect(() => {
    if (!lastFinishedAt) return;
    // Small delay so the API has time to finalise the game record
    const t = setTimeout(() => {
      refreshStandings();
      refreshLeaders();
    }, 5_000);
    return () => clearTimeout(t);
  }, [lastFinishedAt]);

  // Keep leaders in fast-poll mode while any game is live
  useEffect(() => {
    const live = games.some(g => g.GameStatus === '2' || g.GameStatus === '3');
    setLiveMode(live);
  }, [games]);

  // Live Remparts schedule from /api/games — falls back to data.js while loading
  const { schedule: liveSchedule, playoffGames: livePlayoffGames } = useRempartsSchedule();
  const activeSchedule = liveSchedule.length > 0 ? liveSchedule : schedule;

  const completed = activeSchedule.filter(g => g.result !== 'upcoming');
  const upcoming  = activeSchedule.filter(g => g.result === 'upcoming');

  // Next game: check playoff upcoming first, then regular season
  const nextPlayoffGame = livePlayoffGames.find(g => g.result === 'upcoming') ?? null;
  const nextGame        = nextPlayoffGame ?? upcoming[0] ?? null;
  const nextIsPlayoff   = nextGame !== null && nextGame === nextPlayoffGame;
  const recent    = [...completed].slice(-5).reverse();
  const last5     = [...completed].slice(-5);

  // Home/Away split derived from live schedule
  const homeGames = completed.filter(g => g.home);
  const awayGames = completed.filter(g => !g.home);
  const homeRecord = {
    w:   homeGames.filter(g => g.result === 'W').length,
    l:   homeGames.filter(g => g.result === 'L').length,
    otl: homeGames.filter(g => g.result === 'OTL').length,
  };
  const awayRecord = {
    w:   awayGames.filter(g => g.result === 'W').length,
    l:   awayGames.filter(g => g.result === 'L').length,
    otl: awayGames.filter(g => g.result === 'OTL').length,
  };

  const sorted     = [...skaters].sort((a, b) => b.pts - a.pts);
  const topScorer  = sorted[0];
  const topGoals   = [...skaters].sort((a, b) => b.g - a.g)[0];
  const topAssists = [...skaters].sort((a, b) => b.a - a.a)[0];

  // Charts use live schedule; skip games with null scores (upcoming)
  const chartData = completed
    .filter(g => g.gf !== null)
    .map(g => ({ name: shortDate(g.date), GF: g.gf, GA: g.ga }));
  let cumPts = 0;
  const pointsTrend = completed
    .filter(g => g.result !== 'upcoming')
    .map(g => {
      if (g.result === 'W') cumPts += 2;
      else if (g.result === 'OTL') cumPts += 1;
      return { name: shortDate(g.date), Points: cumPts };
    });

  // Use live standings entry for Remparts when available
  const rem  = liveEast.find(t => t.code === 'Que');
  const gp   = rem ? rem.gp  : team.record.w + team.record.l + team.record.otl + (team.record.sol || 0);
  const recW = rem ? rem.w   : team.record.w;
  const recL = rem ? rem.l   : team.record.l;
  const recOTL = rem ? rem.otl : team.record.otl;
  const pts  = rem ? rem.pts : team.points;
  const gf   = rem ? rem.gf  : team.goalsFor;
  const ga   = rem ? rem.ga  : team.goalsAgainst;
  const diff = gf - ga;

  // Live streak from completed games
  let liveStreak = '—';
  if (completed.length > 0) {
    const rev  = [...completed].reverse();
    const type = rev[0].result;
    let cnt = 0;
    for (const g of rev) { if (g.result === type) cnt++; else break; }
    liveStreak = `${type}${cnt}`;
  }

  // Live seed from standings position in east array
  const remIdx   = liveEast.findIndex(t => t.code === 'Que');
  const liveSeed = remIdx >= 0 ? remIdx + 1 : null;
  const seedSfx  = liveSeed === 1 ? 'st' : liveSeed === 2 ? 'nd' : liveSeed === 3 ? 'rd' : 'th';
  const seedLabel = liveSeed ? `${liveSeed}${seedSfx} East` : '— East';

  return (
    <div className="page">

      {/* ── QMJHL SCOREBOARD ────────────────────────────────────────────── */}
      <div className="espn-header">
        <div className="espn-header-bar" />
        <h2>QMJHL Scores</h2>
        <span className="subtitle">Live · Updated automatically</span>
      </div>
      <LeagueScoreboard games={games} loading={scoresLoading} />

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
                <strong>{recW}–{recL}–{recOTL}</strong>
                &nbsp;·&nbsp; {gp} GP &nbsp;·&nbsp; GF/GA {gf}/{ga}&nbsp;
                <span style={{ color: diff >= 0 ? 'var(--green)' : 'var(--red)' }}>({diff >= 0 ? '+' : ''}{diff})</span>
              </div>
              <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span className={`badge badge-${liveStreak.charAt(0)}`}>{liveStreak}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Current streak</span>
                <span className="db-seed-badge">🏒 {seedLabel}</span>
              </div>
            </div>
            <div className="hero-badge">
              <div className="hero-pts">{pts}</div>
              <div className="hero-pts-label">Points</div>
            </div>
          </div>

          {/* Quick stats */}
          <div className="stat-grid stat-grid-4" style={{ marginTop: '0.75rem' }}>
            <div className="stat-card">
              <div className="stat-label">Wins</div>
              <div className="stat-val green">{recW}</div>
              <div className="stat-sub">{gp > 0 ? ((recW / gp) * 100).toFixed(0) : 0}% rate</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Goals For</div>
              <div className="stat-val">{gf}</div>
              <div className="stat-sub">{gp > 0 ? (gf / gp).toFixed(1) : 0}/gm</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Goals Against</div>
              <div className="stat-val red">{ga}</div>
              <div className="stat-sub">{gp > 0 ? (ga / gp).toFixed(1) : 0}/gm</div>
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
                <div className="card" style={{ borderLeft: `4px solid ${nextIsPlayoff ? 'gold' : 'var(--green)'}` }}>
                  <h2>Next Game</h2>
                  {nextIsPlayoff && (
                    <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'gold', letterSpacing: '0.06em', marginBottom: '4px' }}>
                      🏆 GAME {nextGame.gameNum} · PLAYOFFS
                    </div>
                  )}
                  <div className="next-opp">{nextGame.home ? 'vs' : '@'} {nextGame.opponent}</div>
                  <div className="next-details">
                    {fmt(nextGame.date)}&nbsp;·&nbsp;
                    {fmtSchedTime(nextGame.time, nextGame.tz) && (
                      <>{fmtSchedTime(nextGame.time, nextGame.tz)}&nbsp;·&nbsp;</>
                    )}
                    <span className="badge badge-loc">{nextGame.home ? 'Home' : 'Away'}</span>
                  </div>
                </div>
              ) : (
                <div className="card">
                  <h2>Next Game</h2>
                  <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '0.3rem' }}>No upcoming games</div>
                </div>
              )}
              <div className="card">
                <h2>Season Summary</h2>
                <div className="ha-row"><span className="ha-label">Home</span><span className="ha-val">{homeRecord.w}-{homeRecord.l}-{homeRecord.otl}</span></div>
                <div className="ha-row"><span className="ha-label">Away</span><span className="ha-val">{awayRecord.w}-{awayRecord.l}-{awayRecord.otl}</span></div>
                <div className="ha-row"><span className="ha-label">Points %</span><span className="ha-val">{gp > 0 ? ((pts / (gp * 2)) * 100).toFixed(1) : 0}%</span></div>
                <div className="ha-row"><span className="ha-label">Avg GF</span><span className="ha-val" style={{ color: 'var(--green)' }}>{gp > 0 ? (gf / gp).toFixed(2) : 0}</span></div>
                <div className="ha-row"><span className="ha-label">Avg GA</span><span className="ha-val" style={{ color: 'var(--red)' }}>{gp > 0 ? (ga / gp).toFixed(2) : 0}</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT — League context */}
        <div className="db-right">
          <div className="two-col db-standings-grid">
            <StandingsTable conf="Eastern Conference" rows={liveEast} loading={standingsLoading} />
            <StandingsTable conf="Western Conference" rows={liveWest} loading={standingsLoading} />
          </div>
          <div style={{ marginTop: '1rem' }}>
            <LeagueLeaders leaders={leaders} loading={leadersLoading} />
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
