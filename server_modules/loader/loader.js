const fs = require('fs');
const JSZip = require('jszip');
const { Game } = require('./game');

class GameLoader {
    
    constructor(path="./public/games/") {
        this._path = path
        this._jsZip = new JSZip()
        this._gameFiles = []
    }

    getFiles() {
        let data = fs.readdirSync(this._path);
        for(let i = 0; i < data.length; i++){
            this._gameFiles.push(`${this._path}${data[i]}`)
        }
    }


    readAGame(filePath) {
        (new Game(filePath)).init()
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

try {
    module.exports = { GameLoader }
} catch (e){}