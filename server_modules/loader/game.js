const fs = require('fs');
const path = require('path');

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
            const gameFolderPrefix = this._name + '/';
            const indexPath = gameFolderPrefix + 'index.json';

            if (!this._gameFiles[indexPath]) {
                throw new Error(indexPath + ' not found in game files');
            }

            const jsonData = JSON.parse(this._gameFiles[indexPath].toString('utf8'));
            this._name = jsonData.name || "Unknown Name";

            // Stocker le contenu des fichiers en mémoire
            this._htmlData = this._gameFiles[gameFolderPrefix + jsonData.html]?.toString('utf8');
            this._cssData = this._gameFiles[gameFolderPrefix + jsonData.css]?.toString('utf8');
            this._jsData = this._gameFiles[gameFolderPrefix + jsonData.mainscript]?.toString('utf8');
            this._serverData = this._gameFiles[gameFolderPrefix + jsonData.server]?.toString('utf8');

            // Gérer l'icône
            let iconPath = gameFolderPrefix + 'images/' + jsonData.images.icon;
            if (this._gameFiles[iconPath]) {
                this._iconData = this._gameFiles[iconPath];
            } else {
                throw new Error("Icon not found");
            }
        } catch (error) {
            console.error("Error during game initialization:", error);
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