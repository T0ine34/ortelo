const { json } = require('express');
const fs       = require('fs');

function is_json(filepath) {
    try {
        JSON.parse(fs.readFileSync(filepath));
    } catch (e) {
        console.log(e);
        return false;
    }
    return true;
}

const STRUCTURES = "./json_structures/";

function get_structure_name(json_filepath){
    let splitted = json_filepath.split(".");
    splitted[splitted.length-1] = "structure";
    splitted = splitted.join(".").split("/");
    return STRUCTURES+splitted[splitted.length-1];
}

function is_json_matching(filepath, structure_filepath = null){
    if(!structure_filepath) structure_filepath = get_structure_name(filepath);
    
    if(!is_json(filepath)) return false;
    if(!is_json(structure_filepath)) return false;
    let file = fs.readFileSync(filepath);
    let structure = fs.readFileSync(structure_filepath);
    

    let file_json = JSON.parse(file);
    let structure_json = JSON.parse(structure);

    //types : int, float, string, boolean, dict, undefined_dict, list, null


    function explore_node(node, structure_node, rec_level){
        //node is an part of the json file
        //structure_node is the corresponding part of the structure file
        //return true if the node is valid, false otherwise
        let type = structure_node.type;
        if(type == "int" || type == "float"){
            if(typeof node != "number") return false;
            if(structure_node.min && node < structure_node.min) return false;
            if(structure_node.max && node > structure_node.max) return false;
        }
        else if(type == "string"){
            if(typeof node != "string") return false;
            if(structure_node.min_length && node.length < structure_node.min_length) return false;
            if(structure_node.max_length && node.length > structure_node.max_length) return false;
        }
        else if(type == "boolean"){
            if(typeof node != "boolean") return false;
        }
        else if(type == "dict"){ //a dict is a list with defined required keys
            if(typeof node != "object") return false;
            if(!structure_node.content) throw new Error("Dict must have a content"); //if the content is not defined
            for(let key in structure_node.content){
                if(!key in node && structure_node.content[key].required) return false; //if the key is required but not in the node
                let res = explore_node(node[key], structure_node.content[key], rec_level+1);
                if(!res) return false;
            }
        }
        else if(type == "undefined_dict"){ //a undefined dict is a list with undefined required keys
            //every subnode of the node must match the template
            if(typeof node != "object") return false;
            if(!structure_node.content_template) throw new Error("Undefined dict must have a content_template"); //if the template is not defined
            for(let key in node){
                if(!structure_node.content_template) return false; //if the key is not in the structure
                let res = explore_node(node[key], structure_node.content_template, rec_level+1);
                if(!res) return false;
            }
        }
        else if(type == "list"){
            if(!Array.isArray(node)) return false;
            if(!structure_node.content_template) throw new Error("List must have a content_template"); //if the template is not defined
            for(let i = 0; i < node.length; i++){
                let res = explore_node(node[i], structure_node.content_template, rec_level+1);
                if(!res) return false;
            }
        }
        else if(type == "null"){
            if(node != null) return false;
        }
        else{
            console.log(structure_node);
            throw new Error("Unknown type \"" + type + "\" in structure file");
        }
        return true;
    }

    try{
        return explore_node(file_json, structure_json, 0);
    }
    catch(e){
        throw new Error("Error while exploring the json file at \"" + filepath + "\" using the structure file at \"" + structure_filepath + "\" : " + e.message);
    }
}

module.exports = {is_json, is_json_matching};