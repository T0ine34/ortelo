const fs = require('fs');
const JSZip = require('jszip');

class Game {

    constructor(gamePath){
        this._gamePath = gamePath;
        this._jsZip = new JSZip()
    }

    init() {
        let self = this
        // PENSER A CHECK L'INTEGRITE DU INDEX.JSON
        // SI IL Y A UN DOSSIER SOUNDS MAIS PAS DE CHEMIN DANS 
        // L'INDEX.JSON, ERREUR (c'est un exemple)
        let data = fs.readFileSync(this._gamePath);
        this._jsZip.loadAsync(data).then(function (gameDir) {
            gameDir.file("index.json").async("string").then(function (indexData) {
                let jsonData = JSON.parse(indexData)
                console.log(jsonData.name)
            })
        });
    }

}

try {
    module.exports = {Game}
} catch(e){}