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

export interface PredictionResult {
  homeTeam: string;
  awayTeam: string;
  homeWinProb: number;
  awayWinProb: number;
  homeExpectedRuns: number;
  awayExpectedRuns: number;
  totalExpectedRuns: number;
  homeMoneyline: number;
  awayMoneyline: number;
  overUnderLines: TotalRunLine[];
  homeHandicapLines: HandicapLine[];
  awayHandicapLines: HandicapLine[];
  homeInningRuns: number[];
  awayInningRuns: number[];
  commonScores: Record<string, number>;
  recommendation: string;
  keyInsight: string;
}
