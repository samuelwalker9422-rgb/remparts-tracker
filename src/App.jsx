import { useState, useEffect } from 'react';
import './App.css';
import Dashboard from './pages/Dashboard';
import Schedule from './pages/Schedule';
import Players from './pages/Players';
import Stats from './pages/Stats';
import Standings from './pages/Standings';
import Playoffs from './pages/Playoffs';
import { team, skaters, goalies, schedule, gameLog, playoffSchedule, playoffGameLog } from './data';

const PAGES = [
  { key: 'Dashboard', label: 'Home' },
  { key: 'Schedule',  label: 'Schedule' },
  { key: 'Players',   label: 'Roster' },
  { key: 'Stats',     label: 'Stats' },
  { key: 'Standings', label: 'Standings' },
  { key: 'Playoffs',  label: '🏆 Playoffs' },
];

const teamData = { team, skaters, goalies, schedule, gameLog, playoffSchedule, playoffGameLog };


export default function App() {
  const [page, setPage]         = useState('Dashboard');
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem('theme') !== 'light'
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const renderPage = () => {
    switch (page) {
      case 'Dashboard':  return <Dashboard onNav={setPage} teamData={teamData} />;
      case 'Schedule':   return <Schedule teamData={teamData} />;
      case 'Players':    return <Players teamData={teamData} />;
      case 'Stats':      return <Stats teamData={teamData} />;
      case 'Standings':  return <Standings teamData={teamData} />;
      case 'Playoffs':   return <Playoffs />;
      default:           return <Dashboard onNav={setPage} teamData={teamData} />;
    }
  };

  return (
    <>
      <nav className="espn-nav">
        <div className="espn-logo" onClick={() => setPage('Dashboard')}>
          REMPARTS<span>Québec · LHJMQ</span>
        </div>
        {PAGES.map(p => (
          <button
            key={p.key}
            className={`nav-btn${page === p.key ? ' active' : ''}`}
            onClick={() => setPage(p.key)}
          >
            <span>{p.label}</span>
          </button>
        ))}
        <div className="nav-spacer" />
        <button
          className="theme-toggle"
          onClick={() => setDarkMode(d => !d)}
          title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {darkMode ? '☀️' : '🌙'}
        </button>
      </nav>
      {renderPage()}
    </>
  );
}
