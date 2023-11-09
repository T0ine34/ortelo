const express = require('express');
const app = express();
const http = require('http');
const { EVENTS, Room, CIO, CSocket } = require('./public/modules/events/main.js');
const { User } = require('./public/modules/user/main.js');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const cio = new CIO(io);
const { GameLoader } = require('./server_modules/loader/loader.js');
const { parseCMD } = require('./server_modules/cmd/main.js');

const gameLoader = new GameLoader();

app.use(express.static("public"));

app.get('/', (req, res) => {
    res.sendFile(__dirname + 'public/index.html');
});

let rooms = new Map();
rooms.set("general", new Room("general"));

loadGames()

cio.on(EVENTS.CONNECTION, (csocket) => {
    csocket.once(EVENTS.MISC.USERNAME, (timestamp, username) => {
        let user = new User(csocket, username);                                     //building the user object
        user.emit(EVENTS.SYSTEM.INFO, "You are now connected as " + username);   //sending a message to the user to inform him that he is connected
        rooms.get("general").emit(EVENTS.CHAT.USER_JOINED, username);               //broadcasting the newUser event to all the users of the general room, excepting the new one
        user.joinRoom(rooms.get("general"));                                        //adding the user to the general room

        user.on(EVENTS.DISCONNECT, (reason) => {
            for(let room of user.rooms.values()){
                room.emit(EVENTS.CHAT.USER_LEFT, ""); 
            }
        });

        user.on(EVENTS.CHAT.MESSAGE, (timestamp, username, msg) => { //catching the send_message event, triggered by the client when he sends a message
            if (!parseCMD(msg, user, cio, rooms)) {
                for(let room of user.rooms.values()){
                    if(room.isIn(user.socket)){
                        room.emit(EVENTS.CHAT.MESSAGE, username, msg); //broadcasting the new_message event to all the users, including the sender
                    }
                }
            }
        });
    });

});

async function loadGames() {
    gameLoader.getFiles()
    let game = await gameLoader.readAGame(gameLoader.gameFiles[1]);
    console.log(game);
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