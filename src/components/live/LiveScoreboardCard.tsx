import React from 'react';
import { LiveGameSummary } from '../../types/liveGame';
import { formatInningState } from '../../services/liveGameApi';
import { Radio, CheckCircle2, Clock } from 'lucide-react';

interface LiveScoreboardCardProps {
  game: LiveGameSummary;
  isSelected: boolean;
  onSelect: (game: LiveGameSummary) => void;
}

export const LiveScoreboardCard: React.FC<LiveScoreboardCardProps> = ({
  game,
  isSelected,
  onSelect,
}) => {
  const isLive = game.status.isLive;
  const isFinal = game.status.isFinal;
  const inningText = formatInningState(game.linescore, game.status.detailedState);

  const awayScore = game.teams.away.score ?? 0;
  const homeScore = game.teams.home.score ?? 0;
  const awayIsWinning = isFinal && awayScore > homeScore;
  const homeIsWinning = isFinal && homeScore > awayScore;

  return (
    <div
      onClick={() => onSelect(game)}
      className={`relative p-3.5 rounded-xl cursor-pointer transition-all duration-200 border ${
        isSelected
          ? 'bg-[#15203D] border-cyan-500 shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-500'
          : 'bg-[#0E172F]/90 border-slate-800 hover:border-slate-700 hover:bg-[#131D3B]'
      }`}
    >
      {/* Header: Status & Inning */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-1.5">
          {isLive ? (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 text-[10px] font-bold font-mono uppercase animate-pulse">
              <Radio className="w-2.5 h-2.5" />
              LIVE
            </span>
          ) : isFinal ? (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold font-mono">
              <CheckCircle2 className="w-2.5 h-2.5" />
              FINAL
            </span>
          ) : (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-[10px] font-mono">
              <Clock className="w-2.5 h-2.5" />
              {new Date(game.gameDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>

        <div className="text-[11px] font-mono font-semibold text-cyan-300 truncate">
          {inningText}
        </div>
      </div>

      {/* Teams & Scores */}
      <div className="space-y-1.5">
        {/* Away Team */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 truncate pr-2">
            <span className="font-bold text-slate-200 w-10 text-left font-mono">{game.teams.away.abbreviation}</span>
            <span className={`truncate ${awayIsWinning ? 'text-white font-bold' : 'text-slate-300'}`}>
              {game.teams.away.name}
            </span>
            {game.teams.away.wins !== undefined && (
              <span className="text-[10px] text-slate-500 font-mono">
                ({game.teams.away.wins}-{game.teams.away.losses})
              </span>
            )}
          </div>
          <span className={`font-mono text-sm px-2 py-0.5 rounded ${
            isLive ? 'font-black text-cyan-300 bg-cyan-950/40' : awayIsWinning ? 'font-bold text-white' : 'text-slate-400'
          }`}>
            {game.status.isScheduled ? '-' : awayScore}
          </span>
        </div>

        {/* Home Team */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 truncate pr-2">
            <span className="font-bold text-slate-200 w-10 text-left font-mono">{game.teams.home.abbreviation}</span>
            <span className={`truncate ${homeIsWinning ? 'text-white font-bold' : 'text-slate-300'}`}>
              {game.teams.home.name}
            </span>
            {game.teams.home.wins !== undefined && (
              <span className="text-[10px] text-slate-500 font-mono">
                ({game.teams.home.wins}-{game.teams.home.losses})
              </span>
            )}
          </div>
          <span className={`font-mono text-sm px-2 py-0.5 rounded ${
            isLive ? 'font-black text-cyan-300 bg-cyan-950/40' : homeIsWinning ? 'font-bold text-white' : 'text-slate-400'
          }`}>
            {game.status.isScheduled ? '-' : homeScore}
          </span>
        </div>
      </div>

      {/* Probable Pitchers / Current Situation */}
      <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 font-mono">
        <span className="truncate max-w-[130px]" title={game.venue.name}>
          🏟️ {game.venue.name.replace(' Stadium', '').replace(' Park', '').replace(' Field', '')}
        </span>
        {isLive && game.linescore?.outs !== undefined && (
          <span className="text-amber-400 font-bold">
            {game.linescore.outs} Out{game.linescore.outs !== 1 ? 's' : ''}
          </span>
        )}
      </div>
    </div>
  );
};
