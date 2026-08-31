#ifndef MATCH_SIMULATOR_HPP
#define MATCH_SIMULATOR_HPP

#include "Team.hpp"
#include "PredictionResult.hpp"
#include <random>

enum class Outcome {
    WALK,
    SINGLE,
    DOUBLE,
    TRIPLE,
    HOMERUN,
    STRIKEOUT,
    OUT
};

struct LiveMatchState {
    bool isLive = false;
    int currentInning = 1;
    std::string inningHalf = "top"; // "top" | "bottom"
    int currentOuts = 0;
    bool runner1st = false;
    bool runner2nd = false;
    bool runner3rd = false;
    int currentHomeRuns = 0;
    int currentAwayRuns = 0;
    size_t nextBatterIndexHome = 0;
    size_t nextBatterIndexAway = 0;
    double marketTotalLine = 0.0;
    int marketHomeOdds = 0;
    int marketAwayOdds = 0;
};

class MatchSimulator {
private:
    Team homeTeam;
    Team awayTeam;
    int numSimulations;
    LiveMatchState liveState;
    std::mt19937 rng;

    Outcome simulatePlateAppearance(const Batter& batter, const Pitcher& pitcher, double parkFactor);
    int simulateHalfInning(Team& battingTeam, const Pitcher& pitcher, double parkFactor, int inningNumber,
                           std::vector<double>& inningScoreTracker, int startingOuts = 0,
                           bool initB1 = false, bool initB2 = false, bool initB3 = false);

public:
    MatchSimulator(const Team& home, const Team& away, int simulations = 10000);
    void setLiveState(const LiveMatchState& state) { liveState = state; }
    PredictionResult runSimulation();
};

#endif