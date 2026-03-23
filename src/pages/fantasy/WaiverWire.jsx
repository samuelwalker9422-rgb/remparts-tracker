import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';

// ── Shared helpers ────────────────────────────────────────────────────────────
function isElim(poTeams, teamCode) {
  return (poTeams?.eliminatedCodes ?? [])
    .some(c => c.toUpperCase() === (teamCode ?? '').toUpperCase());
}

function PosBadge({ pos }) {
  const colors = { F: '#cc6600', D: '#0077cc', G: '#7700cc' };
  return (
    <span style={{
      fontSize: '0.58rem', fontWeight: 900, padding: '1px 5px', borderRadius: 3,
      background: colors[pos] ?? '#555', color: '#fff', letterSpacing: '0.04em', flexShrink: 0,
    }}>{pos}</span>
  );
}

// ── Drop confirm modal ────────────────────────────────────────────────────────
function DropModal({ player, dropping, onConfirm, onCancel }) {
  return (
    <div className="auth-overlay" onClick={onCancel}>
      <div className="auth-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 380 }}>
        <button className="auth-close" onClick={onCancel}>✕</button>
        <div className="auth-logo">⚠️</div>
        <h2 className="auth-title">Drop Player?</h2>
        <p className="auth-sub" style={{ marginBottom: '1.5rem' }}>
          <strong style={{ color: 'var(--text)' }}>{player.player_name}</strong> will be released to the
          waiver wire. This cannot be undone.
        </p>
        <button
          className="auth-submit"
          style={{ background: 'var(--red)' }}
          disabled={dropping}
          onClick={onConfirm}
        >
          {dropping ? 'Dropping…' : 'Yes, Drop Player'}
        </button>
        <button
          style={{
            display: 'block', width: '100%', textAlign: 'center',
            background: 'none', border: 'none', color: 'var(--muted)',
            cursor: 'pointer', fontSize: '0.82rem', fontFamily: 'inherit', marginTop: '0.5rem',
          }}
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── LEFT: My Roster panel ─────────────────────────────────────────────────────
function MyRoster({ roster, poStats, poTeams, onDrop }) {
  const byPos = ['F', 'D', 'G'];
  const sorted = [...roster].sort((a, b) => {
    const pi = byPos.indexOf(a.position);
    const qi = byPos.indexOf(b.position);
    if (pi !== qi) return pi - qi;
    return a.player_name.localeCompare(b.player_name);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
      {sorted.map(p => {
        const s    = poStats.find(x => x.player_id === p.player_id) ?? {};
        const elim = isElim(poTeams, p.player_team_code);
        return (
          <div
            key={p.id}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 8, padding: '0.5rem 0.6rem',
              opacity: elim ? 0.65 : 1,
            }}
          >
            {/* Name + badges */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700, fontSize: '0.82rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.player_name}
                </span>
                <PosBadge pos={p.position} />
                {poTeams && (
                  elim
                    ? <span style={{ fontSize: '0.55rem', color: 'var(--muted2)', fontWeight: 800 }}>ELIM</span>
                    : <span style={{ fontSize: '0.65rem', color: 'var(--green)' }}>●</span>
                )}
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--muted)', marginTop: '0.1rem' }}>
                {p.player_team_code}
                {s.gp != null && ` · ${s.gp}GP · ${s.g ?? 0}G · ${s.a ?? 0}A · ${s.pts ?? 0}PTS`}
              </div>
            </div>
            {/* Drop button */}
            <button
              onClick={() => onDrop(p)}
              style={{
                background: 'none', border: '1px solid var(--border)', borderRadius: 5,
                color: 'var(--muted)', fontSize: '0.72rem', padding: '3px 8px',
                cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
                transition: 'border-color 0.15s, color 0.15s',
              }}
              onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--red)'; e.currentTarget.style.color = 'var(--red)'; }}
              onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--muted)'; }}
            >
              Drop
            </button>
          </div>
        );
      })}
      {roster.length === 0 && (
        <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '2rem', fontSize: '0.85rem' }}>
          Roster is empty
        </div>
      )}
    </div>
  );
}

// ── RIGHT: Available players panel ───────────────────────────────────────────
function AvailablePlayers({ players, rosterSize, poTeams, onClaim, claiming }) {
  const [search,    setSearch]    = useState('');
  const [posFilter, setPosFilter] = useState('ALL');

  const filtered = useMemo(() => players
    .filter(p => {
      if (posFilter !== 'ALL' && p.position !== posFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return p.name.toLowerCase().includes(q) || p.team_code.toLowerCase().includes(q);
      }
      return true;
    })
    .sort((a, b) => {
      // Active teams first
      const ae = isElim(poTeams, a.team_code) ? 1 : 0;
      const be = isElim(poTeams, b.team_code) ? 1 : 0;
      if (ae !== be) return ae - be;
      return b.pts - a.pts || b.g - a.g;
    }),
  [players, posFilter, search, poTeams]);

  const full = rosterSize >= 25;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Controls */}
      <div style={{ marginBottom: '0.6rem' }}>
        <input
          type="text"
          placeholder="Search players…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%', padding: '0.45rem 0.7rem', borderRadius: 7, boxSizing: 'border-box',
            background: 'var(--surface2)', border: '1px solid var(--border)',
            color: 'var(--text)', fontFamily: 'inherit', fontSize: '0.82rem', marginBottom: '0.4rem',
          }}
        />
        <div style={{ display: 'flex', gap: '0.3rem' }}>
          {['ALL', 'F', 'D', 'G'].map(pos => (
            <button
              key={pos}
              onClick={() => setPosFilter(pos)}
              style={{
                padding: '3px 10px', borderRadius: 5, border: '1px solid',
                borderColor: posFilter === pos ? 'var(--red)' : 'var(--border)',
                background: posFilter === pos ? 'rgba(204,0,0,0.15)' : 'var(--surface2)',
                color: posFilter === pos ? 'var(--red)' : 'var(--muted)',
                fontWeight: posFilter === pos ? 800 : 400,
                cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.75rem',
              }}
            >{pos}</button>
          ))}
          <span style={{ marginLeft: 'auto', fontSize: '0.72rem', color: 'var(--muted)', alignSelf: 'center' }}>
            {filtered.length} available
          </span>
        </div>
      </div>

      {full && (
        <div style={{
          background: 'rgba(204,0,0,0.08)', border: '1px solid rgba(204,0,0,0.25)',
          borderRadius: 7, padding: '0.5rem 0.75rem', marginBottom: '0.5rem',
          fontSize: '0.78rem', color: 'var(--red)',
        }}>
          ⚠️ Roster is full (25/25) — drop a player first before claiming.
        </div>
      )}

      {/* Player list */}
      <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
        {filtered.map(p => {
          const elim = isElim(poTeams, p.team_code);
          return (
            <div
              key={p.player_id}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 8, padding: '0.45rem 0.6rem',
                opacity: elim ? 0.65 : 1,
              }}
            >
              <img
                src={p.photo_url}
                alt=""
                style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover', background: 'var(--surface3)', flexShrink: 0 }}
                onError={e => { e.target.style.display = 'none'; }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.82rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.name}
                  </span>
                  <PosBadge pos={p.position} />
                  {poTeams && (
                    elim
                      ? <span style={{ fontSize: '0.55rem', color: 'var(--muted2)', fontWeight: 800 }}>ELIM</span>
                      : <span style={{ fontSize: '0.65rem', color: 'var(--green)' }}>●</span>
                  )}
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--muted)', marginTop: '0.1rem' }}>
                  {p.team_code} · {p.gp}GP · {p.g}G · {p.a}A · <strong style={{ color: 'var(--text)' }}>{p.pts}PTS</strong>
                </div>
              </div>
              <button
                onClick={() => !full && onClaim(p)}
                disabled={full || claiming === p.player_id}
                style={{
                  background: full ? 'var(--surface2)' : 'rgba(0,166,81,0.15)',
                  border: `1px solid ${full ? 'var(--border)' : 'rgba(0,166,81,0.35)'}`,
                  color: full ? 'var(--muted2)' : 'var(--green)',
                  borderRadius: 5, fontSize: '0.72rem', padding: '3px 8px',
                  cursor: full ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit', flexShrink: 0, fontWeight: 700,
                }}
              >
                {claiming === p.player_id ? 'Adding…' : 'Claim'}
              </button>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '2rem', fontSize: '0.85rem' }}>
            No players found
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main WaiverWire ───────────────────────────────────────────────────────────
export default function WaiverWire({ leagueCtx, onBack }) {
  const [roster,      setRoster]      = useState([]);
  const [allPlayers,  setAllPlayers]  = useState([]);
  const [takenIds,    setTakenIds]    = useState(new Set());
  const [poStats,     setPoStats]     = useState([]);
  const [poTeams,     setPoTeams]     = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [confirmDrop, setConfirmDrop] = useState(null); // roster row to drop
  const [dropping,    setDropping]    = useState(false);
  const [claiming,    setClaiming]    = useState(null); // player_id being claimed
  const [toast,       setToast]       = useState('');   // success/error message

  const isPlayoff = leagueCtx.leagueSeason === '2025-26 Playoffs';

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  }

  // ── Load everything ────────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      const fetches = [
        // My roster
        supabase.from('fantasy_rosters')
          .select('*')
          .eq('league_team_id', leagueCtx.leagueTeamId)
          .order('position').order('player_name'),
        // All 625 players
        fetch('/api/allplayers').then(r => r.ok ? r.json() : { players: [] }),
        // All rostered player_ids in this league (to filter out taken players)
        supabase.from('fantasy_rosters')
          .select('player_id')
          .in('league_team_id',
            (await supabase.from('fantasy_league_teams').select('id').eq('league_id', leagueCtx.leagueId))
              .data?.map(t => t.id) ?? []
          ),
      ];
      if (isPlayoff) {
        fetches.push(fetch('/api/playoffplayers').then(r => r.ok ? r.json() : { players: [] }));
        fetches.push(fetch('/api/playoffteams').then(r => r.ok ? r.json() : null).catch(() => null));
      }

      const [rosterRes, allRes, takenRes, poRes, poTeamsRes] = await Promise.all(fetches);

      setRoster(rosterRes.data ?? []);
      setAllPlayers(allRes.players ?? []);
      setTakenIds(new Set((takenRes.data ?? []).map(r => r.player_id)));
      if (poRes)      setPoStats(poRes.players ?? []);
      if (poTeamsRes) setPoTeams(poTeamsRes);
      setLoading(false);
    }
    load();
  }, [leagueCtx.leagueTeamId, leagueCtx.leagueId, isPlayoff]);

  // ── Drop a player ─────────────────────────────────────────────────────────
  async function handleDrop() {
    const row = confirmDrop;
    setDropping(true);
    try {
      const { error: e1 } = await supabase.from('fantasy_rosters').delete().eq('id', row.id);
      if (e1) throw e1;

      await supabase.from('fantasy_waiver_claims').insert({
        league_id:        leagueCtx.leagueId,
        league_team_id:   leagueCtx.leagueTeamId,
        add_player_id:    'WAIVER',
        add_player_name:  'Waiver',
        drop_player_id:   row.player_id,
        drop_player_name: row.player_name,
        status:           'approved',
      });

      setRoster(prev => prev.filter(p => p.id !== row.id));
      setTakenIds(prev => { const n = new Set(prev); n.delete(row.player_id); return n; });
      setConfirmDrop(null);
      showToast(`✓ ${row.player_name} dropped to waivers`);
    } catch (e) {
      console.error('Drop error:', e);
      showToast('Drop failed: ' + (e.message ?? 'unknown error'));
    }
    setDropping(false);
  }

  // ── Claim a free agent ─────────────────────────────────────────────────────
  async function handleClaim(player) {
    if (roster.length >= 25) return; // guard — button is also disabled
    setClaiming(player.player_id);
    try {
      const { error } = await supabase.from('fantasy_rosters').insert({
        league_team_id:   leagueCtx.leagueTeamId,
        player_id:        player.player_id,
        player_name:      player.name,
        player_team_code: player.team_code,
        position:         player.position,
        acquired_via:     'waiver',
      });
      if (error) throw error;

      await supabase.from('fantasy_waiver_claims').insert({
        league_id:        leagueCtx.leagueId,
        league_team_id:   leagueCtx.leagueTeamId,
        add_player_id:    player.player_id,
        add_player_name:  player.name,
        drop_player_id:   'WAIVER',
        drop_player_name: 'Waiver',
        status:           'approved',
      });

      // Optimistic update — add to roster display, mark as taken
      const newRow = {
        id:               crypto.randomUUID(),
        league_team_id:   leagueCtx.leagueTeamId,
        player_id:        player.player_id,
        player_name:      player.name,
        player_team_code: player.team_code,
        position:         player.position,
        acquired_via:     'waiver',
      };
      setRoster(prev => [...prev, newRow]);
      setTakenIds(prev => new Set([...prev, player.player_id]));
      showToast(`✓ ${player.name} added to your roster`);
    } catch (e) {
      console.error('Claim error:', e);
      showToast('Claim failed: ' + (e.message ?? 'unknown error'));
    }
    setClaiming(null);
  }

  // Players available = all 625 minus any already on a roster in this league
  const available = useMemo(
    () => allPlayers.filter(p => !takenIds.has(p.player_id)),
    [allPlayers, takenIds]
  );

  // Merge playoff stats into available list if we have them
  const availableWithStats = useMemo(() => {
    if (!isPlayoff || poStats.length === 0) return available;
    const map = Object.fromEntries(poStats.map(s => [s.player_id, s]));
    return available.map(p => ({ ...p, ...(map[p.player_id] ? { pts: map[p.player_id].pts, g: map[p.player_id].g, a: map[p.player_id].a, gp: map[p.player_id].gp } : {}) }));
  }, [available, poStats, isPlayoff]);

  if (loading) return (
    <div className="page">
      <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '4rem' }}>Loading waiver wire…</div>
    </div>
  );

  return (
    <div className="page" style={{ paddingBottom: '1rem' }}>
      {/* Drop modal */}
      {confirmDrop && (
        <DropModal
          player={confirmDrop}
          dropping={dropping}
          onConfirm={handleDrop}
          onCancel={() => setConfirmDrop(null)}
        />
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: '4.5rem', right: '1rem', zIndex: 200,
          background: toast.startsWith('✓') ? 'rgba(0,166,81,0.9)' : 'rgba(204,0,0,0.9)',
          color: '#fff', padding: '0.6rem 1rem', borderRadius: 8,
          fontSize: '0.82rem', fontWeight: 700, boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
          maxWidth: 280,
        }}>
          {toast}
        </div>
      )}

      {/* Back nav */}
      <div style={{ marginBottom: '0.75rem' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '0.85rem' }}>
          ← My Team
        </button>
      </div>

      {/* Header */}
      <div className="espn-header" style={{ marginBottom: '1rem' }}>
        <div className="espn-header-bar" />
        <h2>🔄 Waiver Wire</h2>
        <span className="subtitle">
          {leagueCtx.leagueName} · {roster.length}/25 rostered
        </span>
      </div>

      {/* Two-column layout */}
      <div className="waiver-two-col" style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.4fr)',
        gap: '1.25rem',
        alignItems: 'start',
      }}>

        {/* ── LEFT: My Roster ────────────────────────────────────────────── */}
        <div>
          <div style={{
            fontSize: '0.65rem', fontWeight: 900, color: 'var(--muted)',
            letterSpacing: '0.08em', marginBottom: '0.5rem',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span>MY ROSTER</span>
            <span style={{ fontWeight: 400 }}>{roster.length}/25</span>
          </div>
          <MyRoster
            roster={roster}
            poStats={poStats}
            poTeams={poTeams}
            onDrop={setConfirmDrop}
          />
        </div>

        {/* ── RIGHT: Available ───────────────────────────────────────────── */}
        <div className="waiver-right-col" style={{ position: 'sticky', top: '4rem', maxHeight: 'calc(100vh - 6rem)', display: 'flex', flexDirection: 'column' }}>
          <div style={{
            fontSize: '0.65rem', fontWeight: 900, color: 'var(--muted)',
            letterSpacing: '0.08em', marginBottom: '0.5rem',
          }}>
            FREE AGENTS ({available.length})
          </div>
          <AvailablePlayers
            players={availableWithStats}
            rosterSize={roster.length}
            poTeams={poTeams}
            onClaim={handleClaim}
            claiming={claiming}
          />
        </div>
      </div>
    </div>
  );
}
