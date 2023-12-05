const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { Morpion, initializeMorpionSocket } = require('./morpion');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const game = new Morpion();

app.use(express.static('public'));

initializeMorpionSocket(io, game);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});