PRAGMA foreign_keys = ON;
CREATE TABLE game (
    gameid INTEGER PRIMARY KEY,
    gameownerid INTEGER,
    gameurl TEXT
);
CREATE TABLE player (
    playerid INTEGER PRIMARY KEY,
    playername TEXT,
    playerinfo TEXT
);
CREATE TABLE inprogress (
    playerid INTEGER,
    gameid INTEGER,
    FOREIGN KEY (playerid) REFERENCES player(playerid),
    FOREIGN KEY (gameid) REFERENCES game(gameid),
    PRIMARY KEY (playerid, gameid)
);
CREATE TABLE userhistory (
    playerid INTEGER,
    gameid INTEGER,
    gameinfo TEXT,
    FOREIGN KEY (playerid) REFERENCES player(playerid),
    FOREIGN KEY (gameid) REFERENCES game(gameid),
    PRIMARY KEY (playerid, gameid)
);
/*CREATE TABLE textchat (
    chat TEXT
);*/