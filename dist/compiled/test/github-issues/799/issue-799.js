"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var assert = require("assert");
var index_1 = require("../../../src/index");
var rimraf = require("rimraf");
var path_1 = require("path");
describe("github issues > #799 sqlite: 'database' path should be created", function () {
    var connection;
    var path = __dirname + "/tmp/sqlitedb.db";
    var cleanup = function (done) {
        rimraf(path_1.dirname(path), function () {
            return done();
        });
    };
    before(cleanup);
    after(cleanup);
    afterEach(function () {
        if (connection && connection.isConnected) {
            connection.close();
        }
    });
    it("should create the whole path to database file", function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, index_1.createConnection({
                            "name": "sqlite",
                            "type": "sqlite",
                            "database": path
                        })];
                    case 1:
                        connection = _a.sent();
                        assert.strictEqual(connection.isConnected, true);
                        return [2 /*return*/];
                }
            });
        });
    });
});
//# sourceMappingURL=issue-799.js.map