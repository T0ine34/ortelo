const fs                    = require("fs");
const sqlite3               = require("sqlite3");
const { Logger }            = require('../logs/main');
const CryptoJS              = require('crypto-js');
const BCrypt                = require("bcrypt");
const { Settings }          = require('../settings/main');
const { URLGenerator }         = require("../url_generator/main");

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
    createPlayer(name, password, emailAddress, email_url, hasIdp, idpName){
        return new Promise(async (resolve, reject) => {
            
            const exists = await this.doPlayerExists(emailAddress);
            const usernameAlreadyExists = await this.doUsernameExists(name);
            if(usernameAlreadyExists.exists == true) name = name + ++usernameAlreadyExists.quantity;
            if(exists == true) {
                resolve({"created" : false, "reason": "Player already exists"});
            } else {
                let identifier = this.#generateRandomKey(64);
                let sql;
                if(hasIdp == true) {
                    sql = `INSERT INTO player (playername, email, identifier, hasIdP, idpList) VALUES ('${name}', '${emailAddress}', '${identifier}', ${hasIdp}, '${idpName}')`;
                } else {
                    let salt = BCrypt.genSaltSync(settings.get("database.bcryptRounds"));
                    let hashedPassword = BCrypt.hashSync(password, salt);
                    sql = `INSERT INTO player (playername, password, email, identifier, hasIdP) VALUES ('${name}', '${hashedPassword}','${emailAddress}', '${identifier}', FALSE)`;
                }
                this._db.exec(sql, (err) => {
                    if(err) {
                        logger.error(`Can not create player : ${err.toString()}`);
                        resolve({created: false, reason: "Can not create player"});
                    }
                });


                let playerId = await this.getPlayerIdentifier(emailAddress);
                if(hasIdp == true) {
                    logger.fine(`Successfully created ${name}'s account as an IdP user`);
                    logger.fine('Id of the player is ' + playerId);
                    resolve({created: true, playerId: playerId});
                } else {
                    this._db.exec(`INSERT INTO unconfirmed_players (playerid, email_url) VALUES ((SELECT playerid FROM player WHERE playername='${name}'), '${email_url}')`, (err) => {
                        if(err) {
                            logger.error(`Can not create unconfirmed player : ${err.toString()}`);
                            resolve({created: false, reason: "Can not create unconfirmed player"});
                        } else {
                            logger.fine(`Successfully created ${name}'s account in unconfirmed players`);
                            resolve({created: true, playerId: playerId});
                        }
                    });
                }
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
     * Gets the player's identifier
     * @param {string} email the player's email address
     * @returns the player's identifier
     */
    getPlayerIdentifier(email){
        return new Promise(async (resolve, reject) => {
            this._db.get(`SELECT identifier FROM player WHERE email='${email}'`, [], (err, row) => {
                if(err) {
                    logger.error(`Can not retrieve ${email}'s identifier : ${err.toString()}`);
                    resolve(null);
                } else {
                    logger.info(`Successfully retrieved ${email}'s identifier : ${row.identifier}`);
                    resolve(row.identifier);
                }
            });
        });
    }

    /**
     * Gets the player's idp List from the database.
     * @param {string} email the player's email address
     * @returns 
     */
    getPlayerIdPList(email){
        return new Promise(async (resolve, reject) => {
            this._db.get(`SELECT idpList FROM player WHERE email='${email}'`, [], (err, row) => {
                if(err) {
                    logger.error(`Can not retrieve ${email}'s idpList : ${err.toString()}`);
                    resolve(null);
                } else {
                    logger.info(`Successfully retrieved ${email}'s idpList : ${row.idpList}`);
                    resolve(row.idpList);
                }
            });
        });
    }


    /**
     * @description Checks wether the player's username exists in the database or not.
     * @param {string} username The username to check if it exists.
     * @returns {boolean} wether the username exists or not.
     */
    doUsernameExists(username) {
        return new Promise(async (resolve, reject) => {
            this._db.all(`SELECT playername FROM player WHERE playername='${username}';`, [], (err, rows) => {
                if(err) {
                    logger.error(`Can not retrieve wether the username ${username} exists or no : ${err.toString()}`);
                    resolve({exists: true, quantity: 0});
                }
                if(rows.length >= 1) resolve({exists: true, quantity: rows.length});
                else resolve({exists: false});
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
    login(name, password, hasIdP, idpName) {
        return new Promise(async (resolve, reject) => {
            if(hasIdP == true) {
                const email = await this.getEmail(name).catch( (err) => logger.error(err.toString()));
                const dbidpList = await this.getPlayerIdPList(email).catch( (err) => logger.error(err.toString()));
                if(!dbidpList.includes(idpName)) {
                    this.addIdp(email, idpName).catch( (err) => logger.error(err.toString()));
                }
                const identifier = await this.getPlayerIdentifier(email).catch( (err) => logger.error(err.toString()));
                resolve({"logged": true, "identifier": identifier});
            } else {
                const dbpassword = await this.getPassword(name).catch( (err) => logger.error(err.toString()));
                const compareResult = await this.comparePassword(password, dbpassword).catch( (err) => logger.error(err.toString()));
                let identifier = null;
                if(compareResult) { identifier = await this.getPlayerIdentifier(name).catch( (err) => logger.error(err.toString())); }
                resolve({"logged": compareResult, "identifier": identifier});
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
    doPlayerExists(email) {
        return new Promise(async (resolve, reject) => {
            this._db.all(`SELECT email FROM player WHERE email='${email}';`, [], (err, rows) => {
                if(err){
                    logger.error(`Can not retrieve wether the player with email ${email} exists or no : ${err.toString()}`);
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

    getUsername(email, fromPlayerid = false){
        return new Promise(async (resolve, reject) => {
            this._db.get(`SELECT playername FROM player WHERE ${fromPlayerid == true ? 'identifier' : 'email'}='${email}';`, [], (err, row) => {
                if(err) {
                    logger.error(`Can not retrieve ${email}'s username : ${err.toString()}`);
                    resolve(null);
                }
                if(row) resolve(row.playername);
                else resolve(null);
            });
        });
    }
    

    getEmail(username) {
        return new Promise(async (resolve, reject) => {
            this._db.get(`SELECT email FROM player WHERE playername='${username}';`, [], (err, row) => {
                if(err) {
                    logger.error(`Can not retrieve ${username}'s email : ${err.toString()}`);
                    resolve(null);
                }
                if(row) resolve(row.email);
                else resolve(null);
            });
        });
    }

    /**
     * @author Lila BRANDON
     * @description Gets player's (hashed) password from database .
     * @param  {string} playerName Player's name.
     * @return {string} Player's hashed password.
     */
    getPassword(playerName){
        return new Promise(async (resolve, reject) => {
            this._db.get(`SELECT password FROM player WHERE playername='${playerName}';`, [], (err, row) => {
                if (err) {
                    logger.error(`Can not retrieve ${playerName}'s password : ${err.toString()}`);
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

    isPlayerOnline(email) {
        return new Promise(async (resolve, reject) => {
            this._db.get(`SELECT online FROM player WHERE email='${email}';`, [], (err, row) => {
                if(err) {
                    logger.error(`Can not retrieve wether ${email} is online or not : ${err.toString()}`);
                    reject(false);
                }
                if(row.online == 1) resolve(true);
                else resolve(false);
            });
        });
    }

    isPlayerConfirmed(email) {
        return new Promise(async (resolve, reject) => {
            this._db.get(`SELECT email FROM player WHERE email='${email}';`, [], (err, row) => {
                if(err) {
                    logger.error(`Can not retrieve wether ${email} is confirmed or not : ${err.toString()}`);
                    reject(false);
                }
                if(row.email) resolve(true);
                else resolve(false);
            });
        });
    }

    addIdp(email, idpName) {
        return new Promise(async (resolve, reject) => {
            let idpList = await this.getPlayerIdPList(email);
            idpList += `,${idpName}`;
            this._db.exec(`UPDATE player SET idpList='${idpList}' WHERE email='${email}';`, (err) => {
                if(err) {
                    logger.error(`Can not add IdP to player : ${err.toString()}`);
                    resolve(false);
                } else resolve(true);
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