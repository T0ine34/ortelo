const fs = require('fs');
const path = require('path');

const Logger = require('../logs/logger');

class Game {
    constructor(gameFiles, gameName) {
        this._gameFiles = gameFiles;
        this._name = gameName;
        // Initialisation des variables pour stocker les contenus des fichiers
        this._iconData = null;
        this._htmlData = null;
        this._cssData = null;
        this._jsData = null;
        this._serverData = null;
    }

    async init() {
        try {
            const indexPath = 'index.json';

            if (!this._gameFiles[indexPath]) {
                throw new Error(indexPath + ' not found in game files; avaliable files are : ' + Object.keys(this._gameFiles).join(', '));
            }

            const jsonData = JSON.parse(this._gameFiles[indexPath].toString('utf8'));
            Logger.debug("Data loaded from " + indexPath + " : " + JSON.stringify(jsonData), null, 2);
            this._name = jsonData.name || "Unknown Name";

            // Stocker le contenu des fichiers en mémoire
            this._htmlData = this._gameFiles[jsonData.html]?.toString('utf8');
            this._cssData = this._gameFiles[jsonData.css]?.toString('utf8');
            this._jsData = this._gameFiles[jsonData.mainscript]?.toString('utf8');
            this._serverData = this._gameFiles[jsonData.server]?.toString('utf8');

            // Gérer l'icône
            if (!jsonData.images || !jsonData.images.icon) {
                throw new Error("Icon not referenced in index.json");
            }
            let iconPath = 'images/' + jsonData.images.icon;
            if (this._gameFiles[iconPath]) {
                this._iconData = this._gameFiles[iconPath];
            } else {
                throw new Error("Icon not found");
            }
        } catch (error) {
            Logger.warning("Cannot load game '" + this._name + "' : " + error.message);
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