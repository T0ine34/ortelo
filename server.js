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

io.on('connection', (socket) => {                       //catching the connection of a new user
                                                        //socket is the link between this user and the server
    socket.on('newUser', (name) => {                    //catching the newUser event, triggered by the client when he click on "CHOISIR"
        io.emit("newUser", name);                       //broadcasting the newUser event to all the users, including the new one
    })


    socket.on('disconnect', () => {                     //catching the disconnect event, triggered by the client when he leaves the chat
                                                        //NOT IMPLEMENTED YET
    })

    socket.on('send_message', (username, msg) => {      //catching the send_message event, triggered by the client when he sends a message
        io.emit('new_message', username, msg)           //broadcasting the new_message event to all the users, including the sender
    })


});

server.listen(3000, () => {
    console.log('listening on *:3000');
});