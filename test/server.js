var TestSuite = require('unit-test').Suite;

TestSuite.paths(__dirname+'/server', ['*.js'], function(result) {
    console.log('===============================');
    console.log('=== Processed ' + result.tests + ' tests, ' + result.errors + ' failed');
    console.log('=== in ' + result.duration + 'ms');
    console.log('===============================');
    console.log('=== ' + (result.errors > 0 ? 'ERROR' : 'SUCCESSFUL'));
    console.log('===============================');
    if(result.errors > 0){
        process.exit(1);
    }
});