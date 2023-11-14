const { json } = require('express');
const fs = require('fs');
const JSZip = require('jszip');

class Game {

    constructor(gamePath){
        this._gamePath = gamePath;
        this._name = "null";
        this._icon = "null";
        this._jsZip = new JSZip();
    }

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

    get icon(){
        return this._icon;
    }

    get name() {
        return this._name;
    }

}

module.exports = {Game};
