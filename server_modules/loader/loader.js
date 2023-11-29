const fs       = require('fs');
const JSZip    = require('jszip');
const { Game } = require('./game');

/**
 * @module Loader
 * @category Server
 * @description this module contains classes to load games from zip files
 * @author Lila Brandon
*/

/**
 * @classdesc this class will create {@link Server.Game} objects from zip files
 * @author Lila Brandon
 */
class GameLoader {
    
    constructor(path="./public/games/") {
        this._path = path;
        this._jsZip = new JSZip();
        this._gameFiles = [];
    }

    getFiles() {
        let data = fs.readdirSync(this._path);
        for(let i = 0; i < data.length; i++){
            this._gameFiles.push(`${this._path}${data[i]}`);
        }
    }


    async readAGame(filePath) {
        let game = new Game(filePath);
        await game.init();
        return game;
    }

    addGameToApp(filePath){

        let data = fs.readFileSync(filePath);
        this._jsZip.loadAsync(data).then(function (zipFile) {
            console.log(zipFile);
        });
    }

    get gameFiles() {
        return this._gameFiles;
    }
    

}


module.exports = { GameLoader };
