/**
 * @module GameRooms
 * @category Server
 * @classdesc This module provides URL generation for games.
 * @static
 * @author Lila BRANDON
 */
class GameRooms {

    /**
     * Generates a random URL for a room.
     * @param {string} name the game name
     * @returns a string of 25+(length of name) characters
     * @static
     */
    static genURL(name) {
        const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let key = `game/${name}-`;
        
        for (let i = 0; i < 16; i++) {
          const randomIndex = Math.floor(Math.random() * characters.length);
          key += characters[randomIndex];
        }
        return key;
    }

}

module.exports = { GameRooms }