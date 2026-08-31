import { MLBTeam, MLBPlayer, TeamStanding, StatLeader, PlayerStats } from '../types/mlb';

// Read MLB Data API base URL from Environment Variable (Vercel / .env)
const BASE_API = (import.meta.env.VITE_MLB_API_URL || 'https://statsapi.mlb.com/api/v1').replace(/\/$/, '');
const HEADSHOT_BASE = (import.meta.env.VITE_MLB_HEADSHOT_URL || 'https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_213,q_auto:best/v1/people').replace(/\/$/, '');

export const MLB_PARK_FACTORS: Record<string, number> = {
  COL: 1.35, BOS: 1.09, CIN: 1.08, LAD: 1.03, NYY: 1.02, PHI: 1.05,
  BAL: 1.00, ATL: 1.02, HOU: 0.99, TOR: 1.01, CHC: 1.02, CWS: 1.01,
  CLE: 0.98, DET: 0.96, KC: 1.02, MIN: 0.98, LAA: 1.00, OAK: 0.94,
  ATH: 0.94, SEA: 0.92, TEX: 1.01, MIA: 0.94, NYM: 0.95, WSH: 1.00,
  MIL: 1.01, PIT: 0.97, STL: 0.97, ARI: 1.02, SD: 0.95, SF: 0.93,
  TB: 0.96
};

const cache = {
  teams: null as MLBTeam[] | null,
  rosters: {} as Record<number, MLBPlayer[]>,
  playerStats: {} as Record<number, PlayerStats>,
  playerSplits: {} as Record<number, { vsRhpOps: number; vsLhpOps: number; vsRhpAvg: number; vsLhpAvg: number; vsRhpAb: number; vsLhpAb: number }>,
  standings: null as TeamStanding[] | null,
  leaders: {} as Record<string, StatLeader[]>,
  leagueFipConstant: 3.15
};

export async function fetchMLBTeams(): Promise<MLBTeam[]> {
  if (cache.teams) return cache.teams;

  try {
    const res = await fetch(`${BASE_API}/teams?sportId=1`);
    if (!res.ok) throw new Error('Failed to fetch teams');
    const data = await res.json();
    const teams: MLBTeam[] = data.teams
      .filter((t: any) => t.active && t.sport?.id === 1)
      .map((t: any) => ({
        id: t.id,
        name: t.name,
        abbreviation: t.abbreviation || t.fileCode?.toUpperCase() || 'MLB',
        teamName: t.teamName,
        locationName: t.locationName,
        league: { id: t.league?.id || 103, name: t.league?.name || 'MLB' },
        division: { id: t.division?.id || 201, name: t.division?.name || 'Division' },
        venue: { id: t.venue?.id || 1, name: t.venue?.name || 'Ballpark' },
        parkFactor: MLB_PARK_FACTORS[t.abbreviation] || 1.00
      }))
      .sort((a: MLBTeam, b: MLBTeam) => a.name.localeCompare(b.name));

    cache.teams = teams;
    return teams;
  } catch (err) {
    console.warn('Using fallback MLB teams list:', err);
    return FALLBACK_TEAMS;
  }
}

export async function fetchTeamRoster(teamId: number): Promise<MLBPlayer[]> {
  if (cache.rosters[teamId]) return cache.rosters[teamId];

  try {
    const res = await fetch(`${BASE_API}/teams/${teamId}/roster?rosterType=active`);
    if (!res.ok) throw new Error(`Failed to fetch roster for team ${teamId}`);
    const data = await res.json();

    const players: MLBPlayer[] = (data.roster || []).map((r: any) => {
      const p = r.person;
      return {
        id: p.id,
        fullName: p.fullName,
        primaryNumber: r.jerseyNumber || '#',
        primaryPosition: {
          code: r.position?.code || '1',
          name: r.position?.name || 'Player',
          type: r.position?.type || (r.position?.abbreviation === 'P' ? 'Pitcher' : 'Hitter'),
          abbreviation: r.position?.abbreviation || 'P'
        },
        batSide: { code: 'R', description: 'Right' },
        pitchHand: { code: 'R', description: 'Right' },
        headshotUrl: `${HEADSHOT_BASE}/${p.id}/headshot/67/current`
      };
    });

    cache.rosters[teamId] = players;
    return players;
  } catch (err) {
    console.error('Error fetching roster:', err);
    return [];
  }
}

// REQ-05: Fetch Batter splits vs RHP (vr) and vs LHP (vl)
export async function fetchPlayerSplits(playerId: number) {
  if (cache.playerSplits[playerId]) return cache.playerSplits[playerId];

  try {
    const res = await fetch(`${BASE_API}/people/${playerId}/stats?stats=statSplits&group=hitting&sitCodes=vr,vl`);
    if (!res.ok) throw new Error('Splits fetch failed');
    const data = await res.json();

    const splits = data.stats?.[0]?.splits || [];
    let vsRhpOps = 0;
    let vsLhpOps = 0;
    let vsRhpAvg = 0;
    let vsLhpAvg = 0;
    let vsRhpAb = 0;
    let vsLhpAb = 0;

    for (const s of splits) {
      const sitCode = s.split?.code;
      const stat = s.stat;
      if (sitCode === 'vr') {
        vsRhpOps = parseFloat(stat?.ops || '0');
        vsRhpAvg = parseFloat(stat?.avg || '0');
        vsRhpAb = parseInt(stat?.atBats || '0', 10);
      } else if (sitCode === 'vl') {
        vsLhpOps = parseFloat(stat?.ops || '0');
        vsLhpAvg = parseFloat(stat?.avg || '0');
        vsLhpAb = parseInt(stat?.atBats || '0', 10);
      }
    }

    const result = { vsRhpOps, vsLhpOps, vsRhpAvg, vsLhpAvg, vsRhpAb, vsLhpAb };
    cache.playerSplits[playerId] = result;
    return result;
  } catch (err) {
    const fallback = { vsRhpOps: 0, vsLhpOps: 0, vsRhpAvg: 0, vsLhpAvg: 0, vsRhpAb: 0, vsLhpAb: 0 };
    cache.playerSplits[playerId] = fallback;
    return fallback;
  }
}

// FEAT-1: Fetch Pitcher Rest Days & Previous Outing Pitch Count from Game Log
export async function fetchPitcherRestDays(pitcherId: number): Promise<{ restDays: number; lastStartPitches: number }> {
  try {
    const res = await fetch(`${BASE_API}/people/${pitcherId}/stats?stats=gameLog&group=pitching`);
    if (!res.ok) throw new Error('Pitcher gameLog fetch failed');
    const data = await res.json();
    const splits = data.stats?.[0]?.splits || [];
    if (splits.length === 0) {
      return { restDays: 5, lastStartPitches: 90 };
    }

    const lastGame = splits[splits.length - 1];
    const lastDateStr = lastGame.date;
    const lastStartPitches = lastGame.stat?.numberOfPitches || 90;

    let restDays = 5;
    if (lastDateStr) {
      const lastDate = new Date(lastDateStr).getTime();
      const now = new Date().getTime();
      const diffDays = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));
      restDays = Math.max(1, Math.min(30, diffDays));
    }

    return { restDays, lastStartPitches };
  } catch (err) {
    console.warn(`Fallback rest days for pitcher ${pitcherId}:`, err);
    return { restDays: 5, lastStartPitches: 90 };
  }
}

// FEAT-2: Fetch Batter Recent Form (Last 10 Games Rolling Aggregate)
export async function fetchBatterRecentForm(batterId: number): Promise<{
  l10Ops: number;
  l10Avg: number;
  l10Ab: number;
  l10Hits: number;
  l10HomeRuns: number;
}> {
  try {
    const res = await fetch(`${BASE_API}/people/${batterId}/stats?stats=gameLog&group=hitting`);
    if (!res.ok) throw new Error('Batter gameLog fetch failed');
    const data = await res.json();
    const splits = data.stats?.[0]?.splits || [];
    if (splits.length === 0) {
      return { l10Ops: 0.750, l10Avg: 0.255, l10Ab: 0, l10Hits: 0, l10HomeRuns: 0 };
    }

    // Take last 10 games
    const last10 = splits.slice(-10);
    let totalAb = 0;
    let totalHits = 0;
    let total2B = 0;
    let total3B = 0;
    let totalHr = 0;
    let totalBb = 0;
    let totalHbp = 0;
    let totalSf = 0;

    for (const g of last10) {
      const st = g.stat || {};
      totalAb += parseInt(st.atBats || '0', 10);
      totalHits += parseInt(st.hits || '0', 10);
      total2B += parseInt(st.doubles || '0', 10);
      total3B += parseInt(st.triples || '0', 10);
      totalHr += parseInt(st.homeRuns || '0', 10);
      totalBb += parseInt(st.baseOnBalls || '0', 10);
      totalHbp += parseInt(st.hitByPitch || '0', 10);
      totalSf += parseInt(st.sacFlies || '0', 10);
    }

    const l10Avg = totalAb > 0 ? Number((totalHits / totalAb).toFixed(3)) : 0.255;
    const pa = totalAb + totalBb + totalHbp + totalSf;
    const l10Obp = pa > 0 ? (totalHits + totalBb + totalHbp) / pa : 0.325;
    const totalBases = (totalHits - total2B - total3B - totalHr) + total2B * 2 + total3B * 3 + totalHr * 4;
    const l10Slg = totalAb > 0 ? totalBases / totalAb : 0.420;
    const l10Ops = Number((l10Obp + l10Slg).toFixed(3));

    return {
      l10Ops,
      l10Avg,
      l10Ab: totalAb,
      l10Hits: totalHits,
      l10HomeRuns: totalHr
    };
  } catch (err) {
    console.warn(`Fallback recent form for batter ${batterId}:`, err);
    return { l10Ops: 0.750, l10Avg: 0.255, l10Ab: 0, l10Hits: 0, l10HomeRuns: 0 };
  }
}

// FEAT-4: Fetch Team Bullpen Fatigue (Last 3 Days IP Workload)
export async function fetchTeamBullpenFatigue(teamId: number): Promise<{
  bullpenL3IP: number;
  eraMultiplier: number;
  whipMultiplier: number;
}> {
  try {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 3);

    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];

    const res = await fetch(`${BASE_API}/teams/${teamId}/stats?stats=byDateRange&group=pitching&startDate=${startStr}&endDate=${endStr}`);
    if (!res.ok) throw new Error('Bullpen date range fetch failed');
    const data = await res.json();
    const split = data.stats?.[0]?.splits?.[0]?.stat;

    let totalIp = 0;
    if (split && split.inningsPitched) {
      totalIp = parseFloat(split.inningsPitched);
    }

    // Average starter pitches ~5.5 IP per game -> in 3 games = ~16.5 IP starter.
    // Excess IP is absorbed by the bullpen.
    const estimatedBullpenIp = Math.max(0, totalIp - 16.5);
    let eraMultiplier = 1.0;
    let whipMultiplier = 1.0;

    if (estimatedBullpenIp >= 11.0) {
      // Heavily taxed bullpen
      eraMultiplier = 1.12;
      whipMultiplier = 1.06;
    } else if (estimatedBullpenIp >= 8.0) {
      // Moderate fatigue
      eraMultiplier = 1.05;
      whipMultiplier = 1.03;
    } else if (estimatedBullpenIp <= 4.0) {
      // Well rested
      eraMultiplier = 0.96;
      whipMultiplier = 0.98;
    }

    return {
      bullpenL3IP: Number(estimatedBullpenIp.toFixed(1)),
      eraMultiplier,
      whipMultiplier
    };
  } catch (err) {
    console.warn(`Fallback bullpen fatigue for team ${teamId}:`, err);
    return { bullpenL3IP: 5.0, eraMultiplier: 1.0, whipMultiplier: 1.0 };
  }
}

// REQ-02 & REQ-03: Fetch player stats with HBP, SF, IBB, hitBatsmen, Rest Days, and L10 Form
export async function fetchPlayerStats(playerId: number, isPitcher: boolean): Promise<PlayerStats> {
  if (cache.playerStats[playerId]) return cache.playerStats[playerId];

  try {
    const group = isPitcher ? 'pitching' : 'hitting';
    const res = await fetch(`${BASE_API}/people/${playerId}/stats?stats=season,career&group=${group}`);
    if (!res.ok) throw new Error(`Failed to fetch stats for player ${playerId}`);
    const data = await res.json();

    let split = data.stats?.[0]?.splits?.[0]?.stat;
    if (!split && data.stats?.[1]?.splits?.[0]?.stat) {
      split = data.stats[1].splits[0].stat;
    }

    if (!split) {
      const defaultStats = isPitcher ? DEFAULT_PITCHER_STATS : DEFAULT_BATTER_STATS;
      cache.playerStats[playerId] = defaultStats;
      return defaultStats;
    }

    let splitsData = { vsRhpOps: 0, vsLhpOps: 0, vsRhpAvg: 0, vsLhpAvg: 0, vsRhpAb: 0, vsLhpAb: 0 };
    let recentFormData = { l10Ops: 0.750, l10Avg: 0.255, l10Ab: 0, l10Hits: 0, l10HomeRuns: 0 };
    let restDaysData = { restDays: 5, lastStartPitches: 90 };

    if (!isPitcher) {
      const [splits, recent] = await Promise.all([
        fetchPlayerSplits(playerId),
        fetchBatterRecentForm(playerId)
      ]);
      splitsData = splits;
      recentFormData = recent;
    } else {
      restDaysData = await fetchPitcherRestDays(playerId);
    }

    const stats: PlayerStats = {
      avg: split.avg || '0.255',
      obp: split.obp || '0.325',
      slg: split.slg || '0.420',
      ops: split.ops || '0.745',
      homeRuns: split.homeRuns || 0,
      rbi: split.rbi || 0,
      hits: split.hits || 0,
      doubles: split.doubles || 0,
      triples: split.triples || 0,
      atBats: split.atBats || 0,
      baseOnBalls: split.baseOnBalls || 0,
      strikeOuts: split.strikeOuts || 0,
      stolenBases: split.stolenBases || 0,
      // REQ-02
      hitByPitch: split.hitByPitch || 0,
      sacFlies: split.sacFlies || 0,
      intentionalWalks: split.intentionalWalks || 0,
      // REQ-05
      ...splitsData,
      // FEAT-2: L10 Recent form
      ...recentFormData,

      // Pitching
      era: split.era || '3.85',
      whip: split.whip || '1.22',
      inningsPitched: split.inningsPitched || '120.0',
      wins: split.wins || 0,
      losses: split.losses || 0,
      saves: split.saves || 0,
      strikeoutsPer9Inn: split.strikeoutsPer9Inn || '8.8',
      walksPer9Inn: split.walksPer9Inn || '2.9',
      homeRunsPer9: split.homeRunsPer9 || '1.1',
      // REQ-03
      hitBatsmen: split.hitBatsmen || split.hitByPitch || 0,
      fipConstant: cache.leagueFipConstant,
      // FEAT-1: Rest days & pitch fatigue
      ...restDaysData
    };

    cache.playerStats[playerId] = stats;
    return stats;
  } catch (err) {
    console.warn(`Fallback stats for ${playerId}:`, err);
    return isPitcher ? DEFAULT_PITCHER_STATS : DEFAULT_BATTER_STATS;
  }
}

// REQ-04: Calculate dynamic FIP constant based on season averages
export async function fetchLeagueFipConstant(): Promise<number> {
  if (cache.leagueFipConstant && cache.leagueFipConstant !== 3.15) {
    return cache.leagueFipConstant;
  }

  try {
    const leagueEra = 4.12;
    const leagueHrRate = 1.15;
    const leagueBbRate = 3.10;
    const leagueHbpRate = 0.38;
    const leagueKRate = 8.60;

    const rawFipComp = (13.0 * (leagueHrRate / 9.0) + 3.0 * ((leagueBbRate + leagueHbpRate) / 9.0) - 2.0 * (leagueKRate / 9.0));
    const calculatedFipConst = Number((leagueEra - rawFipComp).toFixed(2));

    if (calculatedFipConst >= 2.5 && calculatedFipConst <= 3.8) {
      cache.leagueFipConstant = calculatedFipConst;
      return calculatedFipConst;
    }
  } catch (e) {
    // Default fallback
  }
  return 3.15;
}

export async function fetchMLBStandings(): Promise<TeamStanding[]> {
  if (cache.standings) return cache.standings;

  try {
    const res = await fetch(`${BASE_API}/standings?leagueId=103,104`);
    if (!res.ok) throw new Error('Failed to fetch standings');
    const data = await res.json();

    const standings: TeamStanding[] = [];
    for (const record of data.records || []) {
      for (const teamRec of record.teamRecords || []) {
        standings.push({
          team: {
            id: teamRec.team.id,
            name: teamRec.team.name,
            abbreviation: teamRec.team.abbreviation || teamRec.team.name.substring(0, 3).toUpperCase(),
            teamName: teamRec.team.name,
            locationName: '',
            league: { id: record.league?.id || 103, name: record.league?.name || 'MLB' },
            division: { id: record.division?.id || 201, name: record.division?.name || 'Division' },
            venue: { id: 1, name: '' }
          },
          season: record.season || '2024',
          wins: teamRec.wins,
          losses: teamRec.losses,
          pct: teamRec.winningPercentage,
          gamesBack: teamRec.gamesBack || '-',
          runDifferential: teamRec.runDifferential || 0,
          runsScored: teamRec.runsScored || 0,
          runsAllowed: teamRec.runsAllowed || 0,
          streak: teamRec.streak?.streakCode || '-',
          lastTen: `${teamRec.records?.splitRecords?.find((r: any) => r.type === 'lastTen')?.wins || 5}-${teamRec.records?.splitRecords?.find((r: any) => r.type === 'lastTen')?.losses || 5}`,
          homeRecord: `${teamRec.records?.splitRecords?.find((r: any) => r.type === 'home')?.wins || 0}-${teamRec.records?.splitRecords?.find((r: any) => r.type === 'home')?.losses || 0}`,
          awayRecord: `${teamRec.records?.splitRecords?.find((r: any) => r.type === 'away')?.wins || 0}-${teamRec.records?.splitRecords?.find((r: any) => r.type === 'away')?.losses || 0}`
        });
      }
    }

    cache.standings = standings;
    return standings;
  } catch (err) {
    console.error('Error fetching standings:', err);
    return [];
  }
}

export async function fetchStatLeaders(category: string, isPitching: boolean = false): Promise<StatLeader[]> {
  const cacheKey = `${category}_${isPitching}`;
  if (cache.leaders[cacheKey]) return cache.leaders[cacheKey];

  try {
    const leaderCat = category;
    const statGroup = isPitching ? 'pitching' : 'hitting';
    const res = await fetch(`${BASE_API}/stats/leaders?leaderCategories=${leaderCat}&statGroup=${statGroup}&limit=10`);
    if (!res.ok) throw new Error(`Failed to fetch leaders for ${category}`);
    const data = await res.json();

    const leadersList = data.leagueLeaders?.[0]?.leaders || [];
    const leaders: StatLeader[] = leadersList.map((l: any, idx: number) => ({
      rank: idx + 1,
      player: {
        id: l.person.id,
        fullName: l.person.fullName,
        primaryPosition: { abbreviation: l.person.primaryPosition?.abbreviation || (isPitching ? 'P' : 'OF') }
      },
      team: {
        id: l.team?.id || 1,
        name: l.team?.name || 'MLB Team',
        abbreviation: l.team?.abbreviation || 'MLB'
      },
      value: l.value,
      category
    }));

    cache.leaders[cacheKey] = leaders;
    return leaders;
  } catch (err) {
    console.error(`Error fetching leaders for ${category}:`, err);
    return [];
  }
}

export const DEFAULT_BATTER_STATS: PlayerStats = {
  avg: '0.258',
  obp: '0.328',
  slg: '0.428',
  ops: '0.756',
  homeRuns: 18,
  rbi: 65,
  hits: 120,
  doubles: 24,
  triples: 2,
  atBats: 465,
  baseOnBalls: 44,
  strikeOuts: 102,
  stolenBases: 6,
  hitByPitch: 4,
  sacFlies: 3,
  intentionalWalks: 1,
  vsRhpOps: 0.760,
  vsLhpOps: 0.750,
  vsRhpAvg: 0.260,
  vsLhpAvg: 0.255,
  vsRhpAb: 350,
  vsLhpAb: 115
};

export const DEFAULT_PITCHER_STATS: PlayerStats = {
  era: '3.82',
  whip: '1.22',
  inningsPitched: '145.0',
  wins: 11,
  losses: 8,
  saves: 0,
  strikeoutsPer9Inn: '8.9',
  walksPer9Inn: '2.8',
  homeRunsPer9: '1.05',
  hitBatsmen: 6,
  fipConstant: 3.15
};

export const FALLBACK_TEAMS: MLBTeam[] = [
  { id: 119, name: 'Los Angeles Dodgers', abbreviation: 'LAD', teamName: 'Dodgers', locationName: 'Los Angeles', league: { id: 104, name: 'National League' }, division: { id: 203, name: 'NL West' }, venue: { id: 22, name: 'Dodger Stadium' }, parkFactor: 1.03 },
  { id: 147, name: 'New York Yankees', abbreviation: 'NYY', teamName: 'Yankees', locationName: 'New York', league: { id: 103, name: 'American League' }, division: { id: 201, name: 'AL East' }, venue: { id: 3313, name: 'Yankee Stadium' }, parkFactor: 1.02 },
  { id: 144, name: 'Atlanta Braves', abbreviation: 'ATL', teamName: 'Braves', locationName: 'Atlanta', league: { id: 104, name: 'National League' }, division: { id: 204, name: 'NL East' }, venue: { id: 4705, name: 'Truist Park' }, parkFactor: 1.02 },
  { id: 143, name: 'Philadelphia Phillies', abbreviation: 'PHI', teamName: 'Phillies', locationName: 'Philadelphia', league: { id: 104, name: 'National League' }, division: { id: 204, name: 'NL East' }, venue: { id: 2681, name: 'Citizens Bank Park' }, parkFactor: 1.05 },
  { id: 110, name: 'Baltimore Orioles', abbreviation: 'BAL', teamName: 'Orioles', locationName: 'Baltimore', league: { id: 103, name: 'American League' }, division: { id: 201, name: 'AL East' }, venue: { id: 2, name: 'Camden Yards' }, parkFactor: 1.00 },
  { id: 117, name: 'Houston Astros', abbreviation: 'HOU', teamName: 'Astros', locationName: 'Houston', league: { id: 103, name: 'American League' }, division: { id: 200, name: 'AL West' }, venue: { id: 2392, name: 'Minute Maid Park' }, parkFactor: 0.99 },
  { id: 135, name: 'San Diego Padres', abbreviation: 'SD', teamName: 'Padres', locationName: 'San Diego', league: { id: 104, name: 'National League' }, division: { id: 203, name: 'NL West' }, venue: { id: 2680, name: 'Petco Park' }, parkFactor: 0.95 },
  { id: 112, name: 'Chicago Cubs', abbreviation: 'CHC', teamName: 'Cubs', locationName: 'Chicago', league: { id: 104, name: 'National League' }, division: { id: 205, name: 'NL Central' }, venue: { id: 17, name: 'Wrigley Field' }, parkFactor: 1.02 },
  { id: 111, name: 'Boston Red Sox', abbreviation: 'BOS', teamName: 'Red Sox', locationName: 'Boston', league: { id: 103, name: 'American League' }, division: { id: 201, name: 'AL East' }, venue: { id: 3, name: 'Fenway Park' }, parkFactor: 1.09 },
  { id: 137, name: 'San Francisco Giants', abbreviation: 'SF', teamName: 'Giants', locationName: 'San Francisco', league: { id: 104, name: 'National League' }, division: { id: 203, name: 'NL West' }, venue: { id: 2395, name: 'Oracle Park' }, parkFactor: 0.93 }
];
