var Assertions = require('unit-test').Assertions;

const { URLGenerator }             = require("../../server_modules/url_generator/main");

module.exports = {
    'test-genURL': function() {
        let url = URLGenerator.genURL('game', "test");
        Assertions.assert(url.length === 16 + 6 + "test".length, "testing url length");
        Assertions.assert(url.includes("game/test-"), "testing url content");
    }
}