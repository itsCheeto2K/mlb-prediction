@echo off
title MLB Match Prediction & Sabermetric Analytics Platform
echo ========================================================
echo   MLB Match Prediction Platform - C++ OOP & Vite React
echo ========================================================

:: 1. Check C++ Binary
if not exist "mlb_engine.exe" (
    echo [1/3] Compiling C++ OOP Prediction Engine...
    cd engine
    call build.bat
    cd ..
) else (
    echo [1/3] C++ OOP Engine is compiled and ready.
)

:: 2. Launch Express Backend Bridge in background
echo [2/3] Starting Express Backend Bridge on http://localhost:3001 ...
start "MLB Prediction Backend" cmd /k "node server/server.js"

:: 3. Launch Vite React Frontend
echo [3/3] Starting React Vite Frontend on http://localhost:5173 ...
call npm.cmd run dev

pause
