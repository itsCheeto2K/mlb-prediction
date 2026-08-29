#include "../include/MatchSimulator.hpp"
#include "../include/SabermetricCalculator.hpp"
#include <cmath>
#include <algorithm>
#include <sstream>
#include <iomanip>

MatchSimulator::MatchSimulator(const Team& home, const Team& away, int simulations)
    : homeTeam(home), awayTeam(away), numSimulations(simulations) {
    std::random_device rd;
    rng.seed(rd());
}

Outcome MatchSimulator::simulatePlateAppearance(const Batter& batter, const Pitcher& pitcher, double parkFactor) {
    BatterProbabilities probs = batter.getPlatoonAdjustedProbs(pitcher.getThrowHand());
    const PitcherMultipliers& pm = pitcher.getMultipliers();

    double pWalk = probs.pWalk * pm.walkFactor;
    double pK = probs.pStrikeout * pm.strikeoutFactor;
    double pHR = probs.pHomeRun * pm.hrFactor * parkFactor;
    double p3B = probs.pTriple * pm.hitFactor * parkFactor;
    double p2B = probs.pDouble * pm.hitFactor * parkFactor;
    double p1B = probs.pSingle * pm.hitFactor;

    double sum = pWalk + pK + pHR + p3B + p2B + p1B;
    double pOut = std::max(0.10, 1.0 - sum);

    std::uniform_real_distribution<double> dist(0.0, sum + pOut);
    double roll = dist(rng);

    if (roll < pWalk) return Outcome::WALK;
    roll -= pWalk;
    if (roll < pK) return Outcome::STRIKEOUT;
    roll -= pK;
    if (roll < pHR) return Outcome::HOMERUN;
    roll -= pHR;
    if (roll < p3B) return Outcome::TRIPLE;
    roll -= p3B;
    if (roll < p2B) return Outcome::DOUBLE;
    roll -= p2B;
    if (roll < p1B) return Outcome::SINGLE;
    return Outcome::OUT;
}

int MatchSimulator::simulateHalfInning(Team& battingTeam, const Pitcher& pitcher, double parkFactor, int inningNumber, std::vector<double>& inningScoreTracker) {
    int outs = 0;
    int runs = 0;
    bool b1 = false, b2 = false, b3 = false;

    // Extra innings Ghost Runner on 2nd base rule
    if (inningNumber > 9) {
        b2 = true;
    }

    while (outs < 3) {
        auto batter = battingTeam.getLineup().getNextBatter();
        if (!batter) break;

        Outcome outcome = simulatePlateAppearance(*batter, pitcher, parkFactor);

        switch (outcome) {
            case Outcome::HOMERUN: {
                int r = 1 + (b1 ? 1 : 0) + (b2 ? 1 : 0) + (b3 ? 1 : 0);
                runs += r;
                b1 = b2 = b3 = false;
                break;
            }
            case Outcome::TRIPLE: {
                int r = (b1 ? 1 : 0) + (b2 ? 1 : 0) + (b3 ? 1 : 0);
                runs += r;
                b1 = false; b2 = false; b3 = true;
                break;
            }
            case Outcome::DOUBLE: {
                int r = (b2 ? 1 : 0) + (b3 ? 1 : 0);
                if (b1) {
                    std::uniform_real_distribution<double> d(0, 1);
                    if (d(rng) < 0.45) { r += 1; b3 = false; } else { b3 = true; }
                } else {
                    b3 = false;
                }
                runs += r;
                b1 = false;
                b2 = true;
                break;
            }
            case Outcome::SINGLE: {
                int r = (b3 ? 1 : 0);
                if (b2) {
                    std::uniform_real_distribution<double> d(0, 1);
                    if (d(rng) < 0.60) { r += 1; b3 = false; } else { b3 = true; }
                } else {
                    b3 = false;
                }
                if (b1) {
                    std::uniform_real_distribution<double> d(0, 1);
                    if (d(rng) < 0.30) { b3 = true; b2 = false; } else { b2 = true; }
                } else {
                    b2 = false;
                }
                runs += r;
                b1 = true;
                break;
            }
            case Outcome::WALK: {
                if (b1 && b2 && b3) {
                    runs += 1;
                } else if (b1 && b2) {
                    b3 = true;
                } else if (b1) {
                    b2 = true;
                }
                b1 = true;
                break;
            }
            case Outcome::STRIKEOUT:
            case Outcome::OUT:
            default: {
                outs++;
                break;
            }
        }
    }

    if (inningNumber <= 9 && inningNumber >= 1) {
        inningScoreTracker[inningNumber - 1] += runs;
    }

    return runs;
}

PredictionResult MatchSimulator::runSimulation() {
    PredictionResult result;
    result.homeTeam = homeTeam.getName();
    result.awayTeam = awayTeam.getName();

    int homeWins = 0;
    int awayWins = 0;
    double totalHomeRuns = 0;
    double totalAwayRuns = 0;

    std::vector<double> lines = {6.5, 7.5, 8.5, 9.5, 10.5, 11.5};
    std::map<double, int> overCounts;
    for (double l : lines) overCounts[l] = 0;

    int homeMinus15Covers = 0;
    int homePlus15Covers = 0;
    int awayMinus15Covers = 0;
    int awayPlus15Covers = 0;

    std::vector<double> homeInnings(9, 0.0);
    std::vector<double> awayInnings(9, 0.0);
    std::map<std::pair<int, int>, int> scoreCounts;

    Pitcher homeBullpen(9991, homeTeam.getName() + " Bullpen", Handedness::RIGHT, Handedness::RIGHT,
                        false, 50.0, homeTeam.getBullpenEra(), homeTeam.getBullpenWhip(), 8.8, 3.2, 1.1);
    Pitcher awayBullpen(9992, awayTeam.getName() + " Bullpen", Handedness::RIGHT, Handedness::RIGHT,
                        false, 50.0, awayTeam.getBullpenEra(), awayTeam.getBullpenWhip(), 8.8, 3.2, 1.1);

    auto homeStarter = homeTeam.getStartingPitcher();
    auto awayStarter = awayTeam.getStartingPitcher();

    if (!homeStarter) {
        homeStarter = std::make_shared<Pitcher>(9001, "Home Starter", Handedness::RIGHT, Handedness::RIGHT, true, 120.0, 4.00, 1.25, 8.5, 3.0, 1.15);
    }
    if (!awayStarter) {
        awayStarter = std::make_shared<Pitcher>(9002, "Away Starter", Handedness::RIGHT, Handedness::RIGHT, true, 120.0, 4.10, 1.28, 8.4, 3.1, 1.20);
    }

    for (int sim = 0; sim < numSimulations; ++sim) {
        homeTeam.getLineup().resetOrder();
        awayTeam.getLineup().resetOrder();

        int homeScore = 0;
        int awayScore = 0;

        for (int inn = 1; inn <= 9; ++inn) {
            const Pitcher& activeHomeP = (inn <= 6) ? *homeStarter : homeBullpen;
            awayScore += simulateHalfInning(awayTeam, activeHomeP, homeTeam.getParkFactor(), inn, awayInnings);

            if (inn == 9 && homeScore > awayScore) {
                // Walkoff/Lead in 9th
            } else {
                const Pitcher& activeAwayP = (inn <= 6) ? *awayStarter : awayBullpen;
                homeScore += simulateHalfInning(homeTeam, activeAwayP, homeTeam.getParkFactor(), inn, homeInnings);
            }
        }

        int extraInn = 10;
        while (homeScore == awayScore && extraInn <= 15) {
            awayScore += simulateHalfInning(awayTeam, homeBullpen, homeTeam.getParkFactor(), extraInn, awayInnings);
            homeScore += simulateHalfInning(homeTeam, awayBullpen, homeTeam.getParkFactor(), extraInn, homeInnings);
            extraInn++;
        }
        if (homeScore == awayScore) {
            if (sim % 2 == 0) homeScore++; else awayScore++;
        }

        if (homeScore > awayScore) homeWins++;
        else awayWins++;

        totalHomeRuns += homeScore;
        totalAwayRuns += awayScore;

        int matchTotal = homeScore + awayScore;
        for (double l : lines) {
            if (matchTotal > l) overCounts[l]++;
        }

        int diff = homeScore - awayScore;
        if (diff > 1.5) homeMinus15Covers++;
        if (diff > -1.5) homePlus15Covers++;
        if (diff < -1.5) awayMinus15Covers++;
        if (diff < 1.5) awayPlus15Covers++;

        scoreCounts[{homeScore, awayScore}]++;
    }

    result.homeWinProb = static_cast<double>(homeWins) / numSimulations;
    result.awayWinProb = static_cast<double>(awayWins) / numSimulations;
    result.homeExpectedRuns = totalHomeRuns / numSimulations;
    result.awayExpectedRuns = totalAwayRuns / numSimulations;
    result.totalExpectedRuns = result.homeExpectedRuns + result.awayExpectedRuns;

    auto probToMoneyline = [](double prob) -> int {
        prob = std::clamp(prob, 0.05, 0.95);
        if (prob >= 0.50) {
            return static_cast<int>(-100.0 * (prob / (1.0 - prob)));
        } else {
            return static_cast<int>(100.0 * ((1.0 - prob) / prob));
        }
    };

    result.homeMoneyline = probToMoneyline(result.homeWinProb);
    result.awayMoneyline = probToMoneyline(result.awayWinProb);

    for (double l : lines) {
        double oProb = static_cast<double>(overCounts[l]) / numSimulations;
        result.overUnderLines.push_back({l, oProb, 1.0 - oProb});
    }

    result.homeHandicapLines.push_back({-1.5, static_cast<double>(homeMinus15Covers) / numSimulations});
    result.homeHandicapLines.push_back({+1.5, static_cast<double>(homePlus15Covers) / numSimulations});
    result.awayHandicapLines.push_back({-1.5, static_cast<double>(awayMinus15Covers) / numSimulations});
    result.awayHandicapLines.push_back({+1.5, static_cast<double>(awayPlus15Covers) / numSimulations});

    for (int i = 0; i < 9; ++i) {
        result.homeInningRuns.push_back(homeInnings[i] / numSimulations);
        result.awayInningRuns.push_back(awayInnings[i] / numSimulations);
    }

    std::vector<std::pair<std::pair<int, int>, int>> sortedScores(scoreCounts.begin(), scoreCounts.end());
    std::sort(sortedScores.begin(), sortedScores.end(), [](auto& a, auto& b) { return a.second > b.second; });
    for (size_t i = 0; i < std::min<size_t>(5, sortedScores.size()); ++i) {
        std::string scoreStr = std::to_string(sortedScores[i].first.first) + "-" + std::to_string(sortedScores[i].first.second);
        result.commonScores[scoreStr] = sortedScores[i].second;
    }

    if (result.homeWinProb >= 0.58) {
        result.recommendation = "Best Value: " + homeTeam.getName() + " Moneyline (" + (result.homeMoneyline > 0 ? "+" : "") + std::to_string(result.homeMoneyline) + ") with " + std::to_string(static_cast<int>(result.homeWinProb * 100)) + "% simulated edge.";
    } else if (result.awayWinProb >= 0.58) {
        result.recommendation = "Best Value: " + awayTeam.getName() + " Moneyline (" + (result.awayMoneyline > 0 ? "+" : "") + std::to_string(result.awayMoneyline) + ") with " + std::to_string(static_cast<int>(result.awayWinProb * 100)) + "% simulated edge.";
    } else {
        result.recommendation = "Tight Game Alert: Consider " + (result.totalExpectedRuns > 8.5 ? std::string("Over 8.5 Runs") : std::string("Under 8.5 Runs")) + " or Runline +1.5.";
    }

    double homeWoba = homeTeam.getLineup().getCompositeWoba();
    double awayWoba = awayTeam.getLineup().getCompositeWoba();
    std::ostringstream ss;
    ss << homeTeam.getAbbr() << " lineup wOBA (" << std::fixed << std::setprecision(3) << homeWoba << ") vs "
       << awayTeam.getAbbr() << " lineup wOBA (" << awayWoba << "). "
       << "Projected Starter matchup: " << homeStarter->getName() << " (ERA " << std::setprecision(2) << homeStarter->getEra() << ") vs "
       << awayStarter->getName() << " (ERA " << awayStarter->getEra() << ").";
    result.keyInsight = ss.str();

    return result;
}
