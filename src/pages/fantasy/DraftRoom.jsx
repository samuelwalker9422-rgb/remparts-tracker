import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../lib/supabase';

// ── Snake draft helpers ───────────────────────────────────────────────────────
function getPickingTeamIdx(overallPick, numTeams) {
  const idx       = overallPick - 1;                    // 0-based
  const round     = Math.floor(idx / numTeams);          // 0-based round
  const pickInRound = idx % numTeams;
  return round % 2 === 0 ? pickInRound : numTeams - 1 - pickInRound;
}

function getRound(overallPick, numTeams) {
  return Math.ceil(overallPick / numTeams);
}
function getPickInRound(overallPick, numTeams) {
  return ((overallPick - 1) % numTeams) + 1;
}

// ── Auto-pick: best available by pts filling F→D→G priority ──────────────────
function bestAvailable(players, pickedIds, myPicksSoFar) {
  const drafted = new Set(pickedIds);
  const available = players.filter(p => !drafted.has(p.player_id));
  const fN = myPicksSoFar.filter(p => p.position === 'F').length;
  const dN = myPicksSoFar.filter(p => p.position === 'D').length;
  const gN = myPicksSoFar.filter(p => p.position === 'G').length;
  let wantPos = fN < 13 ? 'F' : dN < 7 ? 'D' : gN < 2 ? 'G' : null;
  const pool = wantPos ? available.filter(p => p.position === wantPos) : available;
  return [...(pool.length ? pool : available)].sort((a, b) => b.pts - a.pts || b.gp - a.gp)[0] ?? null;
}

// ── Position badge ────────────────────────────────────────────────────────────
const POS_COLORS = { F: '#cc6600', D: '#0077cc', G: '#7700cc' };
function PosBadge({ pos }) {
  return (
    <span style={{
      fontSize: '0.55rem', fontWeight: 900, padding: '1px 5px', borderRadius: 3,
      background: POS_COLORS[pos] ?? '#555', color: '#fff', letterSpacing: '0.04em',
    }}>{pos}</span>
  );
}

// ── Pre-draft lobby ───────────────────────────────────────────────────────────
function PreDraftLobby({ league, teams, user, leagueCtx, onStarted }) {
  const [starting, setStarting] = useState(false);
  const [err, setErr] = useState('');
  const isCommish = league.commissioner_id === user?.id;

  async function startDraft() {
    setStarting(true);
    setErr('');
    try {
      // Randomise draft positions
      const shuffled = [...teams].sort(() => Math.random() - 0.5);
      await Promise.all(shuffled.map((t, i) =>
        supabase.from('fantasy_league_teams').update({ draft_position: i + 1 }).eq('id', t.id)
      ));
      const { error } = await supabase
        .from('fantasy_leagues')
        .update({ draft_status: 'in_progress' })
        .eq('id', leagueCtx.leagueId);
      if (error) throw error;
      onStarted();
    } catch (e) {
      setErr(e.message ?? 'Failed to start draft.');
    }
    setStarting(false);
  }

  return (
    <div style={{ maxWidth: 560, margin: '2rem auto', textAlign: 'center' }}>
      <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🏒</div>
      <h2 style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: '0.25rem' }}>{leagueCtx.leagueName}</h2>
      <p style={{ color: 'var(--muted)', marginBottom: '1.5rem' }}>
        {teams.length} of {league.num_teams} teams have joined · Waiting for draft to start
      </p>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--muted)', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>TEAMS IN LEAGUE</div>
        {teams.map((t, i) => (
          <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0', borderBottom: i < teams.length - 1 ? '1px solid var(--border)' : 'none' }}>
            <span style={{ color: 'var(--muted)', fontSize: '0.75rem', minWidth: '1rem' }}>{i + 1}</span>
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{t.team_name}</span>
            {t.user_id === league.commissioner_id && (
              <span style={{ fontSize: '0.6rem', background: 'rgba(204,0,0,0.15)', color: 'var(--red)', padding: '1px 6px', borderRadius: 3, fontWeight: 800 }}>COMMISH</span>
            )}
          </div>
        ))}
      </div>

      {isCommish ? (
        <>
          {teams.length < league.num_teams && (
            <p style={{ fontSize: '0.8rem', color: 'gold', background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.25)', borderRadius: 7, padding: '0.5rem 0.75rem', marginBottom: '0.75rem' }}>
              {teams.length} of {league.num_teams} spots filled — you can start early with {teams.length} team{teams.length !== 1 ? 's' : ''}.
            </p>
          )}
          <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '1rem' }}>
            Draft order will be randomised automatically.
          </p>
          {err && <div className="auth-error" style={{ marginBottom: '1rem' }}>{err}</div>}
          <button
            className="auth-submit"
            style={{ maxWidth: 300, margin: '0 auto' }}
            disabled={starting || teams.length < 2}
            onClick={startDraft}
          >
            {starting ? 'Starting…' : teams.length < league.num_teams
              ? `Start with ${teams.length} of ${league.num_teams} teams`
              : 'Start Draft'}
          </button>
          {teams.length < 2 && (
            <p style={{ fontSize: '0.75rem', color: 'var(--red)', marginTop: '0.5rem' }}>Need at least 2 teams to start.</p>
          )}
        </>
      ) : (
        <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
          Waiting for the commissioner to start the draft…
        </p>
      )}

      <div style={{ marginTop: '1.5rem', fontSize: '0.78rem', color: 'var(--muted2)' }}>
        Invite code: <strong style={{ color: 'var(--muted)', letterSpacing: '0.1em', fontFamily: 'monospace' }}>{league.invite_code}</strong>
      </div>
    </div>
  );
}

// ── Draft complete banner ─────────────────────────────────────────────────────
function DraftComplete({ onMyTeam }) {
  return (
    <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
      <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🎉</div>
      <h2 style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: '0.5rem' }}>Draft Complete!</h2>
      <p style={{ color: 'var(--muted)', marginBottom: '1.5rem' }}>All rounds are finished. Your 25-man roster is locked in.</p>
      <button className="auth-submit" style={{ maxWidth: 220, margin: '0 auto' }} onClick={onMyTeam}>
        View My Team →
      </button>
    </div>
  );
}

// ── Main DraftRoom ────────────────────────────────────────────────────────────
export default function DraftRoom({ leagueCtx, onBack, onMyTeam }) {
  const [user,       setUser]       = useState(null);
  const [league,     setLeague]     = useState(null);
  const [teams,      setTeams]      = useState([]);   // ordered by draft_position
  const [picks,      setPicks]      = useState([]);
  const [players,    setPlayers]    = useState([]);
  const [poTeams,    setPoTeams]    = useState(null); // { activeCodes, eliminatedCodes } or null
  const [loading,    setLoading]    = useState(true);
  const [drafting,   setDrafting]   = useState(false);
  const [timeLeft,   setTimeLeft]   = useState(90);
  const [search,     setSearch]     = useState('');
  const [posFilter,  setPosFilter]  = useState('ALL');
  const [sortBy,     setSortBy]     = useState('pts');
  const [draftErr,   setDraftErr]   = useState('');

  const picksRef   = useRef([]);
  const teamsRef   = useRef([]);
  const playersRef = useRef([]);
  const timerRef   = useRef(null);
  const pollRef    = useRef(null);

  // ── Initial load ──────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data?.user ?? null));

    async function init() {
      const [lgRes, teamsRes, picksRes, playersRes, poTeamsRes] = await Promise.all([
        supabase.from('fantasy_leagues').select('*').eq('id', leagueCtx.leagueId).single(),
        supabase.from('fantasy_league_teams')
          .select('id, team_name, user_id, draft_position')
          .eq('league_id', leagueCtx.leagueId)
          .order('draft_position', { ascending: true, nullsFirst: false })
          .order('created_at', { ascending: true }),
        supabase.from('fantasy_draft_picks')
          .select('*').eq('league_id', leagueCtx.leagueId)
          .order('overall_pick', { ascending: true }),
        // Playoff leagues use playoff stats; fall back to regular season if not yet available
        (async () => {
          const isPlayoff = leagueCtx.leagueSeason === '2025-26 Playoffs';
          if (isPlayoff) {
            const r = await fetch('/api/playoffplayers');
            const j = r.ok ? await r.json() : { players: [] };
            if (j.players?.length > 0) return j;
            // No playoff stats yet — fall back to regular season for draft pool
          }
          return fetch('/api/allplayers').then(r => r.ok ? r.json() : { players: [] });
        })(),
        // Playoff eligibility
        leagueCtx.leagueSeason === '2025-26 Playoffs'
          ? fetch('/api/playoffteams').then(r => r.ok ? r.json() : null).catch(() => null)
          : Promise.resolve(null),
      ]);

      const lg     = lgRes.data;
      const tms    = teamsRes.data ?? [];
      const pks    = picksRes.data ?? [];
      const plys   = playersRes.players ?? [];

      setLeague(lg);
      setTeams(tms);
      setPicks(pks);
      setPlayers(plys);
      if (poTeamsRes) setPoTeams(poTeamsRes);
      picksRef.current  = pks;
      teamsRef.current  = tms;
      playersRef.current = plys;
      setLoading(false);
    }
    init();

    return () => {
      clearInterval(pollRef.current);
      clearInterval(timerRef.current);
    };
  }, [leagueCtx.leagueId]);

  // ── Poll for new picks every 3s ───────────────────────────────────────────
  useEffect(() => {
    if (loading) return;
    clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      const { data } = await supabase
        .from('fantasy_draft_picks')
        .select('*').eq('league_id', leagueCtx.leagueId)
        .order('overall_pick', { ascending: true });
      if (data && data.length !== picksRef.current.length) {
        picksRef.current = data;
        setPicks(data);
      }
    }, 3000);
    return () => clearInterval(pollRef.current);
  }, [loading, leagueCtx.leagueId]);

  // ── Poll for league status change (draft started) ─────────────────────────
  useEffect(() => {
    if (!loading && league?.draft_status === 'pending') {
      const id = setInterval(async () => {
        const { data } = await supabase.from('fantasy_leagues').select('*').eq('id', leagueCtx.leagueId).single();
        if (data?.draft_status !== 'pending') {
          setLeague(data);
          // reload teams with positions
          const { data: tms } = await supabase
            .from('fantasy_league_teams')
            .select('id, team_name, user_id, draft_position')
            .eq('league_id', leagueCtx.leagueId)
            .order('draft_position', { ascending: true });
          if (tms) { setTeams(tms); teamsRef.current = tms; }
          clearInterval(id);
        }
      }, 3000);
      return () => clearInterval(id);
    }
  }, [loading, league?.draft_status, leagueCtx.leagueId]);

  // ── Countdown timer — resets on each new pick ─────────────────────────────
  useEffect(() => {
    if (!league || league.draft_status !== 'in_progress') return;
    setTimeLeft(90);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [picks.length, league?.draft_status]);

  // ── Auto-pick when timer hits 0 and it's our turn ────────────────────────
  useEffect(() => {
    if (timeLeft !== 0) return;
    const numTeams    = teamsRef.current.length;
    const currentPick = picksRef.current.length + 1;
    const totalPicks  = 25 * numTeams;
    if (currentPick > totalPicks) return;
    const idx         = getPickingTeamIdx(currentPick, numTeams);
    const current     = teamsRef.current[idx];
    if (current?.id !== leagueCtx.leagueTeamId) return;
    const myPicks = picksRef.current.filter(p => p.league_team_id === leagueCtx.leagueTeamId);
    const pick    = bestAvailable(playersRef.current, picksRef.current.map(p => p.player_id), myPicks);
    if (pick) doPick(pick, true);
  }, [timeLeft]);

  // ── Pick a player ─────────────────────────────────────────────────────────
  const doPick = useCallback(async (player, auto = false) => {
    setDrafting(true);
    setDraftErr('');
    const pks     = picksRef.current;
    const tms     = teamsRef.current;
    const numTeams = tms.length;
    const overall  = pks.length + 1;
    const round    = getRound(overall, numTeams);
    const pickNum  = getPickInRound(overall, numTeams);

    try {
      const { error: e1 } = await supabase.from('fantasy_draft_picks').insert({
        league_id:        leagueCtx.leagueId,
        round,
        pick_number:      pickNum,
        overall_pick:     overall,
        league_team_id:   leagueCtx.leagueTeamId,
        player_id:        player.player_id,
        player_name:      player.name,
        position:         player.position,
        player_team_code: player.team_code,
        auto_picked:      auto,
        picked_at:        new Date().toISOString(),
      });
      if (e1) throw e1;

      const { error: e2 } = await supabase.from('fantasy_rosters').insert({
        league_team_id:   leagueCtx.leagueTeamId,
        player_id:        player.player_id,
        player_name:      player.name,
        player_team_code: player.team_code,
        position:         player.position,
        acquired_via:     'draft',
      });
      if (e2) throw e2;

      // Check if draft is done
      const newTotal = overall;
      if (newTotal >= 25 * numTeams) {
        await supabase.from('fantasy_leagues')
          .update({ status: 'active', draft_status: 'complete' })
          .eq('id', leagueCtx.leagueId);
        setLeague(prev => ({ ...prev, status: 'active', draft_status: 'complete' }));
      }

      // Optimistic update
      const newPick = {
        league_id: leagueCtx.leagueId, round, pick_number: pickNum, overall_pick: overall,
        league_team_id: leagueCtx.leagueTeamId, player_id: player.player_id,
        player_name: player.name, position: player.position,
        player_team_code: player.team_code, auto_picked: auto,
      };
      picksRef.current = [...pks, newPick];
      setPicks(picksRef.current);
    } catch (e) {
      setDraftErr(e.message ?? 'Pick failed — try again.');
    }
    setDrafting(false);
  }, [leagueCtx]);

  if (loading) return (
    <div className="page">
      <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '4rem' }}>Loading draft room…</div>
    </div>
  );

  const numTeams   = teams.length;
  const totalPicks = 25 * numTeams;
  const isDone     = picks.length >= totalPicks;
  const currentOverall = picks.length + 1;
  const currentTeamIdx = isDone ? -1 : getPickingTeamIdx(currentOverall, numTeams);
  const currentTeam    = teams[currentTeamIdx];
  const isMyTurn       = !isDone && currentTeam?.id === leagueCtx.leagueTeamId;
  const draftedSet     = new Set(picks.map(p => p.player_id));
  const currentRound   = isDone ? 25 : getRound(currentOverall, numTeams);
  const currentPickInR = isDone ? numTeams : getPickInRound(currentOverall, numTeams);

  // ── Pre-draft lobby ───────────────────────────────────────────────────────
  if (!league || league.draft_status === 'pending') {
    return (
      <div className="page">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '0.85rem' }}>← Leagues</button>
        </div>
        <PreDraftLobby
          league={league}
          teams={teams}
          user={user}
          leagueCtx={leagueCtx}
          onStarted={async () => {
            const { data: lg } = await supabase.from('fantasy_leagues').select('*').eq('id', leagueCtx.leagueId).single();
            const { data: tms } = await supabase.from('fantasy_league_teams')
              .select('id, team_name, user_id, draft_position')
              .eq('league_id', leagueCtx.leagueId)
              .order('draft_position', { ascending: true });
            setLeague(lg);
            if (tms) { setTeams(tms); teamsRef.current = tms; }
          }}
        />
      </div>
    );
  }

  // ── Draft complete ────────────────────────────────────────────────────────
  if (isDone || league.draft_status === 'complete') {
    return <div className="page"><DraftComplete onMyTeam={onMyTeam} /></div>;
  }

  // ── Playoff eligibility helpers ───────────────────────────────────────────
  const eliminatedSet = new Set((poTeams?.eliminatedCodes ?? []).map(c => c.toUpperCase()));
  function isEliminated(teamCode) { return eliminatedSet.has((teamCode ?? '').toUpperCase()); }

  // ── Filtered player pool ──────────────────────────────────────────────────
  const filteredPlayers = players
    .filter(p => {
      if (posFilter !== 'ALL' && p.position !== posFilter) return false;
      if (search && !p.name.toLowerCase().includes(search.toLowerCase()) &&
          !p.team_code.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      // Eliminated players always sink to bottom (unless searching by name)
      if (!search && poTeams) {
        const aElim = isEliminated(a.team_code) ? 1 : 0;
        const bElim = isEliminated(b.team_code) ? 1 : 0;
        if (aElim !== bElim) return aElim - bElim;
      }
      if (sortBy === 'pts') return b.pts - a.pts || b.g - a.g;
      if (sortBy === 'g')   return b.g - a.g;
      if (sortBy === 'a')   return b.a - a.a;
      if (sortBy === 'gp')  return b.gp - a.gp;
      if (sortBy === '+/-') return b.plus_minus - a.plus_minus;
      return 0;
    });

  // Build pick matrix: pickMatrix[round-1][teamDraftPos-1] = pick or null
  const pickMatrix = Array.from({ length: 25 }, () => Array(numTeams).fill(null));
  picks.forEach(pk => {
    const r = pk.round - 1;
    const teamInLeague = teams.findIndex(t => t.id === pk.league_team_id);
    if (r >= 0 && teamInLeague >= 0) pickMatrix[r][teamInLeague] = pk;
  });

  // Round order: even rounds forward, odd rounds reversed
  function teamColOrder(roundIdx) {
    return roundIdx % 2 === 0
      ? teams.map((t, i) => i)
      : teams.map((t, i) => numTeams - 1 - i);
  }

  return (
    <div className="page" style={{ paddingBottom: '2rem' }}>
      {/* Back nav */}
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
        ← Leagues
      </button>

      <div className="dr-layout">

        {/* ── LEFT: Draft board ──────────────────────────────────────────── */}
        <div className="dr-left">
          {/* Header */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '0.85rem 1rem', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <div style={{ fontWeight: 900, fontSize: '1rem' }}>{leagueCtx.leagueName}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: '2px' }}>
                  Round {currentRound} · Pick {currentPickInR} of {numTeams} · Overall #{currentOverall}
                </div>
              </div>
              <div style={{
                fontSize: '1.6rem', fontWeight: 900, minWidth: '3rem', textAlign: 'center',
                color: timeLeft <= 15 ? 'var(--red)' : 'var(--text)',
                transition: 'color 0.3s',
              }}>
                {timeLeft}s
              </div>
            </div>
            <div style={{ marginTop: '0.6rem', fontSize: '0.82rem' }}>
              {isMyTurn
                ? <span style={{ color: 'var(--green)', fontWeight: 800 }}>🟢 Your pick!</span>
                : <span style={{ color: 'var(--muted)' }}>On the clock: <strong style={{ color: 'var(--text)' }}>{currentTeam?.team_name ?? '—'}</strong></span>
              }
            </div>
            {draftErr && <div className="auth-error" style={{ marginTop: '0.5rem', padding: '0.4rem 0.75rem', fontSize: '0.78rem' }}>{draftErr}</div>}
          </div>

          {/* Draft board grid */}
          <div className="dr-grid-wrap">
            <table className="dr-grid">
              <thead>
                <tr>
                  <th className="dr-round-th"></th>
                  {teams.map(t => (
                    <th key={t.id} className={`dr-team-th${t.id === leagueCtx.leagueTeamId ? ' dr-my-col' : ''}`}>
                      {t.team_name.length > 12 ? t.team_name.slice(0, 11) + '…' : t.team_name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pickMatrix.map((row, rIdx) => {
                  const order = teamColOrder(rIdx);
                  return (
                    <tr key={rIdx}>
                      <td className="dr-round-label">R{rIdx + 1}</td>
                      {order.map(colIdx => {
                        const team = teams[colIdx];
                        const pk   = row[colIdx];
                        const isCurrentCell =
                          !isDone &&
                          rIdx === currentRound - 1 &&
                          getPickingTeamIdx(currentOverall, numTeams) === colIdx;
                        const isMyCol = team?.id === leagueCtx.leagueTeamId;
                        return (
                          <td
                            key={colIdx}
                            className={`dr-cell${isCurrentCell ? ' dr-cell-current' : ''}${isMyCol ? ' dr-cell-mine' : ''}`}
                          >
                            {pk ? (
                              <>
                                <div className="dr-pick-name">{pk.player_name.split(' ').slice(-1)[0]}</div>
                                <PosBadge pos={pk.position} />
                              </>
                            ) : isCurrentCell ? (
                              <span style={{ color: 'var(--red)', fontSize: '0.65rem', fontWeight: 800 }}>ON CLOCK</span>
                            ) : null}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Round order pills */}
          <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
            {teamColOrder(currentRound - 1).map(idx => {
              const t = teams[idx];
              if (!t) return null;
              const isNext = t.id === currentTeam?.id;
              const isMe   = t.id === leagueCtx.leagueTeamId;
              return (
                <span key={t.id} style={{
                  fontSize: '0.65rem', padding: '3px 8px', borderRadius: 20,
                  background: isNext ? 'var(--red)' : isMe ? 'rgba(204,0,0,0.15)' : 'var(--surface2)',
                  color: isNext ? '#fff' : isMe ? 'var(--red)' : 'var(--muted)',
                  fontWeight: isNext || isMe ? 800 : 400,
                  border: `1px solid ${isNext ? 'var(--red)' : 'var(--border)'}`,
                }}>
                  {t.team_name}
                </span>
              );
            })}
          </div>
        </div>

        {/* ── RIGHT: Player pool ─────────────────────────────────────────── */}
        <div className="dr-right">
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Controls */}
            <div style={{ padding: '0.75rem', borderBottom: '1px solid var(--border)' }}>
              <input
                className="dr-search"
                type="text"
                placeholder="Search players…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                {['ALL','F','D','G'].map(pos => (
                  <button key={pos} onClick={() => setPosFilter(pos)}
                    className={`dr-filter-btn${posFilter === pos ? ' active' : ''}`}>{pos}</button>
                ))}
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.3rem' }}>
                  {['pts','g','a','gp','+/-'].map(s => (
                    <button key={s} onClick={() => setSortBy(s)}
                      className={`dr-sort-btn${sortBy === s ? ' active' : ''}`}>{s.toUpperCase()}</button>
                  ))}
                </div>
              </div>
            </div>

            {/* Player list */}
            <div className="dr-player-list">
              {filteredPlayers.map(p => {
                const isDrafted = draftedSet.has(p.player_id);
                const elim = poTeams ? isEliminated(p.team_code) : false;
                return (
                  <div key={p.player_id} className={`dr-player-row${isDrafted ? ' dr-drafted' : ''}`}
                    style={elim && !isDrafted ? { opacity: 0.55 } : undefined}>
                    <img
                      src={p.photo_url} alt=""
                      className="dr-player-photo"
                      onError={e => { e.target.style.display = 'none'; }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                        <PosBadge pos={p.position} />
                        {poTeams && (
                          elim
                            ? <span style={{ fontSize: '0.55rem', fontWeight: 800, color: 'var(--muted2)', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 3, padding: '1px 4px', flexShrink: 0 }}>Eliminated</span>
                            : <span style={{ fontSize: '0.7rem', flexShrink: 0 }} title="Playoff active">🟢</span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--muted)', marginTop: '1px' }}>
                        {p.team_code} · {p.gp}GP · {p.g}G · {p.a}A · <strong>{p.pts}PTS</strong>
                        {p.plus_minus != null && ` · ${p.plus_minus >= 0 ? '+' : ''}${p.plus_minus}`}
                      </div>
                    </div>
                    {isDrafted ? (
                      <span style={{ fontSize: '0.65rem', color: 'var(--muted2)', fontWeight: 700, flexShrink: 0 }}>Drafted</span>
                    ) : (
                      <button
                        className="dr-draft-btn"
                        disabled={!isMyTurn || drafting}
                        onClick={() => doPick(p)}
                      >
                        Draft
                      </button>
                    )}
                  </div>
                );
              })}
              {filteredPlayers.length === 0 && (
                <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '2rem', fontSize: '0.85rem' }}>No players found</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
