const express = require('express');
const http = require('http');
const socketIO = require('socket.io');



const app = express();
app.use(express.static('public'));
const server = http.createServer(app);
const io = socketIO(server);


class ReversiGame {
    constructor() {
        this.board = this.initializeBoard();
        this.currentPlayer = 'B'; 
        this.isGameOver = false;
        this.players = [];
    }

    initializeBoard() {
        let board = [...Array(8)].map(() => Array(8).fill(''));
        board[3][3] = 'W';
        board[3][4] = 'B';
        board[4][3] = 'B';
        board[4][4] = 'W';
        return board;
    }

    
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

    switchPlayer() {
        this.currentPlayer = this.currentPlayer === 'B' ? 'W' : 'B';
    }

    /*checkGameOver() {
        if (this.isGameOver) {
            this.determineWinner();
        }

        let blackMoves = this.hasValidMove('B');
        let whiteMoves = this.hasValidMove('W');

        if (!blackMoves && !whiteMoves) {
            this.isGameOver = true;
            this.determineWinner();
        }
    }*/

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

    addPlayer(socketId) {
        if (this.players.length < 2 && !this.players.includes(socketId)) {
            this.players.push(socketId);
            return true;
        }
        return false;
    }

    removePlayer(socketId) {
        this.players = this.players.filter(id => id !== socketId);
    }

    isReadyToStart() {
        return this.players.length === 2;
    }

    resetGame() {
        this.board = this.initializeBoard();
        this.currentPlayer = 'B';
        this.isGameOver = false;
        this.winner = null;
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


let game = new ReversiGame();

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