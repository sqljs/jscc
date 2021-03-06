suite("util", function() {
    var path = require('path');
    if (typeof requirejs === 'undefined') {
        requirejs = require('requirejs');
        requirejs.config({
                             baseUrl: path.join(__dirname, '../../lib/jscc'),
                             nodeRequire: require,
                             packages: [
                                 {
                                     name: "squirejs",
                                     location: "../../node_modules/squirejs",
                                     main: "src/Squire"
                                 }
                             ],
                             paths: {
                                 "jscc": "main",
                                 "sinon": "../../node_modules/sinon/pkg/sinon",
                                 "text": "../../node_modules/requirejs-text/text",
                                 "has": "../../volo/has"
                             },
                             map: {
                                 "*": {
                                     "io/io": "io/ioNode",
                                     "log/log": "log/logNode",
                                     "bitset": "bitset/BitSet32"
                                 }
                             }
                         });
    }

    var sinon = requirejs('sinon');
    var chai = requirejs('chai');
    var Squire = requirejs('squirejs');

    sinon.assert.expose(chai.assert, { prefix: "" });
    var assert = chai.assert;
    var injector = new Squire();

    var sandbox;
    setup("setup", function() {
        injector.configure();
        sandbox = sinon.sandbox.create();
        var logStub = sandbox.stub({
                                       fatal: function(msg) {
                                       },
                                       error: function(msg) {
                                       },
                                       warn: function(msg) {
                                       },
                                       info: function(msg) {
                                       },
                                       debug: function(msg) {
                                       },
                                       trace: function(msg) {
                                       },
                                       setLevel: function(level) {
                                       }
                                   });
        var ioStub = sandbox.stub({
                                      read_all_input: function(options) {
                                      },
                                      read_template: function(options) {
                                      },
                                      write_output: function(options) {
                                      }
                                  });
        injector.mock("log/log", logStub);
        injector.mock("log/logNode", logStub);
        injector.mock("io/io", ioStub);
        injector.mock("io/ioNode", ioStub);
    });

    teardown("teardown", function() {
        injector.remove();
        sandbox.restore();
    });

    [
        { dest: [1, 5, 8], src: [2, 5], result: [1, 2, 5, 8] },
        { dest: [1, 2, 3], src: [], result: [1, 2, 3] },
        { dest: [], src: [1, 2, 3], result: [1, 2, 3] },
        { dest: [0, 1, 2, 3], src: [0.5, 1.5, 2.5, 3.5], result: [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5] }
    ].forEach(function(item) {
        test("Union of dest_array [" + item.dest.join(", ") + "] and src_array [" + item.src.join(", ") +
             "] produces result [" + item.result.join(", ") + "] in any order",
             injector.run(["mocks", "util"], function(mocks, util) {
                 var result = util.union(item.dest, item.src);
                 assert.sameMembers(result, item.result);
             }));
    });

    test("Union does not affect its src_array parameter", injector.run(["mocks", "util"], function(mocks, util) {
        var src = [1, 2, 3];
        var dest = [4, 5, 6];
        var result = util.union(dest, src);
        assert.deepEqual(src, [1, 2, 3]);
    }));

    test("Union modifies dest_array and returns it as the result",
         injector.run(["mocks", "util"], function(mocks, util) {
             var src = [1, 2, 3];
             var dest = [4, 5, 6];
             var result = util.union(dest, src);
             assert.deepEqual(dest, result);
             assert.sameMembers(dest, [1, 2, 3, 4, 5, 6]);
         }));
});