"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var assert = require("assert");
var index_1 = require("../../../src/index");
describe("github issues > #798 sqlite: 'database' path in ormconfig.json is not relative", function () {
    var connection;
    var oldCwd = process.cwd();
    before(function () {
        process.chdir("..");
    });
    after(function () {
        process.chdir(oldCwd);
    });
    afterEach(function () {
        if (connection && connection.isConnected) {
            connection.close();
        }
    });
    it("should find the sqlite database if the cwd is changed", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var options;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, index_1.getConnectionOptions("sqlite")];
                    case 1:
                        options = _a.sent();
                        return [4 /*yield*/, index_1.createConnection(options)];
                    case 2:
                        connection = _a.sent();
                        assert.strictEqual(connection.isConnected, true);
                        return [2 /*return*/];
                }
            });
        });
    });
});
//# sourceMappingURL=issue-798.js.map