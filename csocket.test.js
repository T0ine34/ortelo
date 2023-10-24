//NOTE this file is only for testing purposes, it is not part of the project
//NOTE it's for testing the implementation of the csocket and room classes

const { EVENTS, Room, CIO, CSocket } = require('./public/modules/events/main.js');
const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const cio = new CIO(io);

app.use(express.static("public"));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

let room = new Room("testRoom");


cio.on(EVENTS.CONNECTION, (csocket) => {
    csocket.join(room);
    csocket.emit(EVENTS.CHAT.MESSAGE, "server", "user added to room");
    csocket.on(EVENTS.DISCONNECT, (reason) => {                     //catching the disconnect event, triggered by the client when he leaves the chat
        cio.emit(EVENTS.CHAT.USER_LEFT, Date.now(), "");
    });

    csocket.on(EVENTS.CHAT.MESSAGE, (timestamp, username, msg) => {      //catching the send_message event, triggered by the client when he sends a message
        if(msg == "kick"){
            csocket.leave(room);
            csocket.emit(EVENTS.CHAT.MESSAGE, "server", "you have been kicked from the room");
            console.log("user kicked");
        }
    });
});

server.listen(3000, () => {
    console.log('listening on *:3000');
});