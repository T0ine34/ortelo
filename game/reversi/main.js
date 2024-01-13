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
