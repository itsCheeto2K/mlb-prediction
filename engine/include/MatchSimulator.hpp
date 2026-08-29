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

class MatchSimulator {
private:
    Team homeTeam;
    Team awayTeam;
    int numSimulations;
    std::mt19937 rng;

    Outcome simulatePlateAppearance(const Batter& batter, const Pitcher& pitcher, double parkFactor);
    int simulateHalfInning(Team& battingTeam, const Pitcher& pitcher, double parkFactor, int inningNumber, std::vector<double>& inningScoreTracker);

public:
    MatchSimulator(const Team& home, const Team& away, int simulations = 10000);
    PredictionResult runSimulation();
};

#endif