import { useState } from 'react';
import PlayerProfile from './PlayerProfile';

const COLS = [
  { key: 'num',  label: '#',      numeric: true  },
  { key: 'name', label: 'Player', numeric: false },
  { key: 'pos',  label: 'Pos',   numeric: false },
  { key: 'gp',   label: 'GP',    numeric: true  },
  { key: 'g',    label: 'G',     numeric: true  },
  { key: 'a',    label: 'A',     numeric: true  },
  { key: 'pts',  label: 'PTS',   numeric: true  },
];

function SortTh({ col, sortKey, dir, onSort }) {
  const active = sortKey === col.key;
  return (
    <th
      className={`${active ? 'sorted' : ''} ${col.key === 'name' ? 'left' : ''}`}
      onClick={() => onSort(col.key)}
    >
      {col.label}
      <span className="sort-arrow">{active ? (dir === 'desc' ? '▼' : '▲') : '⇅'}</span>
    </th>
  );
}

export default function Players({ teamData }) {
  const { team, skaters } = teamData;
  const [sortKey, setSortKey]     = useState('pts');
  const [dir, setDir]             = useState('desc');
  const [posFilter, setPosFilter] = useState('ALL');
  const [view, setView]           = useState('cards');
  const [selectedNum, setSelectedNum] = useState(null);

  if (selectedNum !== null) {
    return <PlayerProfile num={selectedNum} onBack={() => setSelectedNum(null)} teamData={teamData} />;
  }

  function handleSort(key) {
    if (sortKey === key) setDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortKey(key); setDir('desc'); }
  }

  const filtered = posFilter === 'ALL' ? skaters : skaters.filter(p => p.pos === posFilter);
  const sorted = [...filtered].sort((a, b) => {
    const av = a[sortKey], bv = b[sortKey];
    if (typeof av === 'string') return dir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    return dir === 'asc' ? av - bv : bv - av;
  });

  const posLabel = { ALL: 'All Players', F: 'Forwards', D: 'Defence' };

  return (
    <div className="page">
      <div className="espn-header">
        <div className="espn-header-bar" />
        <h2>Roster</h2>
        <span className="subtitle">{team.fullName}</span>
      </div>

      <div className="filter-tabs">
        {['ALL', 'F', 'D'].map(p => (
          <button key={p} className={`filter-tab${posFilter === p ? ' active' : ''}`} onClick={() => setPosFilter(p)}>
            {posLabel[p]}
          </button>
        ))}
        <div className="view-toggle">
          <button className={`view-btn${view === 'cards' ? ' active' : ''}`} onClick={() => setView('cards')}>⊞ Cards</button>
          <button className={`view-btn${view === 'table' ? ' active' : ''}`} onClick={() => setView('table')}>☰ Table</button>
        </div>
      </div>

      {view === 'cards' ? (
        <div className="player-grid">
          {sorted.map(p => (
            <div className="player-card" key={p.num} onClick={() => setSelectedNum(p.num)}>
              {p.photo ? (
                <img className="player-card-photo" src={p.photo} alt={p.name}
                  onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
              ) : null}
              <div className="player-card-photo-placeholder" style={{ display: p.photo ? 'none' : 'flex' }}>
                #{p.num}
              </div>
              <div className="player-card-body">
                <div className="player-card-num">#{p.num}</div>
                <div className="player-card-name">{p.name}</div>
                <div className="player-card-pos">{p.pos === 'F' ? 'Forward' : 'Defence'}</div>
                <div className="player-card-pts"><span>{p.pts}</span> PTS &nbsp; {p.g}G {p.a}A</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="table-wrap">
          <div className="table-title">Skaters — click column to sort · click name to view profile</div>
          <table>
            <thead>
              <tr>{COLS.map(col => <SortTh key={col.key} col={col} sortKey={sortKey} dir={dir} onSort={handleSort} />)}</tr>
            </thead>
            <tbody>
              {sorted.map(p => (
                <tr key={p.num} onClick={() => setSelectedNum(p.num)} style={{ cursor: 'pointer' }}>
                  <td>{p.num}</td>
                  <td className="left name-cell" style={{ color: 'var(--red)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    {p.photo && <img src={p.photo} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', objectPosition: 'top', background: '#222', flexShrink: 0 }} onError={e => { e.target.style.display = 'none'; }} />}
                    {p.name}
                  </td>
                  <td className="left" style={{ color: 'var(--muted)' }}>{p.pos}</td>
                  <td>{p.gp}</td><td>{p.g}</td><td>{p.a}</td>
                  <td className="pts-cell">{p.pts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
