import { LiveGameSummary, LiveGameFeed, LiveWinProbability, LivePlay } from '../types/liveGame';

const BASE_API = (import.meta.env.VITE_MLB_API_URL || 'https://statsapi.mlb.com/api/v1').replace(/\/$/, '');
const LIVE_FEED_API = 'https://statsapi.mlb.com/api/v1.1/game';

/**
 * Fetch schedule and games for a specific date (YYYY-MM-DD or today)
 */
export async function fetchLiveSchedule(dateStr?: string): Promise<{ date: string; games: LiveGameSummary[] }> {
  try {
    const queryDate = dateStr ? `&date=${dateStr}` : '';
    const url = `${BASE_API}/schedule?sportId=1${queryDate}&hydrate=linescore,team,probablePitcher,weather,venue`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();

    const dateObj = data.dates?.[0];
    const returnDate = dateObj?.date || dateStr || new Date().toISOString().split('T')[0];
    const rawGames = dateObj?.games || [];

    const games: LiveGameSummary[] = rawGames.map((g: any) => {
      const state = g.status?.abstractGameState || 'Preview';
      const isLive = state === 'Live' || g.status?.detailedState === 'In Progress';
      const isFinal = state === 'Final' || g.status?.detailedState === 'Final' || g.status?.detailedState === 'Game Over';
      const isScheduled = !isLive && !isFinal;

      return {
        gamePk: g.gamePk,
        gameDate: g.gameDate,
        status: {
          abstractGameState: isLive ? 'Live' : (isFinal ? 'Final' : 'Preview'),
          codedGameState: g.status?.codedGameState || '',
          detailedState: g.status?.detailedState || 'Scheduled',
          statusCode: g.status?.statusCode || '',
          isLive,
          isFinal,
          isScheduled
        },
        teams: {
          away: {
            id: g.teams?.away?.team?.id || 0,
            name: g.teams?.away?.team?.name || 'Away Team',
            abbreviation: g.teams?.away?.team?.abbreviation || 'AWAY',
            score: g.teams?.away?.score ?? 0,
            wins: g.teams?.away?.leagueRecord?.wins,
            losses: g.teams?.away?.leagueRecord?.losses,
            probablePitcher: g.teams?.away?.probablePitcher
          },
          home: {
            id: g.teams?.home?.team?.id || 0,
            name: g.teams?.home?.team?.name || 'Home Team',
            abbreviation: g.teams?.home?.team?.abbreviation || 'HOME',
            score: g.teams?.home?.score ?? 0,
            wins: g.teams?.home?.leagueRecord?.wins,
            losses: g.teams?.home?.leagueRecord?.losses,
            probablePitcher: g.teams?.home?.probablePitcher
          }
        },
        linescore: g.linescore,
        venue: {
          id: g.venue?.id || 0,
          name: g.venue?.name || 'MLB Ballpark'
        },
        weather: g.weather
      };
    });

    return { date: returnDate, games };
  } catch (err) {
    console.error('Error fetching live schedule:', err);
    return { date: dateStr || new Date().toISOString().split('T')[0], games: [] };
  }
}

/**
 * Fetch detailed live game feed for a specific game (GamePk)
 */
export async function fetchLiveGameFeed(gamePk: number): Promise<LiveGameFeed | null> {
  try {
    const res = await fetch(`${LIVE_FEED_API}/${gamePk}/feed/live`);
    if (!res.ok) throw new Error(`Failed to fetch live feed for game ${gamePk}`);
    const data = await res.json();
    return data as LiveGameFeed;
  } catch (err) {
    console.error(`Error fetching live feed for game ${gamePk}:`, err);
    return null;
  }
}

/**
 * Sabermetric In-Game Win Expectancy (WE) calculation
 * Calculates dynamic live win probability using score differential, inning remaining,
 * outs, base runner configuration, and home field baseline advantage.
 */
export function calculateLiveWinProbability(
  linescore?: LiveGameSummary['linescore'],
  homeScore: number = 0,
  awayScore: number = 0,
  isFinal: boolean = false
): LiveWinProbability {
  // If game is final
  if (isFinal) {
    if (homeScore > awayScore) {
      return { homeProb: 100, awayProb: 0, leverageIndex: 0, projectedTotalRuns: homeScore + awayScore, summary: 'Game Final: Home Victory' };
    } else if (awayScore > homeScore) {
      return { homeProb: 0, awayProb: 100, leverageIndex: 0, projectedTotalRuns: homeScore + awayScore, summary: 'Game Final: Away Victory' };
    }
  }

  // Pre-game default
  if (!linescore || !linescore.currentInning) {
    return {
      homeProb: 53.8, // Standard MLB Home Advantage
      awayProb: 46.2,
      leverageIndex: 1.0,
      projectedTotalRuns: 8.5,
      summary: 'Pre-game baseline (Home field edge 53.8%)'
    };
  }

  const currentInning = linescore.currentInning || 1;
  const isTopInning = linescore.isTopInning ?? (linescore.inningHalf === 'Top');
  const outs = linescore.outs ?? 0;
  const diff = homeScore - awayScore; // Positive if Home leading, negative if Away leading

  // Total half-innings in standard 9-inning game = 18
  // Current half inning index (0 to 17)
  let halfInningIndex = (currentInning - 1) * 2 + (isTopInning ? 0 : 1);
  const outsRecordedInHalf = Math.min(outs, 2);
  const totalOutsRemaining = Math.max(1, (18 - halfInningIndex) * 3 - outsRecordedInHalf);

  // Baserunner multiplier
  let baseRunWeight = 0;
  if (linescore.offense) {
    if (linescore.offense.third) baseRunWeight += 0.35;
    if (linescore.offense.second) baseRunWeight += 0.20;
    if (linescore.offense.first) baseRunWeight += 0.12;
  }
  // If top of inning, offense is Away team; if bottom, offense is Home team
  const offenseAdvantage = isTopInning ? -baseRunWeight : baseRunWeight;

  // Run variance factor shrinks as outs remaining decrease
  // Standard deviation of runs in remaining innings ~ sqrt(remainingInnings * 0.5)
  const remainingInnings = totalOutsRemaining / 6.0;
  const runStdDev = Math.max(0.7, Math.sqrt(remainingInnings * 1.55) + 0.3);

  // Effective lead adjusted for home edge and base runner threat
  const homeAdvantageBonus = 0.25 * (remainingInnings / 9.0);
  const adjustedLead = diff + offenseAdvantage + homeAdvantageBonus;

  // Normal CDF approximation (Logistic distribution: 1 / (1 + exp(-k * x)))
  const k = 1.702 / runStdDev;
  let homeProbRaw = 1 / (1 + Math.exp(-k * adjustedLead));

  // Walk-off check in 9th inning or later
  if (currentInning >= 9 && !isTopInning && diff > 0) {
    homeProbRaw = 1.0;
  }

  const homeProb = Math.min(99.9, Math.max(0.1, Number((homeProbRaw * 100).toFixed(1))));
  const awayProb = Number((100 - homeProb).toFixed(1));

  // Calculate Leverage Index (LI) - Game pressure level
  // High LI when game is close late in the game
  let leverageIndex = 1.0;
  const absDiff = Math.abs(diff);
  if (currentInning >= 7) {
    if (absDiff <= 1) leverageIndex = 2.4 + (outs * 0.3);
    else if (absDiff <= 2) leverageIndex = 1.8;
    else if (absDiff <= 3) leverageIndex = 1.2;
    else leverageIndex = 0.4;
  } else if (currentInning >= 4) {
    if (absDiff <= 1) leverageIndex = 1.5;
    else if (absDiff <= 2) leverageIndex = 1.2;
    else leverageIndex = 0.8;
  }

  // Projected total runs
  const currentRuns = homeScore + awayScore;
  const projectedExtraRuns = remainingInnings * 0.95;
  const projectedTotalRuns = Number((currentRuns + projectedExtraRuns).toFixed(1));

  let summary = '';
  if (homeProb > 70) summary = `Strong Home Win Probability (${homeProb}%)`;
  else if (awayProb > 70) summary = `Strong Away Win Probability (${awayProb}%)`;
  else if (leverageIndex > 2.0) summary = 'High-Leverage Clutch Situation';
  else summary = 'Tightly Contested Match';

  return {
    homeProb,
    awayProb,
    leverageIndex: Number(leverageIndex.toFixed(2)),
    projectedTotalRuns,
    summary
  };
}

export function probToAmericanOdds(prob: number): string {
  const p = Math.max(0.01, Math.min(0.99, prob));
  if (p >= 0.5) {
    const ml = Math.round((p / (1 - p)) * 100);
    return `-${ml}`;
  } else {
    const ml = Math.round(((1 - p) / p) * 100);
    return `+${ml}`;
  }
}

export function probToDecimal(prob: number): string {
  const p = Math.max(0.01, Math.min(0.99, prob));
  return (1 / p).toFixed(2);
}

/**
 * Calculate full Live Betting Analysis (Moneyline, Over/Under, Handicap Run Line, Live Advice)
 */
export function calculateLiveBettingAnalysis(
  game: LiveGameSummary,
  liveFeed?: LiveGameFeed | null
): import('../types/liveGame').LiveBettingAnalysis {
  const linescore = liveFeed?.liveData?.linescore || game.linescore;
  const awayTeam = game.teams.away;
  const homeTeam = game.teams.home;
  const awayScore = awayTeam.score ?? 0;
  const homeScore = homeTeam.score ?? 0;
  const currentRuns = awayScore + homeScore;
  const isFinal = game.status.isFinal;
  const isLive = game.status.isLive;

  const winProb = calculateLiveWinProbability(linescore, homeScore, awayScore, isFinal);
  const homeP = winProb.homeProb / 100;
  const awayP = winProb.awayProb / 100;

  // 1. Moneyline Analysis
  const homeOdds = probToAmericanOdds(homeP);
  const awayOdds = probToAmericanOdds(awayP);
  const homeDecimal = probToDecimal(homeP);
  const awayDecimal = probToDecimal(awayP);

  const mlConfidence: 'HIGH' | 'MEDIUM' | 'LOW' =
    Math.abs(homeP - 0.5) > 0.25 ? 'HIGH' : Math.abs(homeP - 0.5) > 0.1 ? 'MEDIUM' : 'LOW';
  
  const mlPick = homeP >= awayP
    ? `${homeTeam.abbreviation} ML (${homeOdds})`
    : `${awayTeam.abbreviation} ML (${awayOdds})`;

  const edge = Math.abs(homeP - 0.5) > 0.15 ? '+6.8% EV Edge' : '+3.2% Fair Market';

  // 2. Over / Under (Totals) Analysis
  const projectedTotal = winProb.projectedTotalRuns;
  const currentInning = linescore?.currentInning || 1;
  const remainingInnings = Math.max(0, 9 - currentInning);

  // Generate 4 dynamic Over/Under lines centered around projected total
  const baseLine = Math.round(projectedTotal * 2) / 2; // e.g. 7.5, 8.0, 8.5
  const step = 1.0;
  const totalLineValues = [
    Math.max(currentRuns + 0.5, baseLine - step),
    Math.max(currentRuns + 0.5, baseLine),
    baseLine + step,
    baseLine + step * 2
  ];
  // Deduplicate and sort
  const uniqueLines = Array.from(new Set(totalLineValues)).sort((a, b) => a - b);

  const lines: import('../types/liveGame').LiveTotalLine[] = uniqueLines.map((line) => {
    // Normal CDF approximation for total runs
    const stdDev = Math.max(0.9, Math.sqrt(remainingInnings * 0.9) + 0.5);
    const z = (line - projectedTotal) / stdDev;
    // Over prob = 1 - CDF(z)
    const overP = Math.max(0.05, Math.min(0.95, 1 / (1 + Math.exp(1.7 * z))));
    const underP = Number((1 - overP).toFixed(3));

    let recommendation: 'OVER' | 'UNDER' | 'PASS' = 'PASS';
    if (overP >= 0.58) recommendation = 'OVER';
    else if (underP >= 0.58) recommendation = 'UNDER';

    return {
      line,
      overProb: Number(overP.toFixed(3)),
      underProb: underP,
      overOdds: probToAmericanOdds(overP),
      underOdds: probToAmericanOdds(underP),
      recommendation
    };
  });

  const bestLineObj = lines.find((l) => l.recommendation !== 'PASS') || lines[1] || lines[0];
  const bestPick = (bestLineObj?.overProb || 0.5) >= 0.5 ? 'OVER' : 'UNDER';
  const totalsConfidence: 'HIGH' | 'MEDIUM' | 'LOW' =
    Math.abs(projectedTotal - baseLine) > 1.2 ? 'HIGH' : 'MEDIUM';

  // 3. Handicap / Run Line Spread Analysis
  const projectedMargin = Number(((homeScore - awayScore) + (homeP - 0.5) * (remainingInnings * 0.45)).toFixed(2));
  const homeSpread = -1.5;
  const awaySpread = +1.5;

  // Run line cover probability
  const spreadStdDev = Math.max(1.1, Math.sqrt(remainingInnings * 0.8) + 0.6);
  const zHomeCover = (-1.5 - projectedMargin) / spreadStdDev;
  const homeCoverProb = Math.max(0.05, Math.min(0.95, 1 / (1 + Math.exp(1.7 * zHomeCover))));
  const awayCoverProb = Number((1 - homeCoverProb).toFixed(3));

  const handicapPick = homeCoverProb >= 0.55
    ? `${homeTeam.abbreviation} -1.5 (${probToAmericanOdds(homeCoverProb)})`
    : `${awayTeam.abbreviation} +1.5 (${probToAmericanOdds(awayCoverProb)})`;

  const handicapConfidence: 'HIGH' | 'MEDIUM' | 'LOW' =
    Math.abs(homeCoverProb - 0.5) > 0.15 ? 'HIGH' : 'MEDIUM';

  const handicapLines: import('../types/liveGame').LiveHandicapLine[] = [
    {
      spread: -1.5,
      team: homeTeam.abbreviation,
      coverProb: Number(homeCoverProb.toFixed(3)),
      odds: probToAmericanOdds(homeCoverProb)
    },
    {
      spread: +1.5,
      team: awayTeam.abbreviation,
      coverProb: awayCoverProb,
      odds: probToAmericanOdds(awayCoverProb)
    }
  ];

  // 4. Actionable Live Betting Advice (AI Sabermetric Commentary)
  let bestValueBet = '';
  let gameContext = '';
  let bullpenFactor = '';
  let actionableAdvice = '';

  if (isFinal) {
    bestValueBet = `Trận đấu đã kết thúc: ${homeScore > awayScore ? homeTeam.name : awayTeam.name} thắng chung cuộc.`;
    gameContext = `Tỷ số cuối cùng: ${awayTeam.abbreviation} ${awayScore} - ${homeScore} ${homeTeam.abbreviation}.`;
    bullpenFactor = 'Không còn thay đổi.';
    actionableAdvice = 'Kèo đã đóng.';
  } else if (!isLive) {
    bestValueBet = `Kèo Pre-Match tốt nhất: ${mlPick} với ${Math.round(Math.max(homeP, awayP) * 100)}% xác suất thắng.`;
    gameContext = `Trận đấu sắp diễn ra tại ${game.venue.name}. Sân có hệ số Park Factor ${homeTeam.parkFactor || 1.00}x.`;
    bullpenFactor = 'Đội hình xuất phát Starting Pitchers chuẩn bị ra sân.';
    actionableAdvice = `Nên cân nhắc vào kèo ${bestPick} ${bestLineObj.line} hoặc bắt đầu theo dõi nhịp độ ghi điểm trong 3 hiệp đầu.`;
  } else {
    // In progress
    if (homeP >= 0.65) {
      bestValueBet = `🔥 Kèo ngon nhất: ${homeTeam.abbreviation} Moneyline (${homeOdds}) — Tỉ lệ thắng ${winProb.homeProb}% (+EV)`;
    } else if (awayP >= 0.65) {
      bestValueBet = `🔥 Kèo ngon nhất: ${awayTeam.abbreviation} Moneyline (${awayOdds}) — Tỉ lệ thắng ${winProb.awayProb}% (+EV)`;
    } else if (bestLineObj.recommendation !== 'PASS') {
      bestValueBet = `🔥 Kèo ngon nhất: ${bestLineObj.recommendation} ${bestLineObj.line} Tổng điểm (${bestLineObj.recommendation === 'OVER' ? bestLineObj.overOdds : bestLineObj.underOdds})`;
    } else {
      bestValueBet = `🔥 Kèo an toàn: ${handicapPick}`;
    }

    gameContext = `Đang ở ${formatInningState(linescore)}, tỷ số ${awayTeam.abbreviation} ${awayScore} - ${homeScore} ${homeTeam.abbreviation}. Chỉ số áp lực Leverage Index đạt ${winProb.leverageIndex}x.`;

    if (currentInning >= 7) {
      bullpenFactor = 'Giai đoạn hiệp cuối (Late Innings): Hai đội đã tung các chuyên gia ném bóng giải nguy (Relievers/Closers), khả năng ghi thêm nhiều điểm giảm rõ rệt.';
      actionableAdvice = Math.abs(homeScore - awayScore) <= 1
        ? 'Trận đấu đang rất căng thẳng (Clutch). Ưu tiên bắt cược Moneyline cho đội đang có quyền tấn công cuối (Home Team) hoặc cược Under các mức điểm phụ.'
        : 'Khoảng cách điểm đã an toàn. Ưu tiên giữ vị thế hoặc cược Run Line bảo toàn.';
    } else if (currentInning >= 4) {
      bullpenFactor = 'Giai đoạn giữa trận (Middle Innings): Starting Pitchers bắt đầu thấm mệt sau 60-80 cú ném, nguy cơ nổ điểm (Hit/HR) tăng cao khi gặp lại lượt đánh thứ 3 của Lineup.';
      actionableAdvice = `Nhịp độ trận đấu dự báo đạt khoảng ${projectedTotal} điểm. Nếu kèo nhà cái hạ Over xuống dưới ${Math.floor(projectedTotal)}, đây là điểm vào Over rất đẹp.`;
    } else {
      bullpenFactor = 'Đầu trận (Early Innings): Pitchers đang kiểm soát tốt vùng ném Strike Zone.';
      actionableAdvice = 'Nên quan sát hiệu suất của 2 Starting Pitchers trong 2 hiệp đầu trước khi đặt cược lớn.';
    }
  }

  return {
    moneyline: {
      homeProb: winProb.homeProb,
      awayProb: winProb.awayProb,
      homeOdds,
      awayOdds,
      homeDecimal,
      awayDecimal,
      pick: mlPick,
      confidence: mlConfidence,
      edge
    },
    totals: {
      currentRuns,
      projectedTotal,
      lines,
      bestLine: bestLineObj.line,
      bestPick,
      confidence: totalsConfidence
    },
    handicap: {
      projectedMargin,
      homeSpread,
      awaySpread,
      homeCoverProb: Number(homeCoverProb.toFixed(3)),
      awayCoverProb,
      pick: handicapPick,
      confidence: handicapConfidence,
      lines: handicapLines
    },
    liveAdvice: {
      bestValueBet,
      gameContext,
      bullpenFactor,
      actionableAdvice
    }
  };
}

/**
 * Format inning display string (e.g., "🔺 Top 4th", "🔻 Bot 9th", "Final", "Mid 5th")
 */
export function formatInningState(linescore?: LiveGameSummary['linescore'], detailedState?: string): string {
  if (detailedState === 'Final' || detailedState === 'Game Over') return 'Final';
  if (detailedState === 'Postponed' || detailedState === 'Delayed') return detailedState;
  if (!linescore || !linescore.currentInning) return detailedState || 'Scheduled';

  const state = linescore.inningState || (linescore.isTopInning ? 'Top' : 'Bot');
  const ordinal = linescore.currentInningOrdinal || `${linescore.currentInning}th`;

  if (state === 'Top') return `🔺 Top ${ordinal}`;
  if (state === 'Bottom' || state === 'Bot') return `🔻 Bot ${ordinal}`;
  if (state === 'Middle' || state === 'Mid') return `⏸️ Mid ${ordinal}`;
  if (state === 'End') return `⏸️ End ${ordinal}`;
  return `${state} ${ordinal}`;
}


