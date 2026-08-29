import React, { useState, useEffect } from 'react';
import { TeamStanding } from '../types/mlb';
import { fetchMLBStandings } from '../services/mlbApi';
import { BarChart3, TrendingUp, Award, Shield, RefreshCw } from 'lucide-react';

export const TeamStatsTab: React.FC = () => {
  const [standings, setStandings] = useState<TeamStanding[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLeague, setSelectedLeague] = useState<string>('ALL');
  const [selectedDivision, setSelectedDivision] = useState<string>('ALL');

  useEffect(() => {
    async function loadStandings() {
      setIsLoading(true);
      const data = await fetchMLBStandings();
      setStandings(data);
      setIsLoading(false);
    }
    loadStandings();
  }, []);

  const filteredStandings = standings.filter((s) => {
    if (selectedLeague !== 'ALL' && s.team.league?.name !== selectedLeague) return false;
    if (selectedDivision !== 'ALL' && s.team.division?.name !== selectedDivision) return false;
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-[#111B33] p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
            <span>MLB Team Standings & Sabermetric Performance</span>
          </h2>
          <p className="text-xs text-slate-400">Real-time team records, run differentials, and division races</p>
        </div>

        {/* Filter buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {['ALL', 'American League', 'National League'].map((league) => (
            <button
              key={league}
              onClick={() => setSelectedLeague(league)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedLeague === league
                  ? 'bg-cyan-500 text-slate-900 font-bold shadow-md shadow-cyan-500/20'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {league === 'ALL' ? 'All Leagues' : league}
            </button>
          ))}
        </div>
      </div>

      {/* Standings Table */}
      <div className="bg-[#111B33] rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
            <RefreshCw className="w-8 h-8 animate-spin text-cyan-400" />
            <span className="text-sm font-medium">Loading MLB Standings...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono text-left">
              <thead className="bg-[#0B132B] text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">#</th>
                  <th className="py-3.5 px-4 font-sans font-semibold text-slate-200">Team</th>
                  <th className="py-3.5 px-3 text-center">Division</th>
                  <th className="py-3.5 px-3 text-center">W</th>
                  <th className="py-3.5 px-3 text-center">L</th>
                  <th className="py-3.5 px-3 text-center text-cyan-300 font-bold">PCT</th>
                  <th className="py-3.5 px-3 text-center">GB</th>
                  <th className="py-3.5 px-3 text-center">RS</th>
                  <th className="py-3.5 px-3 text-center">RA</th>
                  <th className="py-3.5 px-3 text-center text-emerald-400 font-bold">DIFF</th>
                  <th className="py-3.5 px-3 text-center">HOME</th>
                  <th className="py-3.5 px-3 text-center">AWAY</th>
                  <th className="py-3.5 px-3 text-center">L10</th>
                  <th className="py-3.5 px-4 text-center">STRK</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredStandings.map((s, idx) => (
                  <tr key={s.team.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 text-slate-500 font-bold">{idx + 1}</td>
                    <td className="py-3 px-4 font-sans font-bold text-white flex items-center gap-2">
                      <span>{s.team.name}</span>
                      <span className="text-slate-500 font-mono text-[10px]">({s.team.abbreviation})</span>
                    </td>
                    <td className="py-3 px-3 text-center text-slate-400 font-sans">{s.team.division?.name}</td>
                    <td className="py-3 px-3 text-center font-bold text-slate-100">{s.wins}</td>
                    <td className="py-3 px-3 text-center text-slate-300">{s.losses}</td>
                    <td className="py-3 px-3 text-center font-bold text-cyan-400">{s.pct}</td>
                    <td className="py-3 px-3 text-center text-slate-400">{s.gamesBack}</td>
                    <td className="py-3 px-3 text-center text-slate-200">{s.runsScored}</td>
                    <td className="py-3 px-3 text-center text-slate-300">{s.runsAllowed}</td>
                    <td className="py-3 px-3 text-center font-bold">
                      <span className={s.runDifferential >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        {s.runDifferential > 0 ? `+${s.runDifferential}` : s.runDifferential}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center text-slate-400">{s.homeRecord}</td>
                    <td className="py-3 px-3 text-center text-slate-400">{s.awayRecord}</td>
                    <td className="py-3 px-3 text-center text-slate-300">{s.lastTen}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        s.streak.startsWith('W')
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'bg-rose-950 text-rose-300 border border-rose-800'
                      }`}>
                        {s.streak}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
