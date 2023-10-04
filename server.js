const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

app.use(express.static("public"));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {

    socket.on('newUser', (name) => {
        io.emit("newUser", name);
    })


    socket.on('disconnect', () => {

    })

    socket.on('send_message', (username, msg) => {
        io.emit('new_message', username, msg)
    })


});

server.listen(3000, () => {
    console.log('listening on *:3000');
});