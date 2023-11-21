const fs = require("fs");

function get_bwn(mainstring, start_char, end_char){
    //return all strings that are between a start and an end character (theses can be the same)
    if(!mainstring instanceof String){
        throw new Error("mainstring must be a string");
    }
    let result = [];
    let start = 0;
    let end = 0;
    while(true){
        start = mainstring.indexOf(start_char, end);
        if(start == -1){
            break;
        }
        end = mainstring.indexOf(end_char, start+1);
        if(end == -1){
            break;
        }
        result.push(mainstring.substring(start+1, end));
    }
    return result;
}

class Settings{
    constructor(filepath){
        try{
            this._data = JSON.parse(fs.readFileSync(filepath));
        }
        catch(e){
            throw new Error("Error while reading settings file : " + e);
        }
    }

    get(key){

        let tokens = key.split(".");
        let current = this._data;
        for(let i = 0; i < tokens.length-1; i++){
            if(current[tokens[i]]){ //if the key exists
                current = current[tokens[i]];
            }
            else{
                throw new Error("Key not found in settings file : " + key);
            }
        }

        let value = current[tokens[tokens.length-1]];
        if(typeof value == "string"){
            let subkeys = get_bwn(value, "%", "%");
            for(let i = 0; i < subkeys.length; i++){
                value = value.replace("%" + subkeys[i] + "%", this.get(subkeys[i]));
            }
        }
        return value;
    }

    set(key, value){
        this._data[key] = value;
    }

    delete(key){
        delete this._data[key];
    }

    save(filepath){
        try{
            fs.writeFileSync(filepath, JSON.stringify(this._data));
        }
        catch(e){
            throw new Error("Error while writing settings file : " + e);
        }
    }

    is_set(key){
        let tokens = key.split(".");
        let current = this._data;
        for(let i = 0; i < tokens.length-1; i++){
            if(current[tokens[i]]){ //if the key exists
                current = current[tokens[i]];
            }
            else{
                return false;
            }
        }
        return current[tokens[tokens.length-1]] != undefined;
    }
}

module.exports = { Settings };