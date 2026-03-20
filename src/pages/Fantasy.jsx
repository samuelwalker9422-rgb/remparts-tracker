import { useState, useEffect } from 'react';
import { supabase, supabaseReady } from '../lib/supabase';
import AuthModal from '../components/AuthModal';

// ── Scoring ───────────────────────────────────────────────────────────────────
// Goal = 3 pts, Assist = 2 pts  (shots/PIM not currently tracked in gameLog)
function computeScore(lineupNums, gameId, gameLog) {
  return lineupNums.reduce((total, num) => {
    const entries = gameLog.filter(e => e.gameId === gameId && e.num === num);
    return total + entries.reduce((s, e) => s + e.g * 3 + e.a * 2, 0);
  }, 0);
}

// ── Puck-drop check ───────────────────────────────────────────────────────────
function isPuckDrop(game) {
  if (!game?.time || !game?.tz) return false;
  const [yr, mo, dy] = game.date.split('-').map(Number);
  const [h, m]       = game.time.split(':').map(Number);
  // UTC offsets during DST (Mar–Nov): ET=-4, AT=-3, NT=-2.5
  const offsets = { 'America/Toronto': 4, 'America/Halifax': 3, 'America/St_Johns': 2.5 };
  const off     = offsets[game.tz] ?? 4;
  const gameUTC = new Date(Date.UTC(yr, mo - 1, dy, h + Math.floor(off), m + (off % 1) * 60));
  return Date.now() >= gameUTC.getTime();
}

// ── Position limits ───────────────────────────────────────────────────────────
const LIMITS = { F: 6, D: 3, G: 1 };

function today() { return new Date().toISOString().split('T')[0]; }

function fmtDate(d) {
  return new Date(d + 'T12:00:00').toLocaleDateString('en-CA', {
    weekday: 'short', month: 'short', day: 'numeric',
  });
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function Fantasy({ teamData }) {
  const { skaters, goalies, schedule, gameLog } = teamData;

  const [tab, setTab]               = useState('pick');
  const [user, setUser]             = useState(null);
  const [profile, setProfile]       = useState(null);
  const [showAuth, setShowAuth]     = useState(false);
  const [selected, setSelected]     = useState([]);
  const [myLineups, setMyLineups]   = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);
  const [loadingL, setLoadingL]     = useState(false);

  // Today's upcoming game
  const todayGame  = schedule.find(g => g.date === today() && g.result === 'upcoming') ?? null;
  const locked     = todayGame ? isPuckDrop(todayGame) : false;
  const scratchMap = Object.fromEntries((todayGame?.scratches ?? []).map(s => [s.num, s.reason]));

  // ── Auth ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) { setUser(data.user); fetchProfile(data.user.id); }
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_ev, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) fetchProfile(u.id); else setProfile(null);
    });
    return () => listener?.subscription?.unsubscribe();
  }, []);

  async function fetchProfile(userId) {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    if (data) setProfile(data);
  }

  // ── Load data when tabs change ────────────────────────────────────────────
  useEffect(() => {
    if (tab === 'mine' && user) loadMyLineups();
  }, [tab, user]);

  useEffect(() => {
    if (tab === 'leaderboard') loadLeaderboard();
  }, [tab]);

  async function loadMyLineups() {
    setLoadingL(true);
    const { data } = await supabase
      .from('fantasy_lineups')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      // Auto-score completed games where score is still 0
      const scored = await Promise.all(data.map(async row => {
        const game = schedule.find(g => g.date === row.game_date);
        if (game && game.result !== 'upcoming' && row.score === 0 && row.lineup?.length > 0) {
          const score = computeScore(row.lineup, game.id, gameLog);
          if (score > 0) {
            await supabase.from('fantasy_lineups').update({ score }).eq('id', row.id);
            return { ...row, score };
          }
        }
        return row;
      }));
      setMyLineups(scored);
    }
    setLoadingL(false);
  }

  async function loadLeaderboard() {
    const { data } = await supabase.rpc('get_leaderboard');
    if (data) setLeaderboard(data);
  }

  // ── Player selection ──────────────────────────────────────────────────────
  const allPlayers = [...skaters, ...goalies];

  function getPos(num) { return allPlayers.find(p => p.num === num)?.pos ?? 'F'; }

  function selCountFor(pos) { return selected.filter(n => getPos(n) === pos).length; }

  function togglePlayer(num, pos) {
    if (selected.includes(num)) {
      setSelected(prev => prev.filter(n => n !== num));
    } else {
      const limit = LIMITS[pos === 'G' ? 'G' : pos];
      if (selCountFor(pos) >= limit) return;
      setSelected(prev => [...prev, num]);
    }
  }

  const selF   = selCountFor('F');
  const selD   = selCountFor('D');
  const selG   = selCountFor('G');
  const complete = selF === LIMITS.F && selD === LIMITS.D && selG === LIMITS.G;

  // ── Submit lineup ─────────────────────────────────────────────────────────
  async function submitLineup() {
    if (!user) { setShowAuth(true); return; }
    if (!todayGame || !complete) return;
    setSubmitting(true);
    const { error } = await supabase.from('fantasy_lineups').insert({
      user_id:   user.id,
      game_date: todayGame.date,
      lineup:    selected,
      score:     0,
    });
    if (!error) { setSubmitted(true); setSelected([]); }
    setSubmitting(false);
  }

  // ── Player card renderer ──────────────────────────────────────────────────
  const SCRATCH_LABEL = { HS: 'SCRATCH', IR: 'INJURED', SUS: 'SUSP' };

  function PlayerCard({ p, pos, countFn, isGoalie = false }) {
    const isSel    = selected.includes(p.num);
    const limit    = LIMITS[pos === 'G' ? 'G' : pos];
    const maxed    = !isSel && countFn() >= limit;
    const scratch  = scratchMap[p.num];
    const unavail  = !!scratch;
    return (
      <button
        className={`fant-player-card${isSel ? ' sel' : ''}${maxed || unavail ? ' maxed' : ''}`}
        onClick={() => !maxed && !unavail && togglePlayer(p.num, pos)}
        disabled={locked || unavail}
      >
        {p.photo && (
          <img
            src={p.photo}
            alt=""
            className="fant-player-photo"
            onError={e => { e.target.style.display = 'none'; }}
          />
        )}
        <div className="fant-player-name">{p.name}</div>
        <div className="fant-player-meta">
          #{p.num}
          {isGoalie
            ? ` · ${p.gp} GP · ${p.svPct}% SV`
            : ` · ${p.gp} GP · ${p.pts} PTS`
          }
        </div>
        {unavail && (
          <div className={`fant-scratch-badge fant-scratch-${scratch.toLowerCase()}`}>
            {SCRATCH_LABEL[scratch] ?? scratch}
          </div>
        )}
        {isSel && !unavail && <div className="fant-check">✓</div>}
      </button>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  if (!supabaseReady) {
    return (
      <div className="page">
        <div className="espn-header">
          <div className="espn-header-bar" style={{ background: 'gold' }} />
          <h2>🏒 Fantasy Hockey</h2>
        </div>
        <div className="fant-empty" style={{ paddingTop: '4rem' }}>
          <div className="fant-empty-icon">⚙️</div>
          <div className="fant-empty-title">Setup required</div>
          <div className="fant-empty-sub">
            Add <code style={{ background: 'var(--surface3)', padding: '0 4px', borderRadius: 4 }}>VITE_SUPABASE_URL</code> and{' '}
            <code style={{ background: 'var(--surface3)', padding: '0 4px', borderRadius: 4 }}>VITE_SUPABASE_ANON_KEY</code>{' '}
            to your Vercel environment variables to enable Fantasy.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      {showAuth && (
        <AuthModal
          onClose={() => setShowAuth(false)}
          onAuth={u => { setUser(u); fetchProfile(u.id); }}
        />
      )}

      {/* Header */}
      <div className="espn-header">
        <div className="espn-header-bar" style={{ background: 'gold' }} />
        <h2>🏒 Fantasy Hockey</h2>
        <span className="subtitle">Pick your lineup · Earn points · Compete</span>
      </div>

      {/* Auth bar */}
      <div className="fant-auth-bar">
        {user ? (
          <div className="fant-user-row">
            <span className="fant-username">👤 {profile?.username ?? user.email}</span>
            <button className="fant-signout-btn" onClick={() => supabase.auth.signOut()}>
              Sign out
            </button>
          </div>
        ) : (
          <button className="fant-signin-btn" onClick={() => setShowAuth(true)}>
            Sign in to play
          </button>
        )}
      </div>

      {/* Tab bar */}
      <div className="fant-tabs">
        {[
          ['pick',        '🏒 Pick Lineup'],
          ['mine',        '📋 My Lineups'],
          ['leaderboard', '🏆 Leaderboard'],
        ].map(([key, label]) => (
          <button
            key={key}
            className={`fant-tab${tab === key ? ' active' : ''}`}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ══ PICK LINEUP ════════════════════════════════════════════════════ */}
      {tab === 'pick' && (
        <>
          {!todayGame ? (
            <div className="fant-empty">
              <div className="fant-empty-icon">🏒</div>
              <div className="fant-empty-title">No game today</div>
              <div className="fant-empty-sub">Check back on a game day to pick your lineup</div>
            </div>

          ) : locked ? (
            <div className="fant-banner fant-banner-locked">
              🔒 Lineup is locked — puck has dropped. Check <strong>My Lineups</strong> for your score.
            </div>

          ) : submitted ? (
            <div className="fant-banner fant-banner-success">
              ✅ Lineup locked! Good luck tonight vs {todayGame.home ? '' : '@ '}{todayGame.opponent}.
            </div>

          ) : (
            <>
              {/* Tonight's game banner */}
              <div className="fant-game-banner">
                <span className="fant-game-label">Tonight</span>
                <span className="fant-game-opp">
                  {todayGame.home ? 'vs' : '@'} {todayGame.opponent}
                </span>
                <span className="badge badge-loc">{todayGame.home ? 'HOME' : 'AWAY'}</span>
              </div>

              {/* Slot counter */}
              <div className="fant-counter">
                <div className={`fant-slot${selF === LIMITS.F ? ' done' : ''}`}>
                  <span className="fant-slot-num">{selF}/{LIMITS.F}</span>
                  <span className="fant-slot-pos">F</span>
                </div>
                <div className={`fant-slot${selD === LIMITS.D ? ' done' : ''}`}>
                  <span className="fant-slot-num">{selD}/{LIMITS.D}</span>
                  <span className="fant-slot-pos">D</span>
                </div>
                <div className={`fant-slot${selG === LIMITS.G ? ' done' : ''}`}>
                  <span className="fant-slot-num">{selG}/{LIMITS.G}</span>
                  <span className="fant-slot-pos">G</span>
                </div>
              </div>

              {/* Forwards */}
              <div className="fant-section-label">Forwards</div>
              <div className="fant-grid">
                {skaters.filter(p => p.pos === 'F').map(p => (
                  <PlayerCard key={p.num} p={p} pos="F" countFn={() => selF} />
                ))}
              </div>

              {/* Defence */}
              <div className="fant-section-label">Defence</div>
              <div className="fant-grid">
                {skaters.filter(p => p.pos === 'D').map(p => (
                  <PlayerCard key={p.num} p={p} pos="D" countFn={() => selD} />
                ))}
              </div>

              {/* Goaltender */}
              <div className="fant-section-label">Goaltender</div>
              <div className="fant-grid">
                {goalies.map(p => (
                  <PlayerCard key={p.num} p={p} pos="G" countFn={() => selG} isGoalie />
                ))}
              </div>

              {/* Lock button */}
              <div className="fant-lock-wrap">
                <div className="fant-scoring-key">
                  Scoring: Goal = 3 pts · Assist = 2 pts
                </div>
                <button
                  className="fant-lock-btn"
                  disabled={!complete || submitting}
                  onClick={submitLineup}
                >
                  {submitting
                    ? 'Locking…'
                    : !user
                    ? '🔒 Sign in to lock lineup'
                    : complete
                    ? '🔒 Lock My Lineup'
                    : `Pick ${LIMITS.F - selF}F · ${LIMITS.D - selD}D · ${LIMITS.G - selG}G`}
                </button>
              </div>
            </>
          )}
        </>
      )}

      {/* ══ MY LINEUPS ════════════════════════════════════════════════════ */}
      {tab === 'mine' && (
        <>
          {!user ? (
            <div className="fant-empty">
              <div className="fant-empty-icon">🔒</div>
              <div className="fant-empty-title">Sign in to see your lineups</div>
              <button className="fant-signin-btn" style={{ marginTop: '1.25rem' }} onClick={() => setShowAuth(true)}>
                Sign in
              </button>
            </div>

          ) : loadingL ? (
            <div className="fant-loading">Loading lineups…</div>

          ) : myLineups.length === 0 ? (
            <div className="fant-empty">
              <div className="fant-empty-icon">📋</div>
              <div className="fant-empty-title">No lineups yet</div>
              <div className="fant-empty-sub">Pick a lineup on game day to get started</div>
            </div>

          ) : (
            <div className="fant-lineups-list section-gap">
              {myLineups.map(row => {
                const game    = schedule.find(g => g.date === row.game_date);
                const players = (row.lineup ?? [])
                  .map(num => allPlayers.find(p => p.num === num))
                  .filter(Boolean);
                const isDone  = game && game.result !== 'upcoming';
                return (
                  <div key={row.id} className="fant-lineup-card">
                    <div className="fant-lineup-header">
                      <div>
                        <span className="fant-lineup-date">{fmtDate(row.game_date)}</span>
                        {game && (
                          <span className="fant-lineup-opp">
                            {game.home ? 'vs' : '@'} {game.opponent}
                          </span>
                        )}
                      </div>
                      <div className="fant-lineup-score">
                        {isDone
                          ? <span className={`fant-score-badge${row.score > 0 ? ' positive' : ''}`}>{row.score} pts</span>
                          : <span className="fant-score-badge pending">Upcoming</span>
                        }
                      </div>
                    </div>
                    <div className="fant-chips">
                      {players.map(p => (
                        <span key={p.num} className="fant-chip">
                          {p.pos === 'G' && <span className="fant-chip-pos">G</span>}
                          {p.pos === 'D' && <span className="fant-chip-pos">D</span>}
                          #{p.num} {p.name.split(' ').slice(-1)[0]}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ══ LEADERBOARD ══════════════════════════════════════════════════ */}
      {tab === 'leaderboard' && (
        <>
          <div className="espn-header" style={{ marginTop: '0.5rem' }}>
            <div className="espn-header-bar" style={{ background: 'gold' }} />
            <h2>Top Players</h2>
            <span className="subtitle">Total fantasy points · All games</span>
          </div>

          {leaderboard.length === 0 ? (
            <div className="fant-empty">
              <div className="fant-empty-icon">🏆</div>
              <div className="fant-empty-title">Leaderboard is empty</div>
              <div className="fant-empty-sub">Submit lineups to start earning points and appear here</div>
            </div>
          ) : (
            <div className="table-wrap section-gap">
              <table>
                <thead>
                  <tr>
                    <th className="left">#</th>
                    <th className="left">Player</th>
                    <th>Lineups</th>
                    <th className="pts-cell">Total Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((row, i) => (
                    <tr
                      key={row.username}
                      className={row.username === profile?.username ? 'std-remparts' : ''}
                    >
                      <td
                        className="left"
                        style={{
                          color:      i < 3 ? 'var(--red)' : 'var(--muted)',
                          fontWeight: i < 3 ? 800 : 400,
                          fontSize:   '0.72rem',
                        }}
                      >
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                      </td>
                      <td className="left" style={{ fontWeight: 600 }}>{row.username}</td>
                      <td style={{ color: 'var(--muted)' }}>{row.lineups_count}</td>
                      <td className="pts-cell"><strong>{row.total_score}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
