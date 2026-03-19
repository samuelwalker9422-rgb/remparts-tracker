import { useState, useEffect } from 'react';

// ── Layout constants ─────────────────────────────────────────────────────────
const H   = 480;
const MH  =  82;   // matchup height: 32 top + 18 bar + 32 bot
const CW  =  24;
const FCW =  32;

// SVG centres — H/(2n), independent of MH
const C1 = [60, 180, 300, 420];
const C2 = [120, 360];
const CC = 240;

const LINE = '#3a3a3a';
const SW   = 2;
const L    = id => `https://assets.leaguestat.com/lhjmq/logos/${id}`;

// ── Teams ────────────────────────────────────────────────────────────────────
const EAST = [
  { seed:1, name:'Moncton Wildcats',        short:'Moncton',       logo:L('1.png')           },
  { seed:2, name:'Chicoutimi Saguenéens',   short:'Chicoutimi',    logo:L('10.png')          },
  { seed:3, name:'Newfoundland Regiment',   short:'Newfoundland',  logo:L('2_211.png')       },
  { seed:4, name:'Charlottetown Islanders', short:'Charlottetown', logo:L('7.png')           },
  { seed:5, name:'Québec Remparts',         short:'Québec',        logo:L('9.png')           },
  { seed:6, name:'Cape Breton Eagles',      short:'Cape Breton',   logo:L('3.jpg')           },
  { seed:7, name:'Halifax Mooseheads',      short:'Halifax',       logo:L('5_211.png')       },
  { seed:8, name:'Saint John Sea Dogs',     short:'Saint John',    logo:L('50x50/8_211.png') },
];

const WEST = [
  { seed:1, name:'Drummondville Voltigeurs', short:'Drummondville', logo:L('50x50/14.png') },
  { seed:2, name:'Rouyn-Noranda Huskies',   short:'Rouyn-Noranda', logo:L('50x50/11.png') },
  { seed:3, name:'Blainville-BB Armada',    short:'Blainville',    logo:L('19.png')        },
  { seed:4, name:'Shawinigan Cataractes',   short:'Shawinigan',    logo:L('13.png')        },
  { seed:5, name:'Sherbrooke Phoenix',      short:'Sherbrooke',    logo:L('50x50/60.png')  },
  { seed:6, name:"Val-d'Or Foreurs",        short:"Val-d'Or",      logo:L('15.png')        },
  { seed:7, name:'Victoriaville Tigres',    short:'Victoriaville', logo:L('17.png')        },
  { seed:8, name:'Gatineau Olympiques',     short:'Gatineau',      logo:L('50x50/12.png')  },
];

// ── Series helpers ────────────────────────────────────────────────────────────
// series[key] = array of [topScore, botScore] for each completed game
const INIT_SERIES = {
  eR1_0:[], eR1_1:[], eR1_2:[], eR1_3:[],
  eR2_0:[], eR2_1:[],
  eCF:  [],
  wR1_0:[], wR1_1:[], wR1_2:[], wR1_3:[],
  wR2_0:[], wR2_1:[],
  wCF:  [],
  final:[],
};

function computeWins(games) {
  return games.reduce(([tw, bw], [ts, bs]) =>
    ts > bs ? [tw+1, bw] : [tw, bw+1], [0, 0]);
}

function getWinner(matchup, games) {
  if (!matchup?.top || !matchup?.bot) return null;
  const [tw, bw] = computeWins(games);
  if (tw === 4) return matchup.top;
  if (bw === 4) return matchup.bot;
  return null;
}

function buildR1(seeds) {
  return [
    { top:seeds[0], bot:seeds[7] },
    { top:seeds[3], bot:seeds[4] },
    { top:seeds[1], bot:seeds[6] },
    { top:seeds[2], bot:seeds[5] },
  ];
}

// ── SVG connectors ────────────────────────────────────────────────────────────
const Spacer = () => <div style={{ height:30 }} />;

function EastR1toR2() {
  return (
    <div style={{ flexShrink:0 }}><Spacer />
      <svg width={CW} height={H} style={{ display:'block' }}>
        <line x1={0}  y1={C1[0]} x2={12} y2={C1[0]} stroke={LINE} strokeWidth={SW}/>
        <line x1={12} y1={C1[0]} x2={12} y2={C1[1]} stroke={LINE} strokeWidth={SW}/>
        <line x1={0}  y1={C1[1]} x2={12} y2={C1[1]} stroke={LINE} strokeWidth={SW}/>
        <line x1={12} y1={C2[0]} x2={CW} y2={C2[0]} stroke={LINE} strokeWidth={SW}/>
        <line x1={0}  y1={C1[2]} x2={12} y2={C1[2]} stroke={LINE} strokeWidth={SW}/>
        <line x1={12} y1={C1[2]} x2={12} y2={C1[3]} stroke={LINE} strokeWidth={SW}/>
        <line x1={0}  y1={C1[3]} x2={12} y2={C1[3]} stroke={LINE} strokeWidth={SW}/>
        <line x1={12} y1={C2[1]} x2={CW} y2={C2[1]} stroke={LINE} strokeWidth={SW}/>
      </svg>
    </div>
  );
}
function EastR2toCF() {
  return (
    <div style={{ flexShrink:0 }}><Spacer />
      <svg width={CW} height={H} style={{ display:'block' }}>
        <line x1={0}  y1={C2[0]} x2={12} y2={C2[0]} stroke={LINE} strokeWidth={SW}/>
        <line x1={12} y1={C2[0]} x2={12} y2={C2[1]} stroke={LINE} strokeWidth={SW}/>
        <line x1={0}  y1={C2[1]} x2={12} y2={C2[1]} stroke={LINE} strokeWidth={SW}/>
        <line x1={12} y1={CC}    x2={CW} y2={CC}    stroke={LINE} strokeWidth={SW}/>
      </svg>
    </div>
  );
}
function EastToFinal() {
  return (
    <div style={{ flexShrink:0 }}><Spacer />
      <svg width={FCW} height={H} style={{ display:'block' }}>
        <line x1={0} y1={CC} x2={FCW} y2={CC} stroke={LINE} strokeWidth={SW}/>
      </svg>
    </div>
  );
}
function WestCFtoR2() {
  return (
    <div style={{ flexShrink:0 }}><Spacer />
      <svg width={CW} height={H} style={{ display:'block' }}>
        <line x1={CW} y1={C2[0]} x2={12} y2={C2[0]} stroke={LINE} strokeWidth={SW}/>
        <line x1={12} y1={C2[0]} x2={12} y2={C2[1]} stroke={LINE} strokeWidth={SW}/>
        <line x1={CW} y1={C2[1]} x2={12} y2={C2[1]} stroke={LINE} strokeWidth={SW}/>
        <line x1={12} y1={CC}    x2={0}  y2={CC}    stroke={LINE} strokeWidth={SW}/>
      </svg>
    </div>
  );
}
function WestR2toR1() {
  return (
    <div style={{ flexShrink:0 }}><Spacer />
      <svg width={CW} height={H} style={{ display:'block' }}>
        <line x1={CW} y1={C1[0]} x2={12} y2={C1[0]} stroke={LINE} strokeWidth={SW}/>
        <line x1={12} y1={C1[0]} x2={12} y2={C1[1]} stroke={LINE} strokeWidth={SW}/>
        <line x1={CW} y1={C1[1]} x2={12} y2={C1[1]} stroke={LINE} strokeWidth={SW}/>
        <line x1={12} y1={C2[0]} x2={0}  y2={C2[0]} stroke={LINE} strokeWidth={SW}/>
        <line x1={CW} y1={C1[2]} x2={12} y2={C1[2]} stroke={LINE} strokeWidth={SW}/>
        <line x1={12} y1={C1[2]} x2={12} y2={C1[3]} stroke={LINE} strokeWidth={SW}/>
        <line x1={CW} y1={C1[3]} x2={12} y2={C1[3]} stroke={LINE} strokeWidth={SW}/>
        <line x1={12} y1={C2[1]} x2={0}  y2={C2[1]} stroke={LINE} strokeWidth={SW}/>
      </svg>
    </div>
  );
}
function FinalToWest() {
  return (
    <div style={{ flexShrink:0 }}><Spacer />
      <svg width={FCW} height={H} style={{ display:'block' }}>
        <line x1={0} y1={CC} x2={FCW} y2={CC} stroke={LINE} strokeWidth={SW}/>
      </svg>
    </div>
  );
}

// ── Score entry modal ─────────────────────────────────────────────────────────
function ScoreModal({ seriesKey, top, bot, games, onUpdate, onClose }) {
  const [rows, setRows] = useState(() =>
    Array(7).fill(null).map((_, i) =>
      games[i] ? [String(games[i][0]), String(games[i][1])] : ['', '']
    )
  );

  // Compute current series state from rows
  function getValid(r) {
    return r.reduce((acc, [ts, bs]) => {
      const t = parseInt(ts), b = parseInt(bs);
      if (!isNaN(t) && !isNaN(b) && t !== b) acc.push([t, b]);
      return acc;
    }, []);
  }

  const valid = getValid(rows);
  const [tw, bw] = computeWins(valid);
  const over = tw === 4 || bw === 4;

  // A game row is locked once the series is already decided before it
  function isLocked(i) {
    let t = 0, b = 0;
    for (let j = 0; j < i; j++) {
      const ts = parseInt(rows[j][0]), bs = parseInt(rows[j][1]);
      if (!isNaN(ts) && !isNaN(bs) && ts !== bs) {
        if (ts > bs) t++; else b++;
      }
    }
    return t === 4 || b === 4;
  }

  function updateRow(i, side, val) {
    const next = rows.map(r => [...r]);
    next[i][side] = val;
    setRows(next);
    onUpdate(seriesKey, getValid(next));
  }

  function clearAll() {
    const empty = Array(7).fill(null).map(() => ['', '']);
    setRows(empty);
    onUpdate(seriesKey, []);
  }

  const statusText = () => {
    if (over) return `${tw===4 ? top?.name : bot?.name} wins the series 4‑${Math.min(tw,bw)}`;
    if (tw === 0 && bw === 0) return 'Best of 7 — enter game scores below';
    if (tw === bw)  return `Series tied ${tw}–${bw}`;
    return `${tw > bw ? top?.short : bot?.short} leads ${Math.max(tw,bw)}–${Math.min(tw,bw)}`;
  };

  return (
    <div className="sm-overlay" onClick={onClose}>
      <div className="sm-modal" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="sm-header">
          <div className="sm-teams-row">
            <div className="sm-team-label">
              {top?.logo && <img src={top.logo} alt="" className="sm-logo" onError={e=>e.target.style.display='none'}/>}
              <span>{top?.name || 'TBD'}</span>
            </div>
            <span className="sm-vs-label">vs</span>
            <div className="sm-team-label sm-team-right">
              <span>{bot?.name || 'TBD'}</span>
              {bot?.logo && <img src={bot.logo} alt="" className="sm-logo" onError={e=>e.target.style.display='none'}/>}
            </div>
          </div>
          <button className="sm-close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Series status */}
        <div className={`sm-status ${over ? 'sm-status-over' : ''}`}>
          {statusText()}
        </div>

        {/* Game score rows */}
        <div className="sm-games">
          <div className="sm-games-head">
            <span>{top?.short || '—'}</span>
            <span></span>
            <span>{bot?.short || '—'}</span>
            <span>Winner</span>
          </div>

          {rows.map((row, i) => {
            const locked = isLocked(i);
            const ts = parseInt(row[0]), bs = parseInt(row[1]);
            const complete = !isNaN(ts) && !isNaN(bs) && ts !== bs;
            const topW = complete && ts > bs;
            const botW = complete && bs > ts;

            return (
              <div key={i} className={`sm-game-row${locked ? ' sm-row-locked' : ''}${complete ? ' sm-row-done' : ''}`}>
                <span className="sm-game-num">Game {i+1}</span>
                <input
                  className={`sm-input${topW ? ' sm-input-win' : ''}`}
                  type="number" min="0" max="20"
                  value={row[0]}
                  onChange={e => updateRow(i, 0, e.target.value)}
                  disabled={locked}
                  placeholder="—"
                />
                <span className="sm-dash">–</span>
                <input
                  className={`sm-input${botW ? ' sm-input-win' : ''}`}
                  type="number" min="0" max="20"
                  value={row[1]}
                  onChange={e => updateRow(i, 1, e.target.value)}
                  disabled={locked}
                  placeholder="—"
                />
                <span className={`sm-winner-label${topW ? ' sm-wl-top' : botW ? ' sm-wl-bot' : ''}`}>
                  {topW ? top?.short : botW ? bot?.short : ''}
                </span>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="sm-footer">
          <button className="sm-clear-btn" onClick={clearAll}>Clear all scores</button>
          <button className="sm-done-btn" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}

// ── Bracket team slot ─────────────────────────────────────────────────────────
function TeamSlot({ team, wins, isWinner, tbd }) {
  const isQC = team?.name === 'Québec Remparts';
  return (
    <div className={['bk-team', isWinner?'bk-winner':'', isQC?'bk-remparts':'', tbd?'bk-tbd':''].filter(Boolean).join(' ')}>
      {!tbd && team?.logo && (
        <img src={team.logo} alt="" className="bk-logo" onError={e=>{e.target.style.display='none'}}/>
      )}
      {!tbd && <span className="bk-seed">{team?.seed}</span>}
      <span className="bk-tname" title={team?.name}>{tbd ? 'TBD' : (team?.short || team?.name)}</span>
      {!tbd && <span className={`bk-wins${isWinner?' bk-wins-gold':''}`}>{wins}</span>}
    </div>
  );
}

// ── Series info bar ───────────────────────────────────────────────────────────
function SeriesBar({ games, top, bot, onClick }) {
  const [tw, bw] = computeWins(games);
  const over = tw===4 || bw===4;
  const started = games.length > 0;

  return (
    <div className="bk-series-bar" onClick={onClick} title="Click to enter game scores">
      <span className={over ? 'bk-bar-over' : !started ? 'bk-bar-pre' : tw===bw ? 'bk-bar-tied' : 'bk-bar-lead'}>
        {over
          ? `${tw===4 ? top?.short : bot?.short} wins 4‑${Math.min(tw,bw)}`
          : !started
          ? 'Click to enter scores'
          : tw===bw
          ? `Tied ${tw}–${bw}`
          : `${tw>bw ? top?.short : bot?.short} leads ${Math.max(tw,bw)}–${Math.min(tw,bw)}`}
      </span>
      <span className="bk-edit-icon">✏️</span>
    </div>
  );
}

// ── Matchup ───────────────────────────────────────────────────────────────────
function Matchup({ top, bot, seriesKey, series, onOpenModal }) {
  const tbd  = !top || !bot;
  const games = series[seriesKey] || [];
  const [tw, bw] = computeWins(games);

  return (
    <div
      className={`bk-matchup${!tbd ? ' bk-matchup-clickable' : ''}`}
      style={{ height: MH }}
      onClick={() => !tbd && onOpenModal(seriesKey)}
    >
      <TeamSlot team={top} wins={tw} isWinner={tw===4} tbd={!top} />
      <SeriesBar games={games} top={top} bot={bot} onClick={null} />
      <TeamSlot team={bot} wins={bw} isWinner={bw===4} tbd={!bot} />
    </div>
  );
}

// ── Round column ──────────────────────────────────────────────────────────────
function RoundCol({ label, matchups, series, onOpenModal }) {
  return (
    <div className="bk-round-col">
      <div className="bk-round-label">{label}</div>
      <div className="bk-round-body">
        {matchups.map((m, i) => (
          <Matchup key={i} top={m.top} bot={m.bot} seriesKey={m.key}
            series={series} onOpenModal={onOpenModal} />
        ))}
      </div>
    </div>
  );
}

// ── Final column ──────────────────────────────────────────────────────────────
function FinalCol({ matchup, series, onOpenModal }) {
  return (
    <div className="bk-final-col">
      <div className="bk-round-label bk-final-label">🏆 Gilles-Courteau</div>
      <div className="bk-round-body bk-final-body">
        <Matchup top={matchup.top} bot={matchup.bot} seriesKey="final"
          series={series} onOpenModal={onOpenModal} />
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Playoffs() {
  const [series, setSeries] = useState(() => {
    try {
      const saved = localStorage.getItem('qmjhl-series-2026');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Validate new format: every value must be [] or [[num,num], ...]
        // Old format was [0,0] (two numbers) — detect and discard it
        const isValid = Object.values(parsed).every(v =>
          Array.isArray(v) && (v.length === 0 || Array.isArray(v[0]))
        );
        if (isValid) return { ...INIT_SERIES, ...parsed };
      }
    } catch {}
    // Clear any stale / old-format data
    localStorage.removeItem('qmjhl-series-2026');
    return { ...INIT_SERIES };
  });

  const [modalKey, setModalKey] = useState(null);

  useEffect(() => {
    localStorage.setItem('qmjhl-series-2026', JSON.stringify(series));
  }, [series]);

  function updateGames(key, games) {
    setSeries(prev => ({ ...prev, [key]: games }));
  }
  function resetAll() {
    if (window.confirm('Reset all game scores in every series?')) {
      setSeries({ ...INIT_SERIES });
      localStorage.removeItem('qmjhl-series-2026');
    }
  }

  // ── Derive bracket ──────────────────────────────────────────────────
  const eR1 = buildR1(EAST).map((m,i) => ({ ...m, key:`eR1_${i}` }));
  const wR1 = buildR1(WEST).map((m,i) => ({ ...m, key:`wR1_${i}` }));

  const eR1W = eR1.map(m => getWinner(m, series[m.key]));
  const eR2  = [
    { top:eR1W[0], bot:eR1W[1], key:'eR2_0' },
    { top:eR1W[2], bot:eR1W[3], key:'eR2_1' },
  ];

  const wR1W = wR1.map(m => getWinner(m, series[m.key]));
  const wR2  = [
    { top:wR1W[0], bot:wR1W[1], key:'wR2_0' },
    { top:wR1W[2], bot:wR1W[3], key:'wR2_1' },
  ];

  const eR2W = eR2.map(m => getWinner(m, series[m.key]));
  const eCF  = [{ top:eR2W[0], bot:eR2W[1], key:'eCF' }];

  const wR2W = wR2.map(m => getWinner(m, series[m.key]));
  const wCF  = [{ top:wR2W[0], bot:wR2W[1], key:'wCF' }];

  const finalMatchup = {
    top: getWinner(eCF[0], series.eCF),
    bot: getWinner(wCF[0], series.wCF),
    key: 'final',
  };

  // Flatten all matchups for modal lookup
  const allM = [...eR1, ...eR2, ...eCF, ...wR1, ...wR2, ...wCF, finalMatchup]
    .reduce((acc, m) => { acc[m.key] = m; return acc; }, {});

  const activeModal = modalKey ? allM[modalKey] : null;
  const totalGames  = Object.values(series).reduce((n, g) => n + g.length, 0);

  return (
    <div className="page">
      <div className="espn-header" style={{ marginBottom:'0.5rem' }}>
        <div className="espn-header-bar" />
        <h2>Gilles-Courteau Trophy — QMJHL 2025–26</h2>
        {totalGames > 0 && (
          <button className="bk-reset-all" onClick={resetAll}>↺ Reset Bracket</button>
        )}
      </div>

      <p style={{ fontSize:'0.75rem', color:'var(--muted)', marginBottom:'1rem' }}>
        Standings as of March 18, 2026 —&nbsp;
        <strong style={{ color:'var(--text)' }}>2 games remaining</strong>.
        Click any matchup to enter game-by-game scores — results save automatically.
      </p>

      <div className="bk-conf-row">
        <div className="bk-conf-badge east"><span className="bk-conf-bar"/>Eastern Conference</div>
        <div className="bk-conf-badge center">QMJHL</div>
        <div className="bk-conf-badge west">Western Conference<span className="bk-conf-bar"/></div>
      </div>

      <div className="bk-scroll">
        <div className="bk-bracket">
          <RoundCol label="Round 1"     matchups={eR1} series={series} onOpenModal={setModalKey}/>
          <EastR1toR2/>
          <RoundCol label="Conf. Semis" matchups={eR2} series={series} onOpenModal={setModalKey}/>
          <EastR2toCF/>
          <RoundCol label="Conf. Final" matchups={eCF} series={series} onOpenModal={setModalKey}/>
          <EastToFinal/>
          <FinalCol matchup={finalMatchup} series={series} onOpenModal={setModalKey}/>
          <FinalToWest/>
          <RoundCol label="Conf. Final" matchups={wCF} series={series} onOpenModal={setModalKey}/>
          <WestCFtoR2/>
          <RoundCol label="Conf. Semis" matchups={wR2} series={series} onOpenModal={setModalKey}/>
          <WestR2toR1/>
          <RoundCol label="Round 1"     matchups={wR1} series={series} onOpenModal={setModalKey}/>
        </div>
      </div>

      <div className="bk-legend">
        <span><span className="bk-legend-dot" style={{background:'var(--red)'}}/>Québec Remparts — your team</span>
        <span><span className="bk-legend-dot" style={{background:'var(--green)'}}/>Series winner — auto-advances</span>
        <span style={{color:'var(--muted)',fontStyle:'italic'}}>Click any matchup to enter game scores</span>
      </div>

      {/* Score entry modal */}
      {modalKey && activeModal && (
        <ScoreModal
          seriesKey={modalKey}
          top={activeModal.top}
          bot={activeModal.bot}
          games={series[modalKey] || []}
          onUpdate={updateGames}
          onClose={() => setModalKey(null)}
        />
      )}
    </div>
  );
}
