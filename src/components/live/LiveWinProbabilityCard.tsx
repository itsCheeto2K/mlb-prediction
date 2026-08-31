import React from 'react';
import { LiveGameSummary } from '../../types/liveGame';
import { calculateLiveWinProbability } from '../../services/liveGameApi';
import { Cpu, Gauge, TrendingUp, AlertTriangle } from 'lucide-react';

interface LiveWinProbabilityCardProps {
  game: LiveGameSummary;
  onNavigateToPredictor?: (awayTeamName: string, homeTeamName: string) => void;
}

export const LiveWinProbabilityCard: React.FC<LiveWinProbabilityCardProps> = ({
  game,
  onNavigateToPredictor,
}) => {
  const awayTeam = game.teams.away;
  const homeTeam = game.teams.home;
  const awayScore = awayTeam.score ?? 0;
  const homeScore = homeTeam.score ?? 0;

  const winProb = calculateLiveWinProbability(
    game.linescore,
    homeScore,
    awayScore,
    game.status.isFinal
  );

  const getLeverageColor = (li: number) => {
    if (li >= 2.0) return 'text-red-400 bg-red-950/40 border-red-800/40';
    if (li >= 1.2) return 'text-amber-400 bg-amber-950/40 border-amber-800/40';
    return 'text-emerald-400 bg-emerald-950/40 border-emerald-800/40';
  };

  const getLeverageLabel = (li: number) => {
    if (li >= 2.5) return 'CRITICAL LEVERAGE';
    if (li >= 1.5) return 'HIGH LEVERAGE';
    if (li >= 0.9) return 'MEDIUM LEVERAGE';
    return 'LOW LEVERAGE';
  };

  return (
    <div className="bg-[#0B132B]/90 border border-slate-800 rounded-xl p-4 sm:p-5">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-cyan-400" />
          <h3 className="text-sm font-bold tracking-wide uppercase text-slate-200">
            Live Sabermetric Win Expectancy
          </h3>
        </div>
        <span className="text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-700/50 px-2 py-0.5 rounded font-bold">
          REAL-TIME WE MODEL
        </span>
      </div>

      {/* Win Probability Dual Bar */}
      <div className="space-y-2 mb-5">
        {/* Team Labels & Percentages */}
        <div className="flex items-center justify-between text-xs font-mono font-bold">
          <div className="flex items-center gap-2 text-cyan-300">
            <span>{awayTeam.abbreviation}</span>
            <span className="text-sm">{winProb.awayProb}%</span>
          </div>
          <div className="text-[11px] text-slate-500 font-normal">
            Win Probability
          </div>
          <div className="flex items-center gap-2 text-amber-300">
            <span className="text-sm">{winProb.homeProb}%</span>
            <span>{homeTeam.abbreviation}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-3.5 w-full bg-slate-900 rounded-full overflow-hidden flex border border-slate-700/60 p-0.5">
          <div
            className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 rounded-l-full transition-all duration-500 shadow-sm"
            style={{ width: `${winProb.awayProb}%` }}
          />
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-r-full transition-all duration-500 shadow-sm"
            style={{ width: `${winProb.homeProb}%` }}
          />
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
        {/* Leverage Index */}
        <div className="p-2.5 bg-[#080E1E] rounded-lg border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
            <Gauge className="w-3.5 h-3.5 text-cyan-400" />
            <span>Leverage Index (LI)</span>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-base font-bold font-mono text-white">
              {winProb.leverageIndex.toFixed(2)}x
            </span>
            <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border font-bold ${getLeverageColor(winProb.leverageIndex)}`}>
              {getLeverageLabel(winProb.leverageIndex)}
            </span>
          </div>
        </div>

        {/* Projected Total Runs */}
        <div className="p-2.5 bg-[#080E1E] rounded-lg border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
            <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
            <span>Projected Total (O/U)</span>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-base font-bold font-mono text-amber-300">
              {winProb.projectedTotalRuns} Runs
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              (Cur: {awayScore + homeScore})
            </span>
          </div>
        </div>

        {/* Situation Summary */}
        <div className="col-span-2 sm:col-span-1 p-2.5 bg-[#080E1E] rounded-lg border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
            <AlertTriangle className="w-3.5 h-3.5 text-indigo-400" />
            <span>Game State</span>
          </div>
          <div className="mt-1 text-xs font-semibold text-slate-200 truncate">
            {winProb.summary}
          </div>
        </div>
      </div>

      {/* Integration Action: Run Simulation in C++ Engine */}
      {onNavigateToPredictor && (
        <button
          onClick={() => onNavigateToPredictor(awayTeam.name, homeTeam.name)}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-blue-600/30 to-cyan-500/20 hover:from-blue-600/50 hover:to-cyan-500/40 text-cyan-300 border border-cyan-500/40 rounded-lg text-xs font-semibold font-mono tracking-wide transition-all shadow-sm group"
        >
          <Cpu className="w-4 h-4 text-cyan-400 group-hover:rotate-12 transition-transform" />
          <span>Launch Full 10,000 Monte Carlo Simulation in C++ Engine</span>
        </button>
      )}
    </div>
  );
};
