#ifndef TEAM_HPP
#define TEAM_HPP

#include <string>
#include <memory>
#include "Lineup.hpp"
#include "Pitcher.hpp"

class Team {
private:
    std::string name;
    std::string abbreviation;
    bool isHomeTeam;
    double parkFactor;
    Lineup lineup;
    std::shared_ptr<Pitcher> startingPitcher;
    double bullpenEra;
    double bullpenWhip;

public:
    Team(const std::string& name, const std::string& abbr, bool isHome, double parkFactor = 1.0,
         double bullpenEra = 3.90, double bullpenWhip = 1.25);

    const std::string& getName() const { return name; }
    const std::string& getAbbr() const { return abbreviation; }
    bool getIsHomeTeam() const { return isHomeTeam; }
    double getParkFactor() const { return parkFactor; }
    double getBullpenEra() const { return bullpenEra; }
    double getBullpenWhip() const { return bullpenWhip; }

    void setStartingPitcher(std::shared_ptr<Pitcher> pitcher) { startingPitcher = pitcher; }
    std::shared_ptr<Pitcher> getStartingPitcher() const { return startingPitcher; }

    Lineup& getLineup() { return lineup; }
    const Lineup& getLineup() const { return lineup; }

    void addBatter(std::shared_ptr<Batter> batter) { lineup.addBatter(batter); }
};

#endif