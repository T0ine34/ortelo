const fs                    = require("fs");
const sqlite3               = require("sqlite3");
const { Logger }            = require('../logs/main');
const CryptoJS              = require('crypto-js');
const BCrypt                = require("bcrypt");
const { Settings }          = require('../settings/main');
const { GameRooms }         = require("../gameRooms/main");

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
        this._db.exec(createTables);
        logger.fine("Database state updated.");
    }

    /**
     * @author Lila BRANDON
     * @description Creates a player inside database. <br>The given password will be hashed before being inserted into the database.
     * @param {string} name is the player's name.
     * @param {string} password is the player's password (uncrypted).
     * @param {string} emailAddress is the player's email address, is not a must.
     * @returns wether the player has been created successfully or not.
     */
    createPlayer(name, password, emailAddress, callback){
        let salt = BCrypt.genSaltSync(settings.get("database.bcryptRounds"));
        //let key = this.#generateRandomKey(64);
        //let hashedPassword = BCrypt.hashSync(CryptoJS.AES.encrypt(password, key).toString(), salt);
        let hashedPassword = BCrypt.hashSync(password, salt);

        this.doPlayerExists(name, (exists) => {
            if(exists == true) {
                callback(false);
            } else {
                this._db.exec(`INSERT INTO player (playername, password${emailAddress ? ", email" : ""}, online) VALUES ('${name}', '${hashedPassword}'${emailAddress ? `, '${emailAddress}'` : ""}, 1)`);
                logger.fine(`Successfully created ${name}'s account`);
                callback(true);
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
    createGameRoom(gameName, gameOwner, nbPlayers) {
        this.getPlayerId(gameOwner, (id) => {
            let url = GameRooms.genURL(gameName);
            //TODO ADD GAMEROOM TO DATABASE
        })
    }


    /**
     * @author Lila BRANDON
     * @description Checks if given password matches player's password.
     * @param  {string} name Player's name.
     * @param  {string} password Player's password.
     * @param  {function} callback The function using returned boolean value for further use.
     * @return {boolean} True/False depending on logging in being successful or not.
     */
    login(name, password, callback) {
        this.getPassword(name, (dbPassword) => {
            this.comparePassword(password, dbPassword, (compareResult) => {    
                callback(compareResult);
            });
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
     * @param  {function} callback Function using returned boolean value for further use.
     * @return {boolean} True if player already exists, false otherwise.
     */
    doPlayerExists(name, callback) {
        this._db.all(`SELECT playername FROM player WHERE playername='${name}';`, [], (err, rows) => {
            if(err){
                logger.error(`Can not retrieve wether the player ${name} exists or no : ${err.toString()}`);
                callback(true);
            } 
            if(rows.length > 0) callback(true);
            else callback(false);
        });
        callback(true);
    }

    /**
     * @author Lila BRANDON
     * @description Checks wether a gameroom already exists with the specified URL.
     * @param  {string} url The url to check if it exists.
     * @param  {function} callback Function using returned boolean value for further use.
     * @return {boolean} True if the url already exists, false otherwise.
     */
    doGameURLExists(url, callback) {
        this._db.get(`SELECT gameurl FROM game WHERE gameurl='${url}';`, [], (err, row) => {
            if(err) {
                logger.error(`Can not retrieve wether the url '${url}' already exists or no : ${err.toString()}`);
                callback(true);
            }
            if(row) callback(true);
            else callback(false);
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
     * @param  {function} callback Function using returned password for further use.
     * @return {string} Player's hashed password.
     */
    getPassword(playerName, callback){
        this._db.get(`SELECT password FROM player WHERE playername='${playerName}';`, [], (err, row) => {
            if (err) {
                logger.error(`Can not retrieve ${playerName}'s password : ${err.toString()}`);
                callback(false);
            } else {
                let password = row ? row.password : null;
                callback(password);
            }
        });
    }

    /**
     * @author Lila BRANDON
     * @description Compares clear string with player's hashed password to know if they match.
     * @param  {string} password Player's password (clear).
     * @param  {string} hashedPassword Player's password (hashed).
     * @param  {function} callback Function using returned boolean for further use.
     * @return {boolean} True if the hashed password matches given clear password, false otherwise.
     */
    comparePassword(password, hashedPassword, callback) {
        BCrypt.compare(password, hashedPassword, function(err, result) {
            if (err) {
                logger.error(`Can't compare passwords :  + ${err.toString()}`);
                callback(false);
            } else {
                callback(result);
            }
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