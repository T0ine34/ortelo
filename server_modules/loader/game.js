const Logger    = require('../logs/main');

class Game {
    constructor(gameFiles, gameName) {
        this._gameFiles = gameFiles;
        this._name = gameName;
        this._starterFunction = null;

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
            if (!this._gameFiles[this._name+'/'+'index.json']) {
                throw new Error('index.json not found in game files; available files are : ' + Object.keys(this._gameFiles).join(', '));
            }
            const jsonData = JSON.parse(this._gameFiles[this._name+'/index.json']);
            Logger.debug("Data loaded from index.json : " + JSON.stringify(jsonData), null, 2);

            // Mise à jour des noms et des fonctions de démarrage à partir des données JSON
            this._starterFunction = jsonData.starterfunction;

            // Stocker le contenu des fichiers en mémoire
            this._htmlData = jsonData.html ? this._gameFiles[this._name+'/'+jsonData.html] : null;
            this._cssData = jsonData.css ? this._gameFiles[this._name+'/'+jsonData.css] : null;
            this._jsData = jsonData.mainscript ? this._gameFiles[this._name+'/'+jsonData.mainscript] : null;
            this._serverData = jsonData.server ? this._gameFiles[this._name+'/'+jsonData.server] : null;
            // Gestion de l'icône
            if (jsonData.images && jsonData.images.icon) {
                let iconPath = jsonData.images.icon;
                this._iconData = this._gameFiles[this._name+'/images/'+iconPath] || null;
            } else {
                throw new Error("Icon not referenced in index.json");
            }
        } catch (error) {
            Logger.warning("Cannot load game '" + this._name + "' : " + error.message);
        }
    }
    // Getters pour accéder aux données des fichiers
    get name() {
        return this._name;
    }
    get starterFunction() {
        return this._starterFunction;
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