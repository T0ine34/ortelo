var Assertions = require('unit-test').Assertions;

const { Logger } = require('../../server_modules/logs/main');


function getFileContent(parentPath){
    //return the content of the file contained in the parentPath folder
    let files = fs.readdirSync(parentPath); //get all files in the folder
    let content = "";
    for(let i = 0; i < files.length; i++){
        if(files[i].includes(".log")){
            content = fs.readFileSync(parentPath + "/" + files[i], 'utf8');
        }
    }
    return content;
}

function clearFolder(){
    if(fs.existsSync("./test/server/logs")){
        for( let file of fs.readdirSync("./test/server/logs") ){
            fs.unlinkSync("./test/server/logs/" + file);
        }
        fs.rmSync("./test/server/logs", { recursive: true });
    }
}

module.exports = {
    'test-constructor': function() {
        let logger = new Logger("./test/server/logs");
        Assertions.assert(logger instanceof Logger, "testing logger class constructor");
        clearFolder();
        logger.close();
    },

    'test-info': function() {
        let logger = new Logger("./test/server/logs");
        logger.info("test");
        Assertions.assert(getFileContent("./test/server/logs").includes("[INFO] test"), "testing info log");
        clearFolder();
        logger.close();
    },

    'test-fine': function() {
        let logger = new Logger("./test/server/logs");
        logger.fine("test");
        Assertions.assert(getFileContent("./test/server/logs").includes("[FINE] test"), "testing fine log");
        clearFolder();
        logger.close();
    },

    'test-warning': function() {
        let logger = new Logger("./test/server/logs");
        logger.warning("test");
        Assertions.assert(getFileContent("./test/server/logs").includes("[WARNING] test"), "testing warning log");
        clearFolder();
        logger.close();
    },

    'test-error': function() {
        let logger = new Logger("./test/server/logs");
        logger.error("test");
        Assertions.assert(getFileContent("./test/server/logs").includes("[ERROR] test"), "testing error log");
        clearFolder();
        logger.close();
    },

    'test-debug': function() {
        let logger = new Logger("./test/server/logs");
        logger.debug("test");
        Assertions.assert(getFileContent("./test/server/logs").includes("[DEBUG] test"), "testing debug log");
        clearFolder();
        logger.close();
    }
};