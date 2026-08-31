export interface PredictionBatterPayload {
  id: number;
  name: string;
  batHand: string; // 'L', 'R', 'S'
  throwHand: string;
  order: number;
  atBats: number;
  hits: number;
  doubles: number;
  triples: number;
  homeRuns: number;
  walks: number;
  strikeouts: number;
  hitByPitch?: number;
  sacFlies?: number;
  intentionalWalks?: number;
  avg: number;
  obp: number;
  slg: number;
  ops: number;
  // REQ-05: Splits
  vsRhpOps?: number;
  vsLhpOps?: number;
  vsRhpAvg?: number;
  vsLhpAvg?: number;
  vsRhpAb?: number;
  vsLhpAb?: number;
  // Recent Form L10
  l10Ops?: number;
  l10Avg?: number;
  l10Ab?: number;
}

export interface PredictionPitcherPayload {
  id: number;
  name: string;
  batHand: string;
  throwHand: string;
  inningsPitched: number;
  era: number;
  whip: number;
  k9: number;
  bb9: number;
  hr9: number;
  wins: number;
  losses: number;
  strikeouts: number;
  hitBatsmen?: number;
  fipConstant?: number;
  // Pitcher Rest Days & Fatigue
  restDays?: number;
  lastStartPitches?: number;
}

export interface PredictionRequestPayload {
  homeTeamName: string;
  homeTeamAbbr: string;
  homeParkFactor: number;
  homeBullpenEra: number;
  homeBullpenWhip: number;
  awayTeamName: string;
  awayTeamAbbr: string;
  awayBullpenEra: number;
  awayBullpenWhip: number;
  fipConstant?: number;
  homePitcher: PredictionPitcherPayload[];
  awayPitcher: PredictionPitcherPayload[];
  homeBatters: PredictionBatterPayload[];
  awayBatters: PredictionBatterPayload[];
  simulations?: number;

  // Live Resume Simulation parameters
  isLiveSimulation?: boolean;
  isLive?: boolean;
  currentInning?: number;
  inningHalf?: 'top' | 'bottom' | string;
  outs?: number;
  currentHomeRuns?: number;
  currentAwayRuns?: number;
  nextBatterIndexHome?: number;
  nextBatterIndexAway?: number;
  runner1st?: boolean;
  runner2nd?: boolean;
  runner3rd?: boolean;

  // Market comparison lines
  marketTotalLine?: number;
  marketHomeOdds?: number;
  marketAwayOdds?: number;
}

export interface TotalRunLine {
  line: number;
  overProb: number;
  underProb: number;
}

export interface HandicapLine {
  spread: number;
  coverProb: number;
}

export interface EdgeVsMarket {
  hasMarketData: boolean;
  marketTotalLine: number;
  modelTotal: number;
  totalEdgeRuns: number;
  totalSignal: string;
  marketHomeOdds: number;
  marketAwayOdds: number;
  evHome: number;
  evAway: number;
  mlSignal: string;
}

export interface PredictionResult {
  homeTeam: string;
  awayTeam: string;
  isLiveSimulation?: boolean;
  homeWinProb: number;
  awayWinProb: number;
  homeExpectedRuns: number;
  awayExpectedRuns: number;
  liveRemainingExpectedRunsHome?: number;
  liveRemainingExpectedRunsAway?: number;
  totalExpectedRuns: number;
  homeMoneyline: number;
  awayMoneyline: number;
  overUnderLines: TotalRunLine[];
  homeHandicapLines: HandicapLine[];
  awayHandicapLines: HandicapLine[];
  homeInningRuns: number[];
  awayInningRuns: number[];
  commonScores: Record<string, number>;
  edgeVsMarket?: EdgeVsMarket;
  recommendation: string;
  keyInsight: string;
}
