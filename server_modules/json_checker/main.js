const fs       = require('fs');

/**
 * @description contains JSON-related functions
 * @module JsonChecker
 * @category Server
 * @author Antoine Buirey
 * @since 0.2.1
 */

/**
 * this function checks if a file is a json file, regardless of it's extension
 * @param {string} filepath the path to the file
 * @returns true if the file is a json file, false otherwise
 * @throws an error if the file is not a json file
 * @author Antoine Buirey
 * @function
 */
function is_json(filepath){
    try {
        JSON.parse(fs.readFileSync(filepath));
    } catch (e) {
        console.log(e);
        return false;
    }
    return true;
}

const STRUCTURES = "./json_structures/"; //the folder to store the structure files


/**
 * this function returns the structure name corresponding to the json file
 * 
 * example : if the json file is "./jsons/players/players.json", the structure file is "./json_structures/players.json.structure"
 * @param {string} json_filepath the path to the json file
 * @description a string containing the path to the structure file
 * @author Antoine Buirey
 * @function
 * @private
 */
function get_structure_name(json_filepath){
    let tokens = json_filepath.split("/");
    let filename = tokens[tokens.length-1];
    let structure_name = filename + ".structure";
    return STRUCTURES + structure_name;
}

/**
 * @typedef {object} json_matching_result
 * @description an object containing the result of the json matching (this is an array only returned by the function {@link is_json_matching})
 * @property {boolean} result the given file match the structure
 * @property {string} reason the reason it does not match the structure (empty if it does)
 * @author Antoine Buirey
 */

/**
 * this function checks if a json file matches a given structure file
 * 
 * if no structure file is given, the function will try to find the corresponding structure file
 * @param {string} filepath the path to the json file
 * @param {string|null} structure_filepath the path to the structure file (if null, the function will try to find the corresponding structure file)
 * @returns {json_matching_result} an array containing a boolean indicating if the node is valid and a string containing the error message if the node is not valid (empty if the node is valid)
 * @author Antoine Buirey
 * @function
 */
function is_json_matching(filepath, structure_filepath = null){
    if(!structure_filepath) structure_filepath = get_structure_name(filepath);
    
    if(!is_json(filepath)) return [false, "the given file is not a json file"]; //check if the given file is a json file
    if(!is_json(structure_filepath)) return [false, "the given structure file is not a json file"]; //check if the given structure file is a json file
    let file = fs.readFileSync(filepath);
    let structure = fs.readFileSync(structure_filepath);
    

    let file_json = JSON.parse(file);
    let structure_json = JSON.parse(structure);

    /**
     * internal function that explores recursivly a node of the json file
     * @param {boolean|number|string|object|null} node the node to explore
     * @param {string} node_name the name of the node, used to debug if needed
     * @param {object} structure_node the corresponding node of the structure file
     * @param {number} rec_level the current recursion level, used to debug if needed
     * @returns {array} an array containing a boolean indicating if the node is valid and a string containing the error message if the node is not valid
     * @description the returned string is empty if the node is valid
     * @function
     * @private
     */
    function explore_node(node, node_name, structure_node, rec_level){
        //node is an part of the json file
        //structure_node is the corresponding part of the structure file
        //return true if the node is valid, false otherwise
        let type = structure_node.type;
        if(type == "int" || type == "float"){
            if(typeof node != "number") return [false, "the node \"" + node_name + "\" is not a number"];
            if(structure_node.min && node < structure_node.min) return [false, "the node \"" + node_name + "\" is smaller than the minimum value"];
            if(structure_node.max && node > structure_node.max) return [false, "the node \"" + node_name + "\" is bigger than the maximum value"];
            if(structure_node.values != null && !structure_node.values.includes(node)) return [false, "the node \"" + node_name + "\" is not in the list of values"];
        }
        else if(type == "string"){
            if(typeof node != "string") return [false, "the node \"" + node_name + "\" is not a string"];
            if(structure_node.min_length && node.length < structure_node.min_length) return [false, "the node \"" + node_name + "\" is smaller than the minimum length"];
            if(structure_node.max_length && node.length > structure_node.max_length) return [false, "the node \"" + node_name + "\" is bigger than the maximum length"];
            if(structure_node.values != null && !structure_node.values.includes(node)) return [false, "the node \"" + node_name + "\" is not in the list of values"];
        }
        else if(type == "boolean"){
            if(typeof node != "boolean") return [false, "the node \"" + node_name + "\" is not a boolean"];
        }
        else if(type == "dict"){ //a dict is a list with defined required keys
            if(typeof node != "object") return [false, "the node \"" + node_name + "\" is not a dict"];
            if(!structure_node.content) throw new Error("Dict must have a content"); //if the content is not defined
            for(let key in structure_node.content){
                if(!key in node && structure_node.content[key].required) return [false, "the node \"" + node_name + "\" does not have the required key \"" + key + "\""]; //if the key is required but not in the node
                let [res, reason] = explore_node(node[key], node_name+"."+key, structure_node.content[key], rec_level+1);
                if(!res) return [false, reason];
            }
        }
        else if(type == "undefined_dict"){ //a undefined dict is a list with undefined required keys
            //every subnode of the node must match the template
            if(typeof node != "object") return [false, "the node \"" + node_name + "\" is not a dict"];
            if(!structure_node.content_template) throw new Error("Undefined dict must have a content_template"); //if the template is not defined
            for(let key in node){
                if(!structure_node.content_template) return [false, "the node \"" + node_name + "\" has the key \"" + key + "\" that is not in the structure"]; //if the key is not in the structure
                let [res,reason] = explore_node(node[key], node_name+"."+key, structure_node.content_template, rec_level+1);
                if(!res) return [false, reason];
            }
        }
        else if(type == "list"){
            if(!Array.isArray(node)) return [false, "the node \"" + node_name + "\" is not a list"];
            if(!structure_node.content_template) throw new Error("List must have a content_template"); //if the template is not defined
            for(let i = 0; i < node.length; i++){
                let [res,reason] = explore_node(node[i], node_name+"."+i, structure_node.content_template, rec_level+1);
                if(!res) return [false, reason];
            }
        }
        else if(type == "null"){
            if(node != null) return [false, "the node \"" + node_name + "\" is not null"];
        }
        else{
            console.log(structure_node);
            throw new Error("Unknown type \"" + type + "\" in structure file");
        }
        return [true, ""];
    }

    try{
        return explore_node(file_json, "root", structure_json, 0);
    }
    catch(e){
        throw new Error("Error while exploring the json file at \"" + filepath + "\" using the structure file at \"" + structure_filepath + "\" : " + e.message);
    }
}

module.exports = {is_json, is_json_matching};