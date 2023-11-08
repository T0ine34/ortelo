const { EVENTS, Room, CSocket } = require('../events/main');


class User{
    constructor(socket, username) {
        if (typeof username !== "string") {
            throw new Error("The username must be a string.");
        }
        if(socket instanceof CSocket){
            this._socket = socket;
        }
        else if(socket instanceof Socket){
            this._socket = new CSocket(socket);
        }
        this._username = username;   // User name
        this._rooms = new Map();      // Map of rooms the user is in
    }

    get username() {
        return this._username;
    }

    emit(event, ...args) {
        this._socket.emit(event, ...args);
    }
    on(event, callback) {
        this._socket.on(event, callback);
    }
    once(event, callback) {
        this._socket.once(event, callback);
    }

    //Method for joining a room 
    joinRoom(room) {
        if (room instanceof Room) {
            room.addUser(this);
            this._rooms.set(room.name, room);
            this.emit(EVENTS.GAME.USER_JOINED, this._username);
        } else {
            throw new Error("The supplied object is not an instance of the Room class.");
        }
    }

    // Method for leaving a room
    leaveRoom(room) {
        if (room instanceof Room) {
            room.removeUser(this);
            this._rooms.delete(room.name);
            this.emit(EVENTS.GAME.USER_LEFT, this._username);
        } else {
            throw new Error("The supplied object is not an instance of the Room class.");
        }
    }
}

module.exports = { User };