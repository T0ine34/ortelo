const fs = require('fs');
const JSZip = require('jszip');


class GameLoader {
    
    constructor(path="../../games/") {
        this._path = path
        this._jsZip = new JSZip()
        this._gameFiles = []
    }

    getFiles() {
        fs.readdir(this._path, (err, data) => {
            if(err) throw err
            for(let i = 0; i < data.length; i++){
                this._gameFiles.push(`${this._path}${data[i]}`)
            }
        })
    }


    readAGame(filePath) {
        fs.readFile(filePath, (err, data) => {
            if (err) throw err;

            this._jsZip.loadAsync(data).then(function (zipFile) {
                
            });

        });
    }

    addGameToApp(filePath){
        fs.readFile(filePath, (err, data) => {
            if (err) throw err;

            this._jsZip.loadAsync(data).then(function (zipFile) {

                // TODO CREATE HTML ELEMENTS

            });

        });
    }

    get gameFiles() {
        return this._gameFiles;
    }
    

}

try {
    module.exports = { GameLoader }
} catch (e){}