// -------------------------------------------------------------------- INITIALIZATION OF SETTINGS

const { Settings }                                                = require('./server_modules/settings/main');
var settings = new Settings("./server.config");

// -------------------------------------------------------------------- REQUIRED MODULES

const fs                                                          = require('fs');
const { TextDecoder }                                             = require('util');
const http                                                        = require('http');
const express                                                     = require('express');
const { Logger }                                                  = require('./server_modules/logs/main');
const { database }                                                = require('./server_modules/database/main');
const { parseCMD }                                                = require('./server_modules/cmd/main');
const { EVENTS, Room, CIO }                                       = require('./server_modules/events/main');
const { GameLoader }                                              = require('./server_modules/loader/main');
const { get_404_url, is_special_url, get_special_url, build_url, getPlatform, is_common_ressource } = require('./server_modules/redirection/main');
const e = require('express');
const { URLGenerator }                                               = require('./server_modules/url_generator/main');
const path = require('path');
const { log } = require('console');
const bodyParser = require('body-parser');
const vm = require('vm');
const mailer = require('@emailjs/browser');
const rateLimit = require("express-rate-limit");

let logger = new Logger();

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

logger.debug("Using Body-Parser Json");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

mailer.init("Oy9a9uSnZvDAnliA0");


// -------------------------------------------------------------------- SERVER CONFIGURATION


/**
 * Start a new game with the given game name and username.
 * @param {string} gameName - Name of the game.
 * @param {string} username - Name of the user initiating the game.
 * @returns {JSON} - JSON object with room URL and a message.
 */
app.get('/game-start/:gameName/:username', async (req, res) => {
    const gameName = req.params.gameName.toLowerCase();
    const username = req.params.username;
    if (!gameName || typeof gameName !== 'string' || !username || typeof username !== 'string') {
        return res.status(400).json({message: 'Invalid input.'});
    }
    try {
        const user = users.get(username);
        if (!user) {
            return res.status(404).json({message: `${username} does not exist.`});
        }

        let room = new Room(gameName, username);

        room.addUser(user);
        user.leave(rooms.get(general));
        msg = `${username} à rejoint le chat du jeu.`;
        room.emit(EVENTS.CHAT.SERVER_MESSAGE, Date.now(), msg);
        room.on(EVENTS.CHAT.MESSAGE, (timestamp, username, msg) => {
            room.transmit(EVENTS.CHAT.MESSAGE, Date.now(), username, msg);
        });
        let urlExist = true
        let roomUrl;
        while (urlExist) {
            roomUrl = URLGenerator.genURL('game', gameName);
            urlExist = await database.doGameURLExists(roomUrl)
        }

        gameRooms.set(roomUrl, room);

        res.json({roomUrl: roomUrl, message: `Game ${gameName} initiated. Waiting for second player.`});
        const creategame = await database.createGameRoom(gameName, username, roomUrl, 2);
        logger.info(`Creation of game ${gameName}, with url ${roomUrl} : ${creategame}`)
    } catch (error) {
        logger.info(`Internal server error : ${error.message}`)
        return res.status(500).json({ message: 'Internal server error.', error: error.message });
    }
});

/**
 * Wait for players to fill the game room.
 * @param {string} roomUrl - URL of the game room.
 * @returns {JSON} - JSON object with a message about the room's status.
 */
app.get('/game-wait/game/:roomUrl', async (req, res) => {

    let roomUrl = req.params.roomUrl;
    if (!roomUrl || typeof roomUrl !== 'string') {
        return res.status(400).json({ message : 'Invalid URL.' });
    }
    try {
        let room = gameRooms.get("game/"+roomUrl);

        if (!room) {
            return res.status(404).json({message : `The room ${roomUrl} does not exist.`});
        } else if (room.users.size < 2) {
            return res.status(200).json({message : `Waiting for players to fill the room.`});
        }
        if (room.run) {
            return res.json({ message: `Game ${room.name} already running successfully.` });
        }
        const game = gameLoader.gamesData[room.name];
        const serverScriptContent = new TextDecoder('utf-8').decode(new Uint8Array(game.serverData));
        const sandbox = {
            require: require,
            console: console,
            process: process,
            Buffer: Buffer,
            __dirname: __dirname,
            __filename: __filename,
            room,
        };
        const script = new vm.Script(serverScriptContent);
        script.runInNewContext(sandbox);
        if (typeof sandbox[room.name] === 'function') {
            sandbox[room.name](room);
            room.run= true;
            res.json({ message: `Game ${room.name} started successfully.` });
        } else {
            logger.error('Starter function not found in server script.')
            res.status(500)
        }
    } catch (error) {
        logger.info(`Internal server error : ${error.message}`)
        return res.status(500).json({message: 'Internal server error.', error: error.message});
    }
});

/**
 * Join a game room.
 * @param {string} roomUrl - URL of the game room.
 * @param {string} username - Username of the player joining.
 * @returns {JSON} - JSON object with a success message.
 */
app.get('/gameUrl/:roomUrl/:username', (req, res) => {
    const roomUrl = 'game/'+req.params.roomUrl;
    const username = req.params.username;
    if (!roomUrl || typeof roomUrl !== 'string' || !username || typeof username !== 'string') {
        return res.status(400).json({ message : 'Invalid input.' });
    }
    try {
        const user = users.get(username);

        if (!user) {
            return res.status(404).json({ message : `User ${username} does not exist.` });
        }

        let room = gameRooms.get(roomUrl);

        if (!room) {
            return res.status(404).json({ message : `The room ${roomUrl} does not exist.` });
        }

        const usersArray = Array.from(room.users.values());
        const usernameExists = usersArray.some(user => user.username === username);
        if (usernameExists) {
            const lastuser = usersArray.find(user => user.username === username);
            room.removeUser(lastuser);

            room.addUser(user);
            user.leave(rooms.get(general));

            msg = `${username} is back in the game chat.`;
            room.emit(EVENTS.CHAT.SERVER_MESSAGE, Date.now(), msg);
            res.json({message : `${username} joined game room ${roomUrl} successfully`});
        } else {
            if (room.users && room.users.size >= 2) {
                return res.status(403).json({ message : `The room ${roomUrl} is full.` });
            }
            room.transmit(EVENTS.GAME.START, Date.now())
            room.addUser(user);
            user.leave(rooms.get(general));
            msg = `${username} à rejoint le chat du jeu.`;
            room.emit(EVENTS.CHAT.SERVER_MESSAGE, Date.now(), msg);
            res.json({message : `${username} joined game room ${roomUrl} successfully`});
        }
    } catch (error) {
        logger.info(`Internal server error : ${error.message}`)
        return res.status(500).json({ message: 'Internal server error.', error: error.message });
    }
});

/**
 * Get information about games.
 * @param {string[]} [fields] - Optional. Specific fields to retrieve.
 * @returns {JSON} - JSON array of game information.
 */
app.get('/games-info', (req, res) => {
    try {
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
    } catch (error) {
        logger.info(`Internal server error : ${error.message}`)
        return res.status(500).json({ message: 'Internal server error.', error: error.message });
    }
});



/**
 *
 * @param {Game} game
 * @param {string} fields
 * @returns The information about the game
 */
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
 * @param {string} url - URL identifier for the game.
 * @returns {HTML} - HTML content for the game.
 */
app.get('/game/:url', (req, res) => {
    if (!req.params.url || typeof req.params.url !== 'string') {
        return res.status(400).json({ message : 'Invalid URL.' });
    }
    try {
        const filePath = path.join(__dirname, "server_modules", "redirection", "gameRedirect.js");

        const roomUrl = 'game/'+req.params.url;
        let room = gameRooms.get(roomUrl);
        if (!room) {
            return res.status(404).json({ message : `The room ${roomUrl} does not exist.` });
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
    } catch (error) {
        logger.info(`Internal server error : ${error.message}`)
        return res.status(500).json({ message: 'Internal server error.', error: error.message });
    }
});


/**
 * Retrieves the oidc js file
 */
app.get('/oidc', (req, res) => {
    return res.send(fs.readFileSync(path.join(__dirname, "node_modules", "oidc-client", "dist", "oidc-client.js"), 'utf8'));
});

app.get('/emailjs', (req, res) => {
    return res.send(fs.readFileSync(path.join(__dirname, "node_modules", "@emailjs", "browser", "dist", "email.js"), 'utf8'));
});


/**
 * Object representing the login attempts.
 * @typedef {Object} LoginAttempts
 * @property {number} total - Total number of login attempts.
 * @property {number} successful - Number of successful login attempts.
 * @property {number} failed - Number of failed login attempts.
 */

let loginAttempts = {};
const limiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 5,
    message: function(req, res, next) {
        const resetTime = req.rateLimit.resetTime;
        const secondsRemaining = resetTime ? Math.ceil((resetTime - new Date().getTime()) / 1000) : 60;
        return `erreur:${secondsRemaining}`;
    },
});


/**
 * Gets the playerId from an IdP user.
 * @param {String} username The player's username
 * @returns {String} The playerId
 */
app.get('/getId/:username', limiter, async (req, res) => {
    const id = await database.getPlayerIdentifier(req.params.username);
    return res.send({identifier: id});
});


/**
 * Tries to log in the user with the given username and password
 * @param {String} username The player's username
 * @param {String} password The user's password
 * @returns {boolean} True if the user is logged in
 */
app.post('/login', limiter, async (req, res) => {
    const logged = await database.login(req.body.username, req.body.password);
    logger.info(`Logging player ${req.body.username} : ${logged}`);
    return res.send(logged);
});


/**
 * Tries to register the user with the given username and password
 * @param {String} username The player's username
 * @param {String} password The user's password
 * @param {String} email The user's email
 * @returns {boolean} True if the user is logged in
 */
app.post('/register', async (req, res) => {
    const email_url = URLGenerator.genURL('confirm-register', req.body.username);
    const response = await database.createPlayer(req.body.username, req.body.password, req.body.email, email_url.replace('confirm-register/', ''), req.body.hasIdp == true ? req.body.hasIdp : false);
    const created = response.created;
    if(created) {
        logger.info(`Player ${req.body.username} created successfully`);
    } else {
        logger.warning(`Cannot create player ${req.body.username}; reason: ${response.reason}`);
    }

    const host = req.get('host');
    const protocol = req.protocol;
    const fullUrl = `${protocol}://${host}`;
    return res.send({ created: created, email_url: email_url, host_url: fullUrl });
});


/**
 * Tries to confirm the registration of the user with the given username and url
 * @param {String} username The player's username
 * @param {String} url The url to confirm the registration
 * @returns {boolean} True if the registration is confirmed
 */
app.get('/confirm-register/:url', async (req, res) => {
    const randomUrl = req.params.url.replace('confirm-register/','');
    const username = randomUrl.split('-')[0];
    const isUrlValid = await database.isRegistrationUrlValid(username, randomUrl);
    if(isUrlValid) {
        const confirmed = await database.confirmRegistration(username);
        logger.info(`Confirming registration of player ${username} : ${confirmed}`);
        return res.redirect('/')
    } else return res.send(false);
});


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

cio.on(EVENTS.INTERNAL.CONNECTION, (user) => {
    user.once(EVENTS.MISC.PLAYERID, (timestamp, playerid) => {
        database.getUsername(playerid, (username) => {
            if(!username && username != "null"){
                logger.warning("A user tried to connect with an invalid playerid : " + playerid);
                return; //if the playerid is invalid, we don't want to continue
            }

            user.emit(EVENTS.MISC.USERNAME, Date.now(), username); //sending the username to the user

            user.username = username; //setting the username of the user
            users.set(username, user); //registering the user in the users map
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
                        if(room.isIn(user)){
                            room.transmit(EVENTS.CHAT.MESSAGE, Date.now(), username, msg); //broadcasting the new_message event to all the users, including the sender
                        }
                    }
                }
            });

            // here, the user is connected, and the server is ready to receive events from him
        });
    });

});

set_redirections();

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