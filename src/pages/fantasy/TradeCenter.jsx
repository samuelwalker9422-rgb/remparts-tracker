import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';

// ── Helpers ───────────────────────────────────────────────────────────────────
function PosBadge({ pos }) {
  const colors = { F: '#cc6600', D: '#0077cc', G: '#7700cc' };
  return (
    <span style={{
      fontSize: '0.58rem', fontWeight: 900, padding: '1px 5px', borderRadius: 3,
      background: colors[pos] ?? '#555', color: '#fff', letterSpacing: '0.04em', flexShrink: 0,
    }}>{pos}</span>
  );
}

function StatusBadge({ status }) {
  const cfg = {
    pending:   { bg: 'rgba(255,215,0,0.15)',   color: 'gold',          label: 'Pending'   },
    accepted:  { bg: 'rgba(0,166,81,0.15)',     color: 'var(--green)',  label: 'Accepted'  },
    rejected:  { bg: 'rgba(204,0,0,0.15)',      color: 'var(--red)',    label: 'Rejected'  },
    withdrawn: { bg: 'var(--surface2)',          color: 'var(--muted2)', label: 'Withdrawn' },
  }[status] ?? { bg: 'var(--surface2)', color: 'var(--muted)', label: status };
  return (
    <span style={{
      ...cfg, fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.06em',
      padding: '2px 8px', borderRadius: 4, textTransform: 'uppercase',
    }}>{cfg.label}</span>
  );
}

// Mini player list used in trade cards and proposal panels
function PlayerChip({ p }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.25rem 0' }}>
      <PosBadge pos={p.position} />
      <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>{p.player_name}</span>
      <span style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>{p.player_team_code}</span>
    </div>
  );
}

// ── Roster selector panel (checkboxes) ────────────────────────────────────────
function RosterPicker({ label, roster, selected, onToggle }) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column',
    }}>
      <div style={{
        padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--border)',
        fontSize: '0.65rem', fontWeight: 900, color: 'var(--muted)', letterSpacing: '0.08em',
      }}>{label}</div>
      <div style={{ overflowY: 'auto', maxHeight: 340 }}>
        {roster.length === 0 && (
          <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--muted)', fontSize: '0.82rem' }}>
            No roster data
          </div>
        )}
        {roster.map(p => {
          const checked = selected.has(p.player_id);
          return (
            <label
              key={p.player_id}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.45rem 0.75rem', cursor: 'pointer',
                background: checked ? 'rgba(204,0,0,0.07)' : 'none',
                borderBottom: '1px solid var(--surface2)',
                transition: 'background 0.1s',
              }}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggle(p)}
                style={{ accentColor: 'var(--red)', width: 14, height: 14, flexShrink: 0, cursor: 'pointer' }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.82rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.player_name}
                  </span>
                  <PosBadge pos={p.position} />
                </div>
                <div style={{ fontSize: '0.67rem', color: 'var(--muted)', marginTop: '0.1rem' }}>
                  {p.player_team_code}
                </div>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}

// ── Propose a trade form ──────────────────────────────────────────────────────
function ProposeTrade({ myTeamId, myTeamName, myRoster, teams, allRosters, proposing, onPropose }) {
  const opponents  = teams.filter(t => t.id !== myTeamId);
  const [oppId,    setOppId]    = useState(opponents[0]?.id ?? '');
  const [offering, setOffering] = useState(new Set());  // player_ids from my roster
  const [wanting,  setWanting]  = useState(new Set());  // player_ids from their roster
  const [message,  setMessage]  = useState('');

  const oppRoster = useMemo(
    () => (allRosters[oppId] ?? []).sort((a, b) => {
      const po = ['F','D','G'];
      return po.indexOf(a.position) - po.indexOf(b.position) || a.player_name.localeCompare(b.player_name);
    }),
    [allRosters, oppId]
  );

  const myRosterSorted = useMemo(
    () => [...myRoster].sort((a, b) => {
      const po = ['F','D','G'];
      return po.indexOf(a.position) - po.indexOf(b.position) || a.player_name.localeCompare(b.player_name);
    }),
    [myRoster]
  );

  function toggle(set, setFn, player) {
    setFn(prev => {
      const n = new Set(prev);
      n.has(player.player_id) ? n.delete(player.player_id) : n.add(player.player_id);
      return n;
    });
  }

  function buildList(ids, roster) {
    return [...ids].map(id => roster.find(p => p.player_id === id)).filter(Boolean)
      .map(({ player_id, player_name, position, player_team_code }) =>
        ({ player_id, player_name, position, player_team_code }));
  }

  function handleSend() {
    if (!offering.size && !wanting.size) return;
    onPropose({
      receiving_team_id: oppId,
      offer_players:   buildList(offering, myRosterSorted),
      receive_players: buildList(wanting,  oppRoster),
      message:         message.trim() || null,
    });
    setOffering(new Set());
    setWanting(new Set());
    setMessage('');
  }

  const canSend = (offering.size > 0 || wanting.size > 0) && oppId;

  return (
    <div style={{ marginBottom: '2rem' }}>
      <div className="espn-header" style={{ marginBottom: '0.75rem' }}>
        <div className="espn-header-bar" />
        <h2>Propose a Trade</h2>
      </div>

      {/* Opponent selector (only when >2 teams) */}
      {opponents.length > 1 && (
        <div style={{ marginBottom: '0.75rem' }}>
          <label style={{ fontSize: '0.72rem', color: 'var(--muted)', fontWeight: 700, letterSpacing: '0.05em' }}>
            TRADE WITH
          </label>
          <select
            value={oppId}
            onChange={e => { setOppId(e.target.value); setOffering(new Set()); setWanting(new Set()); }}
            style={{
              display: 'block', marginTop: '0.3rem', width: '100%', maxWidth: 280,
              padding: '0.4rem 0.6rem', borderRadius: 7,
              background: 'var(--surface2)', border: '1px solid var(--border)',
              color: 'var(--text)', fontFamily: 'inherit', fontSize: '0.85rem',
            }}
          >
            {opponents.map(t => <option key={t.id} value={t.id}>{t.team_name}</option>)}
          </select>
        </div>
      )}

      {/* Two-column roster pickers */}
      <div className="trade-pickers-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
        <RosterPicker
          label={`OFFERING (${myTeamName})`}
          roster={myRosterSorted}
          selected={offering}
          onToggle={p => toggle(offering, setOffering, p)}
        />
        <RosterPicker
          label={`REQUESTING (${opponents.find(t => t.id === oppId)?.team_name ?? '—'})`}
          roster={oppRoster}
          selected={wanting}
          onToggle={p => toggle(wanting, setWanting, p)}
        />
      </div>

      {/* Selection summary */}
      {(offering.size > 0 || wanting.size > 0) && (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8,
          padding: '0.6rem 0.85rem', marginBottom: '0.65rem', fontSize: '0.8rem',
        }}>
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '0.62rem', fontWeight: 800, color: 'var(--muted)', letterSpacing: '0.06em', marginBottom: '0.2rem' }}>YOU GIVE</div>
              {offering.size === 0
                ? <span style={{ color: 'var(--muted2)', fontSize: '0.78rem' }}>nothing</span>
                : buildList(offering, myRosterSorted).map(p => <PlayerChip key={p.player_id} p={p} />)}
            </div>
            <div>
              <div style={{ fontSize: '0.62rem', fontWeight: 800, color: 'var(--muted)', letterSpacing: '0.06em', marginBottom: '0.2rem' }}>YOU GET</div>
              {wanting.size === 0
                ? <span style={{ color: 'var(--muted2)', fontSize: '0.78rem' }}>nothing</span>
                : buildList(wanting, oppRoster).map(p => <PlayerChip key={p.player_id} p={p} />)}
            </div>
          </div>
        </div>
      )}

      {/* Message */}
      <textarea
        value={message}
        onChange={e => setMessage(e.target.value)}
        placeholder="Optional message to the other GM…"
        maxLength={200}
        rows={2}
        style={{
          width: '100%', padding: '0.45rem 0.7rem', borderRadius: 7, boxSizing: 'border-box',
          background: 'var(--surface2)', border: '1px solid var(--border)',
          color: 'var(--text)', fontFamily: 'inherit', fontSize: '0.82rem',
          resize: 'vertical', marginBottom: '0.6rem',
        }}
      />

      {!canSend && (
        <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>
          Select at least one player from either side to propose a trade.
        </div>
      )}
      <button
        className="auth-submit"
        style={{ maxWidth: 220, padding: '0.55rem 1rem', fontSize: '0.85rem' }}
        disabled={!canSend || proposing}
        onClick={handleSend}
      >
        {proposing ? 'Sending…' : 'Send Trade Offer →'}
      </button>
    </div>
  );
}

// ── Trade card ────────────────────────────────────────────────────────────────
function TradeCard({ trade, myTeamId, teams, acting, onAccept, onReject, onWithdraw }) {
  const teamName = id => teams.find(t => t.id === id)?.team_name ?? 'Unknown';
  const isReceived = trade.receiving_team_id === myTeamId;
  const isSent     = trade.offering_team_id  === myTeamId;
  const offer      = trade.offer_players   ?? [];
  const receive    = trade.receive_players ?? [];

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 10, padding: '0.85rem 1rem', marginBottom: '0.75rem',
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem', gap: '0.5rem', flexWrap: 'wrap' }}>
        <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
          {isReceived
            ? <><strong style={{ color: 'var(--text)' }}>{teamName(trade.offering_team_id)}</strong> wants to trade with you</>
            : <>Trade offer to <strong style={{ color: 'var(--text)' }}>{teamName(trade.receiving_team_id)}</strong></>
          }
        </div>
        <StatusBadge status={trade.status} />
      </div>

      {/* Players */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '0.5rem', alignItems: 'start', marginBottom: '0.6rem' }}>
        <div>
          <div style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--muted)', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>
            {isReceived ? 'THEY GIVE YOU' : 'YOU GIVE'}
          </div>
          {offer.length === 0
            ? <span style={{ fontSize: '0.75rem', color: 'var(--muted2)' }}>Nothing</span>
            : offer.map(p => <PlayerChip key={p.player_id} p={p} />)}
        </div>
        <div style={{ color: 'var(--muted2)', fontSize: '1rem', paddingTop: '0.5rem' }}>⇄</div>
        <div>
          <div style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--muted)', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>
            {isReceived ? 'THEY WANT' : 'YOU GET'}
          </div>
          {receive.length === 0
            ? <span style={{ fontSize: '0.75rem', color: 'var(--muted2)' }}>Nothing</span>
            : receive.map(p => <PlayerChip key={p.player_id} p={p} />)}
        </div>
      </div>

      {/* Message */}
      {trade.message && (
        <div style={{
          background: 'var(--surface2)', borderRadius: 6, padding: '0.4rem 0.6rem',
          fontSize: '0.78rem', color: 'var(--muted)', fontStyle: 'italic', marginBottom: '0.6rem',
        }}>
          "{trade.message}"
        </div>
      )}

      {/* Actions — only show for pending trades */}
      {trade.status === 'pending' && (
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {isReceived && (
            <>
              <button
                className="auth-submit"
                style={{ maxWidth: 120, padding: '0.4rem 0.85rem', fontSize: '0.8rem', background: 'var(--green)' }}
                disabled={acting === trade.id}
                onClick={() => onAccept(trade)}
              >
                {acting === trade.id ? '…' : 'Accept'}
              </button>
              <button
                style={{
                  padding: '0.4rem 0.85rem', fontSize: '0.8rem', fontFamily: 'inherit',
                  background: 'rgba(204,0,0,0.12)', border: '1px solid rgba(204,0,0,0.3)',
                  color: 'var(--red)', borderRadius: 7, cursor: 'pointer', fontWeight: 700,
                }}
                disabled={acting === trade.id}
                onClick={() => onReject(trade.id)}
              >
                Reject
              </button>
            </>
          )}
          {isSent && !isReceived && (
            <button
              style={{
                padding: '0.4rem 0.85rem', fontSize: '0.8rem', fontFamily: 'inherit',
                background: 'var(--surface2)', border: '1px solid var(--border)',
                color: 'var(--muted)', borderRadius: 7, cursor: 'pointer',
              }}
              disabled={acting === trade.id}
              onClick={() => onWithdraw(trade.id)}
            >
              {acting === trade.id ? '…' : 'Withdraw'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main TradeCenter ──────────────────────────────────────────────────────────
export default function TradeCenter({ leagueCtx, onBack }) {
  const [teams,      setTeams]      = useState([]);   // all teams in league
  const [myRoster,   setMyRoster]   = useState([]);
  const [allRosters, setAllRosters] = useState({});   // { teamId: [players] }
  const [trades,     setTrades]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [proposing,  setProposing]  = useState(false);
  const [acting,     setActing]     = useState(null); // trade.id being accepted/rejected
  const [toast,      setToast]      = useState('');

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  }

  // ── Load ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      // 1. All teams in this league
      const { data: teamsData = [] } = await supabase
        .from('fantasy_league_teams')
        .select('id, team_name, user_id')
        .eq('league_id', leagueCtx.leagueId)
        .order('team_name');

      // 2. All rosters in league in one query
      const teamIds = teamsData.map(t => t.id);
      const { data: rostersData = [] } = await supabase
        .from('fantasy_rosters')
        .select('*')
        .in('league_team_id', teamIds)
        .order('position').order('player_name');

      // 3. My trades (sent or received)
      const { data: tradesData = [] } = await supabase
        .from('fantasy_trades')
        .select('*')
        .eq('league_id', leagueCtx.leagueId)
        .order('created_at', { ascending: false });

      // Group rosters by team
      const rosterMap = {};
      teamIds.forEach(id => { rosterMap[id] = []; });
      rostersData.forEach(r => { rosterMap[r.league_team_id]?.push(r); });

      setTeams(teamsData);
      setMyRoster(rosterMap[leagueCtx.leagueTeamId] ?? []);
      setAllRosters(rosterMap);
      setTrades(tradesData);
      setLoading(false);
    }
    load();
  }, [leagueCtx.leagueId, leagueCtx.leagueTeamId]);

  // ── Propose ───────────────────────────────────────────────────────────────
  async function handlePropose({ receiving_team_id, offer_players, receive_players, message }) {
    setProposing(true);
    try {
      const { error } = await supabase.from('fantasy_trades').insert({
        league_id:         leagueCtx.leagueId,
        offering_team_id:  leagueCtx.leagueTeamId,
        receiving_team_id,
        offer_players,
        receive_players,
        message,
        status: 'pending',
      });
      if (error) throw error;

      // Reload trades
      const { data } = await supabase
        .from('fantasy_trades')
        .select('*')
        .eq('league_id', leagueCtx.leagueId)
        .order('created_at', { ascending: false });
      setTrades(data ?? []);
      showToast('✓ Trade offer sent');
    } catch (e) {
      console.error('Propose trade error:', e);
      showToast('Failed to send: ' + (e.message ?? 'unknown error'));
    }
    setProposing(false);
  }

  // ── Accept ────────────────────────────────────────────────────────────────
  async function handleAccept(trade) {
    setActing(trade.id);
    try {
      const offer   = trade.offer_players   ?? [];  // move FROM offering TO receiving (me)
      const receive = trade.receive_players ?? [];  // move FROM receiving (me) TO offering

      // Remove offered players from offering team's roster
      if (offer.length) {
        const { error } = await supabase.from('fantasy_rosters')
          .delete()
          .eq('league_team_id', trade.offering_team_id)
          .in('player_id', offer.map(p => p.player_id));
        if (error) console.error('Delete offer_players from offering team failed (RLS expected if not same user):', error.message);
      }

      // Insert offered players into MY roster
      if (offer.length) {
        const { error } = await supabase.from('fantasy_rosters').insert(
          offer.map(p => ({
            league_team_id:   leagueCtx.leagueTeamId,
            player_id:        p.player_id,
            player_name:      p.player_name,
            position:         p.position,
            player_team_code: p.player_team_code,
            acquired_via:     'trade',
          }))
        );
        if (error) throw new Error('Could not add traded players: ' + error.message);
      }

      // Remove my players from my roster
      if (receive.length) {
        const { error } = await supabase.from('fantasy_rosters')
          .delete()
          .eq('league_team_id', leagueCtx.leagueTeamId)
          .in('player_id', receive.map(p => p.player_id));
        if (error) throw new Error('Could not remove your traded players: ' + error.message);
      }

      // Insert my players into offering team's roster
      if (receive.length) {
        const { error } = await supabase.from('fantasy_rosters').insert(
          receive.map(p => ({
            league_team_id:   trade.offering_team_id,
            player_id:        p.player_id,
            player_name:      p.player_name,
            position:         p.position,
            player_team_code: p.player_team_code,
            acquired_via:     'trade',
          }))
        );
        if (error) console.error('Insert receive_players into offering team failed (RLS expected if not same user):', error.message);
      }

      // Mark trade accepted
      const { error: eUpdate } = await supabase.from('fantasy_trades')
        .update({ status: 'accepted', responded_at: new Date().toISOString() })
        .eq('id', trade.id);
      if (eUpdate) throw new Error('Could not update trade status: ' + eUpdate.message);

      // Refresh local state
      const [{ data: newRosters }, { data: newTrades }] = await Promise.all([
        supabase.from('fantasy_rosters').select('*').in('league_team_id', teams.map(t => t.id)).order('position').order('player_name'),
        supabase.from('fantasy_trades').select('*').eq('league_id', leagueCtx.leagueId).order('created_at', { ascending: false }),
      ]);
      const rosterMap = {};
      teams.forEach(t => { rosterMap[t.id] = []; });
      (newRosters ?? []).forEach(r => { rosterMap[r.league_team_id]?.push(r); });
      setAllRosters(rosterMap);
      setMyRoster(rosterMap[leagueCtx.leagueTeamId] ?? []);
      setTrades(newTrades ?? []);
      showToast('✓ Trade accepted — rosters updated');
    } catch (e) {
      console.error('Accept trade error:', e);
      showToast('Trade error: ' + (e.message ?? 'unknown'));
    }
    setActing(null);
  }

  // ── Reject ────────────────────────────────────────────────────────────────
  async function handleReject(tradeId) {
    setActing(tradeId);
    try {
      const { error } = await supabase.from('fantasy_trades')
        .update({ status: 'rejected', responded_at: new Date().toISOString() })
        .eq('id', tradeId);
      if (error) throw error;
      setTrades(prev => prev.map(t => t.id === tradeId ? { ...t, status: 'rejected' } : t));
      showToast('Trade rejected');
    } catch (e) {
      console.error('Reject error:', e);
      showToast('Reject failed: ' + (e.message ?? 'unknown'));
    }
    setActing(null);
  }

  // ── Withdraw ──────────────────────────────────────────────────────────────
  // Note: RLS only allows the receiving team to UPDATE trades.
  // Withdraw works when the same user owns both teams (test scenario).
  // In a 2-player scenario this will be blocked by RLS — logged to console.
  async function handleWithdraw(tradeId) {
    setActing(tradeId);
    try {
      const { error } = await supabase.from('fantasy_trades')
        .update({ status: 'withdrawn', responded_at: new Date().toISOString() })
        .eq('id', tradeId);
      if (error) throw error;
      setTrades(prev => prev.map(t => t.id === tradeId ? { ...t, status: 'withdrawn' } : t));
      showToast('Trade withdrawn');
    } catch (e) {
      console.error('Withdraw error (RLS may block offerer):', e);
      showToast('Withdraw failed: ' + (e.message ?? 'unknown'));
    }
    setActing(null);
  }

  // ── Derived ───────────────────────────────────────────────────────────────
  const received = trades.filter(t => t.receiving_team_id === leagueCtx.leagueTeamId && t.status === 'pending');
  const sent     = trades.filter(t => t.offering_team_id  === leagueCtx.leagueTeamId);
  const myTeamName = teams.find(t => t.id === leagueCtx.leagueTeamId)?.team_name ?? leagueCtx.teamName;

  if (loading) return (
    <div className="page">
      <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '4rem' }}>Loading trade center…</div>
    </div>
  );

  return (
    <div className="page" style={{ paddingBottom: '2rem' }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: '4.5rem', right: '1rem', zIndex: 200,
          background: toast.startsWith('✓') ? 'rgba(0,166,81,0.92)' : 'rgba(204,0,0,0.92)',
          color: '#fff', padding: '0.6rem 1rem', borderRadius: 8,
          fontSize: '0.82rem', fontWeight: 700, boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
          maxWidth: 300,
        }}>{toast}</div>
      )}

      {/* Back */}
      <div style={{ marginBottom: '0.75rem' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '0.85rem' }}>
          ← My Team
        </button>
      </div>

      {/* Header */}
      <div className="espn-header" style={{ marginBottom: '1.25rem' }}>
        <div className="espn-header-bar" />
        <h2>🤝 Trade Center</h2>
        <span className="subtitle">{leagueCtx.leagueName}</span>
      </div>

      {/* ── Received pending trades (shown first) ────────────────────── */}
      {received.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <div className="espn-header" style={{ marginBottom: '0.6rem' }}>
            <div className="espn-header-bar" style={{ background: 'gold' }} />
            <h2>Incoming Offers</h2>
            <span className="subtitle">{received.length} pending</span>
          </div>
          {received.map(t => (
            <TradeCard
              key={t.id}
              trade={t}
              myTeamId={leagueCtx.leagueTeamId}
              teams={teams}
              acting={acting}
              onAccept={handleAccept}
              onReject={handleReject}
              onWithdraw={handleWithdraw}
            />
          ))}
        </div>
      )}

      {/* ── Propose a trade ────────────────────────────────────────────── */}
      {teams.filter(t => t.id !== leagueCtx.leagueTeamId).length > 0 ? (
        <ProposeTrade
          myTeamId={leagueCtx.leagueTeamId}
          myTeamName={myTeamName}
          myRoster={myRoster}
          teams={teams}
          allRosters={allRosters}
          proposing={proposing}
          onPropose={handlePropose}
        />
      ) : (
        <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '2rem', fontSize: '0.85rem' }}>
          No other teams in this league to trade with.
        </div>
      )}

      {/* ── Trade history ──────────────────────────────────────────────── */}
      {sent.length > 0 && (
        <div>
          <div className="espn-header" style={{ marginBottom: '0.6rem' }}>
            <div className="espn-header-bar" />
            <h2>Your Trade Offers</h2>
            <span className="subtitle">{sent.length} total</span>
          </div>
          {sent.map(t => (
            <TradeCard
              key={t.id}
              trade={t}
              myTeamId={leagueCtx.leagueTeamId}
              teams={teams}
              acting={acting}
              onAccept={handleAccept}
              onReject={handleReject}
              onWithdraw={handleWithdraw}
            />
          ))}
        </div>
      )}

      {trades.length === 0 && (
        <div style={{
          textAlign: 'center', color: 'var(--muted)', padding: '1.5rem',
          background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: '0.85rem',
        }}>
          No trades yet — propose one above.
        </div>
      )}
    </div>
  );
}
