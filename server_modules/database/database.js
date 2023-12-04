const fs = require("fs");
const sqlite3 = require("sqlite3");
const config  = require('../settings/main.js');
const Logger  = require('../logs/logger');
const CryptoJS = require('crypto-js');
const BCrypt = require("bcrypt");

/**
 * @module Database
 * @category Server
 * @description this module contains classes to interact with server's database
 * @author Lila Brandon
*/

/**
 * @classdesc this class will perform actions on SQLITE database 
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
     * @function
     * @description Executes the SQL script to create database structure
     */
    #createTables() {
        let createTables = fs.readFileSync(config.get("database.createTablesPath"), 'utf8');
        Logger.debug("Loaded SQL script to create Database tables : " + createTables);
        this._db.exec(createTables);
        Logger.fine("Database state updated.");
    }

    /**
     * @author Lila BRANDON
     * @param {string} name is the player's name
     * @param {string} password is the player's password (uncrypted)
     * @param {string} emailAddress is the player's email address, is not a must
     * @returns wether the player has been created successfully or not
     */
    createPlayer(name, password, emailAddress){
        let salt = BCrypt.genSaltSync(config.get("database.bcryptRounds"));
        let key = this.#generateRandomKey(64);
        let hashedPassword = BCrypt.hashSync(CryptoJS.AES.encrypt(password, key).toString(), salt);

        if(this.getPlayer(name)) return false;
        else {
            this._db.exec(`INSERT INTO player (playername, password${emailAddress ? ", email" : ""}) VALUES ('${name}', '${hashedPassword}'${emailAddress ? `, '${emailAddress}'` : ""})`);
            return true;
        }
    }

    login(name, password) {
        
        console.log(this.getPassword(name));
        
        /*BCrypt.compare(password, dbPassword, function(err, result) {
            console.log(result)
            if (result) {
              console.log('Le mot de passe est correct.');
            } else {
              console.log('Le mot de passe est incorrect.');
            }
        });*/
    }


    getPlayer(name) {
        let exists = false;
        this._db.all(`SELECT playername FROM player WHERE playername='${name}';`, [], (err, rows) => {
            if(err){
                Logger.error(err.toString());
                exists = true;
            } 
            
            if(rows.length > 0) exists = true;
            else exists = false;
        });
        return exists;
    }

    getPassword(playerName){
        let password = "";
        this._db.all(`SELECT password FROM player WHERE playername='${playerName}';`, [], (err, rows) => {
            if(err){
                Logger.error(err.toString());
                return false;
            } 
            rows.forEach( (row) => {
                password = row.password;
                //console.log(password)
            });
        });
        console.log(password);
        return password;
    }



    close() {
        Logger.info("Closing database");
        this._db.close();
    }


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