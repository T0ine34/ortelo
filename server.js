const express = require('express');
const app = express();
const http = require('http');
const { EVENTS, Room, CIO, CSocket } = require('./public/modules/events/main.js');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const cio = new CIO(io);
const { GameLoader } = require('./public/modules/loader/loader.js');

const gameLoader = new GameLoader();

app.use(express.static("public"));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

cio.on_event_broadcast(EVENTS.CHAT.MESSAGE);

loadGames()

cio.on(EVENTS.CONNECTION, (csocket) => {
    csocket.on(EVENTS.CHAT.USER_JOINED, (timestamp, username) => { //catching the user_joined event, triggered by the client when he click on "CHOISIR"
        cio.emit(EVENTS.CHAT.USER_JOINED, timestamp, username);     //broadcasting the user_joined event to all the users, including the new one
    });

    csocket.on(EVENTS.DISCONNECT, (reason) => {                     //catching the disconnect event, triggered by the client when he leaves the chat
        cio.emit(EVENTS.CHAT.USER_LEFT, Date.now(), "");
    });
});

async function loadGames() {
    await gameLoader.getFiles()
    console.log(gameLoader.gameFiles)
    // gameLoader.readAGame()
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