/**
 * @fileoverview This file is the main file of the server. It contains the server initialization, the server configuration and the server events.   
 */

/**
 * @namespace Server
 * @description This namespace contains all the classes and functions related to the server
 */

// -------------------------------------------------------------------- REQUIRED MODULES

const http                              = require('http');
const express                           = require('express');
const { Server }                        = require("socket.io");
settings                                = require('./server_modules/settings/main.js');
const Logger                            = require('./server_modules/logs/logger');
const { parseCMD }                      = require('./server_modules/cmd/main.js');
const { User }                          = require('./server_modules/user/main.js');
const { EVENTS, Room, CIO, CSocket }    = require('./server_modules/events/main.js');
const { GameLoader }                    = require('./server_modules/loader/loader.js');
const { is_json, is_json_matching }     = require('./server_modules/json_checker/main.js');

// -------------------------------------------------------------------- SERVER INITIALIZATION

const app = express();
const server = http.createServer(app);
const cio = CIO.from_server(server);

const gameLoader = new GameLoader();


// -------------------------------------------------------------------- SERVER CONFIGURATION

app.use(express.static(settings.get("public_dir")));

set_redirections();

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
let general = settings.get("main_room_name");

loadGames();

// -------------------------------------------------------------------- SERVER FUNCTIONS

async function loadGames() {
    gameLoader.getFiles();
    let game = await gameLoader.readAGame(gameLoader.gameFiles[1]);
    //console.log(game);
    // gameLoader.readAGame();
    //TODO GET ALL GAMES TO SHOW ON WEBPAGE
}

function set_redirections(){

    Logger.info("Setting up redirections");

    let resume = "redirected path :\n";

    let excluded_paths = [];
    for(let path in settings.get("paths")){
        excluded_paths.push("/"+path);
        switch(settings.get("paths." + path+".mode")){
            case "GET":
                if(settings.has("paths." + path+".recursive") && settings.get("paths." + path+".recursive")){
                    //if the path is recursive, redirect all the subpaths to the same path
                    app.get("/"+path+"/*", (req, res) => {
                        res.sendFile(__dirname + '/' + settings.get("paths." + path+".path") + req.path.substring(path.length+1));
                    });
                    resume += "\t\t\tGET " + path + "/* -> " + settings.get("paths." + path+".path") + "*\n";
                }
                else{
                    app.get("/"+path, (req, res) => {
                        res.sendFile(__dirname + '/' + settings.get("paths." + path+".path"));
                    });
                    resume += "\t\t\tGET " + path + " -> " + settings.get("paths." + path+".path") + "\n";
                }
                break;
            case "POST":
                if(settings.has("paths." + path+".recursive") && settings.get("paths." + path+".recursive")){
                    //if the path is recursive, redirect all the subpaths to the same path
                    app.post("/"+path+"/*", (req, res) => {
                        res.sendFile(__dirname + '/' + settings.get("paths." + path+".path") + req.path.substring(path.length+1));
                    });
                    resume += "\t\t\tPOST " + path + "/* -> " + settings.get("paths." + path+".path") + "*\n";
                }
                else{
                    app.post("/"+path, (req, res) => {
                        res.sendFile(__dirname + '/' + settings.get("paths." + path+".path"));
                    });
                    resume += "\t\t\tPOST " + path + " -> " + settings.get("paths." + path+".path") + "\n";
                }
                break;
            default:
                Logger.warning("\tunknown mode for path " + path + " : " + settings.get("paths." + path+".mode")+"; ignoring");
        }
    }

    if(settings.has("default_path")){
        //redirect everything except the excluded paths to the default path
        app.use('*', (req, res, next) => {
            if(excluded_paths.includes(req.path)){
                next();
            }
            else{
                res.status(404).sendFile(__dirname + '/' + settings.get("default_path"));
            }
        });
        resume += "\t\t\t* -> " + settings.get("default_path") + "\n";
    }
    else{
        Logger.warning("\tNo default path specified, a 404 error will be returned for every path except the explitly redirected ones");
    }
    Logger.fine(resume.substring(0, resume.length-1)); //removing the last \n
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

server.on("error", (error) => {
    Logger.error(`Server crashed,  ${error.message}`);
});

server.on("close", () => {
    Logger.fine("Server closing successfully");
});

server.listen(settings.get("port"), () => {
    Logger.info('http server opened, listening on *:'+server.address().port);
});

Logger.fine("Server started successfully");

