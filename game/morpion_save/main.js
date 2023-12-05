let board = [["", "", ""], ["", "", ""], ["", "", ""]];
let currentPlayer = "X";
let isGameOver = false;

function initializeBoard() {
    board = [["", "", ""], ["", "", ""], ["", "", ""]];
    currentPlayer = "X";
    isGameOver = false;
    renderBoard();
}

function renderBoard() {
    let table = document.getElementById("gameBoard");
    let statusElement = document.getElementById("gameStatus");

    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            table.rows[i].cells[j].innerText = board[i][j];
        }
    }
    let playerClass;
    if (isGameOver) {
        playerClass = (currentPlayer === "X") ? "red-color" : "blue-color";
        statusElement.innerHTML = "<span class='" + playerClass + "'>" + currentPlayer + "</span> a gagné !";
        let zombie = document.getElementById("fighterX");
        let ghost = document.getElementById("fighterO");
        zombie.classList.remove("zombie");
        ghost.classList.remove("ghost");
        if (currentPlayer === "X") {
            zombie.classList.add("zombieFast");
        } else {
            ghost.classList.add("ghostFast");
        }
        showVictoryAnimation();
    } else if (board.flat().every(cell => cell !== "")) {
        statusElement.textContent = "Match nul!";
        let zombie = document.getElementById("fighterX");
        let ghost = document.getElementById("fighterO");
        zombie.classList.remove("zombieFast");
        ghost.classList.remove("ghostFast");
        zombie.classList.remove("zombie");
        ghost.classList.remove("ghost");
    } else {
        playerClass = (currentPlayer === "X") ? "red-color" : "blue-color";
        statusElement.innerHTML = "Tour de <span class='" + playerClass + "'>" + currentPlayer + "</span>";
    }
}

function handleMove(row, col) {
    if (board[row][col] === "" && !isGameOver) {
        board[row][col] = currentPlayer;
        let cell = document.getElementById("gameBoard").rows[row].cells[col];
        if (currentPlayer === "X") {
            cell.classList.add("red-color");
        } else {
            cell.classList.add("blue-color");
        }
        animateMove(row, col);
        checkForWin();
        if (!isGameOver) {
            switchPlayer();
        }
        renderBoard();
    }
}

function checkForWin() {
    let winningCombinations = [
        // Rows
        [[0, 0], [0, 1], [0, 2]],
        [[1, 0], [1, 1], [1, 2]],
        [[2, 0], [2, 1], [2, 2]],
        // Columns
        [[0, 0], [1, 0], [2, 0]],
        [[0, 1], [1, 1], [2, 1]],
        [[0, 2], [1, 2], [2, 2]],
        // Diagonals
        [[0, 0], [1, 1], [2, 2]],
        [[0, 2], [1, 1], [2, 0]]
    ];

    for (let i = 0; i < winningCombinations.length; i++) {
        let [a, b, c] = winningCombinations[i];
        if (board[a[0]][a[1]] && board[a[0]][a[1]] === board[b[0]][b[1]] && board[a[0]][a[1]] === board[c[0]][c[1]]) {
            isGameOver = true;
            return;
        }
    }
}


initializeBoard();


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
function animateMove(row, col) {
    let cell = document.getElementById("gameBoard").rows[row].cells[col];
    cell.classList.add("pulse");
    setTimeout(function() {
        cell.classList.remove("pulse");
    }, 500);
}
function switchPlayer() {
    let zombie = document.getElementById("fighterX");
    let ghost = document.getElementById("fighterO");

    if (currentPlayer === "X") {
        currentPlayer = "O";
        zombie.classList.remove("zombie");
        ghost.classList.add("ghost");
    } else if (currentPlayer === "O") {
        currentPlayer = "X";
        ghost.classList.remove("ghost");
        zombie.classList.add("zombie");
    } else {
        zombie.classList.remove("zombie");
        ghost.classList.remove("ghost");
    }
}