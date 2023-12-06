// -------------------------------------------------------------------- REQUIRED MODULES

const http                            = require('http');
const express= require('express');
const settings                          = require('./server_modules/settings/main.js');
const Logger                            = require('./server_modules/logs/logger');
const Database                          = require('./server_modules/database/database.js');
const { parseCMD }                      = require('./server_modules/cmd/main.js');
const { User }                          = require('./server_modules/user/main.js');
const { EVENTS, Room, CIO }             = require('./server_modules/events/main.js');
const { GameLoader }                    = require('./server_modules/loader/loader.js');
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

//app.use(express.static(settings.get("public_dir")));

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

function getPlatform(rawHeaders){
    let platform = "unknown";
    if(rawHeaders.includes('"Android"')){
        platform = "Android";
    }
    else if(rawHeaders.includes('"iPhone"')){
        platform = "iPhone";
    }
    else if(rawHeaders.includes('"iPad"')){
        platform = "iPad";
    }
    else if(rawHeaders.includes('"Windows"')){
        platform = "Windows";
    }
    else if(rawHeaders.includes('"Macintosh"')){
        platform = "Macintosh";
    }
    else if(rawHeaders.includes('"Linux"')){
        platform = "Linux";
    }
    return platform;
}

function is_mobile(rawHeaders){
    return getPlatform(rawHeaders) == "Android" || getPlatform(rawHeaders) == "iPhone" || getPlatform(rawHeaders) == "iPad";
}

function is_desktop(rawHeaders){
    return getPlatform(rawHeaders) == "Windows" || getPlatform(rawHeaders) == "Macintosh" || getPlatform(rawHeaders) == "Linux";
}

/**
 * @description Build the url to redirect to, depending on the device<br/>
 * the input url is like /home or /404, and the output url is like /mobile/home or /desktop/404
 * @param   {string} baseurl 
 * @param   {any} req
 * @returns {string} the url to redirect to
 */
function get_platform_folder(rawHeaders){
    if(is_mobile(rawHeaders)){
        return settings.get("public_mobile_dir");
    }
    else if(is_desktop(rawHeaders)){
        return settings.get("public_desktop_dir");
    }
    else{
        throw new Error("unknown platform" + getPlatform(rawHeaders));
    }
}

function is_common_ressource(url){
    let common_ressources = fs.readdirSync(settings.get("public_common_dir"));
    let foldername = url.split("/")[1];
    return common_ressources.includes(foldername);
}

function build_url(req){
    let url = req.path;
    if(is_common_ressource(url)){
        return settings.get("public_common_dir") + url;
    }
    else{
        return get_platform_folder(req.rawHeaders) + url;
    }
}

function is_special_url(url, method){
    return settings.has("paths." + method) && url in settings.get("paths." + method);
}

function get_special_url(url, method){
    return settings.get("paths." + method+'.'+url+'.path');
}

function get_404_url(rawHeaders){
    return get_platform_folder(rawHeaders) + '/' + settings.get("default_page");
}

function set_redirections(){
    app.get('*',(req, res) => { //catch all GET requests
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
