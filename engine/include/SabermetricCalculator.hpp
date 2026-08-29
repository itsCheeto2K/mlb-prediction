#ifndef SABERMETRIC_CALCULATOR_HPP
#define SABERMETRIC_CALCULATOR_HPP

#include "Team.hpp"

class SabermetricCalculator {
public:
    // REQ-01: BaseRuns (David Smyth) model using raw counts
    static double calculateBaseRunsRaw(int ab, int hits, int doubles, int triples, int hr, int bb);

    // Pythagenpat expected win percentage
    static double calculatePythagoreanWinPct(double runsScored, double runsAllowed);

    // Log5 head-to-head matchup probability
    static double calculateLog5(double probA, double probB);

    // Estimate expected game runs for a team based on Lineup BaseRuns / wOBA vs Opposing Pitcher FIP
    static double estimateTeamExpectedRuns(const Team& battingTeam, const Pitcher& opposingPitcher, double opposingBullpenEra, double parkFactor);
};

#endif