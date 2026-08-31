#include "../include/Batter.hpp"
#include <cmath>
#include <algorithm>
#include <iomanip>

Batter::Batter(int id, const std::string& name, Handedness batH, Handedness throwH,
               int order, int ab, int h, int d, int t, int hr, int bb, int so,
               int hbp, int sf, int ibb,
               double avg, double obp, double slg, double ops,
               double vsRhpOps, double vsLhpOps,
               double vsRhpAvg, double vsLhpAvg,
               int vsRhpAb, int vsLhpAb,
               double l10Ops, double l10Avg, int l10Ab)
    : Player(id, name, PositionType::BATTER, batH, throwH),
      battingOrder(order), atBats(ab), hits(h), doubles(d), triples(t), homeRuns(hr),
      walks(bb), strikeouts(so), hitByPitch(hbp), sacFlies(sf), intentionalWalks(ibb),
      avg(avg), obp(obp), slg(slg), ops(ops),
      vsRhpOps(vsRhpOps), vsLhpOps(vsLhpOps),
      vsRhpAvg(vsRhpAvg), vsLhpAvg(vsLhpAvg),
      vsRhpAb(vsRhpAb), vsLhpAb(vsLhpAb),
      l10Ops(l10Ops), l10Avg(l10Avg), l10Ab(l10Ab) {
    
    if (atBats <= 0) {
        atBats = 400;
        this->avg = (avg > 0) ? avg : 0.250;
        this->obp = (obp > 0) ? obp : 0.320;
        this->slg = (slg > 0) ? slg : 0.410;
        this->ops = (ops > 0) ? ops : (this->obp + this->slg);
        this->hits = static_cast<int>(this->avg * atBats);
        this->doubles = static_cast<int>(hits * 0.20);
        this->triples = static_cast<int>(hits * 0.02);
        this->homeRuns = static_cast<int>(hits * 0.12);
        this->walks = static_cast<int>(atBats * 0.08);
        this->strikeouts = static_cast<int>(atBats * 0.22);
        this->hitByPitch = 3;
        this->sacFlies = 3;
        this->intentionalWalks = 1;
    }
    
    iso = std::max(0.0, this->slg - this->avg);
    
    // REQ-02: Accurate wOBA using HBP, SF, IBB
    // PA = AB + BB + HBP + SF
    // wOBA = (0.69*(BB - IBB) + 0.72*HBP + 0.89*1B + 1.27*2B + 1.62*3B + 2.10*HR) / PA
    int singles = std::max(0, hits - doubles - triples - homeRuns);
    int pa = atBats + walks + hitByPitch + sacFlies;
    if (pa > 0) {
        int ubb = std::max(0, walks - intentionalWalks);
        woba = (0.69 * ubb + 0.72 * hitByPitch + 0.89 * singles + 1.27 * doubles + 1.62 * triples + 2.10 * homeRuns) / pa;
        int bip = atBats - strikeouts - homeRuns + sacFlies;
        babip = (bip > 0) ? static_cast<double>(hits - homeRuns) / bip : 0.295;
    } else {
        woba = 0.315;
        babip = 0.295;
    }

    calculateProbabilities();
}

// REQ-01: BaseRuns (David Smyth) calculation using raw components
double Batter::calculateBaseRuns() const {
    int singles = std::max(0, hits - doubles - triples - homeRuns);
    double A = static_cast<double>(hits + walks - homeRuns);
    double B = 0.8 * singles + 2.1 * doubles + 3.4 * triples + 1.8 * homeRuns;
    double C = static_cast<double>(atBats - hits);
    double D = static_cast<double>(homeRuns);

    if (B + C <= 0.0) return D;
    return A * (B / (B + C)) + D;
}

void Batter::calculateProbabilities() {
    int pa = atBats + walks + hitByPitch + sacFlies;
    if (pa <= 0) pa = 450;

    int singles = std::max(0, hits - doubles - triples - homeRuns);

    baseProbs.pWalk = std::clamp(static_cast<double>(walks + hitByPitch) / pa, 0.04, 0.22);
    baseProbs.pStrikeout = std::clamp(static_cast<double>(strikeouts) / pa, 0.08, 0.40);
    baseProbs.pHomeRun = std::clamp(static_cast<double>(homeRuns) / pa, 0.005, 0.12);
    baseProbs.pTriple = std::clamp(static_cast<double>(triples) / pa, 0.001, 0.02);
    baseProbs.pDouble = std::clamp(static_cast<double>(doubles) / pa, 0.015, 0.09);
    baseProbs.pSingle = std::clamp(static_cast<double>(singles) / pa, 0.08, 0.25);

    // FEAT-2: Incorporate L10 Recent Form modifier
    if (l10Ab >= 15 && l10Ops > 0.250 && ops > 0.250) {
        double formRatio = std::clamp(l10Ops / ops, 0.80, 1.25);
        baseProbs.pSingle *= std::pow(formRatio, 0.4);
        baseProbs.pDouble *= std::pow(formRatio, 0.6);
        baseProbs.pHomeRun *= std::pow(formRatio, 0.8);
        baseProbs.pWalk *= std::pow(formRatio, 0.3);
        baseProbs.pStrikeout *= std::pow(1.0 / formRatio, 0.4);
    }

    double sumNonOut = baseProbs.pWalk + baseProbs.pStrikeout + baseProbs.pHomeRun +
                       baseProbs.pTriple + baseProbs.pDouble + baseProbs.pSingle;
    baseProbs.pFieldOut = std::max(0.20, 1.0 - sumNonOut);
}

// REQ-05: Platoon adjustments using actual vs RHP / vs LHP splits when AB >= 30, with robust fallback
BatterProbabilities Batter::getPlatoonAdjustedProbs(Handedness pitcherThrowHand) const {
    BatterProbabilities adj = baseProbs;
    bool isPitcherRhp = (pitcherThrowHand == Handedness::RIGHT);

    // Check if we have actual splits data with sufficient sample size (AB >= 30)
    double splitOps = isPitcherRhp ? vsRhpOps : vsLhpOps;
    int splitAb = isPitcherRhp ? vsRhpAb : vsLhpAb;

    if (splitAb >= 30 && splitOps > 0.300 && ops > 0.300) {
        // Individualized performance ratio: splitOps / baseline ops
        double ratio = std::clamp(splitOps / ops, 0.75, 1.35);
        adj.pSingle *= std::pow(ratio, 0.8);
        adj.pDouble *= std::pow(ratio, 1.1);
        adj.pHomeRun *= std::pow(ratio, 1.3);
        adj.pWalk *= std::pow(ratio, 0.9);
        adj.pStrikeout *= std::pow(1.0 / ratio, 0.7);
    } else {
        // Fallback to standard handedness advantage
        bool hasPlatoonAdvantage = false;
        if (batHand == Handedness::SWITCH) {
            hasPlatoonAdvantage = true;
        } else if (batHand == Handedness::LEFT && pitcherThrowHand == Handedness::RIGHT) {
            hasPlatoonAdvantage = true;
        } else if (batHand == Handedness::RIGHT && pitcherThrowHand == Handedness::LEFT) {
            hasPlatoonAdvantage = true;
        }

        if (hasPlatoonAdvantage) {
            adj.pSingle *= 1.06;
            adj.pDouble *= 1.08;
            adj.pHomeRun *= 1.12;
            adj.pWalk *= 1.05;
            adj.pStrikeout *= 0.94;
        } else {
            adj.pSingle *= 0.95;
            adj.pDouble *= 0.93;
            adj.pHomeRun *= 0.89;
            adj.pWalk *= 0.95;
            adj.pStrikeout *= 1.06;
        }
    }

    double total = adj.pWalk + adj.pSingle + adj.pDouble + adj.pTriple + adj.pHomeRun + adj.pStrikeout + adj.pFieldOut;
    adj.pWalk /= total;
    adj.pSingle /= total;
    adj.pDouble /= total;
    adj.pTriple /= total;
    adj.pHomeRun /= total;
    adj.pStrikeout /= total;
    adj.pFieldOut /= total;

    return adj;
}

void Batter::displayInfo() const {
    std::cout << "[#" << battingOrder << "] " << name << " (" << handednessToString(batHand) << ") "
              << "AVG: " << std::fixed << std::setprecision(3) << avg
              << " | OBP: " << obp << " | SLG: " << slg << " | wOBA: " << woba
              << " | HR: " << homeRuns << std::endl;
}
