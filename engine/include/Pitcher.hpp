#ifndef PITCHER_HPP
#define PITCHER_HPP

#include "Player.hpp"

struct PitcherMultipliers {
    double strikeoutFactor = 1.0;
    double walkFactor = 1.0;
    double hitFactor = 1.0;
    double hrFactor = 1.0;
};

class Pitcher : public Player {
private:
    bool isStarter;
    double inningsPitched;
    double era;
    double whip;
    double k9;
    double bb9;
    double hr9;
    double fip;
    int wins;
    int losses;
    int strikeouts;
    int hitBatsmen; // REQ-03: HBP caused by pitcher
    double fipConstant; // REQ-04: Dynamic FIP constant

    PitcherMultipliers multipliers;
    void calculateMultipliers();

public:
    Pitcher(int id, const std::string& name, Handedness batH, Handedness throwH,
            bool starter, double ip, double era, double whip, double k9, double bb9, double hr9,
            int w = 0, int l = 0, int so = 0, int hbp = 0, double fipConst = 3.15);

    bool getIsStarter() const { return isStarter; }
    double getInningsPitched() const { return inningsPitched; }
    double getEra() const { return era; }
    double getWhip() const { return whip; }
    double getK9() const { return k9; }
    double getBb9() const { return bb9; }
    double getHr9() const { return hr9; }
    double getFip() const { return fip; }
    int getWins() const { return wins; }
    int getLosses() const { return losses; }
    int getStrikeouts() const { return strikeouts; }
    int getHitBatsmen() const { return hitBatsmen; }
    double getFipConstant() const { return fipConstant; }

    const PitcherMultipliers& getMultipliers() const { return multipliers; }
    void displayInfo() const override;
};

#endif