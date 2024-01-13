/**
 * @file Main script for the Reversi game client.
 * @module Main
 */

// Initialize global variables
let csocket; // Client socket for communication with the server
let currentPlayer = 'B'; // Current player ('B' for Black, 'W' for White)
let isGameOver = false; // Flag to indicate if the game is over
let gameBoard = initializeBoard(); // Initialize the game board

/**
 * @function initializeBoard
 * @description Initialize the game board with starting pieces.
 * @returns {string[][]} A 2D array representing the game board.
 */
function initializeBoard() {
    let board = [...Array(8)].map(() => Array(8).fill(''));
    board[3][3] = 'W';
    board[3][4] = 'B';
    board[4][3] = 'B';
    board[4][4] = 'W';
    return board;
}

/**
 * @function updateGame
 * @description Update the game state based on received data from the server.
 * @param {object} state - The game state received from the server, including the board and current player.
 */
function updateGame(state) {
    gameBoard = state.board;
    currentPlayer = state.currentPlayer;
    renderBoard();
}

/**
 * @function cellClicked
 * @description Handle the event when a game cell is clicked.
 * @param {Event} event - The click event.
 */
function cellClicked(event) {
    const row = this.parentNode.rowIndex;
    const col = this.cellIndex;
    if (gameBoard[row][col] === '' && isValidMove(row, col)) {
        csocket.emit('makeMove', { row, col, player: currentPlayer });
    }
}

/**
 * @function isValidMove
 * @description Check if a move is valid at the given cell position.
 * @param {number} row - The row index of the cell.
 * @param {number} col - The column index of the cell.
 * @returns {boolean} True if the move is valid, false otherwise.
 */
function isValidMove(row, col) {
    // Check if the cell is empty and the game is not over
    if (gameBoard[row][col] !== '' || isGameOver) {
        return false;
    }

    let opponent = currentPlayer === 'B' ? 'W' : 'B'; // Determine the opponent's color
    let valid = false;

    // Define the possible directions to check for valid moves
    const directions = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1],           [0, 1],
        [1, -1],  [1, 0],  [1, 1]
    ];

    // Iterate through each direction
    for (let [dx, dy] of directions) {
        let x = row + dx;
        let y = col + dy;
        let foundOpponent = false;

        // Continue in the direction while finding opponent's pieces
        while (x >= 0 && x < 8 && y >= 0 && y < 8 && gameBoard[x][y] === opponent) {
            x += dx;
            y += dy;
            foundOpponent = true;
        }

        // If an opponent's piece is found and the next cell is the current player's piece, the move is valid
        if (foundOpponent && x >= 0 && x < 8 && y >= 0 && y < 8 && gameBoard[x][y] === currentPlayer) {
            valid = true;
            break;
        }
    }

    return valid;
}

/**
 * @function renderBoard
 * @description Render the game board with the current state.
 */
function renderBoard() {
    // Iterate through the game board and update the HTML table cells
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

/**
 * @function handleGameOver
 * @description Handle the end of the game and display the winner.
 * @param {string} winner - The winner of the game ('B' for Black, 'W' for White, 'D' for Draw).
 */
function handleGameOver(winner) {
    isGameOver = true;
    alert(`Game Over. Winner: ${winner}`);
}

/**
 * @function updateGameStatus
 * @description Update the game status display based on the current state.
 */
function updateGameStatus() {
    const statusElement = document.getElementById('gameStatus');
    if (isGameOver) {
        let winnerText = winner === 'D' ? 'Draw' : (winner === 'B' ? 'Black' : 'White');
        statusElement.textContent = `Game Over. Winner: ${winnerText}`;
    } else {
        statusElement.textContent = `Current Player's Turn: ${currentPlayer === 'B' ? 'Black' : 'White'}`;
    }
}

/**
 * @function restartGame
 * @description Send a request to the server to restart the game.
 */
function restartGame() {
    csocket.emit('restartGame');
}

// Add event listeners when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the client socket
    csocket = io();

    // Set up event listeners for game start and game update events from the server
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

    // Add click event listeners to the game board cells
    document.querySelectorAll('#gameBoard td').forEach(cell => {
        cell.addEventListener('click', cellClicked);
    });

    // Add click event listener to the restart button
    document.getElementById('restartButton').addEventListener('click', () => {
        restartGame();
    });
});
