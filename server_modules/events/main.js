/**
 * @module CustomServerSocket
 * @category Server
 * @description This module contains the classes used to create a custom socket.io server implementing rooms and events.
 * @author Antoine Buirey
 */

const { Logger }        = require("../logs/main");
const { EVENTS, EVENT } = require("./events");
const { Server }        = require("socket.io");

let logger = new Logger();


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
        this._users = new Set();        //this set will contain all the users in the room
        this._user_list = new Set();    // this list will act as a blacklist or a whitelist depending on the value of _use_as_whitelist
        this._use_as_whitelist = false; //if true, the _user_list will be used as a whitelist instead of a blacklist
        this._is_visible = true;        //if false, the room will not be visible by users that cannot join it
                                        //if true, the room will be visible by all users
        this._is_running = false;

        this._on_listeners = new Array();

        logger.debug("room " + name + " created");
    }

    /**
     * @description Set the visibility of the room.
     * @throws {Error} if the value is not a boolean.
     * @type {boolean}
     * @returns {boolean} true if the room is visible, false otherwise.
     */
    set visible(bool){
        if(typeof bool !== "boolean") throw new Error("bool is not a boolean");
        this._is_visible = bool;
        logger.debug("room " + this._name + " visibility set to " + bool);
    }

    get visible(){
        return this._is_visible;
    }

    /**
     * @description Add a user to the room.
     * @param {CSocket} user - The user to add.
     * @throws {Error} if the user is not a CSocket object.
     * @returns {boolean} true if the user has been added, false otherwise.
     */
    addUser(user){
        //add the user to the room if he is not in blacklist or if he is in whitelist
        //return true if the user has been added, false otherwise
        if(!user instanceof CSocket) throw new Error("user is not a CSocket Object");
        if(this.can_join(user)){
            this._users.add(user);
            for(let listener of this._on_listeners){
                user.on(listener.event, listener.callback);
            }
            return true;
        }
        else{
            return false;
        }
    } 

    /**
     * @see Room#addUser
     * @description Alias for {@link Room#addUser addUser}.
     * @param {CSocket} user - The user to add.
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
        logger.debug("user " + user.id + " removed from room " + this._name);
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
        logger.debug("user " + user.id + " kicked from room " + this._name);
    }

    /**
     * @description Set the room to use a whitelist or a blacklist.
     * @throws {Error} if the value is not a boolean.
     * @type {boolean}
     * @returns {boolean} true if the room is using a whitelist, false otherwise.
     */
    set use_whitelist(bool){
        if(typeof bool !== "boolean") throw new Error("bool is not a boolean");
        if(this._use_as_whitelist === bool) return;
        this._user_list.clear();
        this._use_as_whitelist = bool;
        logger.debug("room " + this._name + " now using " + (bool ? "whitelist" : "blacklist"));
    }

    get use_whitelist(){
        return this._use_as_whitelist;
    }

    /**
     * @description Add a user to the whitelist.
     * @param {CSocket} user - The user to add.
     * @throws {Error} if the room is not using a whitelist.
     * @throws {Error} if the user is not a CSocket object.
     * @description if the user is already in the whitelist, nothing will happen.
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
     * @description if the user is already in the blacklist, nothing will happen.
     */
    add_to_blacklist(user){
        if(this._use_as_whitelist) throw new Error("this room is not using a blacklist");
        this.add_to_list(user);
    }

    /**
     * @description Add a user to the list.
     * @param {CSocket} user - The user to add.
     * @throws {Error} if the user is not a CSocket object.
     * @description if the user is already in the list, nothing will happen.
     */
    add_to_list(user){
        if(!user instanceof CSocket) throw new Error("user is not a CSocket Object");
        this._user_list.add(user);
        logger.debug("user " + user.id + " added to " + (this._use_as_whitelist ? "whitelist" : "blacklist") + " of room " + this._name);
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
     * @description if the room is visible, everyone can see it, otherwise only users that can join it can see it.
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

        logger.debug("emitting event " + event + " to " + this._users.size + " users in room " + this._name);
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
     * @description this method is used to transmit an event that was sent by a user in the room to all the other users in the room; if the event is intitiated by the server, use {@link Room#emit} instead.
     */
    transmit(event, ...args){
        if(!event instanceof EVENT) throw new Error("event is not an EVENT Object");
        //we are not checking if the event can be transmitted by the server because it's not the server that is transmitting it

        if(args.length != event.payload.length) throw new Error("invalid number of arguments, expected " + event.payload.length + " got " + args.length);
        for(let i = 0; i < args.length; i++){
            if(typeof args[i] !== event.payload[i].type) throw new Error("invalid type for argument " + i + ", expected " + event.payload[i].type + " got " + typeof args[i]);
        }

        logger.debug("transmitting event " + event + " to " + this._users.size + " users in room " + this._name);
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

        this._on_listeners.push({event: event, callback: callback});

        logger.debug("registering event " + event + " for " + this._users.size + " users in room " + this._name);
        for(let user of this._users){
            user.on(event, callback);
        }
    }

    /**
     * @description Get the number of users in the room.
     * @returns {number} The number of users in the room.
     * @readonly
     */
    countUsers(){
        return this._users.size;
    }

    /**
     * @description Get the running status of the room.
     * @returns {boolean} True if the room is running, false otherwise.
     */
    get run() {
        return this._is_running;
    }

    /**
     * @description Set the running status of the room.
     * @param {boolean} value - The new running status.
     * @throws {Error} if the value is not a boolean.
     */
    set run(value) {
        if (typeof value !== 'boolean') {
            throw new Error('Value must be a boolean');
        }
        this._is_running = value;
        logger.debug(`Room ${this._name} running status set to ${value}`);
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
     * @description Emit an event to the client. This event is initiated by the server. If the event is sent by a user, use {@link Socket.CSocket#transmit transmit} instead.
     * @param {EVENT} event - The event to emit.
     * @param {...any} args - The arguments to send with the event.
     * @throws {Error} if the event is undefined.
     * @throws {Error} if the event is not an EVENT object.
     * @throws {Error} if the event cannot be initiated by the server.
     * @throws {Error} if the number of arguments is invalid.
     * @throws {Error} if the type of an argument is invalid.
     * @see {@link ClientSocket.CSocket#on}
     * @see {@link ClientSocket.CSocket#once}
     * @see {@link Socket.CSocket#transmit transmit}
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
        logger.debug("emitting event " + event + " to user " + this._socket.id);
    }

    /**
     * @description Transmit an event  sent by a user to the client. This method is used to transmit an event that was sent by a user to the client; if the event is intitiated by the server, use {@link Socket.CSocket#emit emit} instead.
     * @param {EVENT} event - The event to transmit.
     * @param {...any} args - The arguments to send with the event.
     * @throws {Error} if the event is undefined.
     * @throws {Error} if the event is not an EVENT object.
     * @throws {Error} if the number of arguments is invalid.
     * @throws {Error} if the type of an argument is invalid.
     * @see {@link ClientSocket.CSocket#on}
     * @see {@link ClientSocket.CSocket#once}
     * @see {@link Socket.CSocket#emit emit}
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
        logger.debug("transmitting event " + event + " to user " + this._socket.id);
    }

    /**
     * @description Register a new event listener. the callback will be called every time the event is received. For a one time event listener, use {@link Socket.CSocket#once once} instead.
     * @param {EVENT} event - The event to listen to.
     * @param {function} callback - The callback function.
     * @throws {Error} if the event is undefined.
     * @throws {Error} if the event is not an EVENT object.
     * @throws {Error} if the event cannot be initiated by the client.
     * @throws {Error} if the callback is not a function.
     * @see {@link ClientSocket.CSocket#emit}
     * @see {@link Socket.CSocket#once}
     * 
     */
    on(event, callback){
        if(event == undefined) throw new Error("event is undefined");
        if(!event instanceof EVENT) throw new Error("event is not an EVENT Object");
        if(!event.client_to_server){ console.warn("warning : event " + event + " cannot be initiated by the client"); }

        if(typeof callback !== "function") throw new Error("callback is not a function");
        
        this._socket.on(String(event), callback);
        logger.debug("registering event " + event + " for user " + this._socket.id);
    }

    /**
     * @description Register a new event listener that will be caught only once.
     * @param {EVENT} event - The event to listen to.
     * @param {function} callback - The callback function.
     * @throws {Error} if the event is undefined.
     * @throws {Error} if the event is not an EVENT object.
     * @throws {Error} if the event cannot be initiated by the client.
     * @throws {Error} if the callback is not a function.
     * @see {@link Socket.CSocket#on}
     * @see {@link ClientSocket.CSocket#emit}
     */
    once(event, callback){
        if(event == undefined) throw new Error("event is undefined");
        if(!event instanceof EVENT) throw new Error("event is not an EVENT Object");
        if(!event.client_to_server){ console.warn("warning : event " + event + " cannot be initiated by the client"); }

        if(typeof callback !== "function") throw new Error("callback is not a function");
        this._socket.once(String(event), callback);
        logger.debug("registering event " + event + " for user " + this._socket.id + " (only one catch)");
    }

    /**
     * @description Disconnect the socket, closing the connection.
     * @see CSocket#connect
     */
    disconnect(){
        this._socket.disconnect();
        logger.debug("disconnecting user " + this._socket.id);
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
     * @returns {string} The socket id.
     * @description this id is unique for each socket, and will be different for each connection of the same client (this can't be used to identify a client)
     * @readonly
     */
    get id(){
        return this._socket.id;
    }
}

/**
 * @description This class represent a socket.io server.
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
     * @description Create a {@link Socket.CIO CIO} object from an express server object.
     * @param {Server} server The express server object.
     * @returns {CIO} The CIO object.
     * @static
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

        logger.debug("registering event " + event + " for " + this._sockets.size + " users");

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

        logger.debug("emitting event " + event + " to " + this._sockets.size + " users");

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

        logger.debug("transmitting event " + event + " to " + this._sockets.size + " users");

        this._io.emit(String(event), ...args);
    }
}

module.exports = { EVENTS, Room, CSocket, CIO };