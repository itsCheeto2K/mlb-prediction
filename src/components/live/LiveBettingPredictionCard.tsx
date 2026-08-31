import React, { useState, useEffect } from 'react';
import { LiveGameSummary, LiveGameFeed, LiveBoxscorePlayer } from '../../types/liveGame';
import { calculateLiveBettingAnalysis, formatInningState } from '../../services/liveGameApi';
import { runPrediction } from '../../services/predictionApi';
import { getLiveSportsbookOddsForGame, LiveSportsbookOdds } from '../../services/sharpApi';
import { PredictionResult, PredictionPitcherPayload, PredictionBatterPayload } from '../../types/prediction';
import {
  TrendingUp,
  Sparkles,
  Scale,
  DollarSign,
  Cpu,
  RefreshCw,
  Award,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Sliders,
  Wallet,
  Zap,
  Target,
  Radio
} from 'lucide-react';

interface LiveBettingPredictionCardProps {
  game: LiveGameSummary;
  liveFeed?: LiveGameFeed | null;
}

export const LiveBettingPredictionCard: React.FC<LiveBettingPredictionCardProps> = ({
  game,
  liveFeed
}) => {
  const [isSimulating, setIsSimulating] = useState(false);
  const [simResult, setSimResult] = useState<PredictionResult | null>(null);
  const [showSimDetails, setShowSimDetails] = useState(true);
  const [showMarketPanel, setShowMarketPanel] = useState(false);

  // SharpAPI Live Sportsbook Data (Syncs MNL, Totals, Handicap)
  const [sharpOdds, setSharpOdds] = useState<LiveSportsbookOdds | null>(null);
  const [isFetchingSharpOdds, setIsFetchingSharpOdds] = useState(false);

  // User Market Odds & Bankroll Inputs
  const [marketTotalLine, setMarketTotalLine] = useState<string>('8.5');
  const [marketOverOdds, setMarketOverOdds] = useState<string>('-110');
  const [marketUnderOdds, setMarketUnderOdds] = useState<string>('-110');
  const [marketHomeOdds, setMarketHomeOdds] = useState<string>('-135');
  const [marketAwayOdds, setMarketAwayOdds] = useState<string>('+115');
  const [bankroll, setBankroll] = useState<number>(1000);
  const [maxStakePct, setMaxStakePct] = useState<number>(1.5);

  const betting = calculateLiveBettingAnalysis(game, liveFeed);
  const awayTeam = game.teams.away;
  const homeTeam = game.teams.home;
  const linescore = liveFeed?.liveData?.linescore || game.linescore;

  // Auto-fetch Real Sportsbook Odds from SharpAPI (DraftKings/FanDuel: MNL, Totals, Runline)
  const refreshSharpOdds = async () => {
    setIsFetchingSharpOdds(true);
    try {
      const odds = await getLiveSportsbookOddsForGame(
        homeTeam.name,
        awayTeam.name,
        homeTeam.abbreviation,
        awayTeam.abbreviation
      );
      if (odds) {
        setSharpOdds(odds);
        // 1. Sync Moneyline
        if (odds.moneyline) {
          setMarketHomeOdds(odds.moneyline.homeOdds > 0 ? `+${odds.moneyline.homeOdds}` : `${odds.moneyline.homeOdds}`);
          setMarketAwayOdds(odds.moneyline.awayOdds > 0 ? `+${odds.moneyline.awayOdds}` : `${odds.moneyline.awayOdds}`);
        }
        // 2. Sync Totals (O/U Line & Odds)
        if (odds.totalRuns) {
          setMarketTotalLine(odds.totalRuns.line.toString());
          setMarketOverOdds(odds.totalRuns.overOdds > 0 ? `+${odds.totalRuns.overOdds}` : `${odds.totalRuns.overOdds}`);
          setMarketUnderOdds(odds.totalRuns.underOdds > 0 ? `+${odds.totalRuns.underOdds}` : `${odds.totalRuns.underOdds}`);
        }
      }
    } catch (err) {
      console.warn('Error fetching SharpAPI live odds:', err);
    } finally {
      setIsFetchingSharpOdds(false);
    }
  };

  useEffect(() => {
    refreshSharpOdds();
  }, [game.gamePk, homeTeam.name, awayTeam.name, homeTeam.abbreviation, awayTeam.abbreviation]);

  // Convert American Odds to Implied Probability (0 to 1)
  const americanToImplied = (american: number): number => {
    if (isNaN(american) || american === 0) return 0.5;
    if (american > 0) return 100 / (american + 100);
    return Math.abs(american) / (Math.abs(american) + 100);
  };

  // Convert American Odds to Decimal Multiplier (b = decimal - 1)
  const americanToDecimalB = (american: number): number => {
    if (isNaN(american) || american === 0) return 1.0;
    if (american > 0) return american / 100.0;
    return 100.0 / Math.abs(american);
  };

  // Calculate Kelly Criterion Suggested Stake
  const calculateKellyStake = (modelProb: number, americanOdds: number): { stakeDollars: number; stakePct: number; edgePct: number } => {
    const implied = americanToImplied(americanOdds);
    const edgePct = (modelProb - implied) * 100;
    if (edgePct <= 0) return { stakeDollars: 0, stakePct: 0, edgePct: Number(edgePct.toFixed(1)) };

    const b = americanToDecimalB(americanOdds);
    const q = 1 - modelProb;
    // Kelly fraction f* = (b*p - q) / b
    const rawKelly = (b * modelProb - q) / b;
    // Use conservative quarter-Kelly capped by user maxStakePct
    const fractionalKellyPct = Math.min(maxStakePct, Math.max(0.2, (rawKelly * 25)));
    const stakeDollars = Math.round((bankroll * fractionalKellyPct) / 100);

    return {
      stakeDollars,
      stakePct: Number(fractionalKellyPct.toFixed(1)),
      edgePct: Number(edgePct.toFixed(1))
    };
  };

  // Model Probabilities
  const homeModelProb = (simResult?.homeWinProb ?? (betting.moneyline.homeProb / 100));
  const awayModelProb = (simResult?.awayWinProb ?? (betting.moneyline.awayProb / 100));

  const homeParsedOdds = parseInt(marketHomeOdds, 10) || -110;
  const awayParsedOdds = parseInt(marketAwayOdds, 10) || 100;
  const parsedTotalLine = parseFloat(marketTotalLine) || (sharpOdds?.totalRuns?.line ?? 8.5);
  const overParsedOdds = parseInt(marketOverOdds, 10) || (sharpOdds?.totalRuns?.overOdds ?? -110);
  const underParsedOdds = parseInt(marketUnderOdds, 10) || (sharpOdds?.totalRuns?.underOdds ?? -110);

  const homeKelly = calculateKellyStake(homeModelProb, homeParsedOdds);
  const awayKelly = calculateKellyStake(awayModelProb, awayParsedOdds);

  // Total runs edge calculation
  const modelTotalRuns = simResult?.totalExpectedRuns ?? betting.totals.projectedTotal;
  const totalRunsDiff = modelTotalRuns - parsedTotalLine;

  const getConfidenceBadge = (conf: 'HIGH' | 'MEDIUM' | 'LOW') => {
    if (conf === 'HIGH') {
      return (
        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-bold">
          HIGH CONFIDENCE
        </span>
      );
    }
    if (conf === 'MEDIUM') {
      return (
        <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-mono font-bold">
          MEDIUM CONFIDENCE
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 text-[10px] font-mono">
        LOW CONFIDENCE
      </span>
    );
  };

  // Run 10,000 Live Resume Monte Carlo Simulation with real in-game state
  const handleRunCppEngine = async () => {
    setIsSimulating(true);
    try {
      const currentInning = linescore?.currentInning || 1;
      const isTop = linescore?.isTopInning ?? (linescore?.inningHalf === 'Top' || linescore?.inningState === 'Top');
      const inningHalf = isTop ? 'top' : 'bottom';
      const outs = linescore?.outs ?? 0;
      const currentHomeRuns = game.teams.home.score ?? 0;
      const currentAwayRuns = game.teams.away.score ?? 0;

      const runner1st = Boolean(linescore?.offense?.first);
      const runner2nd = Boolean(linescore?.offense?.second);
      const runner3rd = Boolean(linescore?.offense?.third);

      // Extract Active Pitchers from Live Boxscore if available
      const boxAwayPitchers = liveFeed?.liveData?.boxscore?.teams?.away?.players;
      const boxHomePitchers = liveFeed?.liveData?.boxscore?.teams?.home?.players;

      const getActivePitcherStats = (teamPlayers?: Record<string, LiveBoxscorePlayer>, defName: string = 'Pitcher') => {
        if (teamPlayers) {
          for (const key in teamPlayers) {
            const p = teamPlayers[key];
            if (p.stats?.pitching && (p.stats.pitching.inningsPitched || p.stats.pitching.pitchesThrown)) {
              const eraNum = parseFloat(p.stats.pitching.era || p.seasonStats?.pitching?.era || '3.80');
              const whipNum = parseFloat(p.seasonStats?.pitching?.whip || '1.20');
              return {
                id: p.person.id,
                name: p.person.fullName,
                batHand: 'R',
                throwHand: 'R',
                inningsPitched: parseFloat(p.stats.pitching.inningsPitched || '5.0'),
                era: isNaN(eraNum) ? 3.80 : eraNum,
                whip: isNaN(whipNum) ? 1.20 : whipNum,
                k9: 8.9,
                bb9: 2.8,
                hr9: 1.05,
                wins: p.seasonStats?.pitching?.wins || 8,
                losses: p.seasonStats?.pitching?.losses || 5,
                strikeouts: p.stats.pitching.strikeOuts || 5,
                hitBatsmen: 4,
                fipConstant: 3.15
              };
            }
          }
        }
        return {
          id: 2001,
          name: defName,
          batHand: 'R',
          throwHand: 'R',
          inningsPitched: 120.0,
          era: 3.85,
          whip: 1.22,
          k9: 8.8,
          bb9: 2.9,
          hr9: 1.1,
          wins: 10,
          losses: 7,
          strikeouts: 120,
          hitBatsmen: 5,
          fipConstant: 3.15
        };
      };

      const homePitcherPayload: PredictionPitcherPayload = getActivePitcherStats(boxHomePitchers, game.teams.home.probablePitcher?.fullName || 'Home Pitcher');
      const awayPitcherPayload: PredictionPitcherPayload = getActivePitcherStats(boxAwayPitchers, game.teams.away.probablePitcher?.fullName || 'Away Pitcher');

      const makeLineupPayload = (teamAbbr: string): PredictionBatterPayload[] =>
        Array.from({ length: 9 }, (_, i) => ({
          id: i + 100,
          name: `${teamAbbr} Batter #${i + 1}`,
          batHand: 'R',
          throwHand: 'R',
          order: i + 1,
          atBats: 440,
          hits: 115,
          doubles: 22,
          triples: 2,
          homeRuns: 16,
          walks: 42,
          strikeouts: 96,
          avg: 0.261,
          obp: 0.332,
          slg: 0.430,
          ops: 0.762
        }));

      const payload = {
        homeTeamName: homeTeam.name,
        homeTeamAbbr: homeTeam.abbreviation,
        homeParkFactor: homeTeam.parkFactor || 1.02,
        homeBullpenEra: 3.80,
        homeBullpenWhip: 1.22,
        awayTeamName: awayTeam.name,
        awayTeamAbbr: awayTeam.abbreviation,
        awayBullpenEra: 3.85,
        awayBullpenWhip: 1.24,
        homePitcher: [homePitcherPayload],
        awayPitcher: [awayPitcherPayload],
        homeBatters: makeLineupPayload(homeTeam.abbreviation),
        awayBatters: makeLineupPayload(awayTeam.abbreviation),
        simulations: 10000,

        // Live Resume Simulation parameters
        isLiveSimulation: game.status.isLive,
        isLive: game.status.isLive,
        currentInning,
        inningHalf,
        outs,
        currentHomeRuns,
        currentAwayRuns,
        nextBatterIndexHome: 0,
        nextBatterIndexAway: 0,
        runner1st,
        runner2nd,
        runner3rd,

        // Market Comparison
        marketTotalLine: parsedTotalLine,
        marketHomeOdds: homeParsedOdds,
        marketAwayOdds: awayParsedOdds
      };

      const res = await runPrediction(payload);
      setSimResult(res);
      setShowSimDetails(true);
    } catch (err) {
      console.warn('Simulation error:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="bg-[#0B132B] border border-cyan-500/30 rounded-2xl p-4 sm:p-5 shadow-2xl space-y-5 relative overflow-hidden">
      {/* Top Background Glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-md shadow-cyan-500/20">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-black tracking-wide text-white">
                LIVE PREDICTION & BETTING INTELLIGENCE
              </h2>
              {sharpOdds ? (
                <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/50">
                  <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                  {sharpOdds.sportsbook.toUpperCase()} LIVE SYNCED (MNL • TOTALS • RUNLINE)
                </span>
              ) : (
                <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-700/40">
                  SHARPAPI LIVE STREAM
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              Live Resume Monte Carlo • {sharpOdds?.sportsbook || 'FanDuel / DraftKings'} Real Odds • +EV Edge & Kelly Bet Sizing
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Refresh SharpAPI Odds Button */}
          <button
            onClick={refreshSharpOdds}
            disabled={isFetchingSharpOdds}
            title="Sync latest live odds from SharpAPI"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetchingSharpOdds ? 'animate-spin text-cyan-400' : ''}`} />
            <span className="hidden sm:inline">{isFetchingSharpOdds ? 'Syncing...' : 'Sync All Odds'}</span>
          </button>

          {/* Toggle Market Odds Settings Panel */}
          <button
            onClick={() => setShowMarketPanel(!showMarketPanel)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all border ${
              showMarketPanel
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                : 'bg-slate-800/80 text-slate-300 hover:text-white border-slate-700'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{showMarketPanel ? 'Close Odds Panel' : 'Market Odds'}</span>
          </button>

          {/* Run C++ Engine */}
          <button
            onClick={handleRunCppEngine}
            disabled={isSimulating}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-blue-600/30 to-cyan-500/20 hover:from-blue-600/50 hover:to-cyan-500/40 text-cyan-300 border border-cyan-500/40 text-xs font-mono font-bold transition-all shadow-sm shrink-0"
          >
            <Cpu className={`w-3.5 h-3.5 text-cyan-400 ${isSimulating ? 'animate-spin' : ''}`} />
            <span>{isSimulating ? 'Simulating 10,000 Games...' : '10,000 Live C++ Sim'}</span>
          </button>
        </div>
      </div>

      {/* Market Odds Input & Bankroll Management Panel (Expandable) */}
      {showMarketPanel && (
        <div className="p-4 rounded-xl bg-[#080E1E] border border-amber-500/40 space-y-4 shadow-inner">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-300">
              <Sliders className="w-4 h-4 text-amber-400" />
              <span>KÈO NHÀ CÁI {sharpOdds?.sportsbook ? `(${sharpOdds.sportsbook.toUpperCase()})` : '(SHARPAPI)'} & QUẢN LÝ VỐN</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              Tự động đồng bộ Moneyline, Totals O/U, Handicap từ SharpAPI
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
            {/* Moneyline Inputs */}
            <div className="p-2.5 rounded-lg bg-[#0B132B] border border-slate-800 space-y-1.5">
              <label className="text-[11px] font-bold text-slate-300 block">Market Moneyline (ML)</label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-slate-500 block">{awayTeam.abbreviation} (Away)</span>
                  <input
                    type="text"
                    value={marketAwayOdds}
                    onChange={(e) => setMarketAwayOdds(e.target.value)}
                    className="w-full bg-[#080E1E] border border-slate-700 rounded px-2 py-1 text-cyan-300 font-bold focus:outline-none focus:border-cyan-400 text-xs"
                    placeholder="+115"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">{homeTeam.abbreviation} (Home)</span>
                  <input
                    type="text"
                    value={marketHomeOdds}
                    onChange={(e) => setMarketHomeOdds(e.target.value)}
                    className="w-full bg-[#080E1E] border border-slate-700 rounded px-2 py-1 text-amber-300 font-bold focus:outline-none focus:border-amber-400 text-xs"
                    placeholder="-135"
                  />
                </div>
              </div>
            </div>

            {/* Total Line & Odds */}
            <div className="p-2.5 rounded-lg bg-[#0B132B] border border-slate-800 space-y-1.5">
              <label className="text-[11px] font-bold text-slate-300 block">Market Total (O/U)</label>
              <div className="grid grid-cols-3 gap-1.5">
                <div>
                  <span className="text-[10px] text-slate-500 block">Line</span>
                  <input
                    type="text"
                    value={marketTotalLine}
                    onChange={(e) => setMarketTotalLine(e.target.value)}
                    className="w-full bg-[#080E1E] border border-slate-700 rounded px-1.5 py-1 text-white font-bold focus:outline-none focus:border-cyan-400 text-xs"
                    placeholder="8.5"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Over</span>
                  <input
                    type="text"
                    value={marketOverOdds}
                    onChange={(e) => setMarketOverOdds(e.target.value)}
                    className="w-full bg-[#080E1E] border border-slate-700 rounded px-1.5 py-1 text-emerald-300 font-bold focus:outline-none focus:border-emerald-400 text-xs"
                    placeholder="-110"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Under</span>
                  <input
                    type="text"
                    value={marketUnderOdds}
                    onChange={(e) => setMarketUnderOdds(e.target.value)}
                    className="w-full bg-[#080E1E] border border-slate-700 rounded px-1.5 py-1 text-indigo-300 font-bold focus:outline-none focus:border-indigo-400 text-xs"
                    placeholder="-110"
                  />
                </div>
              </div>
            </div>

            {/* Bankroll & Kelly Limit */}
            <div className="p-2.5 rounded-lg bg-[#0B132B] border border-slate-800 space-y-1.5">
              <label className="text-[11px] font-bold text-slate-300 block">Bankroll ($) & Kelly %</label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-slate-500 block">Bankroll ($)</span>
                  <input
                    type="number"
                    value={bankroll}
                    onChange={(e) => setBankroll(Number(e.target.value))}
                    className="w-full bg-[#080E1E] border border-slate-700 rounded px-2 py-1 text-emerald-400 font-bold focus:outline-none focus:border-emerald-400 text-xs"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Max Stake %</span>
                  <input
                    type="number"
                    step="0.5"
                    value={maxStakePct}
                    onChange={(e) => setMaxStakePct(Number(e.target.value))}
                    className="w-full bg-[#080E1E] border border-slate-700 rounded px-2 py-1 text-amber-300 font-bold focus:outline-none focus:border-amber-400 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Quick Summary / Trigger */}
            <div className="p-2.5 rounded-lg bg-cyan-950/40 border border-cyan-800/50 flex flex-col justify-between">
              <div className="text-[10px] text-cyan-300 leading-tight">
                Odds từ <strong>{sharpOdds?.sportsbook || 'FanDuel/DraftKings'}</strong> được tự động đối chiếu với Model để tính <strong>+EV Edge</strong> và <strong>Số tiền cược Kelly</strong>.
              </div>
              <button
                onClick={handleRunCppEngine}
                disabled={isSimulating}
                className="w-full mt-1.5 py-1 px-2 rounded bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs transition-colors"
              >
                Tính Lại +EV Edge
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Best Value Banner with Live Edge & Kelly Bet Sizing */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-950/60 via-blue-950/40 to-[#0E172F] border border-cyan-500/40 shadow-lg">
        <div className="flex items-start gap-3">
          <Award className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1.5 text-xs flex-1">
            <div className="font-bold text-amber-300 uppercase tracking-wider text-[11px] flex items-center justify-between">
              <span>LỜI KHUYÊN BETTING LIVE (AI REAL-TIME VALUE INTELLIGENCE):</span>
              {homeKelly.edgePct > 0 || awayKelly.edgePct > 0 ? (
                <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-700/50">
                  <Zap className="w-3 h-3 text-emerald-400" />
                  +EV EDGE PHÁT HIỆN
                </span>
              ) : null}
            </div>

            <div className="text-sm font-extrabold text-white">
              {simResult?.edgeVsMarket?.hasMarketData
                ? (simResult.edgeVsMarket.mlSignal !== 'Fair Market Price'
                    ? `🔥 ${simResult.edgeVsMarket.mlSignal} • ${simResult.edgeVsMarket.totalSignal}`
                    : simResult.recommendation)
                : betting.liveAdvice.bestValueBet}
            </div>

            {/* Kelly Bet Sizing Recommendation if Edge found */}
            <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-slate-800/80 text-[11px] font-mono">
              {homeKelly.edgePct > 2.0 && (
                <div className="flex items-center gap-1.5 text-emerald-300 bg-[#080E1E] px-2.5 py-1 rounded border border-emerald-800/40">
                  <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Cược khuyến nghị: <strong>${homeKelly.stakeDollars} ({homeKelly.stakePct}% vốn)</strong> vào {homeTeam.abbreviation} ML</span>
                </div>
              )}
              {awayKelly.edgePct > 2.0 && (
                <div className="flex items-center gap-1.5 text-cyan-300 bg-[#080E1E] px-2.5 py-1 rounded border border-cyan-800/40">
                  <Wallet className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Cược khuyến nghị: <strong>${awayKelly.stakeDollars} ({awayKelly.stakePct}% vốn)</strong> vào {awayTeam.abbreviation} ML</span>
                </div>
              )}
              {Math.abs(totalRunsDiff) >= 0.6 && (
                <div className="flex items-center gap-1.5 text-amber-300 bg-[#080E1E] px-2.5 py-1 rounded border border-amber-800/40">
                  <Target className="w-3.5 h-3.5 text-amber-400" />
                  <span>Total Edge: <strong>{totalRunsDiff > 0 ? 'OVER' : 'UNDER'} {parsedTotalLine}</strong> (Lệch {Math.abs(totalRunsDiff).toFixed(1)} Runs vs {sharpOdds?.sportsbook || 'Market'})</span>
                </div>
              )}
            </div>

            <div className="text-slate-300 text-xs leading-relaxed pt-1">
              {betting.liveAdvice.gameContext} {betting.liveAdvice.actionableAdvice}
            </div>
          </div>
        </div>
      </div>

      {/* 3 Main Betting Modules: MNL, TOTAL, HANDICAP */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Module 1: Moneyline (MNL) */}
        <div className="p-4 rounded-xl bg-[#080E1E] border border-slate-800 hover:border-cyan-500/40 transition-all flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold uppercase font-mono text-slate-200">1. Moneyline (MNL)</span>
              </div>
              {getConfidenceBadge(betting.moneyline.confidence)}
            </div>

            {/* Odds & Edge display */}
            <div className="space-y-2 font-mono text-xs">
              <div className="p-2 rounded bg-[#0B132B] border border-slate-800/80">
                <div className="flex justify-between items-center">
                  <span className="text-slate-300 font-bold">{awayTeam.abbreviation} (Away)</span>
                  <div className="text-right">
                    <span className="font-bold text-cyan-400">{Math.round(awayModelProb * 100)}%</span>
                    <span className="text-[10px] text-slate-400 ml-1.5">(Fair: {betting.moneyline.awayOdds})</span>
                  </div>
                </div>
                {awayKelly.edgePct !== 0 && (
                  <div className="mt-1 flex justify-between items-center text-[10px] pt-1 border-t border-slate-800">
                    <span className="text-slate-500">Vs {sharpOdds?.sportsbook || 'Market'} {marketAwayOdds}:</span>
                    <span className={awayKelly.edgePct > 0 ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                      {awayKelly.edgePct > 0 ? `+${awayKelly.edgePct}% EV Edge` : `${awayKelly.edgePct}% Edge`}
                    </span>
                  </div>
                )}
              </div>

              <div className="p-2 rounded bg-[#0B132B] border border-slate-800/80">
                <div className="flex justify-between items-center">
                  <span className="text-slate-300 font-bold">{homeTeam.abbreviation} (Home)</span>
                  <div className="text-right">
                    <span className="font-bold text-amber-400">{Math.round(homeModelProb * 100)}%</span>
                    <span className="text-[10px] text-slate-400 ml-1.5">(Fair: {betting.moneyline.homeOdds})</span>
                  </div>
                </div>
                {homeKelly.edgePct !== 0 && (
                  <div className="mt-1 flex justify-between items-center text-[10px] pt-1 border-t border-slate-800">
                    <span className="text-slate-500">Vs {sharpOdds?.sportsbook || 'Market'} {marketHomeOdds}:</span>
                    <span className={homeKelly.edgePct > 0 ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                      {homeKelly.edgePct > 0 ? `+${homeKelly.edgePct}% EV Edge` : `${homeKelly.edgePct}% Edge`}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/80">
            <span className="text-[10px] font-mono uppercase text-slate-400 block">AI Pick Recommendation:</span>
            <div className="text-xs font-bold text-emerald-400 font-mono mt-0.5">
              👉 {homeModelProb >= awayModelProb ? `${homeTeam.abbreviation} ML` : `${awayTeam.abbreviation} ML`} ({Math.round(Math.max(homeModelProb, awayModelProb) * 100)}% Prob)
            </div>
          </div>
        </div>

        {/* Module 2: Over/Under Totals (O/U) */}
        <div className="p-4 rounded-xl bg-[#080E1E] border border-slate-800 hover:border-amber-500/40 transition-all flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold uppercase font-mono text-slate-200">2. Total Runs (O/U)</span>
              </div>
              {getConfidenceBadge(betting.totals.confidence)}
            </div>

            {/* Synced Sportsbook Total Line Badge */}
            {sharpOdds?.totalRuns ? (
              <div className="p-2 rounded bg-amber-950/30 border border-amber-500/50 mb-2 font-mono text-xs flex justify-between items-center">
                <div>
                  <span className="text-[10px] text-amber-400 font-bold block">{sharpOdds.sportsbook.toUpperCase()} LIVE LINE</span>
                  <span className="text-white font-black text-sm">Line {sharpOdds.totalRuns.line}</span>
                </div>
                <div className="text-right text-[11px]">
                  <span className="text-emerald-300 font-bold block">Over: {sharpOdds.totalRuns.overOdds > 0 ? `+${sharpOdds.totalRuns.overOdds}` : sharpOdds.totalRuns.overOdds}</span>
                  <span className="text-indigo-300 font-bold block">Under: {sharpOdds.totalRuns.underOdds > 0 ? `+${sharpOdds.totalRuns.underOdds}` : sharpOdds.totalRuns.underOdds}</span>
                </div>
              </div>
            ) : (
              <div className="text-[11px] font-mono text-slate-400 mb-2 flex justify-between">
                <span>Current: <strong className="text-white">{betting.totals.currentRuns}</strong></span>
                <span>Model Total: <strong className="text-amber-300">{modelTotalRuns.toFixed(1)}</strong></span>
              </div>
            )}

            {/* Total Lines Table */}
            <div className="space-y-1.5 font-mono text-xs max-h-28 overflow-y-auto">
              {betting.totals.lines.map((l) => (
                <div
                  key={l.line}
                  className={`p-1.5 rounded flex justify-between items-center text-[11px] border ${
                    l.line === parsedTotalLine
                      ? 'bg-amber-950/40 border-amber-500/60 text-white shadow-sm'
                      : l.recommendation !== 'PASS'
                      ? 'bg-amber-950/20 border-amber-500/30 text-white'
                      : 'bg-[#0B132B] border-slate-800/60 text-slate-300'
                  }`}
                >
                  <span className="font-bold flex items-center gap-1">
                    Line {l.line}
                    {l.line === parsedTotalLine && (
                      <span className="text-[8px] bg-amber-500 text-black font-black px-1 rounded">
                        {sharpOdds?.sportsbook ? sharpOdds.sportsbook.toUpperCase() : 'MARKET'}
                      </span>
                    )}
                  </span>
                  <div className="flex gap-2">
                    <span className={l.recommendation === 'OVER' ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                      O: {Math.round(l.overProb * 100)}%
                    </span>
                    <span className={l.recommendation === 'UNDER' ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                      U: {Math.round(l.underProb * 100)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/80">
            <span className="text-[10px] font-mono uppercase text-slate-400 block">AI Pick Recommendation:</span>
            <div className="text-xs font-bold text-amber-300 font-mono mt-0.5">
              👉 {modelTotalRuns > parsedTotalLine ? 'OVER' : 'UNDER'} {parsedTotalLine} (Model: {modelTotalRuns.toFixed(1)} Runs)
            </div>
          </div>
        </div>

        {/* Module 3: Handicap / Run Line Spread */}
        <div className="p-4 rounded-xl bg-[#080E1E] border border-slate-800 hover:border-indigo-500/40 transition-all flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold uppercase font-mono text-slate-200">3. Handicap (Runline)</span>
              </div>
              {getConfidenceBadge(betting.handicap.confidence)}
            </div>

            {/* Synced Sportsbook Runline Badge */}
            {sharpOdds?.runLine ? (
              <div className="p-2 rounded bg-indigo-950/30 border border-indigo-500/50 mb-2 font-mono text-xs flex justify-between items-center">
                <div>
                  <span className="text-[10px] text-indigo-300 font-bold block">{sharpOdds.sportsbook.toUpperCase()} LIVE SPREAD</span>
                  <span className="text-white font-black text-xs">{homeTeam.abbreviation} ±{sharpOdds.runLine.spread}</span>
                </div>
                <div className="text-right text-[11px]">
                  <span className="text-emerald-300 font-bold block">{homeTeam.abbreviation}: {sharpOdds.runLine.homeOdds > 0 ? `+${sharpOdds.runLine.homeOdds}` : sharpOdds.runLine.homeOdds}</span>
                  <span className="text-cyan-300 font-bold block">{awayTeam.abbreviation}: {sharpOdds.runLine.awayOdds > 0 ? `+${sharpOdds.runLine.awayOdds}` : sharpOdds.runLine.awayOdds}</span>
                </div>
              </div>
            ) : null}

            <div className="space-y-2 font-mono text-xs">
              <div className="flex justify-between items-center p-2 rounded bg-[#0B132B] border border-slate-800/80">
                <span className="text-slate-300 font-bold">{homeTeam.abbreviation} -1.5</span>
                <div className="text-right">
                  <span className="font-bold text-emerald-400">{Math.round(betting.handicap.homeCoverProb * 100)}%</span>
                  <span className="text-[10px] text-slate-400 ml-1.5">({betting.handicap.lines[0]?.odds})</span>
                </div>
              </div>

              <div className="flex justify-between items-center p-2 rounded bg-[#0B132B] border border-slate-800/80">
                <span className="text-slate-300 font-bold">{awayTeam.abbreviation} +1.5</span>
                <div className="text-right">
                  <span className="font-bold text-indigo-300">{Math.round(betting.handicap.awayCoverProb * 100)}%</span>
                  <span className="text-[10px] text-slate-400 ml-1.5">({betting.handicap.lines[1]?.odds})</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/80">
            <span className="text-[10px] font-mono uppercase text-slate-400 block">AI Pick Recommendation:</span>
            <div className="text-xs font-bold text-indigo-300 font-mono mt-0.5">
              👉 {betting.handicap.pick}
            </div>
          </div>
        </div>
      </div>

      {/* Strategic Sabermetric Breakdown */}
      <div className="p-3.5 bg-[#080E1E]/80 rounded-xl border border-slate-800/60 text-xs font-mono text-slate-300 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-cyan-400" />
          <span><strong>Pitcher / Bullpen Context:</strong> {betting.liveAdvice.bullpenFactor}</span>
        </div>
        <span className="text-[10px] text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
          {betting.moneyline.edge}
        </span>
      </div>

      {/* C++ Monte Carlo Live In-Game Simulation Result Dropdown */}
      {simResult && (
        <div className="p-4 rounded-xl bg-[#080E1E] border border-cyan-500/40 space-y-3">
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() => setShowSimDetails(!showSimDetails)}
          >
            <div className="flex items-center gap-2 text-xs font-bold font-mono text-cyan-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>
                {simResult.isLiveSimulation ? 'Live Resume Simulation Completed' : 'Simulation Completed'} (10,000 Monte Carlo - C++20 Engine)
              </span>
            </div>
            <button className="text-slate-400 hover:text-white">
              {showSimDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          {showSimDetails && (
            <div className="space-y-4 pt-3 border-t border-slate-800 text-xs font-mono">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                <div className="p-2 rounded bg-[#0B132B]">
                  <span className="text-slate-400 text-[10px]">{awayTeam.abbreviation} Projected Runs</span>
                  <div className="text-base font-bold text-white">{simResult.awayExpectedRuns.toFixed(2)}</div>
                  {simResult.liveRemainingExpectedRunsAway !== undefined && (
                    <span className="text-[9px] text-slate-500 block">Rem: +{simResult.liveRemainingExpectedRunsAway.toFixed(2)}</span>
                  )}
                </div>
                <div className="p-2 rounded bg-[#0B132B]">
                  <span className="text-slate-400 text-[10px]">{homeTeam.abbreviation} Projected Runs</span>
                  <div className="text-base font-bold text-white">{simResult.homeExpectedRuns.toFixed(2)}</div>
                  {simResult.liveRemainingExpectedRunsHome !== undefined && (
                    <span className="text-[9px] text-slate-500 block">Rem: +{simResult.liveRemainingExpectedRunsHome.toFixed(2)}</span>
                  )}
                </div>
                <div className="p-2 rounded bg-[#0B132B]">
                  <span className="text-slate-400 text-[10px]">Total Expected</span>
                  <div className="text-base font-bold text-amber-300">{simResult.totalExpectedRuns.toFixed(2)}</div>
                  <span className="text-[9px] text-slate-500 block">O/U Line: {parsedTotalLine}</span>
                </div>
                <div className="p-2 rounded bg-[#0B132B]">
                  <span className="text-slate-400 text-[10px]">Simulated Win Prob</span>
                  <div className="text-base font-bold text-cyan-300">
                    {simResult.homeWinProb >= simResult.awayWinProb ? `${homeTeam.abbreviation} ${Math.round(simResult.homeWinProb * 100)}%` : `${awayTeam.abbreviation} ${Math.round(simResult.awayWinProb * 100)}%`}
                  </div>
                </div>
              </div>

              {/* Edge vs Market Signal */}
              {simResult.edgeVsMarket?.hasMarketData && (
                <div className="p-2.5 rounded bg-[#0B132B] border border-cyan-500/30 flex items-center justify-between flex-wrap gap-2 text-[11px]">
                  <div className="flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span><strong>Signal vs {sharpOdds?.sportsbook || 'Market'}:</strong> {simResult.edgeVsMarket.totalSignal}</span>
                  </div>
                  <span className="text-cyan-400 font-bold">
                    {simResult.edgeVsMarket.mlSignal}
                  </span>
                </div>
              )}

              {/* Common Scores */}
              <div>
                <span className="text-[11px] font-bold text-slate-300 mb-1.5 block">Top Simulated Final Scores:</span>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {Object.entries(simResult.commonScores).slice(0, 5).map(([score, count]) => (
                    <div key={score} className="p-1.5 rounded bg-[#0B132B] border border-slate-800 text-center text-[11px]">
                      <span className="text-slate-200 font-bold">{homeTeam.abbreviation} {score} {awayTeam.abbreviation}</span>
                      <div className="text-[10px] text-cyan-400">{count} times</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
