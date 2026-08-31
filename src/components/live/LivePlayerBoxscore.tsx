import React, { useState } from 'react';
import { LiveGameFeed, LiveGameSummary, LiveBoxscorePlayer } from '../../types/liveGame';
import { Users, Shield, User, Flame, CircleDot, ChevronRight } from 'lucide-react';

interface LivePlayerBoxscoreProps {
  game: LiveGameSummary;
  liveFeed?: LiveGameFeed | null;
}

export const LivePlayerBoxscore: React.FC<LivePlayerBoxscoreProps> = ({
  game,
  liveFeed
}) => {
  const [selectedTeam, setSelectedTeam] = useState<'away' | 'home'>('away');

  const awayTeam = game.teams.away;
  const homeTeam = game.teams.home;

  const boxscore = liveFeed?.liveData?.boxscore;
  const awayBox = boxscore?.teams?.away;
  const homeBox = boxscore?.teams?.home;

  const currentBoxTeam = selectedTeam === 'away' ? awayBox : homeBox;
  const currentTeamInfo = selectedTeam === 'away' ? awayTeam : homeTeam;

  const linescore = liveFeed?.liveData?.linescore || game.linescore;
  const currentBatter = linescore?.offense?.batter;
  const currentPitcher = linescore?.defense?.pitcher;
  const runner1st = linescore?.offense?.first;
  const runner2nd = linescore?.offense?.second;
  const runner3rd = linescore?.offense?.third;

  // Extract batters in order
  const battersList: LiveBoxscorePlayer[] = [];
  if (currentBoxTeam?.players) {
    if (currentBoxTeam.batters && currentBoxTeam.batters.length > 0) {
      currentBoxTeam.batters.forEach((id) => {
        const p = currentBoxTeam.players?.[`ID${id}`];
        if (p) battersList.push(p);
      });
    } else {
      // Fallback if batters array is empty
      Object.values(currentBoxTeam.players).forEach((p) => {
        if (p.position?.abbreviation !== 'P' && p.stats?.batting) {
          battersList.push(p);
        }
      });
    }
  }

  // Extract pitchers
  const pitchersList: LiveBoxscorePlayer[] = [];
  if (currentBoxTeam?.players) {
    if (currentBoxTeam.pitchers && currentBoxTeam.pitchers.length > 0) {
      currentBoxTeam.pitchers.forEach((id) => {
        const p = currentBoxTeam.players?.[`ID${id}`];
        if (p) pitchersList.push(p);
      });
    } else {
      Object.values(currentBoxTeam.players).forEach((p) => {
        if (p.position?.abbreviation === 'P' || p.stats?.pitching) {
          pitchersList.push(p);
        }
      });
    }
  }

  // Extract bench/bullpen players
  const benchList: LiveBoxscorePlayer[] = [];
  if (currentBoxTeam?.bench && currentBoxTeam.players) {
    currentBoxTeam.bench.forEach((id) => {
      const p = currentBoxTeam.players?.[`ID${id}`];
      if (p) benchList.push(p);
    });
  }

  const getPlayerLiveStatus = (player: LiveBoxscorePlayer) => {
    if (currentBatter && currentBatter.id === player.person.id) {
      return (
        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-bold font-mono animate-pulse">
          <Flame className="w-2.5 h-2.5 text-amber-400" />
          AT BAT
        </span>
      );
    }
    if (runner1st && runner1st.id === player.person.id) {
      return (
        <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px] font-bold font-mono">
          ON 1B
        </span>
      );
    }
    if (runner2nd && runner2nd.id === player.person.id) {
      return (
        <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px] font-bold font-mono">
          ON 2B
        </span>
      );
    }
    if (runner3rd && runner3rd.id === player.person.id) {
      return (
        <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px] font-bold font-mono">
          ON 3B
        </span>
      );
    }
    return null;
  };

  const getPitcherLiveStatus = (player: LiveBoxscorePlayer) => {
    if (currentPitcher && currentPitcher.id === player.person.id) {
      return (
        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[9px] font-bold font-mono animate-pulse">
          <Shield className="w-2.5 h-2.5 text-cyan-400" />
          ON MOUND
        </span>
      );
    }
    return null;
  };

  return (
    <div className="bg-[#0B132B] border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl">
      {/* Header with Team Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-cyan-400" />
          <h3 className="text-sm font-bold tracking-wide uppercase text-slate-200">
            Live Player Boxscore & Lineups
          </h3>
        </div>

        {/* Team Selector Toggle */}
        <div className="flex items-center gap-1 bg-[#080E1E] p-1 rounded-xl border border-slate-800 text-xs font-mono">
          <button
            onClick={() => setSelectedTeam('away')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              selectedTeam === 'away'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {awayTeam.abbreviation} ({awayTeam.name})
          </button>
          <button
            onClick={() => setSelectedTeam('home')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              selectedTeam === 'home'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {homeTeam.abbreviation} ({homeTeam.name})
          </button>
        </div>
      </div>

      {/* Batting Lineup Table */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-400 px-1">
          <div className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-200 uppercase">{currentTeamInfo.name} — Batting Lineup</span>
          </div>
          <span className="text-[11px] text-slate-500">Live Game Stats</span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800/80 bg-[#080E1E]/80">
          <table className="w-full text-xs font-mono text-center border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 bg-[#0B132B]/60 text-[11px]">
                <th className="py-2 px-2 text-left w-6 font-semibold">#</th>
                <th className="py-2 px-3 text-left font-semibold">BATTER</th>
                <th className="py-2 px-2 font-semibold">POS</th>
                <th className="py-2 px-2 font-semibold">AB</th>
                <th className="py-2 px-2 font-semibold">R</th>
                <th className="py-2 px-2 font-semibold">H</th>
                <th className="py-2 px-2 font-semibold">RBI</th>
                <th className="py-2 px-2 font-semibold">BB</th>
                <th className="py-2 px-2 font-semibold">SO</th>
                <th className="py-2 px-2 font-semibold">HR</th>
                <th className="py-2 px-2 text-slate-400 font-semibold hidden md:table-cell">AVG</th>
                <th className="py-2 px-2 text-slate-400 font-semibold hidden md:table-cell">OPS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {battersList.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-6 text-center text-slate-500 text-xs">
                    Roster data loading or not yet submitted for this match.
                  </td>
                </tr>
              ) : (
                battersList.map((player, idx) => {
                  const bStats = player.stats?.batting || {};
                  const sStats = player.seasonStats?.batting || {};
                  const liveStatus = getPlayerLiveStatus(player);
                  const isCurrent = currentBatter?.id === player.person.id;

                  return (
                    <tr
                      key={player.person.id || idx}
                      className={`hover:bg-slate-800/30 transition-colors ${
                        isCurrent ? 'bg-amber-500/10' : ''
                      }`}
                    >
                      <td className="py-2 px-2 text-left text-slate-500 font-bold text-[11px]">
                        {idx + 1}
                      </td>
                      <td className="py-2 px-3 text-left">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[9px] font-bold text-slate-300 shrink-0">
                            {player.jerseyNumber || '#'}
                          </div>
                          <span className={`font-bold truncate max-w-[130px] sm:max-w-[180px] ${
                            isCurrent ? 'text-amber-300' : 'text-slate-200'
                          }`}>
                            {player.person.fullName}
                          </span>
                          {liveStatus}
                        </div>
                      </td>
                      <td className="py-2 px-2 text-slate-400 font-bold">
                        {player.position?.abbreviation || 'DH'}
                      </td>
                      <td className="py-2 px-2 text-slate-300">{bStats.atBats ?? 0}</td>
                      <td className="py-2 px-2 text-slate-300">{bStats.runs ?? 0}</td>
                      <td className="py-2 px-2 font-bold text-cyan-300">{bStats.hits ?? 0}</td>
                      <td className="py-2 px-2 font-bold text-emerald-400">{bStats.rbi ?? 0}</td>
                      <td className="py-2 px-2 text-slate-300">{bStats.baseOnBalls ?? 0}</td>
                      <td className="py-2 px-2 text-slate-400">{bStats.strikeOuts ?? 0}</td>
                      <td className="py-2 px-2 font-bold text-amber-400">{bStats.homeRuns ?? 0}</td>
                      <td className="py-2 px-2 text-slate-400 hidden md:table-cell">{sStats.avg || '.250'}</td>
                      <td className="py-2 px-2 text-slate-400 hidden md:table-cell">{sStats.ops || '.750'}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pitching Staff Table */}
      <div className="space-y-2 pt-2">
        <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-400 px-1">
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-200 uppercase">{currentTeamInfo.name} — Pitching Staff</span>
          </div>
          <span className="text-[11px] text-slate-500">Pitches & Outs Recorded</span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800/80 bg-[#080E1E]/80">
          <table className="w-full text-xs font-mono text-center border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 bg-[#0B132B]/60 text-[11px]">
                <th className="py-2 px-3 text-left font-semibold">PITCHER</th>
                <th className="py-2 px-2 font-semibold">IP</th>
                <th className="py-2 px-2 font-semibold">H</th>
                <th className="py-2 px-2 font-semibold">R</th>
                <th className="py-2 px-2 font-semibold">ER</th>
                <th className="py-2 px-2 font-semibold">BB</th>
                <th className="py-2 px-2 font-semibold">SO</th>
                <th className="py-2 px-2 font-semibold">HR</th>
                <th className="py-2 px-2 font-semibold">P-S</th>
                <th className="py-2 px-2 font-semibold">ERA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {pitchersList.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-6 text-center text-slate-500 text-xs">
                    Starting Pitcher awaiting start.
                  </td>
                </tr>
              ) : (
                pitchersList.map((pitcher, idx) => {
                  const pStats = pitcher.stats?.pitching || {};
                  const sStats = pitcher.seasonStats?.pitching || {};
                  const liveStatus = getPitcherLiveStatus(pitcher);
                  const isCurrent = currentPitcher?.id === pitcher.person.id;

                  return (
                    <tr
                      key={pitcher.person.id || idx}
                      className={`hover:bg-slate-800/30 transition-colors ${
                        isCurrent ? 'bg-cyan-500/10' : ''
                      }`}
                    >
                      <td className="py-2 px-3 text-left">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[9px] font-bold text-slate-300 shrink-0">
                            {pitcher.jerseyNumber || '#'}
                          </div>
                          <span className={`font-bold truncate max-w-[130px] sm:max-w-[180px] ${
                            isCurrent ? 'text-cyan-300' : 'text-slate-200'
                          }`}>
                            {pitcher.person.fullName}
                          </span>
                          {liveStatus}
                        </div>
                      </td>
                      <td className="py-2 px-2 font-bold text-white">{pStats.inningsPitched || '0.0'}</td>
                      <td className="py-2 px-2 text-slate-300">{pStats.hits ?? 0}</td>
                      <td className="py-2 px-2 text-slate-300">{pStats.runs ?? 0}</td>
                      <td className="py-2 px-2 font-bold text-amber-400">{pStats.earnedRuns ?? 0}</td>
                      <td className="py-2 px-2 text-slate-300">{pStats.baseOnBalls ?? 0}</td>
                      <td className="py-2 px-2 font-bold text-emerald-400">{pStats.strikeOuts ?? 0}</td>
                      <td className="py-2 px-2 text-slate-300">{pStats.homeRuns ?? 0}</td>
                      <td className="py-2 px-2 text-cyan-300">
                        {pStats.pitchesThrown || 0}-{pStats.strikes || 0}
                      </td>
                      <td className="py-2 px-2 text-slate-400">{pStats.era || sStats.era || '3.80'}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bench / Available Bullpen */}
      {benchList.length > 0 && (
        <div className="pt-2">
          <div className="text-[11px] font-mono text-slate-400 mb-1 flex items-center gap-1">
            <CircleDot className="w-3 h-3 text-cyan-400" />
            <span>Bench & Available Substitutes:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {benchList.map((p) => (
              <span
                key={p.person.id}
                className="px-2 py-0.5 rounded bg-[#080E1E] border border-slate-800 text-[10px] font-mono text-slate-300"
              >
                {p.jerseyNumber && `#${p.jerseyNumber} `}{p.person.fullName} ({p.position?.abbreviation || 'UTIL'})
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
