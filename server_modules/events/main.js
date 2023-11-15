const { EVENTS, EVENT } = require("../../public/modules/events/events.js");
const { Server } =        require("socket.io");

class Room{
    constructor(name){
        this._name = name;
        this._users = new Set();
        this._user_list = new Set();
        this._use_as_whitelist = false; //if true, the _user_list will be used as a whitelist instead of a blacklist
        this._is_visible = true;        //if false, the room will not be visible by users that cannot join it
                                        //if true, the room will be visible by all users
    }

    set visible(bool){
        if(typeof bool !== "boolean") throw new Error("bool is not a boolean");
        this._is_visible = bool;
    }

    get visible(){
        return this._is_visible;
    }

    addUser(user){
        //add the user to the room if he is not in blacklist or if he is in whitelist
        //return true if the user has been added, false otherwise
        if(!user instanceof CSocket) throw new Error("user is not a CSocket Object");
        if(this.can_join(user)){
            this._users.add(user);
            return true;
        }
        else{
            return false;
        }
    } 

    join(user){
        return this.addUser(user);
    }

    removeUser(user){
        //remove the user from the room
        if(!user instanceof CSocket) throw new Error("user is not a CSocket Object");
        if(!this._users.has(user)) throw new Error("user is not in the room");
        this._users.delete(user);
    }

    get name(){
        return this._name;
    }

    get users(){
        return this._users;
    }

    kick(user){
        //force a user to leave the room
        if(!user instanceof CSocket) throw new Error("user is not a CSocket Object");
        this._users.delete(user);
    }

    set use_whitelist(bool){
        if(typeof bool !== "boolean") throw new Error("bool is not a boolean");
        if(this._use_as_whitelist === bool) return;
        this._user_list.clear();
        this._use_as_whitelist = bool;
    }

    get use_whitelist(){
        return this._use_as_whitelist;
    }

    add_to_whitelist(user){
        if(!this._use_as_whitelist) throw new Error("this room is not using a whitelist");
        this.add_to_list(user);
    }

    add_to_blacklist(user){
        if(this._use_as_whitelist) throw new Error("this room is not using a blacklist");
        this.add_to_list(user);
    }

    add_to_list(user){
        if(!user instanceof CSocket) throw new Error("user is not a CSocket Object");
        this._user_list.add(user);
    }

    can_join(user){
        if(!user instanceof CSocket) throw new Error("user is not a CSocket Object");
        if(this._use_as_whitelist){
            return this._user_list.has(user);
        }
        else{
            return !this._user_list.has(user);
        }
    }

    can_see(user){
        if(!user instanceof CSocket) throw new Error("user is not a CSocket Object");
        return this._is_visible || this.can_join(user); //if the room is visible, everyone can see it, otherwise only users that can join it can see it
    }

    isIn(user){
        if(!user instanceof CSocket) throw new Error("user is not a CSocket Object");
        return this._users.has(user);
    }

    emit(event, ...args){
        if(!event instanceof EVENT) throw new Error("event is not an EVENT Object");
        if(!event.server_to_client){ throw new Error("event " + event + " cannot be initiated by the server (if he's just transmitting it, use 'transmit' instead)"); }

        if(args.length != event.payload.length) throw new Error("invalid number of arguments, expected " + event.payload.length + " got " + args.length);
        for(let i = 0; i < args.length; i++){
            if(typeof args[i] !== event.payload[i].type) throw new Error("invalid type for argument " + i + ", expected " + event.payload[i].type + " got " + typeof args[i]);
        }

        for(let user of this._users){
            user.emit(event, ...args);
        }
    }

    transmit(event, ...args){
        if(!event instanceof EVENT) throw new Error("event is not an EVENT Object");
        //we are not checking if the event can be transmitted by the server because it's not the server that is transmitting it

        if(args.length != event.payload.length) throw new Error("invalid number of arguments, expected " + event.payload.length + " got " + args.length);
        for(let i = 0; i < args.length; i++){
            if(typeof args[i] !== event.payload[i].type) throw new Error("invalid type for argument " + i + ", expected " + event.payload[i].type + " got " + typeof args[i]);
        }

        for(let user of this._users){
            user.transmit(event, ...args);
        }
    }

    on(event, callback){
        if(!event instanceof EVENT) throw new Error("event is not an EVENT Object");
        if(!event.client_to_server){ throw new Error("event " + event + " cannot be initiated by the client"); }

        if(typeof callback !== "function") throw new Error("callback is not a function");

        for(let user of this._users){
            user.on(event, callback);
        }
    }
}


class CSocket{  //this is server side socket
    constructor(socket){
        if(!socket) throw new Error("socket is undefined");
        this._socket = socket;
    }

    emit(event, ...args){
        if(event == undefined) throw new Error("event is undefined");
        if(!event instanceof EVENT) throw new Error("event is not an EVENT Object");
        if(!event.server_to_client){ throw new Error("event " + event + " cannot be initiated by the server (if he's just transmitting it, use 'transmit' instead)"); }

        if(args.length != event.payload.length) throw new Error("invalid number of arguments, expected " + event.payload.length + " got " + args.length);
        for(let i = 0; i < args.length; i++){
            if(typeof args[i] !== event.payload[i].type) throw new Error("invalid type for argument " + i + ", expected " + event.payload[i].type + " got " + typeof args[i]);
        }

        this._socket.emit(String(event), ...args);
    }

    transmit(event, ...args){
        if(event == undefined) throw new Error("event is undefined");
        if(!event instanceof EVENT) throw new Error("event is not an EVENT Object");
        //we are not checking if the event can be transmitted by the server because it's not the server that is transmitting it

        if(args.length != event.payload.length) throw new Error("invalid number of arguments, expected " + event.payload.length + " got " + args.length);
        for(let i = 0; i < args.length; i++){
            if(typeof args[i] !== event.payload[i].type) throw new Error("invalid type for argument " + i + ", expected " + event.payload[i].type + " got " + typeof args[i]);
        }

        this._socket.emit(String(event), ...args);
    }

    on(event, callback){
        if(event == undefined) throw new Error("event is undefined");
        if(!event instanceof EVENT) throw new Error("event is not an EVENT Object");
        if(!event.client_to_server){ console.warn("warning : event " + event + " cannot be initiated by the client"); }

        if(typeof callback !== "function") throw new Error("callback is not a function");
        
        this._socket.on(String(event), callback);
    }

    once(event, callback){
        if(event == undefined) throw new Error("event is undefined");
        if(!event instanceof EVENT) throw new Error("event is not an EVENT Object");
        if(!event.client_to_server){ console.warn("warning : event " + event + " cannot be initiated by the client"); }

        if(typeof callback !== "function") throw new Error("callback is not a function");
        this._socket.once(String(event), callback);
    }

    disconnect(){
        this._socket.disconnect();
    }

    join(room){
        if(!room instanceof Room) throw new Error("room is not a Room Object");
        if(room.addUser(this)){
            this._socket.join(room.name);
        }
        else{
            throw new Error("unable to join room " + room.name);
        }
    }

    leave(room){
        room.removeUser(this);
    }

    get id(){
        return this._socket.id;
    }
}

class CIO{
    constructor(io){
        if(!io) throw new Error("io is undefined");
        this._io = io;

        this._sockets = new Set();
    }

    static from_server(server){
        return new CIO(new Server(server));
    }

    on(event, callback){
        if(event == undefined) throw new Error("event is undefined");
        if(! event instanceof EVENT) throw new Error("event is not an EVENT Object");
        if(!event === EVENTS.INTERNAL.CONNECTION && !event === EVENTS.INTERNAL.CONNECT) throw new Error("event is not a connection event");
        if(typeof callback !== "function") throw new Error("callback is not a function");
        this._io.on(event, (socket) => {
            let csocket = new CSocket(socket);
            this._sockets.add(csocket);
            callback(csocket);
        });
    }

    emit(event, ...args){
        if(event == undefined) throw new Error("event is undefined");
        if(!event instanceof EVENT) throw new Error("event is not an EVENT Object");
        if(!event.server_to_client){ throw new Error("event " + event + " cannot be initiated by the server (if he's just transmitting it, use 'transmit' instead)"); }

        if(args.length != event.payload.length) throw new Error("invalid number of arguments, expected " + event.payload.length + " got " + args.length);
        for(let i = 0; i < args.length; i++){
            if(typeof args[i] !== event.payload[i].type) throw new Error("invalid type for argument " + i + ", expected " + event.payload[i].type + " got " + typeof args[i]);
        }

        this._io.emit(String(event), ...args);
    }

    transmit(event, ...args){
        if(event == undefined) throw new Error("event is undefined");
        if(!event instanceof EVENT) throw new Error("event is not an EVENT Object");
        //we are not checking if the event can be transmitted by the server because it's not the server that is transmitting it
        
        if(args.length != event.payload.length) throw new Error("invalid number of arguments, expected " + event.payload.length + " got " + args.length);
        for(let i = 0; i < args.length; i++){
            if(typeof args[i] !== event.payload[i].type) throw new Error("invalid type for argument " + i + ", expected " + event.payload[i].type + " got " + typeof args[i]);
        }

        this._io.emit(String(event), ...args);
    }
}

module.exports = { EVENTS, Room, CSocket, CIO };