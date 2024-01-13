var Assertions = require('unit-test').Assertions;

fs = require('fs');

const { Settings } = require('../../server_modules/settings/main');

function reset(){
    if(fs.existsSync("./test/server/data/test_settings.json")){
        fs.unlinkSync("./test/server/data/test_settings.json");
    }
}

function makeCopy(){
    reset();
    if(fs.existsSync("./test/server/data/base_test_settings.json")){
        fs.copyFileSync("./test/server/data/base_test_settings.json", "./test/server/data/test_settings.json");
    }
}

module.exports = {
    'test-loading': function() {
        let settings = null;
        makeCopy();
        try{
            settings = new Settings("./test/server/data/base_test_settings.json", false);
        }catch(e){
            // do nothing, the test will fail because settings is null
        }
        Assertions.assert(settings instanceof Settings, "testing settings class constructor");
        reset();
    },

    'test-saving': function() {
        makeCopy();
        let settings = new Settings("./test/server/data/test_settings.json", false);
        settings.save("./test/server/data/test_settings_cpy.json");
        Assertions.assert(fs.existsSync("./test/server/data/test_settings_cpy.json"), "testing saving of settings");
        fs.unlinkSync("./test/server/data/test_settings_cpy.json");
        reset();
    },

    'test-getting': function() {
        makeCopy();
        let settings = new Settings("./test/server/data/test_settings.json", false);
        Assertions.assert(settings.get("port") == 3000, "testing getting integer from settings");
        Assertions.assert(settings.get("main_room_name") == "general", "testing getting string from settings");
        Assertions.assert(settings.get("allow_chat_commands") == true, "testing getting booloean from settings");
        Assertions.assert(settings.get("database.path") == "./database/serverDatabase.db", "testing getting nested keys from settings");
        Assertions.assert(settings.get("public_common_dir") == "public/common", "testing getting alias value from settings");
        reset();
    },

    'test-getting-unknown': function() {
        makeCopy();
        let settings = new Settings("./test/server/data/test_settings.json", false);
        Assertions.assert(settings.get("test_item") == undefined, "testing getting unavaliable item");
        reset();
    },

    'test-setting': function() {
        makeCopy();
        let settings = new Settings("./test/server/data/test_settings.json", false);
        settings.set("port", 3001);
        settings.set("main_room_name", "test_room");
        settings.set("allow_chat_commands", false);
        settings.set("database.path", "./database/testDatabase.db");
        settings.set("private_common_dir", "%public_common_dir%");
        Assertions.assert(settings.get("port") == 3001, "testing setting integer into settings");
        Assertions.assert(settings.get("main_room_name") == "test_room", "testing setting string into settings");
        Assertions.assert(settings.get("allow_chat_commands") == false, "testing setting boolean into settings");
        Assertions.assert(settings.get("database.path") == "./database/testDatabase.db", "testing setting nested key into settings");
        Assertions.assert(settings.get("public_common_dir") == "public/common", "testing setting alias variables into settings");
        reset();
    },

    'test-delete': function() {
        makeCopy();
        let settings = new Settings("./test/server/data/test_settings.json", false);
        settings.delete("port");
        settings.delete("main_room_name");
        settings.delete("allow_chat_commands");
        settings.delete("database.path");
        settings.delete("public_common_dir");
        Assertions.assert(settings.get("port") == undefined, "testing deletion of integer");
        Assertions.assert(settings.get("main_room_name") == undefined, "testing deletion of string");
        Assertions.assert(settings.get("allow_chat_commands") == undefined, "testing deletion of boolean");
        Assertions.assert(settings.get("database.path") == undefined, "testing deletion of nested key");
        Assertions.assert(settings.get("public_common_dir") == undefined, "testing deletion of alias values");
        reset();
    },

    'test-has': function() {
        makeCopy();
        let settings = new Settings("./test/server/data/test_settings.json", false);
        Assertions.assertEquals(settings.has("port"), true, "testing the 'has' method on integer");
        Assertions.assertEquals(settings.has("main_room_name"), true, "testing the 'has' method on string");
        Assertions.assertEquals(settings.has("allow_chat_commands"), true, "testing the 'has' method on boolean");
        Assertions.assertEquals(settings.has("database.path"), true, "testing the 'has' method on nested keys");
        Assertions.assertEquals(settings.has("test_item"), false, "testing the 'has' method on unavailable item");
        reset();
    },
}