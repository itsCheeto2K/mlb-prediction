import React, { useState, useEffect, useCallback } from 'react';
import { LiveGameSummary, LiveGameFeed } from '../types/liveGame';
import { fetchLiveSchedule, fetchLiveGameFeed, formatInningState } from '../services/liveGameApi';
import { LiveScoreboardCard } from './live/LiveScoreboardCard';
import { LiveDiamondTracker } from './live/LiveDiamondTracker';
import { LiveLinescoreTable } from './live/LiveLinescoreTable';
import { LivePlayByPlayFeed } from './live/LivePlayByPlayFeed';
import { LiveWinProbabilityCard } from './live/LiveWinProbabilityCard';
import { LiveBettingPredictionCard } from './live/LiveBettingPredictionCard';
import { LivePlayerBoxscore } from './live/LivePlayerBoxscore';
import {
  RefreshCw,
  Calendar,
  Radio,
  Clock,
  CloudSun,
  MapPin,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Activity
} from 'lucide-react';

export const LiveGamesTab: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [games, setGames] = useState<LiveGameSummary[]>([]);
  const [selectedGamePk, setSelectedGamePk] = useState<number | null>(null);
  const [liveFeed, setLiveFeed] = useState<LiveGameFeed | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'live' | 'final' | 'scheduled'>('all');
  const [autoRefreshSec, setAutoRefreshSec] = useState<number>(15);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshingFeed, setIsRefreshingFeed] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Fetch games list for selected date
  const loadSchedule = useCallback(async (dateStr: string, preserveSelected: boolean = true) => {
    setIsLoading(true);
    try {
      const data = await fetchLiveSchedule(dateStr);
      setGames(data.games);
      setLastUpdated(new Date());

      // Auto-select first game (prioritizing live game)
      if (data.games.length > 0) {
        if (!preserveSelected || !selectedGamePk || !data.games.some((g) => g.gamePk === selectedGamePk)) {
          const liveGame = data.games.find((g) => g.status.isLive);
          setSelectedGamePk(liveGame ? liveGame.gamePk : data.games[0].gamePk);
        }
      } else {
        setSelectedGamePk(null);
        setLiveFeed(null);
      }
    } catch (err) {
      console.error('Error loading schedule:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedGamePk]);

  // Fetch live feed for selected game
  const loadGameFeed = useCallback(async (gamePk: number) => {
    setIsRefreshingFeed(true);
    try {
      const feed = await fetchLiveGameFeed(gamePk);
      setLiveFeed(feed);
      setLastUpdated(new Date());
    } catch (err) {
      console.error(`Error loading live feed for ${gamePk}:`, err);
    } finally {
      setIsRefreshingFeed(false);
    }
  }, []);

  // Initial load & Date change
  useEffect(() => {
    loadSchedule(selectedDate, false);
  }, [selectedDate]);

  // Selected game change
  useEffect(() => {
    if (selectedGamePk) {
      loadGameFeed(selectedGamePk);
    }
  }, [selectedGamePk, loadGameFeed]);

  // Auto-refresh timer
  useEffect(() => {
    if (autoRefreshSec <= 0) return;

    const interval = setInterval(() => {
      loadSchedule(selectedDate, true);
      if (selectedGamePk) {
        loadGameFeed(selectedGamePk);
      }
    }, autoRefreshSec * 1000);

    return () => clearInterval(interval);
  }, [autoRefreshSec, selectedDate, selectedGamePk, loadSchedule, loadGameFeed]);

  // Date stepper handlers
  const changeDateByDays = (delta: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + delta);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  // Filtered games
  const filteredGames = games.filter((g) => {
    if (statusFilter === 'live') return g.status.isLive;
    if (statusFilter === 'final') return g.status.isFinal;
    if (statusFilter === 'scheduled') return g.status.isScheduled;
    return true;
  });

  const liveCount = games.filter((g) => g.status.isLive).length;
  const finalCount = games.filter((g) => g.status.isFinal).length;
  const scheduledCount = games.filter((g) => g.status.isScheduled).length;

  const selectedGame = games.find((g) => g.gamePk === selectedGamePk) || (games.length > 0 ? games[0] : null);

  // Weather and venue data from liveFeed or selectedGame
  const weather = liveFeed?.gameData?.weather || selectedGame?.weather;
  const venue = liveFeed?.gameData?.venue || selectedGame?.venue;
  const linescore = liveFeed?.liveData?.linescore || selectedGame?.linescore;
  const currentPlay = liveFeed?.liveData?.plays?.currentPlay;
  const allPlays = liveFeed?.liveData?.plays?.allPlays || [];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Controls Bar */}
      <div className="bg-[#0B132B]/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left: Tab Title & Live Indicator */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 via-rose-600 to-amber-600 flex items-center justify-center shadow-lg shadow-red-500/20">
              <Radio className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-wide text-white">
                  MLB LIVE MATCH CENTER
                </h1>
                {liveCount > 0 && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/50 text-red-400 text-xs font-mono font-bold animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    {liveCount} LIVE NOW
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Real-time pitch-by-pitch tracking, Sabermetric live win expectancy & Monte Carlo simulations
              </p>
            </div>
          </div>

          {/* Right: Date Picker & Auto-refresh settings */}
          <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
            {/* Date Navigator */}
            <div className="flex items-center bg-[#080E1E] border border-slate-800 rounded-lg p-1">
              <button
                onClick={() => changeDateByDays(-1)}
                className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
                title="Previous Day"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-1.5 px-2 text-slate-200 font-semibold">
                <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent text-slate-200 focus:outline-none cursor-pointer text-xs"
                />
              </div>
              <button
                onClick={() => changeDateByDays(1)}
                className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
                title="Next Day"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Auto Refresh Interval Selector */}
            <div className="flex items-center gap-1.5 bg-[#080E1E] border border-slate-800 rounded-lg px-2.5 py-1.5">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-slate-400">Auto:</span>
              <select
                value={autoRefreshSec}
                onChange={(e) => setAutoRefreshSec(Number(e.target.value))}
                className="bg-transparent text-cyan-300 font-bold focus:outline-none cursor-pointer"
              >
                <option value={10} className="bg-[#0B132B]">10s</option>
                <option value={15} className="bg-[#0B132B]">15s</option>
                <option value={30} className="bg-[#0B132B]">30s</option>
                <option value={60} className="bg-[#0B132B]">60s</option>
                <option value={0} className="bg-[#0B132B]">Off</option>
              </select>
            </div>

            {/* Manual Refresh Button */}
            <button
              onClick={() => {
                loadSchedule(selectedDate, true);
                if (selectedGamePk) loadGameFeed(selectedGamePk);
              }}
              disabled={isLoading || isRefreshingFeed}
              className="flex items-center gap-1.5 bg-gradient-to-r from-blue-600/30 to-cyan-500/20 hover:from-blue-600/50 hover:to-cyan-500/40 text-cyan-300 border border-cyan-500/40 px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading || isRefreshingFeed ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Status Filter Chips */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold font-mono transition-all ${
                statusFilter === 'all'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'bg-[#080E1E] text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              All Matches ({games.length})
            </button>
            <button
              onClick={() => setStatusFilter('live')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold font-mono transition-all ${
                statusFilter === 'live'
                  ? 'bg-red-500/20 text-red-300 border border-red-500/50 shadow-sm'
                  : 'bg-[#080E1E] text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              Live ({liveCount})
            </button>
            <button
              onClick={() => setStatusFilter('final')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold font-mono transition-all ${
                statusFilter === 'final'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-[#080E1E] text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              Final ({finalCount})
            </button>
            <button
              onClick={() => setStatusFilter('scheduled')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold font-mono transition-all ${
                statusFilter === 'scheduled'
                  ? 'bg-slate-700/60 text-slate-200 border border-slate-600'
                  : 'bg-[#080E1E] text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              Scheduled ({scheduledCount})
            </button>
          </div>

          <div className="text-[11px] font-mono text-slate-500">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Feature 1: Scoreboard Games Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-xs font-bold font-mono uppercase text-slate-300">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span>Scoreboard ({filteredGames.length} Matches)</span>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">
            Click any match card to open Live Center
          </span>
        </div>

        {isLoading && games.length === 0 ? (
          <div className="p-12 text-center bg-[#0B132B]/50 rounded-xl border border-slate-800">
            <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto mb-2" />
            <p className="text-xs font-mono text-slate-400">Fetching live games from MLB Stats API...</p>
          </div>
        ) : filteredGames.length === 0 ? (
          <div className="p-8 text-center bg-[#0B132B]/50 rounded-xl border border-slate-800 text-slate-400 text-xs font-mono">
            <AlertCircle className="w-6 h-6 text-slate-500 mx-auto mb-2" />
            No matches found for the selected filter or date ({selectedDate}).
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
            {filteredGames.map((game) => (
              <LiveScoreboardCard
                key={game.gamePk}
                game={game}
                isSelected={selectedGamePk === game.gamePk}
                onSelect={(g) => setSelectedGamePk(g.gamePk)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Selected Game Live Center */}
      {selectedGame && (
        <div className="space-y-6 pt-2">
          {/* Match Banner */}
          <div className="bg-[#0B132B] border border-slate-800 rounded-2xl p-5 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

            {/* Banner Header: Venue & Status */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800 text-xs font-mono">
              <div className="flex items-center gap-4 text-slate-400">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-slate-200">{venue?.name || 'MLB Ballpark'}</span>
                </div>
                {weather?.temp && (
                  <div className="flex items-center gap-1.5 hidden sm:flex">
                    <CloudSun className="w-3.5 h-3.5 text-amber-400" />
                    <span>{weather.temp}°F, {weather.condition} • Wind: {weather.wind}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-cyan-400 font-bold">
                  {formatInningState(linescore, selectedGame.status.detailedState)}
                </span>
                {selectedGame.status.isLive && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 text-[10px] font-bold animate-pulse">
                    LIVE
                  </span>
                )}
              </div>
            </div>

            {/* Big Score Header */}
            <div className="py-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              {/* Away Team */}
              <div className="flex items-center justify-between md:justify-start gap-4">
                <div>
                  <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    {selectedGame.teams.away.name}
                  </div>
                  <div className="text-xs font-mono text-slate-400">
                    Away ({selectedGame.teams.away.wins}-{selectedGame.teams.away.losses})
                  </div>
                  {selectedGame.teams.away.probablePitcher && (
                    <div className="text-[11px] font-mono text-cyan-400 mt-1">
                      SP: {selectedGame.teams.away.probablePitcher.fullName}
                    </div>
                  )}
                </div>
                <div className="text-4xl sm:text-5xl font-black font-mono text-cyan-300 bg-[#080E1E] px-4 py-2 rounded-xl border border-slate-800">
                  {selectedGame.status.isScheduled ? '-' : (selectedGame.teams.away.score ?? 0)}
                </div>
              </div>

              {/* VS & Match State Badge */}
              <div className="flex flex-col items-center justify-center text-center">
                <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest mb-1">
                  MATCHUP
                </span>
                <span className="text-xl font-mono font-black text-slate-300">
                  VS
                </span>
                <span className="mt-2 text-[11px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800/50 px-2.5 py-0.5 rounded-full">
                  LIVE AI PREDICTIONS ACTIVE
                </span>
              </div>

              {/* Home Team */}
              <div className="flex items-center justify-between md:justify-end gap-4 flex-row-reverse md:flex-row">
                <div className="text-4xl sm:text-5xl font-black font-mono text-amber-300 bg-[#080E1E] px-4 py-2 rounded-xl border border-slate-800">
                  {selectedGame.status.isScheduled ? '-' : (selectedGame.teams.home.score ?? 0)}
                </div>
                <div className="text-right">
                  <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    {selectedGame.teams.home.name}
                  </div>
                  <div className="text-xs font-mono text-slate-400">
                    Home ({selectedGame.teams.home.wins}-{selectedGame.teams.home.losses})
                  </div>
                  {selectedGame.teams.home.probablePitcher && (
                    <div className="text-[11px] font-mono text-amber-400 mt-1">
                      SP: {selectedGame.teams.home.probablePitcher.fullName}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Core Feature: Live Betting & AI Prediction Intelligence (MNL, O/U Totals, Handicap, AI Advice) */}
          <LiveBettingPredictionCard
            game={selectedGame}
            liveFeed={liveFeed}
          />

          {/* 2-Column Live Match Center */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Live Diamond Tracker & Win Probability */}
            <div className="lg:col-span-6 space-y-6">
              {/* Feature 2: Sơ đồ sân bóng trực tiếp */}
              <LiveDiamondTracker
                linescore={linescore}
                currentPlay={currentPlay}
                statusDetailed={selectedGame.status.detailedState}
                isLive={selectedGame.status.isLive}
              />

              {/* Feature 5: Live Sabermetric Win Probability Bar */}
              <LiveWinProbabilityCard
                game={selectedGame}
              />
            </div>

            {/* Right Column: Linescore Table & Play-by-Play Feed */}
            <div className="lg:col-span-6 space-y-6">
              {/* Feature 3: Bảng điểm chi tiết 9 hiệp */}
              <LiveLinescoreTable game={selectedGame} />

              {/* Feature 4: Nhật ký diễn biến trực tiếp */}
              <LivePlayByPlayFeed plays={allPlays} currentPlay={currentPlay} />
            </div>
          </div>

          {/* Feature 6: Live Player Boxscore & Lineups */}
          <LivePlayerBoxscore
            game={selectedGame}
            liveFeed={liveFeed}
          />
        </div>
      )}
    </div>
  );
};
