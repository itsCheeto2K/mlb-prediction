/**
 * SharpAPI Integration Service for MLB Sports Betting Odds
 * Base URL: https://api.sharpapi.io/api/v1
 * Provides real-time and pregame Moneyline, Totals (O/U), and Runline Spreads from DraftKings and FanDuel
 */

const SHARP_API_KEY = 'sk_live_Fr5zkSo1jVSQYz4dtkjwK4';
const SHARP_BASE_URL = 'https://api.sharpapi.io/api/v1';

export interface SharpOddsItem {
  id: string;
  sportsbook: string;
  event_id: string;
  event_uuid?: string;
  sport?: string;
  league?: string;
  home_team?: string;
  away_team?: string;
  market_type: 'moneyline' | 'run_line' | 'total_runs' | 'team_total' | string;
  selection: string;
  selection_type: string;
  team_side?: 'home' | 'away';
  odds_american: number;
  odds_decimal?: number;
  odds_probability?: number;
  line: number | null;
  is_live: boolean;
  timestamp: string;
  is_main_line?: boolean;
  is_alternate_line?: boolean;
  is_player_prop?: boolean;
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
let cachedOdds: { data: SharpOddsItem[]; timestamp: number } | null = null;
const CACHE_TTL_MS = 15000; // Cache for 15 seconds

const MLB_TEAM_ALIASES: Record<string, string[]> = {
  ATH: ['ATH', 'OAK', 'OAKLAND', 'ATHLETICS', "A'S"],
  OAK: ['ATH', 'OAK', 'OAKLAND', 'ATHLETICS', "A'S"],
  CWS: ['CWS', 'CHW', 'WHITE SOX', 'CHICAGO WHITE SOX', 'CHI WHITE SOX'],
  CHW: ['CWS', 'CHW', 'WHITE SOX', 'CHICAGO WHITE SOX', 'CHI WHITE SOX'],
  SD: ['SD', 'SDP', 'PADRES', 'SAN DIEGO PADRES', 'SD PADRES'],
  SDP: ['SD', 'SDP', 'PADRES', 'SAN DIEGO PADRES', 'SD PADRES'],
  SF: ['SF', 'SFG', 'GIANTS', 'SAN FRANCISCO GIANTS', 'SF GIANTS'],
  SFG: ['SF', 'SFG', 'GIANTS', 'SAN FRANCISCO GIANTS', 'SF GIANTS'],
  TB: ['TB', 'TBR', 'RAYS', 'TAMPA BAY RAYS', 'TB RAYS'],
  TBR: ['TB', 'TBR', 'RAYS', 'TAMPA BAY RAYS', 'TB RAYS'],
  WAS: ['WAS', 'WSH', 'NATIONALS', 'WASHINGTON NATIONALS', 'WAS NATIONALS'],
  WSH: ['WAS', 'WSH', 'NATIONALS', 'WASHINGTON NATIONALS', 'WAS NATIONALS'],
  KC: ['KC', 'KCR', 'ROYALS', 'KANSAS CITY ROYALS', 'KC ROYALS'],
  KCR: ['KC', 'KCR', 'ROYALS', 'KANSAS CITY ROYALS', 'KC ROYALS'],
  ARI: ['ARI', 'AZ', 'DIAMONDBACKS', 'ARIZONA DIAMONDBACKS', 'D-BACKS', 'ARI DIAMONDBACKS'],
  AZ: ['ARI', 'AZ', 'DIAMONDBACKS', 'ARIZONA DIAMONDBACKS', 'D-BACKS', 'ARI DIAMONDBACKS'],
  BOS: ['BOS', 'RED SOX', 'BOSTON RED SOX', 'BOS RED SOX'],
  CHC: ['CHC', 'CUBS', 'CHICAGO CUBS', 'CHI CUBS'],
  LAA: ['LAA', 'ANGELS', 'LOS ANGELES ANGELS', 'LA ANGELS'],
  LAD: ['LAD', 'DODGERS', 'LOS ANGELES DODGERS', 'LA DODGERS'],
  NYY: ['NYY', 'YANKEES', 'NEW YORK YANKEES', 'NY YANKEES'],
  NYM: ['NYM', 'METS', 'NEW YORK METS', 'NY METS']
};

/**
 * Fetch all active MLB odds snapshot from SharpAPI for main betting markets (Moneyline, Totals, Runline)
 */
export async function fetchMlbSharpOdds(): Promise<SharpOddsItem[]> {
  const now = Date.now();
  if (cachedOdds && now - cachedOdds.timestamp < CACHE_TTL_MS) {
    return cachedOdds.data;
  }

  try {
    const headers = {
      Authorization: `Bearer ${SHARP_API_KEY}`,
      Accept: 'application/json'
    };

    // Query key markets in parallel so player props don't crowd out game lines
    const [mlRes, totRes, rlRes] = await Promise.all([
      fetch(`${SHARP_BASE_URL}/odds?league=mlb&market_type=moneyline&limit=250`, { headers }),
      fetch(`${SHARP_BASE_URL}/odds?league=mlb&market_type=total_runs&is_main_line=true&limit=250`, { headers }),
      fetch(`${SHARP_BASE_URL}/odds?league=mlb&market_type=run_line&is_main_line=true&limit=250`, { headers })
    ]);

    const [mlData, totData, rlData] = await Promise.all([
      mlRes.ok ? mlRes.json() : { data: [] },
      totRes.ok ? totRes.json() : { data: [] },
      rlRes.ok ? rlRes.json() : { data: [] }
    ]);

    const allItems: SharpOddsItem[] = [
      ...(Array.isArray(mlData.data) ? mlData.data : []),
      ...(Array.isArray(totData.data) ? totData.data : []),
      ...(Array.isArray(rlData.data) ? rlData.data : [])
    ];

    if (allItems.length > 0) {
      cachedOdds = { data: allItems, timestamp: now };
      return allItems;
    }
  } catch (err) {
    console.warn('Error fetching from SharpAPI:', err);
  }

  return cachedOdds?.data || [];
}

/**
 * Normalize string for fuzzy team matching
 */
function normalizeName(name: string): string {
  return (name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Helper to match team names / abbreviations with MLB alias support
 */
function matchTeam(targetName: string, targetAbbr: string, itemName: string, itemAbbr: string): boolean {
  const normTarget = normalizeName(targetName);
  const normItem = normalizeName(itemName);
  const tAbbr = (targetAbbr || '').toUpperCase();
  const iAbbr = (itemAbbr || '').toUpperCase();

  if (tAbbr && iAbbr && tAbbr === iAbbr) return true;
  if (MLB_TEAM_ALIASES[tAbbr]?.some((alias) => normalizeName(alias) === normItem || alias.toUpperCase() === iAbbr)) {
    return true;
  }
  if (normTarget && normItem && (normTarget.includes(normItem) || normItem.includes(normTarget))) {
    return true;
  }

  return false;
}

/**
 * Find real-time SharpAPI sportsbook odds for a specific MLB matchup (defaults to FanDuel or DraftKings)
 */
export async function getLiveSportsbookOddsForGame(
  homeTeamName: string,
  awayTeamName: string,
  homeAbbr: string,
  awayAbbr: string,
  sportsbook: string = 'fanduel'
): Promise<LiveSportsbookOdds | null> {
  const allOdds = await fetchMlbSharpOdds();
  if (!allOdds || allOdds.length === 0) return null;

  // 1. Find odds matching both teams
  const matchOdds = allOdds.filter((item) => {
    const itemHName = item.home_team || item.home?.name || '';
    const itemAName = item.away_team || item.away?.name || '';
    const itemHAbbr = item.home?.abbreviation || '';
    const itemAAbbr = item.away?.abbreviation || '';

    const homeMatches = matchTeam(homeTeamName, homeAbbr, itemHName, itemHAbbr);
    const awayMatches = matchTeam(awayTeamName, awayAbbr, itemAName, itemAAbbr);

    return homeMatches && awayMatches;
  });

  if (matchOdds.length > 0) {
    return extractGameOdds(matchOdds, sportsbook);
  }

  // 2. Fallback: match by home team
  const homeOdds = allOdds.filter((item) => {
    const itemHName = item.home_team || item.home?.name || '';
    const itemHAbbr = item.home?.abbreviation || '';
    return matchTeam(homeTeamName, homeAbbr, itemHName, itemHAbbr);
  });

  if (homeOdds.length > 0) {
    return extractGameOdds(homeOdds, sportsbook);
  }

  return null;
}

function formatSportsbookName(book: string): string {
  if (!book) return 'FanDuel';
  const lower = book.toLowerCase();
  if (lower === 'fanduel') return 'FanDuel';
  if (lower === 'draftkings') return 'DraftKings';
  if (lower === 'betmgm') return 'BetMGM';
  if (lower === 'caesars') return 'Caesars';
  if (lower === 'pointsbet') return 'PointsBet';
  return book.charAt(0).toUpperCase() + book.slice(1);
}

function extractGameOdds(items: SharpOddsItem[], preferredBook: string = 'fanduel'): LiveSportsbookOdds {
  const prefBookLower = preferredBook.toLowerCase();
  const prefItems = items.filter((i) => i.sportsbook?.toLowerCase() === prefBookLower);

  const primaryBook = prefItems.length > 0 ? prefItems[0]?.sportsbook : items[0]?.sportsbook || preferredBook;
  const isLive = items.some((i) => i.is_live);
  const timestamp = items[0]?.timestamp || new Date().toISOString();

  // 1. Moneyline Extraction (prefer preferredBook, fallback to any available book)
  let homeMl: number | undefined;
  let awayMl: number | undefined;
  let homeMlProb = 0.5;
  let awayMlProb = 0.5;

  const getMlItems = (source: SharpOddsItem[]) => source.filter((i) => i.market_type === 'moneyline' && !i.is_player_prop);
  let mlItems = getMlItems(prefItems);
  if (mlItems.length === 0) mlItems = getMlItems(items);

  for (const item of mlItems) {
    if (item.team_side === 'home' || item.selection_type === 'home') {
      homeMl = item.odds_american;
      homeMlProb = item.odds_probability || 0.5;
    } else if (item.team_side === 'away' || item.selection_type === 'away') {
      awayMl = item.odds_american;
      awayMlProb = item.odds_probability || 0.5;
    }
  }

  // 2. Total Runs (Over/Under) Extraction (prefer preferredBook, fallback to any available book)
  const getTotalItems = (source: SharpOddsItem[]) =>
    source.filter((i) => i.market_type === 'total_runs' && i.line !== null && !i.is_player_prop);

  let totalItems = getTotalItems(prefItems);
  if (totalItems.length === 0) totalItems = getTotalItems(items);

  interface LineData {
    line: number;
    overOdds?: number;
    underOdds?: number;
    isMain: boolean;
  }
  const linesMap = new Map<number, LineData>();

  for (const item of totalItems) {
    if (item.line === null) continue;
    const l = item.line;
    if (!linesMap.has(l)) {
      linesMap.set(l, {
        line: l,
        isMain: item.is_main_line === true || item.is_alternate_line === false
      });
    }
    const current = linesMap.get(l)!;
    if (item.is_main_line === true) current.isMain = true;

    const sel = (item.selection_type || item.selection || '').toLowerCase();
    if (sel.includes('over')) {
      current.overOdds = item.odds_american;
    } else if (sel.includes('under')) {
      current.underOdds = item.odds_american;
    }
  }

  let selectedTotal: { line: number; overOdds: number; underOdds: number } | undefined;

  if (linesMap.size > 0) {
    const candidates = Array.from(linesMap.values());
    // 1st priority: explicit main line
    let best = candidates.find((c) => c.isMain && (c.overOdds !== undefined || c.underOdds !== undefined));

    // 2nd priority: line with both Over & Under available, closest to standard 8.5
    if (!best) {
      const fullLines = candidates.filter((c) => c.overOdds !== undefined && c.underOdds !== undefined);
      if (fullLines.length > 0) {
        fullLines.sort((a, b) => Math.abs(a.line - 8.5) - Math.abs(b.line - 8.5));
        best = fullLines[0];
      }
    }

    // 3rd priority: line closest to 8.5 with at least one odds
    if (!best) {
      candidates.sort((a, b) => Math.abs(a.line - 8.5) - Math.abs(b.line - 8.5));
      best = candidates[0];
    }

    if (best) {
      const over =
        best.overOdds ??
        (best.underOdds !== undefined
          ? best.underOdds > 0
            ? -(best.underOdds + 20)
            : Math.abs(best.underOdds) - 20
          : -110);
      const under =
        best.underOdds ??
        (best.overOdds !== undefined
          ? best.overOdds > 0
            ? -(best.overOdds + 20)
            : Math.abs(best.overOdds) - 20
          : -110);
      selectedTotal = {
        line: best.line,
        overOdds: over,
        underOdds: under
      };
    }
  }

  // 3. Run Line (Handicap spread) Extraction (prefer preferredBook, fallback to any available book)
  const getRlItems = (source: SharpOddsItem[]) =>
    source.filter((i) => i.market_type === 'run_line' && i.line !== null && !i.is_player_prop);

  let rlItems = getRlItems(prefItems);
  if (rlItems.length === 0) rlItems = getRlItems(items);

  let spread = 1.5;
  let homeSpreadOdds = -110;
  let awaySpreadOdds = -110;

  // Filter 1.5 spread items (standard MLB runline) or main lines
  const standardRlItems = rlItems.filter((i) => Math.abs(i.line || 0) === 1.5 || i.is_main_line === true);
  const targetRl = standardRlItems.length > 0 ? standardRlItems : rlItems;

  for (const item of targetRl) {
    if (item.line !== null) {
      spread = Math.abs(item.line);
    }
    if (item.team_side === 'home' || item.selection_type === 'home') {
      homeSpreadOdds = item.odds_american;
    } else if (item.team_side === 'away' || item.selection_type === 'away') {
      awaySpreadOdds = item.odds_american;
    }
  }

  return {
    sportsbook: formatSportsbookName(primaryBook),
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
    totalRuns: selectedTotal || {
      line: 8.5,
      overOdds: -110,
      underOdds: -110
    },
    runLine: {
      spread,
      homeOdds: homeSpreadOdds,
      awayOdds: awaySpreadOdds
    }
  };
}

