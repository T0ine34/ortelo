//! this is not completed yet, and is not ready for use
//! this may be subject to major changes

const EVENTS = Object.freeze({
    CHAT : {
        MESSAGE: 'chat:message',            //a message has been sent or received
            // data : {(timestamp), (username), (message)}
        USER_JOINED:  'chat:user_joined',   //a user has joined the chat
            //data : {(timestamp), (username)}
        USER_LEFT:  'chat:user_left',       //a user has left the chat
            //data : {(timestamp), (username)}
    },
    GAME : {
        USER_JOINED:  'game:user_joined',   //a user has joined the game
            //data : {(timestamp), (username)}
        USER_LEFT: 'game:user_left',       //a user has left the game
            //data : {(timestamp), (username)}
        START:  'game:start',               //the game has started
            //data : {(timestamp), [...data]}              //data is dependant on the game, may be null
        END:  'game:end',                   //the game has ended
            //data : {(timestamp), [...data]}              //data is dependant on the game, may be null
        DATA: 'game:data',                  //this is used for sending data to the game, this will depend on the game
            //data : {(timestamp), [...data]}              //data is dependant on the game, may be null
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
        this._banned = new Set();
    }

    addUser(user){
        if(!user instanceof CSocket) throw new Error("user is not a CSocket Object");
        if(this._banned.has(user.id)) return false;
        this._users.add(user);
        return true;
    }    

    removeUser(user){
        if(!user instanceof CSocket) throw new Error("user is not a CSocket Object");
        this._users.delete(user);
    }

    get name(){
        return this._name;
    }

    get users(){
        return this._users;
    }

    kick(user){
        if(!user instanceof CSocket) throw new Error("user is not a CSocket Object");
        this._users.delete(user);
        user.leave(this);
    }

    ban(user){
        if(!user instanceof CSocket) throw new Error("user is not a CSocket Object");
        this._banned.add(user.id);
        this._users.delete(user);
        user.leave(this);
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
            this._socket.emit(event, {timestamp: Date.now(), username});
            return;
        }
        if(event === EVENTS.GAME.START || event === EVENTS.GAME.END || event === EVENTS.GAME.DATA){
            this._socket.emit(event, {timestamp: Date.now(), data: args});
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
        throw new Error("invalid event " + event);
    }

    disconnect(){
        this._socket.disconnect();
    }

    join(room){
        if(!room instanceof Room) throw new Error("room is not a Room Object");
        if(this._socket.join(room.name)){
            room.addUser(this);
        }
        else{
            throw new Error("unable to join room " + room.name);
        }
    }

    leave(room){
        this._socket.leave(room);
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