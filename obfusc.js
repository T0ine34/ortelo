const { globSync } = require("glob");
const JavaScriptObfuscator = require('javascript-obfuscator');


try {
    const files = globSync("public/common/**/*.js");

    files.forEach(function(jsFilePath) {
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