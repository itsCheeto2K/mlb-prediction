# MLB Match Prediction & Analytics Web Platform

A full-stack MLB match prediction web platform using real-time stats from the MLB Data API and an advanced **C++20 Object-Oriented Sabermetric & Monte Carlo Simulation Engine**.

## 🚀 Key Features

### 1. 🎯 Match Prediction Tab (20 Player Selectors)
- **Home & Away Team Dropdowns** (with MLB team branding and stadium park factors).
- **20 Player Dropdowns**:
  - **Away Team**: 1 Starting Pitcher + 9 Batters in batting order (1 - 9).
  - **Home Team**: 1 Starting Pitcher + 9 Batters in batting order (1 - 9).
- **⚡ 1-Click Auto-Fill**: Instantly loads active starting pitchers and default starting lineups from live MLB rosters.
- **C++ Prediction Engine Results**:
  - **Moneyline (Winner)**: Win probability %, fair American & Decimal betting odds, recommended winner pick.
  - **Total Runs (Over/Under)**: Expected combined runs and probability breakdown across lines (6.5 to 11.5).
  - **Handicap (Runline Spread)**: -1.5 / +1.5 spread cover probabilities.
  - **Inning-by-Inning Projection**: Projected runs scored for innings 1 through 9.
  - **Top Simulated Scorelines & Tactical Matchup Insights**.

### 2. 📊 Team Stats Tab
- Full MLB Standings (AL & NL, Division races).
- Win-Loss Records, PCT, Games Back (GB), Runs Scored (RS), Runs Allowed (RA), Run Differential (DIFF), Home/Away splits, Streak, and Last 10 games.

### 3. ⚾ Player Stats Tab
- Searchable player database across all 30 MLB active rosters.
- Toggle between **Hitting Stats** (AVG, OBP, SLG, OPS, HR, RBI, H, 2B, BB, SO, SB) and **Pitching Stats** (ERA, WHIP, W-L, K/9, BB/9, HR/9, IP, SO, SV).

### 4. 🏆 League Leaders Tab
- Top 10 MLB League Leaders across major categories (Home Runs, Batting Average, RBI, OPS, ERA, Strikeouts, Wins, WHIP).

---

## 🛠️ Tech Stack & Architecture

- **Frontend**: Vite + React 18 + TypeScript + Tailwind CSS + Lucide Icons
- **Backend Bridge**: Node.js + Express API Gateway
- **Prediction Core**: C++20 Object-Oriented Simulation Engine (`mlb_engine.exe`)
  - OOP Hierarchy: `Player` -> `Batter` / `Pitcher` -> `Lineup` -> `Team` -> `SabermetricCalculator` -> `MatchSimulator`
  - Sabermetric Models: BaseRuns, Pythagenpat, Log5, Platoon Splits, Park Factors
  - Simulation: 10,000 Monte Carlo Markov Chain inning transitions per match

---

## ⚡ Quick Start

### 1. Compile C++ Engine (already compiled to `mlb_engine.exe`)
```bash
g++ -std=c++20 -O3 -Iengine/include engine/src/*.cpp -o mlb_engine.exe
```

### 2. Start the Backend Bridge Server
```bash
node server/server.js
```
The server runs on `http://localhost:3001`.

### 3. Start the Frontend Development Server
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.
