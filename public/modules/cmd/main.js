const { EVENTS } = require("../events/main.js");

function parseCMD(str, socket, io, rooms){ //rooms is a map of room names to room objects
    //return true if we parsed a command (even if it's an invalid one), false otherwise
    if(str.startsWith("/")){ //it's a command
        let cmd = str.split(" ")[0].substring(1);
        let args = str.split(" ").slice(1);
        switch(cmd){
            case "help":
                socket.emit(EVENTS.CHAT.SYSTEM.INFO, "Available commands : /help, /join, /leave, /list, /kick, /ban, /unban, /info");
                break;
            case "join":
                if(args.length == 0){
                    socket.emit(EVENTS.CHAT.SYSTEM.ERROR, "Usage : /join <room>");
                    break;
                }
                if(rooms.has(args[0])){
                    if(!rooms.get(args[0]).isIn(socket)){
                        socket.join(rooms.get(args[0]));
                        socket.emit(EVENTS.CHAT.SYSTEM.INFO, "You joined room "+args[0]);
                    }
                    else{
                        socket.emit(EVENTS.CHAT.SYSTEM.ERROR, "You are already in room "+args[0]);
                    }
                }
                else{
                    socket.emit(EVENTS.CHAT.SYSTEM.ERROR, "Room "+args[0]+" doesn't exist");
                }
                break;
            case "leave":
                if(args.length == 0){
                    socket.emit(EVENTS.CHAT.SYSTEM.ERROR, "Usage : /leave <room>");
                    break;
                }
                if(rooms.has(args[0])){
                    try{
                        socket.leave(rooms.get(args[0]));
                    }
                    catch(e){
                        socket.emit(EVENTS.CHAT.SYSTEM.ERROR, "You are not in room "+args[0]);
                        break;
                    }
                    socket.emit(EVENTS.CHAT.SYSTEM.INFO, "You left room "+args[0]);
                }
                else{
                    socket.emit(EVENTS.CHAT.SYSTEM.ERROR, "Room "+args[0]+" doesn't exist");
                }
                break;
            case "list":
                socket.emit(EVENTS.CHAT.SYSTEM.INFO, "Rooms : "+Array.from(rooms.keys()).join(", "));
                break;
            case "kick":
                if(args.length != 3){
                    socket.emit(EVENTS.CHAT.SYSTEM.ERROR, "Usage : /kick <user> from <room>");
                    break;
                }
                if(rooms.has(args[2])){
                    if(rooms.get(args[2]).has(args[0])){
                        rooms.get(args[2]).get(args[0]).kick();
                        socket.emit(EVENTS.CHAT.SYSTEM.INFO, "User "+args[0]+" has been kicked from room "+args[2]);
                    }
                    else{
                        socket.emit(EVENTS.CHAT.SYSTEM.ERROR, "User "+args[0]+" is not in room "+args[2]);
                    }
                }
                else{
                    socket.emit(EVENTS.CHAT.SYSTEM.ERROR, "Room "+args[2]+" doesn't exist");
                }
                break;
            case "ban":
                if(args.length != 3){
                    socket.emit(EVENTS.CHAT.SYSTEM.ERROR, "Usage : /ban <user> from <room>");
                    break;
                }
                if(rooms.has(args[2])){
                    if(rooms.get(args[2]).has(args[0])){
                        rooms.get(args[2]).get(args[0]).ban();
                        socket.emit(EVENTS.CHAT.SYSTEM.INFO, "User "+args[0]+" has been banned from room "+args[2]);
                    }
                    else{
                        socket.emit(EVENTS.CHAT.SYSTEM.ERROR, "User "+args[0]+" is not in room "+args[2]);
                    }
                }
                else{
                    socket.emit(EVENTS.CHAT.SYSTEM.ERROR, "Room "+args[2]+" doesn't exist");
                }
                break;
            case "unban":
                if(args.length != 3){
                    socket.emit(EVENTS.CHAT.SYSTEM.ERROR, "Usage : /unban <user> from <room>");
                    break;
                }
                if(rooms.has(args[2])){
                    if(rooms.get(args[2]).has(args[0])){
                        rooms.get(args[2]).get(args[0]).unban();
                        socket.emit(EVENTS.CHAT.SYSTEM.INFO, "User "+args[0]+" has been unbanned from room "+args[2]);
                    }
                    else{
                        socket.emit(EVENTS.CHAT.SYSTEM.ERROR, "User "+args[0]+" is not in room "+args[2]);
                    }
                }
                else{
                    socket.emit(EVENTS.CHAT.SYSTEM.ERROR, "Room "+args[2]+" doesn't exist");
                }
                break;
            case "info":
                if(args.length != 1){
                    socket.emit(EVENTS.CHAT.SYSTEM.ERROR, "Usage : /info <msg>");
                    break;
                }
                io.emit(EVENTS.CHAT.SYSTEM.BROADCAST, args[0]);
            default:
                socket.emit(EVENTS.CHAT.SYSTEM.ERROR, "Unknown command : "+cmd);
                return true;
        }
        return true;
    }
    return false;
}

module.exports = { parseCMD };