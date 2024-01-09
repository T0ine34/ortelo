var UnitTest = require('unit-test'),
    TestSuite = UnitTest.Suite,
    Assertions = UnitTest.Assertions;

    TestSuite.paths(__dirname+'/server', '*.js');