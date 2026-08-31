#include "../include/PredictionResult.hpp"
#include <sstream>
#include <iomanip>

std::string PredictionResult::toJson() const {
    std::ostringstream ss;
    ss << "{\n";
    ss << "  \"homeTeam\": \"" << homeTeam << "\",\n";
    ss << "  \"awayTeam\": \"" << awayTeam << "\",\n";
    ss << "  \"isLiveSimulation\": " << (isLiveSimulation ? "true" : "false") << ",\n";
    ss << "  \"homeWinProb\": " << std::fixed << std::setprecision(4) << homeWinProb << ",\n";
    ss << "  \"awayWinProb\": " << awayWinProb << ",\n";
    ss << "  \"homeExpectedRuns\": " << std::setprecision(2) << homeExpectedRuns << ",\n";
    ss << "  \"awayExpectedRuns\": " << awayExpectedRuns << ",\n";
    ss << "  \"liveRemainingExpectedRunsHome\": " << std::setprecision(2) << liveRemainingExpectedRunsHome << ",\n";
    ss << "  \"liveRemainingExpectedRunsAway\": " << std::setprecision(2) << liveRemainingExpectedRunsAway << ",\n";
    ss << "  \"totalExpectedRuns\": " << totalExpectedRuns << ",\n";
    ss << "  \"homeMoneyline\": " << homeMoneyline << ",\n";
    ss << "  \"awayMoneyline\": " << awayMoneyline << ",\n";
    
    ss << "  \"overUnderLines\": [\n";
    for (size_t i = 0; i < overUnderLines.size(); ++i) {
        ss << "    {\"line\": " << std::setprecision(1) << overUnderLines[i].line
           << ", \"overProb\": " << std::setprecision(4) << overUnderLines[i].overProb
           << ", \"underProb\": " << overUnderLines[i].underProb << "}"
           << (i + 1 < overUnderLines.size() ? "," : "") << "\n";
    }
    ss << "  ],\n";

    ss << "  \"homeHandicapLines\": [\n";
    for (size_t i = 0; i < homeHandicapLines.size(); ++i) {
        ss << "    {\"spread\": " << std::setprecision(1) << homeHandicapLines[i].spread
           << ", \"coverProb\": " << std::setprecision(4) << homeHandicapLines[i].coverProb << "}"
           << (i + 1 < homeHandicapLines.size() ? "," : "") << "\n";
    }
    ss << "  ],\n";

    ss << "  \"awayHandicapLines\": [\n";
    for (size_t i = 0; i < awayHandicapLines.size(); ++i) {
        ss << "    {\"spread\": " << std::setprecision(1) << awayHandicapLines[i].spread
           << ", \"coverProb\": " << std::setprecision(4) << awayHandicapLines[i].coverProb << "}"
           << (i + 1 < awayHandicapLines.size() ? "," : "") << "\n";
    }
    ss << "  ],\n";

    ss << "  \"homeInningRuns\": [";
    for (size_t i = 0; i < homeInningRuns.size(); ++i) {
        ss << std::setprecision(2) << homeInningRuns[i] << (i + 1 < homeInningRuns.size() ? ", " : "");
    }
    ss << "],\n";

    ss << "  \"awayInningRuns\": [";
    for (size_t i = 0; i < awayInningRuns.size(); ++i) {
        ss << std::setprecision(2) << awayInningRuns[i] << (i + 1 < awayInningRuns.size() ? ", " : "");
    }
    ss << "],\n";

    ss << "  \"commonScores\": {\n";
    size_t scoreIdx = 0;
    for (const auto& kv : commonScores) {
        ss << "    \"" << kv.first << "\": " << kv.second << (++scoreIdx < commonScores.size() ? ",\n" : "\n");
    }
    ss << "  },\n";
    ss << "  \"edgeVsMarket\": {\n";
    ss << "    \"hasMarketData\": " << (edgeVsMarket.hasMarketData ? "true" : "false") << ",\n";
    ss << "    \"marketTotalLine\": " << std::setprecision(1) << edgeVsMarket.marketTotalLine << ",\n";
    ss << "    \"modelTotal\": " << std::setprecision(2) << edgeVsMarket.modelTotal << ",\n";
    ss << "    \"totalEdgeRuns\": " << edgeVsMarket.totalEdgeRuns << ",\n";
    ss << "    \"totalSignal\": \"" << edgeVsMarket.totalSignal << "\",\n";
    ss << "    \"marketHomeOdds\": " << edgeVsMarket.marketHomeOdds << ",\n";
    ss << "    \"marketAwayOdds\": " << edgeVsMarket.marketAwayOdds << ",\n";
    ss << "    \"evHome\": " << std::setprecision(4) << edgeVsMarket.evHome << ",\n";
    ss << "    \"evAway\": " << edgeVsMarket.evAway << ",\n";
    ss << "    \"mlSignal\": \"" << edgeVsMarket.mlSignal << "\"\n";
    ss << "  },\n";

    ss << "  \"recommendation\": \"" << recommendation << "\",\n";
    ss << "  \"keyInsight\": \"" << keyInsight << "\"\n";
    ss << "}";
    return ss.str();
}
