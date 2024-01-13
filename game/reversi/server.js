// Import necessary modules
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');

// Create an Express application
const app = express();

// Configure the Express application to serve static files from the 'public' folder
app.use(express.static('public'));

// Create an HTTP server using Express
const server = http.createServer(app);

// Create a WebSocket connection using Socket.IO
const io = socketIO(server);

/**
 * Class representing a Reversi game session.
 */
class ReversiGame {
    /**
     * Initializes a new instance of the ReversiGame class.
     * @constructor
     */
    constructor() {
        // Initialize the game board
        this.board = this.initializeBoard();
        // Current player ('B' for Black, 'W' for White)
        this.currentPlayer = 'B';
        // Game over flag
        this.isGameOver = false;
        // Array to store socket IDs of connected players
        this.players = [];
        // Winner of the game ('B' for Black, 'W' for White, 'D' for Draw)
        this.winner = null;
    }

    /**
     * Initializes the game board with the starting pieces.
     * @returns {string[][]} An 8x8 game board.
     */

    initializeBoard() {
        let board = [...Array(8)].map(() => Array(8).fill(''));
        board[3][3] = 'W';
        board[3][4] = 'B';
        board[4][3] = 'B';
        board[4][4] = 'W';
        return board;
    }

     /**
     * Makes a move on the game board.
     * @param {number} row - The row of the move.
     * @param {number} col - The column of the move.
     * @param {string} player - The player making the move ('B' or 'W').
     * @returns {boolean} True if the move is valid and successful, false otherwise.
     */

    makeMove(row, col, player) {
        if (this.board[row][col] !== '' || this.isGameOver || player !== this.currentPlayer) {
            return false;
        }

        let flipped = this.getFlippedPieces(row, col, player);
        if (flipped.length === 0) {
            return false;
        }

        flipped.forEach(pos => {
            this.board[pos[0]][pos[1]] = player;
        });

        this.board[row][col] = player;

        this.checkGameOver();
        if (!this.isGameOver) {
            this.switchPlayer();
            if (!this.hasValidMove(this.currentPlayer)) {
                this.switchPlayer();
            }
        }
        return true;
    }

    /**
     * Gets the flipped pieces by a move.
     * @param {number} row - The row of the move.
     * @param {number} col - The column of the move.
     * @param {string} player - The player making the move ('B' or 'W').
     * @returns {Array.<Array.<number>>} An array of coordinates of flipped pieces.
     */


    getFlippedPieces(row, col, player) {
        let directions = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1], /*[row, col]*/ [0, 1],
            [1, -1], [1, 0], [1, 1]
        ];

        let flipped = [];
        directions.forEach(([dx, dy]) => {
            let x = row + dx;
            let y = col + dy;
            let path = [];

            while (x >= 0 && x < 8 && y >= 0 && y < 8 && this.board[x][y] === (player === 'B' ? 'W' : 'B')) {
                path.push([x, y]);
                x += dx;
                y += dy;
            }

            if (x >= 0 && x < 8 && y >= 0 && y < 8 && this.board[x][y] === player) {
                flipped = flipped.concat(path);
            }
        });

        return flipped;
    }

     /**
     * Switches to the next player's turn.
     */

    switchPlayer() {
        this.currentPlayer = this.currentPlayer === 'B' ? 'W' : 'B';
    }

    /**
     * Checks if the game is over and determines the winner.
     */

    checkGameOver() {
        let blackMoves = this.hasValidMove('B');
        let whiteMoves = this.hasValidMove('W');

        if (!blackMoves && !whiteMoves) {
            this.isGameOver = true;
            this.determineWinner();
        } else if (this.board.every(row => row.every(cell => cell !== ''))) {
            this.isGameOver = true;
            this.determineWinner();
        }
    }

    /**
     * Determines the winner of the game.
     */

    determineWinner() {
        let blackCount = 0;
        let whiteCount = 0;
        this.board.forEach(row => {
            row.forEach(cell => {
                if (cell === 'B') blackCount++;
                if (cell === 'W') whiteCount++;
            });
        });

        this.winner = blackCount > whiteCount ? 'B' : whiteCount > blackCount ? 'W' : 'D';
    }

     /**
     * Checks if a player has a valid move.
     * @param {string} player - The player to check ('B' or 'W').
     * @returns {boolean} True if the player has a valid move, false otherwise.
     */

    hasValidMove(player) {
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if (this.board[row][col] === '' && this.getFlippedPieces(row, col, player).length > 0) {
                    return true;
                }
            }
        }
        return false;
    }
    
    /**
     * Adds a player to the game session.
     * @param {string} socketId - The socket ID of the player to add.
     * @returns {boolean} True if the player was successfully added, false if the game is full.
     */

    addPlayer(socketId) {
        if (this.players.length < 2 && !this.players.includes(socketId)) {
            this.players.push(socketId);
            return true;
        }
        return false;
    }

    /**
     * Removes a player from the game session.
     * @param {string} socketId - The socket ID of the player to remove.
     */

    removePlayer(socketId) {
        this.players = this.players.filter(id => id !== socketId);
    }

    /**
     * Checks if the game is ready to start with two players.
     * @returns {boolean} True if there are two players in the game, false otherwise.
     */

    isReadyToStart() {
        return this.players.length === 2;
    }

    /**
     * Resets the game state to the initial state.
     */

    resetGame() {
        this.board = this.initializeBoard();
        this.currentPlayer = 'B';
        this.isGameOver = false;
        this.winner = null;
    }

    /**
     * Gets the current state of the game.
     * @returns {Object} An object representing the game state.
     */

    getGameState() {
        return {
            board: this.board,
            currentPlayer: this.currentPlayer,
            isGameOver: this.isGameOver,
            winner: this.winner
        };
    }
}


let game = new ReversiGame();

/**
 * Handles the 'connection' event when a player connects to the server.
 * @event
 * @param {Socket} socket - The socket representing the connected player.
 */

io.on('connection', (socket) => {
    if (game.addPlayer(socket.id)) {
        if (game.isReadyToStart()) {
            game.resetGame();
            io.emit('gameStart', game.getGameState());
        }
    }

    socket.on('makeMove', (data) => {
        if (data.player === game.currentPlayer && game.makeMove(data.row, data.col, data.player)) {
            io.emit('gameUpdate', game.getGameState());
            if (game.isGameOver) {
                io.emit('gameOver', game.getGameState());
            }
        }
    });

    socket.on('disconnect', () => {
        game.removePlayer(socket.id);
        if (!game.isReadyToStart()) {
            game.resetGame();
            io.emit('waitingForPlayer');
        }
    });

    socket.on('restartGame', () => {
        game.resetGame();
        io.emit('gameUpdate', game.getGameState());
    });
});

server.listen(5000, () => {
    console.log('Server running on port 5000');
});