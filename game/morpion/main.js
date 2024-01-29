let EVENTS;
let csocket;
function start() {
    let currentPlayer;
    let isGameOver;
    let winner;
    let gameBoard = [["", "", ""], ["", "", ""], ["", "", ""]];
    csocket = window.csocket;
    let username = window.username;
    let players;

    csocket.on(EVENTS.GAME.DATA, (timestamp, state) => {
        if (state && "all_connected" in state && "players" in state) {
            players = state.players;
            updateTurnMessage();
        } else {
            updateGameState(state);
            updateFightersDisplay();
        }
    });

    csocket.emit(EVENTS.GAME.DATA, Date.now(), {ready: "ready"});

    document.querySelectorAll('#gameBoard td').forEach(cell => {
        cell.addEventListener('click', cellClicked);
    });

    document.querySelector("#restartButton").style.display = 'none';
    document.querySelector("#restartButton").addEventListener('click', restartGame);
    /**
     * Updates the game state based on the data received from the server.
     * @param {Object} state - The current state of the game from the server.
     */
    function updateGameState(state) {
        if (!state || typeof state !== 'object' || !state.board || !state.currentPlayer) {
            console.error("Invalid game state received:", state);
            return;
        }
        currentPlayer = state.currentPlayer;
        isGameOver = state.isGameOver;
        gameBoard = state.board;
        winner = state.winner;
        players = state.players;
        renderBoard(gameBoard);
        updateFightersDisplay();
    }
    /**
     * Handles the click event on a cell of the game board.
     */
    function cellClicked() {
        const row = this.parentNode.rowIndex;
        const col = this.cellIndex;
        handleMove(row, col);
    }
    /**
     * Handles a move made by a player.
     * @param {number} row - The row index of the move.
     * @param {number} col - The column index of the move.
     */
    function handleMove(row, col) {
        if (!isGameOver && gameBoard[row][col] === "") {
            csocket.emit(EVENTS.GAME.DATA, Date.now(), { row, col, username});
        }

    }
    /**
     * Renders the game board.
     * @param {string[][]} board - The current state of the game board.
     */
    function renderBoard(board) {
        updateBoardDisplay(board);
        updateGameStatusDisplay();
    }
    /**
     * Updates the display of the game board.
     * @param {string[][]} board - The current state of the game board.
     */
    function updateBoardDisplay(board) {
        const table = document.querySelector("#gameBoard");
        board.forEach((row, rowIndex) => {
            row.forEach((cell, colIndex) => {
                const tableCell = table.rows[rowIndex].cells[colIndex];
                tableCell.innerText = cell;
                tableCell.classList.remove("red-color", "blue-color");
                if (cell === "X") {
                    tableCell.classList.add("red-color");
                } else if (cell === "O") {
                    tableCell.classList.add("blue-color");
                }
            });
        });
    }
    function updateTurnMessage() {
        const statusElement = document.querySelector("#gameStatus");
        const restartButton = document.querySelector("#restartButton");
        let message;
        if (players) {
            if (players[currentPlayer] === username) {
                message = "C'est votre tour";
            } else {
                message = "Au tour de l'adversaire";
            }
            statusElement.innerHTML = `${message} <span class='${currentPlayer === 'X' ? 'red-color' : 'blue-color'}'>(${currentPlayer})</span>`;
        } else {
            statusElement.innerHTML = `Tour de <span class='${currentPlayer === 'X' ? 'red-color' : 'blue-color'}'>${currentPlayer}</span>`;
        }
        restartButton.style.display = 'none';
    }
    /**
     * Updates the game status display, including current player and game over messages.
     */
    function updateGameStatusDisplay() {
        const statusElement = document.querySelector("#gameStatus");
        const restartButton = document.querySelector("#restartButton");
        let message;

        if (isGameOver) {
            let message = "Match nul!";
            if (gameBoard.flat().every(cell => cell !== "") && winner == 'D') {
                resetFightersDisplay();
            } else {
                const playerClass = currentPlayer === 'X' ? 'red-color' : 'blue-color';
                message = `<span class='${playerClass}'>${currentPlayer}</span> a gagné !`;
                if (players[currentPlayer] === username ) {
                    showVictoryAnimation(true);
                } else {
                    showVictoryAnimation(false);
                }
            }
            statusElement.innerHTML = message;
            restartButton.style.display = 'block';
        } else {
            updateTurnMessage();
        }
    }

    function resetFightersDisplay() {
        const zombie = document.querySelector("#fighterX");
        const ghost = document.querySelector("#fighterO");
        zombie.classList.remove("zombieFast", "zombie");
        ghost.classList.remove("ghostFast", "ghost");
    }

    function updateFightersDisplay() {
        const zombie = document.querySelector("#fighterX");
        const ghost = document.querySelector("#fighterO");
        zombie.classList.toggle("zombie", currentPlayer === "X");
        ghost.classList.toggle("ghost", currentPlayer === "O");
    }

    function showVictoryAnimation(victory) {
        try {
            let pumpkinSize = 100;
            let windowHeight = window.innerHeight;
            let windowWidth = window.innerWidth;

            let centerY = (windowHeight / 2) - (pumpkinSize / 2);
            let centerX = (windowWidth / 2) - (pumpkinSize / 2);

            for (let i = 0; i < 10; i++) {
                (function (i) {
                    let pumpkin = document.querySelector("#victoryPumpkin" + i);
                    if (!victory) {
                        pumpkin.textContent = "❄️";
                    }
                    let randomOffsetY = (Math.random() - 0.5) * (windowHeight - pumpkinSize);
                    let randomOffsetX = (Math.random() - 0.5) * (windowWidth - pumpkinSize);

                    pumpkin.style.top = (centerY + randomOffsetY) + "px";
                    pumpkin.style.left = (centerX + randomOffsetX) + "px";
                    pumpkin.style.display = "block";
                    pumpkin.style.fontSize = pumpkinSize + "px";
                    pumpkin.classList.add("rotateAndFadeOut");
                    setTimeout((function (pumpkin) {
                        return function () {
                            pumpkin.style.display = "none";
                            pumpkin.classList.remove("rotateAndFadeOut");
                            let zombie = document.querySelector("#fighterX");
                            let ghost = document.querySelector("#fighterO");
                            zombie.classList.remove("zombieFast");
                            ghost.classList.remove("ghostFast");
                        }
                    })(pumpkin), 5000);
                })(i);
            }
        } catch (error) {
            console.error("Error displaying victory animation:", error);
        }
    }

    function switchPlayer() {
        currentPlayer = currentPlayer === "X" ? "O" : "X";
        updateFightersDisplay();
    }

    function restartGame() {
        csocket.emit(EVENTS.GAME.DATA, Date.now(), { "restartKey": "restart"});
        this.style.display = 'none';
        let zombie = document.querySelector("#fighterX");
        let ghost = document.querySelector("#fighterO");
        zombie.classList.remove("zombieFast");
        ghost.classList.remove("ghostFast");
        ghost.classList.remove("ghost");
    }
}

/**
 * Dynamic import of the events module and initialization of the game.
 */
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
