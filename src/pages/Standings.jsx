import { useStandings }        from '../hooks/useStandings';
import { useRempartsSchedule } from '../hooks/useRempartsSchedule';

export default function Standings({ teamData }) {
  const { team } = teamData;
  const { east, loading: standingsLoading } = useStandings();
  const { schedule: liveGames }             = useRempartsSchedule();

  const league = team.name === 'Bearcats' ? 'MHL' : 'LHJMQ';

  // ── Live standings row for the Remparts ──────────────────────────────────
  const rem = east.find(t => t.code === 'Que') ?? null;
  const gp  = rem?.gp  ?? 0;
  const w   = rem?.w   ?? 0;
  const l   = rem?.l   ?? 0;
  const otl = rem?.otl ?? 0;
  const pts = rem?.pts ?? 0;
  const gf  = rem?.gf  ?? 0;
  const ga  = rem?.ga  ?? 0;
  const diff    = gf - ga;
  const winPct  = gp > 0 ? ((w / gp) * 100).toFixed(1) : '0.0';
  const ptsPct  = gp > 0 ? ((pts / (gp * 2)) * 100).toFixed(1) : '0.0';

  // ── Derived splits from live schedule ────────────────────────────────────
  const completed = liveGames.filter(g => g.result !== 'upcoming');
  const last5     = [...completed].slice(-5);
  const last10    = [...completed].slice(-10);
  const l10w      = last10.filter(g => g.result === 'W').length;
  const l10l      = last10.filter(g => g.result === 'L').length;
  const l10o      = last10.filter(g => g.result === 'OTL').length;

  // Home / Away
  const homeGames = completed.filter(g => g.home);
  const awayGames = completed.filter(g => !g.home);
  const homeRec = {
    w:   homeGames.filter(g => g.result === 'W').length,
    l:   homeGames.filter(g => g.result === 'L').length,
    otl: homeGames.filter(g => g.result === 'OTL').length,
  };
  const awayRec = {
    w:   awayGames.filter(g => g.result === 'W').length,
    l:   awayGames.filter(g => g.result === 'L').length,
    otl: awayGames.filter(g => g.result === 'OTL').length,
  };

  // Streak
  let streak = '—';
  if (completed.length > 0) {
    const rev  = [...completed].reverse();
    const type = rev[0].result;
    let   cnt  = 0;
    for (const g of rev) { if (g.result === type) cnt++; else break; }
    streak = `${type}${cnt}`;
  }

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
              <td>{standingsLoading ? '…' : gp}</td>
              <td style={{ color: 'var(--green)', fontWeight: 700 }}>{standingsLoading ? '…' : w}</td>
              <td style={{ color: 'var(--red)' }}>{standingsLoading ? '…' : l}</td>
              <td style={{ color: 'var(--orange)' }}>{standingsLoading ? '…' : otl}</td>
              <td className="pts-cell" style={{ fontSize: '1rem' }}>{standingsLoading ? '…' : pts}</td>
              <td style={{ color: 'var(--muted)' }}>{standingsLoading ? '…' : `${ptsPct}%`}</td>
              <td>{standingsLoading ? '…' : gf}</td>
              <td>{standingsLoading ? '…' : ga}</td>
              <td style={{ color: diff >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 700 }}>
                {standingsLoading ? '…' : `${diff >= 0 ? '+' : ''}${diff}`}
              </td>
              <td style={{ color: 'var(--muted)' }}>{l10w}-{l10l}-{l10o}</td>
              <td><span className={`badge badge-${streak.charAt(0)}`}>{streak}</span></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="stat-grid stat-grid-4 section-gap">
        <div className="stat-card" style={{ textAlign: 'center' }}>
          <div className="stat-label">Record</div>
          <div className="stat-val" style={{ fontSize: '1.4rem' }}>
            {standingsLoading ? '…' : `${w}-${l}-${otl}`}
          </div>
          <div className="stat-sub">W · L · OTL</div>
        </div>
        <div className="stat-card" style={{ textAlign: 'center' }}>
          <div className="stat-label">Points</div>
          <div className="stat-val red">{standingsLoading ? '…' : pts}</div>
          <div className="stat-sub">{standingsLoading ? '' : `${ptsPct}% points rate`}</div>
        </div>
        <div className="stat-card" style={{ textAlign: 'center' }}>
          <div className="stat-label">Goal Differential</div>
          <div className="stat-val" style={{ color: diff >= 0 ? 'var(--green)' : 'var(--red)' }}>
            {standingsLoading ? '…' : `${diff >= 0 ? '+' : ''}${diff}`}
          </div>
          <div className="stat-sub">{standingsLoading ? '' : `${gf} GF · ${ga} GA`}</div>
        </div>
        <div className="stat-card" style={{ textAlign: 'center' }}>
          <div className="stat-label">Win Percentage</div>
          <div className="stat-val">
            {standingsLoading ? '…' : winPct}
            {!standingsLoading && <span style={{ fontSize: '1rem', color: 'var(--muted)' }}>%</span>}
          </div>
          <div className="stat-sub">{standingsLoading ? '' : `${gp} games played`}</div>
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
            {homeRec.w}-{homeRec.l}-{homeRec.otl}
          </div>
          <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '0.8rem', marginTop: '0.5rem' }}>
            {homeRec.w + homeRec.l + homeRec.otl} home games
          </div>
        </div>
        <div className="card">
          <h2>Away Record</h2>
          <div style={{ fontSize: '2.5rem', fontWeight: 900, textAlign: 'center', color: 'var(--red)' }}>
            {awayRec.w}-{awayRec.l}-{awayRec.otl}
          </div>
          <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '0.8rem', marginTop: '0.5rem' }}>
            {awayRec.w + awayRec.l + awayRec.otl} away games
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
          {last5.map((g, i) => (
            <div className="form-item" key={g.gameId ?? i}>
              <span className={`badge badge-${g.result}`}>{g.result}</span>
              <small>{g.gf}–{g.ga}</small>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
