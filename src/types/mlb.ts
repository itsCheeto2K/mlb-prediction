export interface MLBTeam {
  id: number;
  name: string;
  abbreviation: string;
  teamName: string;
  locationName: string;
  league: {
    id: number;
    name: string;
  };
  division: {
    id: number;
    name: string;
  };
  venue: {
    id: number;
    name: string;
  };
  parkFactor?: number;
}

export interface PlayerStats {
  // Hitting
  avg?: string | number;
  obp?: string | number;
  slg?: string | number;
  ops?: string | number;
  homeRuns?: number;
  rbi?: number;
  hits?: number;
  doubles?: number;
  triples?: number;
  atBats?: number;
  baseOnBalls?: number;
  strikeOuts?: number;
  stolenBases?: number;
  woba?: number;
  // REQ-02: Additional Hitting fields
  hitByPitch?: number;
  sacFlies?: number;
  intentionalWalks?: number;

  // REQ-05: Platoon Splits
  vsRhpOps?: number;
  vsLhpOps?: number;
  vsRhpAvg?: number;
  vsLhpAvg?: number;
  vsRhpAb?: number;
  vsLhpAb?: number;

  // New Features: Recent Form L10
  l10Ops?: number;
  l10Avg?: number;
  l10Ab?: number;
  l10Hits?: number;
  l10HomeRuns?: number;

  // Pitching
  era?: string | number;
  whip?: string | number;
  inningsPitched?: string | number;
  wins?: number;
  losses?: number;
  saves?: number;
  strikeoutsPer9Inn?: string | number;
  walksPer9Inn?: string | number;
  homeRunsPer9?: string | number;
  fip?: number;
  // REQ-03: Pitcher HBP caused
  hitBatsmen?: number;
  fipConstant?: number;

  // New Features: Pitcher Rest Days & Fatigue
  restDays?: number;
  lastStartPitches?: number;
}

export interface MLBPlayer {
  id: number;
  fullName: string;
  primaryNumber?: string;
  primaryPosition: {
    code: string;
    name: string;
    type: string;
    abbreviation: string;
  };
  batSide?: {
    code: string;
    description: string;
  };
  pitchHand?: {
    code: string;
    description: string;
  };
  stats?: PlayerStats;
  headshotUrl?: string;
}

export interface TeamStanding {
  team: MLBTeam;
  season: string;
  wins: number;
  losses: number;
  pct: string;
  gamesBack: string;
  runDifferential: number;
  runsScored: number;
  runsAllowed: number;
  streak: string;
  lastTen: string;
  homeRecord: string;
  awayRecord: string;
}

export interface StatLeader {
  rank: number;
  player: {
    id: number;
    fullName: string;
    primaryPosition: { abbreviation: string };
  };
  team: {
    id: number;
    name: string;
    abbreviation: string;
  };
  value: string;
  category: string;
}
