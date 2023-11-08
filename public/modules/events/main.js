
const EVENTS = Object.freeze({
    CHAT : {
        MESSAGE: 'chat:message',            //a message has been sent or received
            // data : {(timestamp), (username), (message)}
            //send by client or server(broadcast)
        USER_JOINED:  'chat:user_joined',   //a user has joined the chat
            //data : {(timestamp), (username)}
            //send by client or server(broadcast)
        USER_LEFT:  'chat:user_left',       //a user has left the chat
            //data : {(timestamp), (username)}
            //send by client or server(broadcast)
    },
    SYSTEM : {
        BROADCAST : 'chat:system:broadcast', //a message has been broadcasted to all users
            //data : {(timestamp), (message)}
            //send by server(broadcast)
        INFO : 'chat:system:info',           //this is an information sent to a user (not broadcasted)
            //data : {(timestamp), (message)}
            //send by server(not broadcasted)
        ERROR : 'chat:system:error',         //an error has occured
            //data : {(timestamp), (reason)}
            //send by server(broadcast or not)
        WARNING : 'chat:system:warning',     //a warning has been sent
            //data : {(timestamp), (reason)}
            //send by server(broadcast or not)
    },
    GAME : {
        USER_JOINED:  'game:user_joined',   //a user has joined the game
            //data : {(timestamp), (username)}
            //send by client or server(broadcast)
        USER_LEFT: 'game:user_left',       //a user has left the game
            //data : {(timestamp), (username)}
            //send by client or server(broadcast)
        START:  'game:start',               //the game has started
            //data : {(timestamp), [...data]}              //data is dependant on the game, may be null
            //send by server(broadcast)
        END:  'game:end',                   //the game has ended
            //data : {(timestamp), [...data]}              //data is dependant on the game, may be null
            //send by server(broadcast)
        DATA: 'game:data',                  //this is used for sending data to the game, this will depend on the game
            //data : {(timestamp), [...data]}              //data is dependant on the game, may be null
            //send by client or server(broadcast or not)
    },
    MISC : {
        USERNAME: 'misc:username',          //this is used for sending the username to the server
            //data : {(timestamp), (username)}
            //send by client
    },
    //! events below are default events, and don't need to be triggered manually
    CONNECTION : 'connection',                      //a new user has connected (this is a default event, not a custom one)
    CONNECT : 'connect',                            //a new user has connected (this is a default event, not a custom one) (this is similar to CONNECTION)
    DISCONNECT : 'disconnect',                      //a user has disconnected (this is a default event, not a custom one)
    DISCONNECTING : 'disconnecting',                //a user is disconnecting (this is a default event, not a custom one) (this is triggered before DISCONNECT)
});

// use it like this:
// EVENTS.CHAT.MESSAGE
// EVENTS.CONNECTION


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
        if(event === EVENTS.CHAT.MESSAGE){
            if (args.length !== 2) throw new Error("invalid number of arguments, expected username and message");
            let [username, message] = args;
            for(let user of this._users){
                user.emit(event, username, message);
            }
            return;
        }
        if(event === EVENTS.CHAT.USER_JOINED || event === EVENTS.CHAT.USER_LEFT){
            if (args.length !== 1) throw new Error("invalid number of arguments, expected username");
            let [username] = args;
            for(let user of this._users){
                user.emit(event, username);
            }
            return;
        }
        if(event === EVENTS.GAME.USER_JOINED || event === EVENTS.GAME.USER_LEFT){
            if (args.length !== 1) throw new Error("invalid number of arguments, expected username");
            let [username] = args;
            for(let user of this._users){
                user.emit(event, username);
            }
            return;
        }
        if(event === EVENTS.GAME.START || event === EVENTS.GAME.END || event === EVENTS.GAME.DATA){
            for(let user of this._users){
                user.emit(event, ...args);
            }
            return;
        }
        throw new Error("invalid event " + event);
    }

    on(event, callback){
        if(event === EVENTS.CHAT.MESSAGE){
            for(let user of this._users){
                user.on(event, (timestamp, username, message) => {
                    callback(timestamp, username, message);
                });
            }
            return;
        }
        if(event === EVENTS.CHAT.USER_JOINED || event === EVENTS.CHAT.USER_LEFT){
            for(let user of this._users){
                user.on(event, (timestamp, username) => {
                    callback(timestamp, username);
                });
            }
            return;
        }
        if(event === EVENTS.GAME.USER_JOINED || event === EVENTS.GAME.USER_LEFT){
            for(let user of this._users){
                user.on(event, (timestamp, username) => {
                    callback(timestamp, username);
                });
            }
            return;
        }
        if(event === EVENTS.GAME.START || event === EVENTS.GAME.END || event === EVENTS.GAME.DATA){
            for(let user of this._users){
                user.on(event, (timestamp, data) => {
                    callback(timestamp, data);
                });
            }
            return;
        }
        if(event === EVENTS.DISCONNECT){
            for(let user of this._users){
                user.on(event, (reason) => {
                    callback(reason);
                });
            }
            return;
        }
        throw new Error("invalid event " + event);
    }
}


class CSocket{
    constructor(socket){
        if(!socket) throw new Error("socket is undefined");
        this._socket = socket;
    }

    emit(event, ...args){
        if(event === EVENTS.CHAT.MESSAGE){
            if (args.length !== 2) throw new Error("invalid number of arguments, expected username and message");
            let [username, message] = args;
            this._socket.emit(event, {timestamp: Date.now(), username, message});
            return;
        }
        if(event === EVENTS.CHAT.USER_JOINED || event === EVENTS.CHAT.USER_LEFT){
            if (args.length !== 1) throw new Error("invalid number of arguments, expected username");
            let [username] = args;
            this._socket.emit(event, {timestamp: Date.now(), username});
            return;
        }
        if(event === EVENTS.GAME.USER_JOINED || event === EVENTS.GAME.USER_LEFT){
            if (args.length !== 1) throw new Error("invalid number of arguments, expected username");
            let [username] = args;
            console.log("emitting " + event + " with " + username + " using " + this._socket + " ("+typeof this._socket+")");
            this._socket.emit(event, {timestamp: Date.now(), username});
            return;
        }
        if(event === EVENTS.GAME.START || event === EVENTS.GAME.END || event === EVENTS.GAME.DATA){
            this._socket.emit(event, {timestamp: Date.now(), data: args});
            return;
        }
        if(event === EVENTS.SYSTEM.ERROR || event === EVENTS.SYSTEM.INFO || event === EVENTS.SYSTEM.WARNING){
            if (args.length !== 1) throw new Error("invalid number of arguments, expected message");
            let [message] = args;
            this._socket.emit(event, {timestamp: Date.now(), message});
            return;
        }
        if(event === EVENTS.MISC.USERNAME){
            if (args.length !== 1) throw new Error("invalid number of arguments, expected username");
            let [username] = args;
            this._socket.emit(event, {timestamp: Date.now(), username});
            return;
        }
        throw new Error("invalid event " + event);
    }

    on(event, callback){
        if(event === EVENTS.CHAT.MESSAGE){
            this._socket.on(event, (data) => {
                callback(data.timestamp, data.username, data.message);
            });
            return;
        }
        if(event === EVENTS.CHAT.USER_JOINED || event === EVENTS.CHAT.USER_LEFT){
            this._socket.on(event, (data) => {
                callback(data.timestamp, data.username);
            });
            return;
        }
        if(event === EVENTS.GAME.USER_JOINED || event === EVENTS.GAME.USER_LEFT){
            this._socket.on(event, (data) => {
                callback(data.timestamp, data.username);
            });
            return;
        }
        if(event === EVENTS.GAME.START || event === EVENTS.GAME.END || event === EVENTS.GAME.DATA){
            this._socket.on(event, (data) => {
                callback(data.timestamp, data.data);
            });
            return;
        }
        if(event === EVENTS.DISCONNECT){
            this._socket.on(event, (reason) => {
                callback(reason);
            });
            return;
        }
        if(event === EVENTS.SYSTEM.ERROR || event === EVENTS.SYSTEM.INFO || event === EVENTS.SYSTEM.WARNING){
            this._socket.on(event, (data) => {
                callback(data.timestamp, data.message);
            });
            return;
        }
        if(event === EVENTS.SYSTEM.BROADCAST){
            this._socket.on(event, (data) => {
                callback(data.timestamp, data.message);
            });
            return;
        }
        if(event === EVENTS.MISC.USERNAME){
            this._socket.on(event, (data) => {
                callback(data.timestamp, data.username);
            });
            return;
        }
        throw new Error("invalid event " + event);
    }

    once(event, callback){
        if(event === EVENTS.CHAT.MESSAGE){
            this._socket.once(event, (data) => {
                callback(data.timestamp, data.username, data.message);
            });
            return;
        }
        if(event === EVENTS.CHAT.USER_JOINED || event === EVENTS.CHAT.USER_LEFT){
            this._socket.once(event, (data) => {
                callback(data.timestamp, data.username);
            });
            return;
        }
        if(event === EVENTS.GAME.USER_JOINED || event === EVENTS.GAME.USER_LEFT){
            this._socket.once(event, (data) => {
                callback(data.timestamp, data.username);
            });
            return;
        }
        if(event === EVENTS.GAME.START || event === EVENTS.GAME.END || event === EVENTS.GAME.DATA){
            this._socket.once(event, (data) => {
                callback(data.timestamp, data.data);
            });
            return;
        }
        if(event === EVENTS.DISCONNECT){
            this._socket.once(event, (reason) => {
                callback(reason);
            });
            return;
        }
        if(event === EVENTS.SYSTEM.ERROR || event === EVENTS.SYSTEM.INFO || event === EVENTS.SYSTEM.WARNING){
            this._socket.once(event, (data) => {
                callback(data.timestamp, data.message);
            });
            return;
        }
        if(event === EVENTS.SYSTEM.BROADCAST){
            this._socket.once(event, (data) => {
                callback(data.timestamp, data.message);
            });
            return;
        }
        if(event === EVENTS.MISC.USERNAME){
            this._socket.once(event, (data) => {
                callback(data.timestamp, data.username);
            });
            return;
        }
        throw new Error("invalid event " + event);
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

        this._to_broadcast = new Set();

        this._sockets = new Set();
    }

    on(event, callback){
        if(event === EVENTS.CONNECTION || event === EVENTS.CONNECT){
            this._io.on(event, (socket) => {
                let csocket = new CSocket(socket);
                this._sockets.add(csocket);
                for(let event of this._to_broadcast){
                    csocket.on(event, (...args) => {
                        this.emit(event, ...args);
                    });
                }
                callback(csocket);
            });
            return;
        }
        else{
            throw new Error("invalid event " + event);
        }
    }

    emit(event, ...args){
        if(event === EVENTS.CHAT.MESSAGE){
            if (args.length !== 3) throw new Error("invalid number of arguments, expected timestamp, username and message");
            let [timestamp, username, message] = args;
            this._io.emit(event, {timestamp, username, message});
        }
        else if(event === EVENTS.CHAT.USER_JOINED || event === EVENTS.CHAT.USER_LEFT){
            if (args.length !== 2) throw new Error("invalid number of arguments, expected timestamp and username");
            let [timestamp, username] = args;
            this._io.emit(event, {timestamp, username});
        }
        else if(event === EVENTS.GAME.USER_JOINED || event === EVENTS.GAME.USER_LEFT){
            if (args.length !== 2) throw new Error("invalid number of arguments, expected timestamp and username");
            let [timestamp, username] = args;
            this._io.emit(event, {timestamp, username});
        }
        else if(event === EVENTS.GAME.START || event === EVENTS.GAME.END || event === EVENTS.GAME.DATA){
            if (args.length !== 2) throw new Error("invalid number of arguments, expected timestamp and data");
            let [timestamp, data] = args;
            this._io.emit(event, {timestamp, data});
        }
        else{
            throw new Error("invalid event " + event);
        }
    }

    on_event_broadcast(event){
        this._to_broadcast.add(event);
        for(let socket of this._sockets){
            socket.on(event, (...args) => {
                this.emit(event, ...args);
            });
        }
    }
}

try{
    module.exports = { EVENTS, Room, CIO, CSocket };
}
catch(e){
    // we are loading it in the browser
}