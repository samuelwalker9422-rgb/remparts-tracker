function fmtFull(date) {
  return new Date(date + 'T12:00:00').toLocaleDateString('en-CA', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
}

export default function GameRecap({ gameDate, onBack, teamData }) {
  const { schedule, gameLog, skaters } = teamData;

  const game = schedule.find(g => g.date === gameDate);

  if (!game || game.result === 'upcoming') {
    return (
      <div className="page">
        <button className="back-btn" onClick={onBack}>← Back to Schedule</button>
        <p style={{ color: 'var(--muted)' }}>Game not found.</p>
      </div>
    );
  }

  // All game log entries for this game
  const entries = gameLog.filter(e => e.gameId === game.id);

  // Build per-player rows: join entries with skater info
  const playerRows = entries
    .map(e => {
      const skater = skaters.find(s => s.num === e.num);
      if (!skater) return null;
      return { ...skater, g: e.g, a: e.a, pts: e.g + e.a };
    })
    .filter(Boolean)
    .sort((a, b) => b.pts - a.pts || b.g - a.g || a.name.localeCompare(b.name));

  // Goals: one entry per goal scored
  const goals = playerRows
    .filter(p => p.g > 0)
    .flatMap(p => Array.from({ length: p.g }, (_, i) => ({ ...p, goalNum: i + 1 })));

  const diff = game.gf - game.ga;
  const resultColor =
    game.result === 'W'   ? 'var(--green)'  :
    game.result === 'L'   ? 'var(--red)'    :
    'var(--orange)';

  return (
    <div className="page">
      <button className="back-btn" onClick={onBack}>← Back to Schedule</button>

      {/* ── RECAP HEADER ──────────────────────────────────────────────── */}
      <div className="profile-hero section-gap" style={{ flexDirection: 'column', gap: '1.25rem', alignItems: 'stretch' }}>
        {/* Meta row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)' }}>
            {fmtFull(game.date)}
          </span>
          <span className="badge badge-loc">{game.home ? 'HOME' : 'AWAY'}</span>
          <span className={`badge badge-${game.result}`}>{game.result}</span>
        </div>

        {/* Scoreboard row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          {/* Remparts side */}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--red)', marginBottom: '0.3rem' }}>
              Québec Remparts
            </div>
            <div style={{ fontSize: '3.5rem', fontWeight: 900, lineHeight: 1, color: game.result === 'W' ? '#fff' : 'var(--muted2)' }}>
              {game.gf}
            </div>
          </div>

          {/* Center divider */}
          <div style={{ textAlign: 'center', flexShrink: 0 }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--muted2)', letterSpacing: '0.05em' }}>FINAL</div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--border)', lineHeight: 1.2 }}>—</div>
            <div style={{
              fontSize: '0.75rem', fontWeight: 800, marginTop: '0.25rem',
              color: resultColor,
            }}>
              {diff > 0 ? `+${diff}` : diff}
            </div>
          </div>

          {/* Opponent side */}
          <div style={{ flex: 1, textAlign: 'right' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '0.3rem' }}>
              {game.home ? 'vs' : '@'} {game.opponent}
            </div>
            <div style={{ fontSize: '3.5rem', fontWeight: 900, lineHeight: 1, color: game.result === 'L' ? '#fff' : 'var(--muted2)' }}>
              {game.ga}
            </div>
          </div>
        </div>
      </div>

      {/* ── SKATER BOX SCORE ──────────────────────────────────────────── */}
      <div className="espn-header">
        <div className="espn-header-bar" />
        <h2>Remparts Skaters</h2>
        <span className="subtitle">{playerRows.length} players · {game.gf}G scored</span>
      </div>

      <div className="table-wrap section-gap">
        <table>
          <thead>
            <tr>
              <th className="left" style={{ cursor: 'default', width: '40%' }}>Player</th>
              <th style={{ cursor: 'default' }}>POS</th>
              <th style={{ cursor: 'default' }}>G</th>
              <th style={{ cursor: 'default' }}>A</th>
              <th style={{ cursor: 'default' }}>PTS</th>
            </tr>
          </thead>
          <tbody>
            {playerRows.map(p => (
              <tr
                key={p.num}
                style={{
                  background: p.pts > 0 ? 'rgba(204,0,0,0.04)' : 'transparent',
                  opacity: p.pts === 0 ? 0.5 : 1,
                }}
              >
                <td className="left">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    {p.photo && (
                      <img
                        src={p.photo}
                        alt={p.name}
                        style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', objectPosition: 'top', border: '1px solid var(--border)', background: 'var(--surface3)', flexShrink: 0 }}
                        onError={e => { e.target.style.display = 'none'; }}
                      />
                    )}
                    <span style={{ fontWeight: p.pts > 0 ? 700 : 400 }}>{p.name}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--muted2)' }}>#{p.num}</span>
                  </div>
                </td>
                <td style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>
                  {p.pos === 'F' ? 'F' : 'D'}
                </td>
                <td>
                  {p.g > 0
                    ? <strong style={{ color: 'var(--red)' }}>{p.g}</strong>
                    : <span style={{ color: 'var(--muted2)' }}>0</span>}
                </td>
                <td>
                  {p.a > 0
                    ? <strong>{p.a}</strong>
                    : <span style={{ color: 'var(--muted2)' }}>0</span>}
                </td>
                <td className={p.pts > 0 ? 'pts-cell' : ''} style={{ color: p.pts === 0 ? 'var(--muted2)' : undefined }}>
                  {p.pts}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── GOALS ─────────────────────────────────────────────────────── */}
      {goals.length > 0 && (
        <>
          <div className="espn-header">
            <div className="espn-header-bar" />
            <h2>Remparts Goals</h2>
            <span className="subtitle">{goals.length} goal{goals.length !== 1 ? 's' : ''}</span>
          </div>

          <div className="card section-gap">
            {goals.map((goal, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem',
                  padding: '0.65rem 0',
                  borderBottom: i < goals.length - 1 ? '1px solid var(--border)' : 'none',
                }}
              >
                <div style={{
                  width: 26, height: 26, borderRadius: '50%',
                  background: 'var(--red)', color: '#fff',
                  fontSize: '0.7rem', fontWeight: 900,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {i + 1}
                </div>
                {goal.photo && (
                  <img
                    src={goal.photo}
                    alt={goal.name}
                    style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', objectPosition: 'top', border: '2px solid var(--red)', background: 'var(--surface3)', flexShrink: 0 }}
                    onError={e => { e.target.style.display = 'none'; }}
                  />
                )}
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{goal.name}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>
                    #{goal.num} · {goal.pos === 'F' ? 'Forward' : 'Defence'}
                    {goal.g > 1 && (
                      <span style={{ marginLeft: '0.4rem', color: 'var(--red)', fontWeight: 700 }}>
                        ({goal.goalNum} of {goal.g})
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {goals.length === 0 && (
        <div className="card section-gap" style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--muted)' }}>
          No Remparts goals recorded for this game.
        </div>
      )}
    </div>
  );
}
