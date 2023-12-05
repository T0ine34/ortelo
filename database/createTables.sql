CREATE TABLE IF NOT EXISTS player (
    playerid INTEGER PRIMARY KEY AUTOINCREMENT,
    playername VARCHAR(16),
    password TEXT,
    email TEXT,
    online NUMBER(1),
    CONSTRAINT ck_OnlineBool CHECK (online IN (1,0))
);