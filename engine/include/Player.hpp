#ifndef PLAYER_HPP
#define PLAYER_HPP

#include <string>
#include <iostream>

enum class Handedness {
    RIGHT,
    LEFT,
    SWITCH
};

inline Handedness parseHandedness(const std::string& h) {
    if (h == "L" || h == "LEFT" || h == "Left" || h == "l") return Handedness::LEFT;
    if (h == "S" || h == "SWITCH" || h == "Switch" || h == "s") return Handedness::SWITCH;
    return Handedness::RIGHT;
}

inline std::string handednessToString(Handedness h) {
    switch (h) {
        case Handedness::LEFT: return "L";
        case Handedness::SWITCH: return "S";
        default: return "R";
    }
}

enum class PositionType {
    PITCHER,
    BATTER
};

class Player {
protected:
    int id;
    std::string name;
    PositionType positionType;
    Handedness batHand;
    Handedness throwHand;

public:
    Player(int id, const std::string& name, PositionType pos, Handedness batH, Handedness throwH)
        : id(id), name(name), positionType(pos), batHand(batH), throwHand(throwH) {}
    virtual ~Player() = default;

    int getId() const { return id; }
    std::string getName() const { return name; }
    PositionType getPositionType() const { return positionType; }
    Handedness getBatHand() const { return batHand; }
    Handedness getThrowHand() const { return throwHand; }

    virtual void displayInfo() const = 0;
};

#endif