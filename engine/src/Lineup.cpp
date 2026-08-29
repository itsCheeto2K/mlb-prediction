#include "../include/Lineup.hpp"
#include <numeric>
#include <algorithm>

Lineup::Lineup() : currentBatterIndex(0) {}

void Lineup::addBatter(std::shared_ptr<Batter> batter) {
    if (batter) {
        batters.push_back(batter);
    }
}

std::shared_ptr<Batter> Lineup::getNextBatter() {
    if (batters.empty()) return nullptr;
    auto batter = batters[currentBatterIndex];
    currentBatterIndex = (currentBatterIndex + 1) % batters.size();
    return batter;
}

std::shared_ptr<Batter> Lineup::getBatterAt(size_t index) const {
    if (index < batters.size()) {
        return batters[index];
    }
    return nullptr;
}

double Lineup::getCompositeWoba() const {
    if (batters.empty()) return 0.315;
    double sum = 0;
    for (const auto& b : batters) sum += b->getWoba();
    return sum / batters.size();
}

double Lineup::getCompositeOps() const {
    if (batters.empty()) return 0.720;
    double sum = 0;
    for (const auto& b : batters) sum += b->getOps();
    return sum / batters.size();
}

double Lineup::getCompositeAvg() const {
    if (batters.empty()) return 0.248;
    double sum = 0;
    for (const auto& b : batters) sum += b->getAvg();
    return sum / batters.size();
}

// REQ-01: Aggregate BaseRuns (BSR) using raw counts from 9 batters
double Lineup::calculateTeamBaseRuns() const {
    if (batters.empty()) return 4.5;

    int totalHits = 0;
    int total2B = 0;
    int total3B = 0;
    int totalHR = 0;
    int totalBB = 0;
    int totalAB = 0;

    for (const auto& b : batters) {
        totalHits += b->getHits();
        total2B += b->getDoubles();
        total3B += b->getTriples();
        totalHR += b->getHomeRuns();
        totalBB += b->getWalks();
        totalAB += b->getAtBats();
    }

    if (totalAB <= 0) return 4.5;

    int total1B = std::max(0, totalHits - total2B - total3B - totalHR);
    double A = static_cast<double>(totalHits + totalBB - totalHR);
    double B = 0.8 * total1B + 2.1 * total2B + 3.4 * total3B + 1.8 * totalHR;
    double C = static_cast<double>(totalAB - totalHits);
    double D = static_cast<double>(totalHR);

    double totalBsr = (B + C > 0.0) ? (A * (B / (B + C)) + D) : D;

    // Scale to standard 9-inning game (approx 38 Plate Appearances per game)
    int totalPA = totalAB + totalBB;
    if (totalPA > 0) {
        return (totalBsr / totalPA) * 38.0;
    }
    return 4.5;
}
