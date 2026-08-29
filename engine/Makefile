CXX = g++
CXXFLAGS = -std=c++20 -O3 -Wall -Wextra -Iinclude

SRCS = src/Player.cpp src/Batter.cpp src/Pitcher.cpp src/Lineup.cpp src/Team.cpp src/SabermetricCalculator.cpp src/MatchSimulator.cpp src/PredictionResult.cpp src/main.cpp
OBJS = $(SRCS:.cpp=.o)
TARGET = ../mlb_engine.exe

all: $(TARGET)

$(TARGET): $(OBJS)
	$(CXX) $(CXXFLAGS) -o $@ $^

src/%.o: src/%.cpp
	$(CXX) $(CXXFLAGS) -c $< -o $@

clean:
	rm -f src/*.o $(TARGET)
