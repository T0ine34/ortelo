const fs = require('fs');
const path = require('path');

/**
 * @description this class represent a game, loaded from a zip file
 * @author Lila Brandon
 * @memberof module:Loader
 */
class Game {
    /**
     * @constructor
     * @param {string} gamePath the path to the zip file
     * @description this constructor create a game object, but you need to call the init method to load the game
     * @author Lila Brandon
     */
    constructor(gamePath) {
        this._gamePath = gamePath;
        this._name = null;
        this._iconPath = null;
        this._htmlPath = null;
        this._cssPath = null;
        this._jsPath = null;
        this._serverPath = null;
    }
    /**
     * @description this method load the game from the zip file, allowing to read game data
     * @author Lila Brandon
     */

    async init() {
        try {
            const jsonData = JSON.parse(fs.readFileSync(path.join(this._gamePath, "index.json"), 'utf8'));

            this._name = jsonData.name || "Nom inconnu";
            this._htmlPath = path.join(this._gamePath, jsonData.html);
            this._cssPath = path.join(this._gamePath, jsonData.css);
            this._jsPath = path.join(this._gamePath, jsonData.mainscript);
            this._serverPath = path.join(this._gamePath, jsonData.server);

            // Modification ici pour inclure le sous-dossier 'images'
            let iconPath = path.join(this._gamePath, 'images', jsonData.images.icon);
            if (fs.existsSync(iconPath)) {
                this._iconPath = iconPath;
            } else {
                throw new Error("Icône introuvable");
            }
        } catch (error) {
            console.error("Erreur lors de l'initialisation du jeu:", error);
        }
    }
    /**
     * @description access to the icon of the game as a base64 string
     * @returns {string} the icon of the game
     * @readonly
     * @author Lila Brandon
     */
    /**
     * @description access to the name of the game
     * @returns {string} the name of the game
     * @readonly
     * @author Lila Brandon
     */

    // Getters
    get name() {
        return this._name;
    }

    get iconPath() {
        return this._iconPath;
    }

    get htmlPath() {
        return this._htmlPath;
    }

    get cssPath() {
        return this._cssPath;
    }

    get jsPath() {
        return this._jsPath;
    }

    get serverPath() {
        return this._serverPath;
    }
}

module.exports = { Game };