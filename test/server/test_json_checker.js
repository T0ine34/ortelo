var Assertions = require('unit-test').Assertions;

const { is_json, is_json_matching } = require('../../server_modules/json_checker/main');

module.exports = {
    'test-is_json': function() {
        Assertions.assert(is_json("./test/server/data/base_test_settings.json"), "testing is_json with a valid json");
        Assertions.assert(!is_json("./test/server/data/invalid_json_file.json"), "testing is_json with an invalid json");
    },

    'test-is_json_matching': function() {
        Assertions.assert(is_json_matching("./test/server/data/base_test_settings.json", "./test/server/data/base_test_settings.json.structure"), "testing is_json_matching with two identical json");
        let [result, reason] = is_json_matching("./test/server/data/unmatching_json.json", "./test/server/data/base_test_settings.json.structure");
        Assertions.assert(!result, "testing is_json_matching with an unmatched json and structure");
    }
};