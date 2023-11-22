/**
 * @fileoverview this file contain a class to load a game from a zip file
 */

const { json } = require('express');
const fs       = require('fs');
const JSZip    = require('jszip');

/**
 * @classdesc this class represent a game, loaded from a zip file
 * @author Lila Brandon
 */
class Game {

    /**
     * @constructor
     * @param {string} gamePath the path to the zip file
     * @description this constructor create a game object, but you need to call the init method to load the game
     * @author Lila Brandon
     */
    constructor(gamePath){
        this._gamePath = gamePath;
        this._name = "null";
        this._icon = "null";
        this._jsZip = new JSZip();
    }

    /**
     * @description this method load the game from the zip file, allowing to read game data
     * @author Lila Brandon
     */
    async init() {
        // PENSER A CHECK L'INTEGRITE DU INDEX.JSON
        // SI IL Y A UN DOSSIER SOUNDS MAIS PAS DE CHEMIN DANS 
        // L'INDEX.JSON, ERREUR (c'est un exemple)
        let zipData = fs.readFileSync(this._gamePath);
        const gameFiles = await this._jsZip.loadAsync(zipData);
        const jsonData = JSON.parse(await gameFiles.file("index.json").async("string"));
            
        const name = jsonData.name;
        if(!name) throw new Error("No name for this game " + this._gamePath);
        this._name = name;

        let icon = gameFiles.file(jsonData.icon);
        if(icon) this._icon = await icon.async("uint8array");

        let base64String = btoa(String.fromCharCode.apply(null, zipData));
        this._icon = base64String;
    }

    /**
     * @description access to the icon of the game as a base64 string
     * @returns {string} the icon of the game
     * @readonly
     * @author Lila Brandon
     */
    get icon(){
        return this._icon;
    }

    /**
     * @description access to the name of the game
     * @returns {string} the name of the game
     * @readonly
     * @author Lila Brandon
     */
    get name() {
        return this._name;
    }

}

module.exports = {Game};
