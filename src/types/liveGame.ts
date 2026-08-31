export interface LiveGameTeam {
  id: number;
  name: string;
  abbreviation: string;
  score?: number;
  wins?: number;
  losses?: number;
  parkFactor?: number;
  probablePitcher?: {
    id: number;
    fullName: string;
  };
}

export interface LiveInning {
  num: number;
  ordinalNum: string;
  home: {
    runs?: number;
    hits?: number;
    errors?: number;
    leftOnBase?: number;
  };
  away: {
    runs?: number;
    hits?: number;
    errors?: number;
    leftOnBase?: number;
  };
}

export interface LiveGameSummary {
  gamePk: number;
  gameDate: string;
  status: {
    abstractGameState: 'Live' | 'Preview' | 'Final';
    codedGameState: string;
    detailedState: string;
    statusCode: string;
    isLive: boolean;
    isFinal: boolean;
    isScheduled: boolean;
  };
  teams: {
    away: LiveGameTeam;
    home: LiveGameTeam;
  };
  linescore?: {
    currentInning?: number;
    currentInningOrdinal?: string;
    inningState?: string; // 'Top' | 'Bottom' | 'Middle' | 'End'
    inningHalf?: string;
    isTopInning?: boolean;
    scheduledInnings?: number;
    innings?: LiveInning[];
    teams?: {
      away: { runs: number; hits: number; errors: number; leftOnBase: number };
      home: { runs: number; hits: number; errors: number; leftOnBase: number };
    };
    balls?: number;
    strikes?: number;
    outs?: number;
    offense?: {
      batter?: { id: number; fullName: string };
      onDeck?: { id: number; fullName: string };
      inHole?: { id: number; fullName: string };
      pitcher?: { id: number; fullName: string };
      first?: { id: number; fullName: string };
      second?: { id: number; fullName: string };
      third?: { id: number; fullName: string };
    };
    defense?: {
      pitcher?: { id: number; fullName: string };
      catcher?: { id: number; fullName: string };
      first?: { id: number; fullName: string };
      second?: { id: number; fullName: string };
      third?: { id: number; fullName: string };
      shortstop?: { id: number; fullName: string };
      left?: { id: number; fullName: string };
      center?: { id: number; fullName: string };
      right?: { id: number; fullName: string };
    };
  };
  venue: {
    id: number;
    name: string;
  };
  weather?: {
    condition?: string;
    temp?: string;
    wind?: string;
  };
}

export interface LivePlay {
  id: string;
  about: {
    atBatIndex: number;
    halfInning: 'top' | 'bottom';
    isTopInning: boolean;
    inning: number;
    hasOut: boolean;
    captions?: string;
  };
  result: {
    type: string;
    event: string;
    eventType: string;
    description: string;
    rbi: number;
    awayScore: number;
    homeScore: number;
    isOut: boolean;
  };
  count: {
    balls: number;
    strikes: number;
    outs: number;
  };
  matchup: {
    batter: { id: number; fullName: string };
    pitcher: { id: number; fullName: string };
    batSide?: { code: string; description: string };
    pitchHand?: { code: string; description: string };
  };
  playEvents?: Array<{
    details?: {
      description?: string;
      event?: string;
      call?: { code: string; description: string };
      type?: { code: string; description: string };
      isBall?: boolean;
      isStrike?: boolean;
      isInPlay?: boolean;
    };
    pitchData?: {
      startSpeed?: number;
      endSpeed?: number;
      strikeZoneTop?: number;
      strikeZoneBottom?: number;
      coordinates?: { pX?: number; pZ?: number; x?: number; y?: number };
    };
    pitchNumber?: number;
  }>;
}

export interface LiveBatterBoxStats {
  summary?: string;
  atBats?: number;
  runs?: number;
  hits?: number;
  rbi?: number;
  doubles?: number;
  triples?: number;
  homeRuns?: number;
  baseOnBalls?: number;
  strikeOuts?: number;
  stolenBases?: number;
  hitByPitch?: number;
  leftOnBase?: number;
}

export interface LivePitcherBoxStats {
  summary?: string;
  inningsPitched?: string;
  hits?: number;
  runs?: number;
  earnedRuns?: number;
  baseOnBalls?: number;
  strikeOuts?: number;
  homeRuns?: number;
  pitchesThrown?: number;
  strikes?: number;
  era?: string;
}

export interface LiveBoxscorePlayer {
  person: { id: number; fullName: string };
  jerseyNumber?: string;
  position?: { abbreviation: string; name: string; type: string };
  battingOrder?: string;
  stats?: {
    batting?: LiveBatterBoxStats;
    pitching?: LivePitcherBoxStats;
  };
  seasonStats?: {
    batting?: { avg?: string; obp?: string; slg?: string; ops?: string; homeRuns?: number; rbi?: number };
    pitching?: { era?: string; whip?: string; wins?: number; losses?: number; saves?: number };
  };
}

export interface LiveBoxscoreTeam {
  team: { id: number; name: string; abbreviation?: string };
  teamStats?: {
    batting: { runs: number; hits: number; rbi: number; strikeOuts: number; baseOnBalls: number; leftOnBase: number };
    pitching: { runs: number; hits: number; strikeOuts: number; baseOnBalls: number; homeRuns: number };
  };
  players?: Record<string, LiveBoxscorePlayer>;
  batters?: number[];
  pitchers?: number[];
  bench?: number[];
  bullpen?: number[];
}

export interface LiveGameFeed {
  gamePk: number;
  gameData: {
    game: { pk: number; type: string; season: string };
    datetime: { dateTime: string; time: string; ampm: string };
    status: {
      abstractGameState: string;
      codedGameState: string;
      detailedState: string;
      statusCode: string;
    };
    teams: {
      away: { id: number; name: string; abbreviation: string; teamName: string; division?: { name: string } };
      home: { id: number; name: string; abbreviation: string; teamName: string; division?: { name: string } };
    };
    players: Record<string, { id: number; fullName: string; primaryNumber?: string; primaryPosition?: { abbreviation: string; name: string } }>;
    venue: { id: number; name: string };
    weather?: { condition?: string; temp?: string; wind?: string };
    probablePitchers?: {
      away?: { id: number; fullName: string };
      home?: { id: number; fullName: string };
    };
  };
  liveData: {
    linescore: LiveGameSummary['linescore'];
    plays: {
      allPlays: LivePlay[];
      currentPlay?: LivePlay;
      scoringPlays?: number[];
    };
    boxscore?: {
      teams: {
        away: LiveBoxscoreTeam;
        home: LiveBoxscoreTeam;
      };
    };
  };
}

export interface LiveWinProbability {
  homeProb: number; // 0 to 100
  awayProb: number; // 0 to 100
  leverageIndex: number; // 0 to 3+
  projectedTotalRuns: number;
  summary: string;
}

export interface LiveTotalLine {
  line: number;
  overProb: number; // 0 to 1
  underProb: number; // 0 to 1
  overOdds: string;
  underOdds: string;
  recommendation: 'OVER' | 'UNDER' | 'PASS';
}

export interface LiveHandicapLine {
  spread: number;
  team: string;
  coverProb: number; // 0 to 1
  odds: string;
}

export interface LiveBettingAnalysis {
  moneyline: {
    homeProb: number;
    awayProb: number;
    homeOdds: string;
    awayOdds: string;
    homeDecimal: string;
    awayDecimal: string;
    pick: string;
    confidence: 'HIGH' | 'MEDIUM' | 'LOW';
    edge: string;
  };
  totals: {
    currentRuns: number;
    projectedTotal: number;
    lines: LiveTotalLine[];
    bestLine: number;
    bestPick: 'OVER' | 'UNDER';
    confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  };
  handicap: {
    projectedMargin: number;
    homeSpread: number;
    awaySpread: number;
    homeCoverProb: number;
    awayCoverProb: number;
    pick: string;
    confidence: 'HIGH' | 'MEDIUM' | 'LOW';
    lines: LiveHandicapLine[];
  };
  liveAdvice: {
    bestValueBet: string;
    gameContext: string;
    bullpenFactor: string;
    actionableAdvice: string;
  };
}
