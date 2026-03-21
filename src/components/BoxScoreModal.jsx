import { useState, useEffect } from 'react';

// ── Helpers ───────────────────────────────────────────────────────────────────
function perLabel(id) {
  const n = Number(id);
  if (n === 1) return '1st';
  if (n === 2) return '2nd';
  if (n === 3) return '3rd';
  if (n === 4) return 'OT';
  return `OT${n - 3}`;
}

function goalBadge(g) {
  if (g.power_play === '1')    return 'PP';
  if (g.short_handed === '1')  return 'SH';
  if (g.empty_net === '1')     return 'EN';
  if (g.penalty_shot === '1')  return 'PS';
  return null;
}

// ── Skater table ──────────────────────────────────────────────────────────────
function SkaterTable({ players, label }) {
  const skaters = (players ?? []).filter(
    p => p.position_str !== 'G' && p.position !== 'G'
  );
  if (!skaters.length) return null;
  return (
    <div className="bs-player-block">
      <div className="bs-team-label">{label}</div>
      <div className="bs-table-scroll">
        <table className="bs-table">
          <thead>
            <tr>
              <th>#</th>
              <th className="left">Player</th>
              <th>Pos</th>
              <th>G</th><th>A</th><th>PTS</th>
              <th>+/-</th><th>PIM</th><th>SOG</th>
            </tr>
          </thead>
          <tbody>
            {skaters.map(p => {
              const pts = Number(p.goals) + Number(p.assists);
              const pm  = Number(p.plusminus ?? 0);
              return (
                <tr key={p.player_id}>
                  <td className="bs-num">{p.jersey_number}</td>
                  <td className="left">{p.first_name} {p.last_name}</td>
                  <td style={{ color: 'var(--muted)', fontSize: '0.7rem' }}>{p.position_str}</td>
                  <td>{p.goals}</td>
                  <td>{p.assists}</td>
                  <td><strong>{pts > 0 ? pts : '—'}</strong></td>
                  <td style={{ color: pm > 0 ? 'var(--green)' : pm < 0 ? 'var(--red)' : 'var(--muted)' }}>
                    {pm > 0 ? `+${pm}` : pm === 0 ? '—' : pm}
                  </td>
                  <td>{p.pim}</td>
                  <td>{p.shots_on ?? p.shots ?? '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Goalie table ──────────────────────────────────────────────────────────────
function GoalieTable({ goalies, label }) {
  if (!goalies?.length) return null;
  return (
    <div className="bs-player-block">
      <div className="bs-team-label">{label}</div>
      <div className="bs-table-scroll">
        <table className="bs-table">
          <thead>
            <tr>
              <th className="left">Goalie</th>
              <th>SA</th><th>SV</th><th>GA</th>
              <th>SV%</th><th>TOI</th><th>Dec</th>
            </tr>
          </thead>
          <tbody>
            {goalies.map(g => {
              const sa  = Number(g.shots_against ?? 0);
              const sv  = Number(g.saves ?? 0);
              const pct = sa > 0 ? `.${((sv / sa) * 1000).toFixed(0).padStart(3, '0')}` : '—';
              const dec = g.win === '1' ? 'W' : g.loss === '1' ? 'L' : g.ot_loss === '1' ? 'OTL' : '';
              return (
                <tr key={g.player_id}>
                  <td className="left">{g.first_name} {g.last_name}</td>
                  <td>{g.shots_against ?? '—'}</td>
                  <td>{g.saves ?? '—'}</td>
                  <td>{g.goals_against ?? '—'}</td>
                  <td style={{ color: 'var(--muted)' }}>{pct}</td>
                  <td style={{ color: 'var(--muted)' }}>{g.secs_mmss ?? '—'}</td>
                  <td style={{
                    fontWeight: 700,
                    color: dec === 'W' ? 'var(--green)' : dec === 'L' ? 'var(--red)' : 'var(--orange)'
                  }}>
                    {dec || '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Main modal ────────────────────────────────────────────────────────────────
export default function BoxScoreModal({ gameId, onClose }) {
  const [gs, setGs]         = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr]       = useState(null);

  useEffect(() => {
    if (!gameId) return;
    setLoading(true); setErr(null); setGs(null);
    fetch(`/api/boxscore?game_id=${gameId}`)
      .then(r => r.json())
      .then(json => {
        const data = json?.GC?.Gamesummary;
        if (!data) throw new Error('No data');
        setGs(data);
      })
      .catch(e => setErr(e.message))
      .finally(() => setLoading(false));
  }, [gameId]);

  // Esc to close
  useEffect(() => {
    const fn = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [onClose]);

  const meta    = gs?.meta    ?? {};
  const visitor = gs?.visitor ?? {};
  const home    = gs?.home    ?? {};
  const goals   = gs?.goals   ?? [];
  const gpG     = gs?.goalsByPeriod ?? {};
  const gpS     = gs?.shotsByPeriod ?? {};

  const homeTotal    = Number(meta.home_goal_count      ?? 0);
  const visitorTotal = Number(meta.visiting_goal_count  ?? 0);

  const maxPeriod   = goals.length ? Math.max(3, ...goals.map(g => Number(g.period_id))) : 3;
  const periods     = Array.from({ length: maxPeriod }, (_, i) => i + 1);
  const hasShootout = meta.shootout === '1';

  const visShotTot = periods.reduce((s, p) => s + Number(gpS.visitor?.[p] ?? 0), 0);
  const homShotTot = periods.reduce((s, p) => s + Number(gpS.home?.[p]    ?? 0), 0);

  const homeLabel    = [home.city,    home.nickname].filter(Boolean).join(' ');
  const visitorLabel = [visitor.city, visitor.nickname].filter(Boolean).join(' ');
  const homeCode     = home.team_code    || home.code    || 'HOME';
  const visitorCode  = visitor.team_code || visitor.code || 'VIS';

  const homePlayers    = gs?.home_team_lineup?.players    ?? [];
  const visitorPlayers = gs?.visitor_team_lineup?.players ?? [];
  const homeGoalies    = gs?.goalies?.home    ?? [];
  const visitorGoalies = gs?.goalies?.visitor ?? [];

  const statusText = meta.status_title || (meta.final === '1' ? 'FINAL' : 'LIVE');
  const floUrl = meta.flo_core_event_id
    ? `https://www.flohockey.tv/events/${meta.flo_core_event_id}`
    : null;

  return (
    <div className="bs-overlay" onClick={onClose}>
      <div className="bs-modal" onClick={e => e.stopPropagation()}>
        <button className="bs-close" onClick={onClose}>✕</button>

        {loading && <div className="bs-loading">Loading box score…</div>}
        {err     && <div className="bs-loading" style={{ color: 'var(--red)' }}>Failed to load game data</div>}

        {gs && (<>

          {/* ── HEADER ── */}
          <div className="bs-header">
            <div className="bs-hcol">
              <div className="bs-hteam">{visitorLabel || 'Visitor'}</div>
              <div className={`bs-hscore${visitorTotal > homeTotal ? ' bs-hscore-win' : ''}`}>
                {visitorTotal}
              </div>
              <div className="bs-hlabel">Away</div>
            </div>
            <div className="bs-hmid">
              <div className="bs-hstatus">{statusText}</div>
              <div className="bs-hdate">{meta.game_date}</div>
              <div className="bs-hvenue">{meta.location}</div>
              {floUrl && (
                <a href={floUrl} target="_blank" rel="noopener noreferrer" className="bs-watch-btn">
                  📺 Watch on FloHockey
                </a>
              )}
            </div>
            <div className="bs-hcol">
              <div className="bs-hteam">{homeLabel || 'Home'}</div>
              <div className={`bs-hscore${homeTotal > visitorTotal ? ' bs-hscore-win' : ''}`}>
                {homeTotal}
              </div>
              <div className="bs-hlabel">Home</div>
            </div>
          </div>

          {/* ── LINESCORE ── */}
          <div className="bs-linescore-wrap">
            <table className="bs-linescore">
              <thead>
                <tr>
                  <th className="left" style={{ minWidth: 42 }}></th>
                  {periods.map(p => <th key={p}>{perLabel(p)}</th>)}
                  {hasShootout && <th>SO</th>}
                  <th>T</th>
                  <th>SOG</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { code: visitorCode, side: 'visitor', total: visitorTotal, sog: visShotTot },
                  { code: homeCode,    side: 'home',    total: homeTotal,    sog: homShotTot },
                ].map(({ code, side, total, sog }) => (
                  <tr key={side}>
                    <td className="left bs-ls-code">{code}</td>
                    {periods.map(p => <td key={p}>{gpG[side]?.[p] ?? 0}</td>)}
                    {hasShootout && <td>—</td>}
                    <td><strong>{total}</strong></td>
                    <td style={{ color: 'var(--muted)' }}>{sog}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── SCORING SUMMARY ── */}
          {goals.length > 0 && (
            <div className="bs-section">
              <div className="bs-section-title">Scoring Summary</div>
              <div className="bs-goal-list">
                {goals.map((g, i) => {
                  const scorer  = g.goal_scorer;
                  const a1      = g.assist1_player;
                  const a2      = g.assist2_player;
                  const badge   = goalBadge(g);
                  const assists = [a1, a2].filter(a => a?.player_id);
                  const isHome  = g.home === '1';
                  const code    = isHome ? homeCode : visitorCode;
                  return (
                    <div key={i} className="bs-goal-row">
                      <span className="bs-gper">{perLabel(g.period_id)}</span>
                      <span className="bs-gtime">{g.time}</span>
                      <span className={`bs-gcode ${isHome ? 'bs-gcode-home' : 'bs-gcode-vis'}`}>{code}</span>
                      <span className="bs-ginfo">
                        <span className="bs-gscorer">
                          #{scorer?.jersey_number} {scorer?.first_name} {scorer?.last_name}
                        </span>
                        {badge && (
                          <span className={`bs-gbadge bs-gbadge-${badge.toLowerCase()}`}>{badge}</span>
                        )}
                        {assists.length > 0 && (
                          <span className="bs-gassists">
                            ({assists.map(a => `${a.first_name} ${a.last_name}`).join(', ')})
                          </span>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── SKATERS ── */}
          {(visitorPlayers.length > 0 || homePlayers.length > 0) && (
            <div className="bs-section">
              <div className="bs-section-title">Skaters</div>
              <SkaterTable players={visitorPlayers} label={visitorLabel} />
              <SkaterTable players={homePlayers}    label={homeLabel}    />
            </div>
          )}

          {/* ── GOALIES ── */}
          {(homeGoalies.length > 0 || visitorGoalies.length > 0) && (
            <div className="bs-section">
              <div className="bs-section-title">Goalies</div>
              <GoalieTable goalies={visitorGoalies} label={visitorLabel} />
              <GoalieTable goalies={homeGoalies}    label={homeLabel}    />
            </div>
          )}

        </>)}
      </div>
    </div>
  );
}
