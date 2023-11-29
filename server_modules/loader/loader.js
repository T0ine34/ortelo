const fs = require('fs');
const JSZip = require('jszip');
const path = require('path');
const { Game } = require('./game');

class GameLoader {

    constructor(pathToGames="./public/games/") {
        this._pathToGames = pathToGames;
        this._jsZip = new JSZip();
        this._gamesData = {};
    }

    async loadAllGames(){
        this.clearUnzippedFolder();
        let files = fs.readdirSync(this._pathToGames);
        await Promise.all(files.map(async file => {
            if (file.endsWith('.game') && file !== 'gamename.game') {
                await this.unzipAndLoadGame(file);
            }
        }));
    }

    clearUnzippedFolder() {
        const unzippedPath = "./public/games/unzipped";
        if (fs.existsSync(unzippedPath)) {
            fs.rmSync(unzippedPath, { recursive: true, force: true });
        }
        fs.mkdirSync(unzippedPath, { recursive: true });
    }

    async unzipAndLoadGame(zipFileName) {
        try {
            let zipFilePath = path.join(this._pathToGames, zipFileName);
            let data = fs.readFileSync(zipFilePath);
            let zip = await this._jsZip.loadAsync(data);
            let gameName = zipFileName.split('.')[0];
            let gamePath = path.join("./public/games/unzipped");

            await Promise.all(Object.keys(zip.files).map(async fileName => {
                const fileData = await zip.files[fileName].async('nodebuffer');
                const filePath = path.join(gamePath, fileName);

                if (fileName.endsWith('/')) {
                    //console.log(`Création du dossier : ${filePath}`);
                    fs.mkdirSync(filePath, { recursive: true });
                    return;
                }

                const dirName = path.dirname(filePath);
                if (!fs.existsSync(dirName)) {
                    //console.log(`Création du dossier parent : ${dirName}`);
                    fs.mkdirSync(dirName, { recursive: true });
                }

                fs.writeFileSync(filePath, fileData);
                //console.log(`Fichier écrit : ${filePath}`);
            }));

            let game = new Game(path.join(gamePath, gameName));
            await game.init();
            this._gamesData[gameName] = game;
        } catch (error) {
            console.error(`Erreur lors de la décompression de ${zipFileName}: ${error}`);
        }
    }


    get gamesData() {
        return this._gamesData;
    }
}

module.exports = { GameLoader };