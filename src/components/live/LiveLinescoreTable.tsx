import React from 'react';
import { LiveGameSummary } from '../../types/liveGame';
import { Table } from 'lucide-react';

interface LiveLinescoreTableProps {
  game: LiveGameSummary;
}

export const LiveLinescoreTable: React.FC<LiveLinescoreTableProps> = ({ game }) => {
  const linescore = game.linescore;
  const rawInnings = linescore?.innings || [];
  
  // Calculate total innings to render (at least 9)
  const maxInningNumber = Math.max(9, rawInnings.length, linescore?.currentInning || 9);
  const inningCols = Array.from({ length: maxInningNumber }, (_, i) => i + 1);

  const awayTeam = game.teams.away;
  const homeTeam = game.teams.home;

  const awayTotals = linescore?.teams?.away || {
    runs: awayTeam.score ?? 0,
    hits: 0,
    errors: 0,
    leftOnBase: 0
  };
  const homeTotals = linescore?.teams?.home || {
    runs: homeTeam.score ?? 0,
    hits: 0,
    errors: 0,
    leftOnBase: 0
  };

  const currentInning = linescore?.currentInning;
  const isLive = game.status.isLive;

  return (
    <div className="bg-[#0B132B]/90 border border-slate-800 rounded-xl p-4 overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Table className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-bold tracking-wide uppercase text-slate-200">
            Linescore (Inning by Inning)
          </h3>
        </div>
        {currentInning && isLive && (
          <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/60 border border-cyan-700/40 px-2 py-0.5 rounded">
            Inning {currentInning} Active
          </span>
        )}
      </div>

      <div className="overflow-x-auto pb-1">
        <table className="w-full text-xs font-mono text-center border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 bg-[#080E1E]/60">
              <th className="text-left py-2 px-3 font-semibold w-24">TEAM</th>
              {inningCols.map((num) => {
                const isCurrent = isLive && currentInning === num;
                return (
                  <th
                    key={num}
                    className={`py-2 px-2.5 font-semibold ${
                      isCurrent ? 'bg-cyan-500/20 text-cyan-300 font-bold border-x border-cyan-500/30' : ''
                    }`}
                  >
                    {num}
                  </th>
                );
              })}
              <th className="py-2 px-3 font-bold text-white bg-slate-800/40 border-l border-slate-800">R</th>
              <th className="py-2 px-3 font-bold text-slate-300">H</th>
              <th className="py-2 px-3 font-bold text-slate-300">E</th>
              <th className="py-2 px-3 font-bold text-slate-400">LOB</th>
            </tr>
          </thead>
          <tbody>
            {/* Away Team Row */}
            <tr className="border-b border-slate-800/60 hover:bg-slate-800/20 transition-colors">
              <td className="text-left py-2.5 px-3 font-bold text-slate-200">
                <div className="flex items-center gap-1.5">
                  <span className="text-cyan-400">{awayTeam.abbreviation}</span>
                  <span className="text-[10px] text-slate-500 font-normal hidden sm:inline truncate max-w-[80px]">
                    {awayTeam.name}
                  </span>
                </div>
              </td>
              {inningCols.map((num) => {
                const inningData = rawInnings.find((inn) => inn.num === num);
                const isCurrent = isLive && currentInning === num;
                const runs = inningData?.away?.runs;
                return (
                  <td
                    key={num}
                    className={`py-2.5 px-2.5 ${
                      isCurrent ? 'bg-cyan-500/15 text-cyan-300 font-bold border-x border-cyan-500/30' : 'text-slate-300'
                    }`}
                  >
                    {runs !== undefined ? runs : (num <= (currentInning || 0) ? '0' : '-')}
                  </td>
                );
              })}
              <td className="py-2.5 px-3 font-bold text-white bg-slate-800/40 border-l border-slate-800 text-sm">
                {awayTotals.runs}
              </td>
              <td className="py-2.5 px-3 text-slate-300">{awayTotals.hits}</td>
              <td className="py-2.5 px-3 text-slate-300">{awayTotals.errors}</td>
              <td className="py-2.5 px-3 text-slate-400">{awayTotals.leftOnBase || 0}</td>
            </tr>

            {/* Home Team Row */}
            <tr className="hover:bg-slate-800/20 transition-colors">
              <td className="text-left py-2.5 px-3 font-bold text-slate-200">
                <div className="flex items-center gap-1.5">
                  <span className="text-amber-400">{homeTeam.abbreviation}</span>
                  <span className="text-[10px] text-slate-500 font-normal hidden sm:inline truncate max-w-[80px]">
                    {homeTeam.name}
                  </span>
                </div>
              </td>
              {inningCols.map((num) => {
                const inningData = rawInnings.find((inn) => inn.num === num);
                const isCurrent = isLive && currentInning === num;
                const runs = inningData?.home?.runs;
                return (
                  <td
                    key={num}
                    className={`py-2.5 px-2.5 ${
                      isCurrent ? 'bg-cyan-500/15 text-cyan-300 font-bold border-x border-cyan-500/30' : 'text-slate-300'
                    }`}
                  >
                    {runs !== undefined ? runs : (num < (currentInning || 0) ? '0' : '-')}
                  </td>
                );
              })}
              <td className="py-2.5 px-3 font-bold text-white bg-slate-800/40 border-l border-slate-800 text-sm">
                {homeTotals.runs}
              </td>
              <td className="py-2.5 px-3 text-slate-300">{homeTotals.hits}</td>
              <td className="py-2.5 px-3 text-slate-300">{homeTotals.errors}</td>
              <td className="py-2.5 px-3 text-slate-400">{homeTotals.leftOnBase || 0}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
