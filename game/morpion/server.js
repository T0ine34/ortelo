const { EVENTS, Room, CIO } = require('./server_modules/events/main.js');
class Server {
    constructor() {
        this.board = [["", "", ""], ["", "", ""], ["", "", ""]];
        this.players = { X: null, O: null };
        this.currentPlayer = "X";
        this.isGameOver = false;
        this.winner = null;
    }

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

    initializeBoard() {
        this.board = [["", "", ""], ["", "", ""], ["", "", ""]];
        this.currentPlayer = "X";
        this.isGameOver = false;
        this.winner = null;
    }

    makeMove(row, col, username) {
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
    }

    switchPlayer() {
        this.currentPlayer = this.currentPlayer === "X" ? "O" : "X";
    }

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


    getGameState() {
        return {
            board: this.board,
            currentPlayer: this.currentPlayer,
            isGameOver: this.isGameOver,
            winner: this.winner
        };
    }
}
function initializeMorpionSocket(room) {
    let game = new Server();
    game.initializeBoard();

    const usersArray = Array.from(room.users);
    const joueur1 = usersArray[0].username;
    game.addPlayer(joueur1);
    const joueur2 = usersArray[1].username;
    game.addPlayer(joueur2);

    room.on(EVENTS.GAME.DATA, (timestamp, data) => {
        if (data && "row" in data && "col" in data && "username" in data) {
            const moveValid = game.makeMove(data.row, data.col, data.username);
            if (moveValid) {
                room.transmit(EVENTS.GAME.DATA, Date.now(), game.getGameState());
            }
        } else if (data && "restartKey" in data && data.restartKey === "restart") {
            game.initializeBoard();
            room.transmit(EVENTS.GAME.DATA, Date.now(), game.getGameState());
        } else {
            console.error("Invalid data received:", data);
        }
    });
}
global.initializeMorpionSocket = initializeMorpionSocket;
module.exports = { Server: Server, initializeMorpionSocket };