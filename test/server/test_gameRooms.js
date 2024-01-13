var Assertions = require('unit-test').Assertions;

const { GameRooms }             = require("../../server_modules/gameRooms/main");

module.exports = {
    'test-genURL': function() {
        let url = GameRooms.genURL("test");
        Assertions.assert(url.length === 16 + 6 + "test".length, "testing url length");
        Assertions.assert(url.includes("game/test-"), "testing url content");
    }
}