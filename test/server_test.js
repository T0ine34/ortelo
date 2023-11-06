const sqlite3 = require('sqlite3').verbose();

let db = new sqlite3.Database('../database/mabase.db', sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected');
});

let sql = 'INSERT INTO player(playerid) VALUES(?) ';
db.run(sql, ['1'], function(err) {
    if (err) {
        return console.error(err.message);
    }
    console.log(`Rows inserted ${this.changes}`);
});
db.close();