// -------------------------------------------------------------------- REQUIRED MODULES


const fs = require('fs');
const { TextDecoder } = require('util');
const http                                                        = require('http');
const express                                                     = require('express');
const settings                                                    = require('./server_modules/settings/main.js');
const Logger                                                      = require('./server_modules/logs/logger');
const Database                                                    = require('./server_modules/database/database.js');
const socketIo = require('socket.io');
const { parseCMD }                                                = require('./server_modules/cmd/main.js');
const { User }                                                    = require('./server_modules/user/main.js');
const { EVENTS, Room, CIO }                                       = require('./server_modules/events/main.js');
const { GameLoader }                                              = require('./server_modules/loader/loader.js');
const { get_404_url, is_special_url, get_special_url, build_url, getPlatform } = require('./server_modules/redirection/main.js');
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

const io = socketIo(server);
// -------------------------------------------------------------------- SERVER CONFIGURATION

//app.use(express.static(settings.get("public_dir")));

app.get('/game-start/:gameName', async (req, res) => {
    const gameName = req.params.gameName.toLowerCase();
    try {
        const game = gameLoader.gamesData[gameName];
        if (!game) {
            throw new Error(`Game ${gameName} not found`);
        }
        if (game.starterFunction && game.serverData) {
            const serverScriptContent = new TextDecoder('utf-8').decode(new Uint8Array(game.serverData));

            eval(serverScriptContent);
            if (typeof global[game.starterFunction] === 'function') {
                global.initializeMorpionSocket(io);
                res.json({ message: `Game ${gameName} started successfully.` });
            } else {
                throw new Error('Starter function not found in server script.');
            }
        } else {
            throw new Error('Game data is incomplete.');
        }
    } catch (error) {
        console.log(error)
        Logger.error(`Error starting game ${gameName}: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
});
app.get('/games-info', (req, res) => {
    const gamesData = gameLoader.gamesData;
    const fields = req.query.x ? req.query.x.split(',') : null;
    const specificGameKey = Object.keys(req.query).find(key => key !== 'x' && gamesData[key]);
    const specificGameData = specificGameKey ? gamesData[specificGameKey] : null;

    let gameInfos = [];

    if (fields) {
        gameInfos = Object.values(gamesData).map(game => getGameInfo(game, fields));
    } else if (specificGameData) {
        const requestedFields = req.query[specificGameKey] ? req.query[specificGameKey].split(',') : [];
        return res.json(getGameInfo(specificGameData, requestedFields));
    } else if (specificGameKey) {
        return res.json({});
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

// app.get('/*',(req, res) => {
//     let abs_url = __dirname + '/' + build_url(req.path, req);
//     res.sendFile(abs_url);
// });


let rooms = new Map();
let general = set_rooms(); //set default rooms, and get the main room name

// -------------------------------------------------------------------- SERVER FUNCTIONS

async function loadGames() {
    await gameLoader.loadAllGames();
}

/**
 * @description sets all redirections of the server, incuding special urls
 * @see {@link is_special_url}
 * @see {@link get_special_url}
 * @see {@link build_url}
 * @see {@link get_404_url}
 */
function set_redirections(){
    app.get('*',(req, res) => { //catch all GET requests
        logger.debug("a "+getPlatform(req.rawHeaders)+" user requested " + req.path);
        if(is_special_url(req.path, "GET")){
            let url = get_special_url(req.path, "GET");
            res.sendFile(__dirname+ '/' + url, (err) => {
                if(err){
                    res.status(404).sendFile(__dirname+ '/' + get_404_url(req.rawHeaders));
                }else{
                    Logger.debug("a special url was requested : " + req.path + " -> " + url);
                }
            });
        }
        else{
            let url = build_url(req);

            res.sendFile(__dirname+ '/' + url, (err) => {
                if(err){
                    res.status(404).sendFile(__dirname+ '/' + get_404_url(req.rawHeaders));
                }
                else{
                    Logger.debug("a common url was requested : " + req.path + " -> " + url);
                }

            });
        }
    });
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
        user.emit(EVENTS.SYSTEM.INFO, Date.now(), "Vous êtes connecté en tant que " + username);   //sending a message to the user to inform him that he is connected
        rooms.get(general).emit(EVENTS.CHAT.USER_JOINED, Date.now(), username);               //broadcasting the newUser event to all the users of the general room, excepting the new one
        user.joinRoom(rooms.get(general));                                        //adding the user to the general room

        user.on(EVENTS.INTERNAL.DISCONNECT, (reason) => {
            for(let room of user.rooms.values()){
                room.emit(EVENTS.CHAT.USER_LEFT, Date.now(), user.username);
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
