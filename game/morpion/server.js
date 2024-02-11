const { EVENTS, Room, CIO } = require('./server_modules/events/main.js');

/**
 * Represents a game server for a Tic Tac Toe game.
 */
class Server {
    /**
     * Create a new instance of the game board.
     *
     * @constructor
     * @returns {object} - An instance of the game board.
     */
    constructor() {
        this.board = [["", "", ""], ["", "", ""], ["", "", ""]];
        this.players = { X: null, O: null };
        this.currentPlayer = "X";
        this.isGameOver = false;
        this.winner = null;
    }
    /**
     * Add a player to the game.
     * @param {string} username - Username of the player to add.
     * @returns {string|null} Symbol representing the player added ('X' or 'O'), or null if no space.
     */
    addPlayer(username) {
        if (!this.players.X) {
            this.players.X = username;
            return "X";
        } else if (!this.players.O) {
            this.players.O = username;
            return "O";
        }
        return null;
    }

    /**
     * Randomizes the players' order.
     *
     * @param {Object} players - The object containing the players.
     */
    randomizePlayers(players) {
        if (Math.random() < 0.5) {
            [players.X, players.O] = [players.O, players.X];
        }
    }

    /**
     * Initializes the game board and sets up initial game state.
     *
     * @method initializeBoard
     * @returns {void}
     */
    initializeBoard() {
        this.board = [["", "", ""], ["", "", ""], ["", "", ""]];
        this.currentPlayer = "X";
        this.isGameOver = false;
        this.winner = null;
        this.randomizePlayers(this.players);

    }
    /**
     * Make a move on the game board.
     * @param {number} row - The row index of the move.
     * @param {number} col - The column index of the move.
     * @param {string} username - Username of the player making the move.
     * @returns {boolean} True if the move was successful, false otherwise.
     */
    makeMove(row, col, username) {
        try {
            if (row < 0 || row > 2 || col < 0 || col > 2) {
                console.error(`Invalid row or column index: row=${row}, col=${col}`);
                return false;
            }
            if (this.board[row][col] || this.isGameOver) {
                return false;
            }
            if (username !== this.players[this.currentPlayer]) {
                return false;
            }
            if (this.board[row][col] === "" && !this.isGameOver) {
                this.board[row][col] = this.currentPlayer;
                this.checkForWin();
                if (!this.isGameOver) {
                    this.switchPlayer();
                }
                return true;
            }
            return false;
        } catch (error) {
            console.error(`Error in makeMove: ${error}`);
            return false;
        }
    }


    /**
     * Switches the current player between "X" and "O".
     *
     * @return {void}
     */
    switchPlayer() {
        this.currentPlayer = this.currentPlayer === "X" ? "O" : "X";
    }

    /**
     * Check for a win in the Tic Tac Toe game.
     *
     * This method checks all possible winning combinations on the game board and determines if there is a winner or if the game is a draw.
     * If there is a winner, it sets the `isGameOver` property to true and assigns the `currentPlayer` as the `winner` property.
     * If the game is a draw, it sets the `isGameOver` property to true and assigns 'D' as the `winner` property.
     *
     * @return {void}
     */
    checkForWin() {
        const winningCombinations = [
            [[0, 0], [0, 1], [0, 2]],
            [[1, 0], [1, 1], [1, 2]],
            [[2, 0], [2, 1], [2, 2]],

            [[0, 0], [1, 0], [2, 0]],
            [[0, 1], [1, 1], [2, 1]],
            [[0, 2], [1, 2], [2, 2]],

            [[0, 0], [1, 1], [2, 2]],
            [[0, 2], [1, 1], [2, 0]]
        ];

        for (const [a, b, c] of winningCombinations) {
            if (this.board[a[0]][a[1]] !== "" &&
                this.board[a[0]][a[1]] === this.board[b[0]][b[1]] &&
                this.board[a[0]][a[1]] === this.board[c[0]][c[1]]) {
                this.isGameOver = true;
                this.winner = this.currentPlayer;
                return;
            }
        }
        if (this.board.flat().every(cell => cell !== "")) {
            this.isGameOver = true;
            this.winner = 'D';
        }
    }

    /**
     * Get the current state of the game.
     * @returns {Object} Current state of the game including board, currentPlayer, isGameOver, winner, and players.
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
 * Initialize a socket connection for the Morpion (Tic-Tac-Toe) game.
 * @param {Room} room - The game room.
 */
function morpion(room) {
    let game = new Server();
    game.initializeBoard();


    /**
     * Shuffles the elements in the given array in-place.
     *
     * @param {Array} array - The array to be shuffled.
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
                game.initializeBoard();
                room.transmit(EVENTS.GAME.DATA, Date.now(), game.getGameState());
            } else if (data && "ready" in data) {
                room.transmit(EVENTS.GAME.DATA, Date.now(), {all_connected: "all_connected", players: game.players});
                room.transmit(EVENTS.GAME.DATA, Date.now(), game.getGameState());
            } else {
                console.error("Invalid data received:", data);
            }
        } catch (error) {
            console.error("Error handling socket event:", error);
        }
    });
}