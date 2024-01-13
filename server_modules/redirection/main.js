const { Settings }  = require('../settings/main');
const fs            = require('fs');
const { Logger }    = require('../logs/main');

let logger = new Logger();
var settings = new Settings("./server.config");

/**
 * @description Contain functions to manage redirections of the server
 * @module Redirection
 * @category Server
 */

function getUserAgent(rawHeaders){
    let userAgent = "";
    for(let i = 0; i < rawHeaders.length; i++){
        if(rawHeaders[i] == "User-Agent"){
            userAgent = rawHeaders[i+1];
            break;
        }
    }
    return userAgent;
}

/**
 * @description returns the platform of the client
 * @param {string[]} rawHeaders
 * @returns {string} the platform of the client
 * @throws {Error} if the platform is unknown (should not happen)
 * @see {@link is_mobile}
 * @see {@link is_desktop}
 */
function getPlatform(rawHeaders){

    let userAgent = getUserAgent(rawHeaders);

    let platform = "unknown";
    if(userAgent.includes("Android")){
        platform = "Android";
    }
    else if(userAgent.includes("iPhone")){ //TODO: check on apple devices
        platform = "iPhone";
    }
    else if(userAgent.includes("iPad")){   //TODO: check on apple devices
        platform = "iPad";
    }
    else if(userAgent.includes("Windows")){
        platform = "Windows";
    }
    else if(userAgent.includes("Macintosh")){ //TODO: check on apple devices
        platform = "Macintosh";
    }
    else if(userAgent.includes("Linux")){
        platform = "Linux";
    }
    else{
        logger.error("unknown platform : " + userAgent);
        throw new Error("unknown platform : " + userAgent);
    }
    
    return platform;
}

/**
 * @description determines if the client is on a mobile device or not
 * @param {string[]} rawHeaders
 * @returns {boolean} true if the client is on a mobile device, false otherwise
 * @see {@link is_desktop}
 */
function is_mobile(rawHeaders){
    return getPlatform(rawHeaders) == "Android" || getPlatform(rawHeaders) == "iPhone" || getPlatform(rawHeaders) == "iPad";
}

/**
 * @description determines if the client is on a desktop device or not
 * @param {string[]} rawHeaders
 * @returns {boolean} true if the client is on a desktop device, false otherwise
 * @see {@link is_mobile}
 */
function is_desktop(rawHeaders){
    return getPlatform(rawHeaders) == "Windows" || getPlatform(rawHeaders) == "Macintosh" || getPlatform(rawHeaders) == "Linux";
}

/**
 * @description returns the folder where the ressource is stored, depending on the platform (this function does not determine if the ressource is a common ressource or not, use {@link is_common_ressource} for that)
 * @param {string[]} rawHeaders
 * @returns {string} the folder where the ressource is stored
 * @throws {Error} if the platform is unknown (should not happen)
 */
function get_platform_folder(rawHeaders){
    if(is_mobile(rawHeaders)){
        return settings.get("public_mobile_dir");
    }
    else if(is_desktop(rawHeaders)){
        return settings.get("public_desktop_dir");
    }
    else{
        logger.error("unknown platform : " + getPlatform(rawHeaders));
        throw new Error("unknown platform : " + getPlatform(rawHeaders));
    }
}

/**
 * @description determines if the ressource is a common ressource or not
 * @param {string} url the url of the ressource, like the one given by req.path
 * @returns {boolean} true if the ressource is a common ressource, false otherwise
 */
function is_common_ressource(url){
    let common_ressources = fs.readdirSync(settings.get("public_common_dir"));
    let foldername = url.split("/")[1];
    return common_ressources.includes(foldername);
}


/**
 * @description builds the url of the requested ressource
 * @param {*} req the req object given by express
 * @returns {string} the url of the requested ressource
 */
function build_url(req){
    let url = req.path;
    if(is_common_ressource(url)){
        return settings.get("public_common_dir") + url;
    }
    else{
        return get_platform_folder(req.rawHeaders) + url;
    }
}
/**
 * @description determines if the url is a special url or not (a special url is a url that have a specific path in the settings file)
 * @param {string} url the url to check, like the one given by req.path
 * @param {string} method the method of the request (GET, POST, ...)
 * @returns {boolean} true if the url is a special url, false otherwise
 * @see {@link get_special_url}
 */
function is_special_url(url, method){
    return settings.has("paths." + method) && url in settings.get("paths." + method);
}

/**
 * @description returns the path of the special url
 * @param {string} url the url to check, like the one given by req.path
 * @param {string} method the method of the request (GET, POST, ...)
 * @returns {string} the path of the special url
 * @see {@link is_special_url}
 */
function get_special_url(url, method){
    return settings.get("paths." + method+'.'+url+'.path');
}

/**
 * @description returns the url of the 404 page, depending on the platform
 * @param {string[]} rawHeaders
 * @returns {string} the url of the 404 page
 */
function get_404_url(rawHeaders){
    return get_platform_folder(rawHeaders) + '/' + settings.get("default_page");
}

module.exports = {
    getPlatform,
    is_mobile,
    is_desktop,
    get_platform_folder,
    is_common_ressource,
    build_url,
    is_special_url,
    get_special_url,
    get_404_url
};