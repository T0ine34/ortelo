//NOTE this file is only for testing purposes, it is not part of the project
//NOTE it's for testing the implementation of the csocket and room classes
//use /help in the chat to get the list of commands

const { EVENTS, Room, CIO, CSocket } = require('./public/modules/events/main.js');
const { parseCMD } = require('./public/modules/cmd/main.js');
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

let rooms = new Map();
rooms.set(room.name, room);


cio.on(EVENTS.CONNECTION, (csocket) => {
    csocket.join(room);
    csocket.emit(EVENTS.CHAT.MESSAGE, "server", "user added to room");
    csocket.on(EVENTS.DISCONNECT, (reason) => {                     //catching the disconnect event, triggered by the client when he leaves the chat
        cio.emit(EVENTS.CHAT.USER_LEFT, Date.now(), "");
    });

    csocket.on(EVENTS.CHAT.MESSAGE, (timestamp, username, msg) => {      //catching the send_message event, triggered by the client when he sends a message
        if(! parseCMD(msg, csocket, cio, rooms)){
            cio.emit(EVENTS.CHAT.MESSAGE, timestamp, username, msg)           //broadcasting the new_message event to all the users, including the sender
        }
    });
});

server.listen(3000, () => {
    console.log('listening on *:3000');
});