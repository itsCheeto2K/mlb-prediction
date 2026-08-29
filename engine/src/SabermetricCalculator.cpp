#include "../include/SabermetricCalculator.hpp"
#include <cmath>
#include <algorithm>

// REQ-01: BaseRuns model using raw count metrics
double SabermetricCalculator::calculateBaseRunsRaw(int ab, int hits, int doubles, int triples, int hr, int bb) {
    int singles = std::max(0, hits - doubles - triples - hr);
    double A = static_cast<double>(hits + bb - hr);
    double B = 0.8 * singles + 2.1 * doubles + 3.4 * triples + 1.8 * hr;
    double C = static_cast<double>(ab - hits);
    double D = static_cast<double>(hr);

    if (B + C <= 0.0) return D;
    return A * (B / (B + C)) + D;
}

double SabermetricCalculator::calculatePythagoreanWinPct(double runsScored, double runsAllowed) {
    if (runsScored <= 0.0 && runsAllowed <= 0.0) return 0.50;
    if (runsScored <= 0.0) return 0.01;
    if (runsAllowed <= 0.0) return 0.99;

    // Pythagenpat exponent: gamma = (RS + RA)^0.287
    double totalRuns = runsScored + runsAllowed;
    double gamma = std::pow(totalRuns / 9.0, 0.287);
    if (gamma < 1.5) gamma = 1.5;
    if (gamma > 2.2) gamma = 2.2;

    double rsExp = std::pow(runsScored, gamma);
    double raExp = std::pow(runsAllowed, gamma);
    return rsExp / (rsExp + raExp);
}

double SabermetricCalculator::calculateLog5(double probA, double probB) {
    double numerator = probA - (probA * probB);
    double denominator = probA + probB - (2.0 * probA * probB);
    if (denominator <= 0.0) return 0.50;
    return numerator / denominator;
}

double SabermetricCalculator::estimateTeamExpectedRuns(const Team& battingTeam, const Pitcher& opposingPitcher, double opposingBullpenEra, double parkFactor) {
    double lineupBsr = battingTeam.getLineup().calculateTeamBaseRuns();
    double lineupWoba = battingTeam.getLineup().getCompositeWoba();
    double pitcherFip = opposingPitcher.getFip();

    // Baseline league offense is ~4.40 runs/game (wOBA ~0.315, BSR ~4.40)
    double offensiveFactor = (lineupBsr / 4.40) * 0.60 + (lineupWoba / 0.315) * 0.40;
    
    // Pitcher weighting: Starter ~5.5 IP (61%), Bullpen ~3.5 IP (39%)
    double effectivePitchingEra = (pitcherFip * 0.61) + (opposingBullpenEra * 0.39);
    double pitchingFactor = effectivePitchingEra / 4.20;

    double expectedRuns = 4.40 * offensiveFactor * pitchingFactor * parkFactor;

    if (battingTeam.getIsHomeTeam()) {
        expectedRuns *= 1.04;
    } else {
        expectedRuns *= 0.96;
    }

    return std::max(1.5, expectedRuns);
}
