/**
 * @module GameRooms
 * @category Server
 * @classdesc This module provides URL generation for games.
 * @author Lila BRANDON
 */
class GameRooms {
    static _instance = null;
    constructor() {
        if(!GameRooms._instance) { //if instance does not exist, create it
            GameRooms._instance = this;
        }
        return GameRooms._instance;
    }

    genURL(name) {
        const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let key = `game/${name}-`;
        
        for (let i = 0; i < 16; i++) {
          const randomIndex = Math.floor(Math.random() * characters.length);
          key += characters[randomIndex];
        }
      
        return key;
    }

}
/**
 * Exports the Logger so it can be used in other files
 */
module.exports = new GameRooms();