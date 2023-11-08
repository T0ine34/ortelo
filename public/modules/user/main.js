const { EVENTS, Room, CSocket } = require('../events/main');


class User extends CSocket {
    constructor(socket, username) {
        super(socket);               // Calling the CSocket parent class constructor
        this._username = username;   // User name
        this._rooms = new Map();      // Map of rooms the user is in

    }

    get username() {
        return this._username;
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