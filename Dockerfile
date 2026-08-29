# =========================================================
# Multi-stage Dockerfile for Render.com & Container Hosting
# =========================================================
FROM node:20-bookworm-slim AS base

# Install GCC C++ compiler
RUN apt-get update && apt-get install -y --no-install-recommends \
    g++ \
    make \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy dependency files
COPY package*.json ./
RUN npm install --production

# Copy C++ source and compile engine
COPY engine/ ./engine/
RUN g++ -std=c++20 -O3 -Iengine/include \
    engine/src/Player.cpp \
    engine/src/Batter.cpp \
    engine/src/Pitcher.cpp \
    engine/src/Lineup.cpp \
    engine/src/Team.cpp \
    engine/src/SabermetricCalculator.cpp \
    engine/src/MatchSimulator.cpp \
    engine/src/PredictionResult.cpp \
    engine/src/main.cpp \
    -o mlb_engine && chmod +x mlb_engine

# Copy Server scripts
COPY server/ ./server/

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD ["node", "server/server.js"]
