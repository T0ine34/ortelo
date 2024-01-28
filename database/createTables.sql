PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS player (
    playerid INTEGER PRIMARY KEY AUTOINCREMENT,
    playername VARCHAR(16) UNIQUE NOT NULL,
    password TEXT,
    email TEXT,
    online NUMBER(1) DEFAULT 1,
    email_confirmed NUMBER(1) DEFAULT 0,
    email_url TEXT,
    CONSTRAINT ck_OnlineBool CHECK (online IN (1,0)),
    CONSTRAINT ck_EmailConfirmedBool CHECK (email_confirmed IN (1,0))
);



CREATE TABLE IF NOT EXISTS game (
    gameid INTEGER PRIMARY KEY AUTOINCREMENT,
    gameownerid INTEGER,
    gamename VARCHAR(64),
    nbplayers INTEGER,
    gamestate VARCHAR(20),
    gameurl TEXT,
    lastplayed TIMESTAMP,
    CONSTRAINT ck_GameState CHECK (gamestate IN ('waiting', 'playing', 'finished')),
    CONSTRAINT ck_NbPlayers CHECK (nbplayers > 0),
    CONSTRAINT ck_GameUrl CHECK (gameurl LIKE 'http://%' OR gameurl LIKE 'https://%'),
    CONSTRAINT ck_LastPlayed CHECK (lastplayed > 0),
    FOREIGN KEY (gameownerid) REFERENCES player(playerid)
);



CREATE TABLE IF NOT EXISTS gameHistory (
    actionid INTEGER PRIMARY KEY AUTOINCREMENT,
    gameid INTEGER,
    playerid INTEGER,
    action TEXT,
    FOREIGN KEY (gameid) REFERENCES game(gameid),
    FOREIGN KEY (playerid) REFERENCES player(playerid)
);


CREATE TABLE IF NOT EXISTS inGame (
    gameid INTEGER PRIMARY KEY AUTOINCREMENT,
    playerid INTEGER,
    FOREIGN KEY (playerid) REFERENCES player(playerid),
    FOREIGN KEY (gameid) REFERENCES game(gameid)
);