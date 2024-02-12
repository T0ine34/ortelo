const { globSync } = require("glob");
const JavaScriptObfuscator = require('javascript-obfuscator');
const fs= require('fs');
/**
 * Obfuscates JavaScript files located in the specified directory.
 *
 * @return {void}
 *
 * @throws {Error} If an error occurs while executing globSync or manipulating files.
 */
const args = process.argv.slice(2);
const command = args[0];
function obfuscation (command){
    try {
        let files;
        if (command == "public") {
            const path = "public/common/**/*.js"
            files = globSync([path]);
        } else if (command == "game") {
            const file = args[1];
            files = [file]
        } else {
            return
        }

        files.forEach(function (jsFilePath) {
            const data = fs.readFileSync(jsFilePath, 'UTF-8');

            const obfuscationResult = JavaScriptObfuscator.obfuscate(data, {
                compact: true,
                controlFlowFlattening: true
            });

            fs.writeFileSync(jsFilePath, obfuscationResult.getObfuscatedCode());
            console.log("Fichier obfusqué avec succès :", jsFilePath);
        });
    } catch (err) {
        console.error("Erreur lors de l'exécution de globSync ou de la manipulation de fichiers : ", err);
    }
}
obfuscation(command)