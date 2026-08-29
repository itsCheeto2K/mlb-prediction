import React, { useState, useEffect } from 'react';
import { MLBTeam, MLBPlayer } from '../types/mlb';
import { PredictionResult, PredictionRequestPayload, PredictionBatterPayload, PredictionPitcherPayload } from '../types/prediction';
import { fetchMLBTeams, fetchTeamRoster, fetchPlayerStats, fetchLeagueFipConstant, DEFAULT_BATTER_STATS, DEFAULT_PITCHER_STATS } from '../services/mlbApi';
import { runPrediction } from '../services/predictionApi';
import { PlayerSelectCard } from './PlayerSelectCard';
import { PredictionResults } from './PredictionResults';
import { RawLineupModal } from './RawLineupModal';
import { ParsedMatchup, ParsedTeamLineup } from '../utils/rawLineupParser';
import { Zap, RefreshCw, Sparkles, AlertCircle, Shield, Users, FileText, CheckCircle2 } from 'lucide-react';

export const PredictionTab: React.FC = () => {
  const [teams, setTeams] = useState<MLBTeam[]>([]);
  const [homeTeamId, setHomeTeamId] = useState<number | null>(null);
  const [awayTeamId, setAwayTeamId] = useState<number | null>(null);

  const [homeRoster, setHomeRoster] = useState<MLBPlayer[]>([]);
  const [awayRoster, setAwayRoster] = useState<MLBPlayer[]>([]);

  // 20 Selected Players State
  // Home (1 SP + 9 Batters)
  const [homePitcherId, setHomePitcherId] = useState<number | null>(null);
  const [homeBatterIds, setHomeBatterIds] = useState<(number | null)[]>(Array(9).fill(null));

  // Away (1 SP + 9 Batters)
  const [awayPitcherId, setAwayPitcherId] = useState<number | null>(null);
  const [awayBatterIds, setAwayBatterIds] = useState<(number | null)[]>(Array(9).fill(null));

  const [isLoadingTeams, setIsLoadingTeams] = useState(true);
  const [isLoadingRosters, setIsLoadingRosters] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [predictionResult, setPredictionResult] = useState<PredictionResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Raw Lineup Modal State
  const [isRawModalOpen, setIsRawModalOpen] = useState(false);

  // Load initial teams
  useEffect(() => {
    async function initTeams() {
      setIsLoadingTeams(true);
      const teamList = await fetchMLBTeams();
      setTeams(teamList);
      if (teamList.length >= 2) {
        const dodgers = teamList.find(t => t.abbreviation === 'LAD') || teamList[0];
        const yankees = teamList.find(t => t.abbreviation === 'NYY') || teamList[1];
        setHomeTeamId(dodgers.id);
        setAwayTeamId(yankees.id);
      }
      setIsLoadingTeams(false);
    }
    initTeams();
  }, []);

  // Load Home Roster when Home Team changes
  useEffect(() => {
    if (!homeTeamId) return;
    async function loadHomeRoster() {
      setIsLoadingRosters(true);
      const roster = await fetchTeamRoster(homeTeamId!);
      setHomeRoster(roster);
      autoFillLineup(roster, true);
      setIsLoadingRosters(false);
    }
    loadHomeRoster();
  }, [homeTeamId]);

  // Load Away Roster when Away Team changes
  useEffect(() => {
    if (!awayTeamId) return;
    async function loadAwayRoster() {
      setIsLoadingRosters(true);
      const roster = await fetchTeamRoster(awayTeamId!);
      setAwayRoster(roster);
      autoFillLineup(roster, false);
      setIsLoadingRosters(false);
    }
    loadAwayRoster();
  }, [awayTeamId]);

  // Auto-fill Starting Pitcher + 9 Batters from roster
  const autoFillLineup = async (roster: MLBPlayer[], isHome: boolean) => {
    if (!roster || roster.length === 0) return;

    const pitchers = roster.filter(p => p.primaryPosition?.abbreviation === 'P' || p.primaryPosition?.type === 'Pitcher');
    const hitters = roster.filter(p => p.primaryPosition?.abbreviation !== 'P' && p.primaryPosition?.type !== 'Pitcher');

    const selectedSP = pitchers.length > 0 ? pitchers[0] : roster[0];
    const selectedBatters = hitters.slice(0, 9);
    while (selectedBatters.length < 9 && roster.length > selectedBatters.length) {
      const candidate = roster.find(p => !selectedBatters.some(b => b.id === p.id) && p.id !== selectedSP?.id);
      if (candidate) selectedBatters.push(candidate);
      else break;
    }

    if (isHome) {
      setHomePitcherId(selectedSP ? selectedSP.id : null);
      const batterIds = Array(9).fill(null);
      selectedBatters.forEach((b, idx) => { if (idx < 9) batterIds[idx] = b.id; });
      setHomeBatterIds(batterIds);
    } else {
      setAwayPitcherId(selectedSP ? selectedSP.id : null);
      const batterIds = Array(9).fill(null);
      selectedBatters.forEach((b, idx) => { if (idx < 9) batterIds[idx] = b.id; });
      setAwayBatterIds(batterIds);
    }

    const playersToFetch = [selectedSP, ...selectedBatters].filter(Boolean);
    playersToFetch.forEach(p => {
      fetchPlayerStats(p.id, p.id === selectedSP?.id);
    });
  };

  const handleManualAutoFillBoth = () => {
    if (homeRoster.length > 0) autoFillLineup(homeRoster, true);
    if (awayRoster.length > 0) autoFillLineup(awayRoster, false);
  };

  const handleSelectHomeBatter = (player: MLBPlayer, index: number) => {
    const updated = [...homeBatterIds];
    updated[index] = player.id;
    setHomeBatterIds(updated);
    fetchPlayerStats(player.id, false);
  };

  const handleSelectAwayBatter = (player: MLBPlayer, index: number) => {
    const updated = [...awayBatterIds];
    updated[index] = player.id;
    setAwayBatterIds(updated);
    fetchPlayerStats(player.id, false);
  };

  // Import Parsed Raw Matchup Lineups
  const handleImportRawMatchup = async (parsed: ParsedMatchup) => {
    try {
      setIsLoadingRosters(true);
      setErrorMessage(null);

      const awayTeamMatch = teams.find(t => t.abbreviation.toUpperCase() === parsed.team1.teamAbbr.toUpperCase()) || teams[0];
      const homeTeamMatch = teams.find(t => t.abbreviation.toUpperCase() === parsed.team2.teamAbbr.toUpperCase()) || teams[1];

      setAwayTeamId(awayTeamMatch.id);
      setHomeTeamId(homeTeamMatch.id);

      const [aRoster, hRoster] = await Promise.all([
        fetchTeamRoster(awayTeamMatch.id),
        fetchTeamRoster(homeTeamMatch.id)
      ]);

      const mapTeamLineup = (parsedLineup: ParsedTeamLineup, currentRoster: MLBPlayer[]) => {
        let updatedRoster = [...currentRoster];

        let pitcherId: number | null = null;
        if (parsedLineup.pitcher) {
          const pNameLower = parsedLineup.pitcher.name.toLowerCase();
          let matchedP = updatedRoster.find(p => p.fullName.toLowerCase().includes(pNameLower) || pNameLower.includes(p.fullName.toLowerCase()));
          if (!matchedP) {
            const newId = 91000 + Math.floor(Math.random() * 1000);
            matchedP = {
              id: newId,
              fullName: parsedLineup.pitcher.name,
              primaryNumber: 'SP',
              primaryPosition: { code: '1', name: 'Pitcher', type: 'Pitcher', abbreviation: 'SP' },
              pitchHand: { code: parsedLineup.pitcher.hand, description: parsedLineup.pitcher.hand === 'L' ? 'Left' : 'Right' },
              stats: {
                ...DEFAULT_PITCHER_STATS,
                era: parsedLineup.pitcher.era ? parsedLineup.pitcher.era.toFixed(2) : '3.85',
                wins: parsedLineup.pitcher.wins || 5,
                losses: parsedLineup.pitcher.losses || 5,
                hitBatsmen: 4
              }
            };
            updatedRoster.push(matchedP);
          }
          pitcherId = matchedP.id;
        }

        const batterIds: (number | null)[] = Array(9).fill(null);
        parsedLineup.batters.forEach((pb, idx) => {
          if (idx >= 9) return;
          const bNameLower = pb.name.toLowerCase();
          let matchedB = updatedRoster.find(p => p.fullName.toLowerCase().includes(bNameLower) || bNameLower.includes(p.fullName.toLowerCase()));
          if (!matchedB) {
            const newId = 92000 + idx * 100 + Math.floor(Math.random() * 90);
            matchedB = {
              id: newId,
              fullName: pb.name,
              primaryNumber: pb.position,
              primaryPosition: { code: '0', name: pb.position, type: 'Hitter', abbreviation: pb.position },
              batSide: { code: pb.hand, description: pb.hand === 'L' ? 'Left' : pb.hand === 'S' ? 'Switch' : 'Right' },
              stats: {
                ...DEFAULT_BATTER_STATS,
                avg: '.260',
                ops: '.765',
                homeRuns: 16,
                hitByPitch: 4,
                sacFlies: 3,
                intentionalWalks: 1
              }
            };
            updatedRoster.push(matchedB);
          }
          batterIds[idx] = matchedB.id;
        });

        return { updatedRoster, pitcherId, batterIds };
      };

      const awayMapped = mapTeamLineup(parsed.team1, aRoster);
      const homeMapped = mapTeamLineup(parsed.team2, hRoster);

      setAwayRoster(awayMapped.updatedRoster);
      setAwayPitcherId(awayMapped.pitcherId);
      setAwayBatterIds(awayMapped.batterIds);

      setHomeRoster(homeMapped.updatedRoster);
      setHomePitcherId(homeMapped.pitcherId);
      setHomeBatterIds(homeMapped.batterIds);

      setSuccessMessage(`Đã nạp thành công 20 players cho ${awayTeamMatch.abbreviation} (Sân Khách) vs ${homeTeamMatch.abbreviation} (Sân Nhà)!`);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      console.error('Import error:', err);
      setErrorMessage(err.message || 'Lỗi khi nạp dữ liệu lineup');
    } finally {
      setIsLoadingRosters(false);
    }
  };

  // Run the C++ Simulation Prediction
  const handleRunPrediction = async () => {
    if (!homeTeamId || !awayTeamId) {
      setErrorMessage('Please select both Home and Away teams.');
      return;
    }

    setIsSimulating(true);
    setErrorMessage(null);

    try {
      const homeTeam = teams.find(t => t.id === homeTeamId)!;
      const awayTeam = teams.find(t => t.id === awayTeamId)!;
      const leagueFipConst = await fetchLeagueFipConstant();

      // Construct Home Pitcher Payload
      const homePitcherObj = homeRoster.find(p => p.id === homePitcherId);
      const homePitcherStats = homePitcherObj ? (homePitcherObj.stats || await fetchPlayerStats(homePitcherObj.id, true)) : DEFAULT_PITCHER_STATS;
      const homePitcherPayload: PredictionPitcherPayload = {
        id: homePitcherObj?.id || 101,
        name: homePitcherObj?.fullName || 'Home Starter',
        batHand: homePitcherObj?.batSide?.code || 'R',
        throwHand: homePitcherObj?.pitchHand?.code || 'R',
        inningsPitched: Number(homePitcherStats.inningsPitched) || 120.0,
        era: Number(homePitcherStats.era) || 3.85,
        whip: Number(homePitcherStats.whip) || 1.22,
        k9: Number(homePitcherStats.strikeoutsPer9Inn) || 8.8,
        bb9: Number(homePitcherStats.walksPer9Inn) || 2.9,
        hr9: Number(homePitcherStats.homeRunsPer9) || 1.1,
        wins: homePitcherStats.wins || 10,
        losses: homePitcherStats.losses || 7,
        strikeouts: homePitcherStats.strikeOuts || 140,
        hitBatsmen: homePitcherStats.hitBatsmen || 5,
        fipConstant: leagueFipConst
      };

      // Construct Away Pitcher Payload
      const awayPitcherObj = awayRoster.find(p => p.id === awayPitcherId);
      const awayPitcherStats = awayPitcherObj ? (awayPitcherObj.stats || await fetchPlayerStats(awayPitcherObj.id, true)) : DEFAULT_PITCHER_STATS;
      const awayPitcherPayload: PredictionPitcherPayload = {
        id: awayPitcherObj?.id || 201,
        name: awayPitcherObj?.fullName || 'Away Starter',
        batHand: awayPitcherObj?.batSide?.code || 'R',
        throwHand: awayPitcherObj?.pitchHand?.code || 'R',
        inningsPitched: Number(awayPitcherStats.inningsPitched) || 120.0,
        era: Number(awayPitcherStats.era) || 3.85,
        whip: Number(awayPitcherStats.whip) || 1.22,
        k9: Number(awayPitcherStats.strikeoutsPer9Inn) || 8.8,
        bb9: Number(awayPitcherStats.walksPer9Inn) || 2.9,
        hr9: Number(awayPitcherStats.homeRunsPer9) || 1.1,
        wins: awayPitcherStats.wins || 10,
        losses: awayPitcherStats.losses || 7,
        strikeouts: awayPitcherStats.strikeOuts || 140,
        hitBatsmen: awayPitcherStats.hitBatsmen || 5,
        fipConstant: leagueFipConst
      };

      // Construct Home 9 Batters
      const homeBattersPayload: PredictionBatterPayload[] = [];
      for (let i = 0; i < 9; i++) {
        const pid = homeBatterIds[i];
        const pObj = homeRoster.find(p => p.id === pid);
        const stats = pObj ? (pObj.stats || await fetchPlayerStats(pObj.id, false)) : DEFAULT_BATTER_STATS;
        homeBattersPayload.push({
          id: pObj?.id || 1000 + i,
          name: pObj?.fullName || `Home Batter #${i + 1}`,
          batHand: pObj?.batSide?.code || 'R',
          throwHand: pObj?.pitchHand?.code || 'R',
          order: i + 1,
          atBats: stats.atBats || 450,
          hits: stats.hits || 118,
          doubles: stats.doubles || 24,
          triples: stats.triples || 2,
          homeRuns: stats.homeRuns || 18,
          walks: stats.baseOnBalls || 44,
          strikeouts: stats.strikeOuts || 98,
          hitByPitch: stats.hitByPitch || 4,
          sacFlies: stats.sacFlies || 3,
          intentionalWalks: stats.intentionalWalks || 1,
          avg: Number(stats.avg) || 0.258,
          obp: Number(stats.obp) || 0.328,
          slg: Number(stats.slg) || 0.428,
          ops: Number(stats.ops) || 0.756,
          vsRhpOps: stats.vsRhpOps || 0,
          vsLhpOps: stats.vsLhpOps || 0,
          vsRhpAvg: stats.vsRhpAvg || 0,
          vsLhpAvg: stats.vsLhpAvg || 0,
          vsRhpAb: stats.vsRhpAb || 0,
          vsLhpAb: stats.vsLhpAb || 0
        });
      }

      // Construct Away 9 Batters
      const awayBattersPayload: PredictionBatterPayload[] = [];
      for (let i = 0; i < 9; i++) {
        const pid = awayBatterIds[i];
        const pObj = awayRoster.find(p => p.id === pid);
        const stats = pObj ? (pObj.stats || await fetchPlayerStats(pObj.id, false)) : DEFAULT_BATTER_STATS;
        awayBattersPayload.push({
          id: pObj?.id || 2000 + i,
          name: pObj?.fullName || `Away Batter #${i + 1}`,
          batHand: pObj?.batSide?.code || 'R',
          throwHand: pObj?.pitchHand?.code || 'R',
          order: i + 1,
          atBats: stats.atBats || 450,
          hits: stats.hits || 118,
          doubles: stats.doubles || 24,
          triples: stats.triples || 2,
          homeRuns: stats.homeRuns || 18,
          walks: stats.baseOnBalls || 44,
          strikeouts: stats.strikeOuts || 98,
          hitByPitch: stats.hitByPitch || 4,
          sacFlies: stats.sacFlies || 3,
          intentionalWalks: stats.intentionalWalks || 1,
          avg: Number(stats.avg) || 0.258,
          obp: Number(stats.obp) || 0.328,
          slg: Number(stats.slg) || 0.428,
          ops: Number(stats.ops) || 0.756,
          vsRhpOps: stats.vsRhpOps || 0,
          vsLhpOps: stats.vsLhpOps || 0,
          vsRhpAvg: stats.vsRhpAvg || 0,
          vsLhpAvg: stats.vsLhpAvg || 0,
          vsRhpAb: stats.vsRhpAb || 0,
          vsLhpAb: stats.vsLhpAb || 0
        });
      }

      const payload: PredictionRequestPayload = {
        homeTeamName: homeTeam.name,
        homeTeamAbbr: homeTeam.abbreviation,
        homeParkFactor: homeTeam.parkFactor || 1.00,
        homeBullpenEra: 3.75,
        homeBullpenWhip: 1.20,
        awayTeamName: awayTeam.name,
        awayTeamAbbr: awayTeam.abbreviation,
        awayBullpenEra: 3.85,
        awayBullpenWhip: 1.22,
        fipConstant: leagueFipConst,
        homePitcher: [homePitcherPayload],
        awayPitcher: [awayPitcherPayload],
        homeBatters: homeBattersPayload,
        awayBatters: awayBattersPayload,
        simulations: 10000
      };

      const result = await runPrediction(payload);
      setPredictionResult(result);
    } catch (err: any) {
      console.error('Prediction failed:', err);
      setErrorMessage(err.message || 'Failed to simulate match. Make sure the C++ prediction engine is compiled.');
    } finally {
      setIsSimulating(false);
    }
  };

  const selectedHomeTeam = teams.find(t => t.id === homeTeamId);
  const selectedAwayTeam = teams.find(t => t.id === awayTeamId);

  return (
    <div className="space-y-8 pb-12">
      {/* Raw Lineup Parser Modal */}
      <RawLineupModal
        isOpen={isRawModalOpen}
        onClose={() => setIsRawModalOpen(false)}
        onImport={handleImportRawMatchup}
      />

      {/* Top Matchup Selector Header */}
      <div className="bg-[#111B33] p-6 rounded-2xl border border-slate-800 shadow-lg">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Away Team Selection */}
          <div className="flex-1 w-full space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
              ✈️ Away Team (Sân Khách)
            </label>
            <select
              value={awayTeamId || ''}
              onChange={(e) => setAwayTeamId(Number(e.target.value))}
              disabled={isLoadingTeams}
              className="w-full bg-[#0B132B] text-white font-semibold text-base rounded-xl px-4 py-3 border border-slate-700 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none cursor-pointer"
            >
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.abbreviation})
                </option>
              ))}
            </select>
          </div>

          <div className="text-center font-bold text-slate-500 text-sm px-4">
            AT
          </div>

          {/* Home Team Selection */}
          <div className="flex-1 w-full space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
              🏠 Home Team (Sân Nhà)
            </label>
            <select
              value={homeTeamId || ''}
              onChange={(e) => setHomeTeamId(Number(e.target.value))}
              disabled={isLoadingTeams}
              className="w-full bg-[#0B132B] text-white font-semibold text-base rounded-xl px-4 py-3 border border-slate-700 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none cursor-pointer"
            >
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.abbreviation})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Buttons Bar */}
        <div className="mt-6 pt-5 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Paste Raw Lineup Button */}
            <button
              onClick={() => setIsRawModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600/30 to-blue-600/30 hover:from-cyan-500/40 hover:to-blue-500/40 text-cyan-300 text-xs font-bold border border-cyan-500/50 transition-all shadow-sm cursor-pointer"
            >
              <FileText className="w-4 h-4 text-cyan-400" />
              <span>📋 Nhập Lineup dạng thô (Paste Raw Text)</span>
            </button>

            {/* Auto-Fill Button */}
            <button
              onClick={handleManualAutoFillBoth}
              disabled={isLoadingRosters}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-all hover:border-slate-500 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>⚡ Auto-Fill Active Starting Lineups</span>
            </button>
          </div>

          <button
            onClick={handleRunPrediction}
            disabled={isSimulating || isLoadingRosters}
            className="flex items-center gap-2 px-7 py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all transform active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {isSimulating ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Simulating 10,000 Games in C++...</span>
              </>
            ) : (
              <>
                <Zap className="w-5 h-5 fill-current" />
                <span>Simulate & Predict Match (C++ Engine)</span>
              </>
            )}
          </button>
        </div>

        {successMessage && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-950/50 border border-emerald-700 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="mt-4 p-3 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Prediction Output Section (if result exists) */}
      {predictionResult && selectedHomeTeam && selectedAwayTeam && (
        <PredictionResults
          result={predictionResult}
          homeTeam={selectedHomeTeam}
          awayTeam={selectedAwayTeam}
        />
      )}

      {/* 20 Player Lineup Selectors Grid (10 for Away, 10 for Home) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Away Team 10 Dropdowns */}
        <div className="bg-[#0B132B]/90 p-5 rounded-2xl border border-slate-800 shadow-md">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-xl">✈️</span>
              <div>
                <h3 className="font-bold text-white text-base">
                  {selectedAwayTeam?.name || 'Away Team'} Lineup
                </h3>
                <p className="text-[11px] text-slate-400">1 Starting Pitcher + 9 Batters (10 Selectors)</p>
              </div>
            </div>
            <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 px-2 py-1 rounded border border-cyan-800/40">
              AWAY
            </span>
          </div>

          <div className="space-y-3">
            {/* Away SP */}
            <div className="border-b border-slate-800 pb-3">
              <PlayerSelectCard
                label="Starting Pitcher (SP)"
                isPitcher={true}
                players={awayRoster.filter(p => p.primaryPosition?.abbreviation === 'P' || p.primaryPosition?.type === 'Pitcher' || p.primaryPosition?.abbreviation === 'SP')}
                selectedPlayerId={awayPitcherId}
                onSelectPlayer={(p) => {
                  setAwayPitcherId(p.id);
                  fetchPlayerStats(p.id, true);
                }}
                isLoading={isLoadingRosters}
              />
            </div>

            {/* Away 9 Batters */}
            <div className="space-y-2.5">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Batting Order (Tay Đập 1 - 9)
              </div>
              {Array.from({ length: 9 }).map((_, idx) => (
                <PlayerSelectCard
                  key={idx}
                  label={`Batter #${idx + 1}`}
                  orderNum={idx + 1}
                  isPitcher={false}
                  players={awayRoster}
                  selectedPlayerId={awayBatterIds[idx]}
                  onSelectPlayer={(p) => handleSelectAwayBatter(p, idx)}
                  isLoading={isLoadingRosters}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Home Team 10 Dropdowns */}
        <div className="bg-[#0B132B]/90 p-5 rounded-2xl border border-slate-800 shadow-md">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-xl">🏠</span>
              <div>
                <h3 className="font-bold text-white text-base">
                  {selectedHomeTeam?.name || 'Home Team'} Lineup
                </h3>
                <p className="text-[11px] text-slate-400">1 Starting Pitcher + 9 Batters (10 Selectors)</p>
              </div>
            </div>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 px-2 py-1 rounded border border-emerald-800/40">
              HOME
            </span>
          </div>

          <div className="space-y-3">
            {/* Home SP */}
            <div className="border-b border-slate-800 pb-3">
              <PlayerSelectCard
                label="Starting Pitcher (SP)"
                isPitcher={true}
                players={homeRoster.filter(p => p.primaryPosition?.abbreviation === 'P' || p.primaryPosition?.type === 'Pitcher' || p.primaryPosition?.abbreviation === 'SP')}
                selectedPlayerId={homePitcherId}
                onSelectPlayer={(p) => {
                  setHomePitcherId(p.id);
                  fetchPlayerStats(p.id, true);
                }}
                isLoading={isLoadingRosters}
              />
            </div>

            {/* Home 9 Batters */}
            <div className="space-y-2.5">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Batting Order (Tay Đập 1 - 9)
              </div>
              {Array.from({ length: 9 }).map((_, idx) => (
                <PlayerSelectCard
                  key={idx}
                  label={`Batter #${idx + 1}`}
                  orderNum={idx + 1}
                  isPitcher={false}
                  players={homeRoster}
                  selectedPlayerId={homeBatterIds[idx]}
                  onSelectPlayer={(p) => handleSelectHomeBatter(p, idx)}
                  isLoading={isLoadingRosters}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
