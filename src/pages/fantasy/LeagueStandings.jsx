import { useFantasyScoring } from '../../hooks/useFantasyScoring';

function PosBadge({ pos }) {
  const colors = { F: '#cc6600', D: '#0077cc', G: '#7700cc' };
  return (
    <span style={{
      fontSize: '0.55rem', fontWeight: 900, padding: '1px 5px', borderRadius: 3,
      background: colors[pos] ?? '#555', color: '#fff', letterSpacing: '0.04em',
    }}>{pos}</span>
  );
}

function fmtTime(date) {
  if (!date) return null;
  return date.toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit' });
}

function fmtFpts(n) {
  return Number.isInteger(n) ? n : n.toFixed(1);
}

// ── Head-to-head scoreboard (2 teams) ────────────────────────────────────────
function HeadToHead({ myTeam, opponent, myTeamId }) {
  const myWinning  = myTeam.totalPts  > opponent.totalPts;
  const oppWinning = opponent.totalPts > myTeam.totalPts;
  const tied       = myTeam.totalPts  === opponent.totalPts;

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center',
      gap: '1rem', background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 12, padding: '1.5rem 1rem', marginBottom: '1.5rem',
    }}>
      {/* My Team */}
      <div style={{ textAlign: 'center' }}>
        <div style={{
          fontWeight: 900, fontSize: '1rem', marginBottom: '0.4rem',
          color: myWinning ? 'gold' : 'var(--text)',
        }}>
          {myTeam.teamName}
          {myWinning && <span style={{ marginLeft: '0.4rem', fontSize: '0.8rem' }}>👑</span>}
        </div>
        <div style={{
          fontSize: '2.8rem', fontWeight: 900, lineHeight: 1,
          color: myWinning ? 'gold' : tied ? 'var(--muted)' : 'var(--text)',
        }}>
          {fmtFpts(myTeam.totalPts)}
        </div>
        <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: '0.35rem' }}>fantasy pts</div>
        <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: '0.25rem', fontWeight: 700 }}>
          {myWinning ? '🟢 Leading' : tied ? '— Tied' : '🔴 Trailing'}
        </div>
      </div>

      {/* VS */}
      <div style={{ textAlign: 'center', color: 'var(--muted2)', fontWeight: 900, fontSize: '1.1rem' }}>VS</div>

      {/* Opponent */}
      <div style={{ textAlign: 'center' }}>
        <div style={{
          fontWeight: 900, fontSize: '1rem', marginBottom: '0.4rem',
          color: oppWinning ? 'gold' : 'var(--text)',
        }}>
          {opponent.teamName}
          {oppWinning && <span style={{ marginLeft: '0.4rem', fontSize: '0.8rem' }}>👑</span>}
        </div>
        <div style={{
          fontSize: '2.8rem', fontWeight: 900, lineHeight: 1,
          color: oppWinning ? 'gold' : tied ? 'var(--muted)' : 'var(--text)',
        }}>
          {fmtFpts(opponent.totalPts)}
        </div>
        <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: '0.35rem' }}>fantasy pts</div>
        <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: '0.25rem', fontWeight: 700 }}>
          {oppWinning ? '🟢 Leading' : tied ? '— Tied' : '🔴 Trailing'}
        </div>
      </div>
    </div>
  );
}

// ── Multi-team standings table ────────────────────────────────────────────────
function StandingsTable({ teamScores, myTeamId }) {
  const sorted = [...teamScores].sort((a, b) => b.totalPts - a.totalPts);
  return (
    <div className="table-wrap" style={{ marginBottom: '1.5rem' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            <th style={{ textAlign: 'left', padding: '0.4rem 0.5rem', color: 'var(--muted)', fontWeight: 700, fontSize: '0.68rem' }}>#</th>
            <th style={{ textAlign: 'left', padding: '0.4rem 0.5rem', color: 'var(--muted)', fontWeight: 700, fontSize: '0.68rem' }}>Team</th>
            <th style={{ padding: '0.4rem 0.5rem', color: 'gold', fontWeight: 700, fontSize: '0.68rem' }}>FPTS</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((t, i) => (
            <tr key={t.leagueTeamId} style={{
              borderBottom: '1px solid var(--surface2)',
              background: t.leagueTeamId === myTeamId ? 'rgba(204,0,0,0.06)' : undefined,
            }}>
              <td style={{ padding: '0.5rem', color: 'var(--muted)', fontWeight: 700 }}>{i + 1}</td>
              <td style={{ padding: '0.5rem', fontWeight: t.leagueTeamId === myTeamId ? 800 : 600 }}>
                {t.teamName}
                {i === 0 && <span style={{ marginLeft: '0.4rem', fontSize: '0.8rem' }}>👑</span>}
                {t.leagueTeamId === myTeamId && (
                  <span style={{ marginLeft: '0.4rem', fontSize: '0.6rem', background: 'rgba(204,0,0,0.15)', color: 'var(--red)', padding: '1px 5px', borderRadius: 3, fontWeight: 800 }}>YOU</span>
                )}
              </td>
              <td style={{ padding: '0.5rem', textAlign: 'center', fontWeight: 800, color: i === 0 ? 'gold' : 'var(--text)' }}>
                {fmtFpts(t.totalPts)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Top-5 player breakdown per team ──────────────────────────────────────────
function TopPlayers({ team }) {
  const top5 = [...(team.playerBreakdown ?? [])]
    .sort((a, b) => b.fpts - a.fpts)
    .slice(0, 5);

  if (!top5.length) return (
    <div style={{ fontSize: '0.8rem', color: 'var(--muted)', textAlign: 'center', padding: '1rem' }}>
      No roster data yet
    </div>
  );

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
      <thead>
        <tr style={{ borderBottom: '1px solid var(--border)' }}>
          <th style={{ textAlign: 'left', padding: '0.3rem 0.4rem', color: 'var(--muted)', fontWeight: 700, fontSize: '0.64rem' }}>Player</th>
          <th style={{ padding: '0.3rem 0.4rem', color: 'var(--muted)', fontWeight: 700, fontSize: '0.64rem' }}>G</th>
          <th style={{ padding: '0.3rem 0.4rem', color: 'var(--muted)', fontWeight: 700, fontSize: '0.64rem' }}>A</th>
          <th style={{ padding: '0.3rem 0.4rem', color: 'var(--muted)', fontWeight: 700, fontSize: '0.64rem' }}>PTS</th>
          <th style={{ padding: '0.3rem 0.4rem', color: 'gold', fontWeight: 700, fontSize: '0.64rem' }}>FPTS</th>
        </tr>
      </thead>
      <tbody>
        {top5.map(p => (
          <tr key={p.player_id} style={{ borderBottom: '1px solid var(--surface2)' }}>
            <td style={{ padding: '0.35rem 0.4rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <span style={{ fontWeight: 600 }}>{p.player_name}</span>
                <PosBadge pos={p.position} />
              </div>
              <div style={{ fontSize: '0.62rem', color: 'var(--muted)' }}>{p.player_team_code}</div>
            </td>
            <td style={{ padding: '0.35rem 0.4rem', textAlign: 'center' }}>{p.stats?.g ?? 0}</td>
            <td style={{ padding: '0.35rem 0.4rem', textAlign: 'center' }}>{p.stats?.a ?? 0}</td>
            <td style={{ padding: '0.35rem 0.4rem', textAlign: 'center' }}>{p.stats?.pts ?? 0}</td>
            <td style={{ padding: '0.35rem 0.4rem', textAlign: 'center', fontWeight: 800, color: p.fpts > 0 ? 'gold' : 'var(--muted2)' }}>
              {fmtFpts(p.fpts)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ── Main LeagueStandings ──────────────────────────────────────────────────────
export default function LeagueStandings({ leagueCtx, onBack }) {
  const { teamScores, loading, error, lastUpdated, refresh } = useFantasyScoring(leagueCtx.leagueId);

  const myTeam   = teamScores.find(t => t.leagueTeamId === leagueCtx.leagueTeamId);
  const others   = teamScores.filter(t => t.leagueTeamId !== leagueCtx.leagueTeamId);
  const isH2H    = teamScores.length === 2;

  return (
    <div className="page">
      {/* Back nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '0.85rem' }}>
          ← Leagues
        </button>
        <button
          onClick={refresh}
          style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--muted)', fontSize: '0.75rem', padding: '3px 10px', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          Refresh
        </button>
      </div>

      {/* Header */}
      <div className="espn-header" style={{ marginBottom: '1rem' }}>
        <div className="espn-header-bar" style={{ background: 'gold' }} />
        <h2>🏆 Standings</h2>
        <span className="subtitle">
          {leagueCtx.leagueName}
          {lastUpdated && <> · Updated {fmtTime(lastUpdated)}</>}
        </span>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '4rem' }}>Loading scores…</div>
      )}

      {!loading && error && (
        <div className="auth-error" style={{ marginBottom: '1rem' }}>{error}</div>
      )}

      {!loading && !error && teamScores.length === 0 && (
        <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '3rem' }}>
          No teams found in this league.
        </div>
      )}

      {!loading && teamScores.length > 0 && (
        <>
          {/* ── Scoreboard ─────────────────────────────────────────────────── */}
          {isH2H && myTeam && others[0] ? (
            <HeadToHead myTeam={myTeam} opponent={others[0]} myTeamId={leagueCtx.leagueTeamId} />
          ) : (
            <StandingsTable teamScores={teamScores} myTeamId={leagueCtx.leagueTeamId} />
          )}

          {/* ── Empty state when no playoff games yet ──────────────────────── */}
          {teamScores.every(t => t.totalPts === 0) && (
            <div style={{
              background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8,
              padding: '1rem 1.25rem', fontSize: '0.82rem', color: 'var(--muted)',
              textAlign: 'center', marginBottom: '1.5rem',
            }}>
              All scores are 0 — playoff stats aren't available until games are played.
              <div style={{ fontSize: '0.75rem', color: 'var(--muted2)', marginTop: '0.3rem' }}>Round 1 begins March 27</div>
            </div>
          )}

          {/* ── Top 5 per team ─────────────────────────────────────────────── */}
          <div className="espn-header" style={{ marginBottom: '0.75rem' }}>
            <div className="espn-header-bar" />
            <h2>Top Scorers by Team</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {[...teamScores].sort((a, b) => b.totalPts - a.totalPts).map(team => (
              <div key={team.leagueTeamId} style={{
                background: 'var(--surface)', border: `1px solid ${team.leagueTeamId === leagueCtx.leagueTeamId ? 'var(--red)' : 'var(--border)'}`,
                borderRadius: 10, overflow: 'hidden',
              }}>
                <div style={{
                  padding: '0.6rem 0.75rem', borderBottom: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: team.leagueTeamId === leagueCtx.leagueTeamId ? 'rgba(204,0,0,0.06)' : undefined,
                }}>
                  <div>
                    <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>{team.teamName}</span>
                    {team.leagueTeamId === leagueCtx.leagueTeamId && (
                      <span style={{ marginLeft: '0.4rem', fontSize: '0.6rem', background: 'rgba(204,0,0,0.15)', color: 'var(--red)', padding: '1px 5px', borderRadius: 3, fontWeight: 800 }}>YOU</span>
                    )}
                  </div>
                  <span style={{ fontSize: '1.1rem', fontWeight: 900, color: team.totalPts > 0 ? 'gold' : 'var(--muted2)' }}>
                    {fmtFpts(team.totalPts)} pts
                  </span>
                </div>
                <div style={{ padding: '0.25rem 0.35rem' }}>
                  <TopPlayers team={team} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
