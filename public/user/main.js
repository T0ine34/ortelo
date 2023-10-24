const { EVENTS, Room, CIO, CSocket } = require('../modules/events/main');


class User extends CSocket {
    constructor(socket, id, username) {
        super(socket);               // Calling the CSocket parent class constructor
        this._id = id;               // Unique user ID
        this._username = username;   // User name
        this._currentRoom = null;    // The current room that the user has joined
   
 
    }

    get id() {
        return this._id;
    }

    
    get username() {
        return this._username;
    }

    //Method for joining a room 
    joinRoom(room) {
        if (room instanceof Room) {

            /* 
Si l'utilisateur est déjà dans une salle (`_currentRoom` est défini), 
il doit d'abord quitter cette salle avant de pouvoir en rejoindre une autre. 
Cela garantit qu'un utilisateur ne peut être dans plusieurs salles simultanément.
*/

            /*if (this._currentRoom) {
                this.leaveRoom(this._currentRoom);
            }*/
            this._currentRoom = room;
            room.addUser(this);
            this.emit(EVENTS.GAME.USER_JOINED, this._username);
        } else {
            throw new Error("The supplied object is not an instance of the Room class.");
        }
    }

    // Method for leaving a room
    leaveRoom(room) {
        if (room instanceof Room && this._currentRoom === room) {
            room.removeUser(this);
            this._currentRoom = null;
            this.emit(EVENTS.GAME.USER_LEFT, this._username);
        } else {
            throw new Error("The user is not in this room or the supplied object is not an instance of the Room class.");
        }
    }
}

