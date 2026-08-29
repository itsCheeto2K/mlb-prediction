import React, { useState, useEffect } from 'react';
import { MLBTeam, MLBPlayer } from '../types/mlb';
import { fetchMLBTeams, fetchTeamRoster, fetchPlayerStats } from '../services/mlbApi';
import { Users, Search, RefreshCw, Filter, Shield, Target } from 'lucide-react';

export const PlayerStatsTab: React.FC = () => {
  const [teams, setTeams] = useState<MLBTeam[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [roster, setRoster] = useState<MLBPlayer[]>([]);
  const [playersWithStats, setPlayersWithStats] = useState<MLBPlayer[]>([]);
  const [statMode, setStatMode] = useState<'hitting' | 'pitching'>('hitting');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Load teams
  useEffect(() => {
    async function loadTeams() {
      const list = await fetchMLBTeams();
      setTeams(list);
      if (list.length > 0) {
        setSelectedTeamId(list[0].id);
      }
    }
    loadTeams();
  }, []);

  // Load roster and stats for selected team
  useEffect(() => {
    if (!selectedTeamId) return;

    async function loadRosterWithStats() {
      setIsLoading(true);
      const players = await fetchTeamRoster(selectedTeamId!);
      setRoster(players);

      // Fetch individual stats for all roster members
      const detailed = await Promise.all(
        players.map(async (p) => {
          const isPitcher = p.primaryPosition?.abbreviation === 'P' || p.primaryPosition?.type === 'Pitcher';
          const stats = await fetchPlayerStats(p.id, isPitcher);
          return { ...p, stats };
        })
      );

      setPlayersWithStats(detailed);
      setIsLoading(false);
    }

    loadRosterWithStats();
  }, [selectedTeamId]);

  const filteredPlayers = playersWithStats.filter((p) => {
    const isPitcher = p.primaryPosition?.abbreviation === 'P' || p.primaryPosition?.type === 'Pitcher';
    if (statMode === 'pitching' && !isPitcher) return false;
    if (statMode === 'hitting' && isPitcher) return false;

    if (searchQuery.trim()) {
      return p.fullName.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Controls */}
      <div className="bg-[#111B33] p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" />
            <span>MLB Player Statistics & Rosters</span>
          </h2>
          <p className="text-xs text-slate-400">Search and explore player metrics across all 30 MLB active rosters</p>
        </div>

        {/* Controls: Team Select, Hitting/Pitching Mode, Search */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Team Dropdown */}
          <select
            value={selectedTeamId || ''}
            onChange={(e) => setSelectedTeamId(Number(e.target.value))}
            className="bg-[#0B132B] text-slate-200 text-xs font-semibold rounded-lg px-3 py-2 border border-slate-700 focus:border-cyan-500 outline-none cursor-pointer"
          >
            {teams.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>

          {/* Mode Switcher */}
          <div className="flex bg-[#0B132B] p-1 rounded-lg border border-slate-700 text-xs">
            <button
              onClick={() => setStatMode('hitting')}
              className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                statMode === 'hitting'
                  ? 'bg-cyan-500 text-slate-900 font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Batters (Hitting)
            </button>
            <button
              onClick={() => setStatMode('pitching')}
              className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                statMode === 'pitching'
                  ? 'bg-amber-500 text-slate-900 font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Pitchers (Pitching)
            </button>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search player..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#0B132B] text-slate-200 text-xs rounded-lg pl-8 pr-3 py-2 border border-slate-700 focus:border-cyan-500 outline-none w-36 sm:w-48"
            />
          </div>
        </div>
      </div>

      {/* Players Table */}
      <div className="bg-[#111B33] rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
            <RefreshCw className="w-8 h-8 animate-spin text-cyan-400" />
            <span className="text-sm font-medium">Loading Roster & Stats...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono text-left">
              <thead className="bg-[#0B132B] text-slate-400 border-b border-slate-800">
                {statMode === 'hitting' ? (
                  <tr>
                    <th className="py-3.5 px-4 font-sans font-semibold text-slate-200">Player</th>
                    <th className="py-3.5 px-3 text-center">POS</th>
                    <th className="py-3.5 px-3 text-center">#</th>
                    <th className="py-3.5 px-3 text-center text-cyan-300 font-bold">AVG</th>
                    <th className="py-3.5 px-3 text-center">OBP</th>
                    <th className="py-3.5 px-3 text-center">SLG</th>
                    <th className="py-3.5 px-3 text-center text-emerald-400 font-bold">OPS</th>
                    <th className="py-3.5 px-3 text-center text-rose-400 font-bold">HR</th>
                    <th className="py-3.5 px-3 text-center">RBI</th>
                    <th className="py-3.5 px-3 text-center">H</th>
                    <th className="py-3.5 px-3 text-center">2B</th>
                    <th className="py-3.5 px-3 text-center">BB</th>
                    <th className="py-3.5 px-3 text-center">SO</th>
                    <th className="py-3.5 px-4 text-center">SB</th>
                  </tr>
                ) : (
                  <tr>
                    <th className="py-3.5 px-4 font-sans font-semibold text-slate-200">Player</th>
                    <th className="py-3.5 px-3 text-center">POS</th>
                    <th className="py-3.5 px-3 text-center">#</th>
                    <th className="py-3.5 px-3 text-center text-amber-300 font-bold">ERA</th>
                    <th className="py-3.5 px-3 text-center text-cyan-300 font-bold">WHIP</th>
                    <th className="py-3.5 px-3 text-center">W-L</th>
                    <th className="py-3.5 px-3 text-center text-emerald-400 font-bold">K/9</th>
                    <th className="py-3.5 px-3 text-center">BB/9</th>
                    <th className="py-3.5 px-3 text-center">HR/9</th>
                    <th className="py-3.5 px-3 text-center">IP</th>
                    <th className="py-3.5 px-3 text-center">SO</th>
                    <th className="py-3.5 px-4 text-center">SV</th>
                  </tr>
                )}
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredPlayers.length === 0 ? (
                  <tr>
                    <td colSpan={14} className="py-12 text-center text-slate-500">
                      No players found matching your search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredPlayers.map((p) => {
                    const st = p.stats;
                    return (
                      <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-sans font-bold text-white flex items-center gap-2">
                          <span>{p.fullName}</span>
                        </td>
                        <td className="py-3 px-3 text-center text-slate-400">
                          {p.primaryPosition?.abbreviation || 'OF'}
                        </td>
                        <td className="py-3 px-3 text-center text-slate-500">
                          {p.primaryNumber || '-'}
                        </td>
                        {statMode === 'hitting' ? (
                          <>
                            <td className="py-3 px-3 text-center font-bold text-cyan-300">{st?.avg || '.000'}</td>
                            <td className="py-3 px-3 text-center text-slate-300">{st?.obp || '.000'}</td>
                            <td className="py-3 px-3 text-center text-slate-300">{st?.slg || '.000'}</td>
                            <td className="py-3 px-3 text-center font-bold text-emerald-400">{st?.ops || '.000'}</td>
                            <td className="py-3 px-3 text-center font-bold text-rose-400">{st?.homeRuns || 0}</td>
                            <td className="py-3 px-3 text-center text-slate-200">{st?.rbi || 0}</td>
                            <td className="py-3 px-3 text-center text-slate-200">{st?.hits || 0}</td>
                            <td className="py-3 px-3 text-center text-slate-400">{st?.doubles || 0}</td>
                            <td className="py-3 px-3 text-center text-slate-400">{st?.baseOnBalls || 0}</td>
                            <td className="py-3 px-3 text-center text-slate-400">{st?.strikeOuts || 0}</td>
                            <td className="py-3 px-4 text-center text-slate-300">{st?.stolenBases || 0}</td>
                          </>
                        ) : (
                          <>
                            <td className="py-3 px-3 text-center font-bold text-amber-300">{st?.era || '0.00'}</td>
                            <td className="py-3 px-3 text-center font-bold text-cyan-300">{st?.whip || '0.00'}</td>
                            <td className="py-3 px-3 text-center text-slate-200">{st?.wins || 0}-{st?.losses || 0}</td>
                            <td className="py-3 px-3 text-center font-bold text-emerald-400">{st?.strikeoutsPer9Inn || '0.0'}</td>
                            <td className="py-3 px-3 text-center text-slate-300">{st?.walksPer9Inn || '0.0'}</td>
                            <td className="py-3 px-3 text-center text-slate-400">{st?.homeRunsPer9 || '0.0'}</td>
                            <td className="py-3 px-3 text-center text-slate-200">{st?.inningsPitched || '0.0'}</td>
                            <td className="py-3 px-3 text-center font-bold text-slate-100">{st?.strikeOuts || 0}</td>
                            <td className="py-3 px-4 text-center text-cyan-400">{st?.saves || 0}</td>
                          </>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
