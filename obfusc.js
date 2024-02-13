const JavaScriptObfuscator = require('javascript-obfuscator');
const fs= require('fs');
const path = require('path');
/**
 * Obfuscates JavaScript files located in the specified directory.
 *
 * @return {void}
 *
 * @throws {Error} If an error occurs while manipulating files.
 */
const args = process.argv.slice(2);
const command = args[0];

const root = 'public/common';
const filtre = new RegExp('.*\\.js');
function find_all_files(root_path, filtre) {
    let results = [];

    if (!fs.existsSync(root_path)) {
        console.log("no dir ", root_path);
        return;
    }

    const files = fs.readdirSync(root_path);
    for(let i = 0; i < files.length; i++) {
        const filename = path.join(root_path, files[i]);
        const stat = fs.lstatSync(filename);
        if (stat.isDirectory()) {
            results = results.concat(find_all_files(filename, filtre));
        } else if (filtre.test(filename)) {
            if (filename.endsWith(".js")) {
                results.push(filename);
            }
        }
    }
    return results;
}

function obfuscation (command){
    try {
        const args = process.argv.slice(2);
        let files;
        if (command == "public") {
            files = find_all_files(root, filtre);
            console.log(files)
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
        console.error("Erreur lors de la manipulation de fichiers : ", err);
    }
}
obfuscation(command)