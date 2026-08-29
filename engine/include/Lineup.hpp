#ifndef LINEUP_HPP
#define LINEUP_HPP

#include <vector>
#include <memory>
#include "Batter.hpp"

class Lineup {
private:
    std::vector<std::shared_ptr<Batter>> batters;
    size_t currentBatterIndex;

public:
    Lineup();
    void addBatter(std::shared_ptr<Batter> batter);
    std::shared_ptr<Batter> getNextBatter();
    std::shared_ptr<Batter> getBatterAt(size_t index) const;
    const std::vector<std::shared_ptr<Batter>>& getAllBatters() const { return batters; }
    size_t size() const { return batters.size(); }
    void resetOrder() { currentBatterIndex = 0; }

    double getCompositeWoba() const;
    double getCompositeOps() const;
    double getCompositeAvg() const;

    // REQ-01: Aggregate BaseRuns calculated across the 9 batters
    double calculateTeamBaseRuns() const;
};

#endif