/**
 * @description This namespace contain all Socket-related client classes.
 * @namespace ClientSocket
 */

import { EVENTS, EVENT, EVENTS_NAMESPACE } from "./events.js";

/**
 * @classdesc This class is used to send and receive events between the client and the server.
This class is only used on the client side; {@link ServerSocket.CSocket} is used on the server side.
 * @memberof ClientSocket
 */
class CSocket{
    /**
     * @description Create a new CSocket object.
     * @param {Socket} socket - The socket.io socket object.
     */
    constructor(socket){
        if(!socket) throw new Error("socket is undefined");
        this._socket = socket;
    }

    /**
     * @description Return the socket.io socket object.
     * @returns {Socket} The socket.io socket object.
     * @description This method should not be used, it's only here for compatibility with older code.
     * @deprecated
     */
    get id(){
        return this._socket.id;
    }

    /**
     * @description emit a new event to the server.
     * @param {EVENT} event - The event to send.
     * @param {...any} args - The arguments to send with the event.
     * @throws {Error} if the event is undefined.
     * @throws {Error} if the event is not an EVENT object.
     * @throws {Error} if the event cannot be sent by the client.
     */
    emit(event, ...args){
        if(event == undefined) throw new Error("event is undefined");
        if(!event instanceof EVENT) throw new Error("event is not an EVENT Object");
        if(!event.client_to_server) throw new Error("event " + event + " cannot be sent by the client");

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
     * @throws {Error} if the event cannot be received by the client.
     */
    on(event, callback){
        if(event == undefined) throw new Error("event is undefined");
        if(!event instanceof EVENT) throw new Error("event is not an EVENT Object");
        if(!event.server_to_client) throw new Error("event " + event + " cannot be received by the client");
        this._socket.on(String(event), callback);
    }

    /**
     * @description Register a new event listener that will be called only once.
     * @param {EVENT} event - The event to listen to.
     * @param {function} callback - The callback function.
     * @throws {Error} if the event is undefined.
     * @throws {Error} if the event is not an EVENT object.
     * @throws {Error} if the event cannot be received by the client.
     */
    once(event, callback){
        if(event == undefined) throw new Error("event is undefined");
        if(!event instanceof EVENT) throw new Error("event is not an EVENT Object");
        if(!event.server_to_client) throw new Error("event " + event + " cannot be received by the client");
        this._socket.once(String(event), callback);
    }
}

export { CSocket, EVENTS };