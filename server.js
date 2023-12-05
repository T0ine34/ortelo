// -------------------------------------------------------------------- REQUIRED MODULES

const http                            = require('http');
const express= require('express');
const { Server } = require("socket.io");
const settings                          = require('./server_modules/settings/main.js');
const Logger                            = require('./server_modules/logs/logger');
const Database                          = require('./server_modules/database/database.js');
const { parseCMD }                      = require('./server_modules/cmd/main.js');
const { User }                          = require('./server_modules/user/main.js');
const { EVENTS, Room, CIO, CSocket }    = require('./server_modules/events/main.js');
const { GameLoader }                    = require('./server_modules/loader/loader.js');
const { is_json, is_json_matching }     = require('./server_modules/json_checker/main.js');
const fs = require('fs');

// -------------------------------------------------------------------- SERVER INITIALIZATION
Logger.debug("intitializing express app");
const app = express();
Logger.debug("intitializing http server")
const server = http.createServer(app);
Logger.debug("intitializing CIO object using the http server")
const cio = CIO.from_server(server);

Logger.debug("intitializing game loader");
const gameLoader = new GameLoader();

Logger.debug("server initialized successfully");

// -------------------------------------------------------------------- SERVER CONFIGURATION

app.use(express.static(settings.get("public_dir")));

app.get('/games-info', (req, res) => {
    const fields = req.query.x ? req.query.x.split(',') : null;
    const specificGameKey = Object.keys(req.query).find(key => key !== 'x' && gameLoader.gamesData[key]);
    const specificGameData = specificGameKey ? gameLoader.gamesData[specificGameKey] : null;

    let gameInfos = [];

    if (fields) {
        // Traitement pour tous les jeux
        gameInfos = Object.values(gameLoader.gamesData).map(game => getGameInfo(game, fields));
    } else if (specificGameData) {
        // Traitement pour un jeu spécifique
        gameInfos = [getGameInfo(specificGameData, Object.keys(req.query[specificGameKey].split(',')))];
    }

    res.json(gameInfos);
});

function getGameInfo(game, fields) {
    let info = {};
    fields.forEach(field => {
        if (field === 'icon' && game.iconData) {
            info[field] = `data:image/png;base64,${game.iconData.toString('base64')}`;
        } else if (field === 'name' && game.name) {
            info[field] = game.name;
        } else if (field === 'html' && game.htmlData) {
            info[field] = game.htmlData;
        } else if (field === 'css' && game.cssData) {
            info[field] = game.cssData;
        } else if (field === 'js' && game.jsData) {
            info[field] = game.jsData;
        }
    });
    return info;
}

set_redirections();


let rooms = new Map();
let general = set_rooms(); //set default rooms, and get the main room name

// -------------------------------------------------------------------- SERVER FUNCTIONS

async function loadGames() {
    await gameLoader.loadAllGames();
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
                        Logger.info("user " + req.ip + " requested " + req.path + " -> " + settings.get("paths." + path+".path") + req.path.substring(path.length+1));
                        res.sendFile(__dirname + '/' + settings.get("paths." + path+".path") + req.path.substring(path.length+1));
                    });
                    resume += "GET " + path + "/* -> " + settings.get("paths." + path+".path") + "*\n";
                }
                else{
                    app.get("/"+path, (req, res) => {
                        Logger.info("user " + req.ip + " requested " + req.path + " -> " + settings.get("paths." + path+".path"));
                        res.sendFile(__dirname + '/' + settings.get("paths." + path+".path"));
                    });
                    resume += "GET " + path + " -> " + settings.get("paths." + path+".path") + "\n";
                }
                break;
            case "POST":
                if(settings.has("paths." + path+".recursive") && settings.get("paths." + path+".recursive")){
                    //if the path is recursive, redirect all the subpaths to the same path
                    app.post("/"+path+"/*", (req, res) => {
                        Logger.info("user " + req.ip + " requested " + req.path + " -> " + settings.get("paths." + path+".path") + req.path.substring(path.length+1));
                        res.sendFile(__dirname + '/' + settings.get("paths." + path+".path") + req.path.substring(path.length+1));
                    });
                    resume += "POST " + path + "/* -> " + settings.get("paths." + path+".path") + "*\n";
                }
                else{
                    app.post("/"+path, (req, res) => {
                        Logger.info("user " + req.ip + " requested " + req.path + " -> " + settings.get("paths." + path+".path"));
                        res.sendFile(__dirname + '/' + settings.get("paths." + path+".path"));
                    });
                    resume += "POST " + path + " -> " + settings.get("paths." + path+".path") + "\n";
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
        resume += "* -> " + settings.get("default_path") + "\n";
    }
    else{
        Logger.warning("\tNo default path specified, a 404 error will be returned for every path except the explitly redirected ones");
    }
    Logger.fine("Redirections set up successfully");
    Logger.info(resume.substring(0, resume.length-1)); //removing the last \n
}

function set_rooms(){
    Logger.info("setting up defaults rooms");
    let resume = "default rooms :\n";

    for(let room of settings.get("default_rooms")){
        let r = new Room(room.name);
        r.visible = room.visible;
        r.use_whitelist = room.whitelist;
        for(let username of room.userlist){
            r.add_to_list(username);
        }
        rooms.set(room.name, r); 
        resume += "\t" + room.name + " : visible=" + room.visible + ", using_whitelist=" + room.whitelist + ", list_of_users=[" + room.userlist + "]\n";
    }
    Logger.fine("Rooms set up successfully");
    Logger.info(resume.substring(0, resume.length-1)); //removing the last \n
    let general = settings.get("main_room_name");
    Logger.info("general room set to " + general);
    return general;
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

server.on("error", (error) => {
    Logger.error(`Server crashed,  ${error.message}`);
});

server.on("close", () => {
    Logger.fine("Server closing successfully");
});

// -------------------------------------------------------------------- SERVER START
loadGames().then(() => {
    server.listen(settings.get("port"), () => {
        console.log('http server opened, listening on *: ' + settings.get("port"));
        Logger.info('http server opened, listening on *:'+server.address().port);
    });
});
