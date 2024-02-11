    // Import necessary modules
    const { EVENTS, Room, CIO } = require('./server_modules/events/main.js');

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
            this.players = { B: null, W: null };
            // Winner of the game ('B' for Black, 'W' for White, 'D' for Draw)
            this.winner;
            this.restartRequests = new Set();
            this.room = room;

        }

        /**
         * Initializes the game board with the starting pieces.
         * @returns {string[][]} An 8x8 game board.
         */
        requestRestart(username) {
            if (this.players.B === username || this.players.W === username) {
                this.restartRequests.add(username);
                if (this.restartRequests.size >= 2) {
                    this.resetGame();
                    this.restartRequests.clear();
                    return true;
                }
            }
            return this.restartRequests.size;
        }

        /**
         * Initializes the game board.
         *
         * @returns {any[][]} The initialized game board represented as a 2D array.
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

        makeMove(row, col, username) {
            try {
                if (row < 0 || row >= 8 || col < 0 || col >= 8) {
                    console.error("Invalid row or column");
                    return false;
                }
                let player = this.currentPlayer;
                if (this.board[row][col] !== '' || this.isGameOver || username !== this.players[this.currentPlayer]) {
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
                this.restartRequests.delete(username);
                return true;
            } catch (error) {
                console.error(`Error in makeMove: ${error}`);
                return false;
            }
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
         * Method to switch the current player.
         *
         * @return {void} - This method does not return any value.
         */

        switchPlayer() {
            this.currentPlayer = this.currentPlayer === 'B' ? 'W' : 'B';
        }

        /**
         * Checks if the game is over.
         *
         * @returns {void}
         */

        checkGameOver() {
            let blackMoves = this.hasValidMove('B');
            let whiteMoves = this.hasValidMove('W');
        
            if (!blackMoves && !whiteMoves) {
                this.isGameOver = true;
                this.determineWinner();
                this.room.transmit(EVENTS.GAME.DATA, Date.now(), this.getGameState());
            } else if (this.board.every(row => row.every(cell => cell !== ''))) {
                this.isGameOver = true;
                this.determineWinner();
                this.room.transmit(EVENTS.GAME.DATA, Date.now(), this.getGameState());
            }
        }


        /**
         * Determines the winner of the game based on the current state of the board.
         *
         * @returns {void} This method does not return any value.
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

        addPlayer(username) {
            if (!this.players.B) {
                this.players.B = username;
                return "B";
            } else if (!this.players.W) {
                this.players.W = username;
                return "W";
            }
            return null;
        }

        /**
         * Removes a player from the game session.
         * @param {string} socketId - The socket ID of the player to remove.
         */

        removePlayer(socketId) {
            this.players = this.players.filter(id => id !== socketId);
        }

        /**n
         * Checks if the game is ready to start with two players.
         * @returns {boolean} True if there are two players in the game, false otherwise.
         */

        isReadyToStart() {
            return this.players.length === 2;
        }

        /**
         * Randomizes the players.
         *
         * @param {Object} players - The players object.
         * @param {string} players.B - The first player.
         * @param {string} players.W - The second player.
         */
        randomizePlayers(players) {
            if (Math.random() < 0.5) {
                [players.B, players.W] = [players.W, players.B];
            }
        }

        /**
         * Resets the game to its initial state.
         * This method is used to reset the game board, current player, game over status, winner, and restart requests.
         * It also randomizes the players order.
         *
         * @return {void} Nothing is returned from this method.
         */

        resetGame() {
            this.board = this.initializeBoard();
            this.currentPlayer = 'B';
            this.isGameOver = false;
            this.winner = null;
            this.restartRequests = new Set();
            this.randomizePlayers(this.players);
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
                winner: this.winner,
                players: this.players
            };
        }
    }

    /**
     * Handles the 'connection' event when a player connects to the server.
     * @event
     * @param {Socket} socket - The socket representing the connected player.
     */
    function reversi(room) {
        let game = new ReversiGame();
        game.resetGame();


        /**
         * Shuffles the elements of an array in place.
         *
         * @param {any[]} array - The array to be shuffled.
         */
        function shuffleArray(array) {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
        }
        const usersArray = Array.from(room.users);
        shuffleArray(usersArray);
        const joueur1 = usersArray[0].username;
        game.addPlayer(joueur1);
        const joueur2 = usersArray[1].username;
        game.addPlayer(joueur2);
        room.on(EVENTS.GAME.DATA, (timestamp, data) => {
            try {
                if (data && "row" in data && "col" in data && "username" in data) {
                    const moveValid = game.makeMove(data.row, data.col, data.username);
                    if (moveValid) {
                        room.transmit(EVENTS.GAME.DATA, Date.now(), game.getGameState());
                    }
                } else if (data && "restartKey" in data && data.restartKey === "restart") {
                    const restartCount = game.requestRestart(data.username);
                    if (restartCount === true) {
                        room.transmit(EVENTS.GAME.DATA, Date.now(), game.getGameState());
                    } else {
                        room.transmit(EVENTS.GAME.DATA, Date.now(), {restartCount});
                    }
                } else if (data && "ready" in data) {
                    room.transmit(EVENTS.GAME.DATA, Date.now(), {
                        all_connected: "all_connected",
                        players: game.players
                    });
                    room.transmit(EVENTS.GAME.DATA, Date.now(), game.getGameState());
                } else {
                    console.error("Invalid data received:", data);
                }
            } catch (error) {
                console.error(`Error processing game data: ${error}`);
            }
        });
    }