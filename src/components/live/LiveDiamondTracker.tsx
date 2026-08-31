import React from 'react';
import { LiveGameSummary, LivePlay } from '../../types/liveGame';
import { User, Shield, Target, Flame } from 'lucide-react';

interface LiveDiamondTrackerProps {
  linescore?: LiveGameSummary['linescore'];
  currentPlay?: LivePlay;
  statusDetailed?: string;
  isLive?: boolean;
}

export const LiveDiamondTracker: React.FC<LiveDiamondTrackerProps> = ({
  linescore,
  currentPlay,
  statusDetailed,
  isLive,
}) => {
  const balls = linescore?.balls ?? currentPlay?.count?.balls ?? 0;
  const strikes = linescore?.strikes ?? currentPlay?.count?.strikes ?? 0;
  const outs = linescore?.outs ?? currentPlay?.count?.outs ?? 0;

  const runner1st = linescore?.offense?.first;
  const runner2nd = linescore?.offense?.second;
  const runner3rd = linescore?.offense?.third;

  const currentBatter = linescore?.offense?.batter || currentPlay?.matchup?.batter;
  const currentPitcher = linescore?.defense?.pitcher || currentPlay?.matchup?.pitcher;
  const onDeck = linescore?.offense?.onDeck;
  const inHole = linescore?.offense?.inHole;

  // Last pitch speed and type if available
  const lastPitch = currentPlay?.playEvents && currentPlay.playEvents.length > 0
    ? currentPlay.playEvents[currentPlay.playEvents.length - 1]
    : null;

  return (
    <div className="bg-[#0B132B]/90 border border-slate-800 rounded-xl p-4 sm:p-5 relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute -top-10 -right-10 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-center justify-between mb-4 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-cyan-400" />
          <h3 className="text-sm font-bold tracking-wide uppercase text-slate-200">
            Live Field & Matchup
          </h3>
        </div>
        {isLive ? (
          <span className="flex items-center gap-1.5 text-xs font-mono font-bold text-red-400 bg-red-950/40 border border-red-800/40 px-2 py-0.5 rounded-full animate-pulse">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            LIVE INNING
          </span>
        ) : (
          <span className="text-xs font-mono text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded-full">
            {statusDetailed || 'Field Standby'}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
        {/* Diamond SVG & Count Section */}
        <div className="md:col-span-6 flex flex-col items-center justify-center p-3 bg-[#080E1E]/80 rounded-xl border border-slate-800/60 relative">
          {/* Base Diamond SVG */}
          <div className="relative w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center">
            <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-md">
              {/* Field dirt diamond outline */}
              <polygon
                points="100,20 180,100 100,180 20,100"
                fill="#0A1828"
                stroke="#1E3A5F"
                strokeWidth="2.5"
                strokeDasharray="4 2"
              />
              
              {/* Infield Grass */}
              <polygon
                points="100,38 162,100 100,162 38,100"
                fill="#09221D"
                opacity="0.6"
              />

              {/* Pitcher's Mound */}
              <circle cx="100" cy="100" r="10" fill="#1C304A" stroke="#2563EB" strokeWidth="1.5" />
              <rect x="96" y="98" width="8" height="4" fill="#F8FAFC" rx="1" />

              {/* 2nd Base (Top) */}
              <g className="transition-all duration-300">
                <rect
                  x="92"
                  y="12"
                  width="16"
                  height="16"
                  transform="rotate(45 100 20)"
                  className={runner2nd ? 'fill-amber-400 stroke-amber-200 stroke-2 filter drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]' : 'fill-slate-700 stroke-slate-500 stroke-1'}
                />
              </g>

              {/* 3rd Base (Left) */}
              <g className="transition-all duration-300">
                <rect
                  x="12"
                  y="92"
                  width="16"
                  height="16"
                  transform="rotate(45 20 100)"
                  className={runner3rd ? 'fill-amber-400 stroke-amber-200 stroke-2 filter drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]' : 'fill-slate-700 stroke-slate-500 stroke-1'}
                />
              </g>

              {/* 1st Base (Right) */}
              <g className="transition-all duration-300">
                <rect
                  x="172"
                  y="92"
                  width="16"
                  height="16"
                  transform="rotate(45 180 100)"
                  className={runner1st ? 'fill-amber-400 stroke-amber-200 stroke-2 filter drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]' : 'fill-slate-700 stroke-slate-500 stroke-1'}
                />
              </g>

              {/* Home Plate (Bottom) */}
              <polygon
                points="100,186 109,177 109,170 91,170 91,177"
                fill="#F8FAFC"
                stroke="#94A3B8"
                strokeWidth="1.5"
              />
            </svg>

            {/* Runner Name Tags Overlay */}
            {runner2nd && (
              <div className="absolute top-1 left-1/2 -translate-x-1/2 bg-amber-950/90 border border-amber-500/60 px-2 py-0.5 rounded text-[10px] font-mono font-bold text-amber-300 shadow-md whitespace-nowrap z-10">
                2B: {runner2nd.fullName}
              </div>
            )}
            {runner3rd && (
              <div className="absolute top-1/2 left-0 -translate-y-1/2 bg-amber-950/90 border border-amber-500/60 px-2 py-0.5 rounded text-[10px] font-mono font-bold text-amber-300 shadow-md whitespace-nowrap z-10">
                3B: {runner3rd.fullName}
              </div>
            )}
            {runner1st && (
              <div className="absolute top-1/2 right-0 -translate-y-1/2 bg-amber-950/90 border border-amber-500/60 px-2 py-0.5 rounded text-[10px] font-mono font-bold text-amber-300 shadow-md whitespace-nowrap z-10">
                1B: {runner1st.fullName}
              </div>
            )}
          </div>

          {/* Balls / Strikes / Outs Count Lights */}
          <div className="mt-3 flex items-center justify-center gap-6 bg-[#0B132B] px-4 py-2 rounded-lg border border-slate-800 font-mono text-xs w-full max-w-[280px]">
            {/* Balls (4 max) */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-bold">B:</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((dot) => (
                  <span
                    key={dot}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${
                      dot <= balls ? 'bg-emerald-400 shadow-[0_0_6px_#34D399]' : 'bg-slate-700'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Strikes (3 max) */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-bold">S:</span>
              <div className="flex gap-1">
                {[1, 2, 3].map((dot) => (
                  <span
                    key={dot}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${
                      dot <= strikes ? 'bg-amber-400 shadow-[0_0_6px_#FBBF24]' : 'bg-slate-700'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Outs (3 max) */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-bold">O:</span>
              <div className="flex gap-1">
                {[1, 2, 3].map((dot) => (
                  <span
                    key={dot}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${
                      dot <= outs ? 'bg-red-500 shadow-[0_0_6px_#EF4444]' : 'bg-slate-700'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Current Matchup Details */}
        <div className="md:col-span-6 space-y-3">
          {/* Pitcher Card */}
          <div className="p-3 bg-[#080E1E]/90 border border-slate-800/80 rounded-xl">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
              <div className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-cyan-400" />
                <span className="font-mono uppercase font-bold text-cyan-400">Current Pitcher</span>
              </div>
              {currentPlay?.matchup?.pitchHand && (
                <span className="text-[10px] font-mono bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">
                  Throws: {currentPlay.matchup.pitchHand.code}
                </span>
              )}
            </div>
            <div className="text-sm font-bold text-white">
              {currentPitcher?.fullName || 'Pitcher on Mound'}
            </div>
            {lastPitch?.pitchData?.startSpeed && (
              <div className="mt-1 flex items-center gap-2 text-[11px] font-mono text-cyan-300">
                <Flame className="w-3 h-3 text-amber-400" />
                <span>Last Pitch: {lastPitch.pitchData.startSpeed} MPH ({lastPitch.details?.type?.description || 'Fastball'})</span>
              </div>
            )}
          </div>

          {/* Batter Card */}
          <div className="p-3 bg-[#080E1E]/90 border border-slate-800/80 rounded-xl">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-mono uppercase font-bold text-amber-400">Current Batter (At Bat)</span>
              </div>
              {currentPlay?.matchup?.batSide && (
                <span className="text-[10px] font-mono bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">
                  Bats: {currentPlay.matchup.batSide.code}
                </span>
              )}
            </div>
            <div className="text-sm font-bold text-white">
              {currentBatter?.fullName || 'Batter in Box'}
            </div>
            {currentPlay?.result?.description && (
              <div className="mt-1 text-xs text-slate-300 line-clamp-2 italic">
                "{currentPlay.result.description}"
              </div>
            )}
          </div>

          {/* On Deck & In Hole */}
          {(onDeck || inHole) && (
            <div className="p-2.5 bg-[#080E1E]/50 border border-slate-800/40 rounded-lg flex items-center justify-between text-xs font-mono text-slate-400">
              {onDeck && (
                <div className="truncate max-w-[140px]">
                  <span className="text-slate-500">On Deck: </span>
                  <span className="text-slate-300 font-semibold">{onDeck.fullName}</span>
                </div>
              )}
              {inHole && (
                <div className="truncate max-w-[140px]">
                  <span className="text-slate-500">In Hole: </span>
                  <span className="text-slate-300 font-semibold">{inHole.fullName}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
