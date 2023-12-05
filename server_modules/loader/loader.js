const fs = require('fs');
const JSZip = require('jszip');
const path = require('path');
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

    constructor(pathToGames="./public/games/") {
        this._pathToGames = pathToGames;
        this._jsZip = new JSZip();
        this._gamesData = {};
    }

    async loadAllGames() {
        let files = fs.readdirSync(this._pathToGames);
        await Promise.all(files.map(async file => {
            if (file.endsWith('.game') && file !== 'gamename.game') {
                await this.unzipAndLoadGame(file);
            }
        }));
    }

    async unzipAndLoadGame(zipFileName) {
        try {
            let zipFilePath = path.join(this._pathToGames, zipFileName);
            let data = fs.readFileSync(zipFilePath);
            let zip = await this._jsZip.loadAsync(data);
            let gameName = zipFileName.split('.')[0];
            let gameFiles = {};

            await Promise.all(Object.keys(zip.files).map(async fileName => {
                const fileData = await zip.files[fileName].async('nodebuffer');
                if (!fileName.endsWith('/')) {
                    gameFiles[fileName] = fileData;
                }
            }));
            let game = new Game(gameFiles, gameName);
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