/**
 * SharpAPI Integration Service for MLB Sports Betting Odds
 * Base URL: https://api.sharpapi.io/api/v1
 * Provides real-time and pregame Moneyline, Totals (O/U), and Runline Spreads
 */

const SHARP_API_KEY = 'sk_live_Fr5zkSo1jVSQYz4dtkjwK4';
const SHARP_BASE_URL = 'https://api.sharpapi.io/api/v1';

export interface SharpOddsItem {
  id: string;
  sportsbook: string;
  event_id: string;
  event_uuid: string;
  sport: string;
  league: string;
  home_team: string;
  away_team: string;
  market_type: 'moneyline' | 'run_line' | 'total_runs' | 'team_total' | string;
  selection: string;
  selection_type: string;
  team_side?: 'home' | 'away';
  odds_american: number;
  odds_decimal: number;
  odds_probability: number;
  line: number | null;
  is_live: boolean;
  timestamp: string;
  home?: {
    name: string;
    abbreviation: string;
  };
  away?: {
    name: string;
    abbreviation: string;
  };
}

export interface LiveSportsbookOdds {
  sportsbook: string;
  isLive: boolean;
  timestamp: string;
  moneyline?: {
    homeOdds: number;
    awayOdds: number;
    homeProb: number;
    awayProb: number;
  };
  totalRuns?: {
    line: number;
    overOdds: number;
    underOdds: number;
  };
  runLine?: {
    spread: number;
    homeOdds: number;
    awayOdds: number;
  };
}

// In-memory cache to prevent rate-limiting (12 req/minute limit)
let cachedOdds: SharpOddsItem[] = [];
let lastFetchTime = 0;
const CACHE_TTL_MS = 10000; // Cache for 10 seconds

/**
 * Fetch all active MLB odds snapshot from SharpAPI
 */
export async function fetchMlbSharpOdds(): Promise<SharpOddsItem[]> {
  const now = Date.now();
  if (cachedOdds.length > 0 && now - lastFetchTime < CACHE_TTL_MS) {
    return cachedOdds;
  }

  try {
    const response = await fetch(`${SHARP_BASE_URL}/odds?league=mlb`, {
      headers: {
        Authorization: `Bearer ${SHARP_API_KEY}`,
        Accept: 'application/json'
      }
    });

    if (!response.ok) {
      console.warn(`SharpAPI returned status ${response.status}`);
      return cachedOdds;
    }

    const data = await response.json();
    if (data && Array.isArray(data.data)) {
      cachedOdds = data.data;
      lastFetchTime = now;
      return cachedOdds;
    }
  } catch (err) {
    console.warn('Error fetching from SharpAPI:', err);
  }

  return cachedOdds;
}

/**
 * Normalize string for fuzzy team matching
 */
function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Find real-time SharpAPI sportsbook odds for a specific MLB matchup
 */
export async function getLiveSportsbookOddsForGame(
  homeTeamName: string,
  awayTeamName: string,
  homeAbbr: string,
  awayAbbr: string
): Promise<LiveSportsbookOdds | null> {
  const allOdds = await fetchMlbSharpOdds();
  if (!allOdds || allOdds.length === 0) return null;

  const hNorm = normalizeName(homeTeamName);
  const aNorm = normalizeName(awayTeamName);
  const hAbbr = homeAbbr.toUpperCase();
  const aAbbr = awayAbbr.toUpperCase();

  // 1. Find odds matching both teams
  const matchOdds = allOdds.filter((item) => {
    const itemHNorm = normalizeName(item.home_team || item.home?.name || '');
    const itemANorm = normalizeName(item.away_team || item.away?.name || '');
    const itemHAbbr = (item.home?.abbreviation || '').toUpperCase();
    const itemAAbbr = (item.away?.abbreviation || '').toUpperCase();

    const homeMatches = itemHNorm.includes(hNorm) || hNorm.includes(itemHNorm) || itemHAbbr === hAbbr;
    const awayMatches = itemANorm.includes(aNorm) || aNorm.includes(itemANorm) || itemAAbbr === aAbbr;

    return homeMatches && awayMatches;
  });

  if (matchOdds.length > 0) {
    return extractGameOdds(matchOdds);
  }

  // 2. Fallback: match by home team abbreviation/name
  const homeOdds = allOdds.filter((item) => {
    const itemHNorm = normalizeName(item.home_team || item.home?.name || '');
    const itemHAbbr = (item.home?.abbreviation || '').toUpperCase();
    return itemHNorm.includes(hNorm) || hNorm.includes(itemHNorm) || itemHAbbr === hAbbr;
  });

  if (homeOdds.length > 0) {
    return extractGameOdds(homeOdds);
  }

  return null;
}

function extractGameOdds(items: SharpOddsItem[]): LiveSportsbookOdds {
  const primaryBook = items[0]?.sportsbook || 'DraftKings';
  const isLive = items.some((i) => i.is_live);
  const timestamp = items[0]?.timestamp || new Date().toISOString();

  let homeMl: number | undefined;
  let awayMl: number | undefined;
  let homeMlProb = 0.5;
  let awayMlProb = 0.5;

  let totalLine = 8.5;
  let overOdds = -110;
  let underOdds = -110;

  let spread = 1.5;
  let homeSpreadOdds = -110;
  let awaySpreadOdds = -110;

  for (const item of items) {
    // Moneyline
    if (item.market_type === 'moneyline') {
      if (item.team_side === 'home' || item.selection_type === 'home') {
        homeMl = item.odds_american;
        homeMlProb = item.odds_probability || 0.5;
      } else if (item.team_side === 'away' || item.selection_type === 'away') {
        awayMl = item.odds_american;
        awayMlProb = item.odds_probability || 0.5;
      }
    }

    // Total Runs (Over/Under)
    if ((item.market_type === 'total_runs' || item.market_type === 'team_total') && item.line !== null) {
      totalLine = item.line;
      if (item.selection_type === 'over' || item.selection.toLowerCase().includes('over')) {
        overOdds = item.odds_american;
      } else if (item.selection_type === 'under' || item.selection.toLowerCase().includes('under')) {
        underOdds = item.odds_american;
      }
    }

    // Run Line (Handicap spread)
    if (item.market_type === 'run_line' && item.line !== null) {
      spread = Math.abs(item.line);
      if (item.team_side === 'home' || item.selection_type === 'home') {
        homeSpreadOdds = item.odds_american;
      } else if (item.team_side === 'away' || item.selection_type === 'away') {
        awaySpreadOdds = item.odds_american;
      }
    }
  }

  return {
    sportsbook: primaryBook.charAt(0).toUpperCase() + primaryBook.slice(1),
    isLive,
    timestamp,
    moneyline:
      homeMl !== undefined && awayMl !== undefined
        ? {
            homeOdds: homeMl,
            awayOdds: awayMl,
            homeProb: homeMlProb,
            awayProb: awayMlProb
          }
        : undefined,
    totalRuns: {
      line: totalLine,
      overOdds,
      underOdds
    },
    runLine: {
      spread,
      homeOdds: homeSpreadOdds,
      awayOdds: awaySpreadOdds
    }
  };
}
