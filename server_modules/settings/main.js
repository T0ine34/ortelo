const fs                            = require("fs");
const {is_json, is_json_matching}   = require("../json_checker/main");
const JSON5                         = require("json5");
/**
 * @description Contain class to manage settings
 * @module Settings
 * @category Server
 */

/**
 * @description extract a substring from a string between two characters
 * @param {string} mainstring the string to parse
 * @param {string} start_char the start character
 * @param {string} end_char   the end character (can be the same as the start character)
 * @returns {string[]} array of strings that are between a start and an end character
 * @throws {Error} if mainstring is not a string
 * @function
 * @private
 */
function get_bwn(mainstring, start_char, end_char){
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

/**
 * @description a class for managing settings, only one instance per file is allowed, creating a new instance with the same file will return the already existing one
 */
class Settings{

    /**
     * @description constructor for the Settings class
     * @param {string} filepath the path to the settings file (must be a JSON file)
     * @throws {Error} if the file cannot be read
     */
    constructor(filepath, check_integrity = true){

        if(!is_json(filepath)){
            throw new Error("Settings file muse be a JSON file (got '" + filepath + "')");
        }
        if(check_integrity){
            let [res, reason] = is_json_matching(filepath);
            if(!res){
                throw new Error("Error while parsing config.json : " + reason);
            }
        }

        try{
            this._data = JSON5.parse(fs.readFileSync(filepath));
        }
        catch(e){
            throw new Error("Error while reading settings file : " + e);
        }
        this._filepath = filepath;
    }

    /**
     * @description get a value from the settings file
     * @param {string} key the key to get the value of; can be a nested key (e.g. "a.b.c")
     * @returns {string|boolean|number|null|Array} the value of the key
     * @throws {Error} if the key is not found
     * @see {@link Settings#has}
     */
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

    /**
     * @description set a value in the settings file, creating the keys if they do not exist
     * @param {string} key the key to set the value of; can be a nested key (e.g. "a.b.c")
     * @param {String | Boolean | number | null} value the value to set
     * @see {@link Settings#has}
     */
    set(key, value){
        let tokens = key.split(".");
        let current = this._data;
        for(let i = 0; i < tokens.length-1; i++){
            if(current[tokens[i]]){ //if the key exists, go to the next level
                current = current[tokens[i]];
            }
            else{
                current[tokens[i]] = {};// else create the key
                current = current[tokens[i]];
            }
        }
        current[tokens[tokens.length-1]] = value;
    }

    /**
     * @description delete a value in the settings file, does nothing if the key does not exist
     * @param {string} key the key to delete; can be a nested key (e.g. "a.b.c")
     */
    delete(key){
        let tokens = key.split(".");
        let current = this._data;
        for(let i = 0; i < tokens.length-1; i++){
            if(current[tokens[i]]){ //if the key exists, go to the next level
                current = current[tokens[i]];
            }
            else{
                return; //else do nothing, the key does not exist
            }
        }
        delete current[tokens[tokens.length-1]];
    }

    /**
     * @description save the settings file
     * @param {string} filepath the path to the file to save to; if not specified, the file will be saved to the path specified in the constructor
     * @throws {Error} if the file cannot be written
     */
    save(filepath = this._filepath){
        try{
            fs.writeFileSync(filepath, JSON5.stringify(this._data));
        }
        catch(e){
            throw new Error("Error while writing settings file : " + e);
        }
    }

    /**
     * @description check if a key exists in the settings file
     * @param {string} key the key to check; can be a nested key (e.g. "a.b.c")
     * @returns {boolean} true if the key exists, false otherwise
     */
    has(key){
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