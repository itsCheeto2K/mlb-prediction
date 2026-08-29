#ifndef PREDICTION_RESULT_HPP
#define PREDICTION_RESULT_HPP

#include <string>
#include <vector>
#include <map>

struct TotalRunLine {
    double line;
    double overProb;
    double underProb;
};

struct HandicapLine {
    double spread;
    double coverProb;
};

class PredictionResult {
public:
    std::string homeTeam;
    std::string awayTeam;
    double homeWinProb = 0.50;
    double awayWinProb = 0.50;
    double homeExpectedRuns = 4.5;
    double awayExpectedRuns = 4.2;
    double totalExpectedRuns = 8.7;
    int homeMoneyline = -110;
    int awayMoneyline = -110;
    std::vector<TotalRunLine> overUnderLines;
    std::vector<HandicapLine> homeHandicapLines;
    std::vector<HandicapLine> awayHandicapLines;
    std::vector<double> homeInningRuns;
    std::vector<double> awayInningRuns;
    std::map<std::string, int> commonScores;
    std::string recommendation;
    std::string keyInsight;

    std::string toJson() const;
};

#endif