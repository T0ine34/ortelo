function start() {
    const socket = io();
    let currentPlayer = "X";
    let isGameOver;
    let winner;
    let gameBoard = [["", "", ""], ["", "", ""], ["", "", ""]];

    socket.on('gameState', (state) => {
        updateGameState(state);
        updateFightersDisplay();
    });
    document.querySelectorAll('#gameBoard td').forEach(cell => {
        cell.addEventListener('click', cellClicked);
    });

    document.getElementById("restartButton").style.display = 'none';
    document.getElementById("restartButton").addEventListener('click', restartGame);

    function updateGameState(state) {
        currentPlayer = state.currentPlayer;
        isGameOver = state.isGameOver;
        gameBoard = state.board;
        winner = state.winner;
        renderBoard(gameBoard);
        updateFightersDisplay();
    }

    function cellClicked() {
        const row = this.parentNode.rowIndex;
        const col = this.cellIndex;
        handleMove(row, col);
    }

    function handleMove(row, col) {
        if (!isGameOver && gameBoard[row][col] === "") {
            socket.emit('move', { row, col });
        }
    }

    function renderBoard(board) {
        updateBoardDisplay(board);
        updateGameStatusDisplay();
    }

    function updateBoardDisplay(board) {
        const table = document.getElementById("gameBoard");
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

    function updateGameStatusDisplay() {
        const statusElement = document.getElementById("gameStatus");
        const restartButton = document.getElementById("restartButton");

        if (isGameOver) {
            let message = "Match nul!";
            if (gameBoard.flat().every(cell => cell !== "") && winner == 'D') {
                resetFightersDisplay();
            } else {
                const playerClass = currentPlayer === 'X' ? 'red-color' : 'blue-color';
                message = `<span class='${playerClass}'>${currentPlayer}</span> a gagné !`;
                showVictoryAnimation();
            }
            statusElement.innerHTML = message;
            restartButton.style.display = 'block';
        } else {
            statusElement.innerHTML = `Tour de <span class='${currentPlayer === 'X' ? 'red-color' : 'blue-color'}'>${currentPlayer}</span>`;
            restartButton.style.display = 'none';
        }
    }

    function resetFightersDisplay() {
        const zombie = document.getElementById("fighterX");
        const ghost = document.getElementById("fighterO");
        zombie.classList.remove("zombieFast", "zombie");
        ghost.classList.remove("ghostFast", "ghost");
    }

    function updateFightersDisplay() {
        const zombie = document.getElementById("fighterX");
        const ghost = document.getElementById("fighterO");
        zombie.classList.toggle("zombie", currentPlayer === "X");
        ghost.classList.toggle("ghost", currentPlayer === "O");
    }

    function showVictoryAnimation() {

        let pumpkinSize = 100;
        let windowHeight = window.innerHeight;
        let windowWidth = window.innerWidth;

        let centerY = (windowHeight / 2) - (pumpkinSize / 2);
        let centerX = (windowWidth / 2) - (pumpkinSize / 2);

        for (let i = 0; i < 10; i++) {
            (function(i) {
                let pumpkin = document.getElementById("victoryPumpkin" + i);

                let randomOffsetY = (Math.random() - 0.5) * (windowHeight - pumpkinSize);
                let randomOffsetX = (Math.random() - 0.5) * (windowWidth - pumpkinSize);

                pumpkin.style.top = (centerY + randomOffsetY) + "px";
                pumpkin.style.left = (centerX + randomOffsetX) + "px";
                pumpkin.style.display = "block";
                pumpkin.style.fontSize = pumpkinSize + "px";
                pumpkin.classList.add("rotateAndFadeOut");
                setTimeout((function(pumpkin) {
                    return function() {
                        pumpkin.style.display = "none";
                        pumpkin.classList.remove("rotateAndFadeOut");
                        let zombie = document.getElementById("fighterX");
                        let ghost = document.getElementById("fighterO");
                        zombie.classList.remove("zombieFast");
                        ghost.classList.remove("ghostFast");
                    }
                })(pumpkin), 5000);
            })(i);
        }
    }

    function switchPlayer() {
        currentPlayer = currentPlayer === "X" ? "O" : "X";
        updateFightersDisplay();
    }

    function restartGame() {
        socket.emit('restart');
        this.style.display = 'none';
        let zombie = document.getElementById("fighterX");
        let ghost = document.getElementById("fighterO");
        zombie.classList.remove("zombieFast");
        ghost.classList.remove("ghostFast");
        ghost.classList.remove("ghost");
    }
}
document.addEventListener('DOMContentLoaded', start);
