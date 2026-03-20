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
  // Newfoundland: subtract 30 min (stored as AT-equivalent, local NT is 30 min earlier)
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
  const { team, schedule } = teamData;
  const completed = schedule.filter(g => g.result !== 'upcoming');
  const upcoming  = schedule.filter(g => g.result === 'upcoming');

  const wins   = completed.filter(g => g.result === 'W').length;
  const losses = completed.filter(g => g.result === 'L').length;
  const otls   = completed.filter(g => g.result === 'OTL').length;

  return (
    <div className="page">
      <div className="espn-header">
        <div className="espn-header-bar" />
        <h2>Schedule & Results</h2>
        <span className="subtitle">{team.fullName} · {completed.length} games tracked</span>
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

      {upcoming.length > 0 && (
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

      <div className="espn-header">
        <div className="espn-header-bar" />
        <h2>Results</h2>
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
    </div>
  );
}
