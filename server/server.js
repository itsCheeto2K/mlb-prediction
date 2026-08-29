const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));

// Cross-platform engine binary path (Windows: mlb_engine.exe, Linux/Render: mlb_engine)
const ENGINE_FILENAME = process.platform === 'win32' ? 'mlb_engine.exe' : 'mlb_engine';
const ENGINE_PATH = path.join(__dirname, '..', ENGINE_FILENAME);

// Team dictionary for raw lineup parsing
const MLB_TEAM_DICTIONARY = {
  BAL: 'BAL', BOS: 'BOS', NYY: 'NYY', TB: 'TB', TBR: 'TB', TOR: 'TOR',
  CWS: 'CWS', CHW: 'CWS', CLE: 'CLE', DET: 'DET', KC: 'KC', KCR: 'KC', MIN: 'MIN',
  HOU: 'HOU', LAA: 'LAA', OAK: 'ATH', ATH: 'ATH', SEA: 'SEA', TEX: 'TEX',
  ATL: 'ATL', MIA: 'MIA', NYM: 'NYM', PHI: 'PHI', WSH: 'WSH', WAS: 'WSH',
  CHC: 'CHC', CIN: 'CIN', MIL: 'MIL', PIT: 'PIT', STL: 'STL',
  ARI: 'ARI', AZ: 'ARI', COL: 'COL', LAD: 'LAD', SD: 'SD', SDP: 'SD', SF: 'SF', SFG: 'SF',
  REDS: 'CIN', CUBS: 'CHC', DODGERS: 'LAD', YANKEES: 'NYY', REDSOX: 'BOS', BRAVES: 'ATL',
  PHILLIES: 'PHI', ASTROS: 'HOU', PADRES: 'SD', GIANTS: 'SF', METS: 'NYM', CARDINALS: 'STL'
};

const POSITIONS = ['1B', '2B', '3B', 'SS', 'C', 'LF', 'CF', 'RF', 'DH', 'OF', 'IF', 'P', 'SP', 'RP'];
const IGNORE_KEYWORDS = ['confirmed lineup', 'projected lineup', 'starting lineup', 'lineup', 'home run odds', 'starting pitcher intel', 'pitcher intel', 'odds', 'intel'];

function parseRawLineup(rawText) {
  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  const detectedTeams = [];
  for (const line of lines) {
    const cleanWord = line.replace(/[^a-zA-Z]/g, '').toUpperCase();
    if (cleanWord && MLB_TEAM_DICTIONARY[cleanWord]) {
      const abbr = MLB_TEAM_DICTIONARY[cleanWord];
      if (!detectedTeams.includes(abbr)) detectedTeams.push(abbr);
    }
  }

  const team1 = { teamAbbr: detectedTeams[0] || 'CIN', pitcher: null, batters: [] };
  const team2 = { teamAbbr: detectedTeams[1] || 'CHC', pitcher: null, batters: [] };

  let currentTeamIndex = 0;
  let currentPitcher = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lowerLine = line.toLowerCase();

    if (IGNORE_KEYWORDS.some(kw => lowerLine === kw)) continue;

    const cleanWord = line.replace(/[^a-zA-Z]/g, '').toUpperCase();
    if (MLB_TEAM_DICTIONARY[cleanWord] && cleanWord.length <= 5 && !cleanWord.startsWith('CF') && !cleanWord.startsWith('LF') && !cleanWord.startsWith('RF') && !cleanWord.startsWith('SS') && !cleanWord.startsWith('DH') && !cleanWord.startsWith('1B') && !cleanWord.startsWith('2B') && !cleanWord.startsWith('3B')) {
      continue;
    }
    if (line.match(/^[A-Za-z]+\s*\(\d+-\d+\)$/)) continue;

    const eraMatch = line.match(/(\d+)-(\d+)\s+([\d.]+)\s*ERA/i);
    if (eraMatch && currentPitcher) {
      currentPitcher.wins = parseInt(eraMatch[1], 10);
      currentPitcher.losses = parseInt(eraMatch[2], 10);
      currentPitcher.era = parseFloat(eraMatch[3]);
      currentPitcher.rawRecord = `${eraMatch[1]}-${eraMatch[2]}, ${eraMatch[3]} ERA`;

      if (currentTeamIndex === 0 && !team1.pitcher) {
        team1.pitcher = currentPitcher;
      } else if (!team2.pitcher) {
        team2.pitcher = currentPitcher;
      }
      currentPitcher = null;
      continue;
    }

    const batterMatch = line.match(/^(?:\d+[\s.)]+)?(CF|SS|1B|2B|3B|LF|RF|C|DH|OF|IF)\s+(.+?)\s+([RLS])$/i);
    if (batterMatch) {
      const position = batterMatch[1].toUpperCase();
      const name = batterMatch[2].trim();
      const hand = batterMatch[3].toUpperCase();

      const targetTeam = (currentTeamIndex === 0) ? team1 : team2;
      targetTeam.batters.push({
        order: targetTeam.batters.length + 1,
        name,
        position,
        hand
      });

      if (team1.batters.length >= 9 && currentTeamIndex === 0) {
        currentTeamIndex = 1;
      }
      continue;
    }

    const pitcherMatch = line.match(/^([A-Za-z.'\-\s]+?)\s+([RLS])$/i);
    if (pitcherMatch) {
      const pName = pitcherMatch[1].trim();
      const pHand = pitcherMatch[2].toUpperCase();
      const firstWord = pName.split(' ')[0].toUpperCase();

      if (!POSITIONS.includes(firstWord)) {
        currentPitcher = {
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
            currentPitcher.wins = parseInt(nextEraMatch[1], 10);
            currentPitcher.losses = parseInt(nextEraMatch[2], 10);
            currentPitcher.era = parseFloat(nextEraMatch[3]);
            currentPitcher.rawRecord = `${nextEraMatch[1]}-${nextEraMatch[2]}, ${nextEraMatch[3]} ERA`;
            i++;
          }
        }

        if (currentTeamIndex === 0 && !team1.pitcher) {
          team1.pitcher = currentPitcher;
        } else if (!team2.pitcher) {
          team2.pitcher = currentPitcher;
        }
        currentPitcher = null;
        continue;
      }
    }
  }

  let formattedMarkdown = `### ${team1.teamAbbr}\n\n`;
  if (team1.pitcher) {
    formattedMarkdown += `**Pitcher:** ${team1.pitcher.name} (${team1.pitcher.hand}) — ${team1.pitcher.rawRecord || (team1.pitcher.era + ' ERA')}\n`;
  }
  formattedMarkdown += `**Batter:**\n\n`;
  team1.batters.forEach(b => {
    formattedMarkdown += `${b.order}. ${b.name} (${b.hand}) — ${b.position}\n`;
  });

  formattedMarkdown += `\n### ${team2.teamAbbr}\n\n`;
  if (team2.pitcher) {
    formattedMarkdown += `**Pitcher:** ${team2.pitcher.name} (${team2.pitcher.hand}) — ${team2.pitcher.rawRecord || (team2.pitcher.era + ' ERA')}\n`;
  }
  formattedMarkdown += `**Batter:**\n\n`;
  team2.batters.forEach(b => {
    formattedMarkdown += `${b.order}. ${b.name} (${b.hand}) — ${b.position}\n`;
  });

  return { team1, team2, formattedMarkdown };
}

app.post('/api/parse-raw-lineup', (req, res) => {
  try {
    const { rawText } = req.body;
    if (!rawText) return res.status(400).json({ error: 'No raw text provided' });
    const parsed = parseRawLineup(rawText);
    res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/predict', (req, res) => {
    try {
        const payload = req.body;
        const inputJson = JSON.stringify(payload);

        if (!fs.existsSync(ENGINE_PATH)) {
            return res.status(500).json({
                error: `Prediction engine binary not found at ${ENGINE_PATH}. Please compile C++ engine before running.`
            });
        }

        const child = spawn(ENGINE_PATH, [], {
            windowsHide: true
        });

        let stdoutData = '';
        let stderrData = '';

        child.stdout.on('data', (data) => {
            stdoutData += data.toString();
        });

        child.stderr.on('data', (data) => {
            stderrData += data.toString();
        });

        child.on('close', (code) => {
            if (code !== 0) {
                console.error(`Prediction engine exited with code ${code}:`, stderrData);
                return res.status(500).json({
                    error: 'Simulation failed in C++ engine',
                    details: stderrData
                });
            }

            try {
                const parsedResult = JSON.parse(stdoutData.trim());
                return res.json(parsedResult);
            } catch (err) {
                console.error('Failed to parse C++ engine JSON response:', stdoutData);
                return res.status(500).json({
                    error: 'Invalid JSON response from C++ prediction engine',
                    raw: stdoutData
                });
            }
        });

        child.stdin.write(inputJson);
        child.stdin.end();

    } catch (error) {
        console.error('Server error during prediction:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        enginePath: ENGINE_PATH,
        engineExists: fs.existsSync(ENGINE_PATH),
        platform: process.platform,
        timestamp: new Date().toISOString()
    });
});

// Root check endpoint
app.get('/', (req, res) => {
    res.json({
        service: 'MLB Match Prediction API & C++ Engine Bridge',
        status: 'running',
        endpoints: ['/api/predict', '/api/parse-raw-lineup', '/api/health']
    });
});

app.listen(PORT, () => {
    console.log(`MLB Prediction Bridge Server running on port ${PORT}`);
});
