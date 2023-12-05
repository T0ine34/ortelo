const fs = require("fs");
const sqlite3 = require("sqlite3");
const config  = require('../settings/main.js');
const Logger  = require('../logs/logger');
const CryptoJS = require('crypto-js');
const BCrypt = require("bcrypt");

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
        Logger.fine("Loading database...")
        this._db = new sqlite3.Database(config.get("database.path"), sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
            if (err && err.code == "SQLITE_CANTOPEN") {
                Logger.error("Can not create or open database");
                return;
            } else if (err) {
                Logger.error(`Can not create or open database : ${err}`);
            }
        });
        Logger.fine(`Database opened successfully ${config.get("database.path")}`);
        Logger.info("Updating database state");
        this.#createTables();
    }

    /**
     * @author Lila BRANDON
     * @description This will look for the SQL script used .
     * to create all tables in case the database file doesn't exsist already.
     */
    #createTables() {
        let createTables = fs.readFileSync(config.get("database.createTablesPath"), 'utf8');
        Logger.debug("Loaded SQL script to create Database tables : " + createTables);
        this._db.exec(createTables);
        Logger.fine("Database state updated.");
    }

    /**
     * @author Lila BRANDON
     * @description Creates a player inside database. <br>The given password will be hashed before being inserted into the database.
     * @param {string} name is the player's name.
     * @param {string} password is the player's password (uncrypted).
     * @param {string} emailAddress is the player's email address, is not a must.
     * @returns wether the player has been created successfully or not.
     */
    createPlayer(name, password, emailAddress){
        let salt = BCrypt.genSaltSync(config.get("database.bcryptRounds"));
        //let key = this.#generateRandomKey(64);
        //let hashedPassword = BCrypt.hashSync(CryptoJS.AES.encrypt(password, key).toString(), salt);
        let hashedPassword = BCrypt.hashSync(password, salt);

        this.getPlayer(name, (exists) => {
            if(exists) {
                return false;
            } else {
                this._db.exec(`INSERT INTO player (playername, password${emailAddress ? ", email" : ""}, online) VALUES ('${name}', '${hashedPassword}'${emailAddress ? `, '${emailAddress}'` : ""}, 1)`);
                return true;
            }
        });
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
     * @param {function} callback The function using returned array of players' names for further use.
     * @return {Array} An array of players names.
     */
    listOnlinePlayers(callback) {
        this._db.all(`SELECT playername FROM player WHERE online='1' ORDER BY playername;`, [], (err, rows) => {
            if(err) {
                Logger.error(`Can not fetch all online players : ${err}`);
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
     * @param {string} name Player's name.
     * @param {function} callback Function using returned boolean value for further use.
     * @return {boolean} True if player already exists, false otherwise.
     */
    getPlayer(name, callback) {
        this._db.all(`SELECT playername FROM player WHERE playername='${name}';`, [], (err, rows) => {
            if(err){
                Logger.error(err.toString());
                callback(true);
            } 
            if(rows.length > 0) callback(true);
            else callback(false);
        });
        callback(true);
    }

    /**
     * @author Lila BRANDON
     * @description Gets player's (hashed) password from database .
     * @param {string} playerName Player's name.
     * @param {function} callback Function using returned password for further use.
     * @return {string} Player's hashed password.
     */
    getPassword(playerName, callback){
        this._db.get(`SELECT password FROM player WHERE playername='${playerName}';`, [], (err, row) => {
            if (err) {
                Logger.error(err.toString());
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
     * @param {string} password Player's password (clear).
     * @param {string} hashedPassword Player's password (hashed).
     * @param {function} callback Function using returned boolean for further use.
     * @return {boolean} True if the hashed password matches given clear password, false otherwise.
     */
    comparePassword(password, hashedPassword, callback) {
        BCrypt.compare(password, hashedPassword, function(err, result) {
            if (err) {
                Logger.error("Can't compare passwords : " + err);
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
        Logger.info("Closing database");
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
 * Exports the Logger so it can be used in other files
 */
module.exports = new Database();