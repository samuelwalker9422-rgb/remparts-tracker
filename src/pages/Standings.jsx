export default function Standings({ teamData }) {
  const { team, schedule } = teamData;
  const completed   = schedule.filter(g => g.result !== 'upcoming');
  const gamesPlayed = team.record.w + team.record.l + team.record.otl + (team.record.sol || 0);
  const winPct      = gamesPlayed > 0 ? ((team.record.w / gamesPlayed) * 100).toFixed(1) : '0.0';
  const ptsPct      = gamesPlayed > 0 ? ((team.points / (gamesPlayed * 2)) * 100).toFixed(1) : '0.0';
  const diff        = team.goalsFor - team.goalsAgainst;
  const last5       = [...completed].slice(-5);
  const last10      = [...completed].slice(-10);
  const l10w        = last10.filter(g => g.result === 'W').length;
  const l10l        = last10.filter(g => g.result === 'L').length;
  const l10o        = last10.filter(g => g.result === 'OTL').length;
  const league      = team.name === 'Bearcats' ? 'MHL' : 'LHJMQ';

  return (
    <div className="page">
      <div className="espn-header">
        <div className="espn-header-bar" />
        <h2>Standings</h2>
        <span className="subtitle">{team.season} Season · {league}</span>
      </div>

      <div className="table-wrap section-gap">
        <div className="table-title" style={{ background: 'var(--red)', color: '#fff' }}>
          {team.fullName} — {team.season}
        </div>
        <table>
          <thead>
            <tr>
              <th className="left" style={{ cursor: 'default' }}>Team</th>
              <th style={{ cursor: 'default' }}>GP</th>
              <th style={{ cursor: 'default' }}>W</th>
              <th style={{ cursor: 'default' }}>L</th>
              <th style={{ cursor: 'default' }}>OTL</th>
              <th style={{ cursor: 'default' }}>PTS</th>
              <th style={{ cursor: 'default' }}>PTS%</th>
              <th style={{ cursor: 'default' }}>GF</th>
              <th style={{ cursor: 'default' }}>GA</th>
              <th style={{ cursor: 'default' }}>DIFF</th>
              <th style={{ cursor: 'default' }}>L10</th>
              <th style={{ cursor: 'default' }}>STK</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ background: 'rgba(204,0,0,0.06)' }}>
              <td className="left" style={{ fontWeight: 700 }}>
                <span style={{ color: 'var(--red)', fontWeight: 900, marginRight: '0.5rem' }}>
                  {team.name === 'Bearcats' ? 'TRU' : 'QC'}
                </span>
                {team.fullName}
              </td>
              <td>{gamesPlayed}</td>
              <td style={{ color: 'var(--green)', fontWeight: 700 }}>{team.record.w}</td>
              <td style={{ color: 'var(--red)' }}>{team.record.l}</td>
              <td style={{ color: 'var(--orange)' }}>{team.record.otl}</td>
              <td style={{ color: 'var(--muted)' }}>{team.record.sol || 0}</td>
              <td className="pts-cell" style={{ fontSize: '1rem' }}>{team.points}</td>
              <td style={{ color: 'var(--muted)' }}>{ptsPct}%</td>
              <td>{team.goalsFor}</td>
              <td>{team.goalsAgainst}</td>
              <td style={{ color: diff >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 700 }}>{diff >= 0 ? '+' : ''}{diff}</td>
              <td style={{ color: 'var(--muted)' }}>{l10w}-{l10l}-{l10o}</td>
              <td><span className={`badge badge-${team.streak?.slice(-1)}`}>{team.streak}</span></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="stat-grid stat-grid-4 section-gap">
        <div className="stat-card" style={{ textAlign: 'center' }}>
          <div className="stat-label">Record</div>
          <div className="stat-val" style={{ fontSize: '1.4rem' }}>{team.record.w}-{team.record.l}-{team.record.otl}-{team.record.sol || 0}</div>
          <div className="stat-sub">W · L · OTL · SOL</div>
        </div>
        <div className="stat-card" style={{ textAlign: 'center' }}>
          <div className="stat-label">Points</div>
          <div className="stat-val red">{team.points}</div>
          <div className="stat-sub">{ptsPct}% points rate</div>
        </div>
        <div className="stat-card" style={{ textAlign: 'center' }}>
          <div className="stat-label">Goal Differential</div>
          <div className="stat-val" style={{ color: diff >= 0 ? 'var(--green)' : 'var(--red)' }}>{diff >= 0 ? '+' : ''}{diff}</div>
          <div className="stat-sub">{team.goalsFor} GF · {team.goalsAgainst} GA</div>
        </div>
        <div className="stat-card" style={{ textAlign: 'center' }}>
          <div className="stat-label">Win Percentage</div>
          <div className="stat-val">{winPct}<span style={{ fontSize: '1rem', color: 'var(--muted)' }}>%</span></div>
          <div className="stat-sub">{gamesPlayed} games played</div>
        </div>
      </div>

      <div className="espn-header">
        <div className="espn-header-bar" />
        <h2>Home / Away Split</h2>
      </div>
      <div className="two-col section-gap">
        <div className="card">
          <h2>Home Record</h2>
          <div style={{ fontSize: '2.5rem', fontWeight: 900, textAlign: 'center', color: 'var(--green)' }}>
            {team.home.w}-{team.home.l}-{team.home.otl}-{team.home.sol || 0}
          </div>
          <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '0.8rem', marginTop: '0.5rem' }}>
            {team.home.w + team.home.l + team.home.otl + (team.home.sol || 0)} home games
          </div>
        </div>
        <div className="card">
          <h2>Away Record</h2>
          <div style={{ fontSize: '2.5rem', fontWeight: 900, textAlign: 'center', color: 'var(--red)' }}>
            {team.away.w}-{team.away.l}-{team.away.otl}{(team.away.sol || 0) > 0 ? `-${team.away.sol}` : ''}
          </div>
          <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '0.8rem', marginTop: '0.5rem' }}>
            {team.away.w + team.away.l + team.away.otl + (team.away.sol || 0)} away games
          </div>
        </div>
      </div>

      <div className="espn-header">
        <div className="espn-header-bar" />
        <h2>Recent Form</h2>
        <span className="subtitle">Last 5 games</span>
      </div>
      <div className="card">
        <div className="form-row">
          {last5.map(g => (
            <div className="form-item" key={g.id}>
              <span className={`badge badge-${g.result}`}>{g.result}</span>
              <small>{g.gf}–{g.ga}</small>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
