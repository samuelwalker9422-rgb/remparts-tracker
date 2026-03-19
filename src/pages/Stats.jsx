import { useState } from 'react';
import PlayerProfile from './PlayerProfile';

const SKATER_COLS = [
  { key: 'rank', label: 'RK',     numeric: true  },
  { key: 'name', label: 'Player', numeric: false },
  { key: 'pos',  label: 'Pos',   numeric: false },
  { key: 'gp',   label: 'GP',    numeric: true  },
  { key: 'g',    label: 'G',     numeric: true  },
  { key: 'a',    label: 'A',     numeric: true  },
  { key: 'pts',  label: 'PTS',   numeric: true  },
  { key: 'ppg',  label: 'P/GP',  numeric: true  },
];

const GOALIE_COLS = [
  { key: 'name',  label: 'Goalie', numeric: false },
  { key: 'gp',    label: 'GP',     numeric: true  },
  { key: 'min',   label: 'MIN',    numeric: true  },
  { key: 'ga',    label: 'GA',     numeric: true  },
  { key: 'saves', label: 'Saves',  numeric: true  },
  { key: 'gaa',   label: 'GAA',    numeric: true  },
  { key: 'svPct', label: 'SV%',    numeric: true  },
];

function SortTh({ col, sortKey, dir, onSort }) {
  const active = sortKey === col.key;
  return (
    <th className={`${active ? 'sorted' : ''} ${(col.key === 'name' || col.key === 'rank') ? 'left' : ''}`} onClick={() => onSort(col.key)}>
      {col.label}<span className="sort-arrow">{active ? (dir === 'desc' ? '▼' : '▲') : '⇅'}</span>
    </th>
  );
}

function useSortable(defaultKey, defaultDir = 'desc') {
  const [sortKey, setSortKey] = useState(defaultKey);
  const [dir, setDir] = useState(defaultDir);
  function handleSort(key) {
    if (sortKey === key) setDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortKey(key); setDir('desc'); }
  }
  return { sortKey, dir, handleSort };
}

function sortRows(rows, key, dir) {
  return [...rows].sort((a, b) => {
    const av = a[key], bv = b[key];
    if (typeof av === 'string') return dir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    return dir === 'asc' ? av - bv : bv - av;
  });
}

export default function Stats({ teamData }) {
  const { team, skaters, goalies, playoffSchedule = [], playoffGameLog = [] } = teamData;
  const [selectedNum, setSelectedNum] = useState(null);
  const [tab, setTab] = useState('regular');
  const skaterSort = useSortable('pts');
  const playoffSort = useSortable('pts');
  const goalieSort = useSortable('svPct');

  if (selectedNum !== null) {
    return <PlayerProfile num={selectedNum} onBack={() => setSelectedNum(null)} teamData={teamData} />;
  }

  // ─── Regular season stats ────────────────────────────────────────────────
  const gp          = team.record.w + team.record.l + team.record.otl + (team.record.sol || 0);
  const winPct      = gp > 0 ? ((team.record.w / gp) * 100).toFixed(1) : '0.0';
  const totalGoals  = skaters.reduce((s, p) => s + p.g, 0);
  const totalAsst   = skaters.reduce((s, p) => s + p.a, 0);
  const totalPts    = skaters.reduce((s, p) => s + p.pts, 0);

  const skatersWithPpg = skaters.map(p => ({ ...p, ppg: +(p.pts / (p.gp || 1)).toFixed(2) }));
  const sortedSkaters  = sortRows(skatersWithPpg, skaterSort.sortKey, skaterSort.dir);
  const sortedGoalies  = sortRows(goalies, goalieSort.sortKey, goalieSort.dir);

  // ─── Playoff stats (computed from playoffGameLog) ────────────────────────
  const playoffGP = playoffSchedule.filter(g => g.result !== 'upcoming').length;
  const playoffSkaters = skaters.map(p => {
    const entries = playoffGameLog.filter(e => e.num === p.num);
    const g   = entries.reduce((s, e) => s + e.g, 0);
    const a   = entries.reduce((s, e) => s + e.a, 0);
    const pts = g + a;
    const pgp = entries.length; // games appeared in (had a log entry)
    return { ...p, g, a, pts, gp: pgp, ppg: +(pts / (pgp || 1)).toFixed(2) };
  }).filter(p => p.gp > 0 || playoffGameLog.some(e => e.num === p.num));

  const playoffTotalG   = playoffSkaters.reduce((s, p) => s + p.g, 0);
  const playoffTotalA   = playoffSkaters.reduce((s, p) => s + p.a, 0);
  const playoffTotalPts = playoffSkaters.reduce((s, p) => s + p.pts, 0);
  const sortedPlayoff   = sortRows(playoffSkaters, playoffSort.sortKey, playoffSort.dir);
  const hasPlayoffData  = playoffGameLog.length > 0;

  return (
    <div className="page">

      {/* Season toggle */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '2px solid var(--surface3)', paddingBottom: '0.75rem' }}>
        <button
          onClick={() => setTab('regular')}
          style={{
            background: tab === 'regular' ? 'var(--red)' : 'var(--surface2)',
            color: tab === 'regular' ? '#fff' : 'var(--muted)',
            border: 'none', borderRadius: 6, padding: '0.45rem 1.1rem',
            fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', transition: 'all .15s',
          }}
        >
          Regular Season
        </button>
        <button
          onClick={() => setTab('playoffs')}
          style={{
            background: tab === 'playoffs' ? 'var(--red)' : 'var(--surface2)',
            color: tab === 'playoffs' ? '#fff' : 'var(--muted)',
            border: 'none', borderRadius: 6, padding: '0.45rem 1.1rem',
            fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', transition: 'all .15s',
            display: 'flex', alignItems: 'center', gap: '0.4rem',
          }}
        >
          🏆 Playoffs
          {hasPlayoffData && (
            <span style={{ background: 'rgba(255,255,255,0.25)', borderRadius: 10, fontSize: '0.7rem', padding: '0 6px' }}>
              {playoffGP} GP
            </span>
          )}
        </button>
      </div>

      {/* ── REGULAR SEASON ───────────────────────────────────────────────── */}
      {tab === 'regular' && (
        <>
          <div className="espn-header">
            <div className="espn-header-bar" />
            <h2>Team Stats</h2>
            <span className="subtitle">{team.season} Regular Season</span>
          </div>

          <div className="stat-grid stat-grid-4 section-gap">
            <div className="stat-card">
              <div className="stat-label">Record</div>
              <div className="stat-val" style={{ fontSize: '1.5rem' }}>{team.record.w}-{team.record.l}-{team.record.otl}-{team.record.sol || 0}</div>
              <div className="stat-sub">W–L–OTL–SOL</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Points</div>
              <div className="stat-val red">{team.points}</div>
              <div className="stat-sub">Win%: {winPct}%</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Goals For / Against</div>
              <div className="stat-val" style={{ fontSize: '1.4rem' }}>{team.goalsFor} / {team.goalsAgainst}</div>
              <div className="stat-sub" style={{ color: 'var(--green)' }}>Diff: +{team.goalsFor - team.goalsAgainst}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Skater Points</div>
              <div className="stat-val">{totalPts}</div>
              <div className="stat-sub">{totalGoals}G · {totalAsst}A</div>
            </div>
          </div>

          <div className="espn-header">
            <div className="espn-header-bar" />
            <h2>Skater Stats</h2>
            <span className="subtitle">Click column to sort · Click player to view profile</span>
          </div>

          <div className="table-wrap section-gap">
            <table>
              <thead>
                <tr>{SKATER_COLS.map(col => <SortTh key={col.key} col={col} sortKey={skaterSort.sortKey} dir={skaterSort.dir} onSort={skaterSort.handleSort} />)}</tr>
              </thead>
              <tbody>
                {sortedSkaters.map((p, i) => (
                  <tr key={p.num} onClick={() => setSelectedNum(p.num)} style={{ cursor: 'pointer' }}>
                    <td className="left" style={{ color: i < 3 ? 'var(--red)' : 'var(--muted)', fontWeight: i < 3 ? 800 : 400, minWidth: 32 }}>{i + 1}</td>
                    <td className="left" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      {p.photo && <img src={p.photo} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', objectPosition: 'top', background: '#222', flexShrink: 0 }} onError={e => { e.target.style.display = 'none'; }} />}
                      <span style={{ color: 'var(--red)', fontWeight: 700 }}>{p.name}</span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>#{p.num}</span>
                    </td>
                    <td className="left" style={{ color: 'var(--muted)' }}>{p.pos}</td>
                    <td>{p.gp}</td><td>{p.g}</td><td>{p.a}</td>
                    <td className="pts-cell">{p.pts}</td>
                    <td style={{ color: 'var(--muted)' }}>{p.ppg}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="espn-header">
            <div className="espn-header-bar" />
            <h2>Goalie Stats</h2>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>{GOALIE_COLS.map(col => <SortTh key={col.key} col={col} sortKey={goalieSort.sortKey} dir={goalieSort.dir} onSort={goalieSort.handleSort} />)}</tr>
              </thead>
              <tbody>
                {sortedGoalies.map(g => (
                  <tr key={g.num}>
                    <td className="left" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      {g.photo && <img src={g.photo} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', objectPosition: 'top', background: '#222', flexShrink: 0 }} onError={e => { e.target.style.display = 'none'; }} />}
                      <span style={{ fontWeight: 700 }}>{g.name}</span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>#{g.num}</span>
                    </td>
                    <td>{g.gp}</td>
                    <td>{g.min}</td>
                    <td style={{ color: 'var(--red)' }}>{g.ga}</td>
                    <td>{g.saves}</td>
                    <td>{g.gaa}</td>
                    <td className="pts-cell">{g.svPct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── PLAYOFFS ─────────────────────────────────────────────────────── */}
      {tab === 'playoffs' && (
        <>
          <div className="espn-header">
            <div className="espn-header-bar" />
            <h2>🏆 Playoff Stats</h2>
            <span className="subtitle">{team.season} Playoffs · {playoffGP} games played</span>
          </div>

          {!hasPlayoffData ? (
            <div className="card" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--muted)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🏒</div>
              <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.35rem' }}>Playoffs haven't started yet</div>
              <div style={{ fontSize: '0.85rem' }}>
                Add playoff games to <code style={{ background: 'var(--surface3)', padding: '0 4px', borderRadius: 4 }}>playoffSchedule</code> and stats to <code style={{ background: 'var(--surface3)', padding: '0 4px', borderRadius: 4 }}>playoffGameLog</code> in <strong>data.js</strong> to track them here.
              </div>
            </div>
          ) : (
            <>
              <div className="stat-grid stat-grid-3 section-gap">
                <div className="stat-card">
                  <div className="stat-label">Games Played</div>
                  <div className="stat-val red">{playoffGP}</div>
                  <div className="stat-sub">Playoff games</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Goals / Assists</div>
                  <div className="stat-val" style={{ fontSize: '1.4rem' }}>{playoffTotalG} / {playoffTotalA}</div>
                  <div className="stat-sub">Team totals</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Total Points</div>
                  <div className="stat-val">{playoffTotalPts}</div>
                  <div className="stat-sub">By all skaters</div>
                </div>
              </div>

              <div className="espn-header">
                <div className="espn-header-bar" />
                <h2>Playoff Skater Scoring</h2>
                <span className="subtitle">Click column to sort · Click player to view profile</span>
              </div>

              <div className="table-wrap section-gap">
                <table>
                  <thead>
                    <tr>{SKATER_COLS.map(col => <SortTh key={col.key} col={col} sortKey={playoffSort.sortKey} dir={playoffSort.dir} onSort={playoffSort.handleSort} />)}</tr>
                  </thead>
                  <tbody>
                    {sortedPlayoff.map((p, i) => (
                      <tr key={p.num} onClick={() => setSelectedNum(p.num)} style={{ cursor: 'pointer' }}>
                        <td className="left" style={{ color: i < 3 ? 'var(--red)' : 'var(--muted)', fontWeight: i < 3 ? 800 : 400, minWidth: 32 }}>{i + 1}</td>
                        <td className="left" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          {p.photo && <img src={p.photo} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', objectPosition: 'top', background: '#222', flexShrink: 0 }} onError={e => { e.target.style.display = 'none'; }} />}
                          <span style={{ color: 'var(--red)', fontWeight: 700 }}>{p.name}</span>
                          <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>#{p.num}</span>
                        </td>
                        <td className="left" style={{ color: 'var(--muted)' }}>{p.pos}</td>
                        <td>{p.gp}</td><td>{p.g}</td><td>{p.a}</td>
                        <td className="pts-cell">{p.pts}</td>
                        <td style={{ color: 'var(--muted)' }}>{p.ppg}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
