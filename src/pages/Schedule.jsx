import { useState, useEffect } from 'react';
import { useStandings } from '../hooks/useStandings';

function fmtFull(date) {
  return new Date(date + 'T12:00:00').toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric' });
}
function fmtShort(date) {
  return new Date(date + 'T12:00:00').toLocaleDateString('en-CA', { month: 'short', day: 'numeric' });
}

const TZ_LABEL = {
  'America/Toronto':  'ET',
  'America/Halifax':  'AT',
  'America/St_Johns': 'NT',
};

function fmtGameTime(time, tz) {
  if (!time || !tz) return null;
  let [h, m] = time.split(':').map(Number);
  if (tz === 'America/St_Johns') {
    const total = h * 60 + m - 30;
    h = Math.floor(total / 60) % 24;
    m = total % 60;
  }
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12  = h === 0 ? 12 : h > 12 ? h - 12 : h;
  const mins = m === 0 ? '' : `:${String(m).padStart(2, '0')}`;
  return `${h12}${mins} ${ampm} ${TZ_LABEL[tz] ?? tz}`;
}

export default function Schedule({ teamData, onGameRecap }) {
  const { team } = teamData;

  const [games,        setGames]        = useState([]);
  const [playoffGames, setPlayoffGames] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch('/api/games');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!cancelled) {
          setGames(json.games ?? []);
          setPlayoffGames(json.playoffGames ?? []);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const { east } = useStandings();
  const rem = east.find(t => t.code === 'Que');

  const completed = games.filter(g => g.result !== 'upcoming');
  const upcoming  = games.filter(g => g.result === 'upcoming');

  const wins   = rem ? rem.w   : completed.filter(g => g.result === 'W').length;
  const losses = rem ? rem.l   : completed.filter(g => g.result === 'L').length;
  const otls   = rem ? rem.otl : completed.filter(g => g.result === 'OTL').length;

  const poCompleted = playoffGames.filter(g => g.result !== 'upcoming');
  const poUpcoming  = playoffGames.filter(g => g.result === 'upcoming');
  const hasPlayoffs = playoffGames.length > 0;

  // Opponent is the same for all games in a series — use first entry
  const poOpponent = playoffGames[0]?.opponent ?? 'Playoffs';

  return (
    <div className="page">
      <div className="espn-header">
        <div className="espn-header-bar" />
        <h2>Schedule & Results</h2>
        <span className="subtitle">{team.fullName} · {completed.length} games played</span>
      </div>

      <div className="stat-grid stat-grid-3 section-gap">
        <div className="stat-card" style={{ textAlign: 'center' }}>
          <div className="stat-label">Wins</div>
          <div className="stat-val green">{wins}</div>
        </div>
        <div className="stat-card" style={{ textAlign: 'center' }}>
          <div className="stat-label">Losses</div>
          <div className="stat-val red">{losses}</div>
        </div>
        <div className="stat-card" style={{ textAlign: 'center' }}>
          <div className="stat-label">OT Losses</div>
          <div className="stat-val" style={{ color: 'var(--orange)' }}>{otls}</div>
        </div>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '2rem' }}>
          Loading schedule…
        </div>
      )}

      {error && !loading && (
        <div style={{ textAlign: 'center', color: 'var(--red)', padding: '1rem' }}>
          Failed to load schedule: {error}
        </div>
      )}

      {/* ── PLAYOFFS ─────────────────────────────────────────────────────── */}
      {!loading && hasPlayoffs && (
        <>
          <div className="espn-header" style={{ marginTop: '0.5rem' }}>
            <div className="espn-header-bar" style={{ background: 'gold' }} />
            <h2>🏆 Playoffs — Round 1</h2>
            <span className="subtitle">vs {poOpponent} · Best of 7</span>
          </div>

          {poUpcoming.length > 0 && (
            <div className="section-gap">
              {poUpcoming.map(g => {
                const gameTime = fmtGameTime(g.time, g.tz);
                return (
                  <div className="upcoming-card" key={g.id} style={{ borderLeft: '3px solid gold' }}>
                    <div className="upcoming-date">
                      <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'gold', letterSpacing: '0.06em', marginBottom: '2px' }}>
                        GAME {g.gameNum}
                      </div>
                      {fmtFull(g.date)}
                      {gameTime && <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '2px' }}>{gameTime}</div>}
                    </div>
                    <div>
                      <div className="upcoming-opp">{g.home ? 'vs' : '@'} {g.opponent}</div>
                      <div className="upcoming-loc">{g.home ? '🏒 Home' : '✈️ Away'}</div>
                    </div>
                    <span className="badge badge-loc" style={{ marginLeft: 'auto' }}>{g.home ? 'HOME' : 'AWAY'}</span>
                  </div>
                );
              })}
            </div>
          )}

          {poCompleted.length > 0 && (
            <>
              <div className="espn-header" style={{ marginTop: '0.75rem' }}>
                <div className="espn-header-bar" style={{ background: 'gold' }} />
                <h2>Playoff Results</h2>
                <span className="subtitle">Most recent first</span>
              </div>
              <div className="table-wrap">
                {[...poCompleted].reverse().map(g => (
                  <div className="game-row" key={g.id} style={{ borderLeft: '3px solid gold' }}>
                    <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'gold', minWidth: '3.5rem' }}>
                      GAME {g.gameNum}
                    </span>
                    <span className="game-date">{fmtShort(g.date)}</span>
                    <span className="badge badge-loc">{g.home ? 'HOME' : 'AWAY'}</span>
                    <span className="game-opp">{g.home ? 'vs' : '@'} {g.opponent}</span>
                    <span className="game-score" style={{ color: g.result === 'W' ? 'var(--green)' : g.result === 'L' ? 'var(--red)' : 'var(--orange)' }}>
                      {g.gf}–{g.ga}
                    </span>
                    <span className={`badge badge-${g.result}`}>{g.result}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* ── UPCOMING REGULAR SEASON ──────────────────────────────────────── */}
      {!loading && upcoming.length > 0 && (
        <>
          <div className="espn-header">
            <div className="espn-header-bar" style={{ background: 'var(--green)' }} />
            <h2>Upcoming</h2>
          </div>
          <div className="section-gap">
            {upcoming.map(g => {
              const gameTime = fmtGameTime(g.time, g.tz);
              return (
                <div className="upcoming-card" key={g.id}>
                  <div className="upcoming-date">
                    {fmtFull(g.date)}
                    {gameTime && <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '2px' }}>{gameTime}</div>}
                  </div>
                  <div>
                    <div className="upcoming-opp">{g.home ? 'vs' : '@'} {g.opponent}</div>
                    <div className="upcoming-loc">{g.home ? '🏒 Home' : '✈️ Away'}</div>
                  </div>
                  <span className="badge badge-loc" style={{ marginLeft: 'auto' }}>{g.home ? 'HOME' : 'AWAY'}</span>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ── REGULAR SEASON RESULTS ───────────────────────────────────────── */}
      {!loading && completed.length > 0 && (
        <>
          <div className="espn-header">
            <div className="espn-header-bar" />
            <h2>Regular Season Results</h2>
            <span className="subtitle">Most recent first</span>
          </div>

          <div className="table-wrap">
            {[...completed].reverse().map(g => (
              <div
                className="game-row"
                key={g.id}
                onClick={() => onGameRecap?.(g.date)}
                style={{ cursor: onGameRecap ? 'pointer' : 'default' }}
                title="View game recap"
              >
                <span className="game-date">
                  {fmtShort(g.date)}
                  {g.time && g.tz && (
                    <span style={{ display: 'block', fontSize: '0.68rem', color: 'var(--muted)' }}>
                      {fmtGameTime(g.time, g.tz)}
                    </span>
                  )}
                </span>
                <span className="badge badge-loc">{g.home ? 'HOME' : 'AWAY'}</span>
                <span className="game-opp">{g.home ? 'vs' : '@'} {g.opponent}</span>
                <span className="game-score" style={{ color: g.result === 'W' ? 'var(--green)' : g.result === 'L' ? 'var(--red)' : 'var(--orange)' }}>
                  {g.gf}–{g.ga}
                </span>
                <span className={`badge badge-${g.result}`}>{g.result}</span>
                {onGameRecap && (
                  <span style={{ color: 'var(--muted2)', fontSize: '0.7rem', marginLeft: 'auto' }}>Recap →</span>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
