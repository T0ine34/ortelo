const { EVENTS, Room, CSocket } = require('../events/main.js');
const { Socket } = require("socket.io");


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

    get rooms() {
        return this._rooms;
    }

    get username() {
        return this._username;
    }

    get socket() {
        return this._socket;
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
            this._socket.join(room);
            this._rooms.set(room.name, room);
        } else {
            throw new Error("The supplied object is not an instance of the Room class.");
        }
    }

    // Method for leaving a room
    leaveRoom(room) {
        if (room instanceof Room) {
            room.removeUser(this);
            this._rooms.delete(room.name);
        } else {
            throw new Error("The supplied object is not an instance of the Room class.");
        }
    }
}

module.exports = { User };