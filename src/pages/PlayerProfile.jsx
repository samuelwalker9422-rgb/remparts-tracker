import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

function shortDate(date) {
  return new Date(date + 'T12:00:00').toLocaleDateString('en-CA', { month: 'short', day: 'numeric' });
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

export default function PlayerProfile({ num, onBack, teamData }) {
  const { skaters, schedule, gameLog, team, playoffSchedule = [], playoffGameLog = [] } = teamData;
  const player = skaters.find(p => p.num === num);

  if (!player) return (
    <div className="page">
      <button className="back-btn" onClick={onBack}>← Back</button>
      <p style={{ color: 'var(--muted)' }}>Player not found.</p>
    </div>
  );

  const completed = schedule.filter(g => g.result !== 'upcoming');
  const hasGameLog = gameLog && gameLog.length > 0;

  const games = hasGameLog ? completed.map(game => {
    const entry = gameLog.find(l => l.gameId === game.id && l.num === num);
    if (!entry) return null;
    return {
      gameId: game.id,
      date: shortDate(game.date),
      opponent: (game.home ? 'vs ' : '@ ') + game.opponent,
      result: game.result,
      gf: game.gf,
      ga: game.ga,
      g: entry.g,
      a: entry.a,
      pts: entry.g + entry.a,
    };
  }).filter(Boolean) : [];

  const chartData = games.map(g => ({ name: g.date, G: g.g, A: g.a }));
  const scoringGames = games.filter(g => g.pts > 0).length;
  const ppg = player.gp > 0 ? (player.pts / player.gp).toFixed(2) : '0.00';
  const ranked = [...skaters].sort((a, b) => b.pts - a.pts);
  const rank = ranked.findIndex(p => p.num === num) + 1;
  const league = 'LHJMQ';

  // ── Playoff game log ────────────────────────────────────────────────────
  const completedPlayoff = playoffSchedule.filter(g => g.result !== 'upcoming');
  const playoffGames = completedPlayoff.map(game => {
    const entry = playoffGameLog.find(l => l.gameId === game.id && l.num === num);
    if (!entry) return null;
    return {
      gameId: game.id,
      date: shortDate(game.date),
      opponent: (game.home ? 'vs ' : '@ ') + game.opponent,
      result: game.result,
      gf: game.gf,
      ga: game.ga,
      g: entry.g,
      a: entry.a,
      pts: entry.g + entry.a,
    };
  }).filter(Boolean);
  const playoffChartData = playoffGames.map(g => ({ name: g.date, G: g.g, A: g.a }));
  const hasPlayoffLog = playoffGames.length > 0;
  const poG   = playoffGames.reduce((s, g) => s + g.g, 0);
  const poA   = playoffGames.reduce((s, g) => s + g.a, 0);
  const poPts = poG + poA;

  return (
    <div className="page">
      <button className="back-btn" onClick={onBack}>← Back to Roster</button>

      <div className="profile-hero section-gap">
        <div className="profile-photo-wrap">
          <img
            className="profile-photo"
            src={player.photo || ''}
            alt={player.name}
            onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
          />
          <div style={{
            display: player.photo ? 'none' : 'flex',
            width: 120, height: 120, borderRadius: '50%',
            background: 'var(--red)', alignItems: 'center', justifyContent: 'center',
            fontSize: '2rem', fontWeight: 900, color: '#fff', border: '3px solid var(--red)',
          }}>
            {player.num}
          </div>
          <div className="profile-num-badge">#{player.num}</div>
        </div>

        <div>
          <div style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--red)', marginBottom: '0.25rem' }}>
            {player.pos === 'F' ? 'Forward' : 'Defence'} · {team?.fullName}
          </div>
          <div className="profile-name">{player.name}</div>
          <div className="profile-meta">
            #{player.num} &nbsp;·&nbsp; {league} &nbsp;·&nbsp; Team Rank: <strong style={{ color: 'var(--red)' }}>#{rank}</strong> in scoring
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.85rem' }}>
            {[
              { label: 'PTS', val: player.pts, color: 'var(--red)' },
              { label: 'G',   val: player.g,   color: '#fff' },
              { label: 'A',   val: player.a,   color: '#fff' },
              { label: 'GP',  val: player.gp,  color: 'var(--muted)' },
            ].map(({ label, val, color }) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color, lineHeight: 1 }}>{val}</div>
                <div style={{ fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)', marginTop: '0.2rem' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="stat-grid stat-grid-3 section-gap">
        <div className="stat-card" style={{ textAlign: 'center' }}>
          <div className="stat-label">Points / GP</div>
          <div className="stat-val red">{ppg}</div>
          <div className="stat-sub">Production rate</div>
        </div>
        <div className="stat-card" style={{ textAlign: 'center' }}>
          <div className="stat-label">Scoring Games</div>
          <div className="stat-val">
            {hasGameLog ? scoringGames : '—'}
            {hasGameLog && <span style={{ fontSize: '1rem', color: 'var(--muted)', fontWeight: 500 }}>/{player.gp}</span>}
          </div>
          <div className="stat-sub">{hasGameLog && player.gp > 0 ? ((scoringGames / player.gp) * 100).toFixed(0) + '% of games' : 'Season totals'}</div>
        </div>
        <div className="stat-card" style={{ textAlign: 'center' }}>
          <div className="stat-label">Goals / Assists</div>
          <div className="stat-val" style={{ fontSize: '1.4rem' }}>{player.g} / {player.a}</div>
          <div className="stat-sub">{player.g > 0 ? (player.a / player.g).toFixed(1) : '—'} A per G</div>
        </div>
      </div>

      {hasGameLog && games.length > 0 && (
        <>
          <div className="espn-header">
            <div className="espn-header-bar" />
            <h2>Points Per Game</h2>
          </div>
          <div className="card section-gap">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fill: '#666', fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#666', fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="G" fill="#cc0000" radius={[3,3,0,0]} stackId="a" />
                <Bar dataKey="A" fill="#555" radius={[3,3,0,0]} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', gap: '1.25rem', justifyContent: 'center', fontSize: '0.72rem', color: 'var(--muted)', marginTop: '0.5rem' }}>
              <span><span style={{ color: 'var(--red)', marginRight: 4 }}>■</span>Goals</span>
              <span><span style={{ color: '#555', marginRight: 4 }}>■</span>Assists</span>
            </div>
          </div>

          <div className="espn-header">
            <div className="espn-header-bar" />
            <h2>Game Log</h2>
            <span className="subtitle">{player.gp} GP this season · {games.length} games logged (Feb–Mar)</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th className="left" style={{ cursor: 'default' }}>Date</th>
                  <th className="left" style={{ cursor: 'default' }}>Opponent</th>
                  <th style={{ cursor: 'default' }}>Score</th>
                  <th style={{ cursor: 'default' }}>Result</th>
                  <th style={{ cursor: 'default' }}>G</th>
                  <th style={{ cursor: 'default' }}>A</th>
                  <th style={{ cursor: 'default' }}>PTS</th>
                </tr>
              </thead>
              <tbody>
                {games.map(g => (
                  <tr key={g.gameId} style={{ background: g.pts > 0 ? 'rgba(204,0,0,0.04)' : 'transparent' }}>
                    <td className="left">{g.date}</td>
                    <td className="left">{g.opponent}</td>
                    <td>{g.gf}–{g.ga}</td>
                    <td><span className={`badge badge-${g.result}`}>{g.result}</span></td>
                    <td>{g.g > 0 ? <strong style={{ color: 'var(--red)' }}>{g.g}</strong> : <span style={{ color: 'var(--muted)' }}>0</span>}</td>
                    <td>{g.a > 0 ? <strong>{g.a}</strong> : <span style={{ color: 'var(--muted)' }}>0</span>}</td>
                    <td className={g.pts > 0 ? 'pts-cell' : ''} style={{ color: g.pts === 0 ? 'var(--muted)' : undefined }}>{g.pts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {!hasGameLog && (
        <div className="card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📊</div>
          <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Game log not available</div>
          <div style={{ fontSize: '0.85rem' }}>Season totals shown above</div>
        </div>
      )}

      {/* ── PLAYOFFS SECTION ─────────────────────────────────────────────── */}
      {hasPlayoffLog && (
        <>
          <div className="espn-header" style={{ marginTop: '2rem' }}>
            <div className="espn-header-bar" style={{ background: 'gold' }} />
            <h2>🏆 Playoffs</h2>
            <span className="subtitle">{playoffGames.length} games · {poG}G {poA}A {poPts}PTS</span>
          </div>

          <div className="stat-grid stat-grid-3 section-gap">
            <div className="stat-card" style={{ textAlign: 'center', borderTop: '2px solid gold' }}>
              <div className="stat-label">Playoff Points</div>
              <div className="stat-val" style={{ color: 'gold' }}>{poPts}</div>
              <div className="stat-sub">{playoffGames.length} GP · {+(poPts / playoffGames.length).toFixed(2)} P/GP</div>
            </div>
            <div className="stat-card" style={{ textAlign: 'center', borderTop: '2px solid gold' }}>
              <div className="stat-label">Goals</div>
              <div className="stat-val red">{poG}</div>
              <div className="stat-sub">Playoff goals</div>
            </div>
            <div className="stat-card" style={{ textAlign: 'center', borderTop: '2px solid gold' }}>
              <div className="stat-label">Assists</div>
              <div className="stat-val">{poA}</div>
              <div className="stat-sub">Playoff assists</div>
            </div>
          </div>

          <div className="card section-gap">
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={playoffChartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fill: '#666', fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#666', fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="G" fill="#cc0000" radius={[3,3,0,0]} stackId="a" />
                <Bar dataKey="A" fill="#555" radius={[3,3,0,0]} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', gap: '1.25rem', justifyContent: 'center', fontSize: '0.72rem', color: 'var(--muted)', marginTop: '0.5rem' }}>
              <span><span style={{ color: 'var(--red)', marginRight: 4 }}>■</span>Goals</span>
              <span><span style={{ color: '#555', marginRight: 4 }}>■</span>Assists</span>
            </div>
          </div>

          <div className="espn-header">
            <div className="espn-header-bar" style={{ background: 'gold' }} />
            <h2>Playoff Game Log</h2>
            <span className="subtitle">{playoffGames.length} games</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th className="left" style={{ cursor: 'default' }}>Date</th>
                  <th className="left" style={{ cursor: 'default' }}>Opponent</th>
                  <th style={{ cursor: 'default' }}>Score</th>
                  <th style={{ cursor: 'default' }}>Result</th>
                  <th style={{ cursor: 'default' }}>G</th>
                  <th style={{ cursor: 'default' }}>A</th>
                  <th style={{ cursor: 'default' }}>PTS</th>
                </tr>
              </thead>
              <tbody>
                {playoffGames.map(g => (
                  <tr key={g.gameId} style={{ background: g.pts > 0 ? 'rgba(255,215,0,0.05)' : 'transparent' }}>
                    <td className="left">{g.date}</td>
                    <td className="left">{g.opponent}</td>
                    <td>{g.gf}–{g.ga}</td>
                    <td><span className={`badge badge-${g.result}`}>{g.result}</span></td>
                    <td>{g.g > 0 ? <strong style={{ color: 'var(--red)' }}>{g.g}</strong> : <span style={{ color: 'var(--muted)' }}>0</span>}</td>
                    <td>{g.a > 0 ? <strong>{g.a}</strong> : <span style={{ color: 'var(--muted)' }}>0</span>}</td>
                    <td className={g.pts > 0 ? 'pts-cell' : ''} style={{ color: g.pts === 0 ? 'var(--muted)' : undefined }}>{g.pts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
