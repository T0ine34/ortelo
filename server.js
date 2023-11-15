// -------------------------------------------------------------------- REQUIRED MODULES

const http                              = require('http');
const express                           = require('express');
const { Server }                        = require("socket.io");
const { parseCMD }                      = require('./server_modules/cmd/main.js');
const { User }                          = require('./server_modules/user/main.js');
const { EVENTS, Room, CIO, CSocket }    = require('./server_modules/events/main.js');
const { Settings }                      = require('./server_modules/settings/main.js');
const { GameLoader }                    = require('./server_modules/loader/loader.js');
const { is_json, is_json_matching }     = require('./server_modules/json_checker/main.js');

// -------------------------------------------------------------------- SERVER INITIALIZATION
const app = express();
const server = http.createServer(app);
const cio = CIO.from_server(server);

const config_filepath = "./config.json";
if(!is_json(config_filepath)){ throw new Error("config.json is not a valid json file"); }
if(!is_json_matching(config_filepath)){ throw new Error("config.json is not matching the structure"); }

var settings = new Settings(config_filepath); //from this line, there shouldn't be any hard-coded path in the code of any used module; all the paths should be in the config.json file

const gameLoader = new GameLoader();


// -------------------------------------------------------------------- SERVER CONFIGURATION

app.use(express.static(settings.get("public_dir")));

app.get('/events', (req, res) => {
    res.sendFile(__dirname +'/' + settings.get('paths.events'));
});

app.get('*', (req, res) => { //redirect every other request to 404 page
    res.sendFile(__dirname + '/' + settings.get('paths.404'));
});

let rooms = new Map();
for(let room of settings.get("default_rooms")){
    let r = new Room(room.name);
    r.visible = room.visible;
    r.use_whitelist = room.whitelist;
    for(let username of room.userlist){
        r.add_to_list(username);
    }
    rooms.set(room.name, r);
}
let general = settings.get("general_room_name");


loadGames();

// -------------------------------------------------------------------- SERVER FUNCTIONS

async function loadGames() {
    gameLoader.getFiles();
    let game = await gameLoader.readAGame(gameLoader.gameFiles[1]);
    console.log(game);
    // gameLoader.readAGame();
    //TODO GET ALL GAMES TO SHOW ON WEBPAGE
}

// -------------------------------------------------------------------- SERVER EVENTS

cio.on(EVENTS.INTERNAL.CONNECTION, (csocket) => {
    csocket.once(EVENTS.MISC.USERNAME, (timestamp, username) => {
        let user = new User(csocket, username);    //building the user object
        user.emit(EVENTS.SYSTEM.INFO, Date.now(), "You are now connected as " + username);   //sending a message to the user to inform him that he is connected
        rooms.get(general).emit(EVENTS.CHAT.USER_JOINED, Date.now(), username);               //broadcasting the newUser event to all the users of the general room, excepting the new one
        user.joinRoom(rooms.get(general));                                        //adding the user to the general room

        user.on(EVENTS.INTERNAL.DISCONNECT, (reason) => {
            for(let room of user.rooms.values()){
                room.emit(EVENTS.CHAT.USER_LEFT, Date.now(), ""); 
            }
        });

        user.on(EVENTS.CHAT.MESSAGE, (timestamp, username, msg) => { //catching the send_message event, triggered by the client when he sends a message
            if (!parseCMD(msg, user, cio, rooms)) {
                for(let room of user.rooms.values()){
                    if(room.isIn(user.socket)){
                        room.transmit(EVENTS.CHAT.MESSAGE, Date.now(), username, msg); //broadcasting the new_message event to all the users, including the sender
                    }
                }
            }
        });
        
    });

});

// -------------------------------------------------------------------- SERVER START

server.listen(settings.get("port"), () => {
    console.log('listening on *:'+server.address().port);
});