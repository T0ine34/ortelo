/**
 * @fileoverview The main file for the cmd module.
 * @description This file is only used on the server side;
 */

const { EVENTS, Room } = require("../events/main.js");
const { User } = require("../user/main.js");

/**
 * @description Parse a command and execute it.
 * @param {string} str the command to parse
 * @param {User} user the user that sent the command
 * @param {io} io the socket.io server( used for broadcasting )
 * @param {Map} rooms the map of room names to room objects
 * @returns {boolean} true if we parsed a command (even if it's an invalid one), false otherwise
 * @see {@link ServerSocket.CIO}
 * @see {@link ServerSocket.Room}
 * @see {@link Server.User}
 * @memberof Server
 */
function parseCMD(str, user, io, rooms){ //rooms is a map of room names to room objects
    //return true if we parsed a command (even if it's an invalid one), false otherwise
    if(str.startsWith("/")){ //it's a command
        let tokens = str.substring(1).split(" ");
        switch(tokens[0]){
            case "help":
                if(tokens.length == 1){
                    user.emit(EVENTS.SYSTEM.INFO, Date.now(), "Available commands : /help, /room");
                    return true;
                }
                else{
                    switch(tokens[1]){
                        case "room":
                            user.emit(EVENTS.SYSTEM.INFO, Date.now(), "Usage: /room {join | leave | create | delete | set_visible | info | list} [room_name] [username | boolean]");
                            return true;
                        default:
                            user.emit(EVENTS.SYSTEM.ERROR, Date.now(), "Unknown command /help "+tokens[1]);
                            return true;
                    }
                }
            case "room":
                if(tokens.length == 1){
                    user.emit(EVENTS.SYSTEM.ERROR, Date.now(), "Usage: /room {join | leave | create | delete | set_visible | info | list} [room_name] [username | boolean]");
                    return true;
                }
                else{
                    switch(tokens[1]){
                        case "join":
                            if(tokens.length == 3){
                                if(rooms.has(tokens[2])){
                                    if(rooms.get(tokens[2]).can_join(user)){
                                        user.joinRoom(rooms.get(tokens[2]));
                                        user.emit(EVENTS.SYSTEM.INFO, Date.now(), "You joined the room "+tokens[2]);
                                        return true;
                                    }
                                    else{
                                        user.emit(EVENTS.SYSTEM.ERROR, Date.now(), "You can't join the room "+tokens[2]);
                                        return true;
                                    }
                                }
                                else{
                                    user.emit(EVENTS.SYSTEM.ERROR, Date.now(), "Unknown room "+tokens[2]);
                                    return true;
                                }
                            }
                            else{
                                user.emit(EVENTS.SYSTEM.ERROR, Date.now(), "Usage: /room join [room_name]");
                                return true;
                            }
                        case "leave":
                            if(tokens.length == 3){
                                if(rooms.has(tokens[2])){
                                    if(!rooms.get(tokens[2]).isIn(user.socket)){
                                        user.emit(EVENTS.SYSTEM.ERROR, Date.now(), "You are not in the room "+tokens[2]);
                                        return true;
                                    }
                                    rooms.get(tokens[2]).removeUser(user.socket);
                                    user.emit(EVENTS.SYSTEM.INFO, Date.now(), "You left the room "+tokens[2]);
                                    return true;
                                }
                                else{
                                    user.emit(EVENTS.SYSTEM.ERROR, Date.now(), "Unknown room "+tokens[2]);
                                    return true;
                                }
                            }
                            else{
                                user.emit(EVENTS.SYSTEM.ERROR, Date.now(), "Usage: /room leave [room_name]");
                                return true;
                            }
                        case "create":
                            if(tokens.length == 3){
                                if(rooms.has(tokens[2])){
                                    user.emit(EVENTS.SYSTEM.ERROR, Date.now(), "Room "+tokens[2]+" already exists");
                                    return true;
                                }
                                else{
                                    rooms.set(tokens[2], new Room(tokens[2]));
                                    user.emit(EVENTS.SYSTEM.INFO, Date.now(), "Room "+tokens[2]+" created");
                                    return true;
                                }
                            }
                            else{
                                user.emit(EVENTS.SYSTEM.ERROR, Date.now(), "Usage: /room create [room_name]");
                                return true;
                            }
                        case "delete":
                            if(tokens.length == 3){
                                if(rooms.has(tokens[2])){
                                    rooms.delete(tokens[2]);
                                    user.emit(EVENTS.SYSTEM.INFO, Date.now(), "Room "+tokens[2]+" deleted");
                                    return true;
                                }
                                else{
                                    user.emit(EVENTS.SYSTEM.ERROR, Date.now(), "Unknown room "+tokens[2]);
                                    return true;
                                }
                            }
                            else{
                                user.emit(EVENTS.SYSTEM.ERROR, Date.now(), "Usage: /room delete [room_name]");
                                return true;
                            }
                        case "set_visible":
                            if(tokens.length == 4){
                                if(rooms.has(tokens[2])){
                                    if(tokens[3] == "true"){
                                        rooms.get(tokens[2]).visible = true;
                                        user.emit(EVENTS.SYSTEM.INFO, Date.now(), "Room "+tokens[2]+" is now visible");
                                        return true;
                                    }
                                    else if(tokens[3] == "false"){
                                        rooms.get(tokens[2]).visible = false;
                                        user.emit(EVENTS.SYSTEM.INFO, Date.now(), "Room "+tokens[2]+" is now invisible");
                                        return true;
                                    }
                                    else{
                                        user.emit(EVENTS.SYSTEM.ERROR, Date.now(), "Unknown boolean "+tokens[3]);
                                        return true;
                                    }
                                }
                                else{
                                    user.emit(EVENTS.SYSTEM.ERROR, Date.now(), "Unknown room "+tokens[2]);
                                    return true;
                                }
                            }
                            else{
                                user.emit(EVENTS.SYSTEM.ERROR, Date.now(), "Usage: /room set_visible [room_name] [true | false]");
                                return true;
                            }
                        case "info":
                            if(tokens.length == 3){
                                if(rooms.has(tokens[2])){
                                    user.emit(EVENTS.SYSTEM.INFO, Date.now(), rooms.get(tokens[2]).toString());
                                    return true;
                                }
                                else{
                                    user.emit(EVENTS.SYSTEM.ERROR, Date.now(), "Unknown room "+tokens[2]);
                                    return true;
                                }
                            }
                            else{
                                user.emit(EVENTS.SYSTEM.ERROR, Date.now(), "Usage: /room info [room_name]");
                                return true;
                            }
                        case "list":
                            if(tokens.length == 3){
                                if(tokens[2] == "all"){
                                    let str = "";
                                    for(let room of rooms.values()){
                                        str += room.name+"\n";
                                    }
                                    user.emit(EVENTS.SYSTEM.INFO, Date.now(), str);
                                    return true;
                                }
                                else if(tokens[2] == "mines"){
                                    //only show rooms where I am in
                                    let str = "";
                                    for(let room of rooms.values()){
                                        if(room.isIn(user.socket)){
                                            str += room.name+"\n";
                                        }
                                    }
                                    user.emit(EVENTS.SYSTEM.INFO,  Date.now(), str);
                                    return true;
                                }
                                else{
                                    user.emit(EVENTS.SYSTEM.ERROR, Date.now(), "Unknown room list "+tokens[2]);
                                    return true;
                                }
                            }
                            else{
                                user.emit(EVENTS.SYSTEM.ERROR, Date.now(), "Usage: /room list [all | mines]");
                                return true;
                            }
                            return true;
                        default:
                            user.emit(EVENTS.SYSTEM.ERROR, Date.now(), "Unknown command /room "+tokens[1]);
                            return true;
                    }
                }
            default:
                user.emit(EVENTS.SYSTEM.ERROR, Date.now(), "Unknown command "+tokens[0]);
                return true;
        }
    }
    return false;
}

module.exports = { parseCMD };