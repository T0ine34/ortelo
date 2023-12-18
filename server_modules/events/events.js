const { set } = require('../settings/main');

settings = require('../settings/main.js');

/**
 * @description Contains the events that can be sent between the client and the server.
 * @author Antoine Buirey
 * @module ServerEvents
 * @category Server
 */

/**
 * @description This namespace can contains events that can be sent between the client and the server, and other namespaces.
 * This class is not meant to be used directly, use {@link Server.Events.EVENTS}, witch is an instance of this class instead.
 */
class EVENTS_NAMESPACE{
    /**
     * @description Create a new namespace from a node.
     * @param {Object} node - The that will be used to create the namespace.
     * @param {string} node_name - The name of the namespace.
     */
    constructor(node, node_name = "EVENTS"){
        this.string = node_name.toLowerCase();
        this.description = "";
        for(let key in node){
            if(key === "type"){
                continue;
            }
            else if(key === "description"){
                this.description = node[key];
            }
            else{
                if(!"type" in node[key]){
                    throw new Error("Missing type in node " + key);
                }
                if(node[key].type == "event"){
                    this[key] = new EVENT(node[key], this.string+'::'+key.toLowerCase());
                }
                else if(node[key].type == "namespace"){
                    this[key] = new EVENTS_NAMESPACE(node[key], this.string+'::'+key.toLowerCase());
                }
                else{
                    throw new Error("Unknown type " + node[key].type + " in node " + key);
                }
            }
        }
    }

    /**
     * @description Return the name of the namespace.
     * @returns {string} The name of the namespace.
     * @description this method is automatically called when the object is converted to a string.
     */
    toString(){
        return this.string;
    }

    /**
     * @description return true if the event is in the namespace, false otherwise.
     * @param {EVENT|EVENTS_NAMESPACE} event - The event to check.
     * @returns {boolean} true if the event is in the namespace, false otherwise.
     */
    has(event){
        if(!event instanceof EVENT && !event instanceof EVENTS_NAMESPACE) throw new Error("event is not an EVENT Object or an EVENTS_NAMESPACE Object");
        return event.string.startsWith(this.string);
    }
}

/**
 * @description This class represent an event that can be sent between the client and the server.
 * This class is not meant to be used directly, use {@link ServerModules.ServerEvents.EVENTS} instead, witch is an instance of {@link ServerModules.ServerEvents.EVENTS_NAMESPACE}, and contains all the events that can be sent between the client and the server.
 */
class EVENT{
    /**
     * @description Create a new event from a node.
     * @param {Object} node - The that will be used to create the event.
     * @param {string} node_name - The name of the event.
     */
    constructor(node, node_name){
        this.string = node_name;
        this.description = "";
        this.payload = [];
        this.server_to_client = false; //this mean that the original event was sent from the server to the client (if this is false, a server can still transmit the event to the client, he should just not generate it)
        this.client_to_server = false; //this mean that the original event was sent from the client to the server ( if this is false, this event can only be sent by the server, never by the client)
        if("description" in node){
            this.description = node["description"];
        }
        if("payload" in node){
            for(let arg of node["payload"]){
                if(!"name" in arg){
                    throw new Error("Missing name in arg " + arg);
                }
                if(!"type" in arg){
                    throw new Error("Missing type in arg " + arg);
                }
                this.payload.push(arg);
            }
        }
        if("server_to_client" in node){
            this.server_to_client = node["server_to_client"];
        }
        if("client_to_server" in node){
            this.client_to_server = node["client_to_server"];
        }
        if("internal" in node && node["internal"]){
            let tokens = this.string.split("::");
            this.string = tokens[tokens.length - 1]; //remove the namespace
        }
    }

    /**
     * @description Return the name of the event.
     * @returns {string} The name of the event.
     * @description this method is automatically called when the object is converted to a string.
     */
    toString(){
        return this.string;
    }
}

/**
 * @description This instance of {@link ServerModules.ServerEvents.EVENTS_NAMESPACE} contains all the events that can be sent between the client and the server.
 * Accessing a property of this object will return an {@link ServerModules.ServerEvents.EVENT} or a {@link ServerModules.ServerEvents.EVENTS_NAMESPACE} object.
 * @instance
 * @example
 * socket.emit(EVENTS.CHAT.JOINED, "username");
 * 
 */
let EVENTS = new EVENTS_NAMESPACE(require("../../"+settings.get("public_common_dir") + "/assets/ressources/events.json"));
Object.freeze(EVENTS);
module.exports = { EVENTS, EVENT, EVENTS_NAMESPACE };
