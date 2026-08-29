#include <iostream>
#include <string>
#include <sstream>
#include <vector>
#include <memory>
#include "../include/Batter.hpp"
#include "../include/Pitcher.hpp"
#include "../include/Lineup.hpp"
#include "../include/Team.hpp"
#include "../include/MatchSimulator.hpp"

std::string extractString(const std::string& json, const std::string& key, const std::string& defVal = "") {
    std::string needle = "\"" + key + "\":";
    size_t pos = json.find(needle);
    if (pos == std::string::npos) return defVal;
    pos += needle.length();
    while (pos < json.length() && (json[pos] == ' ' || json[pos] == '\t' || json[pos] == '\n' || json[pos] == '\r')) pos++;
    if (pos >= json.length()) return defVal;
    if (json[pos] == '\"') {
        size_t endQuote = json.find('\"', pos + 1);
        if (endQuote != std::string::npos) {
            return json.substr(pos + 1, endQuote - pos - 1);
        }
    }
    return defVal;
}

double extractDouble(const std::string& json, const std::string& key, double defVal = 0.0) {
    std::string needle = "\"" + key + "\":";
    size_t pos = json.find(needle);
    if (pos == std::string::npos) return defVal;
    pos += needle.length();
    while (pos < json.length() && (json[pos] == ' ' || json[pos] == '\t' || json[pos] == '\n' || json[pos] == '\r')) pos++;
    try {
        size_t nextComma = json.find_first_of(",}\n\r", pos);
        std::string numStr = json.substr(pos, nextComma - pos);
        return std::stod(numStr);
    } catch (...) {
        return defVal;
    }
}

int extractInt(const std::string& json, const std::string& key, int defVal = 0) {
    return static_cast<int>(extractDouble(json, key, defVal));
}

std::vector<std::string> extractArrayObjects(const std::string& json, const std::string& arrayKey) {
    std::vector<std::string> results;
    std::string needle = "\"" + arrayKey + "\":";
    size_t pos = json.find(needle);
    if (pos == std::string::npos) return results;
    size_t startBracket = json.find('[', pos);
    if (startBracket == std::string::npos) return results;

    size_t cur = startBracket + 1;
    while (cur < json.length()) {
        size_t objStart = json.find('{', cur);
        if (objStart == std::string::npos) break;
        int depth = 0;
        size_t objEnd = objStart;
        for (; objEnd < json.length(); ++objEnd) {
            if (json[objEnd] == '{') depth++;
            else if (json[objEnd] == '}') {
                depth--;
                if (depth == 0) break;
            }
        }
        if (depth == 0) {
            results.push_back(json.substr(objStart, objEnd - objStart + 1));
            cur = objEnd + 1;
        } else {
            break;
        }
    }
    return results;
}

std::shared_ptr<Batter> parseBatterJson(const std::string& bJson, int defaultOrder) {
    int id = extractInt(bJson, "id", 1000 + defaultOrder);
    std::string name = extractString(bJson, "name", "Batter " + std::to_string(defaultOrder));
    Handedness batH = parseHandedness(extractString(bJson, "batHand", "R"));
    Handedness throwH = parseHandedness(extractString(bJson, "throwHand", "R"));
    int order = extractInt(bJson, "order", defaultOrder);
    int ab = extractInt(bJson, "atBats", 450);
    int h = extractInt(bJson, "hits", 115);
    int d = extractInt(bJson, "doubles", 22);
    int t = extractInt(bJson, "triples", 2);
    int hr = extractInt(bJson, "homeRuns", 16);
    int bb = extractInt(bJson, "walks", 42);
    int so = extractInt(bJson, "strikeouts", 98);
    int hbp = extractInt(bJson, "hitByPitch", 3);
    int sf = extractInt(bJson, "sacFlies", 3);
    int ibb = extractInt(bJson, "intentionalWalks", 1);
    double avg = extractDouble(bJson, "avg", 0.255);
    double obp = extractDouble(bJson, "obp", 0.325);
    double slg = extractDouble(bJson, "slg", 0.420);
    double ops = extractDouble(bJson, "ops", avg > 0 ? obp + slg : 0.745);

    // REQ-05: vs RHP / vs LHP splits
    double vsRhpOps = extractDouble(bJson, "vsRhpOps", 0.0);
    double vsLhpOps = extractDouble(bJson, "vsLhpOps", 0.0);
    double vsRhpAvg = extractDouble(bJson, "vsRhpAvg", 0.0);
    double vsLhpAvg = extractDouble(bJson, "vsLhpAvg", 0.0);
    int vsRhpAb = extractInt(bJson, "vsRhpAb", 0);
    int vsLhpAb = extractInt(bJson, "vsLhpAb", 0);

    return std::make_shared<Batter>(id, name, batH, throwH, order, ab, h, d, t, hr, bb, so,
                                   hbp, sf, ibb, avg, obp, slg, ops,
                                   vsRhpOps, vsLhpOps, vsRhpAvg, vsLhpAvg, vsRhpAb, vsLhpAb);
}

std::shared_ptr<Pitcher> parsePitcherJson(const std::string& pJson, bool isStarter, double defaultFipConst = 3.15) {
    int id = extractInt(pJson, "id", isStarter ? 2001 : 2002);
    std::string name = extractString(pJson, "name", isStarter ? "Starting Pitcher" : "Bullpen");
    Handedness batH = parseHandedness(extractString(pJson, "batHand", "R"));
    Handedness throwH = parseHandedness(extractString(pJson, "throwHand", "R"));
    double ip = extractDouble(pJson, "inningsPitched", 150.0);
    double era = extractDouble(pJson, "era", 3.85);
    double whip = extractDouble(pJson, "whip", 1.22);
    double k9 = extractDouble(pJson, "k9", 8.9);
    double bb9 = extractDouble(pJson, "bb9", 2.9);
    double hr9 = extractDouble(pJson, "hr9", 1.05);
    int wins = extractInt(pJson, "wins", 10);
    int losses = extractInt(pJson, "losses", 7);
    int so = extractInt(pJson, "strikeouts", 145);
    int hbp = extractInt(pJson, "hitBatsmen", 5);
    double fipConst = extractDouble(pJson, "fipConstant", defaultFipConst);

    return std::make_shared<Pitcher>(id, name, batH, throwH, isStarter, ip, era, whip, k9, bb9, hr9, wins, losses, so, hbp, fipConst);
}

int main(int argc, char* argv[]) {
    std::string input;
    if (argc > 1) {
        input = argv[1];
    } else {
        std::string line;
        while (std::getline(std::cin, line)) {
            input += line + "\n";
        }
    }

    if (input.empty() || input.find("homeTeam") == std::string::npos) {
        input = "{\"homeTeamName\": \"Los Angeles Dodgers\", \"homeTeamAbbr\": \"LAD\", \"awayTeamName\": \"New York Yankees\", \"awayTeamAbbr\": \"NYY\"}";
    }

    std::string homeName = extractString(input, "homeTeamName", "Los Angeles Dodgers");
    std::string homeAbbr = extractString(input, "homeTeamAbbr", "LAD");
    double homeParkFactor = extractDouble(input, "homeParkFactor", 1.02);
    double homeBullpenEra = extractDouble(input, "homeBullpenEra", 3.75);
    double homeBullpenWhip = extractDouble(input, "homeBullpenWhip", 1.20);

    std::string awayName = extractString(input, "awayTeamName", "New York Yankees");
    std::string awayAbbr = extractString(input, "awayTeamAbbr", "NYY");
    double awayBullpenEra = extractDouble(input, "awayBullpenEra", 3.85);
    double awayBullpenWhip = extractDouble(input, "awayBullpenWhip", 1.22);

    // REQ-04: Dynamic FIP Constant from league payload
    double leagueFipConstant = extractDouble(input, "fipConstant", 3.15);

    Team homeTeam(homeName, homeAbbr, true, homeParkFactor, homeBullpenEra, homeBullpenWhip);
    Team awayTeam(awayName, awayAbbr, false, 1.0, awayBullpenEra, awayBullpenWhip);

    auto homePitcherObjs = extractArrayObjects(input, "homePitcher");
    if (!homePitcherObjs.empty()) {
        homeTeam.setStartingPitcher(parsePitcherJson(homePitcherObjs[0], true, leagueFipConstant));
    } else {
        homeTeam.setStartingPitcher(std::make_shared<Pitcher>(101, "Tyler Glasnow", Handedness::RIGHT, Handedness::RIGHT, true, 134.0, 3.49, 0.95, 11.3, 2.4, 0.9, 9, 6, 168, 5, leagueFipConstant));
    }

    auto awayPitcherObjs = extractArrayObjects(input, "awayPitcher");
    if (!awayPitcherObjs.empty()) {
        awayTeam.setStartingPitcher(parsePitcherJson(awayPitcherObjs[0], true, leagueFipConstant));
    } else {
        awayTeam.setStartingPitcher(std::make_shared<Pitcher>(201, "Gerrit Cole", Handedness::RIGHT, Handedness::RIGHT, true, 95.0, 3.41, 1.13, 9.4, 2.7, 1.0, 8, 5, 99, 4, leagueFipConstant));
    }

    auto homeBatterObjs = extractArrayObjects(input, "homeBatters");
    for (size_t i = 0; i < homeBatterObjs.size() && i < 9; ++i) {
        homeTeam.addBatter(parseBatterJson(homeBatterObjs[i], static_cast<int>(i + 1)));
    }
    while (homeTeam.getLineup().size() < 9) {
        int idx = static_cast<int>(homeTeam.getLineup().size() + 1);
        homeTeam.addBatter(std::make_shared<Batter>(1000 + idx, "Home Batter " + std::to_string(idx),
                                                   Handedness::RIGHT, Handedness::RIGHT, idx, 450, 118, 24, 2, 18, 45, 95, 3, 3, 1, 0.262, 0.335, 0.444, 0.779));
    }

    auto awayBatterObjs = extractArrayObjects(input, "awayBatters");
    for (size_t i = 0; i < awayBatterObjs.size() && i < 9; ++i) {
        awayTeam.addBatter(parseBatterJson(awayBatterObjs[i], static_cast<int>(i + 1)));
    }
    while (awayTeam.getLineup().size() < 9) {
        int idx = static_cast<int>(awayTeam.getLineup().size() + 1);
        awayTeam.addBatter(std::make_shared<Batter>(2000 + idx, "Away Batter " + std::to_string(idx),
                                                   Handedness::RIGHT, Handedness::RIGHT, idx, 440, 112, 22, 1, 19, 48, 105, 3, 3, 1, 0.254, 0.330, 0.438, 0.768));
    }

    int simulations = extractInt(input, "simulations", 10000);
    if (simulations < 1000) simulations = 10000;

    MatchSimulator simulator(homeTeam, awayTeam, simulations);
    PredictionResult result = simulator.runSimulation();

    std::cout << result.toJson() << std::endl;
    return 0;
}
