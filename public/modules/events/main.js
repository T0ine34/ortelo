//this is the client-side of the events module

class CSocket{
    constructor(socket){
        if(!socket) throw new Error("socket is undefined");
        this._socket = socket;
    }

    get id(){
        return this._socket.id;
    }

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
    on(event, callback){
        if(event == undefined) throw new Error("event is undefined");
        if(!event instanceof EVENT) throw new Error("event is not an EVENT Object");
        if(!event.server_to_client) throw new Error("event " + event + " cannot be received by the client");
        this._socket.on(String(event), callback);
    }

    once(event, callback){
        if(event == undefined) throw new Error("event is undefined");
        if(!event instanceof EVENT) throw new Error("event is not an EVENT Object");
        if(!event.server_to_client) throw new Error("event " + event + " cannot be received by the client");
        this._socket.once(String(event), callback);
    }
}