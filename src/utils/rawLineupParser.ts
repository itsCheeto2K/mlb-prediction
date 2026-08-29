export interface ParsedBatter {
  order: number;
  name: string;
  position: string;
  hand: 'R' | 'L' | 'S';
}

export interface ParsedPitcher {
  name: string;
  hand: 'R' | 'L' | 'S';
  wins?: number;
  losses?: number;
  era?: number;
  rawRecord?: string;
}

export interface ParsedTeamLineup {
  teamAbbr: string;
  teamName?: string;
  pitcher?: ParsedPitcher;
  batters: ParsedBatter[];
}

export interface ParsedMatchup {
  team1: ParsedTeamLineup;
  team2: ParsedTeamLineup;
  formattedMarkdown: string;
}

export const MLB_TEAM_DICTIONARY: Record<string, { abbr: string; name: string }> = {
  BAL: { abbr: 'BAL', name: 'Baltimore Orioles' },
  BOS: { abbr: 'BOS', name: 'Boston Red Sox' },
  NYY: { abbr: 'NYY', name: 'New York Yankees' },
  TB: { abbr: 'TB', name: 'Tampa Bay Rays' },
  TBR: { abbr: 'TB', name: 'Tampa Bay Rays' },
  TOR: { abbr: 'TOR', name: 'Toronto Blue Jays' },
  CWS: { abbr: 'CWS', name: 'Chicago White Sox' },
  CHW: { abbr: 'CWS', name: 'Chicago White Sox' },
  CLE: { abbr: 'CLE', name: 'Cleveland Guardians' },
  DET: { abbr: 'DET', name: 'Detroit Tigers' },
  KC: { abbr: 'KC', name: 'Kansas City Royals' },
  KCR: { abbr: 'KC', name: 'Kansas City Royals' },
  MIN: { abbr: 'MIN', name: 'Minnesota Twins' },
  HOU: { abbr: 'HOU', name: 'Houston Astros' },
  LAA: { abbr: 'LAA', name: 'Los Angeles Angels' },
  OAK: { abbr: 'ATH', name: 'Athletics' },
  ATH: { abbr: 'ATH', name: 'Athletics' },
  SEA: { abbr: 'SEA', name: 'Seattle Mariners' },
  TEX: { abbr: 'TEX', name: 'Texas Rangers' },
  ATL: { abbr: 'ATL', name: 'Atlanta Braves' },
  MIA: { abbr: 'MIA', name: 'Miami Marlins' },
  NYM: { abbr: 'NYM', name: 'New York Mets' },
  PHI: { abbr: 'PHI', name: 'Philadelphia Phillies' },
  WSH: { abbr: 'WSH', name: 'Washington Nationals' },
  WAS: { abbr: 'WSH', name: 'Washington Nationals' },
  CHC: { abbr: 'CHC', name: 'Chicago Cubs' },
  CIN: { abbr: 'CIN', name: 'Cincinnati Reds' },
  MIL: { abbr: 'MIL', name: 'Milwaukee Brewers' },
  PIT: { abbr: 'PIT', name: 'Pittsburgh Pirates' },
  STL: { abbr: 'STL', name: 'St. Louis Cardinals' },
  ARI: { abbr: 'ARI', name: 'Arizona Diamondbacks' },
  AZ: { abbr: 'ARI', name: 'Arizona Diamondbacks' },
  COL: { abbr: 'COL', name: 'Colorado Rockies' },
  LAD: { abbr: 'LAD', name: 'Los Angeles Dodgers' },
  SD: { abbr: 'SD', name: 'San Diego Padres' },
  SDP: { abbr: 'SD', name: 'San Diego Padres' },
  SF: { abbr: 'SF', name: 'San Francisco Giants' },
  SFG: { abbr: 'SF', name: 'San Francisco Giants' },

  ORIOLES: { abbr: 'BAL', name: 'Baltimore Orioles' },
  REDSOX: { abbr: 'BOS', name: 'Boston Red Sox' },
  YANKEES: { abbr: 'NYY', name: 'New York Yankees' },
  RAYS: { abbr: 'TB', name: 'Tampa Bay Rays' },
  BLUEJAYS: { abbr: 'TOR', name: 'Toronto Blue Jays' },
  WHITESOX: { abbr: 'CWS', name: 'Chicago White Sox' },
  GUARDIANS: { abbr: 'CLE', name: 'Cleveland Guardians' },
  TIGERS: { abbr: 'DET', name: 'Detroit Tigers' },
  ROYALS: { abbr: 'KC', name: 'Kansas City Royals' },
  TWINS: { abbr: 'MIN', name: 'Minnesota Twins' },
  ASTROS: { abbr: 'HOU', name: 'Houston Astros' },
  ANGELS: { abbr: 'LAA', name: 'Los Angeles Angels' },
  ATHLETICS: { abbr: 'ATH', name: 'Athletics' },
  MARINERS: { abbr: 'SEA', name: 'Seattle Mariners' },
  RANGERS: { abbr: 'TEX', name: 'Texas Rangers' },
  BRAVES: { abbr: 'ATL', name: 'Atlanta Braves' },
  MARLINS: { abbr: 'MIA', name: 'Miami Marlins' },
  METS: { abbr: 'NYM', name: 'New York Mets' },
  PHILLIES: { abbr: 'PHI', name: 'Philadelphia Phillies' },
  NATIONALS: { abbr: 'WSH', name: 'Washington Nationals' },
  CUBS: { abbr: 'CHC', name: 'Chicago Cubs' },
  REDS: { abbr: 'CIN', name: 'Cincinnati Reds' },
  BREWERS: { abbr: 'MIL', name: 'Milwaukee Brewers' },
  PIRATES: { abbr: 'PIT', name: 'Pittsburgh Pirates' },
  CARDINALS: { abbr: 'STL', name: 'St. Louis Cardinals' },
  DIAMONDBACKS: { abbr: 'ARI', name: 'Arizona Diamondbacks' },
  ROCKIES: { abbr: 'COL', name: 'Colorado Rockies' },
  DODGERS: { abbr: 'LAD', name: 'Los Angeles Dodgers' },
  PADRES: { abbr: 'SD', name: 'San Diego Padres' },
  GIANTS: { abbr: 'SF', name: 'San Francisco Giants' },
};

const POSITIONS = ['1B', '2B', '3B', 'SS', 'C', 'LF', 'CF', 'RF', 'DH', 'OF', 'IF', 'P', 'SP', 'RP'];

const IGNORE_KEYWORDS = [
  'confirmed lineup',
  'projected lineup',
  'starting lineup',
  'lineup',
  'home run odds',
  'starting pitcher intel',
  'pitcher intel',
  'odds',
  'intel'
];

export function parseRawLineupText(rawText: string): ParsedMatchup {
  const lines = rawText
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean);

  const detectedTeams: { abbr: string; name: string }[] = [];
  for (const line of lines) {
    const cleanWord = line.replace(/[^a-zA-Z]/g, '').toUpperCase();
    if (cleanWord && MLB_TEAM_DICTIONARY[cleanWord]) {
      const match = MLB_TEAM_DICTIONARY[cleanWord];
      if (!detectedTeams.some(t => t.abbr === match.abbr)) {
        detectedTeams.push(match);
      }
    }
  }

  const team1Info = detectedTeams[0] || { abbr: 'CIN', name: 'Cincinnati Reds' };
  const team2Info = detectedTeams[1] || { abbr: 'CHC', name: 'Chicago Cubs' };

  const team1: ParsedTeamLineup = { teamAbbr: team1Info.abbr, teamName: team1Info.name, batters: [] };
  const team2: ParsedTeamLineup = { teamAbbr: team2Info.abbr, teamName: team2Info.name, batters: [] };

  let currentTeamIndex = 0;
  let activePitcher: ParsedPitcher | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lowerLine = line.toLowerCase();

    if (IGNORE_KEYWORDS.some(kw => lowerLine === kw)) {
      continue;
    }

    const cleanWord = line.replace(/[^a-zA-Z]/g, '').toUpperCase();
    if (
      MLB_TEAM_DICTIONARY[cleanWord] &&
      cleanWord.length <= 5 &&
      !cleanWord.startsWith('CF') &&
      !cleanWord.startsWith('LF') &&
      !cleanWord.startsWith('RF') &&
      !cleanWord.startsWith('SS') &&
      !cleanWord.startsWith('DH') &&
      !cleanWord.startsWith('1B') &&
      !cleanWord.startsWith('2B') &&
      !cleanWord.startsWith('3B')
    ) {
      continue;
    }
    if (line.match(/^[A-Za-z]+\s*\(\d+-\d+\)$/)) {
      continue;
    }

    // Check Pitcher stat line
    const eraMatch = line.match(/(\d+)-(\d+)\s+([\d.]+)\s*ERA/i);
    if (eraMatch && activePitcher !== null) {
      const p = activePitcher as ParsedPitcher;
      p.wins = parseInt(eraMatch[1], 10);
      p.losses = parseInt(eraMatch[2], 10);
      p.era = parseFloat(eraMatch[3]);
      p.rawRecord = `${eraMatch[1]}-${eraMatch[2]}, ${eraMatch[3]} ERA`;

      if (currentTeamIndex === 0 && !team1.pitcher) {
        team1.pitcher = p;
      } else if (!team2.pitcher) {
        team2.pitcher = p;
      }
      activePitcher = null;
      continue;
    }

    // Check Batter Line
    const batterRegex = /^(?:\d+[\s.)]+)?(CF|SS|1B|2B|3B|LF|RF|C|DH|OF|IF)\s+(.+?)\s+([RLS])$/i;
    const batterMatch = line.match(batterRegex);

    if (batterMatch) {
      const position = batterMatch[1].toUpperCase();
      const name = batterMatch[2].trim();
      const hand = batterMatch[3].toUpperCase() as 'R' | 'L' | 'S';

      const targetTeam = (currentTeamIndex === 0) ? team1 : team2;
      const order = targetTeam.batters.length + 1;

      targetTeam.batters.push({
        order,
        name,
        position,
        hand
      });

      if (team1.batters.length >= 9 && currentTeamIndex === 0) {
        currentTeamIndex = 1;
      }
      continue;
    }

    // Check Pitcher Name Line
    const pitcherRegex = /^([A-Za-z.'\-\s]+?)\s+([RLS])$/i;
    const pitcherMatch = line.match(pitcherRegex);
    if (pitcherMatch) {
      const pName = pitcherMatch[1].trim();
      const pHand = pitcherMatch[2].toUpperCase() as 'R' | 'L' | 'S';

      const firstWord = pName.split(' ')[0].toUpperCase();
      if (!POSITIONS.includes(firstWord)) {
        const newPitcher: ParsedPitcher = {
          name: pName,
          hand: pHand,
          wins: 0,
          losses: 0,
          era: 4.10,
          rawRecord: ''
        };

        if (team1.batters.length >= 9 && currentTeamIndex === 0) {
          currentTeamIndex = 1;
        }

        if (i + 1 < lines.length) {
          const nextLine = lines[i + 1];
          const nextEraMatch = nextLine.match(/(\d+)-(\d+)\s+([\d.]+)\s*ERA/i);
          if (nextEraMatch) {
            newPitcher.wins = parseInt(nextEraMatch[1], 10);
            newPitcher.losses = parseInt(nextEraMatch[2], 10);
            newPitcher.era = parseFloat(nextEraMatch[3]);
            newPitcher.rawRecord = `${nextEraMatch[1]}-${nextEraMatch[2]}, ${nextEraMatch[3]} ERA`;
            i++;
          }
        }

        if (currentTeamIndex === 0 && !team1.pitcher) {
          team1.pitcher = newPitcher;
        } else if (!team2.pitcher) {
          team2.pitcher = newPitcher;
        }
        activePitcher = newPitcher;
        continue;
      }
    }
  }

  const formattedMarkdown = generateFormattedMarkdown(team1, team2);

  return {
    team1,
    team2,
    formattedMarkdown
  };
}

export function generateFormattedMarkdown(t1: ParsedTeamLineup, t2: ParsedTeamLineup): string {
  let md = `### ${t1.teamAbbr}\n\n`;

  if (t1.pitcher) {
    md += `**Pitcher:** ${t1.pitcher.name} (${t1.pitcher.hand}) — ${t1.pitcher.rawRecord || (t1.pitcher.era ? `${t1.pitcher.era} ERA` : 'Starter')}\n`;
  } else {
    md += `**Pitcher:** Starter (R)\n`;
  }

  md += `**Batter:**\n\n`;
  t1.batters.forEach(b => {
    md += `${b.order}. ${b.name} (${b.hand}) — ${b.position}\n`;
  });

  md += `\n### ${t2.teamAbbr}\n\n`;

  if (t2.pitcher) {
    md += `**Pitcher:** ${t2.pitcher.name} (${t2.pitcher.hand}) — ${t2.pitcher.rawRecord || (t2.pitcher.era ? `${t2.pitcher.era} ERA` : 'Starter')}\n`;
  } else {
    md += `**Pitcher:** Starter (R)\n`;
  }

  md += `**Batter:**\n\n`;
  t2.batters.forEach(b => {
    md += `${b.order}. ${b.name} (${b.hand}) — ${b.position}\n`;
  });

  return md;
}
