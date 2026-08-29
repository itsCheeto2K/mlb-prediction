#include "../include/Team.hpp"

Team::Team(const std::string& name, const std::string& abbr, bool isHome, double parkFactor,
           double bullpenEra, double bullpenWhip)
    : name(name), abbreviation(abbr), isHomeTeam(isHome), parkFactor(parkFactor),
      bullpenEra(bullpenEra), bullpenWhip(bullpenWhip), startingPitcher(nullptr) {}
