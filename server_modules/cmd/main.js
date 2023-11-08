const { EVENTS, Room } = require("../../public/modules/events/main.js");
const { User } = require("../../public/modules/user/main.js");

function parseCMD(str, user, io, rooms){ //rooms is a map of room names to room objects
    //return true if we parsed a command (even if it's an invalid one), false otherwise
    if(str.startsWith("/")){ //it's a command
        let tokens = str.substring(1).split(" ");
        switch(tokens[0]){
            case "help":
                if(tokens.length == 1){
                    user.emit(EVENTS.SYSTEM.INFO, "Available commands : /help, /room");
                    return true;
                }
                else{
                    switch(tokens[1]){
                        case "room":
                            user.emit(EVENTS.SYSTEM.INFO, "Usage: /room {join | leave | create | delete | set_visible | info | list} [room_name] [username | boolean]");
                            return true;
                        default:
                            user.emit(EVENTS.SYSTEM.ERROR, "Unknown command /help "+tokens[1]);
                            return true;
                    }
                }
            case "room":
                if(tokens.length == 1){
                    user.emit(EVENTS.SYSTEM.ERROR, "Usage: /room {join | leave | create | delete | set_visible | info | list} [room_name] [username | boolean]");
                    return true;
                }
                else{
                    switch(tokens[1]){
                        case "join":
                            if(tokens.length == 3){
                                if(rooms.has(tokens[2])){
                                    if(rooms.get(tokens[2]).can_join(user)){
                                        rooms.get(tokens[2]).join(user);
                                        user.emit(EVENTS.SYSTEM.INFO, "You joined the room "+tokens[2]);
                                        return true;
                                    }
                                    else{
                                        user.emit(EVENTS.SYSTEM.ERROR, "You can't join the room "+tokens[2]);
                                        return true;
                                    }
                                }
                                else{
                                    user.emit(EVENTS.SYSTEM.ERROR, "Unknown room "+tokens[2]);
                                    return true;
                                }
                            }
                            else{
                                user.emit(EVENTS.SYSTEM.ERROR, "Usage: /room join [room_name]");
                                return true;
                            }
                        case "leave":
                            if(tokens.length == 3){
                                if(rooms.has(tokens[2])){
                                    if(!rooms.get(tokens[2]).isIn(user)){
                                        user.emit(EVENTS.SYSTEM.ERROR, "You are not in the room "+tokens[2]);
                                        return true;
                                    }
                                    rooms.get(tokens[2]).removeUser(user);
                                    user.emit(EVENTS.SYSTEM.INFO, "You left the room "+tokens[2]);
                                    return true;
                                }
                                else{
                                    user.emit(EVENTS.SYSTEM.ERROR, "Unknown room "+tokens[2]);
                                    return true;
                                }
                            }
                            else{
                                user.emit(EVENTS.SYSTEM.ERROR, "Usage: /room leave [room_name]");
                                return true;
                            }
                        case "create":
                            if(tokens.length == 3){
                                if(rooms.has(tokens[2])){
                                    user.emit(EVENTS.SYSTEM.ERROR, "Room "+tokens[2]+" already exists");
                                    return true;
                                }
                                else{
                                    rooms.set(tokens[2], new Room(tokens[2]));
                                    user.emit(EVENTS.SYSTEM.INFO, "Room "+tokens[2]+" created");
                                    return true;
                                }
                            }
                            else{
                                user.emit(EVENTS.SYSTEM.ERROR, "Usage: /room create [room_name]");
                                return true;
                            }
                        case "delete":
                            if(tokens.length == 3){
                                if(rooms.has(tokens[2])){
                                    rooms.delete(tokens[2]);
                                    user.emit(EVENTS.SYSTEM.INFO, "Room "+tokens[2]+" deleted");
                                    return true;
                                }
                                else{
                                    user.emit(EVENTS.SYSTEM.ERROR, "Unknown room "+tokens[2]);
                                    return true;
                                }
                            }
                            else{
                                user.emit(EVENTS.SYSTEM.ERROR, "Usage: /room delete [room_name]");
                                return true;
                            }
                        case "set_visible":
                            if(tokens.length == 4){
                                if(rooms.has(tokens[2])){
                                    if(tokens[3] == "true"){
                                        rooms.get(tokens[2]).visible = true;
                                        user.emit(EVENTS.SYSTEM.INFO, "Room "+tokens[2]+" is now visible");
                                        return true;
                                    }
                                    else if(tokens[3] == "false"){
                                        rooms.get(tokens[2]).visible = false;
                                        user.emit(EVENTS.SYSTEM.INFO, "Room "+tokens[2]+" is now invisible");
                                        return true;
                                    }
                                    else{
                                        user.emit(EVENTS.SYSTEM.ERROR, "Unknown boolean "+tokens[3]);
                                        return true;
                                    }
                                }
                                else{
                                    user.emit(EVENTS.SYSTEM.ERROR, "Unknown room "+tokens[2]);
                                    return true;
                                }
                            }
                            else{
                                user.emit(EVENTS.SYSTEM.ERROR, "Usage: /room set_visible [room_name] [true | false]");
                                return true;
                            }
                        case "info":
                            if(tokens.length == 3){
                                if(rooms.has(tokens[2])){
                                    user.emit(EVENTS.SYSTEM.INFO, rooms.get(tokens[2]).toString());
                                    return true;
                                }
                                else{
                                    user.emit(EVENTS.SYSTEM.ERROR, "Unknown room "+tokens[2]);
                                    return true;
                                }
                            }
                            else{
                                user.emit(EVENTS.SYSTEM.ERROR, "Usage: /room info [room_name]");
                                return true;
                            }
                        case "list":
                            if(tokens.length == 3){
                                if(tokens[2] == "all"){
                                    let str = "";
                                    for(let room of rooms.values()){
                                        str += room.name+"\n";
                                    }
                                    user.emit(EVENTS.SYSTEM.INFO, str);
                                    return true;
                                }
                                else if(tokens[2] == "mines"){
                                    //only show rooms where I am in
                                    let str = "";
                                    for(let room of rooms.values()){
                                        if(room.isIn(user)){
                                            str += room.name+"\n";
                                        }
                                    }
                                    user.emit(EVENTS.SYSTEM.INFO, str);
                                    return true;
                                }
                                else{
                                    user.emit(EVENTS.SYSTEM.ERROR, "Unknown room list "+tokens[2]);
                                    return true;
                                }
                            }
                            else{
                                user.emit(EVENTS.SYSTEM.ERROR, "Usage: /room list [all | mines]");
                                return true;
                            }
                            return true;
                        default:
                            user.emit(EVENTS.SYSTEM.ERROR, "Unknown command /room "+tokens[1]);
                            return true;
                    }
                }
            default:
                user.emit(EVENTS.SYSTEM.ERROR, "Unknown command "+tokens[0]);
                return true;
        }
    }
    return false;
}

module.exports = { parseCMD };