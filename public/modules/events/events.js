//const util = require('util');

class EVENTS_NAMESPACE{
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

    toString(){
        return this.string;
    }

    // [util.inspect.custom](depth, opts){
    //     return this.toString();
    // }
}
class EVENT{
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

    toString(){
        return this.string;
    }

    // [util.inspect.custom](depth, opts){
    //     return this.toString();
    // }

    has(event){
        if(!event instanceof EVENT && !event instanceof EVENTS_NAMESPACE) throw new Error("event is not an EVENT Object or an EVENTS_NAMESPACE Object");
        return event.string.startsWith(this.string);
    }
}

let EVENTS = null;
try{
    //we are in the client
    let request = new XMLHttpRequest();
    request.open('GET', '/events', false);
    request.send(null);
    if (request.status === 200) {
        EVENTS = new EVENTS_NAMESPACE(JSON.parse(request.responseText));
        Object.freeze(EVENTS);
    }
    else{
        throw new Error("Unable to load events.json");
    }
}
catch(err){
    //we are in the server
    EVENTS = new EVENTS_NAMESPACE(require('./events.json'));
    Object.freeze(EVENTS);
    module.exports = { EVENTS, EVENT, EVENTS_NAMESPACE };
}