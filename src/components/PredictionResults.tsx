import React from 'react';
import { PredictionResult } from '../types/prediction';
import { MLBTeam } from '../types/mlb';
import { formatMoneyline, formatProbability, probToDecimalOdds, getSpreadString } from '../utils/oddsFormatter';
import { Trophy, TrendingUp, Sparkles, Scale, Activity, BarChart2, CheckCircle2 } from 'lucide-react';

interface PredictionResultsProps {
  result: PredictionResult;
  homeTeam: MLBTeam;
  awayTeam: MLBTeam;
}

export const PredictionResults: React.FC<PredictionResultsProps> = ({ result, homeTeam, awayTeam }) => {
  const homeWinPercent = Math.round(result.homeWinProb * 100);
  const awayWinPercent = 100 - homeWinPercent;
  const isHomeFavored = result.homeWinProb >= result.awayWinProb;

  return (
    <div className="space-y-6">
      {/* Top Banner: Win Probability & Moneyline */}
      <div className="bg-gradient-to-r from-[#111B33] via-[#1C2541] to-[#111B33] rounded-2xl p-6 border border-cyan-500/30 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          {/* Away Team Pick Card */}
          <div className={`flex-1 w-full p-4 rounded-xl border transition-all ${
            !isHomeFavored ? 'bg-blue-950/40 border-cyan-500/50 shadow-lg glow-cyan' : 'bg-slate-900/40 border-slate-800'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs uppercase font-bold tracking-wider text-slate-400">Away Team</span>
                <h3 className="text-xl font-bold text-white">{awayTeam.name}</h3>
                <span className="text-xs text-slate-400 font-mono">({awayTeam.abbreviation})</span>
              </div>
              <div className="text-right">
                <div className="text-3xl font-extrabold text-white font-mono">{formatProbability(result.awayWinProb)}</div>
                <div className="text-xs font-mono text-cyan-400 font-semibold">
                  ML: {formatMoneyline(result.awayMoneyline)} | Dec: {probToDecimalOdds(result.awayWinProb)}
                </div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">Projected Runs:</span>
              <span className="font-bold font-mono text-white text-sm">{result.awayExpectedRuns.toFixed(2)}</span>
            </div>
          </div>

          {/* Center VS Indicator */}
          <div className="flex flex-col items-center justify-center px-4">
            <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/80 border border-cyan-700/60 px-3 py-1 rounded-full uppercase tracking-wider">
              10,000 Games Simulated
            </span>
            <div className="my-2 text-2xl font-black text-slate-500">VS</div>
            <div className="text-center">
              <span className="text-[11px] text-slate-400">Park Factor</span>
              <div className="font-mono text-xs text-amber-300 font-bold">{homeTeam.parkFactor || 1.00}x</div>
            </div>
          </div>

          {/* Home Team Pick Card */}
          <div className={`flex-1 w-full p-4 rounded-xl border transition-all ${
            isHomeFavored ? 'bg-blue-950/40 border-cyan-500/50 shadow-lg glow-cyan' : 'bg-slate-900/40 border-slate-800'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs uppercase font-bold tracking-wider text-slate-400">Home Team</span>
                <h3 className="text-xl font-bold text-white">{homeTeam.name}</h3>
                <span className="text-xs text-slate-400 font-mono">({homeTeam.abbreviation})</span>
              </div>
              <div className="text-right">
                <div className="text-3xl font-extrabold text-white font-mono">{formatProbability(result.homeWinProb)}</div>
                <div className="text-xs font-mono text-cyan-400 font-semibold">
                  ML: {formatMoneyline(result.homeMoneyline)} | Dec: {probToDecimalOdds(result.homeWinProb)}
                </div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">Projected Runs:</span>
              <span className="font-bold font-mono text-white text-sm">{result.homeExpectedRuns.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Win Probability Progress Bar */}
        <div className="mt-6">
          <div className="flex justify-between text-xs font-mono font-semibold mb-1 text-slate-300">
            <span>{awayTeam.abbreviation} ({awayWinPercent}%)</span>
            <span>{homeTeam.abbreviation} ({homeWinPercent}%)</span>
          </div>
          <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden flex border border-slate-700">
            <div
              className="bg-gradient-to-r from-indigo-500 to-blue-500 transition-all duration-700"
              style={{ width: `${awayWinPercent}%` }}
            />
            <div
              className="bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all duration-700"
              style={{ width: `${homeWinPercent}%` }}
            />
          </div>
        </div>

        {/* AI Sabermetric Recommendation */}
        <div className="mt-6 p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/30 flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <div className="font-bold text-cyan-300 uppercase tracking-wider text-[11px]">Prediction Recommendation:</div>
            <div className="text-slate-200 font-medium text-sm">{result.recommendation}</div>
            <div className="text-slate-400 text-xs">{result.keyInsight}</div>
          </div>
        </div>
      </div>

      {/* Grid: Over/Under Total Runs & Handicap (Runline) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Total Runs (Over/Under) */}
        <div className="bg-[#111B33] p-5 rounded-2xl border border-slate-800 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
              <h3 className="font-bold text-white text-base">Total Runs (Over / Under)</h3>
            </div>
            <div className="text-xs font-mono bg-cyan-950 text-cyan-300 px-2 py-1 rounded border border-cyan-800">
              Expected Total: <span className="font-bold text-white">{result.totalExpectedRuns.toFixed(2)}</span>
            </div>
          </div>

          <div className="space-y-3">
            {result.overUnderLines.map((ou) => {
              const overPct = Math.round(ou.overProb * 100);
              const underPct = 100 - overPct;
              const isOverLikely = ou.overProb > 0.50;

              return (
                <div key={ou.line} className="p-2.5 rounded-xl bg-[#0B132B]/80 border border-slate-800 text-xs">
                  <div className="flex justify-between items-center mb-1.5 font-mono">
                    <span className="font-bold text-slate-200 text-sm">Line {ou.line}</span>
                    <div className="flex gap-4">
                      <span className={isOverLikely ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                        Over {formatProbability(ou.overProb)}
                      </span>
                      <span className={!isOverLikely ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                        Under {formatProbability(ou.underProb)}
                      </span>
                    </div>
                  </div>
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden flex">
                    <div
                      className="bg-cyan-500 transition-all"
                      style={{ width: `${overPct}%` }}
                    />
                    <div
                      className="bg-indigo-600 transition-all"
                      style={{ width: `${underPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Handicap (Runline Spread +/- 1.5) */}
        <div className="bg-[#111B33] p-5 rounded-2xl border border-slate-800 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-white text-base">Handicap / Runline Spread</h3>
            </div>
            <div className="text-xs font-mono bg-amber-950 text-amber-300 px-2 py-1 rounded border border-amber-800">
              Spread Margin: <span className="font-bold text-white">{(result.homeExpectedRuns - result.awayExpectedRuns).toFixed(2)}</span>
            </div>
          </div>

          <div className="space-y-4">
            {/* Home Team Handicap */}
            <div className="p-3 rounded-xl bg-[#0B132B]/80 border border-slate-800">
              <div className="text-xs font-bold text-slate-300 mb-2">{homeTeam.name} Runline Covers:</div>
              <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                {result.homeHandicapLines.map((h) => (
                  <div key={h.spread} className="p-2 rounded bg-slate-900 border border-slate-800 flex justify-between items-center">
                    <span className="font-semibold text-slate-300">{getSpreadString(h.spread)}</span>
                    <span className={`font-bold ${h.coverProb >= 0.5 ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {formatProbability(h.coverProb)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Away Team Handicap */}
            <div className="p-3 rounded-xl bg-[#0B132B]/80 border border-slate-800">
              <div className="text-xs font-bold text-slate-300 mb-2">{awayTeam.name} Runline Covers:</div>
              <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                {result.awayHandicapLines.map((h) => (
                  <div key={h.spread} className="p-2 rounded bg-slate-900 border border-slate-800 flex justify-between items-center">
                    <span className="font-semibold text-slate-300">{getSpreadString(h.spread)}</span>
                    <span className={`font-bold ${h.coverProb >= 0.5 ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {formatProbability(h.coverProb)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Inning By Inning Projection & Common Scores Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Inning by Inning */}
        <div className="lg:col-span-2 bg-[#111B33] p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-white text-sm">Expected Runs By Inning (1 - 9)</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono text-center">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800">
                  <th className="py-2 text-left">Team</th>
                  {Array.from({ length: 9 }).map((_, i) => (
                    <th key={i} className="py-2 px-1 font-semibold">{i + 1}</th>
                  ))}
                  <th className="py-2 px-2 text-cyan-300 font-bold">TOTAL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                <tr>
                  <td className="py-2.5 text-left font-bold text-slate-200">{awayTeam.abbreviation}</td>
                  {result.awayInningRuns.map((r, i) => (
                    <td key={i} className="py-2.5 px-1 text-slate-300">{r.toFixed(2)}</td>
                  ))}
                  <td className="py-2.5 px-2 font-bold text-cyan-400">{result.awayExpectedRuns.toFixed(2)}</td>
                </tr>
                <tr>
                  <td className="py-2.5 text-left font-bold text-slate-200">{homeTeam.abbreviation}</td>
                  {result.homeInningRuns.map((r, i) => (
                    <td key={i} className="py-2.5 px-1 text-slate-300">{r.toFixed(2)}</td>
                  ))}
                  <td className="py-2.5 px-2 font-bold text-cyan-400">{result.homeExpectedRuns.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Most Frequent Simulated Scores */}
        <div className="bg-[#111B33] p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5 text-gold" />
            <h3 className="font-bold text-white text-sm">Top Simulated Scores</h3>
          </div>

          <div className="space-y-2 font-mono text-xs">
            {Object.entries(result.commonScores).map(([score, count], idx) => (
              <div key={score} className="flex justify-between items-center p-2 rounded-lg bg-[#0B132B] border border-slate-800">
                <span className="font-bold text-slate-200">
                  #{idx + 1} &nbsp; {homeTeam.abbreviation} {score.split('-')[0]} - {score.split('-')[1]} {awayTeam.abbreviation}
                </span>
                <span className="text-cyan-400 font-semibold">{count} times</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
