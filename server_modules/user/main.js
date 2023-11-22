const { EVENTS, Room, CSocket } = require('../events/main.js');
const { Socket } = require("socket.io");

/**
 * @classdesc This class represent a user connected to the server. It contains the socket of the user and the rooms he is in.
 * @author Jebril Boufrour, Antoine Buirey
 * @memberof Server
 */
class User{
    /**
     * @constructor
     * @param {CSocket | Socket} socket The socket of the user (can be a {@link ServerSocket.CSocket CSocket} or a {@link https://socket.io/docs/v4/server-api/#socket Socket}; if it's a Socket, it will be converted to a CSocket)
     * @param {string} username The username of the user
     * @author Jebril Boufrour, Antoine Buirey
     */
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

    /**
     * @description An array of the rooms the user is in
     * @type {Room[]}
     * @readonly
     */
    get rooms() {
        return this._rooms;
    }

    /**
     * @description The username of the user
     * @type {string}
     * @readonly
     */
    get username() {
        return this._username;
    }

    /**
     * @description The socket of the user, will always be a {@link ServerSocket.CSocket}, regadless of the type of socket passed in the constructor
     * @type {CSocket}
     * @readonly
     */
    get socket() {
        return this._socket;
    }

    /**
     * @description emit an event to the user
     * @param {string} event The name of the event to emit
     * @param  {...any} args The arguments to pass to the event
     * @see {@link ServerSocket.CSocket#emit CSocket.emit}
     */
    emit(event, ...args) {
        this._socket.emit(event, ...args);
    }
    /**
     * @description add a listener to an event
     * @param {string} event The name of the event to listen to
     * @param {Function} callback The callback to call when the event is emitted
     * @see {@link ServerSocket.CSocket#on CSocket.on} 
     */
    on(event, callback) {
        this._socket.on(event, callback);
    }
    /**
     * @description add a listener to an event, but it will be called only once
     * @param {string} event The name of the event to listen to
     * @param {Function} callback The callback to call when the event is emitted
     * @see {@link ServerSocket.CSocket#once CSocket.once}
     */
    once(event, callback) {
        this._socket.once(event, callback);
    }

    /**
     * @description Method for joining a room
     * @param {Room} room The room to join
     * @throws {Error} If the supplied object is not an instance of the Room class
     */
    joinRoom(room) {
        if (room instanceof Room) {
            this._socket.join(room);
            this._rooms.set(room.name, room);
        } else {
            throw new Error("The supplied object is not an instance of the Room class.");
        }
    }

    /**
     * @description Method for leaving a room
     * @param {Room} room The room to leave
     * @throws {Error} If the supplied object is not an instance of the Room class
     */
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