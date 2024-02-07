# var TestSuite = require('unit-test').Suite;

# TestSuite.paths(__dirname+'/client', ['*.js'], function(result) {
#     console.log('===============================');
#     console.log('=== Processed ' + result.tests + ' tests, ' + result.errors + ' failed');
#     console.log('=== in ' + result.duration + 'ms');
#     console.log('===============================');
#     console.log('=== ' + (result.errors > 0 ? 'ERROR' : 'SUCCESSFUL'));
#     console.log('===============================');
#     if(result.errors > 0){
#         process.exit(1);
#     }
# });

import sys, os

for script in os.listdir("test/client"):
    if script.startswith("test-") and script.endswith(".py"):
        print("Running", script)
        result = os.system(sys.executable + " test/client/" + script)
        if result != 0:
            print("Test failed")
            exit(1)
        print("Test passed")
exit(0)