PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS player (
    playerid INTEGER PRIMARY KEY AUTOINCREMENT,
    playername VARCHAR(16),
    password TEXT,
    email TEXT,
    online NUMBER(1),
    CONSTRAINT ck_OnlineBool CHECK (online IN (1,0))
);


CREATE TABLE IF NOT EXISTS game (
    gameid INTEGER PRIMARY KEY AUTOINCREMENT,
    gameownerid INTEGER,
    gamename VARCHAR(64),
    nbplayers INTEGER,
    gamestate VARCHAR(20),
    gameurl TEXT,
    lastplayed TIMESTAMP,

    FOREIGN KEY (gameownerid) REFERENCES player(playerid)
);


CREATE TABLE IF NOT EXISTS gameHistory (
    gameid INTEGER NOT NULL,
    playerid INTEGER,
    actionid INTEGER PRIMARY KEY AUTOINCREMENT,
    action TEXT,

    FOREIGN KEY (gameid) REFERENCES game(gameid),
    FOREIGN KEY (playerid) REFERENCES player(playerid)
);

CREATE TABLE IF NOT EXISTS inGame (
    gameid INTEGER PRIMARY KEY,
    playerid INTEGER,

    FOREIGN KEY (gameid) REFERENCES game(gameid),
    FOREIGN KEY (playerid) REFERENCES player(playerid)
)