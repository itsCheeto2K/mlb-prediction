import React, { useState, useEffect } from 'react';
import { StatLeader } from '../types/mlb';
import { fetchStatLeaders } from '../services/mlbApi';
import { Award, Flame, Shield, TrendingUp, RefreshCw } from 'lucide-react';

interface LeaderCategoryConfig {
  id: string;
  name: string;
  isPitching: boolean;
  unit?: string;
}

const LEADER_CATEGORIES: LeaderCategoryConfig[] = [
  { id: 'homeRuns', name: 'Home Runs', isPitching: false, unit: 'HR' },
  { id: 'battingAverage', name: 'Batting Average', isPitching: false, unit: 'AVG' },
  { id: 'runsBattedIn', name: 'Runs Batted In (RBI)', isPitching: false, unit: 'RBI' },
  { id: 'onBasePlusSlugging', name: 'OPS', isPitching: false, unit: 'OPS' },
  { id: 'earnedRunAverage', name: 'ERA (Earned Run Avg)', isPitching: true, unit: 'ERA' },
  { id: 'strikeouts', name: 'Strikeouts (SO)', isPitching: true, unit: 'SO' },
  { id: 'wins', name: 'Pitching Wins', isPitching: true, unit: 'W' },
  { id: 'whip', name: 'WHIP', isPitching: true, unit: 'WHIP' }
];

export const LeadersTab: React.FC = () => {
  const [selectedCat, setSelectedCat] = useState<LeaderCategoryConfig>(LEADER_CATEGORIES[0]);
  const [leaders, setLeaders] = useState<StatLeader[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadLeaders() {
      setIsLoading(true);
      const data = await fetchStatLeaders(selectedCat.id, selectedCat.isPitching);
      setLeaders(data);
      setIsLoading(false);
    }
    loadLeaders();
  }, [selectedCat]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-[#111B33] p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <span>MLB League Statistical Leaders</span>
          </h2>
          <p className="text-xs text-slate-400">Top individual performers across batting and pitching categories</p>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-1.5 max-w-2xl">
          {LEADER_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCat(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedCat.id === cat.id
                  ? cat.isPitching
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                    : 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Leaderboard Grid */}
      <div className="bg-[#111B33] rounded-2xl border border-slate-800 overflow-hidden shadow-lg p-6">
        <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-rose-400" />
            <h3 className="font-bold text-white text-base">Top 10: {selectedCat.name}</h3>
          </div>
          <span className="text-xs font-mono font-semibold text-slate-400">
            {selectedCat.isPitching ? 'PITCHING' : 'HITTING'} METRIC
          </span>
        </div>

        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
            <RefreshCw className="w-8 h-8 animate-spin text-cyan-400" />
            <span className="text-sm font-medium">Loading Leaders...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {leaders.map((l, idx) => {
              const isFirst = idx === 0;
              const isTopThree = idx < 3;

              return (
                <div
                  key={`${l.player.id}-${idx}`}
                  className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
                    isFirst
                      ? 'bg-gradient-to-r from-amber-950/40 via-[#1C2541] to-[#111B33] border-amber-500/50 shadow-md shadow-amber-500/10'
                      : isTopThree
                      ? 'bg-[#152238] border-cyan-500/30'
                      : 'bg-[#0B132B]/80 border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center font-mono font-black text-xs ${
                      isFirst
                        ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/40'
                        : idx === 1
                        ? 'bg-slate-300 text-slate-950'
                        : idx === 2
                        ? 'bg-amber-700 text-amber-100'
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {idx + 1}
                    </span>

                    <div>
                      <div className="font-bold text-white text-sm">{l.player.fullName}</div>
                      <div className="text-xs text-slate-400 flex items-center gap-1.5">
                        <span>{l.team.name}</span>
                        <span>•</span>
                        <span className="font-mono text-slate-500 font-bold">{l.player.primaryPosition.abbreviation}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-mono text-xl font-extrabold text-cyan-300">
                      {l.value}
                    </span>
                    <span className="block text-[10px] font-mono text-slate-400 uppercase">
                      {selectedCat.unit}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
