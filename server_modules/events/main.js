/**
 * @file This file contains the events module.
 * @note This file is only used on the server side; another file is used on the client side.
 */

const { EVENTS, EVENT } = require("../../public/modules/events/events.js");
const { Server }        = require("socket.io");


/**
 * @description This class is used to create a room.
 */
class Room{
    /**
     * @description Create a new room.
     * @param {string} name The name of the room.
     */
    constructor(name){
        this._name = name;
        this._users = new Set();
        this._user_list = new Set();
        this._use_as_whitelist = false; //if true, the _user_list will be used as a whitelist instead of a blacklist
        this._is_visible = true;        //if false, the room will not be visible by users that cannot join it
                                        //if true, the room will be visible by all users
    }

    /**
     * @description Set the visibility of the room.
     * @param {boolean} bool - true if the room should be visible, false otherwise.
     */
    set visible(bool){
        if(typeof bool !== "boolean") throw new Error("bool is not a boolean");
        this._is_visible = bool;
    }

    /**
     * @description Return true if the room is visible, false otherwise.
     * @returns {boolean} true if the room is visible, false otherwise.
     */
    get visible(){
        return this._is_visible;
    }

    /**
     * @description Add a user to the room.
     * @param {CSocket} user - The user to add.
     * @returns {boolean} true if the user has been added, false otherwise.
     * @throws {Error} if the user is not a CSocket object.
     * @returns {boolean} true if the user has been added, false otherwise.
     */
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

    /**
     * @see Room#addUser
     */
    join(user){
        return this.addUser(user);
    }

    /**
     * @description Remove a user from the room.
     * @param {CSocket} user - The user to remove.
     * @throws {Error} if the user is not a CSocket object.
     * @throws {Error} if the user is not in the room.
     * @returns {boolean} true if the user has been removed, false otherwise.
     */
    removeUser(user){
        //remove the user from the room
        if(!user instanceof CSocket) throw new Error("user is not a CSocket Object");
        if(!this._users.has(user)) throw new Error("user is not in the room");
        this._users.delete(user);
    }

    /**
     * @description Return the name of the room.
     * @returns {string} The name of the room.
     * @readonly
     */
    get name(){
        return this._name;
    }

    /**
     * @description Return the users in the room.
     * @returns {Set<CSocket>} The users in the room.
     * @readonly
     */
    get users(){
        return this._users;
    }

    /**
     * @description force a user to leave the room.
     * @param {CSocket} user - The user to kick.
     * @throws {Error} if the user is not a CSocket object.
     * @throws {Error} if the user is not in the room.
     * @returns {boolean} true if the user has been removed, false otherwise.
     */
    kick(user){
        //force a user to leave the room
        if(!user instanceof CSocket) throw new Error("user is not a CSocket Object");
        this._users.delete(user);
    }

    /**
     * @description Set the room to use a whitelist or a blacklist.
     * @param {boolean} bool - true if the room should use a whitelist, false otherwise.
     * @throws {Error} if bool is not a boolean.
     * @note if the list mode is changed, the list will be cleared.
     */
    set use_whitelist(bool){
        if(typeof bool !== "boolean") throw new Error("bool is not a boolean");
        if(this._use_as_whitelist === bool) return;
        this._user_list.clear();
        this._use_as_whitelist = bool;
    }

    /**
     * @description Return true if the room is using a whitelist, false otherwise.
     * @returns {boolean} true if the room is using a whitelist, false otherwise.
     * @readonly
     */
    get use_whitelist(){
        return this._use_as_whitelist;
    }

    /**
     * @description Add a user to the whitelist.
     * @param {CSocket} user - The user to add.
     * @throws {Error} if the room is not using a whitelist.
     * @throws {Error} if the user is not a CSocket object.
     * @note if the user is already in the whitelist, nothing will happen.
     */
    add_to_whitelist(user){
        if(!this._use_as_whitelist) throw new Error("this room is not using a whitelist");
        this.add_to_list(user);
    }

    /**
     * @description Add a user to the blacklist.
     * @param {CSocket} user - The user to add.
     * @throws {Error} if the room is not using a blacklist.
     * @throws {Error} if the user is not a CSocket object.
     * @note if the user is already in the blacklist, nothing will happen.
     */
    add_to_blacklist(user){
        if(this._use_as_whitelist) throw new Error("this room is not using a blacklist");
        this.add_to_list(user);
    }

    /**
     * @description Add a user to the list.
     * @param {CSocket} user - The user to add.
     * @throws {Error} if the user is not a CSocket object.
     * @note if the user is already in the list, nothing will happen.
     */
    add_to_list(user){
        if(!user instanceof CSocket) throw new Error("user is not a CSocket Object");
        this._user_list.add(user);
    }

    /**
     * @description Tell if a user can join the room.
     * @param {CSocket} user - The user to check.
     * @throws {Error} if the user is not a CSocket object.
     * @returns {boolean} true if the user can join the room, false otherwise.
     */
    can_join(user){
        if(!user instanceof CSocket) throw new Error("user is not a CSocket Object");
        if(this._use_as_whitelist){
            return this._user_list.has(user);
        }
        else{
            return !this._user_list.has(user);
        }
    }

    /**
     * @description Tell if a user can see the room.
     * @param {CSocket} user - The user to check.
     * @throws {Error} if the user is not a CSocket object.
     * @returns {boolean} true if the user can see the room, false otherwise.
     * @note if the room is visible, everyone can see it, otherwise only users that can join it can see it.
     * @see Room#can_join
     */
    can_see(user){
        if(!user instanceof CSocket) throw new Error("user is not a CSocket Object");
        return this._is_visible || this.can_join(user); //if the room is visible, everyone can see it, otherwise only users that can join it can see it
    }

    /**
     * @description Tell if a user is in the room.
     * @param {CSocket} user - The user to check.
     * @throws {Error} if the user is not a CSocket object.
     * @returns {boolean} true if the user is in the room, false otherwise.
     */
    isIn(user){
        if(!user instanceof CSocket) throw new Error("user is not a CSocket Object");
        return this._users.has(user);
    }

    /**
     * @description Emit an event to all the users in the room.
     * @param {EVENT} event - The event to emit.
     * @param {...any} args - The arguments to send with the event.
     * @throws {Error} if the event is undefined.
     * @throws {Error} if the event is not an EVENT object.
     * @throws {Error} if the event cannot be initiated by the server.
     * @throws {Error} if the number of arguments is invalid.
     * @throws {Error} if the type of an argument is invalid.
     * @see CSocket#emit
     * @see Room#transmit
     */
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

    /**
     * @description Transmit an sent by one of the users in the room to all the users in the room.
     * @param {EVENT} event - The event to transmit.
     * @param {...any} args - The arguments to send with the event.
     * @throws {Error} if the event is undefined.
     * @throws {Error} if the event is not an EVENT object.
     * @throws {Error} if the number of arguments is invalid.
     * @throws {Error} if the type of an argument is invalid.
     * @see CSocket#transmit
     * @see Room#emit
     * @note this method is used to transmit an event that was sent by a user in the room to all the other users in the room; if the event is intitiated by the server, use {@link Room#emit} instead.
     */
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

    /**
     * @description Register a new event listener for all the users in the room.
     * @param {EVENT} event - The event to listen to.
     * @param {function} callback - The callback function.
     * @throws {Error} if the event is undefined.
     * @throws {Error} if the event is not an EVENT object.
     * @throws {Error} if the event cannot be initiated by the client.
     */
    on(event, callback){
        if(!event instanceof EVENT) throw new Error("event is not an EVENT Object");
        if(!event.client_to_server){ throw new Error("event " + event + " cannot be initiated by the client"); }

        if(typeof callback !== "function") throw new Error("callback is not a function");

        for(let user of this._users){
            user.on(event, callback);
        }
    }
}

/**
 * @description This class represent a socket.
 */
class CSocket{  //this is server side socket
    /**
     * @description Create a new CSocket object.
     * @param {Socket} socket - The socket.io socket object.
     * @throws {Error} if the socket is undefined.
     */
    constructor(socket){
        if(!socket) throw new Error("socket is undefined");
        this._socket = socket;
    }

    /**
     * @description Emit an event to the client.
     * @param {EVENT} event - The event to emit.
     * @param {...any} args - The arguments to send with the event.
     * @throws {Error} if the event is undefined.
     * @throws {Error} if the event is not an EVENT object.
     * @throws {Error} if the event cannot be initiated by the server.
     * @throws {Error} if the number of arguments is invalid.
     * @throws {Error} if the type of an argument is invalid.
     * @see CSocket#transmit
     */
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

    /**
     * @description Transmit an event  sent by a user to the client.
     * @param {EVENT} event - The event to transmit.
     * @param {...any} args - The arguments to send with the event.
     * @throws {Error} if the event is undefined.
     * @throws {Error} if the event is not an EVENT object.
     * @throws {Error} if the number of arguments is invalid.
     * @throws {Error} if the type of an argument is invalid.
     * @see CSocket#emit
     * @note this method is used to transmit an event that was sent by a user to the client; if the event is intitiated by the server, use {@link CSocket#emit} instead.
     */
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

    /**
     * @description Register a new event listener.
     * @param {EVENT} event - The event to listen to.
     * @param {function} callback - The callback function.
     * @throws {Error} if the event is undefined.
     * @throws {Error} if the event is not an EVENT object.
     * @throws {Error} if the event cannot be initiated by the client.
     * @throws {Error} if the callback is not a function.
     * @see CSocket#once
     */
    on(event, callback){
        if(event == undefined) throw new Error("event is undefined");
        if(!event instanceof EVENT) throw new Error("event is not an EVENT Object");
        if(!event.client_to_server){ console.warn("warning : event " + event + " cannot be initiated by the client"); }

        if(typeof callback !== "function") throw new Error("callback is not a function");
        
        this._socket.on(String(event), callback);
    }

    /**
     * @description Register a new event listener that will be called only once.
     * @param {EVENT} event - The event to listen to.
     * @param {function} callback - The callback function.
     * @throws {Error} if the event is undefined.
     * @throws {Error} if the event is not an EVENT object.
     * @throws {Error} if the event cannot be initiated by the client.
     * @throws {Error} if the callback is not a function.
     * @see CSocket#on
     */
    once(event, callback){
        if(event == undefined) throw new Error("event is undefined");
        if(!event instanceof EVENT) throw new Error("event is not an EVENT Object");
        if(!event.client_to_server){ console.warn("warning : event " + event + " cannot be initiated by the client"); }

        if(typeof callback !== "function") throw new Error("callback is not a function");
        this._socket.once(String(event), callback);
    }

    /**
     * @description Disconnect the socket, closing the connection.
     * @see CSocket#connect
     */
    disconnect(){
        this._socket.disconnect();
    }

    /**
     * @description add the socket to a room.
     * @param {Room} room - The room to join.
     * @throws {Error} if the room is not a Room object.
     * @throws {Error} if the room is not visible.
     */
    join(room){
        if(!room instanceof Room) throw new Error("room is not a Room Object");
        if(room.addUser(this)){
            this._socket.join(room.name);
        }
        else{
            throw new Error("unable to join room " + room.name);
        }
    }

    /**
     * @description remove the socket from a room.
     * @param {Room} room - The room to leave.
     * @throws {Error} if the room is not a Room object.
     */
    leave(room){
        room.removeUser(this);
    }

    /**
     * @description return return the socket id.
     * @returns {string} The socket id.
     * @info this id is unique for each socket, and will be different for each connection of the same client (this can't be used to identify a client)
     * @readonly
     */
    get id(){
        return this._socket.id;
    }
}

/**
 * @description This class represent a socket.io server.
 * @note This class is used to create a new socket.io server.
 */
class CIO{
    /**
     * @description Create a new CIO object.
     * @param {Server} io - The socket.io server object.
     * @throws {Error} if io is undefined.
     */
    constructor(io){
        if(!io) throw new Error("io is undefined");
        this._io = io;

        this._sockets = new Set();
    }

    /**
     * @description Return the socket.io server object.
     * @param {Server} server The express server object.
     * @returns {CIO} The CIO object.
     */
    static from_server(server){
        return new CIO(new Server(server));
    }

    /**
     * @description register a new event listener for all sockets connected to the server.
     * @param {EVENT} event The event to listen to.
     * @param {function} callback The callback function.
     * @throws {Error} if the event is undefined.
     * @throws {Error} if the event is not an EVENT object.
     * @throws {Error} if the event is not a connection event.
     * @throws {Error} if the callback is not a function.
     */
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

    /**
     * @description emit an event to all the sockets connected to the server.
     * @param {EVENT} event - The event to emit.
     * @param {...any} args - The arguments to send with the event.
     * @throws {Error} if the event is undefined.
     * @throws {Error} if the event is not an EVENT object.
     * @throws {Error} if the event cannot be initiated by the server.
     * @throws {Error} if the number of arguments is invalid.
     * @throws {Error} if the type of an argument is invalid.
     * @see CSocket#emit
     * @see CIO#transmit
     */
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

    /**
     * @description Transmit an event sent by a user to all the sockets connected to the server.
     * @param {EVENT} event - The event to transmit.
     * @param {...any} args - The arguments to send with the event.
     * @throws {Error} if the event is undefined.
     * @throws {Error} if the event is not an EVENT object.
     * @throws {Error} if the number of arguments is invalid.
     * @throws {Error} if the type of an argument is invalid.
     * @see CSocket#transmit
     * @see CIO#emit
     */
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