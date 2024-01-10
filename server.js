// -------------------------------------------------------------------- INITIALIZATION OF SETTINGS

const { Settings }                                                = require('./server_modules/settings/main');
var settings = new Settings("./server.config");

// -------------------------------------------------------------------- REQUIRED MODULES

const fs                                                          = require('fs');
const { TextDecoder }                                             = require('util');
const http                                                        = require('http');
const express                                                     = require('express');
const { logger }                                                  = require('./server_modules/logs/main');
const { database }                                                = require('./server_modules/database/main');
const { parseCMD }                                                = require('./server_modules/cmd/main');
const { User }                                                    = require('./server_modules/user/main');
const { EVENTS, Room, CIO }                                       = require('./server_modules/events/main');
const { GameLoader }                                              = require('./server_modules/loader/main');
const { get_404_url, is_special_url, get_special_url, build_url, getPlatform, is_common_ressource } = require('./server_modules/redirection/main');
const e = require('express');
const { GameRooms }                                               = require('./server_modules/gameRooms/main');
const path = require('path');
const { log } = require('console');

database.createPlayer("LilaOf", "agrou", "boo");

// -------------------------------------------------------------------- SERVER INITIALIZATION
logger.debug("intitializing express app");
const app = express();
logger.debug("intitializing http server")
const server = http.createServer(app);
logger.debug("intitializing CIO object using the http server")
const cio = CIO.from_server(server);

logger.debug("intitializing game loader");
const gameLoader = new GameLoader();

logger.debug("server initialized successfully");

// -------------------------------------------------------------------- SERVER CONFIGURATION

//app.use(express.static(settings.get("public_dir")));

/**
 * Start a new game with the given game name and username.
 * @name GET /game-start/:gameName/:username
 * @param {string} gameName - Name of the game.
 * @param {string} username - Name of the user initiating the game.
 * @returns {JSON} - JSON object with room URL and a message.
 */
app.get('/game-start/:gameName/:username', async (req, res) => {
    const gameName = req.params.gameName.toLowerCase();
    const username = req.params.username;

    const user = users.get(username);
    if (!user) {
        return res.status(404).json({ message : `${username} does not exist.` });
    }

    let room = new Room(gameName, username);

    room.addUser(user);
    user.socket.leave(rooms.get(general));
    msg = `${username} joined the game chat.`;
    room.emit(EVENTS.CHAT.MESSAGE, Date.now(), username, msg);

    let roomUrl = GameRooms.genURL(gameName);

    gameRooms.set(roomUrl, room);

    res.json({ roomUrl: roomUrl, message: `Game ${gameName} initiated. Waiting for second player.` });
});

/**
 * Wait for players to fill the game room.
 * @name GET /game-wait/game/:roomUrl
 * @param {string} roomUrl - URL of the game room.
 * @returns {JSON} - JSON object with a message about the room's status.
 */
app.get('/game-wait/game/:roomUrl', async (req, res) => {
    let roomUrl = req.params.roomUrl;
    let room = gameRooms.get("game/"+roomUrl);

    if (!room) {
        return res.status(404).json({message : `The room ${roomUrl} does not exist.`});
    } else if (room.users.size < 2) {
        return res.status(200).json({message : `Waiting for players to fill the room.`});
    }
    if (room.run) {
        return res.json({ message: `Game ${room.name} already running successfully.` });
    }
    function sleep(seconds) {
        return new Promise(resolve => setTimeout(resolve, seconds * 1000));
    }
    const game = gameLoader.gamesData[room.name];
    const serverScriptContent = new TextDecoder('utf-8').decode(new Uint8Array(game.serverData));
    eval(serverScriptContent);
    if (typeof global[room.name] === 'function') {
        global[room.name](room);
        room.run= true;
        res.json({ message: `Game ${room.name} started successfully.` });
    } else {
        throw new Error('Starter function not found in server script.');
    }
});

/**
 * Join a game room.
 * @name GET /gameUrl/:roomUrl/:username
 * @param {string} roomUrl - URL of the game room.
 * @param {string} username - Username of the player joining.
 * @returns {JSON} - JSON object with a success message.
 */
app.get('/gameUrl/:roomUrl/:username', (req, res) => {
    const roomUrl = 'game/'+req.params.roomUrl;
    const username = req.params.username;
    const user = users.get(username);

    if (!user) {
        return res.status(404).json({ message : `User ${username} does not exist.` });
    }

    let room = gameRooms.get(roomUrl);

    if (!room) {
        return res.status(404).json({ message : `The room ${roomUrl} does not exist.` });
    }

    if (room.users && room.users.size >= 2) {
        return res.status(403).json({ message : `The room ${roomUrl} is full.` });
    }
    let a = room.addUser(user);
    user.socket.leave(rooms.get(general));
    room.on(EVENTS.CHAT.MESSAGE, (timestamp, username, msg) => {
        room.users.forEach((user) => {
            user.transmit(EVENTS.CHAT.MESSAGE, Date.now(), username, msg);
        });
    });
    msg = `${username} joined the game chat.`;
    room.emit(EVENTS.CHAT.MESSAGE, Date.now(), username, msg);
    res.json({message : `${username} joined game room ${roomUrl} successfully`});

});

/**
 * Get information about games.
 * @name GET /games-info
 * @param {string[]} [fields] - Optional. Specific fields to retrieve.
 * @returns {JSON} - JSON array of game information.
 */
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

/**
 * Retrieve game-specific HTML content.
 * @name GET /game/:url
 * @param {string} url - URL identifier for the game.
 * @returns {HTML} - HTML content for the game.
 */
app.get('/game/:url', (req, res) => {
    const filePath = path.join(__dirname, "server_modules", "redirection", "gameRedirect.js");

    const roomUrl = 'game/'+req.params.url;
    let room = gameRooms.get(roomUrl);
    if (!room) {
        return res.status(404).json({ message : `The room ${roomUrl} does not exist.` });
    }
    if (room.users && room.users.size >= 2) {
        return res.status(403).json({ message : `The room ${roomUrl} is full.` });
    }

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error("Erreur lors de la lecture du fichier :", err);
            res.status(500).send('Erreur lors du chargement du script');
            return;
        }

        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Redirection de Jeu</title>
            </head>
            <body>
                <script>${data}</script>
            </body>
            </html>
        `);
    });
});


/**
 * Tries to log in the user with the given username and password
 * @param {String} username The player's username
 * @param {String} password The user's password
 * @return {boolean} True if the user is logged in
 */
app.get('/login/:username/:password', (req, res) => {

    database.login(req.params.username, req.params.password, (result) => {
        logger.info(`Logging player ${req.params.username} : ${result}`);
        if(result == true) res.send(true);
        else res.send(false);
    })

});

/**
 * Tries to register the user with the given username and password
 * @param {String} username The player's username
 * @param {String} password The user's password
 * @return {boolean} True if the user is logged in
 */
app.get('/register/:username/:password/:email', (req, res) => {

    database.createPlayer(req.params.username, req.params.password, req.params.email, (result) => {
        logger.info(`Creating player ${req.params.username} : ${result}`);
        if(result == true) res.send(true);
        else res.send(false);
    })

});




set_redirections();

// app.get('/*',(req, res) => {
//     let abs_url = __dirname + '/' + build_url(req.path, req);
//     res.sendFile(abs_url);
// });


let rooms = new Map();
let general = set_rooms(); //set default rooms, and get the main room name
let users = new Map();
let gameRooms = new Map(); // key: roomUrl, value: room

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
                    logger.debug("a special url was requested : " + req.path + " -> " + url);
                }
            });
        }
        else{
            let url;
            if(req.path.startsWith("/mobile")){
                let path = req.path.substring(7);
                if(is_common_ressource(path)){
                    url = settings.get("public_common_dir") + path;
                }
                else{
                    url = settings.get("public_mobile_dir") + path;
                }
            }
            else if(req.path.startsWith("/desktop")){
                let path = req.path.substring(8);
                if(is_common_ressource(path)){
                    url = settings.get("public_common_dir") + path;
                }
                else{
                    url = settings.get("public_desktop_dir") + path;
                }
            }
            else{
                url = build_url(req);
            }

            res.sendFile(__dirname+ '/' + url, (err) => {
                if(err){
                    res.status(404).sendFile(__dirname+ '/' + get_404_url(req.rawHeaders));
                }
                else{
                    logger.debug("a common url was requested : " + req.path + " -> " + url);
                }

            });
        }
    });
}

function set_rooms(){
    logger.info("setting up defaults rooms");
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
    logger.fine("Rooms set up successfully");
    logger.info(resume.substring(0, resume.length-1)); //removing the last \n
    let general = settings.get("main_room_name");
    logger.info("general room set to " + general);
    return general;
}

// -------------------------------------------------------------------- SERVER EVENTS

cio.on(EVENTS.INTERNAL.CONNECTION, (csocket) => {
    csocket.once(EVENTS.MISC.USERNAME, (timestamp, username) => {
        let user = new User(csocket, username);    //building the user object
        users.set(username, user);
        user.emit(EVENTS.SYSTEM.INFO, Date.now(), "Vous êtes connecté en tant que " + username);   //sending a message to the user to inform him that he is connected
        rooms.get(general).emit(EVENTS.CHAT.USER_JOIN, Date.now(), username);               //broadcasting the newUser event to all the users of the general room, excepting the new one
        user.joinRoom(rooms.get(general));        //adding the user to the general room
        rooms.get(general).emit(EVENTS.CHAT.USER_JOINED, Date.now(), username);             //broadcasting the newUser event to all the users of the general room, including the new one

        user.on(EVENTS.INTERNAL.DISCONNECTING, (reason) => {
            for(let room of user.rooms.values()){
                room.emit(EVENTS.CHAT.USER_LEAVE, Date.now(), user.username);
            }
        });

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

        // here, the user is connected, and the server is ready to receive events from him
    });

});

server.on("error", (error) => {
    logger.error(`Server crashed,  ${error.message}`);
});

server.on("close", () => {
    logger.fine("Server closing successfully");
});

// -------------------------------------------------------------------- SERVER START
loadGames().then(() => {
    server.listen(settings.get("port"), () => {
        console.log('http server opened, listening on *: ' + settings.get("port"));
        logger.info('http server opened, listening on *:'+server.address().port);
    });
});