import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

function PosBadge({ pos }) {
  const colors = { F: '#cc6600', D: '#0077cc', G: '#7700cc' };
  return (
    <span style={{
      fontSize: '0.6rem', fontWeight: 900, padding: '2px 6px', borderRadius: 3,
      background: colors[pos] ?? '#555', color: '#fff', letterSpacing: '0.04em',
    }}>{pos}</span>
  );
}

function DropModal({ player, onConfirm, onCancel, dropping }) {
  return (
    <div className="auth-overlay" onClick={onCancel}>
      <div className="auth-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 380 }}>
        <button className="auth-close" onClick={onCancel}>✕</button>
        <div className="auth-logo">⚠️</div>
        <h2 className="auth-title">Drop Player?</h2>
        <p className="auth-sub" style={{ marginBottom: '1.5rem' }}>
          <strong style={{ color: 'var(--text)' }}>{player.player_name}</strong> will be placed on waivers.
          This cannot be undone.
        </p>
        <button className="auth-submit" style={{ background: 'var(--red)' }} disabled={dropping} onClick={onConfirm}>
          {dropping ? 'Dropping…' : 'Yes, Drop Player'}
        </button>
        <button
          style={{ display: 'block', width: '100%', textAlign: 'center', background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '0.82rem', fontFamily: 'inherit', marginTop: '0.5rem' }}
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function RosterSection({ title, players, allStats, onDrop }) {
  if (!players.length) return null;
  const isGoalie = players[0]?.position === 'G';
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <div className="espn-header" style={{ marginBottom: '0.5rem' }}>
        <div className="espn-header-bar" />
        <h2>{title}</h2>
        <span className="subtitle">{players.length} players</span>
      </div>
      <div className="table-wrap">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th style={{ textAlign: 'left', padding: '0.4rem 0.5rem', color: 'var(--muted)', fontWeight: 700, fontSize: '0.68rem' }}>Player</th>
                <th style={{ padding: '0.4rem 0.5rem', color: 'var(--muted)', fontWeight: 700, fontSize: '0.68rem' }}>Team</th>
                <th style={{ padding: '0.4rem 0.5rem', color: 'var(--muted)', fontWeight: 700, fontSize: '0.68rem' }}>GP</th>
                {isGoalie ? (
                  <>
                    <th style={{ padding: '0.4rem 0.5rem', color: 'var(--muted)', fontWeight: 700, fontSize: '0.68rem' }}>G</th>
                    <th style={{ padding: '0.4rem 0.5rem', color: 'var(--muted)', fontWeight: 700, fontSize: '0.68rem' }}>A</th>
                  </>
                ) : (
                  <>
                    <th style={{ padding: '0.4rem 0.5rem', color: 'var(--muted)', fontWeight: 700, fontSize: '0.68rem' }}>G</th>
                    <th style={{ padding: '0.4rem 0.5rem', color: 'var(--muted)', fontWeight: 700, fontSize: '0.68rem' }}>A</th>
                    <th style={{ padding: '0.4rem 0.5rem', color: 'var(--muted)', fontWeight: 700, fontSize: '0.68rem' }}>PTS</th>
                    <th style={{ padding: '0.4rem 0.5rem', color: 'var(--muted)', fontWeight: 700, fontSize: '0.68rem' }}>+/-</th>
                  </>
                )}
                <th style={{ padding: '0.4rem 0.5rem' }}></th>
              </tr>
            </thead>
            <tbody>
              {players.map(row => {
                const stats = allStats.find(p => p.player_id === row.player_id) ?? {};
                return (
                  <tr key={row.id} style={{ borderBottom: '1px solid var(--surface2)' }}>
                    <td style={{ padding: '0.5rem', textAlign: 'left' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {stats.photo_url && (
                          <img src={stats.photo_url} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', background: 'var(--surface3)' }}
                            onError={e => { e.target.style.display = 'none'; }} />
                        )}
                        <div>
                          <div style={{ fontWeight: 600 }}>{row.player_name}</div>
                          <PosBadge pos={row.position} />
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '0.5rem', textAlign: 'center', color: 'var(--muted)', fontSize: '0.75rem' }}>{row.player_team_code}</td>
                    <td style={{ padding: '0.5rem', textAlign: 'center' }}>{stats.gp ?? '—'}</td>
                    {isGoalie ? (
                      <>
                        <td style={{ padding: '0.5rem', textAlign: 'center' }}>{stats.g ?? '—'}</td>
                        <td style={{ padding: '0.5rem', textAlign: 'center' }}>{stats.a ?? '—'}</td>
                      </>
                    ) : (
                      <>
                        <td style={{ padding: '0.5rem', textAlign: 'center' }}>{stats.g ?? '—'}</td>
                        <td style={{ padding: '0.5rem', textAlign: 'center' }}>{stats.a ?? '—'}</td>
                        <td style={{ padding: '0.5rem', textAlign: 'center', fontWeight: 700 }}>{stats.pts ?? '—'}</td>
                        <td style={{ padding: '0.5rem', textAlign: 'center', color: (stats.plus_minus ?? 0) >= 0 ? 'var(--green)' : 'var(--red)' }}>
                          {stats.plus_minus != null ? `${stats.plus_minus >= 0 ? '+' : ''}${stats.plus_minus}` : '—'}
                        </td>
                      </>
                    )}
                    <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                      <button
                        onClick={() => onDrop(row)}
                        style={{
                          background: 'none', border: '1px solid var(--border)', borderRadius: 5,
                          color: 'var(--muted)', fontSize: '0.72rem', padding: '3px 8px', cursor: 'pointer',
                          fontFamily: 'inherit', transition: 'border-color 0.15s, color 0.15s',
                        }}
                        onMouseOver={e => { e.target.style.borderColor = 'var(--red)'; e.target.style.color = 'var(--red)'; }}
                        onMouseOut={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.color = 'var(--muted)'; }}
                      >
                        Drop
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Main MyTeam ───────────────────────────────────────────────────────────────
export default function MyTeam({ leagueCtx, onBack }) {
  const isPlayoff = leagueCtx.leagueSeason === '2025-26 Playoffs';

  const [roster,   setRoster]   = useState([]);
  const [players,  setPlayers]  = useState([]);
  const [poStats,  setPoStats]  = useState([]);   // playoff stats from /api/playoffplayers
  const [loading,  setLoading]  = useState(true);
  const [dropping, setDropping] = useState(false);
  const [confirmDrop, setConfirmDrop] = useState(null);

  useEffect(() => {
    async function load() {
      const fetches = [
        supabase.from('fantasy_rosters')
          .select('*')
          .eq('league_team_id', leagueCtx.leagueTeamId)
          .order('position')
          .order('player_name'),
        fetch('/api/allplayers').then(r => r.ok ? r.json() : { players: [] }),
      ];
      if (isPlayoff) {
        fetches.push(fetch('/api/playoffplayers').then(r => r.ok ? r.json() : { players: [] }));
      }
      const [rosterRes, playersRes, poRes] = await Promise.all(fetches);
      setRoster(rosterRes.data ?? []);
      setPlayers(playersRes.players ?? []);
      if (poRes) setPoStats(poRes.players ?? []);
      setLoading(false);
    }
    load();
  }, [leagueCtx.leagueTeamId, isPlayoff]);

  async function handleDrop() {
    const row = confirmDrop;
    setDropping(true);
    await supabase.from('fantasy_rosters').delete().eq('id', row.id);
    await supabase.from('fantasy_waiver_claims').insert({
      league_id:       leagueCtx.leagueId,
      league_team_id:  leagueCtx.leagueTeamId,
      add_player_id:   'WAIVER',
      add_player_name: 'Waiver',
      drop_player_id:  row.player_id,
      drop_player_name: row.player_name,
      status: 'approved',
    });
    setRoster(prev => prev.filter(p => p.id !== row.id));
    setConfirmDrop(null);
    setDropping(false);
  }

  if (loading) return (
    <div className="page">
      <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '4rem' }}>Loading roster…</div>
    </div>
  );

  const forwards = roster.filter(p => p.position === 'F');
  const defence  = roster.filter(p => p.position === 'D');
  const goalies  = roster.filter(p => p.position === 'G');
  const total    = roster.length;

  return (
    <div className="page">
      {confirmDrop && (
        <DropModal
          player={confirmDrop}
          dropping={dropping}
          onConfirm={handleDrop}
          onCancel={() => setConfirmDrop(null)}
        />
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '0.85rem' }}>← Leagues</button>
      </div>

      <div className="espn-header">
        <div className="espn-header-bar" />
        <h2>My Team</h2>
        <span className="subtitle">{leagueCtx.leagueName} · {leagueCtx.teamName ?? ''} · {total}/25 players</span>
      </div>

      {total === 0 && (
        <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '3rem' }}>
          Your roster is empty — the draft may still be in progress.
        </div>
      )}

      {/* ── Playoff scoring summary ──────────────────────────────────── */}
      {isPlayoff && (
        <div style={{ marginBottom: '1.5rem' }}>
          <div className="espn-header">
            <div className="espn-header-bar" style={{ background: 'gold' }} />
            <h2>🏆 Playoff Scoring</h2>
            <span className="subtitle">2025-26 Playoffs · Stats update after each game</span>
          </div>
          {poStats.length === 0 ? (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '1.25rem', textAlign: 'center', color: 'var(--muted)', fontSize: '0.85rem' }}>
              No playoff stats yet — check back after games are played.
              <div style={{ fontSize: '0.75rem', color: 'var(--muted2)', marginTop: '0.4rem' }}>Round 1 begins March 27</div>
            </div>
          ) : (
            <div className="table-wrap">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th style={{ textAlign: 'left', padding: '0.4rem 0.5rem', color: 'var(--muted)', fontWeight: 700, fontSize: '0.68rem' }}>Player</th>
                    <th style={{ padding: '0.4rem 0.5rem', color: 'var(--muted)', fontWeight: 700, fontSize: '0.68rem' }}>Team</th>
                    <th style={{ padding: '0.4rem 0.5rem', color: 'var(--muted)', fontWeight: 700, fontSize: '0.68rem' }}>GP</th>
                    <th style={{ padding: '0.4rem 0.5rem', color: 'var(--muted)', fontWeight: 700, fontSize: '0.68rem' }}>G</th>
                    <th style={{ padding: '0.4rem 0.5rem', color: 'var(--muted)', fontWeight: 700, fontSize: '0.68rem' }}>A</th>
                    <th style={{ padding: '0.4rem 0.5rem', color: 'var(--muted)', fontWeight: 700, fontSize: '0.68rem', color: 'gold' }}>PTS</th>
                  </tr>
                </thead>
                <tbody>
                  {roster
                    .map(row => {
                      const po = poStats.find(p => p.player_id === row.player_id);
                      return { ...row, poGP: po?.gp ?? 0, poG: po?.g ?? 0, poA: po?.a ?? 0, poPTS: po?.pts ?? 0 };
                    })
                    .sort((a, b) => b.poPTS - a.poPTS || b.poG - a.poG)
                    .map(row => (
                      <tr key={row.id} style={{ borderBottom: '1px solid var(--surface2)' }}>
                        <td style={{ padding: '0.5rem', textAlign: 'left' }}>
                          <div style={{ fontWeight: 600 }}>{row.player_name}</div>
                          <PosBadge pos={row.position} />
                        </td>
                        <td style={{ padding: '0.5rem', textAlign: 'center', color: 'var(--muted)', fontSize: '0.75rem' }}>{row.player_team_code}</td>
                        <td style={{ padding: '0.5rem', textAlign: 'center', color: row.poGP === 0 ? 'var(--muted2)' : 'var(--text)' }}>{row.poGP}</td>
                        <td style={{ padding: '0.5rem', textAlign: 'center' }}>{row.poG || '—'}</td>
                        <td style={{ padding: '0.5rem', textAlign: 'center' }}>{row.poA || '—'}</td>
                        <td style={{ padding: '0.5rem', textAlign: 'center', fontWeight: 800, color: row.poPTS > 0 ? 'gold' : 'var(--muted2)' }}>
                          {row.poPTS || '—'}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <RosterSection title={`Forwards (${forwards.length}/13)`} players={forwards} allStats={players} onDrop={setConfirmDrop} />
      <RosterSection title={`Defence (${defence.length}/7)`}    players={defence}  allStats={players} onDrop={setConfirmDrop} />
      <RosterSection title={`Goalies (${goalies.length}/2)`}    players={goalies}  allStats={players} onDrop={setConfirmDrop} />
    </div>
  );
}
