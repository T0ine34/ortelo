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

let users = []
io.on('connection', (socket) => {

    socket.on('login', (name) => {
        users.push(name)
        console.log(`${name} connected to the site`);
        socket.emit('getSelectedUsername', name)
    })


    socket.on('disconnect', () => {
        console.log('a user disconnected')
    })

    socket.on('send_message', (msg) => {
        io.emit('new_message', msg)
    })

    socket.on('send-username', function(username) {
        socket.username = username;
        users.push(socket.username);
        console.log(users);
    });


});

server.listen(3000, () => {
    console.log('listening on *:3000');
});