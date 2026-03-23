import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';

// ── Slot definitions (keys === fantasy_lines DB columns) ─────────────────────
const FORWARD_LINES = [1, 2, 3, 4].map(n => ({
  label: `LINE ${n}`,
  slots: [
    { key: `line${n}_lw`, label: 'LW' },
    { key: `line${n}_c`,  label: 'C'  },
    { key: `line${n}_rw`, label: 'RW' },
  ],
}));

const DEFENCE_PAIRS = [1, 2, 3].map(n => ({
  label: `PAIR ${n}`,
  slots: [
    { key: `pair${n}_ld`, label: 'LD' },
    { key: `pair${n}_rd`, label: 'RD' },
  ],
}));

const GOALIE_SLOTS = [
  { key: 'starting_goalie', label: 'STARTER' },
  { key: 'backup_goalie',   label: 'BACKUP'  },
];

const SCRATCH_SLOTS = [
  { key: 'scratch1', label: 'SCRATCH 1' },
  { key: 'scratch2', label: 'SCRATCH 2' },
  { key: 'scratch3', label: 'SCRATCH 3' },
];

const ALL_ACTIVE_SLOTS  = [
  ...FORWARD_LINES.flatMap(l => l.slots.map(s => s.key)),
  ...DEFENCE_PAIRS.flatMap(p => p.slots.map(s => s.key)),
  ...GOALIE_SLOTS.map(s => s.key),
];
const ALL_SCRATCH_KEYS = SCRATCH_SLOTS.map(s => s.key);
const ALL_SLOT_KEYS    = [...ALL_ACTIVE_SLOTS, ...ALL_SCRATCH_KEYS];

// slot key → required position ('F' | 'D' | 'G' | null = any)
const SLOT_POS = {
  ...Object.fromEntries(FORWARD_LINES.flatMap(l => l.slots.map(s => [s.key, 'F']))),
  ...Object.fromEntries(DEFENCE_PAIRS.flatMap(p => p.slots.map(s => [s.key, 'D']))),
  ...Object.fromEntries(GOALIE_SLOTS.map(s => [s.key, 'G'])),
  ...Object.fromEntries(SCRATCH_SLOTS.map(s => [s.key, null])),
};

// slot key → display label
const SLOT_LABEL = {
  ...Object.fromEntries(FORWARD_LINES.flatMap(l => l.slots.map(s => [s.key, s.label]))),
  ...Object.fromEntries(DEFENCE_PAIRS.flatMap(p => p.slots.map(s => [s.key, s.label]))),
  ...Object.fromEntries(GOALIE_SLOTS.map(s => [s.key, s.label])),
  ...Object.fromEntries(SCRATCH_SLOTS.map(s => [s.key, s.label])),
};

// ── Helpers ──────────────────────────────────────────────────────────────────
function currentWeek() {
  const start = new Date('2026-03-27T00:00:00');
  const diff  = Date.now() - start.getTime();
  return Math.max(1, Math.ceil(diff / (7 * 24 * 60 * 60 * 1000)));
}

function isElim(poTeams, teamCode) {
  return (poTeams?.eliminatedCodes ?? [])
    .some(c => c.toUpperCase() === (teamCode ?? '').toUpperCase());
}

function getStats(poStats, playerId) {
  return poStats.find(p => p.player_id === playerId) ?? null;
}

// ── Position badge ────────────────────────────────────────────────────────────
function PosBadge({ pos }) {
  const colors = { F: '#cc6600', D: '#0077cc', G: '#7700cc' };
  return (
    <span style={{
      fontSize: '0.55rem', fontWeight: 900, padding: '1px 4px', borderRadius: 3,
      background: colors[pos] ?? '#555', color: '#fff', letterSpacing: '0.04em',
      flexShrink: 0,
    }}>{pos}</span>
  );
}

// ── Player slot card ──────────────────────────────────────────────────────────
function SlotCard({ slotKey, player, eliminated, onAssign, onRemove }) {
  const label = SLOT_LABEL[slotKey];

  if (!player) {
    return (
      <button
        onClick={() => onAssign(slotKey)}
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          width: '100%', minHeight: 66, padding: '0.4rem 0.25rem',
          background: 'var(--surface2)', border: '1.5px dashed var(--border)',
          borderRadius: 8, cursor: 'pointer', color: 'var(--muted2)',
          fontFamily: 'inherit', gap: '0.15rem',
        }}
        onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--red)'; e.currentTarget.style.color = 'var(--muted)'; }}
        onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--muted2)'; }}
      >
        <span style={{ fontSize: '0.58rem', fontWeight: 900, color: 'var(--muted)', letterSpacing: '0.08em' }}>{label}</span>
        <span style={{ fontSize: '0.68rem' }}>+ assign</span>
      </button>
    );
  }

  // Last name only for compactness in grid
  const lastName = player.player_name.split(' ').slice(-1)[0];

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      width: '100%', minHeight: 66, padding: '0.35rem 0.25rem',
      background: eliminated ? 'var(--surface2)' : 'var(--surface)',
      border: `1.5px solid ${eliminated ? 'var(--border)' : 'var(--red)'}`,
      borderRadius: 8, position: 'relative', opacity: eliminated ? 0.65 : 1,
      gap: '0.15rem',
    }}>
      <span style={{ fontSize: '0.58rem', fontWeight: 900, color: 'var(--muted)', letterSpacing: '0.08em' }}>{label}</span>
      <span style={{
        fontSize: '0.78rem', fontWeight: 700, textAlign: 'center', lineHeight: 1.2,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%',
      }}>{lastName}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <PosBadge pos={player.position} />
        <span style={{ fontSize: '0.6rem', color: 'var(--muted)' }}>{player.player_team_code}</span>
        {eliminated && <span style={{ fontSize: '0.5rem', color: 'var(--muted2)', fontWeight: 800, letterSpacing: '0.04em' }}>ELIM</span>}
      </div>
      <button
        onClick={() => onRemove(slotKey)}
        style={{
          position: 'absolute', top: 2, right: 3,
          background: 'none', border: 'none', color: 'var(--muted2)',
          cursor: 'pointer', fontSize: '0.6rem', padding: '2px',
          fontFamily: 'inherit', lineHeight: 1,
        }}
        title="Remove"
        onMouseOver={e => { e.currentTarget.style.color = 'var(--red)'; }}
        onMouseOut={e => { e.currentTarget.style.color = 'var(--muted2)'; }}
      >✕</button>
    </div>
  );
}

// ── Player picker modal ───────────────────────────────────────────────────────
function PlayerPicker({ slotKey, roster, poStats, poTeams, slots, onPick, onClose }) {
  const posReq = SLOT_POS[slotKey];
  const label  = SLOT_LABEL[slotKey];

  // which slot each player is currently in
  const playerInSlot = useMemo(() => {
    const map = {};
    Object.entries(slots).forEach(([k, v]) => { if (v) map[v] = k; });
    return map;
  }, [slots]);

  const eligible = roster
    .filter(p => !posReq || p.position === posReq)
    .sort((a, b) => {
      const aE = isElim(poTeams, a.player_team_code) ? 1 : 0;
      const bE = isElim(poTeams, b.player_team_code) ? 1 : 0;
      if (aE !== bE) return aE - bE;
      const as = getStats(poStats, a.player_id);
      const bs = getStats(poStats, b.player_id);
      return (bs?.pts ?? 0) - (as?.pts ?? 0);
    });

  const posLabel = posReq === 'F' ? 'Forwards only' : posReq === 'D' ? 'Defencemen only' : posReq === 'G' ? 'Goalies only' : 'Any position';

  return (
    <div className="auth-overlay" onClick={onClose}>
      <div
        className="auth-modal"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: 440, maxHeight: '80vh', overflow: 'hidden',
          display: 'flex', flexDirection: 'column', padding: 0,
        }}
      >
        {/* Header */}
        <div style={{ padding: '0.9rem 1.25rem 0.65rem', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <button className="auth-close" onClick={onClose}>✕</button>
          <h2 className="auth-title" style={{ marginBottom: '0.1rem' }}>Assign {label}</h2>
          <p className="auth-sub" style={{ marginBottom: 0 }}>{posLabel}</p>
        </div>

        {/* Player list */}
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {eligible.length === 0 && (
            <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '2rem', fontSize: '0.85rem' }}>
              No eligible players
            </div>
          )}
          {eligible.map(p => {
            const stats   = getStats(poStats, p.player_id);
            const elim    = isElim(poTeams, p.player_team_code);
            const curSlot = playerInSlot[p.player_id];
            const isHere  = curSlot === slotKey;
            const isMoved = curSlot && !isHere;

            return (
              <button
                key={p.player_id}
                onClick={() => onPick(slotKey, p.player_id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.65rem',
                  width: '100%', padding: '0.6rem 1.25rem',
                  background: isHere ? 'rgba(204,0,0,0.08)' : 'none',
                  border: 'none', borderBottom: '1px solid var(--surface2)',
                  cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                  opacity: elim ? 0.65 : 1,
                }}
                onMouseOver={e => { if (!isHere) e.currentTarget.style.background = 'var(--surface2)'; }}
                onMouseOut={e => { if (!isHere) e.currentTarget.style.background = 'none'; }}
              >
                <img
                  src={`https://assets.leaguestat.com/lhjmq/240x240/${p.player_id}.jpg`}
                  alt=""
                  style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', background: 'var(--surface3)', flexShrink: 0 }}
                  onError={e => { e.target.style.display = 'none'; }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.15rem', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.player_name}</span>
                    <PosBadge pos={p.position} />
                    {elim && (
                      <span style={{ fontSize: '0.55rem', fontWeight: 800, color: 'var(--muted2)', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 3, padding: '1px 4px' }}>ELIM</span>
                    )}
                    {isHere && (
                      <span style={{ fontSize: '0.55rem', fontWeight: 800, color: 'var(--red)', background: 'rgba(204,0,0,0.1)', borderRadius: 3, padding: '1px 4px' }}>assigned here</span>
                    )}
                    {isMoved && (
                      <span style={{ fontSize: '0.55rem', fontWeight: 800, color: '#cc8800', background: 'rgba(204,136,0,0.1)', borderRadius: 3, padding: '1px 4px' }}>→ move</span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>
                    {p.player_team_code}
                    {stats?.gp ? ` · ${stats.gp}GP · ${stats.g}G · ${stats.a}A · ${stats.pts}PTS` : ' · no playoff stats yet'}
                    {!elim && poTeams && <span style={{ color: 'var(--green)', marginLeft: '0.3rem' }}>●</span>}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Section header ────────────────────────────────────────────────────────────
function SectionHead({ title, barColor, subtitle }) {
  return (
    <div className="espn-header" style={{ marginBottom: '0.5rem' }}>
      <div className="espn-header-bar" style={{ background: barColor ?? 'var(--red)' }} />
      <h2>{title}</h2>
      {subtitle && <span className="subtitle">{subtitle}</span>}
    </div>
  );
}

// ── Main CoachLines ───────────────────────────────────────────────────────────
export default function CoachLines({ leagueCtx, onBack }) {
  const weekNum = useMemo(currentWeek, []);
  const season  = leagueCtx.leagueSeason ?? '2025-26 Playoffs';

  const [slots,    setSlots]    = useState({});
  const [openSlot, setOpenSlot] = useState(null);
  const [roster,   setRoster]   = useState([]);
  const [poStats,  setPoStats]  = useState([]);
  const [poTeams,  setPoTeams]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [saveMsg,  setSaveMsg]  = useState(''); // 'ok' | 'err:...' | ''

  // ── Load roster, playoff data, existing lines ─────────────────────────────
  useEffect(() => {
    async function load() {
      const [rosterRes, poRes, poTeamsRes, linesRes] = await Promise.all([
        supabase.from('fantasy_rosters')
          .select('*')
          .eq('league_team_id', leagueCtx.leagueTeamId)
          .order('position').order('player_name'),
        fetch('/api/playoffplayers')
          .then(r => r.ok ? r.json() : { players: [] })
          .catch(() => ({ players: [] })),
        fetch('/api/playoffteams')
          .then(r => r.ok ? r.json() : null)
          .catch(() => null),
        supabase.from('fantasy_lines')
          .select('*')
          .eq('league_team_id', leagueCtx.leagueTeamId)
          .eq('week_number', weekNum)
          .eq('season', season)
          .maybeSingle(),
      ]);

      setRoster(rosterRes.data ?? []);
      setPoStats(poRes.players ?? []);
      if (poTeamsRes) setPoTeams(poTeamsRes);

      // Pre-fill from saved lines
      if (linesRes.data) {
        const saved = {};
        ALL_SLOT_KEYS.forEach(k => { if (linesRes.data[k]) saved[k] = linesRes.data[k]; });
        setSlots(saved);
      }

      setLoading(false);
    }
    load();
  }, [leagueCtx.leagueTeamId, weekNum, season]);

  // ── Assign player to slot ─────────────────────────────────────────────────
  function assign(slotKey, playerId) {
    setSlots(prev => {
      const next = { ...prev };
      // Remove from any current slot
      Object.keys(next).forEach(k => { if (next[k] === playerId) delete next[k]; });
      next[slotKey] = playerId;
      return next;
    });
    setOpenSlot(null);
  }

  function remove(slotKey) {
    setSlots(prev => { const n = { ...prev }; delete n[slotKey]; return n; });
  }

  // ── Save ─────────────────────────────────────────────────────────────────
  async function saveLines() {
    setSaving(true);
    setSaveMsg('');
    try {
      const record = {
        league_team_id: leagueCtx.leagueTeamId,
        week_number:    weekNum,
        season,
        updated_at:     new Date().toISOString(),
      };
      ALL_SLOT_KEYS.forEach(k => { record[k] = slots[k] ?? null; });

      const { error } = await supabase
        .from('fantasy_lines')
        .upsert(record, { onConflict: 'league_team_id,week_number,season' });

      if (error) throw error;
      setSaveMsg('ok');
      setTimeout(() => setSaveMsg(''), 4000);
    } catch (e) {
      console.error('Save lines error:', e);
      setSaveMsg('err:' + (e.message ?? 'Save failed'));
    }
    setSaving(false);
  }

  // ── Derived state ─────────────────────────────────────────────────────────
  const playerById = useMemo(
    () => Object.fromEntries(roster.map(p => [p.player_id, p])),
    [roster]
  );

  const assignedIds   = new Set(Object.values(slots).filter(Boolean));
  const bench         = roster.filter(p => !assignedIds.has(p.player_id));
  const emptyActive   = ALL_ACTIVE_SLOTS.filter(k => !slots[k]).length;
  const emptyScratches = ALL_SCRATCH_KEYS.filter(k => !slots[k]).length;
  const canSave       = emptyActive === 0 && emptyScratches === 0;

  // Renders a single slot card
  function card(slotKey) {
    const player = playerById[slots[slotKey]] ?? null;
    return (
      <SlotCard
        key={slotKey}
        slotKey={slotKey}
        player={player}
        eliminated={isElim(poTeams, player?.player_team_code)}
        onAssign={setOpenSlot}
        onRemove={remove}
      />
    );
  }

  if (loading) return (
    <div className="page">
      <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '4rem' }}>Loading lines…</div>
    </div>
  );

  return (
    <div className="page" style={{ paddingBottom: '5rem' }}>
      {/* Player picker modal */}
      {openSlot && (
        <PlayerPicker
          slotKey={openSlot}
          roster={roster}
          poStats={poStats}
          poTeams={poTeams}
          slots={slots}
          onPick={assign}
          onClose={() => setOpenSlot(null)}
        />
      )}

      {/* Back nav */}
      <div style={{ marginBottom: '0.75rem' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '0.85rem' }}>
          ← My Team
        </button>
      </div>

      <div className="espn-header" style={{ marginBottom: '1rem' }}>
        <div className="espn-header-bar" />
        <h2>🏒 Coach Lines</h2>
        <span className="subtitle">{leagueCtx.teamName} · Week {weekNum}</span>
      </div>

      {/* ── FORWARD LINES ──────────────────────────────────────────────────── */}
      <div style={{ marginBottom: '1.5rem' }}>
        <SectionHead title="Forward Lines" barColor="#cc6600" />
        <div style={{ display: 'grid', gap: '0.5rem' }}>
          {FORWARD_LINES.map(({ label, slots: lineSlots }) => (
            <div key={label} style={{ display: 'grid', gridTemplateColumns: '3rem 1fr 1fr 1fr', alignItems: 'stretch', gap: '0.4rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                <span style={{ fontSize: '0.58rem', fontWeight: 900, color: 'var(--muted)', letterSpacing: '0.08em' }}>{label}</span>
              </div>
              {lineSlots.map(s => card(s.key))}
            </div>
          ))}
        </div>
      </div>

      {/* ── DEFENCE PAIRS ──────────────────────────────────────────────────── */}
      <div style={{ marginBottom: '1.5rem' }}>
        <SectionHead title="Defence Pairs" barColor="#0077cc" />
        <div style={{ display: 'grid', gap: '0.5rem' }}>
          {DEFENCE_PAIRS.map(({ label, slots: pairSlots }) => (
            <div key={label} style={{ display: 'grid', gridTemplateColumns: '3rem 1fr 1fr', alignItems: 'stretch', gap: '0.4rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                <span style={{ fontSize: '0.58rem', fontWeight: 900, color: 'var(--muted)', letterSpacing: '0.08em' }}>{label}</span>
              </div>
              {pairSlots.map(s => card(s.key))}
            </div>
          ))}
        </div>
      </div>

      {/* ── GOALIES ────────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: '1.5rem' }}>
        <SectionHead title="Goalies" barColor="#7700cc" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', maxWidth: 320 }}>
          {GOALIE_SLOTS.map(s => card(s.key))}
        </div>
      </div>

      {/* ── HEALTHY SCRATCHES ──────────────────────────────────────────────── */}
      <div style={{ marginBottom: '1.5rem' }}>
        <SectionHead title="Healthy Scratches" barColor="var(--muted)" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', maxWidth: 420 }}>
          {SCRATCH_SLOTS.map(s => card(s.key))}
        </div>
      </div>

      {/* ── BENCH (unassigned) ─────────────────────────────────────────────── */}
      {bench.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <SectionHead title="Bench / Unassigned" subtitle={`${bench.length} players`} />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {bench.map(p => {
              const stats = getStats(poStats, p.player_id);
              const elim  = isElim(poTeams, p.player_team_code);
              return (
                <div
                  key={p.player_id}
                  style={{
                    background: 'var(--surface2)', border: '1px solid var(--border)',
                    borderRadius: 8, padding: '0.35rem 0.6rem',
                    fontSize: '0.78rem', opacity: elim ? 0.55 : 1,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <PosBadge pos={p.position} />
                    <span style={{ fontWeight: 600 }}>{p.player_name}</span>
                    {elim && <span style={{ fontSize: '0.55rem', color: 'var(--muted2)', fontWeight: 800 }}>ELIM</span>}
                  </div>
                  <div style={{ fontSize: '0.67rem', color: 'var(--muted)', marginTop: '0.1rem' }}>
                    {p.player_team_code}{stats?.pts != null ? ` · ${stats.pts}PTS` : ''}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Sticky save bar ────────────────────────────────────────────────── */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'var(--bg)', borderTop: '1px solid var(--border)',
        padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '1rem',
        zIndex: 100,
      }}>
        <div style={{ flex: 1, fontSize: '0.78rem' }}>
          {saveMsg === 'ok' && (
            <span style={{ color: 'var(--green)' }}>✓ Lines saved for Week {weekNum}</span>
          )}
          {saveMsg.startsWith('err') && (
            <span style={{ color: 'var(--red)' }}>{saveMsg.slice(4)}</span>
          )}
          {!saveMsg && canSave && (
            <span style={{ color: 'var(--muted)' }}>All slots filled — ready to save</span>
          )}
          {!saveMsg && !canSave && (
            <span style={{ color: 'var(--muted)' }}>
              {emptyActive > 0 && `${emptyActive} active slot${emptyActive !== 1 ? 's' : ''} empty`}
              {emptyActive > 0 && emptyScratches > 0 && ' · '}
              {emptyScratches > 0 && `${emptyScratches} scratch${emptyScratches !== 1 ? 'es' : ''} empty`}
            </span>
          )}
        </div>
        <button
          className="auth-submit"
          style={{ maxWidth: 140, padding: '0.55rem 1rem', fontSize: '0.85rem', flexShrink: 0 }}
          disabled={!canSave || saving}
          onClick={saveLines}
        >
          {saving ? 'Saving…' : 'Save Lines'}
        </button>
      </div>
    </div>
  );
}
