const express = require('express');
const app = express();
const http = require('http');
const { EVENTS, Room, CIO, CSocket } = require('./public/modules/events/main.js');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const cio = new CIO(io);
const { GameLoader } = require('./public/modules/loader/loader.js');
const { parseCMD } = require('./public/modules/cmd/main.js');

const gameLoader = new GameLoader();

app.use(express.static("public"));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

let rooms = new Map();
rooms.set("general", new Room("general"));
rooms.set("test", new Room("test"));
let prv = new Room("private");
prv.visible = false;
prv.use_whitelist = true;
rooms.set("private", prv);

cio.on(EVENTS.CONNECTION, (csocket) => {
    csocket.on(EVENTS.CHAT.USER_JOINED, (timestamp, username) => { //catching the user_joined event, triggered by the client when he click on "CHOISIR"
        cio.emit(EVENTS.CHAT.USER_JOINED, timestamp, username);     //broadcasting the user_joined event to all the users, including the new one
        if(username == "antoine"){
            rooms.get("private").add_to_whitelist(csocket);
            csocket.emit(EVENTS.CHAT.SYSTEM.INFO, "You are now in the whitelist of room private");
        }
    });

    csocket.on(EVENTS.DISCONNECT, (reason) => {                     //catching the disconnect event, triggered by the client when he leaves the chat
        cio.emit(EVENTS.CHAT.USER_LEFT, Date.now(), "");
    });

    csocket.on(EVENTS.CHAT.MESSAGE, (timestamp, username, msg) => { //catching the send_message event, triggered by the client when he sends a message
        if (!parseCMD(msg, csocket, cio, rooms)) {
            cio.emit(EVENTS.CHAT.MESSAGE, timestamp, username, msg); //broadcasting the new_message event to all the users, including the sender
        }
    });
});

function loadGames() {
    gameLoader.getFiles()
    //TODO GET ALL GAMES TO SHOW ON WEBPAGE
}


    //                                                     //socket is the link between this user and the server
    // socket.on('newUser', (name) => {                    //catching the newUser event, triggered by the client when he click on "CHOISIR"
    //     io.emit("newUser", name);                       //broadcasting the newUser event to all the users, including the new one
    // })


    // socket.on('disconnect', (reason) => {                     //catching the disconnect event, triggered by the client when he leaves the chat
    //     io.emit("new_message", "SERVER", "Un utilisateur a quitté le chat");
    //     io.emit("new_message", "SERVER", "Raison : " + reason);
    // })

    // socket.on('send_message', (username, msg) => {      //catching the send_message event, triggered by the client when he sends a message
    //     io.emit('new_message', username, msg)           //broadcasting the new_message event to all the users, including the sender
    // })


server.listen(3000, () => {
    console.log('listening on *:3000');
});