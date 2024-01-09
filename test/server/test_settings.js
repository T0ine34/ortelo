var Assertions = require('unit-test').Assertions;

const { Settings }                                                = require('../../server_modules/settings/main');


module.exports = {
    'test-loading': function() {
        let settings = null;
        try{
            settings = new Settings("./test/server/base_test_settings.json", false);
        }catch(e){
            Assertions.AssertionError("Error while loading settings : " + e);
        }
        Assertions.assert(settings instanceof Settings);
    },

    'test-saving': function() {
        let settings = new Settings("./test/server/base_test_settings.json", false);
        settings.save("./test/server/test_settings.json");
        const fs = require('fs');
        Assertions.assert(fs.existsSync("./test/server/test_settings.json"));
    },

    'test-getting': function() {
        let settings = new Settings("./test/server/base_test_settings.json", false);
        Assertions.assert(settings.get("port") == 3000);
        Assertions.assert(settings.get("main_room_name") == "general");
        Assertions.assert(settings.get("allow_chat_commands") == true);
        Assertions.assert(settings.get("database.path") == "./database/serverDatabase.db");
        Assertions.assert(settings.get("public_common_dir") == "public/common");
    },

    'test-getting-unknown': function() {
        let settings = new Settings("./test/server/base_test_settings.json", false);
        Assertions.assert(settings.get("test_item") == undefined);
    },

    'test-setting': function() {
        let settings = new Settings("./test/server/test_settings.json", false);
        settings.set("port", 3001);
        settings.set("main_room_name", "test_room");
        settings.set("allow_chat_commands", false);
        settings.set("database.path", "./database/testDatabase.db");
        settings.set("private_common_dir", "%public_common_dir%");
        Assertions.assert(settings.get("port") == 3001);
        Assertions.assert(settings.get("main_room_name") == "test_room");
        Assertions.assert(settings.get("allow_chat_commands") == false);
        Assertions.assert(settings.get("database.path") == "./database/testDatabase.db");
        Assertions.assert(settings.get("public_common_dir") == "public/common");
    },

    'test-delete': function() {
        let settings = new Settings("./test/server/test_settings.json", false);
        settings.delete("port");
        settings.delete("main_room_name");
        settings.delete("allow_chat_commands");
        settings.delete("database.path");
        settings.delete("public_common_dir");
        Assertions.assert(settings.get("port") == undefined);
        Assertions.assert(settings.get("main_room_name") == undefined);
        Assertions.assert(settings.get("allow_chat_commands") == undefined);
        Assertions.assert(settings.get("database.path") == undefined);
        Assertions.assert(settings.get("public_common_dir") == undefined);
    },

    'test-has': function() {
        let settings = new Settings("./test/server/base_test_settings.json", false);
        Assertions.assertEquals(settings.has("port"), true);
        Assertions.assertEquals(settings.has("main_room_name"), true);
        // Assertions.assertEquals(settings.has("allow_chat_commands"), true);
        // Assertions.assertEquals(settings.has("database.path"), true);
        // Assertions.assertEquals(settings.has("test_item"), false);
    }
}