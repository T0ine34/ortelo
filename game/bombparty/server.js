const { EVENTS, Room, CIO } = require('../../server_modules/events/main');

/**
 * @class BombPartyServer
 * @description The server for the BombParty game.
 */
class BombPartyServer {

    /**
     * Initializes the server.
     * @constructor
     */
    constructor() {
        this.players = [];
        this.currentPlayerIndex = 0;
        
        // GameOver flag
        this.isGameOver = false;

        this.room = room;

        this.init();
    }


    async init() {
        this.wordList = await getWordList();
        
        // Returns true if 'abdominaux' is in the list of words
        //console.log(wordList.includes('abdominaux'));
    }

    /**
     * Adds a player to the game session.
     * @param {string} socketId - The socket ID of the player to add.
     * @returns {boolean} True if the player was successfully added, false if the game is full.
     */
     addPlayer(socketId) {
        this.players.push(socketId);
        return true;
    }


    switchPlayer() {
        this.currentPlayerIndex++;
        if (this.currentPlayerIndex >= this.players.length) {
            this.currentPlayerIndex = 0;
        }
    }

    /**
     * Gets a french words list to be used in the game.
     * @returns {Array} The list of words that can be used in the game.
     */
    getWordList() {
        return new Promise(async (resolve, reject) => {
            let words = await fetch('http://butinfo.vps.boxtoplay.com/words.txt');
            words = words.text();
            resolve(words);
        });
    }

    /**
     * Get the current state of the game.
     * @returns {Object} Current state of the game including board, currentPlayer, isGameOver, winner, and players.
     */
    getGameState() {
        return {
            currentPlayerIndex: this.currentPlayerIndex,
            isGameOver: this.isGameOver,
            players: this.players
        };
    }

}

new BombPartyServer();