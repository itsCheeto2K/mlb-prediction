import React from 'react';
import { MLBPlayer } from '../types/mlb';
import { User, Shield, Target } from 'lucide-react';

interface PlayerSelectCardProps {
  label: string;
  orderNum?: number;
  isPitcher?: boolean;
  players: MLBPlayer[];
  selectedPlayerId: number | null;
  onSelectPlayer: (player: MLBPlayer) => void;
  isLoading?: boolean;
}

export const PlayerSelectCard: React.FC<PlayerSelectCardProps> = ({
  label,
  orderNum,
  isPitcher = false,
  players,
  selectedPlayerId,
  onSelectPlayer,
  isLoading = false
}) => {
  const selectedPlayer = players.find(p => p.id === selectedPlayerId);

  return (
    <div className={`p-3 rounded-xl border transition-all duration-200 ${
      isPitcher
        ? 'bg-[#152238]/70 border-amber-500/30 hover:border-amber-500/60 shadow-sm'
        : 'bg-[#111B33]/80 border-slate-700/50 hover:border-slate-600'
    }`}>
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5">
          {isPitcher ? (
            <span className="p-1 rounded bg-amber-500/20 text-amber-300">
              <Shield className="w-3.5 h-3.5" />
            </span>
          ) : (
            <span className="w-5 h-5 rounded bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-xs font-mono font-bold">
              {orderNum}
            </span>
          )}
          <span className="text-xs font-semibold text-slate-300 truncate">
            {label}
          </span>
        </div>
        {selectedPlayer && (
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
            {selectedPlayer.primaryPosition?.abbreviation || (isPitcher ? 'SP' : 'DH')}
          </span>
        )}
      </div>

      {/* Select Dropdown */}
      <div className="relative">
        <select
          value={selectedPlayerId || ''}
          onChange={(e) => {
            const pid = Number(e.target.value);
            const found = players.find(p => p.id === pid);
            if (found) onSelectPlayer(found);
          }}
          disabled={isLoading || players.length === 0}
          className="w-full bg-[#0B132B] text-slate-100 text-xs rounded-lg px-2.5 py-2 border border-slate-700 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none truncate transition-colors cursor-pointer disabled:opacity-50"
        >
          {players.length === 0 ? (
            <option value="">{isLoading ? 'Loading roster...' : 'No players available'}</option>
          ) : (
            <>
              <option value="">-- Choose {isPitcher ? 'Pitcher' : 'Batter'} --</option>
              {players.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.fullName} ({p.primaryPosition?.abbreviation || (isPitcher ? 'P' : 'OF')})
                </option>
              ))}
            </>
          )}
        </select>
      </div>

      {/* Quick Player Stat preview pills */}
      {selectedPlayer && selectedPlayer.stats && (
        <div className="mt-2 pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-1 text-[11px] font-mono text-slate-400">
          {isPitcher ? (
            <>
              <div>ERA: <span className="text-amber-300 font-bold">{selectedPlayer.stats.era || '3.85'}</span></div>
              <div>WHIP: <span className="text-slate-200">{selectedPlayer.stats.whip || '1.20'}</span></div>
              {selectedPlayer.stats.restDays !== undefined && (
                <div className={`px-1.5 py-0.5 rounded text-[10px] ${
                  selectedPlayer.stats.restDays <= 4
                    ? 'bg-rose-950/80 text-rose-300 border border-rose-800'
                    : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                }`}>
                  Rest: {selectedPlayer.stats.restDays}d ({selectedPlayer.stats.lastStartPitches || 90}p)
                </div>
              )}
            </>
          ) : (
            <>
              <div>AVG: <span className="text-cyan-300 font-bold">{selectedPlayer.stats.avg || '.260'}</span></div>
              <div>OPS: <span className="text-emerald-300">{selectedPlayer.stats.ops || '.760'}</span></div>
              {selectedPlayer.stats.l10Ops ? (
                <div className={`px-1.5 py-0.5 rounded text-[10px] ${
                  selectedPlayer.stats.l10Ops >= Number(selectedPlayer.stats.ops || 0.750)
                    ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                    : 'bg-amber-950/80 text-amber-300 border border-amber-800'
                }`}>
                  L10: {selectedPlayer.stats.l10Ops.toFixed(3)}
                </div>
              ) : (
                <div>HR: <span className="text-rose-400 font-bold">{selectedPlayer.stats.homeRuns || 0}</span></div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
