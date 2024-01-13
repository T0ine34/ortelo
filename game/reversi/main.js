let csocket;
let currentPlayer = 'B'; // B for Black, W for White
let isGameOver = false;
let gameBoard = initializeBoard();

document.addEventListener('DOMContentLoaded', () => {
    csocket = io(); 

    csocket.on('gameStart', gameState => {
        gameBoard = gameState.board;
        currentPlayer = gameState.currentPlayer;
        isGameOver = gameState.isGameOver;
        renderBoard();
        updateGameStatus();
    });

    csocket.on('gameUpdate', gameState => {
        gameBoard = gameState.board;
        currentPlayer = gameState.currentPlayer;
        isGameOver = gameState.isGameOver;
        renderBoard();
        updateGameStatus();
    });

    document.querySelectorAll('#gameBoard td').forEach(cell => {
        cell.addEventListener('click', cellClicked);
    });

    document.getElementById('restartButton').addEventListener('click', () => {
        csocket.emit('restartGame');
    });
});



function initializeBoard() {
    let board = [...Array(8)].map(() => Array(8).fill(''));
    board[3][3] = 'W';
    board[3][4] = 'B';
    board[4][3] = 'B';
    board[4][4] = 'W';
    return board;
}

function updateGame(state) {
    gameBoard = state.board;
    currentPlayer = state.currentPlayer;
    renderBoard();
}

function cellClicked(event) {
    const row = this.parentNode.rowIndex;
    const col = this.cellIndex;
    if (gameBoard[row][col] === '' && isValidMove(row, col)) {
        csocket.emit('makeMove', { row, col, player: currentPlayer });
    }
}

function isValidMove(row, col) {
    if (gameBoard[row][col] !== '' || isGameOver) {
        return false;
    }

    let opponent = currentPlayer === 'B' ? 'W' : 'B';
    let valid = false;

    const directions = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1],           [0, 1],
        [1, -1],  [1, 0],  [1, 1]
    ];

    for (let [dx, dy] of directions) {
        let x = row + dx;
        let y = col + dy;
        let foundOpponent = false;

        while (x >= 0 && x < 8 && y >= 0 && y < 8 && gameBoard[x][y] === opponent) {
            x += dx;
            y += dy;
            foundOpponent = true;
        }

        if (foundOpponent && x >= 0 && x < 8 && y >= 0 && y < 8 && gameBoard[x][y] === currentPlayer) {
            valid = true;
            break;
        }
    }

    return valid;
}


function renderBoard() {
    gameBoard.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
            const tableCell = document.getElementById('gameBoard').rows[rowIndex].cells[colIndex];
            tableCell.className = ''; // Clear previous class
            if (cell === 'B') {
                tableCell.classList.add('black');
            } else if (cell === 'W') {
                tableCell.classList.add('white');
            }
        });
    });
}

function handleGameOver(winner) {
    isGameOver = true;
    alert(`Game Over. Winner: ${winner}`);
}

function updateGameStatus() {
    const statusElement = document.getElementById('gameStatus');
    if (isGameOver) {
        let winnerText = winner === 'D' ? 'Match Nul' : (winner === 'B' ? 'Noir' : 'Blanc');
        statusElement.textContent = `Jeu terminé. Gagnant : ${winnerText}`;
    } else {
        statusElement.textContent = `Tour du joueur : ${currentPlayer === 'B' ? 'Noir' : 'Blanc'}`;
    }
}


function restartGame() {
    csocket.emit('restartGame');
}




