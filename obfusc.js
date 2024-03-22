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



/**
 * searches for JavaScript files in a directory.
 * @param {string} root_path - The starting directory path.
 * @param {RegExp} filtre - A regular expression to match file names.
 * @returns {Array} An array of file paths that match the criteria.
 */
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
            //recursively search
            results = results.concat(find_all_files(filename, filtre));
        } else if (filtre.test(filename)) {
            if (filename.endsWith(".js")) {
                results.push(filename);
            }
        }
    }
    return results;
}

/**
 * obfuscates the targeted JavaScript files.
 * It aims to protect the source code logic and structure from being easily understood and tampered with.
 * @param {string} command - The operation mode determining which files to obfuscate.
 */
function obfuscation (command){
    // command permit two mod to obfuscate, obfusc public before assembling games
    // another time we obfusc file per file when assembling file per file the game
    try {
        const args = process.argv.slice(2);
        let files;
        if (command == "public") {
            files = find_all_files(root, filtre);
        } else if (command == "game") {
            const file = args[1];
            console.log(file)
            files = [file]
        } else {
            return
        }

        files.forEach(function (jsFilePath) {
            try {
                const data = fs.readFileSync(jsFilePath, 'UTF-8');

                const obfuscationResult = JavaScriptObfuscator.obfuscate(data, {
                    compact: true,
                    controlFlowFlattening: true
                });
                process.stdout.write("Obfusc : ", jsFilePath, '\r');
                fs.writeFileSync(jsFilePath, obfuscationResult.getObfuscatedCode());
            }catch (err) {
                console.log("Error file : ", err)
            }
        });
    } catch (err) {
        console.error("Error manipulating files : ", err);
    }
}

obfuscation(command)