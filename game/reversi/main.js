/**
 * @file Main script for the Reversi game client.
 * @module Main
 */
let EVENTS;
let csocket;
function start() {
    // Initialize global variables
    let currentPlayer; // Current player ('B' for Black, 'W' for White)
    let isGameOver = false; // Flag to indicate if the game is over
    let gameBoard = initializeBoard(); // Initialize the game board
    let players;
    csocket = window.csocket;
    let username = window.username;
    let showHints = false;
    let winner = null;

    csocket.on(EVENTS.GAME.DATA, (timestamp, state) => {
        if (!state || typeof state !== 'object') {
            console.error("Invalid game state received");
            return;
        }
        if (state && "all_connected" in state && "players" in state) {
            players = state.players;
            updateGameStatus();
        } else if (state.restartCount !== undefined) {
            document.querySelector('#restartButton').textContent = `Redémarrer (${state.restartCount}/2)`;
        } else {
            document.querySelector('#restartButton').textContent = 'Redémarrer';
            players = state.players;
            gameBoard = state.board;
            currentPlayer = state.currentPlayer;
            isGameOver = state.isGameOver;
            renderBoard();
            updateGameStatus();

            if (isGameOver) {
                handleGameOver(state.winner);
            }
        }
    });

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
            csocket.emit(EVENTS.GAME.DATA, Date.now(), { row, col, username});
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
            [0, -1], [0, 1],
            [1, -1], [1, 0], [1, 1]
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
     * Toggles the visibility of hints and updates the board display.
     *
     * @return {void}
     */
    function toggleHints() {
        showHints = !showHints;
        renderBoard();

        const hintButton = document.querySelector('#hintButton');
        if (showHints) {
            hintButton.classList.add('active');
        } else {
            hintButton.classList.remove('active');
        }
    }

    /**
     * @function renderBoard
     * @description Render the game board with the current state.
     */
    function renderBoard() {
        gameBoard.forEach((row, rowIndex) => {
            row.forEach((cell, colIndex) => {
                const tableCell = document.querySelector('#gameBoard').rows[rowIndex].cells[colIndex];
                tableCell.className = '';
                if (cell === 'B') {
                    tableCell.classList.add('black');
                } else if (cell === 'W') {
                    tableCell.classList.add('white');
                }

                if (showHints && players[currentPlayer] === username && isValidMove(rowIndex, colIndex)) {
                    const playableClass = players['B'] === username ? 'playable-black' : 'playable-white';
                    tableCell.classList.add(playableClass);
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
        let winnerText;
        if (winner === 'D') {
            winnerText = 'Match Nul';
        } else if (winner === 'B') {
            winnerText = 'Noir';
        } else {
            winnerText = 'Blanc';
        }
    
        let winnerAnnouncement = document.querySelector('#winnerAnnouncement');
        winnerAnnouncement.innerHTML = `Fin de Partie. Vainqueur: ${winnerText}`;
        winnerAnnouncement.style.display = 'block';
    
       
        setTimeout(() => {
            winnerAnnouncement.style.display = 'none';
        }, 5000); 
    }
    

    /**
     * @function updateGameStatus
     * @description Update the game status display based on the current state.
     */
    function updateGameStatus() {
        const statusElement = document.querySelector('#gameStatus');

        if (isGameOver) {
            let winnerText = winner === 'D' ? 'Match Nul' : (winner === 'B' ? 'Noir' : 'Blanc');
            statusElement.textContent = `Fin de Partie. Vainqueur: ${winnerText}`;
        } else {
            let jetonHtml = currentPlayer === "B" ? '<span class="jeton-noir"></span>' : '<span class="jeton-blanc"></span>';

            if (players[currentPlayer] === username) {
                statusElement.innerHTML = `C'est votre tour ${jetonHtml}`;
            } else {
                statusElement.innerHTML = `Au tour de l'adversaire ${jetonHtml}`;
            }
        }
    }


    /**
     * @function restartGame
     * @description Send a request to the server to restart the game.
     */
    function restartGame() {
        csocket.emit(EVENTS.GAME.DATA, Date.now(), { "restartKey": "restart", username : username});
    }

    // Add click event listeners to the game board cells
    document.querySelectorAll('#gameBoard td').forEach(cell => {
        cell.addEventListener('click', cellClicked);
    });

    // Add click event listener to the restart button
    document.querySelector('#restartButton').addEventListener('click', () => {
        restartGame();
    });
    document.querySelector('#hintButton').addEventListener('click', toggleHints);
    csocket.emit(EVENTS.GAME.DATA, Date.now(), {ready: "ready"});
}
import('./modules/events/main.js').then(module => {
    EVENTS = module.EVENTS;
    if (document.readyState === "complete" ||
        (document.readyState !== "loading" && !document.documentElement.doScroll)) {
        start();
    } else {
        document.addEventListener("DOMContentLoaded", start);
    }
}).catch(error => {
    console.error('Erreur lors du chargement du module :', error);
});

