const { logger }    = require('../logs/main');
const {json} = require("express");

class Game {
    constructor(gameFiles, gameName) {
        this._gameFiles = gameFiles;
        this._name = gameName;

        // Variables pour stocker les contenus des fichiers en mémoire
        this._iconData = null;
        this._htmlData = null;
        this._cssData = null;
        this._jsData = null;
        this._serverData = null;
    }

    async init() {
        try {

            // Supposons que index.json est stocké en tant que chaîne JSON dans _gameFiles
            // Attention quand vous compressez le rar faut compresser que les fichiers pas le dossier
            if (!this._gameFiles['index.json']){
                throw new Error('index.json not found in game files; available files are : ' + Object.keys(this._gameFiles).join(', '));
            }
            const jsonData = JSON.parse(this._gameFiles['index.json']);
            logger.debug("Data loaded from index.json : " + JSON.stringify(jsonData), null, 2);
            // Stocker le contenu des fichiers en mémoire
            this._htmlData = jsonData.html ? this._gameFiles[jsonData.html] : null;
            this._cssData = jsonData.css ? this._gameFiles[jsonData.css] : null;
            this._jsData = jsonData.mainscript ? this._gameFiles[jsonData.mainscript] : null;
            this._serverData = jsonData.server ? this._gameFiles[jsonData.server] : null;
            // Gestion de l'icône
            if (jsonData.images && jsonData.images.icon) {
                let iconPath = jsonData.images.icon;
                this._iconData = this._gameFiles[iconPath] || null;
            } else {
                throw new Error("Icon not referenced in index.json");
            }
        } catch (error) {
            logger.warning("Cannot load game '" + this._name + "' : " + error.message);
        }
    }
    // Getters pour accéder aux données des fichiers
    get name() {
        return this._name;
    }

    get iconData() {
        return this._iconData;
    }

    get htmlData() {
        return this._htmlData;
    }

    get cssData() {
        return this._cssData;
    }

    get jsData() {
        return this._jsData;
    }

    get serverData() {
        return this._serverData;
    }
}

module.exports = { Game };