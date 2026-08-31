#include "../include/Pitcher.hpp"
#include <cmath>
#include <algorithm>
#include <iomanip>

Pitcher::Pitcher(int id, const std::string& name, Handedness batH, Handedness throwH,
                 bool starter, double ip, double era, double whip, double k9, double bb9, double hr9,
                 int w, int l, int so, int hbp, double fipConst,
                 int rest, int lastPitches)
    : Player(id, name, PositionType::PITCHER, batH, throwH),
      isStarter(starter), inningsPitched(ip), era(era), whip(whip),
      k9(k9), bb9(bb9), hr9(hr9), wins(w), losses(l), strikeouts(so),
      hitBatsmen(hbp), fipConstant(fipConst),
      restDays(rest), lastStartPitches(lastPitches) {
    
    if (this->era <= 0.5) this->era = 4.10;
    if (this->whip <= 0.5) this->whip = 1.28;
    if (this->k9 <= 1.0) this->k9 = 8.5;
    if (this->bb9 <= 0.5) this->bb9 = 3.1;
    if (this->hr9 <= 0.1) this->hr9 = 1.15;
    if (this->fipConstant <= 1.0 || this->fipConstant >= 5.0) this->fipConstant = 3.15;
    if (this->restDays <= 0) this->restDays = 5;
    if (this->lastStartPitches <= 0) this->lastStartPitches = 90;

    // REQ-03 & REQ-04: FIP with hitBatsmen (HBP) and dynamic FIP constant
    // FIP = ((13*HR + 3*(BB + HBP) - 2*K) / IP) + FIP_constant
    if (this->inningsPitched > 10.0) {
        double hrCount = this->hr9 * this->inningsPitched / 9.0;
        double bbCount = this->bb9 * this->inningsPitched / 9.0;
        double kCount = this->k9 * this->inningsPitched / 9.0;
        double hbpCount = static_cast<double>(this->hitBatsmen);
        if (hbpCount <= 0) {
            hbpCount = bbCount * 0.12; // Realistic estimate if missing
        }

        fip = ((13.0 * hrCount + 3.0 * (bbCount + hbpCount) - 2.0 * kCount) / this->inningsPitched) + this->fipConstant;
    } else {
        fip = this->era;
    }

    calculateMultipliers();
}

void Pitcher::calculateMultipliers() {
    const double leagueK9 = 8.6;
    const double leagueBB9 = 3.1;
    const double leagueWhip = 1.28;
    const double leagueHr9 = 1.15;

    double baseK = std::clamp(k9 / leagueK9, 0.65, 1.60);
    double baseBB = std::clamp(bb9 / leagueBB9, 0.55, 1.70);
    double baseHit = std::clamp((whip - (bb9 / 9.0)) / (leagueWhip - (leagueBB9 / 9.0)), 0.65, 1.55);
    double baseHR = std::clamp(hr9 / leagueHr9, 0.50, 1.80);

    // FEAT-1: Pitcher Rest Days & Fatigue Adjustment
    double fatigueModifier = 1.0;
    if (isStarter) {
        if (restDays <= 3) {
            fatigueModifier = (lastStartPitches >= 100) ? 1.08 : 1.05;
        } else if (restDays == 4) {
            fatigueModifier = (lastStartPitches >= 105) ? 1.04 : 1.02;
        } else if (restDays >= 6 && restDays <= 8) {
            fatigueModifier = 0.98; // Well-rested starter
        }
    }

    multipliers.strikeoutFactor = std::clamp(baseK / fatigueModifier, 0.60, 1.65);
    multipliers.walkFactor = std::clamp(baseBB * fatigueModifier, 0.50, 1.75);
    multipliers.hitFactor = std::clamp(baseHit * fatigueModifier, 0.60, 1.60);
    multipliers.hrFactor = std::clamp(baseHR * fatigueModifier, 0.50, 1.85);
}

void Pitcher::displayInfo() const {
    std::cout << (isStarter ? "[Starter] " : "[Reliever] ") << name << " (" << handednessToString(throwHand) << "HP) "
              << "ERA: " << std::fixed << std::setprecision(2) << era
              << " | FIP: " << fip << " | WHIP: " << whip << " | K/9: " << k9
              << " | W-L: " << wins << "-" << losses << std::endl;
}
