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
     * Handles the event when a cell is clicked.
     *
     * @function cellClicked
     * @memberof window
     *
     * @returns {undefined} This function does not return any value.
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

    /**
     * Updates the turn message displayed in the game status element.
     *
     * @return {void} This method does not return anything.
     */
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
            statusElement.innerHTML = `${message} <span class='${currentPlayer === 'X' ? 'red-color' : 'blue-color'}'>${currentPlayer}</span>`;
        } else {
            statusElement.innerHTML = `Tour de <span class='${currentPlayer === 'X' ? 'red-color' : 'blue-color'}'>${currentPlayer}</span>`;
        }
        restartButton.style.display = 'none';
    }


    /**
     * Updates the game status display based on the current game state.
     * If the game is over, it displays the winner or a tie message.
     * If the game is not over, it updates the turn message.
     *
     * @return {void}
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


    /**
     * Resets the display of fighters on the page.
     * Removes the "X" class from the element with id "playerX" and
     * removes the "O" class from the element with id "playerO".
     * The classes "X" and "O" are used for visual styling purposes to represent the fighters.
     *
     * @return {void}
     */
    function resetFightersDisplay() {
        const playerX = document.querySelector("#playerX");
        const playerO = document.querySelector("#playerO");
        playerX.classList.remove("playerX");
        playerO.classList.remove("playerO");
    }


    /**
     * Updates the display of the fighters based on the current player's username.
     * Adds the appropriate class to the player's fighter element and removes the class from the other player's fighter element.
     *
     * @return {void}
     */
    function updateFightersDisplay() {
        const playerX = document.querySelector("#playerX");
        const playerO = document.querySelector("#playerO");

        if (players) {
            if (players["X"] === username) {
                playerX.classList.add("playerX");
                playerO.classList.remove("playerO");
            } else if (players["O"] === username) {
                playerO.classList.add("playerO");
                playerX.classList.remove("playerX");
            }
        }
    }


    /**
     * Displays a victory animation on the screen.
     *
     * @param {boolean} victory - Determines whether it is a victory animation or a defeat animation. If true, displays the victory animation. If false, displays the defeat animation.
     */
    function showVictoryAnimation(victory) {
        try {
            let victorySize = 100;
            let windowHeight = window.innerHeight;
            let windowWidth = window.innerWidth;

            let centerY = (windowHeight / 2) - (victorySize / 2);
            let centerX = (windowWidth / 2) - (victorySize / 2);

            const game_div = document.querySelector(".morpion_game_div");

            for (let i = 0; i < 10; i++) {
                (function (i) {

                    //create 10 victory or defeat icons, and display them in random positions on the screen
                    let victory_icon = document.createElement("div");
                    victory_icon.classList.add("victory-icon");
                    game_div.appendChild(victory_icon); 
                    if (victory) {
                        victory_icon.textContent = "🎉";
                    }
                    else{
                        victory_icon.textContent = "❄️";
                    }
                    let randomOffsetY = (Math.random() - 0.5) * (windowHeight - victorySize);
                    let randomOffsetX = (Math.random() - 0.5) * (windowWidth - victorySize);

                    victory_icon.style.top = (centerY + randomOffsetY) + "px";
                    victory_icon.style.left = (centerX + randomOffsetX) + "px";
                    victory_icon.style.display = "block";
                    victory_icon.style.fontSize = "50px";
                    victory_icon.classList.add("rotateAndFadeOut");
                    setTimeout((function (victory_icon) {
                        return function () {
                            victory_icon.style.display = "none";
                            victory_icon.classList.remove("rotateAndFadeOut");
                        }
                    })(victory_icon), 5000);
                })(i);
            }
        } catch (error) {
            console.error("Error displaying victory animation:", error);
        }
    }


    /**
     * Switches the current player between "X" and "O".
     * Updates the fighters' display accordingly.
     *
     * @return {void}
     */
    function switchPlayer() {
        currentPlayer = currentPlayer === "X" ? "O" : "X";
        updateFightersDisplay();
    }

    /**
     * Restarts the game by emitting a restart event to the server and updating the UI.
     *
     * @return {void}
     */
    function restartGame() {
        csocket.emit(EVENTS.GAME.DATA, Date.now(), { "restartKey": "restart"});
        this.style.display = 'none';
        let playerO = document.querySelector("#playerO");
        playerO.classList.remove("playerO");
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
