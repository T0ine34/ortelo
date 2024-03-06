const fs                    = require("fs");
const sqlite3               = require("sqlite3");
const { Logger }            = require('../logs/main');
const CryptoJS              = require('crypto-js');
const BCrypt                = require("bcrypt");
const { Settings }          = require('../settings/main');
const { URLGenerator }         = require("../url_generator/main");
const validator = require('validator');

let logger = new Logger();
var settings = new Settings("./server.config");

/**
 * @module Database
 * @category Server
 * @description This module contains classes to interact with server's database.
 * @author Lila Brandon
*/

/**
 * @classdesc this class will perform actions on SQLITE database.
 * @author Lila Brandon
 */
class Database {

    static _instance = null;
    constructor() {
        if(!Database._instance) { //if instance does not exist, create it
            Database._instance = this;
            this.#load();
        }
        return Database._instance;
    }

    /**
     * @author Lila Brandon
     * @description Base function for database module. <br>
     * Creates a new database file if there isn't one already.
     */
    #load() {
        logger.fine("Loading database...")
        this._db = new sqlite3.Database(settings.get("database.path"), sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
            if (err && err.code == "SQLITE_CANTOPEN") {
                logger.error("Can not create or open database");
                return;
            } else if (err) {
                logger.error(`Can not create or open database : ${err.toString()}`);
            }
        });
        logger.fine(`Database opened successfully ${settings.get("database.path")}`);
        logger.info("Updating database state");
        this.#createTables();
    }

    /**
     * @author Lila BRANDON
     * @description This will look for the SQL script used .
     * to create all tables in case the database file doesn't exsist already.
     */
    #createTables() {
        let createTables = fs.readFileSync(settings.get("database.createTablesPath"), 'utf8');
        logger.debug("Loaded SQL script to create Database tables : " + createTables);
        this._db.exec(createTables, (err) => {
            if(err) {
                logger.error(`Can not create tables : ${err.toString()}`);
                return;
            } else logger.fine("Database state updated.");
        });
    }

    /**
     * @author Lila BRANDON
     * @description Creates a player inside database. <br>The given password will be hashed before being inserted into the database.
     * @param {string} name is the player's name.
     * @param {string} password is the player's password (uncrypted).
     * @param {string} emailAddress is the player's email address, is not a must.
     * @returns wether the player has been created successfully or not.
     */
    createPlayer(name, password, emailAddress, email_url) {
        return new Promise(async (resolve, reject) => {
            if (!validator.isEmail(emailAddress)) {
                logger.error(`Invalid email address: ${emailAddress}`);
                return reject(new Error('Invalid email address'));
            }

            let salt = BCrypt.genSaltSync(settings.get("database.bcryptRounds"));
            let hashedPassword = BCrypt.hashSync(password, salt);

            const database = this;

            const exists = await this.doPlayerExists(name);
            if (exists) {
                resolve({"created": false, "reason": "Player already exists"});
            } else {
                const insertPlayerQuery = `INSERT INTO player (playername, password, email) VALUES (?, ?, ?)`;
                database._db.run(insertPlayerQuery, [name, hashedPassword, emailAddress], function (err) {
                    if (err) {
                        logger.error(`Can not create player: ${err.toString()}`);
                        resolve({"created": false, "reason": "Can not create player"});
                    } else {
                        const playerId = this.lastID;
                        const insertUnconfirmedPlayerQuery = `INSERT INTO unconfirmed_players (playerid, email_url) VALUES (?, ?)`;
                        database._db.run(insertUnconfirmedPlayerQuery, [playerId, email_url], (err) => { // Utilisez 'database' au lieu de 'this'
                            if (err) {
                                logger.error(`Can not create unconfirmed player: ${err.toString()}`);
                                resolve({"created": false, "reason": "Can not create unconfirmed player"});
                            } else {
                                logger.fine(`Successfully created ${name}'s account in unconfirmed players`);
                                resolve({"created": true, "playerId": playerId});
                            }
                        });
                    }
                });
            }
        });
    }

    /**
     * @author Lila BRANDON
     * @description Creates a new room for a game then adds it to database.
     * @param {string} gameName Name of the game to create a room for.
     * @param {string} gameOwner Name of the player who creates this room.
     * @param {string} nbPlayers Number of players playing in this game.
     */
    createGameRoom(gameName, gameOwner, roomUrl, nbPlayers) {
        return new Promise(async (resolve, reject) => {
            this.getPlayerId(gameOwner, (id) => {
                this._db.exec(`INSERT INTO game (gameownerid, gamename, nbplayers, gamestate, gameurl, lastplayed) VALUES ("${id}", "${gameName}", "${nbPlayers}", "WAITING", "${roomUrl}", "${new Date().getTime()}")`, (err) => {
                    if(err) {
                        logger.error(`Can not create game room : ${err.toString()}`);
                        resolve(false);
                    } else {
                        logger.fine(`Successfully created game room for ${gameOwner}`);
                        resolve(true);
                    }
                });
            })
        });
    }

    addGameAction(gameId, playerId, action) {
        return new Promise(async (resolve, reject) => {
            this._db.exec(`INSERT INTO gameHistory (gameid, playerid, action) VALUES (${gameId}, ${playerId}, ${action})`, (err) => {
                if(err) {
                    logger.error(`Can not add game action : ${err.toString()}`);
                    resolve(false);
                } else resolve(true);
            });
        });
    }

    confirmRegistration(username) {
        return new Promise(async (resolve, reject) => {
            this._db.exec(`DELETE FROM unconfirmed_players WHERE playerid=(SELECT playerid FROM player WHERE playername='${username}')`, (err) => {
                if(err) {
                    logger.error(`Can not confirm registration : ${err.toString()}`);
                    resolve(false);
                } else resolve(true);
            });
        });
    }


    /**
     * @author Lila BRANDON
     * @description Checks if given password matches player's password.
     * @param  {string} name Player's name.
     * @param  {string} password Player's password.
     * @return {boolean} True/False depending on logging in being successful or not.
     */
    login(name, password) {
        return new Promise(async (resolve, reject) => {
            if (!name || !validator.isAlphanumeric(name, 'en-US', { ignore: ' -_@.' })) {
                return reject(new Error('Invalid username'));
            }

            try {
                const dbpassword = await this.getPassword(name);
                const compareResult = await this.comparePassword(password, dbpassword);
                resolve(compareResult);
            } catch (err) {
                logger.error(err.toString());
                reject(err);
            }
        });
    }

    /**
     * @author Lila BRANDON
     * @description Fetches all players registered in database.
     * @param  {function} callback The function using returned array of players' names for further use.
     * @return {Array} An array of players names.
     */
    listOnlinePlayers(callback) {
        this._db.all(`SELECT playername FROM player WHERE online='1' ORDER BY playername;`, [], (err, rows) => {
            if(err) {
                logger.error(`Can not fetch all online players : ${err.toString()}`);
                return [];
            } else {
                let playerNames = [];
                rows.forEach( (row) => { playerNames.push(row.playername); });
                callback(playerNames);
            }
        });
    }

    /**
     * @author Lila BRANDON
     * @description Checks wether a player exists in the database or not.
     * @param  {string} name Player's name.
     * @return {boolean} True if player already exists, false otherwise.
     */
    doPlayerExists(name) {
        return new Promise(async (resolve, reject) => {
            this._db.all(`SELECT playername FROM player WHERE playername='${name}';`, [], (err, rows) => {
                if(err){
                    logger.error(`Can not retrieve wether the player ${name} exists or no : ${err.toString()}`);
                    reject(true);
                } 
                if(rows.length > 0) resolve(true);
                else resolve(false);
            });
        });
    }

    /**
     * @author Lila BRANDON
     * @description Checks wether a gameroom already exists with the specified URL.
     * @param  {string} url The url to check if it exists.
     * @return {boolean} True if the url already exists, false otherwise.
     */
    doGameURLExists(url) {
        return new Promise(async (resolve, reject) => {
            this._db.get(`SELECT gameurl FROM game WHERE gameurl='${url}';`, [], (err, row) => {
                if(err) {
                    logger.error(`Can not retrieve wether the url '${url}' already exists or no : ${err.toString()}`);
                    reject(true);
                }
                if(row) resolve(true);
                else resolve(false);
            });
        });
    }

    /**
     * @author Lila BRANDON
     * @description Checks if a registration url is valid or not
     * @param {string} username The username to check if url is valid.
     * @param {string} url The url to check if it is valid.
    */
    isRegistrationUrlValid(username, url) {
        return new Promise(async (resolve, reject) => {
            this._db.get(`SELECT email_url FROM unconfirmed_players WHERE playerid=(SELECT playerid FROM player WHERE playername='${username}');`, [], (err, row) => {
                if(err) {
                    logger.error(`Can not retrieve ${username}'s registration url : ${err.toString()}`);
                    resolve(false);
                }
                if(row) {
                    if(row.email_url == url) resolve(true);
                    else resolve(false);
                } else resolve(false);
            });
        });
    }

    /**
     * @author Lila BRANDON
     * @description Gets the id of player with the specified name.
     * @param  {string} name The name of the player to retrieve it's id.
     * @param  {function} callback Function using returned id for further use.
     * @return {int} The id of the player with the specified name.
     */
    getPlayerId(name, callback) {
        this._db.get(`SELECT playerid FROM player WHERE playername='${name}';`, [], (err, row) => {
            if(err) {
                logger.error(`Can not retrieve ${name}'s playerid : ${err.toString()}`);
                callback("null");
            }
            if(row) callback(row.playerid);
            else callback("null");
        })
    }

    /**
     * @author Lila BRANDON
     * @description Gets player's (hashed) password from database .
     * @param  {string} playerName Player's name.
     * @return {string} Player's hashed password.
     */
    getPassword(playerName){
        return new Promise((resolve, reject) => {
            this._db.get(`SELECT password FROM player WHERE playername = ?`, [playerName], (err, row) => {
                if (err) {
                    logger.error(`Cannot retrieve ${playerName}'s password : ${err.toString()}`);
                    reject(false);
                } else {
                    let password = row ? row.password : null;
                    resolve(password);
                }
            });
        });
    }

    /**
     * @author Lila BRANDON
     * @description Compares clear string with player's hashed password to know if they match.
     * @param  {string} password Player's password (clear).
     * @param  {string} hashedPassword Player's password (hashed).
     * @return {boolean} True if the hashed password matches given clear password, false otherwise.
     */
    comparePassword(password, hashedPassword) {
        return new Promise(async (resolve, reject) => {
            BCrypt.compare(password, hashedPassword, function(err, result) {
                if (err) {
                    logger.error(`Can't compare passwords :  + ${err.toString()}`);
                    reject(false);
                } else {
                    resolve(result);
                }
            });
        });
    }


    /**
     * @author Lila BRANDON
     * @description Closes database connection.
     */
    close() {
        logger.info("Closing database");
        this._db.close();
    }

    /**
     * @author Lila BRANDON
     * @description Generates a random key for AES encryption algorithm.
     * @param {int} length Length of the key to generate.
     * @returns {string} The generated key.
     */
    #generateRandomKey(length) {
        const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let key = '';
      
        for (let i = 0; i < length; i++) {
          const randomIndex = Math.floor(Math.random() * characters.length);
          key += characters[randomIndex];
        }
      
        return key;
      }

}

/**
 * Exports the Database so it can be used in other files
 */
let database = new Database();
module.exports = { database };