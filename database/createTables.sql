CREATE TABLE IF NOT EXISTS player (
    playerid SERIAL PRIMARY KEY,
    playername VARCHAR(16),
    password TEXT,
    email TEXT
);