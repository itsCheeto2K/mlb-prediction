#!/bin/bash
set -e

echo "Compiling MLB Prediction C++ Engine for Linux..."
g++ -std=c++20 -O3 -Iinclude src/Player.cpp src/Batter.cpp src/Pitcher.cpp src/Lineup.cpp src/Team.cpp src/SabermetricCalculator.cpp src/MatchSimulator.cpp src/PredictionResult.cpp src/main.cpp -o ../mlb_engine
chmod +x ../mlb_engine
echo "[SUCCESS] mlb_engine compiled successfully for Linux!"
