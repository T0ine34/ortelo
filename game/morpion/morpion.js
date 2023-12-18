class Morpion {
    constructor() {
        this.board = [["", "", ""], ["", "", ""], ["", "", ""]];
        this.currentPlayer = "X";
        this.isGameOver = false;
        this.winner = null;
    }

    initializeBoard() {
        this.board = [["", "", ""], ["", "", ""], ["", "", ""]];
        this.currentPlayer = "X";
        this.isGameOver = false;
        this.winner = null;
    }

    makeMove(row, col) {
        if (this.board[row][col] || this.isGameOver) {
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
function initializeMorpionSocket(io, game) {
    io.on('connection', (socket) => {
        console.log('a user connected to morpion');

        socket.on('move', ({ row, col }) => {
            const moveValid = game.makeMove(row, col);
            if (moveValid) {
                io.emit('gameState', game.getGameState());
            }
        });

        socket.on('restart', () => {
            game.initializeBoard();
            io.emit('gameState', game.getGameState());
        });

        socket.on('disconnect', () => {
            console.log('user disconnected from morpion');
        });
    });
}
module.exports = { Morpion, initializeMorpionSocket };