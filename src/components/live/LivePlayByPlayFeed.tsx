import React, { useState } from 'react';
import { LivePlay } from '../../types/liveGame';
import { ListFilter, Flame, Zap, CheckCircle, AlertCircle, CircleDot } from 'lucide-react';

interface LivePlayByPlayFeedProps {
  plays: LivePlay[];
  currentPlay?: LivePlay;
}

export const LivePlayByPlayFeed: React.FC<LivePlayByPlayFeedProps> = ({
  plays = [],
  currentPlay,
}) => {
  const [scoringOnly, setScoringOnly] = useState<boolean>(false);

  // Filter plays
  const filteredPlays = scoringOnly
    ? plays.filter((p) => (p.result?.rbi && p.result.rbi > 0) || p.result?.event?.toLowerCase().includes('home run') || p.result?.eventType?.includes('home_run'))
    : plays;

  // Render plays in reverse order (newest first)
  const reversedPlays = [...filteredPlays].reverse();

  const getPlayBadge = (play: LivePlay) => {
    const event = play.result?.event?.toLowerCase() || '';
    const eventType = play.result?.eventType?.toLowerCase() || '';
    const isHr = event.includes('home run') || eventType.includes('home_run');
    const isStrikeout = event.includes('strikeout') || eventType.includes('strikeout');
    const isWalk = event.includes('walk') || event.includes('hit by pitch');
    const isScoring = play.result?.rbi > 0;

    if (isHr) {
      return (
        <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold font-mono">
          <Flame className="w-3 h-3 text-amber-400" />
          HOME RUN
        </span>
      );
    }
    if (isScoring) {
      return (
        <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold font-mono">
          <Zap className="w-3 h-3 text-emerald-400" />
          {play.result.rbi} RBI
        </span>
      );
    }
    if (isStrikeout) {
      return (
        <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30 text-[10px] font-mono font-bold">
          K
        </span>
      );
    }
    if (isWalk) {
      return (
        <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-mono font-bold">
          BB
        </span>
      );
    }
    if (play.result?.isOut) {
      return (
        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-mono">
          OUT
        </span>
      );
    }
    return (
      <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-mono">
        HIT
      </span>
    );
  };

  return (
    <div className="bg-[#0B132B]/90 border border-slate-800 rounded-xl p-4 flex flex-col h-[520px]">
      {/* Header with filter */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
        <div className="flex items-center gap-2">
          <CircleDot className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-bold tracking-wide uppercase text-slate-200">
            Live Play-by-Play Feed
          </h3>
          <span className="text-xs font-mono text-slate-500">
            ({reversedPlays.length} events)
          </span>
        </div>

        {/* Filter Toggle */}
        <button
          onClick={() => setScoringOnly(!scoringOnly)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
            scoringOnly
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 border border-slate-700/50'
          }`}
        >
          <ListFilter className="w-3 h-3" />
          <span>{scoringOnly ? 'Scoring Plays' : 'All Plays'}</span>
        </button>
      </div>

      {/* Plays Scrollable List */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        {reversedPlays.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs font-mono py-12">
            <AlertCircle className="w-8 h-8 mb-2 opacity-50" />
            <span>No play-by-play events recorded yet.</span>
          </div>
        ) : (
          reversedPlays.map((play, idx) => {
            const isTop = play.about?.isTopInning ?? (play.about?.halfInning === 'top');
            const inningNum = play.about?.inning || 1;
            const inningLabel = `${isTop ? '🔺 Top' : '🔻 Bot'} ${inningNum}`;
            const isScoring = play.result?.rbi > 0 || play.result?.event?.toLowerCase().includes('home run');

            return (
              <div
                key={play.id || idx}
                className={`p-3 rounded-lg border transition-all text-xs ${
                  isScoring
                    ? 'bg-[#121E36] border-amber-500/30 shadow-sm'
                    : 'bg-[#080E1E]/70 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                {/* Play Header: Inning, Score, Outs */}
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-cyan-400">{inningLabel}</span>
                    <span>•</span>
                    <span>
                      Score: {play.result?.awayScore ?? 0} - {play.result?.homeScore ?? 0}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {getPlayBadge(play)}
                  </div>
                </div>

                {/* Matchup */}
                <div className="text-[11px] font-mono text-slate-400 mb-1">
                  <span className="text-slate-300 font-semibold">{play.matchup?.batter?.fullName || 'Batter'}</span>
                  <span className="text-slate-500"> vs </span>
                  <span className="text-slate-300 font-semibold">{play.matchup?.pitcher?.fullName || 'Pitcher'}</span>
                </div>

                {/* Description */}
                <div className="text-slate-200 leading-relaxed text-xs">
                  {play.result?.description || play.about?.captions || 'Play recorded.'}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
