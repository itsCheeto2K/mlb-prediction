#ifndef BATTER_HPP
#define BATTER_HPP

#include "Player.hpp"

struct BatterProbabilities {
    double pWalk = 0.085;
    double pSingle = 0.150;
    double pDouble = 0.045;
    double pTriple = 0.005;
    double pHomeRun = 0.030;
    double pStrikeout = 0.220;
    double pFieldOut = 0.465;
};

class Batter : public Player {
private:
    int battingOrder;
    int atBats;
    int hits;
    int doubles;
    int triples;
    int homeRuns;
    int walks;
    int strikeouts;
    int hitByPitch;
    int sacFlies;
    int intentionalWalks;
    double avg;
    double obp;
    double slg;
    double ops;
    double woba;
    double iso;
    double babip;

    // Splits vs RHP / LHP
    double vsRhpOps;
    double vsLhpOps;
    double vsRhpAvg;
    double vsLhpAvg;
    int vsRhpAb;
    int vsLhpAb;

    // FEAT-2: Recent Form L10 Rolling Stats
    double l10Ops;
    double l10Avg;
    int l10Ab;

    BatterProbabilities baseProbs;
    void calculateProbabilities();

public:
    Batter(int id, const std::string& name, Handedness batH, Handedness throwH,
           int order, int ab, int h, int d, int t, int hr, int bb, int so,
           int hbp, int sf, int ibb,
           double avg, double obp, double slg, double ops,
           double vsRhpOps = 0.0, double vsLhpOps = 0.0,
           double vsRhpAvg = 0.0, double vsLhpAvg = 0.0,
           int vsRhpAb = 0, int vsLhpAb = 0,
           double l10Ops = 0.0, double l10Avg = 0.0, int l10Ab = 0);

    int getBattingOrder() const { return battingOrder; }
    void setBattingOrder(int order) { battingOrder = order; }
    int getAtBats() const { return atBats; }
    int getHits() const { return hits; }
    int getDoubles() const { return doubles; }
    int getTriples() const { return triples; }
    int getHomeRuns() const { return homeRuns; }
    int getWalks() const { return walks; }
    int getStrikeouts() const { return strikeouts; }
    int getHitByPitch() const { return hitByPitch; }
    int getSacFlies() const { return sacFlies; }
    int getIntentionalWalks() const { return intentionalWalks; }
    double getAvg() const { return avg; }
    double getObp() const { return obp; }
    double getSlg() const { return slg; }
    double getOps() const { return ops; }
    double getWoba() const { return woba; }
    double getIso() const { return iso; }

    double getVsRhpOps() const { return vsRhpOps; }
    double getVsLhpOps() const { return vsLhpOps; }
    int getVsRhpAb() const { return vsRhpAb; }
    int getVsLhpAb() const { return vsLhpAb; }

    double getL10Ops() const { return l10Ops; }
    double getL10Avg() const { return l10Avg; }
    int getL10Ab() const { return l10Ab; }

    // Raw BaseRuns calculation for this batter
    double calculateBaseRuns() const;

    const BatterProbabilities& getProbabilities() const { return baseProbs; }
    BatterProbabilities getPlatoonAdjustedProbs(Handedness pitcherThrowHand) const;

    void displayInfo() const override;
};

#endif