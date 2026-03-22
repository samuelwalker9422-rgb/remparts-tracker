import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import AuthModal from '../../components/AuthModal';

// ── Helpers ───────────────────────────────────────────────────────────────────
const STATUS_LABEL = { setup: 'Setup', drafting: 'Drafting', active: 'Active', complete: 'Complete' };
const STATUS_COLOR = {
  setup:    { background: 'var(--surface3)', color: 'var(--muted)' },
  drafting: { background: 'rgba(255,215,0,0.15)', color: 'gold' },
  active:   { background: 'rgba(0,166,81,0.15)', color: 'var(--green)' },
  complete: { background: 'var(--surface3)', color: 'var(--muted2)' },
};

function StatusBadge({ status }) {
  const s = status ?? 'setup';
  return (
    <span style={{
      ...STATUS_COLOR[s],
      fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.06em',
      padding: '2px 8px', borderRadius: 4, textTransform: 'uppercase',
    }}>
      {STATUS_LABEL[s] ?? s}
    </span>
  );
}

// ── Create League Modal ───────────────────────────────────────────────────────
function CreateModal({ user, onClose, onCreated }) {
  const [step,       setStep]       = useState(1);   // 1 = league settings, 2 = team name
  const [name,       setName]       = useState('');
  const [numTeams,   setNumTeams]   = useState(10);
  const [season,     setSeason]     = useState('2025-26 Playoffs');
  const [teamName,   setTeamName]   = useState('');
  const [error,      setError]      = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleCreate(e) {
    e.preventDefault();
    if (!teamName.trim()) { setError('Enter your team name.'); return; }
    setError('');
    setSubmitting(true);
    try {
      const { data: league, error: e1 } = await supabase
        .from('fantasy_leagues')
        .insert({ name: name.trim(), commissioner_id: user.id, num_teams: numTeams, season })
        .select()
        .single();
      if (e1) throw e1;

      const { error: e2 } = await supabase
        .from('fantasy_league_teams')
        .insert({ league_id: league.id, user_id: user.id, team_name: teamName.trim() });
      if (e2) throw e2;

      onCreated(league);
    } catch (err) {
      setError(err.message ?? 'Something went wrong.');
    }
    setSubmitting(false);
  }

  return (
    <div className="auth-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 460 }}>
        <button className="auth-close" onClick={onClose}>✕</button>
        <div className="auth-logo">🏒</div>
        <h2 className="auth-title">Create a League</h2>
        <p className="auth-sub">{step === 1 ? 'Set up your league settings' : 'Name your franchise'}</p>

        {step === 1 && (
          <>
            <div className="auth-field">
              <label>League Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Bell Centre Fantasy League"
                maxLength={50}
                autoFocus
              />
            </div>

            <div className="auth-field">
              <label>Number of Teams</label>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                {[2, 6, 8, 10, 12].map(n => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setNumTeams(n)}
                    style={{
                      flex: 1, padding: '0.6rem', border: '1px solid',
                      borderColor: numTeams === n ? 'var(--red)' : 'var(--border)',
                      borderRadius: 7, background: numTeams === n ? 'rgba(204,0,0,0.15)' : 'var(--surface2)',
                      color: numTeams === n ? 'var(--red)' : 'var(--text)',
                      fontWeight: numTeams === n ? 800 : 400,
                      cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.9rem',
                    }}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div className="auth-field">
              <label>Season</label>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                {['2025-26 Playoffs', '2026-27'].map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSeason(s)}
                    style={{
                      flex: 1, padding: '0.6rem', border: '1px solid',
                      borderColor: season === s ? 'var(--red)' : 'var(--border)',
                      borderRadius: 7, background: season === s ? 'rgba(204,0,0,0.15)' : 'var(--surface2)',
                      color: season === s ? 'var(--red)' : 'var(--text)',
                      fontWeight: season === s ? 800 : 400,
                      cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.8rem',
                    }}
                  >
                    {s === '2025-26 Playoffs' ? '🏆 2025-26 Playoffs' : '2026-27'}
                  </button>
                ))}
              </div>
            </div>

            {error && <div className="auth-error">{error}</div>}

            <button
              className="auth-submit"
              onClick={() => {
                if (!name.trim()) { setError('Enter a league name.'); return; }
                setError('');
                setStep(2);
              }}
            >
              Next →
            </button>
          </>
        )}

        {step === 2 && (
          <form onSubmit={handleCreate}>
            <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '1.25rem', fontSize: '0.82rem', color: 'var(--muted)' }}>
              <strong style={{ color: 'var(--text)' }}>{name}</strong> · {numTeams} teams · 2026-27
            </div>
            <div className="auth-field">
              <label>Your Team Name</label>
              <input
                type="text"
                value={teamName}
                onChange={e => setTeamName(e.target.value)}
                placeholder="e.g. Montréal Mafia"
                maxLength={40}
                required
                autoFocus
              />
            </div>
            {error && <div className="auth-error">{error}</div>}
            <button className="auth-submit" type="submit" disabled={submitting}>
              {submitting ? 'Creating…' : 'Create League'}
            </button>
            <button
              type="button"
              className="auth-switch"
              style={{ display: 'block', width: '100%', textAlign: 'center', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: '0.82rem', fontFamily: 'inherit' }}
              onClick={() => { setStep(1); setError(''); }}
            >
              ← Back
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// ── Join League Modal ─────────────────────────────────────────────────────────
function JoinModal({ user, onClose, onJoined }) {
  const [code,       setCode]       = useState('');
  const [preview,    setPreview]    = useState(null);  // the league row once found
  const [teamName,   setTeamName]   = useState('');
  const [error,      setError]      = useState('');
  const [looking,    setLooking]    = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function lookupCode(e) {
    e.preventDefault();
    if (code.trim().length !== 6) { setError('Invite codes are 6 characters.'); return; }
    setError('');
    setLooking(true);
    const { data, error: err } = await supabase
      .from('fantasy_leagues')
      .select('id, name, season, num_teams, status, commissioner_id, profiles(username)')
      .eq('invite_code', code.trim().toUpperCase())
      .maybeSingle();
    setLooking(false);
    if (err || !data) { setError('League not found. Check the invite code.'); return; }

    // Check not already a member
    const { data: existing } = await supabase
      .from('fantasy_league_teams')
      .select('id')
      .eq('league_id', data.id)
      .eq('user_id', user.id)
      .maybeSingle();
    if (existing) { setError("You're already in this league."); return; }

    setPreview(data);
  }

  async function handleJoin(e) {
    e.preventDefault();
    if (!teamName.trim()) { setError('Enter your team name.'); return; }
    setError('');
    setSubmitting(true);
    const { error: err } = await supabase
      .from('fantasy_league_teams')
      .insert({ league_id: preview.id, user_id: user.id, team_name: teamName.trim() });
    if (err) { setError(err.message); setSubmitting(false); return; }
    onJoined(preview);
  }

  return (
    <div className="auth-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
        <button className="auth-close" onClick={onClose}>✕</button>
        <div className="auth-logo">🔑</div>
        <h2 className="auth-title">Join a League</h2>
        <p className="auth-sub">Enter the 6-character invite code from your commissioner</p>

        {!preview ? (
          <form onSubmit={lookupCode}>
            <div className="auth-field">
              <label>Invite Code</label>
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase().slice(0, 6))}
                placeholder="ABC123"
                maxLength={6}
                autoFocus
                style={{ letterSpacing: '0.15em', fontSize: '1.1rem', textTransform: 'uppercase', textAlign: 'center' }}
              />
            </div>
            {error && <div className="auth-error">{error}</div>}
            <button className="auth-submit" type="submit" disabled={looking}>
              {looking ? 'Looking up…' : 'Find League'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleJoin}>
            <div style={{ background: 'rgba(0,166,81,0.08)', border: '1px solid rgba(0,166,81,0.25)', borderRadius: 8, padding: '0.85rem 1rem', marginBottom: '1.25rem' }}>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', marginBottom: '0.2rem' }}>{preview.name}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                {preview.season} · {preview.num_teams} teams
                {preview.profiles?.username && <> · Commissioner: <strong style={{ color: 'var(--text)' }}>{preview.profiles.username}</strong></>}
              </div>
            </div>
            <div className="auth-field">
              <label>Your Team Name</label>
              <input
                type="text"
                value={teamName}
                onChange={e => setTeamName(e.target.value)}
                placeholder="e.g. Gatineau Ghosts"
                maxLength={40}
                required
                autoFocus
              />
            </div>
            {error && <div className="auth-error">{error}</div>}
            <button className="auth-submit" type="submit" disabled={submitting}>
              {submitting ? 'Joining…' : 'Join League'}
            </button>
            <button
              type="button"
              style={{ display: 'block', width: '100%', textAlign: 'center', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: '0.82rem', fontFamily: 'inherit', marginTop: '0.5rem' }}
              onClick={() => { setPreview(null); setError(''); }}
            >
              ← Try a different code
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function LeagueHub({ onEnterLeague, onTonightPickup, onStandings }) {
  const [user,      setUser]      = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [leagues,   setLeagues]   = useState([]);
  const [showAuth,  setShowAuth]  = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin,   setShowJoin]   = useState(false);

  // ── Auth ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const u = data?.user ?? null;
      setUser(u);
      if (u) loadLeagues(u.id); else setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_ev, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) loadLeagues(u.id); else { setLeagues([]); setLoading(false); }
    });
    return () => listener?.subscription?.unsubscribe();
  }, []);

  async function loadLeagues(userId) {
    setLoading(true);
    const { data } = await supabase
      .from('fantasy_league_teams')
      .select('id, team_name, total_points, draft_position, fantasy_leagues(id, name, season, num_teams, status, draft_status, invite_code, commissioner_id)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    setLeagues(data ?? []);
    setLoading(false);
  }

  function afterCreate(league) {
    setShowCreate(false);
    if (user) loadLeagues(user.id);
  }

  function afterJoin(league) {
    setShowJoin(false);
    if (user) loadLeagues(user.id);
  }

  // ── Not signed in ─────────────────────────────────────────────────────────
  if (!user && !loading) {
    return (
      <div className="page">
        {showAuth && (
          <AuthModal
            onClose={() => setShowAuth(false)}
            onAuth={u => { setUser(u); loadLeagues(u.id); }}
          />
        )}
        <div className="espn-header">
          <div className="espn-header-bar" />
          <h2>Fantasy GM Mode</h2>
          <span className="subtitle">QMJHL League Manager</span>
        </div>
        <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🏒</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.4rem' }}>Sign in to manage your leagues</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '1.5rem' }}>Create or join a QMJHL fantasy league and act as GM + Coach</div>
          <button className="auth-submit" style={{ maxWidth: 260, margin: '0 auto' }} onClick={() => setShowAuth(true)}>
            Sign In / Create Account
          </button>
        </div>
        <TonightCard onTonightPickup={onTonightPickup} />
      </div>
    );
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="page">
        <div className="espn-header"><div className="espn-header-bar" /><h2>Fantasy GM Mode</h2></div>
        <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '3rem' }}>Loading your leagues…</div>
      </div>
    );
  }

  return (
    <div className="page">
      {showAuth  && <AuthModal onClose={() => setShowAuth(false)} onAuth={u => { setUser(u); loadLeagues(u.id); }} />}
      {showCreate && <CreateModal user={user} onClose={() => setShowCreate(false)} onCreated={afterCreate} />}
      {showJoin  && <JoinModal   user={user} onClose={() => setShowJoin(false)}   onJoined={afterJoin}   />}

      <div className="espn-header">
        <div className="espn-header-bar" />
        <h2>Fantasy GM Mode</h2>
        <span className="subtitle">QMJHL League Manager · {user?.email}</span>
      </div>

      {/* ── No leagues yet ──────────────────────────────────────────────── */}
      {leagues.length === 0 && (
        <>
          <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '0.85rem', margin: '1rem 0 1.5rem' }}>
            You're not in any leagues yet. Create one or enter an invite code.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', maxWidth: 640, margin: '0 auto' }}>
            <button className="lh-action-card" onClick={() => setShowCreate(true)}>
              <div className="lh-action-icon">🏗️</div>
              <div className="lh-action-title">Create a League</div>
              <div className="lh-action-sub">Set up your league, invite your friends, and run the draft</div>
            </button>
            <button className="lh-action-card" onClick={() => setShowJoin(true)}>
              <div className="lh-action-icon">🔑</div>
              <div className="lh-action-title">Join a League</div>
              <div className="lh-action-sub">Enter a 6-character invite code from your commissioner</div>
            </button>
          </div>
        </>
      )}

      {/* ── Has leagues ─────────────────────────────────────────────────── */}
      {leagues.length > 0 && (
        <>
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
            <button className="auth-submit" style={{ maxWidth: 180 }} onClick={() => setShowCreate(true)}>
              + Create League
            </button>
            <button
              className="auth-submit"
              style={{ maxWidth: 180, background: 'var(--surface2)', color: 'var(--text)', border: '1px solid var(--border)' }}
              onClick={() => setShowJoin(true)}
            >
              + Join League
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {leagues.map(row => {
              const lg = row.fantasy_leagues;
              if (!lg) return null;
              const isCommish = lg.commissioner_id === user?.id;
              return (
                <div key={row.id} className="card" style={{ borderTop: '3px solid var(--red)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                    <div style={{ fontWeight: 800, fontSize: '1rem', lineHeight: 1.2 }}>{lg.name}</div>
                    <StatusBadge status={lg.status} />
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                    {lg.season} · {lg.num_teams} teams
                    {isCommish && <span style={{ marginLeft: '0.5rem', background: 'rgba(204,0,0,0.15)', color: 'var(--red)', fontSize: '0.62rem', fontWeight: 800, padding: '1px 6px', borderRadius: 4 }}>COMMISH</span>}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>
                    Your team: <strong style={{ color: 'var(--text)' }}>{row.team_name}</strong>
                  </div>
                  {isCommish && (
                    <div style={{ fontSize: '0.72rem', color: 'var(--muted2)', fontFamily: 'monospace' }}>
                      Invite code: <strong style={{ color: 'var(--muted)', letterSpacing: '0.1em' }}>{lg.invite_code}</strong>
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                    <button
                      className="auth-submit"
                      style={{ flex: 1, padding: '0.5rem', fontSize: '0.82rem' }}
                      onClick={() => onEnterLeague?.({ leagueId: lg.id, leagueTeamId: row.id, leagueName: lg.name, leagueStatus: lg.status, leagueSeason: lg.season, teamName: row.team_name })}
                    >
                      Enter League →
                    </button>
                    {lg.status === 'active' && (
                      <button
                        style={{
                          padding: '0.5rem 0.75rem', fontSize: '0.82rem', fontFamily: 'inherit',
                          background: 'rgba(255,215,0,0.12)', border: '1px solid rgba(255,215,0,0.3)',
                          color: 'gold', borderRadius: 7, cursor: 'pointer', fontWeight: 700, flexShrink: 0,
                        }}
                        onClick={() => onStandings?.({ leagueId: lg.id, leagueTeamId: row.id, leagueName: lg.name, leagueStatus: lg.status, leagueSeason: lg.season, teamName: row.team_name })}
                      >
                        📊 Standings
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <TonightCard onTonightPickup={onTonightPickup} />
    </div>
  );
}

// ── Tonight's Pickup card (always shown at bottom) ────────────────────────────
function TonightCard({ onTonightPickup }) {
  return (
    <div style={{ marginTop: '2rem' }}>
      <div className="espn-header">
        <div className="espn-header-bar" style={{ background: 'var(--orange)' }} />
        <h2>Tonight's Pickup Game</h2>
        <span className="subtitle">Pick a single-game lineup for tonight's Remparts game</span>
      </div>
      <div className="card section-gap" style={{ borderLeft: '4px solid var(--orange)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Classic Fantasy Mode</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>Pick tonight's lineup · ESPN scoring · No league required</div>
        </div>
        <button
          className="auth-submit"
          style={{ minWidth: 120, padding: '0.5rem 1rem', fontSize: '0.82rem', background: 'var(--orange)', flexShrink: 0 }}
          onClick={onTonightPickup}
        >
          Play Tonight →
        </button>
      </div>
    </div>
  );
}
