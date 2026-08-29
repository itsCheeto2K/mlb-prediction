@echo off
echo Compiling MLB Prediction C++ Engine...
g++ -std=c++20 -O3 -Iinclude src/Player.cpp src/Batter.cpp src/Pitcher.cpp src/Lineup.cpp src/Team.cpp src/SabermetricCalculator.cpp src/MatchSimulator.cpp src/PredictionResult.cpp src/main.cpp -o ../mlb_engine.exe
if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] mlb_engine.exe compiled successfully!
) else (
    echo [ERROR] Compilation failed!
    exit /b 1
)
