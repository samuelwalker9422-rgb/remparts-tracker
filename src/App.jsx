import { useState, useEffect } from 'react';
import './App.css';
import Dashboard from './pages/Dashboard';
import Schedule from './pages/Schedule';
import Players from './pages/Players';
import Stats from './pages/Stats';
import Standings from './pages/Standings';
import Playoffs from './pages/Playoffs';
import GameRecap from './pages/GameRecap';
import Fantasy from './pages/Fantasy';
import LeagueHub  from './pages/fantasy/LeagueHub';
import DraftRoom  from './pages/fantasy/DraftRoom';
import MyTeam     from './pages/fantasy/MyTeam';
import { useRosterStats } from './hooks/useRosterStats';
import { team, skaters as staticSkaters, goalies, schedule, gameLog, goalieLog, playoffSchedule, playoffGameLog } from './data';

const PAGES = [
  { key: 'Dashboard', label: 'Home' },
  { key: 'Schedule',  label: 'Schedule' },
  { key: 'Players',   label: 'Roster' },
  { key: 'Stats',     label: 'Stats' },
  { key: 'Standings', label: 'Standings' },
  { key: 'Playoffs',  label: '🏆 Playoffs' },
  { key: 'Fantasy',       label: '🏒 Fantasy'   },
  { key: 'FantasyTonight', label: '🎯 Tonight'  },
];

export default function App() {
  const [page, setPage]         = useState('Dashboard');
  const [gameDate, setGameDate] = useState(null);
  const [leagueCtx, setLeagueCtx] = useState(null);  // { leagueId, leagueTeamId, leagueName }
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem('theme') !== 'light'
  );

  // Live player stats – falls back to static data.js while loading or on error
  const { skaters: liveSkaters, leagueSkaters } = useRosterStats();
  const skaters = liveSkaters.length > 0 ? liveSkaters : staticSkaters;

  const teamData = { team, skaters, goalies, leagueSkaters, schedule, gameLog, goalieLog, playoffSchedule, playoffGameLog };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const renderPage = () => {
    switch (page) {
      case 'Dashboard':  return <Dashboard onNav={setPage} teamData={teamData} />;
      case 'Schedule':   return <Schedule teamData={teamData} onGameRecap={date => { setGameDate(date); setPage('GameRecap'); }} />;
      case 'Players':    return <Players teamData={teamData} />;
      case 'Stats':      return <Stats teamData={teamData} />;
      case 'Standings':  return <Standings teamData={teamData} />;
      case 'Playoffs':   return <Playoffs />;
      case 'GameRecap':  return <GameRecap gameDate={gameDate} onBack={() => setPage('Schedule')} teamData={teamData} />;
      case 'Fantasy':
        return <LeagueHub
          onEnterLeague={ctx => {
            setLeagueCtx(ctx);
            const dest = (ctx.leagueStatus === 'active' || ctx.leagueStatus === 'complete')
              ? 'MyTeam' : 'DraftRoom';
            setPage(dest);
          }}
          onTonightPickup={() => setPage('FantasyTonight')}
        />;
      case 'DraftRoom':
        return <DraftRoom
          leagueCtx={leagueCtx}
          onBack={() => setPage('Fantasy')}
          onMyTeam={() => setPage('MyTeam')}
        />;
      case 'MyTeam':
        return <MyTeam
          leagueCtx={leagueCtx}
          onBack={() => setPage('Fantasy')}
        />;
      case 'FantasyTonight': return <Fantasy teamData={teamData} />;
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
